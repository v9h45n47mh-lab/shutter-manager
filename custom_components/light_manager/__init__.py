"""Light Manager: local, admin-managed lighting programs and Lovelace card."""
from __future__ import annotations

import asyncio
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import logging
from pathlib import Path

try:
    import probatio as vol
except ImportError:  # HA versions before the schema-library migration.
    import voluptuous as vol

from homeassistant.components import frontend, websocket_api
from homeassistant.components.http import StaticPathConfig
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import area_registry as ar, device_registry as dr
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_state_change_event, async_track_time_interval
from homeassistant.helpers.service import async_register_admin_service
from homeassistant.helpers.storage import Store
from homeassistant.helpers.sun import get_astral_event_date

from .engine import Engine, validate, restrict_scene_config, scene_matches

DOMAIN = 'light_manager'
VERSION = '1.0.3'
SIGNAL = DOMAIN + '_update'
_LOGGER = logging.getLogger(__name__)


def utcnow():
    return datetime.now(timezone.utc)


async def async_setup(hass, config):
    await hass.http.async_register_static_paths([StaticPathConfig(
        '/light-manager/light-manager-card.js',
        str(Path(__file__).parent / 'frontend' / 'light-manager-card.js'), False)])
    frontend.add_extra_js_url(hass, '/light-manager/light-manager-card.js?v=' + VERSION)
    for command in (ws_get, ws_save):
        websocket_api.async_register_command(hass, command)

    async def vacation(call):
        m = hass.data.get(DOMAIN)
        if not m: raise ValueError('Light Manager zuerst als Integration hinzufügen.')
        c = deepcopy(m.engine.config); c['vacation'] = call.data['enabled']
        await m.save(c, m.revision)
    async_register_admin_service(hass, DOMAIN, 'set_vacation', vacation,
                                 vol.Schema({vol.Required('enabled'): bool}))
    return True


async def async_setup_entry(hass, entry):
    m = Manager(hass)
    await m.load()
    hass.data[DOMAIN] = m
    entry.runtime_data = m
    await hass.config_entries.async_forward_entry_setups(entry, [Platform.SENSOR])
    m.unsubs.append(async_track_time_interval(hass, m.pulse, timedelta(seconds=5)))
    @callback
    def changed(event):
        ident = event.data.get('entity_id', '')
        if ident in m.watched and not m.queued:
            m.queued = True
            hass.async_create_task(m.pulse())
    m.state_callback = changed
    m.update_watched()
    if hass.is_running:
        await m.pulse()
    else:
        m.unsubs.append(hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, m.pulse))
    return True


async def async_unload_entry(hass, entry):
    m = entry.runtime_data
    if not await hass.config_entries.async_unload_platforms(entry, [Platform.SENSOR]): return False
    m.stopped = True
    for unsub in m.unsubs: unsub()
    if m.state_unsub: m.state_unsub()
    async with m.lock:
        await m.persist()
    hass.data.pop(DOMAIN, None)
    return True


class Manager:
    def __init__(self, hass):
        self.hass = hass; self.engine = Engine(tz=hass.config.time_zone)
        self.store = Store(hass, 1, DOMAIN)
        self.revision = 0; self.lock = asyncio.Lock(); self.unsubs = []
        self.history = []; self.retry = {}; self.errors = {}
        self.state_unsub = None; self.state_callback = None; self.watched = set()
        self.queued = False; self.stopped = False; self._saved = None

    async def load(self):
        data = await self.store.async_load()
        if data:
            legacy = data['config'].get('schema') in (1, 2, 3)
            if legacy:
                await Store(self.hass, 1, DOMAIN + '_pre_030').async_save(deepcopy(data))
            cleaned, removed, disabled = restrict_scene_config(data['config']) if not legacy else (data['config'], 0, 0)
            restricted = bool(removed or disabled)
            if restricted:
                await Store(self.hass, 1, DOMAIN + '_pre_040').async_save(deepcopy(data))
            migrated = self.migrate_areas(cleaned) if not legacy else False
            if migrated:
                await Store(self.hass, 1, DOMAIN + '_pre_042').async_save(deepcopy(data))
            self.engine = Engine(cleaned, data.get('runtime'), self.hass.config.time_zone)
            self.revision = data.get('revision', 0)
            self.history = data.get('history', [])[-60:]
            if legacy or restricted or migrated:
                self.revision += 1
                if legacy:
                    self.log('Migration 0.3.0: Konfiguration und Laufzeit für Hue-Szenen übernommen.')
                if restricted:
                    self.log(f'Migration 0.4.0: {removed} unpassende Szenenverknüpfungen entfernt, {disabled} Schaltaktionen deaktiviert. Bitte Szenen neu wählen.')
                if migrated:
                    self.log('Bereichsumstellung: Eindeutige Ziele übernommen, übrige Zuordnungen als einzelne Lampen erhalten. Leere Altziele bitte prüfen.')
                await self.persist()
        self.update_watched()

    def update_watched(self):
        watched = set()
        for p in self.engine.config['programs']:
            for a in p['actions']:
                watched.update(a.get('sensors', []))
                if a.get('lux_entity'): watched.add(a['lux_entity'])
        self.watched = watched
        if self.state_callback:
            if self.state_unsub: self.state_unsub()
            self.state_unsub = async_track_state_change_event(self.hass, list(watched), self.state_callback)

    def area_catalog(self):
        areas = {area.id: area.name for area in ar.async_get(self.hass).async_list_areas()}
        devices = dr.async_get(self.hass)
        mapping = {}
        for entry in getattr(er.async_get(self.hass), 'entities', {}).values():
            if not entry.entity_id.startswith('light.'):
                continue
            device = devices.async_get(entry.device_id) if entry.device_id else None
            area = entry.area_id or (device.area_id if device else None)
            if area in areas:
                mapping[entry.entity_id] = area
        return areas, mapping

    def migrate_areas(self, config):
        areas, mapping = self.area_catalog()
        by_area = {area: {l['id'] for l in config['lamps'] if mapping.get(l['entity']) == area} for area in areas}
        replacements = {}
        for section in ('rooms', 'zones'):
            for item in config[section]:
                members = {l['id'] for l in config['lamps'] if item['id'] in l[section]}
                exact = [area for area, ids in by_area.items() if members and ids == members]
                if exact:
                    replacements[item['id']] = ['area:' + exact[0]]
                elif members:
                    replacements[item['id']] = sorted(members)
        changed = False
        for program in config['programs']:
            for action in ([program] if 'targets' in program else []) + program['actions']:
                targets = list(dict.fromkeys(t for old in action['targets'] for t in replacements.get(old, [old])))
                if targets != action['targets']:
                    changed = True
                    action['targets'] = targets
        return changed

    def states(self):
        states = {s.entity_id: {'state': s.state, 'attributes': dict(s.attributes)} for s in self.hass.states.async_all()}
        _, area_map = self.area_catalog()
        for entity, area in area_map.items():
            states.setdefault(entity, {'state': 'unavailable', 'attributes': {}})['area'] = area
        # Read already-loaded Hue topology. No requests to a bridge are made here.
        entries_api = getattr(self.hass, 'config_entries', None)
        if entries_api is None or not hasattr(entries_api, 'async_entries'):
            return states
        registry = er.async_get(self.hass)
        bridges = [getattr(entry, 'runtime_data', None) for entry in entries_api.async_entries('hue')]
        for lamp in self.engine.config['lamps']:
            record = registry.async_get(lamp['entity'])
            uid = getattr(record, 'unique_id', None)
            if not uid or getattr(record, 'platform', None) != 'hue' or lamp['entity'] not in states:
                continue
            for bridge in bridges:
                api = getattr(bridge, 'api', None)
                controller = getattr(getattr(api, 'groups', None), 'grouped_light', None)
                if controller is None or not hasattr(controller, 'get_lights'):
                    continue
                try:
                    lights = controller.get_lights(uid)
                    members = [registry.async_get_entity_id('light', 'hue', light.id) for light in lights]
                except (AttributeError, KeyError, TypeError):
                    continue
                if lights and all(member and member in states for member in members):
                    states[lamp['entity']]['attributes']['entity_id'] = list(dict.fromkeys(members))
                    states[lamp['entity']]['attributes']['is_hue_group'] = True
                    break
        return states

    def solar(self, event, day):
        return get_astral_event_date(self.hass, event, day)

    async def persist(self):
        data = {'config': self.engine.config, 'runtime': self.engine.rt,
                'revision': self.revision, 'history': self.history[-60:]}
        if data != self._saved:
            await self.store.async_save(data); self._saved = deepcopy(data)

    def log(self, message, error=False):
        self.history.append({'time': utcnow().isoformat(), 'message': message, 'error': error})
        self.history = self.history[-60:]
        if error: _LOGGER.warning('%s', message)

    def catalog(self):
        entries = []
        registry = er.async_get(self.hass)
        for entity, value in self.states().items():
            domain = entity.split('.')[0]; attrs = value['attributes']
            if domain not in ('light', 'binary_sensor', 'sensor', 'scene'): continue
            if domain == 'light' and self.hass.states.get(entity) is None: continue
            if domain == 'scene' and getattr(registry.async_get(entity), 'platform', None) != 'hue': continue
            if domain == 'binary_sensor' and attrs.get('device_class') not in ('motion', 'occupancy', 'presence', 'opening', 'door', 'window', 'garage_door', None): continue
            entries.append({'entity': entity, 'name': attrs.get('friendly_name', entity), 'state': value['state'], 'attributes': attrs})
        return sorted(entries, key=lambda x: x['entity'])

    def validate_live(self, config):
        e = Engine(config, tz=self.hass.config.time_zone)
        hue_scenes = {x['entity'] for x in self.catalog() if x['entity'].startswith('scene.')}
        for program in config['programs']:
            for action in program['actions']:
                if action['enabled'] and action['mode'] == 'scene' and action['scene'] not in hue_scenes:
                    raise ValueError('Hue-Szene nicht verfügbar.')
            if program.get('once_date') and not any(p['id'] == program['id'] for p in self.engine.config['programs']):
                now = utcnow().astimezone(self.engine.zone)
                if program['once_date'] != str(now.date()) or any(e.due(a, now.date(), None) <= now for a in program['actions']):
                    raise ValueError('Einmalige Schaltung bitte für heute in der Zukunft anlegen.')
        states = self.states()
        for program in config['programs']:
            for action in program['actions']:
                if action['enabled'] and action['mode'] == 'scene':
                    selected = e.target_lamps(action['targets'], states)
                    if not selected or not all(scene_matches(lamp['entity'], action['scene']) for lamp in config['lamps'] if lamp['id'] in selected):
                        raise ValueError('Hue-Szene passt nicht zur Auswahl.')
        for lamp in config['lamps']:
            if lamp.get('is_group') and not lamp.get('members') and not states.get(lamp['entity'], {}).get('attributes', {}).get('entity_id'):
                continue
            e.leaves(lamp['id'], states)

    def snapshot(self):
        now = utcnow(); local = now.astimezone(self.engine.zone)
        sun = {event: (t.isoformat() if (t := self.solar(event, local.date())) else None)
               for event in ('sunrise', 'sunset')}
        calculated = {}
        for program in self.engine.config['programs']:
            if program['kind'] != 'time':
                continue
            for action in program['actions']:
                due = self.engine.due(action, local.date(), self.solar)
                if due is not None:
                    calculated[action['id']] = due.isoformat()
        areas, lamp_areas = self.area_catalog()
        # Status refresh is read-only: GET must not advance timers or claim actions.
        return {'version': VERSION, 'schema': 4, 'revision': self.revision, 'config': deepcopy(self.engine.config),
                'catalog': self.catalog(), 'areas': [{'id': 'area:' + ident, 'name': name} for ident, name in areas.items()],
                'lamp_areas': {entity: 'area:' + area for entity, area in lamp_areas.items()},
                'completed_once': [ident for ident, done in self.engine.rt['once_done'].items() if done['date'] == str(local.date()) and done.get('complete')], 'status': deepcopy(self.engine.status), 'rules': deepcopy(self.engine.rules),
                'warnings': self.engine.warnings + list(self.errors.values()), 'history': list(reversed(self.history)),
                'planned': deepcopy(self.engine.planned), 'calculated': calculated, 'sun': sun, 'today': str(local.date()),
                'timezone': self.hass.config.time_zone}

    def drop_removed_targets_from_finished_once(self, config):
        if not isinstance(config, dict) or not isinstance(config.get('lamps'), list):
            return config
        lamps = config['lamps']
        if not all(isinstance(lamp, dict) and isinstance(lamp.get('id'), str) for lamp in lamps):
            return config
        removed = {lamp['id'] for lamp in self.engine.config['lamps']} - {lamp['id'] for lamp in lamps}
        if not removed or not isinstance(config.get('programs'), list):
            return config
        config = deepcopy(config)
        today = str(utcnow().astimezone(self.engine.zone).date())
        done = self.engine.rt['once_done']
        finished = {
            p['id']: p for p in self.engine.config['programs']
            if p.get('once_date') and (p['once_date'] < today or all(
                done.get(a['id'], {}).get('complete') and done[a['id']]['date'] == p['once_date']
                for a in p['actions']
            ))
        }
        for program in config['programs'][:]:
            if not isinstance(program, dict) or not isinstance(program.get('id'), str):
                continue
            old = finished.get(program['id'])
            if old is None or program != old:
                continue
            if 'targets' in program:
                program['targets'] = [target for target in program['targets'] if target not in removed]
            for action in program['actions'][:]:
                action['targets'] = [target for target in action['targets'] if target not in removed]
                if not action['targets']:
                    program['actions'].remove(action)
            if not program['actions']:
                config['programs'].remove(program)
        return config

    async def save(self, config, revision):
        async with self.lock:
            if revision != self.revision:
                raise ValueError('Die Konfiguration wurde zwischenzeitlich geändert. Bitte neu laden; deine Eingaben bleiben erhalten.')
            checked = validate(self.drop_removed_targets_from_finished_once(config))
            self.validate_live(checked)
            previous, previous_revision = deepcopy(self.engine), self.revision
            self.engine.replace(checked); self.revision += 1
            try:
                await self.persist()
            except Exception:
                self.engine, self.revision = previous, previous_revision
                raise
            self.update_watched()
            await self.evaluate()

    def service_data(self, a, state):
        attrs = state.get('attributes', {})
        data = {'transition': 0}  # Explicitly override HA light-profile and device defaults.
        if a['mode'] == 'off': return data
        modes = attrs.get('supported_color_modes') or []
        if a.get('brightness') is not None:
            if not set(modes) - {'onoff', 'unknown'}:
                raise ValueError('Die Lampe unterstützt keine Helligkeitssteuerung.')
            data['brightness_pct'] = a['brightness']
        if a.get('kelvin') is not None:
            if 'color_temp' not in modes: raise ValueError('Die Lampe unterstützt keine Farbtemperatur.')
            low = attrs.get('min_color_temp_kelvin', 1000); high = attrs.get('max_color_temp_kelvin', 10000)
            if not low <= a['kelvin'] <= high: raise ValueError(f'Farbtemperatur außerhalb des Bereichs {low}–{high} K.')
            data['color_temp_kelvin'] = a['kelvin']
        if a.get('rgb') is not None:
            if not set(modes) & {'hs', 'xy', 'rgb', 'rgbw', 'rgbww'}:
                raise ValueError('Die Lampe unterstützt keine Farben.')
            data['rgb_color'] = a['rgb']
        return data

    async def execute(self, command, states):
        if command['action']['mode'] == 'scene':
            scene = command['action']['scene']
            if scene not in states or states[scene].get('state') == 'unavailable':
                raise ValueError('Hue-Szene nicht verfügbar.')
            await self.hass.services.async_call('scene', 'turn_on', {'entity_id': scene, 'transition': 0}, blocking=True)
            return
        targets = [command['service_entity']] if 'service_entity' in command else command['entities']
        for e in targets:
            if states.get(e, {}).get('state') in (None, 'unknown', 'unavailable'):
                raise ValueError(f'{e}: Lampe nicht verfügbar.')
        e = targets[0]; a = command['action']
        data = {'entity_id': e, **self.service_data(a, states[e])}
        await self.hass.services.async_call('light', 'turn_off' if a['mode'] == 'off' else 'turn_on', data, blocking=True)

    async def evaluate(self):
        now = utcnow(); states = self.states()
        commands = self.engine.plan(now, states, self.solar)
        relevant = {signature_key(c) for c in commands}
        self.errors = {k: v for k, v in self.errors.items() if k in relevant}
        self.retry = {k: v for k, v in self.retry.items() if k in relevant}
        await self.persist()
        for c in commands:
            current = self.states()
            if any(current.get(e) != states.get(e) for e in self.watched):
                break  # A queued sensor event must arbitrate again before another device command.
            key = signature_key(c)
            if self.retry.get(key, 0) > now.timestamp(): continue
            self.engine.claim(c, states)
            await self.persist()
            try:
                async with asyncio.timeout(15): await self.execute(c, states)
            except Exception as err:
                message = f'{", ".join(c["entities"])}: {err}'
                if self.errors.get(key) != message: self.log(message, error=True)
                self.errors[key] = message; self.retry[key] = now.timestamp() + 30
            else:
                self.engine.success(c); self.retry.pop(key, None); self.errors.pop(key, None)
                self.log(f'{", ".join(c["entities"])} → {c["action"]["mode"]}')
        await self.persist()
        async_dispatcher_send(self.hass, SIGNAL)

    async def pulse(self, _event=None):
        self.queued = False
        if self.stopped: return
        async with self.lock:
            if self.stopped: return
            try: await self.evaluate()
            except Exception:
                _LOGGER.exception('Light Manager: Auswertung fehlgeschlagen')


def signature_key(c):
    return c['key'] + ':' + ','.join(c['entities'])


@websocket_api.websocket_command({vol.Required('type'): DOMAIN + '/get'})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_get(hass, connection, msg):
    try:
        m = hass.data.get(DOMAIN)
        if not m: raise ValueError('Bitte zuerst die Integration Light Manager hinzufügen.')
        connection.send_result(msg['id'], m.snapshot())
    except ValueError as err: connection.send_error(msg['id'], 'light_manager_error', str(err))


@websocket_api.websocket_command({vol.Required('type'): DOMAIN + '/save',
                                 vol.Required('revision'): int, vol.Required('config'): dict})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_save(hass, connection, msg):
    try:
        m = hass.data.get(DOMAIN)
        if not m: raise ValueError('Bitte zuerst die Integration Light Manager hinzufügen.')
        await m.save(msg['config'], msg['revision'])
        connection.send_result(msg['id'], m.snapshot())
    except (ValueError, TypeError, KeyError) as err:
        connection.send_error(msg['id'], 'light_manager_error', str(err))
