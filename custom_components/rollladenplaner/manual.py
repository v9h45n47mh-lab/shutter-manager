"""Permission-aware manual dashboard configuration and one-time movement adapter."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta, timezone
import math
import re
from uuid import uuid4

from homeassistant.auth.permissions.const import POLICY_CONTROL, POLICY_READ
from homeassistant.components.cover import CoverEntityFeature

from .engine import is_blind
from .family_access import allows, require

DOMAIN = 'rollladenplaner'
DEFAULTS = {'selected': [], 'mode': 'presets', 'height_values': [0, 25, 50, 100],
            'tilt_values': [0, 50, 100], 'columns': 'auto'}


def card_key(value):
    if not isinstance(value, str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,80}', value):
        raise ValueError('Die Karten-ID darf nur Buchstaben, Zahlen, _ und - enthalten (1–80 Zeichen).')
    return value


def preset_values(values):
    if not isinstance(values, list) or not 1 <= len(values) <= 4:
        raise ValueError('Je Auswahl sind ein bis vier Werte erforderlich.')
    if any(type(value) is not int or not 0 <= value <= 100 for value in values) or len(set(values)) != len(values):
        raise ValueError('Bitte unterschiedliche ganze Werte von 0 bis 100 wählen.')
    return list(values)


def is_admin(user):
    return bool(getattr(user, 'is_admin', False))


def can_control(manager, user):
    return allows(manager.hass, user, DOMAIN, 'control', True) or allows(manager.hass, user, DOMAIN, 'manage', is_admin(user))


def snapshot(manager, user, key, now):
    require(manager.hass, user, DOMAIN, 'view', True)
    key = card_key(key)
    record = manager.manual_cards.get(key, {})
    settings = deepcopy(record.get('settings', DEFAULTS))
    visible = []
    control = can_control(manager, user)
    for window in manager.engine.config['windows']:
        if not manager.permitted(user, window['cover'], POLICY_READ):
            continue
        state = manager.hass.states.get(window['cover'])
        attrs = dict(state.attributes) if state else {}
        visible.append({'id': window['id'], 'name': window['name'], 'cover': window['cover'],
                        'blind': is_blind(window, attrs), 'enabled': window['enabled'],
                        'state': state.state if state else 'unavailable',
                        'features': int(attrs.get('supported_features', 0)),
                        'position': attrs.get('current_position'), 'tilt': attrs.get('current_tilt_position'),
                        'can_control': control and manager.permitted(user, window['cover'], POLICY_CONTROL)})
    visible_ids = {window['id'] for window in visible}
    settings['selected'] = [wid for wid in settings['selected'] if wid in visible_ids]
    return {'backend_version': manager.version, 'now': now.isoformat(), 'time_zone': manager.hass.config.time_zone,
            'card_id': key, 'card_revision': record.get('revision', 0), 'configured': bool(record),
            'can_configure': is_admin(user), 'settings': settings, 'available': visible}


async def save(manager, user, message):
    require(manager.hass, user, DOMAIN, 'view', True)
    # Card setup is deliberately narrower than the application's manage grant.
    if not is_admin(user):
        raise PermissionError('Die Karteneinstellungen sind nur für HA-Administratoren verfügbar.')
    key = card_key(message['card_id'])
    proposed = message['settings']
    if not isinstance(proposed, dict) or set(proposed) != set(DEFAULTS):
        raise ValueError('Ungültige Karteneinstellungen.')
    selected = proposed['selected']
    if not isinstance(selected, list) or any(not isinstance(wid, str) for wid in selected) or len(set(selected)) != len(selected):
        raise ValueError('Bitte eine gültige Geräteauswahl treffen.')
    if proposed['mode'] not in ('presets', 'sliders') or proposed['columns'] not in ('auto', '1', '2', '3'):
        raise ValueError('Bitte eine gültige Darstellung wählen.')
    checked = {'selected': list(selected), 'mode': proposed['mode'], 'columns': proposed['columns'],
               'height_values': preset_values(proposed['height_values']), 'tilt_values': preset_values(proposed['tilt_values'])}
    async with manager.lock:
        record = manager.manual_cards.get(key, {})
        if message['card_revision'] != record.get('revision', 0):
            raise ValueError('Die Karteneinstellungen wurden geändert. Bitte neu laden.')
        windows = manager.engine.windows()
        if any(wid not in windows or not manager.permitted(user, windows[wid]['cover'], POLICY_CONTROL) for wid in selected):
            raise PermissionError('Keine Geräteberechtigung für diese Auswahl.')
        manager.manual_cards[key] = {'revision': record.get('revision', 0) + 1, 'settings': checked}
        await manager.persist()


def percentage(value, *, optional=False):
    if value is None and optional:
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= 100:
        raise ValueError('Positionen müssen zwischen 0 und 100 liegen.')
    return value


def scheduled_time(message, now, engine):
    if message.get('mode') == 'timer':
        minutes = message.get('minutes')
        if type(minutes) is not int or not 1 <= minutes <= 1440:
            raise ValueError('Bitte eine Wartezeit von 1 bis 1440 Minuten wählen.')
        return now + timedelta(minutes=minutes)
    if message.get('mode') == 'clock':
        # Use the production resolver, including its nonexistent-DST-time check.
        return engine.future_clock(now.astimezone(engine.zone).date(), message.get('time'), now)
    raise ValueError('Bitte Timer oder Uhrzeit auswählen.')


async def replace_immediate(manager, window, now):
    """Check interlocks before replacing a current goal; preserve future timers."""
    target = window['id']
    _, reason = manager.engine.guard(window, {'kind':'time'}, manager.states(), {target:False})
    if reason:
        raise ValueError(reason)
    if any(item['target'] == target and not item.get('manual_immediate') and datetime.fromisoformat(item['scheduled']) <= now and item.get('status') != 'error'
           for item in manager.engine.rt['one_time']):
        raise ValueError('Für diesen Rollladen wird bereits eine Einzelfahrt ausgeführt.')
    if manager.moving.get(target):
        try:
            await manager.stop(target, raise_errors=True)
        except Exception as error:
            raise ValueError('Vorherige Fahrt konnte nicht gestoppt werden: ' + str(error)) from error
    for intent in list(manager.engine.rt['pending'].get(target, {}).values()):
        manager.engine.finish(target, intent, now, 'Durch manuellen Fahrbefehl ersetzt')
    manager.engine.rt['one_time'] = [item for item in manager.engine.rt['one_time']
        if not (item['target'] == target and item.get('manual_immediate'))]


async def action(manager, user, message, now):
    require(manager.hass, user, DOMAIN, 'view', True)
    if not can_control(manager, user):
        raise PermissionError('Keine Berechtigung zum Steuern.')
    key = card_key(message['card_id'])
    operation = message['action']
    if operation not in ('up', 'down', 'stop', 'position', 'plan'):
        raise ValueError('Unbekannter Fahrbefehl.')
    async with manager.lock:
        settings = manager.manual_cards.get(key, {}).get('settings', DEFAULTS)
        window = manager.engine.windows().get(message['target'])
        if not window or window['id'] not in settings['selected']:
            raise PermissionError('Dieser Rollladen ist in der Karte nicht ausgewählt.')
        if any(not manager.permitted(user, window['cover'], policy) for policy in (POLICY_READ, POLICY_CONTROL)):
            raise PermissionError('Keine HA-Bedienberechtigung für diesen Rollladen.')
        state = manager.hass.states.get(window['cover'])
        if not state or state.state in ('unknown', 'unavailable', ''):
            raise ValueError('Der Rollladen ist nicht verfügbar.')
        features = int(state.attributes.get('supported_features', 0))
        target = window['id']
        if operation == 'stop':
            if not features & CoverEntityFeature.STOP:
                raise ValueError('Diese Entität unterstützt Stopp nicht.')
            motion = manager.moving.get(target)
            intents = list(manager.engine.rt['pending'].get(target, {}).values())
            if motion and all(intent['id'] != motion['intent']['id'] for intent in intents):
                intents.append(deepcopy(motion['intent']))
            try:
                if motion:
                    await manager.stop(target, raise_errors=True)
                else:
                    await manager.command(window, 'stop_cover')
            except Exception as error:
                failed = {'id':'manual_stop_' + uuid4().hex, 'program':'__manual__', 'kind':'manual',
                          'name':'Stopp', 'position':None, 'tilt':None}
                manager.engine.finish(target, failed, now, 'Stopp fehlgeschlagen: ' + str(error))
                await manager.persist()
                raise ValueError('Stopp fehlgeschlagen: ' + str(error)) from error
            for intent in intents:
                manager.engine.finish(target, intent, now, 'Manuell gestoppt')
            for item in manager.engine.rt['one_time']:
                if item['target'] == target and datetime.fromisoformat(item['scheduled']) <= now and item.get('status') != 'error':
                    item.update(status='error', reason='Manuell gestoppt')
            manager.revision += 1
            await manager.persist()
            return 'Gestoppt.'
        if not window['enabled']:
            raise ValueError('Der Rollladen ist deaktiviert.')
        # Native directions work with device-specific percentage conventions.
        # Their service acknowledgement is not a confirmed positional result.
        direction_feature = CoverEntityFeature.OPEN if operation == 'up' else CoverEntityFeature.CLOSE if operation == 'down' else 0
        if direction_feature and features & direction_feature:
            await replace_immediate(manager, window, now)
            manager.revision += 1
            await manager.persist()
            service = 'open_cover' if operation == 'up' else 'close_cover'
            try:
                await manager.command(window, service)
            except Exception as error:
                failed = {'id':'manual_direction_' + uuid4().hex, 'program':'__manual__', 'kind':'manual',
                          'name':service, 'position':None, 'tilt':None}
                manager.engine.finish(target, failed, now, 'Fahrbefehl fehlgeschlagen: ' + str(error))
                await manager.persist()
                raise ValueError('Fahrbefehl fehlgeschlagen: ' + str(error)) from error
            manager.engine.log(now, 'command', window['name'] + ': ' + service + ' übergeben', window=target)
            await manager.persist()
            return 'Fahrbefehl übergeben.'
        position = 100 if operation == 'up' else 0 if operation == 'down' else percentage(message.get('position'), optional=True)
        tilt = percentage(message.get('tilt'), optional=True) if operation in ('position', 'plan') else None
        if position is None and tilt is None:
            raise ValueError('Bitte mindestens eine Zielposition auswählen.')
        if position is not None and not features & CoverEntityFeature.SET_POSITION:
            raise ValueError('Diese Entität unterstützt keine Positionsfahrt.')
        if tilt is not None and (not is_blind(window, dict(state.attributes)) or not features & CoverEntityFeature.SET_TILT_POSITION):
            raise ValueError('Lamellen sind nur für unterstützte Jalousien verfügbar.')
        scheduled = scheduled_time(message, now, manager.engine) if operation == 'plan' else now
        if operation == 'plan' and any(item['target'] == target and item.get('status') != 'error' for item in manager.engine.rt['one_time']):
            raise ValueError('Für diesen Rollladen ist bereits eine Einzelfahrt vorgemerkt.')
        if operation != 'plan':
            await replace_immediate(manager, window, now)
        item = {'id': 'once_' + uuid4().hex, 'target': target, 'created': now.isoformat(),
                'scheduled': scheduled.astimezone(timezone.utc).isoformat(), 'position': position, 'tilt': tilt,
                'status': 'planned', 'reason': '', 'manual_immediate': operation != 'plan'}
        manager.engine.rt['one_time'].append(item)
        manager.revision += 1
        await manager.persist()
        await manager._pulse_locked()
        if item.get('status') == 'error':
            raise ValueError(item['reason'])
        if operation == 'plan':
            return 'Einzelfahrt eingeplant.'
        if item.get('reason'):
            return item['reason']
        return 'Fahrbefehl übergeben.'
