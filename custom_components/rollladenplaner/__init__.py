"""Shutter Manager: schedules, sensor guards and dashboard editing."""
from __future__ import annotations

import asyncio
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import logging
from pathlib import Path
from uuid import uuid4

import probatio as vol
from homeassistant.auth.permissions.const import POLICY_CONTROL, POLICY_READ
from homeassistant.components import frontend, websocket_api
from homeassistant.components.cover import CoverEntityFeature
from homeassistant.components.http import StaticPathConfig
from homeassistant.const import Platform
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_call_later, async_track_time_interval
from homeassistant.helpers.storage import Store
from homeassistant.helpers.service import async_register_admin_service
from homeassistant.helpers.sun import get_astral_event_date

from .engine import Engine, TRAVEL_TIMEOUT_SECONDS, is_blind, validate_config

DOMAIN = 'rollladenplaner'
INTEGRATION_VERSION = '1.5.3'
TILT_TO_HEIGHT_DELAY_SECONDS = 1.5
# CONFIG_SCHEMA is reserved by HA for YAML validation; this is our WS protocol.
CONFIG_SCHEMA_VERSION = 7
SIGNAL = DOMAIN + '_update'
PLATFORMS = [Platform.SENSOR]
_LOGGER = logging.getLogger(__name__)


def utcnow():
    return datetime.now(timezone.utc)


async def async_setup(hass, config):
    card_path = str(Path(__file__).parent / 'frontend' / 'shutter-manager-card.js')
    ui_path = str(Path(__file__).parent / 'frontend' / 'family-ui')
    await hass.http.async_register_static_paths([
        StaticPathConfig('/rollladenplaner/rollladenplaner-card.js', card_path, False),
        StaticPathConfig('/shutter-manager/shutter-manager-card.js', card_path, False),
        StaticPathConfig('/rollladenplaner/family-ui', ui_path, False),
        StaticPathConfig('/shutter-manager/family-ui', ui_path, False),
    ])
    # Keep the old resource URL working for existing dashboards while publishing the new name.
    frontend.add_extra_js_url(hass, '/rollladenplaner/rollladenplaner-card.js?v=1.5.3')
    frontend.add_extra_js_url(hass, '/shutter-manager/shutter-manager-card.js?v=1.5.3')
    async def set_vacation(call):
        m = manager(hass)
        admin = type('Automation', (), {'is_admin': True})()
        await m.action(admin, {'action': 'vacation', 'value': call.data['enabled'], 'revision': m.revision})

    async_register_admin_service(hass, DOMAIN, 'set_vacation', set_vacation,
                                 vol.Schema({vol.Required('enabled'): bool}))
    for command in (ws_get, ws_save, ws_action):
        websocket_api.async_register_command(hass, command)
    return True


async def async_setup_entry(hass, entry):
    if entry.title in ('Rollladenplaner', 'Blind Planner', 'Beschattungsmanager'):
        hass.config_entries.async_update_entry(entry, title='Shutter Manager')
    manager = Manager(hass)
    await manager.load()
    hass.data[DOMAIN] = manager
    entry.runtime_data = manager
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    manager.unsub = async_track_time_interval(hass, manager.pulse, timedelta(seconds=5))
    await manager.pulse()
    return True


async def async_unload_entry(hass, entry):
    manager = entry.runtime_data
    if await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        manager.unsub()
        async with manager.lock:
            for wid in list(manager.moving):
                await manager.stop(wid)
            await manager.persist()
        hass.data.pop(DOMAIN, None)
        return True
    return False


class Manager:
    def __init__(self, hass):
        self.hass = hass
        self.store = Store(hass, 1, DOMAIN)
        self.lock = asyncio.Lock()
        self.engine = Engine(tz=hass.config.time_zone)
        self.engine.config['enabled'] = True
        self.revision = 0
        self.moving = {}
        self.unsub = lambda: None
        self._saved = None
        self.migration_backup = None
        self._reported_errors = set()

    @staticmethod
    def individual_controls(config):
        """Remove the legacy master gate while preserving an existing pause."""
        config = deepcopy(config)
        legacy = any(w.get('climate') and 'auto_shade' not in w['climate'] for w in config.get('windows', []))
        validate_config(config)  # Keep legacy ride IDs until Engine migrates runtime.
        if not config.get('enabled', False) or legacy:
            for program in config.get('programs', []):
                program['enabled'] = False
            for window in config.get('windows', []):
                if window.get('climate'):
                    window['climate']['auto_shade'] = False
        config['enabled'] = True
        return config

    async def load(self):
        data = await self.store.async_load()
        if data:
            config = self.individual_controls(data['config'])
            self.engine = Engine(config, data.get('runtime'), self.hass.config.time_zone)
            self.migration_backup = deepcopy(data.get('migration_backup'))
            if self.migration_backup is None and data['config'].get('model_version', 1) < 2:
                # Retain the original configuration and runtime before the 1.3 migration.
                self.migration_backup = {'version': 'before_1.3.0', 'config': deepcopy(data['config']),
                                         'runtime': deepcopy(data.get('runtime', {}))}
            self.engine.rearm_future_time_occurrences(utcnow(), self.solar)
            # Sensor transitions are initialized against current readings after restart.
            self.engine.rt['edges'] = {}
            self.engine.rt['opening_edges'] = {}
            self.revision = data.get('revision', 0)

    def states(self):
        return {s.entity_id: {'state': s.state, 'attributes': dict(s.attributes)} for s in self.hass.states.async_all()}

    def solar(self, event, day):
        return get_astral_event_date(self.hass, event, day)

    async def persist(self):
        data = {'config': self.engine.config, 'runtime': self.engine.rt, 'revision': self.revision}
        if self.migration_backup is not None:
            data['migration_backup'] = self.migration_backup
        if data != self._saved:
            await self.store.async_save(data)
            self._saved = deepcopy(data)

    async def command(self, window, service, **data):
        async with asyncio.timeout(15):
            await self.hass.services.async_call('cover', service, {'entity_id': window['cover'], **data}, blocking=True)

    async def stop(self, wid):
        moving = self.moving.pop(wid, None)
        if not moving:
            return
        if cancel_wait := moving.pop('cancel_wait', None):
            cancel_wait()
        w = self.engine.windows().get(wid)
        if not w:
            w = moving['window']
        state = self.hass.states.get(w['cover'])
        if state and int(state.attributes.get('supported_features', 0)) & CoverEntityFeature.STOP:
            try:
                await self.command(w, 'stop_cover')
            except Exception as err:
                _LOGGER.warning('Stop für %s fehlgeschlagen: %s', w['cover'], err)

    @staticmethod
    def reached(state, value, attr):
        current = state.get('attributes', {}).get(attr)
        try:
            return abs(float(current) - value) <= 2
        except (TypeError, ValueError):
            return False

    async def advance(self, wid, intent, now, states):
        w = self.engine.windows()[wid]
        state = states.get(w['cover'], {})
        features = int(state.get('attributes', {}).get('supported_features', 0))
        needed = ((CoverEntityFeature.SET_POSITION if intent['position'] is not None else 0) |
                  (CoverEntityFeature.SET_TILT_POSITION if intent['tilt'] is not None else 0))
        if features & needed != needed:
            self.engine.finish(wid, intent, now, 'Entität unterstützt die gewählte Höhe/Lamellenposition nicht.')
            return
        motion = self.moving.get(wid)
        if motion is None:
            motion = {'intent': deepcopy(intent), 'phase': 'tilt' if intent['tilt'] is not None else 'height', 'sent': False, 'window': deepcopy(w)}
            self.moving[wid] = motion
        # Recheck device state between phases; blinds tilt before changing height.
        phase = motion['phase']
        if phase == 'height_wait':
            if now < motion['wait_until']:
                return
            if cancel_wait := motion.pop('cancel_wait', None):
                cancel_wait()
            motion.update(phase='height', sent=False)
            phase = 'height'
        attr = 'current_position' if phase == 'height' else 'current_tilt_position'
        value = intent['position'] if phase == 'height' else intent['tilt']
        if value is None or self.reached(state, value, attr):
            if phase == 'tilt' and intent['position'] is not None:
                motion.update(phase='height', sent=False)
                phase = 'height'
                attr = 'current_position'
                value = intent['position']
                if value is None or self.reached(state, value, attr):
                    self.moving.pop(wid, None)
                    self.engine.finish(wid, intent, now)
                    return
            else:
                self.moving.pop(wid, None)
                self.engine.finish(wid, intent, now)
                return
        if motion['sent']:
            if now >= motion['deadline']:
                await self.stop(wid)
                self.engine.finish(wid, intent, now, f'Zeitüberschreitung: Zielwert für {"Höhe" if phase == "height" else "Lamellen"} nicht bestätigt.')
            return
        service = 'set_cover_position' if phase == 'height' else 'set_cover_tilt_position'
        # The occurrence and goal were persisted by the pulse before I/O.
        # After restart a still-current goal may be reissued idempotently.
        motion['sent'] = True
        if phase == 'height':
            motion['deadline'] = now + timedelta(seconds=TRAVEL_TIMEOUT_SECONDS)
        try:
            await self.command(w, service, **({'position': value} if phase == 'height' else {'tilt_position': value}))
            if phase == 'tilt' and intent['position'] is not None:
                motion.update(phase='height_wait', sent=False, wait_until=utcnow() + timedelta(seconds=TILT_TO_HEIGHT_DELAY_SECONDS))
                # Resume independently of the five-second evaluation interval.
                async def resume_height(fired_at):
                    await self.pulse(fired_at, waiting_for=(wid, motion))
                motion['cancel_wait'] = async_call_later(self.hass, TILT_TO_HEIGHT_DELAY_SECONDS, resume_height)
        except Exception as err:  # Integration failures must not stall the other windows.
            _LOGGER.exception('Fahrt für %s fehlgeschlagen', w['cover'])
            await self.stop(wid)
            self.engine.finish(wid, intent, now, f'Befehl fehlgeschlagen: {err}')

    async def _pulse_locked(self):
        now = utcnow()
        states = self.states()
        before = deepcopy(self.engine.config)
        ready = self.engine.tick(now, states, self.solar)
        if self.engine.config != before:  # A once-only skip was consumed.
            self.revision += 1
        await self.persist()  # Claim occurrences before commanding any motor.
        for wid, motion in list(self.moving.items()):
            if wid not in ready or ready[wid]['id'] != motion['intent']['id']:
                await self.stop(wid)
        for wid, intent in ready.items():
            await self.advance(wid, intent, now, states)
        await self.persist()
        errors = {(row['time'], row['message']) for row in self.engine.rt['history'] if row['kind'] == 'error'}
        for _, message in sorted(errors - self._reported_errors):
            _LOGGER.error('%s', message)
        self._reported_errors = errors
        async_dispatcher_send(self.hass, SIGNAL)

    async def pulse(self, _now=None, *, waiting_for=None):
        async with self.lock:
            if waiting_for is not None:
                wid, motion = waiting_for
                # Ignore callbacks for a stopped, replaced or already advanced goal.
                if self.moving.get(wid) is not motion or motion['phase'] != 'height_wait':
                    return
            try:
                await self._pulse_locked()
            except Exception:
                _LOGGER.exception('Shutter Manager: Auswertung fehlgeschlagen')

    def permitted(self, user, entity, policy):
        return user.is_admin or user.permissions.check_entity(entity, policy)

    def snapshot(self, user):
        config = deepcopy(self.engine.config)
        visible = {w['id'] for w in config['windows'] if self.permitted(user, w['cover'], POLICY_READ)}
        config['windows'] = [w for w in config['windows'] if w['id'] in visible]
        for w in config['windows']:
            state = self.hass.states.get(w['cover'])
            w['resolved_type'] = 'blind' if is_blind(w, dict(state.attributes) if state else {}) else 'shutter'
        config['programs'] = [p for p in config['programs'] if all(t in visible for r in p['rides'] for t in r['targets'])]
        config['sensors'] = [entity for entity in config.get('sensors', [])
                             if self.permitted(user, entity, POLICY_READ)]
        sensor_entities = set(config['sensors'])
        for w in config['windows']:
            sensor_entities.update(contact['entity'] for contact in w.get('contacts', []))
            sensor_entities.update(g[key] for g in w.get('sensor_rules', [])
                                   for key in ('temp_entity', 'lux_entity') if g.get(key))
        sensor_entities = sorted(entity for entity in sensor_entities if self.permitted(user, entity, POLICY_READ))
        config['sensor_names'] = {entity: name for entity, name in config.get('sensor_names', {}).items()
                                  if user.is_admin or entity in sensor_entities}
        controls = {p['id']: all(self.permitted(user, self.engine.windows()[t]['cover'], POLICY_CONTROL)
                               for r in p['rides'] for t in r['targets']) for p in config['programs']}
        if not user.is_admin:
            for w in config['windows']:
                w.pop('contacts', None); w.pop('climate', None)
        allowed = {p['id'] for p in config['programs']}
        now = utcnow()
        day = now.astimezone(self.engine.zone).date()
        sun_times = {'date': str(day)}
        for event in ('sunrise', 'sunset'):
            moment = self.solar(event, day)
            sun_times[event] = moment.isoformat() if moment else None
        # Display order only: use the same due-time calculation as execution,
        # including offsets, time bounds, timezone and DST. Keep stored ride IDs,
        # motor runtime and sensor-program edge ordering unchanged.
        for program in config['programs']:
            if program['kind'] == 'time':
                def due_key(ride):
                    due = self.engine.due(ride, day, self.solar)
                    ride['today_due'] = due.isoformat() if due else None
                    return due.timestamp() if due is not None else float('inf')
                program['rides'].sort(key=due_key)
        planned = []
        for row in self.engine.planned_today(now, self.solar, self.states()):
            if row['kind'] in ('shade', 'opening'):
                if any(t not in visible for t in row['targets']):
                    continue
            elif row['program'] not in allowed:
                continue
            row['can_control'] = all(self.permitted(user, e, POLICY_CONTROL) for e in self.row_covers(row))
            if row['status'] == 'pending':
                moving = [motion for wid, motion in self.moving.items()
                          if wid in row['targets'] and self.engine.occurrence(motion['intent']) == row['occurrence']]
                if moving:
                    row['status'] = 'moving'
            planned.append(row)
        for item in self.engine.rt.get('one_time', []):
            if item['target'] not in visible:
                continue
            scheduled = datetime.fromisoformat(item['scheduled'])
            planned.append({'occurrence': item['id'], 'program': '__one_time__', 'ride': item['id'],
                'name': 'Einzelfahrt', 'kind': 'time', 'one_time': True, 'time': item['scheduled'],
                'targets': [item['target']], 'position': item['position'], 'tilt': item.get('tilt'),
                'status': item.get('status', 'planned'), 'reason': item.get('reason', ''), 'skip': False,
                'can_undo': scheduled > now, 'carried': False,
                'can_control': self.permitted(user, self.engine.windows()[item['target']]['cover'], POLICY_CONTROL)})
        sensor_programs = []
        for row in self.engine.sensors_today(now):
            if any(t not in visible for t in row['targets']):
                continue
            row['can_control'] = all(self.permitted(user, self.engine.windows()[t]['cover'], POLICY_CONTROL) for t in row['targets'])
            sensor_programs.append(row)
        cover_states = []
        for window in config['windows']:
            state = self.hass.states.get(window['cover'])
            attrs = dict(state.attributes) if state else {}
            cover_states.append({'window': window['id'], 'state': state.state if state else 'unavailable',
                'position': attrs.get('current_position'), 'tilt': attrs.get('current_tilt_position'),
                'moving': window['id'] in self.moving})
        history = [row for row in self.engine.rt.get('history', [])
                   if row.get('kind') in ('done', 'error') and row.get('window') in visible][:20]
        return {'backend_version': INTEGRATION_VERSION, 'config_schema': CONFIG_SCHEMA_VERSION, 'config': config, 'sensor_programs': sensor_programs, 'revision': self.revision, 'admin': user.is_admin, 'controls': controls,
                'sun_times': sun_times, 'time_zone': self.hass.config.time_zone, 'sensor_entities': sensor_entities,
                'planned': planned, 'planned_date': str(now.astimezone(self.engine.zone).date()),
                'upcoming': [r for r in self.engine.upcoming(now, self.solar) if r['program'] in allowed],
                'pending': {w: slots for w, slots in self.engine.rt['pending'].items() if w in visible},
                'moving': [w for w in self.moving if w in visible], 'cover_states': cover_states,
                'command_history': history,
                'daily_history': [row for row in self.engine.command_results_today(now) if row.get('window') in visible]}

    async def save(self, config, revision):
        checked = validate_config(self.individual_controls(config))
        # Classification controls which axes a ride may set; the feature checks
        # below still require the underlying HA integration to support the action.
        async with self.lock:
            if revision != self.revision:
                raise ValueError('Zwischenzeitlich geändert. Bitte neu laden und erneut bearbeiten.')
            def controls_only(value):
                normalized = deepcopy({k: v for k, v in value.items() if k not in ('sensor_names', 'sensors')})
                for program in normalized['programs']:
                    if program['kind'] == 'time':program['rides'].sort(key=lambda ride: ride['id'])
                return normalized
            if controls_only(checked) == controls_only(self.engine.config):
                # Display-only edits must not stop motors, reset edges or trigger rides.
                self.engine.config['sensor_names'] = checked['sensor_names']
                self.engine.config['sensors'] = checked['sensors']
                self.revision += 1
                await self.persist()
                async_dispatcher_send(self.hass, SIGNAL)
                return
            old_windows = self.engine.windows()
            old_rides = {r['id']: r for p in self.engine.config['programs'] for r in p['rides']}
            windows = {w['id']: w for w in checked['windows']}
            for wid, w in windows.items():
                old = old_windows.get(wid)
                classification_changed = not old or w['cover'] != old['cover'] or w['cover_type'] != old['cover_type']
                state = self.hass.states.get(w['cover'])
                if classification_changed and not is_blind(w, dict(state.attributes) if state else {}):
                    for p in checked['programs']:
                        for r in p['rides']:
                            if r['targets'] == [wid]:r['tilt'] = None
            checked = validate_config(checked)
            def movement(ride):
                return (tuple(ride['targets']), ride.get('position'), ride.get('tilt'), bool(ride.get('restore_schedule')), bool(ride.get('restore_before')))
            # A parameter/name edit must not require all unrelated actors online.
            # New motor goals and a changed physical cover still need capabilities.
            for p in checked['programs']:
                for r in p['rides']:
                    previous = old_rides.get(r['id'])
                    for wid in r['targets']:
                        w = windows[wid];old = old_windows.get(wid)
                        unchanged = previous and movement(r) == movement(previous) and old and old['cover'] == w['cover']
                        if unchanged:continue
                        state = self.hass.states.get(w['cover'])
                        if not state:
                            raise ValueError(f"Entität nicht gefunden: {w['cover']}")
                        features = int(state.attributes.get('supported_features', 0))
                        if r['position'] is not None and not features & CoverEntityFeature.SET_POSITION:
                            raise ValueError(f"{w['name']}: Positionssteuerung nicht unterstützt.")
                        if r['tilt'] is not None and not features & CoverEntityFeature.SET_TILT_POSITION:
                            raise ValueError(f"{w['name']}: Lamellensteuerung nicht unterstützt.")
            for wid in list(self.moving):
                await self.stop(wid)
            self.engine.replace_config(checked, utcnow(), self.solar)
            self.revision += 1
            await self.persist()
            await self._pulse_locked()

    def row_covers(self, row):
        targets = row['targets']
        if row['kind'] not in ('shade', 'opening'):
            p = next(p for p in self.engine.config['programs'] if p['id'] == row['program'])
            r = next(r for r in p['rides'] if r['id'] == row['ride'])
            targets = r['targets']
        return {self.engine.windows()[t]['cover'] for t in targets}

    async def action(self, user, msg):
        async with self.lock:
            if msg['revision'] != self.revision:
                raise ValueError('Ansicht veraltet. Bitte neu laden und erneut versuchen.')
            action, value = msg['action'], msg['value']
            if action == 'add_once':
                now = utcnow()
                target = msg.get('target')
                window = self.engine.windows().get(target)
                if not window or not window['enabled']:
                    raise ValueError('Bitte einen aktiven Rollladen auswählen.')
                if not self.permitted(user, window['cover'], POLICY_CONTROL):
                    raise ValueError('Keine Steuerberechtigung für diesen Rollladen.')
                cover = self.hass.states.get(window['cover'])
                if not cover or cover.state in ('unknown', 'unavailable'):
                    raise ValueError('Der Rollladen ist nicht verfügbar.')
                try:
                    clock = datetime.strptime(msg.get('time', ''), '%H:%M').time()
                    scheduled = datetime.combine(now.astimezone(self.engine.zone).date(), clock, self.engine.zone)
                    position = float(msg.get('position'))
                    tilt = msg.get('tilt')
                    tilt = None if tilt in (None, '') else float(tilt)
                except (TypeError, ValueError):
                    raise ValueError('Zeit und Position bitte gültig eingeben.')
                if scheduled <= now.astimezone(self.engine.zone):
                    raise ValueError('Die Einzelfahrt muss noch heute in der Zukunft liegen.')
                if not 0 <= position <= 100 or (tilt is not None and not 0 <= tilt <= 100):
                    raise ValueError('Positionen müssen zwischen 0 und 100 liegen.')
                features = int(cover.attributes.get('supported_features', 0))
                if not features & CoverEntityFeature.SET_POSITION:
                    raise ValueError('Der Rollladen unterstützt keine Positionsfahrt.')
                if tilt is not None and (window.get('cover_type') == 'shutter' or
                        (window.get('cover_type') == 'auto' and is_blind(window, dict(cover.attributes)) is False)):
                    raise ValueError('Für Rollläden kann keine Lamellenposition festgelegt werden.')
                if tilt is not None and not features & CoverEntityFeature.SET_TILT_POSITION:
                    raise ValueError('Diese Entität unterstützt keine Lamellenposition.')
                if any(item['target'] == target and item.get('status') not in ('error',) for item in self.engine.rt['one_time']):
                    raise ValueError('Für diesen Rollladen ist bereits eine Einzelfahrt vorgemerkt.')
                self.engine.rt['one_time'].append({'id':'once_'+uuid4().hex, 'target':target,
                    'created':now.isoformat(), 'scheduled':scheduled.astimezone(timezone.utc).isoformat(),
                    'position':position, 'tilt':tilt, 'status':'planned', 'reason':''})
                self.revision += 1
                await self.persist()
                await self._pulse_locked()
                return
            if action == 'cancel_once':
                item = next((row for row in self.engine.rt['one_time'] if row['id'] == msg.get('target')), None)
                if item is None:
                    raise ValueError('Die Einzelfahrt ist nicht mehr vorhanden.')
                window = self.engine.windows().get(item['target'])
                if not window or not self.permitted(user, window['cover'], POLICY_CONTROL):
                    raise ValueError('Keine Steuerberechtigung für diesen Rollladen.')
                for wid, motion in list(self.moving.items()):
                    if motion['intent'].get('id') == item['id']:
                        await self.stop(wid)
                self.engine.rt['one_time'].remove(item)
                self.revision += 1
                await self.persist()
                await self._pulse_locked()
                return
            if action == 'sensor_pause':
                now = utcnow()
                row = next((row for row in self.engine.sensors_today(now) if row['id'] == msg['target']), None)
                if row is None:
                    raise ValueError('Diese Sensorregel ist heute nicht freigegeben. Bitte aktualisieren.')
                covers = {self.engine.windows()[t]['cover'] for t in row['targets']}
                if covers != set(msg['entity_id']) or any(not self.permitted(user, e, POLICY_CONTROL) for e in covers):
                    raise ValueError('Keine Steuerberechtigung für diese Rollläden.')
                self.engine.pause_sensor_today(row['id'], value, now)
                self.revision += 1
                await self.persist()
                await self._pulse_locked()
                return
            if action == 'skip_today':
                now = utcnow()
                row = next((r for r in self.engine.planned_today(now, self.solar)
                            if r['occurrence'] == msg['occurrence']), None)
                if row is None:
                    raise ValueError('Diese Fahrt ist nicht mehr offen. Bitte aktualisieren.')
                covers = self.row_covers(row)
                if covers != set(msg['entity_id']) or any(not self.permitted(user, e, POLICY_CONTROL) for e in covers):
                    raise ValueError('Keine Steuerberechtigung für diese Rollläden.')
                self.engine.skip_today(now, self.solar, msg['occurrence'], value)
                if value:
                    for wid, motion in list(self.moving.items()):
                        if self.engine.occurrence(motion['intent']) == msg['occurrence']:
                            await self.stop(wid)
                self.revision += 1
                await self.persist()
                await self._pulse_locked()
                return
            config = self.engine.config
            target = config
            impacted = set()
            if action in ('vacation', 'window'):
                if not user.is_admin:
                    raise ValueError('Diese Einstellung darf nur ein Administrator ändern.')
                if action == 'window':
                    target = next((w for w in config['windows'] if w['id'] == msg['target']), None)
                    if target is None:
                        raise ValueError('Fenster nicht gefunden.')
                    impacted.add(target['id'])
                else:
                    impacted.update(w['id'] for w in config['windows'])
            elif action in ('program', 'ride', 'skip'):
                p = next((p for p in config['programs'] if p['id'] == msg['program']), None)
                if p is None:
                    raise ValueError('Programm nicht gefunden.')
                target = p if action == 'program' else next((r for r in p['rides'] if r['id'] == msg['target']), None)
                if target is None:
                    raise ValueError('Fahrt nicht gefunden.')
                impacted.update(t for r in (p['rides'] if action == 'program' else [target]) for t in r['targets'])
                covers = {self.engine.windows()[t]['cover'] for t in impacted}
                if covers != set(msg['entity_id']) or any(not self.permitted(user, e, POLICY_CONTROL) for e in covers):
                    raise ValueError('Keine Steuerberechtigung für diese Rollläden.')
            else:
                raise ValueError('Unbekannte Aktion.')
            key = 'vacation' if action == 'vacation' else 'skip_next' if action == 'skip' else 'enabled'
            old_value = target.get(key)
            target[key] = value
            if action in ('program', 'ride'):
                try:
                    validate_config(config)
                except (ValueError, KeyError, TypeError):
                    target[key] = old_value
                    raise
            # Toggling a ride/program is immediate and cannot leave a deferred action behind.
            if action != 'skip':
                for wid in impacted:
                    motion = self.moving.get(wid)
                    stop_motion = (action == 'window' or
                                   (action == 'vacation' and motion and any(p['id'] == motion['intent']['program'] and p['pause_in_vacation'] for p in config['programs'])) or
                                   (action in ('program', 'ride') and motion and motion['intent']['program'] == p['id']
                                    and (action == 'program' or motion['intent']['ride'] == target['id'])))
                    if stop_motion:
                        await self.stop(wid)
                    slots = self.engine.rt['pending'].get(wid, {})
                    if action == 'window':
                        slots.clear()
                    elif action == 'vacation':
                        for kind in list(slots):
                            if any(p['id'] == slots[kind]['program'] and p['pause_in_vacation'] for p in config['programs']):
                                slots.pop(kind)
                    else:
                        for kind, intent in list(slots.items()):
                            if intent['program'] == p['id'] and (action == 'program' or intent['ride'] == target['id']):
                                slots.pop(kind)
                self.engine.last = utcnow()
            self.engine.log(utcnow(), 'setting', f'{action}: {"an" if value else "aus"}')
            self.revision += 1
            await self.persist()
            await self._pulse_locked()


def manager(hass):
    if DOMAIN not in hass.data:
        raise ValueError('Integration zuerst unter Geräte & Dienste hinzufügen.')
    return hass.data[DOMAIN]


@websocket_api.websocket_command({vol.Required('type'): DOMAIN + '/get'})
@websocket_api.async_response
async def ws_get(hass, connection, msg):
    try:
        connection.send_result(msg['id'], manager(hass).snapshot(connection.user))
    except (ValueError, KeyError) as err:
        connection.send_error(msg['id'], 'invalid_config', str(err))


@websocket_api.websocket_command({vol.Required('type'): DOMAIN + '/save', vol.Required('config'): dict,
                                  vol.Required('revision'): int, vol.Required('config_schema'): int})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_save(hass, connection, msg):
    try:
        m = manager(hass)
        if msg.get('config_schema') != CONFIG_SCHEMA_VERSION:
            raise ValueError('Kartenoberfläche und Integration sind nicht kompatibel. Bitte Browser/App neu laden.')
        await m.save(msg['config'], msg['revision'])
        connection.send_result(msg['id'], m.snapshot(connection.user))
    except (ValueError, KeyError, TypeError, StopIteration) as err:
        connection.send_error(msg['id'], 'invalid_config', str(err))


@websocket_api.websocket_command({vol.Required('type'): DOMAIN + '/action', vol.Required('action'): str,
                                  vol.Required('value'): bool, vol.Required('revision'): int,
                                  vol.Optional('target', default=''): str,
                                  vol.Optional('program', default=''): str,
                                  vol.Optional('entity_id', default=[]): [str],
                                  vol.Optional('occurrence', default=''): str,
                                  vol.Optional('time', default=''): str,
                                  vol.Optional('position', default=0): vol.Any(float, int),
                                  vol.Optional('tilt', default=None): vol.Any(float, int, type(None))})
@websocket_api.async_response
async def ws_action(hass, connection, msg):
    try:
        m = manager(hass)
        await m.action(connection.user, msg)
        connection.send_result(msg['id'], m.snapshot(connection.user))
    except (ValueError, KeyError, TypeError, StopIteration) as err:
        connection.send_error(msg['id'], 'not_allowed', str(err))
