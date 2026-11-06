"""Deterministic scheduling engine. No Home Assistant imports or I/O."""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta, time, timezone
import hashlib
import math
import re
from zoneinfo import ZoneInfo

VERSION = 1
TRAVEL_TIMEOUT_SECONDS = 150
POLICIES = ('drive', 'skip', 'defer')
UTC = timezone.utc


def empty_config():
    return {'enabled': False, 'vacation': False, 'windows': [], 'programs': [], 'sensors': [], 'sensor_names': {}}


def split_legacy_rides(raw):
    """Deterministically migrate grouped rides to one ride per target."""
    if not isinstance(raw, dict):
        return raw, {}
    result = deepcopy(raw)
    mapping = {}
    for program in result.get('programs', []) if isinstance(result.get('programs', []), list) else []:
        if not isinstance(program, dict) or not isinstance(program.get('rides', []), list):
            continue
        rides = []
        for ride in program.get('rides', []):
            targets = ride.get('targets') if isinstance(ride, dict) else None
            if not isinstance(targets, list) or not targets or any(not isinstance(t, str) for t in targets):
                rides.append(ride); continue
            targets = list(dict.fromkeys(targets))
            for index, target in enumerate(targets):
                item = deepcopy(ride)
                old_id = str(ride.get('id', ''))
                new_id = old_id if index == 0 else old_id[:40] + '_w' + hashlib.sha256((old_id+':'+target).encode()).hexdigest()[:20]
                item['id'] = ride.get('id') if index == 0 else new_id
                item['targets'] = [target]
                rides.append(item)
                if len(targets) > 1:
                    mapping[(program.get('id'), old_id, target)] = new_id
        program['rides'] = rides
    return result, mapping


def is_blind(window, attributes=None):
    """A planner override changes classification, never the actuator's capabilities."""
    kind = window.get('cover_type', 'auto')
    if kind != 'auto':
        return kind == 'blind'
    attributes = attributes or {}
    return attributes.get('device_class') == 'blind' or bool(int(attributes.get('supported_features', 0)) & 128)


def normalize_season(value):
    if value is None:
        value = {}
    if not isinstance(value, dict) or type(value.get('enabled', False)) is not bool:
        raise ValueError('Jährlicher Zeitraum ist ungültig.')
    enabled = value.get('enabled', False)
    def month_day(raw, default):
        if not isinstance(raw, str):
            if not enabled:
                return default
            raise ValueError('Saisondatum bitte als TT.MM. angeben.')
        match = re.fullmatch(r'(\d{1,2})\.(\d{1,2})\.?', raw.strip())
        canonical = re.fullmatch(r'(\d{2})-(\d{2})', raw.strip())
        try:
            if match:
                day, month = map(int, match.groups())
            elif canonical:
                month, day = map(int, canonical.groups())
            else:
                raise ValueError()
            datetime(2000, month, day)  # Also accepts annual February 29 boundaries.
            return f"{month:02d}-{day:02d}"
        except ValueError:
            if not enabled:
                return default
            raise ValueError('Ungültiges Saisondatum. Bitte TT.MM. verwenden, z. B. 01.04.') from None
    return {'enabled': enabled, 'start': month_day(value.get('start', '04-01'), '04-01'),
            'end': month_day(value.get('end', '10-31'), '10-31')}


def in_season(season, date):
    if not season or not season.get('enabled'):
        return True
    current = date.strftime('%m-%d')
    start, end = season['start'], season['end']
    return start <= current <= end if start <= end else current >= start or current <= end


def seasons_overlap(first, second):
    def intervals(season):
        if not season or not season.get('enabled'):
            return [(1, 366)]
        start = datetime.strptime('2000-'+season['start'], '%Y-%m-%d').timetuple().tm_yday
        end = datetime.strptime('2000-'+season['end'], '%Y-%m-%d').timetuple().tm_yday
        return [(start, end)] if start <= end else [(start, 366), (1, end)]
    return any(max(a, c) <= min(b, d) for a, b in intervals(first) for c, d in intervals(second))


def migrate_sensor_config(raw):
    result = deepcopy(raw)
    mapping = {}
    if not isinstance(result, dict):
        return result, mapping
    programs = result.get('programs', [])
    if not isinstance(programs, list) or not isinstance(result.get('windows', []), list):
        return result, mapping
    used = {p.get('id') for p in programs if isinstance(p, dict)}
    for window in result.get('windows', []):
        if not isinstance(window, dict):
            continue
        gate = window.pop('climate', None)
        window.setdefault('sensor_rules', [])
        if not gate or window['sensor_rules']:
            continue
        wid = window['id']; rule_id = 'legacy'
        rule = {key: value for key, value in gate.items() if key in
                ('lux_entity', 'temp_entity', 'lux_on', 'lux_off', 'temp_on', 'temp_off', 'release_delay_seconds')}
        rule.update(id=rule_id, name=gate.get('name') or 'Beschattung')
        window['sensor_rules'] = [rule]
        manual = []
        for program in programs:
            if program.get('kind') != 'sensor':
                continue
            for ride in program.get('rides', []):
                if wid in ride.get('targets', []):
                    ride.setdefault('sensor_rule', rule_id)
                    manual.append(program)
        auto = gate.get('auto_shade', not manual)
        if type(auto) is not bool:raise ValueError('Schalter muss true oder false sein.')
        if auto or not manual:
            base = 'auto_'+hashlib.sha256(wid.encode()).hexdigest()[:16]
            pid = base; suffix = 1
            while pid in used:
                suffix += 1; pid = base+'_'+str(suffix)
            used.add(pid)
            active, release = pid+'_active', pid+'_release'
            program = {'id': pid, 'name': ('Beschattung – '+window.get('name', wid))[:120],
                       'kind': 'sensor', 'days': list(range(7)), 'enabled': auto,
                       'pause_in_vacation': False, 'start_on_high': True, 'season': deepcopy(gate.get('season')),
                       'rides': [
                           {'id': active, 'targets': [wid], 'sensor_rule': rule_id, 'edge': 'active', 'enabled': True,
                            'position': gate.get('shade_position', 0), 'tilt': gate.get('shade_tilt')},
                           {'id': release, 'targets': [wid], 'sensor_rule': rule_id, 'edge': 'inactive', 'enabled': True,
                            'position': None, 'tilt': None, 'restore_schedule': True}]}
            if program['rides'][0]['position'] is None and program['rides'][0]['tilt'] is None and not auto:
                program['rides'][0]['position'] = 0
            programs.append(program)
            mapping[wid] = {'program': pid, 'rule': rule_id, 'active': active, 'release': release}
        elif manual:
            mapping[wid] = {'program': manual[0]['id'], 'rule': rule_id}
    result['programs'] = programs
    return result, mapping


def migrate_program_conditions(raw):
    """Move legacy cover thresholds to programs without merging unlike settings."""
    result = deepcopy(raw)
    mappings = []
    if not isinstance(result, dict) or not isinstance(result.get('windows', []), list) or not isinstance(result.get('programs', []), list):
        return result, mappings
    windows = {w.get('id'): w for w in result.get('windows', []) if isinstance(w, dict)}
    used_ids = {p.get('id') for p in result.get('programs', []) if isinstance(p, dict)}
    referenced = set()
    programs = []

    def conditions(gate):
        return {'mode': 'both' if gate.get('lux_entity') and gate.get('temp_entity') else 'temp' if gate.get('temp_entity') else 'lux',
                'lux_on': gate.get('lux_on', 30000), 'lux_off': gate.get('lux_off', 20000),
                'temp_on': gate.get('temp_on', 25), 'temp_off': gate.get('temp_off', 23),
                'on_delay_seconds': 0, 'release_delay_seconds': gate.get('release_delay_seconds', 300)}

    for program in result.get('programs', []):
        if not isinstance(program, dict) or program.get('kind') != 'sensor' or program.get('sensor_mode', 'climate') == 'opening' or 'conditions' in program or not isinstance(program.get('rides', []), list):
            programs.append(program)
            if isinstance(program, dict):
                for r in program.get('rides', []) if isinstance(program.get('rides', []), list) else []:
                    if isinstance(r, dict):
                        for t in r.get('targets', []) if isinstance(r.get('targets', []), list) else []:
                            referenced.add((t, r.get('sensor_rule')))
            continue
        groups = {}
        for ride in program.get('rides', []):
            if not isinstance(ride, dict):
                programs.append(program); groups = None; break
            targets = ride.get('targets', [])
            window = windows.get(targets[0]) if isinstance(targets, list) and targets else None
            gates = window.get('sensor_rules', []) if window else []
            if not isinstance(gates, list): gates = []
            gate = next((g for g in gates if isinstance(g, dict) and g.get('id') == ride.get('sensor_rule')), None)
            if gate is None and len(gates) == 1 and not ride.get('sensor_rule'):
                gate = gates[0]; ride['sensor_rule'] = gate.get('id')
            gate = gate or {}
            wid = window.get('id') if window else None
            referenced.add((wid, gate.get('id')))
            releases = [r for r in program['rides'] if isinstance(r, dict) and r.get('targets') == targets and r.get('edge', 'active') == 'inactive']
            end = 'schedule' if releases and releases[0].get('restore_schedule') else 'fixed' if releases else 'keep'
            cond = conditions(gate)
            key = repr((cond, end))
            group = groups.setdefault(key, {'conditions': cond, 'end_action': end, 'rides': []})
            group['rides'].append(ride)
        if groups is None: continue
        if not groups:
            groups = {'empty': {'conditions': conditions({}), 'end_action': 'keep', 'rides': []}}
        for index, (key, group) in enumerate(groups.items()):
            item = deepcopy(program); old_id = program.get('id', '')
            pid = old_id
            if index:
                base = str(old_id)[:35]+'_m'+hashlib.sha256(key.encode()).hexdigest()[:16]
                pid = base; suffix = 1
                while pid in used_ids:
                    suffix += 1; pid = base+'_'+str(suffix)
                item['name'] = (str(program.get('name', ''))+f' ({index+1})')[:120]
            used_ids.add(pid)
            item.update(id=pid, **group)
            item.setdefault('start', '00:00'); item.setdefault('end', '00:00')
            programs.append(item)
            for ride in group['rides']:
                mappings.append({'old_program': old_id, 'program': pid, 'ride': ride.get('id'),
                                 'window': (ride.get('targets') or [None])[0], 'rule': ride.get('sensor_rule')})
    # Unused legacy rules become disabled programs so their thresholds are not lost.
    for wid, window in windows.items():
        gates = window.get('sensor_rules', [])
        for gate in gates if isinstance(gates, list) else []:
            if not isinstance(gate, dict) or (wid, gate.get('id')) in referenced or not any(k in gate for k in ('lux_on', 'temp_on', 'release_delay_seconds')):
                continue
            pid = 'import_'+hashlib.sha256((str(wid)+':'+str(gate.get('id'))).encode()).hexdigest()[:20]
            if pid in used_ids: continue
            used_ids.add(pid)
            programs.append({'id': pid, 'name': ('Übernommen – '+str(window.get('name', wid))+' / '+str(gate.get('name', 'Sensoren')))[:120],
                'kind': 'sensor', 'sensor_mode': 'climate', 'enabled': False, 'days': list(range(7)),
                'conditions': conditions(gate), 'start': '00:00', 'end': '00:00', 'end_action': 'keep',
                'rides': [{'id': pid+'_active', 'targets': [wid], 'sensor_rule': gate.get('id'), 'edge': 'active', 'position': 0, 'tilt': None}]})
    result['programs'] = programs
    result['model_version'] = 2
    return result, mappings


def calendars_overlap(first, second):
    """Compare half-open daily windows, including overnight weekday/season anchors."""
    def segments(program):
        low = int(program['start'][:2])*60+int(program['start'][3:])
        high = int(program['end'][:2])*60+int(program['end'][3:])
        if low == high:
            low, high = 0, 1440
        elif high < low:
            high += 1440
        result = []
        for day in program['days']:
            a, b = day*1440+low, day*1440+high
            result.append((a, min(b, 10080), day))
            if b > 10080: result.append((0, b-10080, day))
        return result
    shifts = {(x-y+3)%7-3 for a,b,x in segments(first) for c,d,y in segments(second) if max(a,c) < min(b,d)}
    # Check leap and regular years so February and annual boundary shifts agree.
    start = datetime(2000, 1, 1).date()
    return any(in_season(first['season'], start+timedelta(days=n)) and
               in_season(second['season'], start+timedelta(days=n-shift))
               for shift in shifts for n in range(731))


def validate_config(raw):
    """Normalize a bounded, JSON-only configuration; reject ambiguous schedules."""
    if not isinstance(raw, dict):
        raise ValueError('Konfiguration muss ein Objekt sein.')
    raw, _ = split_legacy_rides(raw)
    raw, _ = migrate_sensor_config(raw)
    raw, _ = migrate_program_conditions(raw)
    c = empty_config()
    c['model_version'] = 2
    def boolean(value, default=False):
        if value is None:
            return default
        if type(value) is not bool:
            raise ValueError('Schalter muss true oder false sein.')
        return value
    def number(value, lo, hi):
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not lo <= value <= hi:
            raise ValueError(f'Zahl muss zwischen {lo} und {hi} liegen.')
        return value
    def ident(value):
        if not isinstance(value, str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,64}', value):
            raise ValueError('Ungültige interne ID.')
        return value
    def label(value):
        if not isinstance(value, str) or not value.strip() or len(value) > 120:
            raise ValueError('Name fehlt oder ist länger als 120 Zeichen.')
        return value.strip()
    def entity(value, domain):
        if not isinstance(value, str) or not re.fullmatch(domain + r'\.[a-z0-9_]+', value):
            raise ValueError(f'Entität aus {domain} erforderlich.')
        return value
    def clock(value):
        if not isinstance(value, str) or not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d', value):
            raise ValueError('Uhrzeit im Format HH:MM erforderlich.')
        return value
    def policy(value):
        if value not in POLICIES:
            raise ValueError('Sensorregel ungültig.')
        return value
    c['enabled'] = boolean(raw.get('enabled'))
    c['vacation'] = boolean(raw.get('vacation'))
    sensors = raw.get('sensors', [])
    if not isinstance(sensors, list) or len(sensors) > 5000:
        raise ValueError('Sensorliste muss eine Liste mit maximal 5000 Einträgen sein.')
    c['sensors'] = sorted({entity(value, '(?:sensor|binary_sensor|input_boolean)') for value in sensors})
    names = raw.get('sensor_names', {})
    if not isinstance(names, dict) or len(names) > 5000:
        raise ValueError('Sensoranzeigenamen müssen ein Objekt mit maximal 5000 Einträgen sein.')
    c['sensor_names'] = {entity(key, '(?:sensor|binary_sensor|input_boolean)'): label(value)
                         for key, value in names.items()}
    if not isinstance(raw.get('windows', []), list) or not isinstance(raw.get('programs', []), list):
        raise ValueError('Fenster und Programme müssen Listen sein.')
    if len(raw.get('windows', [])) > 100 or len(raw.get('programs', [])) > 300:
        raise ValueError('Maximal 100 Fenster und 300 Programme.')
    sensor_targets = {t for p in raw.get('programs', []) if isinstance(p, dict) and p.get('kind') == 'sensor'
                      for r in p.get('rides', []) if isinstance(r, dict) for t in r.get('targets', [])}
    ids, covers = set(), set()
    for w in raw.get('windows', []):
        i, cover = ident(w['id']), entity(w['cover'], 'cover')
        if i in ids or cover in covers:
            raise ValueError('Fenster-ID oder Rollladen mehrfach zugewiesen.')
        ids.add(i); covers.add(cover)
        cover_type = w.get('cover_type', 'auto')
        if cover_type not in ('auto', 'shutter', 'blind'):
            raise ValueError('Typ muss Automatisch, Rollladen oder Jalousie sein.')
        nw = {'cover_type': cover_type, 'id': i, 'name': label(w['name']), 'cover': cover,
              'enabled': boolean(w.get('enabled'), True),
              'contacts': []}
        for contact in w.get('contacts', []):
            state = contact.get('open_state', 'on')
            if not isinstance(state, str) or state in ('unknown', 'unavailable', '') or len(state) > 60:
                raise ValueError('Ungültiger Offen-Zustand.')
            nw['contacts'].append({'entity': entity(contact['entity'], '(?:binary_sensor|sensor|input_boolean)'),
                                   'open_state': state, 'policy': policy(contact.get('policy', 'defer'))})
        if len(nw['contacts']) > 10:
            raise ValueError('Maximal zehn Kontakte je Fenster.')
        rules = w.get('sensor_rules', [])
        if not isinstance(rules, list) or len(rules) > 20:
            raise ValueError('Maximal 20 Sensorregeln je Fenster.')
        nw['sensor_rules'] = []
        rule_ids = set()
        for gate in rules:
            rule_id = ident(gate['id'])
            if rule_id in rule_ids:
                raise ValueError('Sensorregel-ID je Fenster muss eindeutig sein.')
            rule_ids.add(rule_id)
            lux = entity(gate['lux_entity'], 'sensor') if gate.get('lux_entity') else None
            temp = entity(gate['temp_entity'], 'sensor') if gate.get('temp_entity') else None
            if not lux and not temp:
                raise ValueError('Mindestens einen Temperatur- oder Helligkeitssensor je Regel auswählen.')
            rule = {'id': rule_id, 'name': label(gate['name']), 'lux_entity': lux, 'temp_entity': temp}
            nw['sensor_rules'].append(rule)
        c['windows'].append(nw)
    program_ids, ride_ids = set(), set()
    for p in raw.get('programs', []):
        pid = ident(p['id'])
        if pid in program_ids:
            raise ValueError('Programm-ID doppelt.')
        program_ids.add(pid)
        days = p.get('days', list(range(7)))
        if not isinstance(days, list) or any(type(d) is not int or d not in range(7) for d in days):
            raise ValueError('Wochentage müssen 0 bis 6 sein.')
        kind = p.get('kind', 'time')
        if kind not in ('time', 'sensor'):
            raise ValueError('Programmtyp ungültig.')
        np = {'id': pid, 'name': label(p['name']), 'kind': kind, 'days': sorted(set(days)),
              'enabled': boolean(p.get('enabled'), True),
              'pause_in_vacation': boolean(p.get('pause_in_vacation'), True), 'rides': []}
        if kind == 'sensor':
            np['season'] = normalize_season(p.get('season'))
            np['start_on_high'] = boolean(p.get('start_on_high'))
            np['sensor_mode'] = p.get('sensor_mode', 'climate')
            if np['sensor_mode'] not in ('climate', 'opening'):
                raise ValueError('Sensorprogramm-Art ungültig.')
            if np['sensor_mode'] == 'opening':
                np['opening_start'] = clock(p.get('opening_start', '00:00'))
                np['opening_end'] = clock(p.get('opening_end', '23:59'))
            else:
                cond = p.get('conditions', {})
                if not isinstance(cond, dict) or cond.get('mode', 'lux') not in ('lux', 'temp', 'both'):
                    raise ValueError('Beschattungsbedingungen ungültig.')
                np['conditions'] = {'mode': cond.get('mode', 'lux'),
                    'lux_on': number(cond.get('lux_on', 30000), 0, 1000000), 'lux_off': number(cond.get('lux_off', 20000), 0, 1000000),
                    'temp_on': number(cond.get('temp_on', 25), -50, 80), 'temp_off': number(cond.get('temp_off', 23), -50, 80),
                    'on_delay_seconds': number(cond.get('on_delay_seconds', 0), 0, 86400),
                    'release_delay_seconds': number(cond.get('release_delay_seconds', 300), 0, 86400)}
                if ((np['conditions']['mode'] in ('lux', 'both') and np['conditions']['lux_off'] >= np['conditions']['lux_on']) or
                    (np['conditions']['mode'] in ('temp', 'both') and np['conditions']['temp_off'] >= np['conditions']['temp_on'])):
                    raise ValueError('Freigabeschwellen müssen kleiner als Aktivierungsschwellen sein.')
                np['start'] = clock(p.get('start', '00:00')); np['end'] = clock(p.get('end', '00:00'))
                np['end_action'] = p.get('end_action', 'schedule')
                if np['end_action'] not in ('fixed', 'schedule', 'restore', 'keep'):
                    raise ValueError('Ungültige Abschlussaktion.')
        rides = p.get('rides', [])
        if not isinstance(rides, list) or len(rides) > 100:
            raise ValueError('Maximal 100 Fahrten je Programm.')
        for r in rides:
            rid = ident(r['id'])
            if rid in ride_ids:
                raise ValueError('Fahrt-ID doppelt.')
            ride_ids.add(rid)
            targets = r.get('targets', [])
            if not isinstance(targets, list) or len(targets) != 1 or targets[0] not in ids:
                raise ValueError('Jede Fahrt benötigt genau einen gültigen Rollladen.')
            window = next(w for w in c['windows'] if w['id'] == targets[0])
            nr = {'id': rid, 'name': window['name'], 'targets': targets,
                  'enabled': boolean(r.get('enabled'), True),
                  'skip_next': boolean(r.get('skip_next'))}
            for attr in ('position', 'tilt'):
                nr[attr] = None if r.get(attr) is None else number(r[attr], 0, 100)
            if window['cover_type'] == 'shutter':
                nr['tilt'] = None
            release = kind == 'sensor' and np.get('sensor_mode') == 'climate' and r.get('edge', 'active') == 'inactive'
            restore = release and np['end_action'] in ('schedule', 'restore')
            if nr['position'] is None and nr['tilt'] is None and not restore:
                raise ValueError('Fahrt benötigt Höhe oder Lamellenposition. Bei Rollläden ist eine Höhe erforderlich.')
            if kind == 'time':
                event = r.get('event', 'fixed')
                if event not in ('fixed', 'sunrise', 'sunset'):
                    raise ValueError('Zeitereignis ungültig.')
                nr.update(event=event, time=clock(r.get('time', '07:00')),
                          offset=number(r.get('offset', 0), -720, 720),
                          earliest=clock(r.get('earliest', '00:00')),
                          latest=clock(r.get('latest', '23:59')))
                if nr['earliest'] > nr['latest']:
                    raise ValueError('Frühestens muss vor spätestens liegen (kein Zeitfenster über Mitternacht).')
            elif np.get('sensor_mode') == 'opening':
                if not window['contacts']:
                    raise ValueError('Für ein Öffnungsprogramm einen Rollladen mit zugewiesenem Öffnungskontakt auswählen.')
                if nr['position'] is None:
                    raise ValueError('Für ein Öffnungsprogramm eine Zielhöhe festlegen.')
                nr['edge'] = 'opening'
            else:
                edge = r.get('edge', 'active')
                if edge not in ('active', 'inactive'):
                    raise ValueError('Sensorauslöser ungültig.')
                nr['edge'] = edge
                rule_id = r.get('sensor_rule')
                if not rule_id and len(window['sensor_rules']) == 1:
                    rule_id = window['sensor_rules'][0]['id']
                if rule_id not in {rule['id'] for rule in window['sensor_rules']}:
                    raise ValueError('Eine vorhandene Sensorregel für das Zielfenster auswählen.')
                nr['sensor_rule'] = rule_id
                binding = next(g for g in window['sensor_rules'] if g['id'] == rule_id)
                needed = ('lux', 'temp') if np['conditions']['mode'] == 'both' else (np['conditions']['mode'],)
                if any(not binding.get(axis+'_entity') for axis in needed):
                    raise ValueError('Dem Rollladen fehlen Sensoren für die gewählten Programmbedingungen.')
                nr['restore_schedule'] = release and np['end_action'] == 'schedule'
                nr['restore_before'] = release and np['end_action'] == 'restore'
                if restore:
                    nr['position'] = None; nr['tilt'] = None
            np['rides'].append(nr)
        if kind == 'sensor' and np['sensor_mode'] == 'climate':
            np['targets'] = list(dict.fromkeys(t for ride in np['rides'] for t in ride['targets']))
            selected = {}
            for ride in np['rides']:
                target = ride['targets'][0]
                if target in selected and selected[target] != ride['sensor_rule']:
                    raise ValueError('Je Fenster im Programm dieselbe Sensorregel für Aktivierung und Freigabe wählen.')
                selected[target] = ride['sensor_rule']
        c['programs'].append(np)
    # No hidden priority between two competing sensor programs or simultaneous rides.
    slots = {}
    for p in c['programs']:
        if p.get('sensor_mode') == 'opening':
            targets = [r['targets'][0] for r in p['rides'] if r['enabled']]
            if len(targets) != len(set(targets)):
                raise ValueError('Je Öffnungsprogramm nur eine Fahrt pro Rollladen anlegen.')
            continue
        for r in p['rides']:
            for t in r['targets']:
                for day in p['days']:
                    key = (day, t, p['kind'], r.get('edge') if p['kind'] == 'sensor' else
                           (r['event'], r['time'] if r['event'] == 'fixed' else r['offset'], r['earliest'], r['latest']))
                    if p['enabled'] and r['enabled']:
                        for previous in slots.get(key, []):
                            if p['kind'] != 'sensor' or p['id'] == previous['id']:
                                raise ValueError('Mehrere gleichzeitige Fahrten für dasselbe Fenster. Bitte zusammenfassen.')
                        slots.setdefault(key, []).append(p)
    sensor_programs = [p for p in c['programs'] if p['kind'] == 'sensor' and p.get('sensor_mode') == 'climate' and p['enabled']]
    for index, first in enumerate(sensor_programs):
        for second in sensor_programs[index+1:]:
            left = {r['targets'][0]: r['sensor_rule'] for r in first['rides'] if r['enabled']}
            right = {r['targets'][0]: r['sensor_rule'] for r in second['rides'] if r['enabled']}
            if left.keys() & right.keys() and calendars_overlap(first, second):
                raise ValueError('Mehrere gleichzeitige Fahrten in Beschattungsprogrammen für denselben Rollladen. Tage, Zeitfenster oder Saison trennen.')
    opening_programs = [p for p in c['programs'] if p.get('sensor_mode') == 'opening' and p['enabled']]
    def segments(p):
        start = int(p['opening_start'][:2])*60+int(p['opening_start'][3:])
        end = int(p['opening_end'][:2])*60+int(p['opening_end'][3:])+1
        result = []
        for day in p['days']:
            low, high = day*1440+start, day*1440+end+(1440 if end <= start else 0)
            result.extend([(low, min(high, 10080), day)]+([(0, high-10080, day)] if high > 10080 else []))
        return result
    def season_shift_overlap(first, second, shift):
        # Include a leap and a regular year: overnight anchors may lie on
        # opposite sides of a season boundary, including February 28/29.
        start = datetime(2000,1,1).date()
        return any(in_season(first, start+timedelta(days=n)) and
                   in_season(second, start+timedelta(days=n-shift)) for n in range(731))
    for index, first in enumerate(opening_programs):
        for second in opening_programs[index+1:]:
            targets = {r['targets'][0] for r in first['rides'] if r['enabled']} & {r['targets'][0] for r in second['rides'] if r['enabled']}
            shifts = {(x-y+3)%7-3 for a,b,x in segments(first) for c,d,y in segments(second) if max(a,c) < min(b,d)} if targets else set()
            if any(season_shift_overlap(first['season'],second['season'],shift) for shift in shifts):
                raise ValueError('Öffnungsprogramme für denselben Rollladen dürfen sich zeitlich nicht überschneiden.')
    return c


def stamp(dt):
    return dt.astimezone(UTC).isoformat()


class Engine:
    def __init__(self, config=None, runtime=None, tz='Europe/Berlin'):
        source, migration = split_legacy_rides(config or empty_config())
        source, sensor_migration = migrate_sensor_config(source)
        source, program_migration = migrate_program_conditions(source)
        self.config = validate_config(source)
        self.rt = deepcopy(runtime or {})
        for k, v in {'pending': {}, 'history': [], 'climate': {}, 'edges': {}, 'opening_edges': {}, 'opening_holds': {}, 'claimed': [], 'skipped_occurrences': {}, 'contact_skips': {}, 'time_results': {}, 'shading': {}, 'sensor_pauses': {}, 'rule_states': {}, 'one_time': []}.items():
            self.rt.setdefault(k, deepcopy(v))
        if 'command_results' not in self.rt:
            # Retain available results from older versions without inventing targets.
            self.rt['command_results'] = [deepcopy(row) for row in reversed(self.rt['history'])
                if row.get('window') and row.get('kind') in ('done', 'error')]
        self.migrate_runtime(migration)
        for wid, item in sensor_migration.items():
            old = self.rt['shading'].get(wid)
            if old:
                self.rt['rule_states'][wid+':'+item['rule']] = deepcopy(old)
            date = self.rt['sensor_pauses'].pop('window:'+wid, None)
            if date:
                self.rt['sensor_pauses']['program:'+item['program']] = date
            slots = self.rt['pending'].get(wid, {})
            intent = slots.pop('shade', None)
            if intent:
                phase = 'release' if intent['ride'] == 'release' else 'active'
                if phase not in item:continue
                intent.update(kind='sensor', program=item['program'], ride=item[phase], sensor_rule=item['rule'])
                slots['sensor'] = intent
        # Older explicit sensor intents predate the selected-rule reference.
        for slots in self.rt['pending'].values():
            intent = slots.get('sensor')
            if intent and not intent.get('sensor_rule'):
                program = next((p for p in self.config['programs'] if p['id'] == intent['program']), None)
                ride = next((r for r in program['rides'] if r['id'] == intent['ride']), None) if program else None
                if ride:
                    intent['sensor_rule'] = ride['sensor_rule']
        for slots in self.rt['pending'].values():
            for intent in slots.values():
                intent.pop('expires', None)  # Legacy deadlines no longer expire goals.
        # Map persisted legacy sensor state and pending work to the program owner.
        old_states = deepcopy(self.rt['rule_states'])
        for program in self.config['programs']:
            if program.get('sensor_mode') != 'climate': continue
            for ride in program['rides']:
                for wid in ride['targets']:
                    key = wid+':'+program['id']
                    old_key = wid+':'+ride['sensor_rule']
                    if key not in self.rt['rule_states'] and old_key in old_states:
                        self.rt['rule_states'][key] = deepcopy(old_states[old_key])
                    for intent in self.rt['pending'].get(wid, {}).values():
                        if intent.get('kind') == 'sensor' and intent.get('ride') == ride['id']:
                            intent['program'] = program['id']
        for item in program_migration:
            old_pause = 'program:'+str(item['old_program'])
            if old_pause in self.rt['sensor_pauses']:
                self.rt['sensor_pauses']['program:'+item['program']] = self.rt['sensor_pauses'][old_pause]
        valid_keys = {t+':'+p['id'] for p in self.config['programs'] if p.get('sensor_mode') == 'climate' for r in p['rides'] for t in r['targets']}
        self.rt['rule_states'] = {k:v for k,v in self.rt['rule_states'].items() if k in valid_keys}
        self.zone = ZoneInfo(tz)
        self.last = None

    def migrate_runtime(self, mapping):
        if not mapping:
            return
        by_old = {}
        for (_, old, _), new in mapping.items():
            by_old.setdefault(old, set()).add(new)
        def expanded(key):
            prefix, _, old = key.rpartition(':')
            return [prefix+':'+new for new in sorted(by_old[old])] if old in by_old else [key]
        self.rt['claimed'] = list(dict.fromkeys(k for key in self.rt['claimed'] for k in expanded(key)))[-2000:]
        self.rt['skipped_occurrences'] = {new: deepcopy(value) for key, value in self.rt['skipped_occurrences'].items() for new in expanded(key)}
        for wid, slots in self.rt['pending'].items():
            for intent in slots.values():
                new = mapping.get((intent['program'], intent['ride'], wid))
                if new is None:
                    continue
                old_occurrence = self.occurrence(intent)
                new_occurrence = old_occurrence.rsplit(':', 1)[0]+':'+new
                intent.update(ride=new, occurrence=new_occurrence, id=new_occurrence+':'+wid)
                program = next((p for p in self.config['programs'] if p['id'] == intent['program']), None)
                if program and wid in self.windows():
                    intent['name'] = program['name']+' / '+self.windows()[wid]['name']
        edges = {}
        for key, value in self.rt['edges'].items():
            old, _, target = key.rpartition(':')
            new = next((new for (_, rid, wid), new in mapping.items() if rid == old and wid == target), old)
            edges[new+':'+target] = value
        self.rt['edges'] = edges

    def log(self, now, kind, message, **extra):
        self.rt['history'].insert(0, {'time': stamp(now), 'kind': kind, 'message': message, **extra})
        del self.rt['history'][100:]

    def command_results_today(self, now):
        """Return completed attempts for the HA local date in execution order."""
        today = now.astimezone(self.zone).date()
        def current(row):
            try:
                return datetime.fromisoformat(row['time']).astimezone(self.zone).date() == today
            except (KeyError, TypeError, ValueError):
                return False
        return sorted((deepcopy(row) for row in self.rt['command_results'] if current(row)), key=lambda row: row['time'])

    def expire_command_results(self, now):
        day = self.zone.key+':'+str(now.astimezone(self.zone).date())
        if self.rt.get('command_results_day') != day:
            self.rt['command_results'] = self.command_results_today(now)
            self.rt['command_results_day'] = day

    def windows(self):
        return {w['id']: w for w in self.config['windows']}

    def replace_config(self, config, now, solar=None):
        old_windows = self.windows()
        old_programs = {p['id']: p for p in self.config['programs']}
        self.config = validate_config(config)
        windows = self.windows()
        programs = {p['id']: p for p in self.config['programs']}
        def ride_rule(ride):
            return {key: value for key, value in ride.items() if key not in ('name', 'skip_next')}
        # Renaming/importing another window must not destroy a waiting movement.
        # Explicitly removing, disabling or changing that movement does cancel it.
        for wid, slots in list(self.rt['pending'].items()):
            if wid not in windows or not windows[wid]['enabled'] or not self.config['enabled'] or windows[wid]['cover'] != old_windows.get(wid, {}).get('cover'):
                self.rt['pending'].pop(wid, None); continue
            for kind, intent in list(slots.items()):
                if kind == 'opening':
                    continue  # A latched opening keeps priority until all contacts close.
                if kind == 'shade':
                    gate = windows[wid].get('climate')
                    if not gate or not gate['auto_shade']:
                        slots.pop(kind)
                    continue
                p, old_p = programs.get(intent['program']), old_programs.get(intent['program'])
                r = next((r for r in p['rides'] if r['id'] == intent['ride']), None) if p else None
                old_r = next((r for r in old_p['rides'] if r['id'] == intent['ride']), None) if old_p else None
                if (not p or not self.execution_enabled(p, now) or not r or not r['enabled'] or not old_r or
                        p['days'] != old_p['days'] or ride_rule(r) != ride_rule(old_r)):
                    slots.pop(kind); continue
                if kind == 'sensor':
                    new_rule = self.rule(wid, r['sensor_rule'], p['id'])
                    old_rule = self.combined_rule(next((g for g in old_windows.get(wid, {}).get('sensor_rules', []) if g['id'] == old_r.get('sensor_rule')), None), old_p)
                    if {k:v for k,v in (new_rule or {}).items() if k != 'name'} != {k:v for k,v in (old_rule or {}).items() if k != 'name'}:
                        slots.pop(kind); continue
                intent['name'] = p['name']+' / '+windows[wid]['name']
        previous_edges = self.rt['edges']
        self.rt['edges'] = {}
        for program in self.config['programs']:
            old_program = old_programs.get(program['id'])
            if not old_program or program['kind'] != 'sensor' or program.get('sensor_mode') == 'opening':continue
            for ride in program['rides']:
                old_ride = next((r for r in old_program['rides'] if r['id'] == ride['id']), None)
                if old_ride and ride_rule(ride) == ride_rule(old_ride) and all(program.get(k) == old_program.get(k) for k in ('conditions', 'start', 'end', 'end_action', 'days', 'season')):
                    for wid in ride['targets']:
                        gate = self.rule(wid, ride['sensor_rule'], program['id'])
                        old_gate = self.combined_rule(next((g for g in old_windows.get(wid, {}).get('sensor_rules', []) if g['id'] == ride['sensor_rule']), None), old_program)
                        if windows[wid]['cover'] == old_windows.get(wid, {}).get('cover') and {k:v for k,v in (gate or {}).items() if k != 'name'} == {k:v for k,v in (old_gate or {}).items() if k != 'name'}:
                            key = ride['id']+':'+wid
                            if key in previous_edges:self.rt['edges'][key] = previous_edges[key]
        self.rt['climate'].clear()
        self.rt['opening_holds'] = {wid: hold for wid, hold in self.rt['opening_holds'].items()
                                   if wid in windows and windows[wid]['enabled'] and windows[wid]['cover'] == hold['cover']}
        keys = {wid+':'+p['id'] for p in self.config['programs'] if p.get('sensor_mode') == 'climate' for r in p['rides'] for wid in r['targets']}
        self.rt['rule_states'] = {key:state for key,state in self.rt['rule_states'].items() if key in keys}
        for program in self.config['programs']:
            if program.get('sensor_mode') != 'climate': continue
            old_program = old_programs.get(program['id'])
            for ride in program['rides']:
                wid = ride['targets'][0]; key = wid+':'+program['id']
                gate = next((g for g in windows[wid]['sensor_rules'] if g['id'] == ride['sensor_rule']), None)
                old_gate = next((g for g in old_windows.get(wid, {}).get('sensor_rules', []) if g['id'] == ride['sensor_rule']), None)
                if windows[wid]['cover'] != old_windows.get(wid, {}).get('cover') or any((gate or {}).get(k) != (old_gate or {}).get(k) for k in ('lux_entity','temp_entity')):
                    self.rt['rule_states'].pop(key, None)
                elif old_program and any(program.get(k) != old_program.get(k) for k in ('conditions','start','end','days','season')) and key in self.rt['rule_states']:
                    self.rt['rule_states'][key].update(high_since=None, low_since=None)
        self.rearm_future_time_occurrences(now, solar or getattr(self, '_solar', lambda *_: None))
        self.last = now
        self.log(now, 'config', 'Konfiguration gespeichert; unveränderte wartende Fahrten bleiben erhalten.')

    def rearm_future_time_occurrences(self, now, solar):
        """Repair day/ride claims retained after moving an execution into the future.

        A claim without an intent at the newly configured future due time belongs
        to an older execution. Keep matching pending work and genuine future skips.
        Never rearm a past time or issue motor commands from this repair.
        """
        day = now.astimezone(self.zone).date()
        claimed = set(self.rt['claimed'])
        for program in self.config['programs']:
            if program['kind'] != 'time':
                continue
            for ride in program['rides']:
                key = f"{day}:{ride['id']}"
                if key not in claimed:
                    continue
                due = self.due(ride, day, solar)
                if due is None or due <= now:
                    continue
                pending = [(slots, slots['time']) for slots in self.rt['pending'].values()
                           if 'time' in slots and self.occurrence(slots['time']) == key]
                if any(datetime.fromisoformat(intent.get('scheduled') or intent['created']) == due for _, intent in pending):
                    continue
                for slots, _ in pending:
                    slots.pop('time', None)
                self.rt['claimed'] = [item for item in self.rt['claimed'] if item != key]
                self.rt['skipped_occurrences'].pop(key, None)
                self.rt['time_results'].pop(key, None)
                self.rt['contact_skips'] = {item: value for item, value in self.rt['contact_skips'].items()
                                           if self.occurrence(value['intent']) != key}
                self.log(now, 'setting', f"{program['name']} / {ride['name']}: geänderte zukünftige Fahrt neu eingeplant", program=program['id'])

    def due(self, ride, day, solar):
        # Round trips normalize the nonexistent spring-forward hour.
        # Ambiguous autumn times use the first occurrence (fold=0), once per date.
        def local_clock(value):
            return datetime.combine(day, time.fromisoformat(value), self.zone).astimezone(UTC).astimezone(self.zone)
        low = local_clock(ride['earliest'])
        high = local_clock(ride['latest'])
        if ride['event'] == 'fixed':
            event = local_clock(ride['time'])
        else:
            event = solar(ride['event'], day)
            if event is None:
                return None
            event = (event.astimezone(UTC) + timedelta(minutes=ride['offset'])).astimezone(self.zone)
        return max(low, min(high, event)).astimezone(UTC)

    def execution_enabled(self, program, now=None):
        available = self.config['enabled'] and program['enabled'] and not (self.config['vacation'] and program['pause_in_vacation'])
        if available and program['kind'] == 'sensor' and program.get('sensor_mode') != 'opening' and now is not None:
            available = self.eligible(program, now)
        return bool(available)

    def climate_day(self, program, now):
        local = now.astimezone(self.zone); clock = local.strftime('%H:%M'); day = local.date()
        start, end = program.get('start', '00:00'), program.get('end', '00:00')
        if start == end: return day
        if start < end: return day if start <= clock < end else None
        if clock >= start: return day
        return day-timedelta(days=1) if clock < end else None

    def climate_calendar(self, program, now):
        day = self.climate_day(program, now)
        return day is not None and day.weekday() in program['days'] and in_season(program.get('season'), day)

    def climate_enabled(self, program, now):
        return bool(self.config['enabled'] and program['enabled'] and
                    not (self.config['vacation'] and program['pause_in_vacation']) and
                    not self.sensor_paused('program:'+program['id'], now))

    def eligible(self, program, now):
        if program.get('sensor_mode') == 'climate':
            return self.climate_enabled(program, now) and self.climate_calendar(program, now)
        if program.get('sensor_mode') == 'opening':
            return self.opening_eligible(program, now)
        return self.execution_enabled(program, now) and now.astimezone(self.zone).weekday() in program['days']

    def opening_eligible(self, program, now, check_pause=True):
        local = now.astimezone(self.zone)
        clock = local.strftime('%H:%M'); day = local.date()
        start, end = program['opening_start'], program['opening_end']
        if start <= end:
            inside = start <= clock <= end
        else:
            inside = clock >= start or clock <= end
            if clock <= end:
                day -= timedelta(days=1)
        return bool(self.execution_enabled(program, now) and inside and day.weekday() in program['days']
                    and in_season(program['season'], day)
                    and (not check_pause or not self.sensor_paused('program:'+program['id'], now)))

    @staticmethod
    def combined_rule(binding, program):
        if not binding: return None
        if not program: return deepcopy(binding)
        gate = {**binding, **program.get('conditions', {})}
        if gate.get('mode') == 'lux': gate['temp_entity'] = None
        if gate.get('mode') == 'temp': gate['lux_entity'] = None
        return gate

    def rule(self, window_id, rule_id, program_id=None):
        binding = next((g for g in self.windows()[window_id]['sensor_rules'] if g['id'] == rule_id), None)
        program = next((p for p in self.config['programs'] if p.get('sensor_mode') == 'climate' and
                        (p['id'] == program_id if program_id is not None else any(r['targets'] == [window_id] and r['sensor_rule'] == rule_id for r in p['rides']))), None)
        return self.combined_rule(binding, program)

    @staticmethod
    def blocking_contacts(window, states):
        return [{'entity': c['entity'], 'unavailable': states.get(c['entity'], {}).get('state', 'unknown') in ('unknown', 'unavailable', ''), 'policy': c['policy']}
                for c in window['contacts'] if c['policy'] != 'drive'
                and states.get(c['entity'], {}).get('state', 'unknown') in (c['open_state'], 'unknown', 'unavailable', '')]

    @staticmethod
    def opening_state(window, states):
        values = [states.get(c['entity'], {}).get('state', 'unknown') for c in window['contacts']]
        if any(value == c['open_state'] for c, value in zip(window['contacts'], values)):
            return True
        if any(value in ('unknown', 'unavailable', '') for value in values):
            return None
        return False

    def opening_restore_goal(self, window, hold, now, climates, missed_time=None):
        if climates.get(window['id']) is None:
            return {}, 'Sensorwerte nicht verfügbar'
        for program in self.config['programs']:
            if program['kind'] != 'sensor' or program.get('sensor_mode') == 'opening' or not self.eligible(program, now):
                continue
            for ride in program['rides']:
                if (ride['enabled'] and ride['targets'] == [window['id']] and ride['edge'] == 'active'
                        and climates.get(window['id']+':'+program['id']) is True):
                    return {axis: ride[axis] for axis in ('position', 'tilt')}, ''
        # Only a still-pending time action is a missed schedule. A previously
        # completed schedule must not overwrite a manual position captured when
        # the opening hold began.
        if missed_time:
            return {axis: missed_time.get(axis) if missed_time.get(axis) is not None
                    else hold['before'].get(axis) for axis in ('position', 'tilt')}, ''
        return deepcopy(hold['before']), ''

    def opening_intent(self, window, hold, now, goal, phase, reason=''):
        occurrence = hold['occurrence']+':'+phase
        return {'id': occurrence+':'+str(goal.get('position'))+':'+str(goal.get('tilt'))+':'+window['id'],
                'occurrence': occurrence, 'program': hold['program'], 'ride': hold['ride'], 'window': window['id'],
                'name': hold['name']+(' / Öffnen' if phase == 'active' else ' / Rückkehr'),
                'kind': 'opening', 'phase': phase, 'position': goal.get('position'), 'tilt': goal.get('tilt'),
                'created': hold['started'], 'scheduled': hold.get('released', hold['started']),
                'reason': reason, 'restore_reason': reason}

    def update_opening(self, now, states, climates, solar):
        windows = self.windows()
        # Existing latches survive day/window/season changes. Only a confirmed
        # closed state releases their priority; unknown is never closed.
        for wid, hold in list(self.rt['opening_holds'].items()):
            window = windows.get(wid)
            if not window or not window['enabled'] or window['cover'] != hold['cover']:
                self.rt['opening_holds'].pop(wid)
                self.rt['pending'].get(wid, {}).pop('opening', None)
                continue
            opened = self.opening_state(window, states)
            if hold['phase'] == 'active' and opened is False:
                hold.update(phase='release', released=stamp(now))
                self.rt['pending'].get(wid, {}).pop('opening', None)
            elif hold['phase'] == 'release' and opened is True:
                # Reopening interrupts a return, including a return still waiting
                # for a device or sensor. Preserve the original fallback position.
                hold['phase'] = 'active'
                self.rt['pending'].setdefault(wid, {})['opening'] = self.opening_intent(window, hold, now, hold, 'active')

        for program in self.config['programs']:
            if program.get('sensor_mode') != 'opening':
                continue
            for ride in program['rides']:
                wid = ride['targets'][0]; window = windows[wid]
                opened = self.opening_state(window, states)
                if opened is None:
                    continue
                key = ride['id']+':'+wid
                previous = self.rt['opening_edges'].get(key)
                eligible = self.eligible(program, now)
                was_eligible = self.rt['opening_edges'].get(key+':eligible')
                self.rt['opening_edges'][key] = opened
                self.rt['opening_edges'][key+':eligible'] = eligible
                if (not opened or not ride['enabled'] or not window['enabled'] or not eligible
                        or wid in self.rt['opening_holds']
                        or not (previous is False or (not was_eligible and program['start_on_high']))):
                    continue
                if ride['skip_next']:
                    ride['skip_next'] = False
                    self.log(now, 'skipped', program['name']+': nächste Öffnung ausgelassen', program=program['id'])
                    continue
                attrs = states.get(window['cover'], {}).get('attributes', {})
                # Ignore malformed readings rather than persisting NaN or values
                # that can never be used as legal return positions.
                before = {}
                for axis, attr in [('position', 'current_position'), ('tilt', 'current_tilt_position')]:
                    value = attrs.get(attr)
                    if isinstance(value, (int,float)) and not isinstance(value,bool) and math.isfinite(value) and 0 <= value <= 100:
                        before[axis] = value
                if window['cover_type'] == 'shutter':
                    before.pop('tilt', None)
                hold = {'program': program['id'], 'ride': ride['id'], 'name': program['name'],
                        'cover': window['cover'], 'phase': 'active', 'before': before,
                        'position': ride['position'], 'tilt': ride['tilt'], 'started': stamp(now),
                        'occurrence': stamp(now)+':'+ride['id']}
                self.rt['opening_holds'][wid] = hold
                self.rt['pending'].setdefault(wid, {})['opening'] = self.opening_intent(window, hold, now, hold, 'active')

        for wid, hold in list(self.rt['opening_holds'].items()):
            if hold['phase'] != 'release':
                continue
            window = windows[wid]
            slots = self.rt['pending'].setdefault(wid, {})
            retry_return = hold.get('return_reason') == 'Sensorwerte nicht verfügbar' and climates.get(wid) is not None
            if 'return_goal' not in hold or retry_return:
                missed_time = slots.get('time')
                if missed_time and datetime.fromisoformat(missed_time.get('scheduled') or missed_time['created']) > now:
                    missed_time = None
                if missed_time and datetime.fromisoformat(missed_time.get('scheduled') or missed_time['created']) < datetime.fromisoformat(hold['started']):
                    missed_time = None
                if missed_time and any(contact.get('policy') == 'skip'
                                       for contact in missed_time.get('blocked_contacts', [])):
                    missed_time = None
                if missed_time:
                    hold['missed_time'] = deepcopy(missed_time)
                elif hold.get('missed_time'):
                    missed_time = hold['missed_time']
                goal, reason = self.opening_restore_goal(window, hold, now, climates, missed_time)
                if not reason and goal.get('position') is None and goal.get('tilt') is None:
                    slots.pop('opening', None); self.rt['opening_holds'].pop(wid)
                    self.log(now, 'error', window['name']+': keine vorherige oder geplante Rückkehrposition bekannt.', window=wid)
                    continue
                # Freeze the selected return target. Consume only the waiting
                # time action represented by that target; later due actions must
                # remain queued until this return movement finishes.
                hold['return_goal'] = deepcopy(goal)
                hold['return_reason'] = reason
                slots.pop('sensor', None)
                slots.pop('shade', None)
                if missed_time and slots.get('time', {}).get('id') == missed_time.get('id'):
                    slots.pop('time', None)
            else:
                goal = hold['return_goal']
                reason = hold.get('return_reason', '')
            slots['opening'] = self.opening_intent(window, hold, now, goal, 'release', reason)

    def guard(self, window, intent, states, climates):
        if not window['enabled']:
            return 'skip', 'Fenster deaktiviert'
        hold = self.rt['opening_holds'].get(window['id'])
        if hold and hold['phase'] == 'active':
            if intent['kind'] != 'opening':
                return 'defer', 'Öffnungsprogramm hält Position bis Fenster geschlossen'
            # Opening must bypass the very contact which triggered the upward drive.
            if states.get(window['cover'], {}).get('state', 'unknown') in ('unknown', 'unavailable', ''):
                return 'defer', 'Rollladen nicht verfügbar'
            return 'drive', ''
        if intent['kind'] == 'opening' and self.opening_state(window, states) is None:
            return 'defer', 'Öffnungskontakt nicht verfügbar'
        if intent['kind'] == 'opening' and intent.get('restore_reason'):
            return 'defer', intent['restore_reason']
        # Explicitly assigned contacts always precede the heat/brightness gate.
        decisions = []
        for c in window['contacts']:
            value = states.get(c['entity'], {}).get('state', 'unknown')
            if value == c['open_state'] or value in ('unknown', 'unavailable', ''):
                if c['policy'] != 'drive':
                    decisions.append((c['policy'], f"Fensterkontakt: {c['entity']} ({value})"))
        if decisions:
            return next((x for x in decisions if x[0] == 'skip'), decisions[0])
        if intent['kind'] == 'sensor' and climates.get(window['id']+':'+intent['program']) is None:
            return 'defer', 'Sensorwerte nicht verfügbar'
        if intent['kind'] == 'time' and climates.get(window['id']) is None:
            return 'defer', 'Sensorwerte nicht verfügbar'
        if intent['kind'] == 'time' and self.shading_blocking(window['id']):
            return 'defer', 'Beschattung aktiv'
        cover = states.get(window['cover'], {})
        if cover.get('state', 'unknown') in ('unknown', 'unavailable', ''):
            return 'defer', 'Rollladen nicht verfügbar'
        return 'drive', ''

    def _queue(self, now, p, r, targets, key, scheduled=None):
        # Even an intentionally skipped new occurrence makes an older one obsolete.
        for target in targets:
            slots = self.rt['pending'].get(target, {})
            old = slots.pop(p['kind'], None)
            if p['kind'] == 'time' and not self.shading_blocking(target):
                # An older release must not run after a newer regular plan.
                slots.pop('sensor', None)
                if slots.get('shade', {}).get('ride') == 'release':
                    slots.pop('shade', None)
            elif p['kind'] == 'sensor' and r.get('edge') == 'inactive':
                slots.pop('time', None)
            if old:
                self.log(now, 'replaced', f"{self.windows()[target]['name']}: ältere wartende Fahrt ersetzt", window=target)
        if r['skip_next'] or key in self.rt['skipped_occurrences']:
            self.rt['skipped_occurrences'][key] = {'date': str(now.astimezone(self.zone).date())}
            r['skip_next'] = False
            self.log(now, 'skipped', f"{p['name']} / {r['name']}: einmal übersprungen", program=p['id'])
            return
        for target in targets:
            window = self.windows()[target]
            if not window['enabled']:
                continue
            intent = {'id': key + ':' + target, 'occurrence': key, 'program': p['id'], 'ride': r['id'], 'window': target,
                      'name': p['name'] + ' / ' + r['name'], 'kind': p['kind'],
                      'position': r['position'], 'tilt': r['tilt'], 'created': stamp(now),
                      'scheduled': stamp(scheduled or now), 'reason': ''}
            if p['kind'] == 'sensor':
                intent['sensor_rule'] = r['sensor_rule']
                if r.get('restore_schedule') or r.get('restore_before'):
                    before = self.rt['rule_states'].get(target+':'+p['id'], {}).get('before', {})
                    goal = self.current_schedule_goal(window, now, self._solar, before) if r.get('restore_schedule') else before
                    intent.update(position=goal.get('position'), tilt=goal.get('tilt'))
                    if window['cover_type'] == 'shutter':
                        intent['tilt'] = None
                    if intent['position'] is None and intent['tilt'] is None:
                        self.log(now, 'error', window['name']+': keine Position für Freigabe bekannt.', window=target)
                        continue
            if p['kind'] == 'sensor' and r.get('edge') == 'inactive' and not self.eligible(p, now):
                intent['end_of_program'] = True
            slot = self.rt['pending'].setdefault(target, {})
            slot[p['kind']] = intent

    def tick(self, now, states, solar):
        """Claim due events, update sensor transitions, and return permitted intents."""
        now = now.astimezone(UTC)
        self.expire_command_results(now)
        self.expire_sensor_pauses(now)
        windows = self.windows()
        self._solar = solar
        prior_active = {key: bool(state.get('active')) for key,state in self.rt['rule_states'].items()}
        prior_applied = {key: state.get('applied', True) for key,state in self.rt['rule_states'].items()}
        prior_timing = {key: state.get('high_since') is not None for key,state in self.rt['rule_states'].items()}
        climates = self.update_shading(now, states, {}, solar)
        previous = self.last
        self.last = now
        # New events are not replayed indiscriminately after an outage. Existing
        # pending goals are reconciled against any newer scheduled occurrence below.
        start = max(previous or now, now - timedelta(seconds=60))
        local = now.astimezone(self.zone)
        self.rt['contact_skips'] = {key: item for key, item in self.rt['contact_skips'].items()
                                    if item['date'] == str(local.date())}
        self.rt['time_results'] = {key: item for key, item in self.rt['time_results'].items()
                                   if item['date'] == str(local.date())}
        self.rt['skipped_occurrences'] = {
            key: value for key, value in self.rt['skipped_occurrences'].items()
            if str(local.date() - timedelta(days=8)) <= value.get('date', '') <= str(local.date())
        }
        events = []
        enabled_ids = {p['id'] for p in self.config['programs'] if self.execution_enabled(p, now)}
        for p in self.config['programs']:
            if p.get('sensor_mode') == 'opening':
                continue
            eligible = self.eligible(p, now)
            if p['kind'] == 'time':
                if not eligible:
                    continue
                for r in p['rides']:
                    if not r['enabled']:
                        continue
                    due = self.due(r, local.date(), solar)
                    key = f"{local.date()}:{r['id']}"
                    if due and start < due <= now and key not in self.rt['claimed']:
                        events.append((due, p, r, r['targets'], key))
            else:
                for r in p['rides']:
                    edge_targets = []
                    for target in r['targets']:
                        edgekey = f"{r['id']}:{target}"
                        rule_key = target+':'+p['id']
                        active = climates.get(rule_key, False)
                        wanted = active is (r['edge'] == 'active')
                        # First observation is a baseline, never an unexpected motor command.
                        old = self.rt['edges'].get(edgekey)
                        ended = bool(r['edge'] == 'inactive' and prior_active.get(rule_key, False) and prior_applied.get(rule_key, False) and self.climate_enabled(p, now) and not self.climate_calendar(p, now))
                        flag = bool((eligible or ended) and r['enabled'] and wanted and not (r['edge'] == 'inactive' and p.get('end_action') == 'keep'))
                        if active is None:
                            # A missing measurement must not manufacture a release edge.
                            continue
                        resumed = prior_timing.get(rule_key, False) if r['edge'] == 'active' else prior_active.get(rule_key, False)
                        if flag and not old and (old is not None or p['start_on_high'] or ended or resumed) and (r['edge'] == 'active' or prior_active.get(rule_key, False)):
                            edge_targets.append(target)
                        self.rt['edges'][edgekey] = flag
                        pending = self.rt['pending'].get(target, {}).get('sensor')
                        if pending and pending['ride'] == r['id'] and not wanted:
                            self.rt['pending'][target].pop('sensor', None)
                    if edge_targets:
                        events.append((now, p, r, edge_targets, f"{stamp(now)}:{r['id']}"))
        # A new shading window takes over directly instead of briefly returning.
        starts = {(stamp(due), target) for due,p,r,targets,key in events if p['kind'] == 'sensor' and r.get('edge') == 'active' for target in targets}
        events = [(due,p,r,[t for t in targets if not (p['kind'] == 'sensor' and r.get('edge') == 'inactive' and not self.eligible(p, now) and (stamp(due),t) in starts)],key) for due,p,r,targets,key in events]
        # Chronological order, then sensor precedence. Deterministic tie handling.
        conflicts = {}
        for due, p, r, targets, key in events:
            for target in targets:
                slot = (stamp(due), p['kind'], target)
                conflicts[slot] = conflicts.get(slot, 0) + 1
        for due, p, r, targets, key in sorted(events, key=lambda e: (e[0], e[1]['kind'] == 'sensor', e[2]['id'])):
            valid = []
            for target in targets:
                if conflicts[(stamp(due), p['kind'], target)] > 1:
                    self.rt['pending'].get(target, {}).pop(p['kind'], None)
                    self.log(now, 'error', f"{windows[target]['name']}: gleichzeitig fällige Fahrten widersprechen sich; keine Ausführung.", window=target)
                else:
                    valid.append(target)
            targets = valid
            self.rt['claimed'].append(key)
            if targets:
                self._queue(now, p, r, targets, key, scheduled=due)
        del self.rt['claimed'][:-2000]
        self.reconcile_pending_time(now, solar)
        self.update_opening(now, states, climates, solar)
        result = {}
        for target, slots in list(self.rt['pending'].items()):
            for kind, intent in list(slots.items()):
                synthetic = (intent['kind'] == 'shade' or (intent['kind'] == 'opening' and target in self.rt['opening_holds'])) and self.config['enabled']
                p = next((p for p in self.config['programs'] if p['id'] == intent['program']), None)
                end_release = bool(intent.get('end_of_program') and p and self.climate_enabled(p, now))
                if target not in windows or (not synthetic and not end_release and intent['program'] not in enabled_ids):
                    slots.pop(kind); continue
                policy, reason = self.guard(windows[target], intent, states, climates)
                intent['blocked_contacts'] = self.blocking_contacts(windows[target], states)
                if policy == 'skip':
                    if intent['blocked_contacts']:
                        self.rt['contact_skips'][intent['id']] = {'date': str(local.date()), 'intent': deepcopy({**intent, 'reason': reason})}
                    self.log(now, 'skipped', f"{windows[target]['name']}: {reason}", window=target)
                    slots.pop(kind); continue
                intent['reason'] = reason
            # An outstanding sensor action takes precedence; a blocked sensor action
            # also blocks an older time action until resolved or superseded.
            intent = slots.get('opening') or slots.get('shade') or slots.get('sensor') or slots.get('time')
            if intent and not intent['reason']:
                result[target] = deepcopy(intent)
            if not slots:
                self.rt['pending'].pop(target, None)
        for action in list(self.rt['one_time']):
            if action.get('status') == 'error':
                continue
            scheduled = datetime.fromisoformat(action['scheduled'])
            if scheduled.astimezone(self.zone).date() < local.date():
                self.rt['one_time'].remove(action)
                self.log(now, 'expired', f"{windows.get(action['target'], {}).get('name', action['target'])}: Einzelfahrt verfallen.", window=action['target'])
                continue
            if scheduled > now:
                continue
            target = action['target']
            window = windows.get(target)
            if not window or not window['enabled']:
                action.update(status='pending', reason='Rollladen deaktiviert')
                continue
            intent = {'id': action['id'], 'occurrence': action['id'], 'program': '__one_time__',
                      'ride': action['id'], 'window': target, 'name': 'Einzelfahrt', 'kind': 'time',
                      'one_time': True, 'position': action['position'], 'tilt': action.get('tilt'),
                      'created': action['created'], 'scheduled': action['scheduled'], 'reason': ''}
            policy, reason = self.guard(window, intent, states, climates)
            if policy == 'skip':
                self.rt['one_time'].remove(action)
                self.log(now, 'skipped', window['name']+': Einzelfahrt wegen Öffnungskontakt ausgelassen.', window=target)
                continue
            action.update(status='pending' if reason else 'moving', reason=reason)
            if not reason:
                result[target] = deepcopy(intent)
        return result

    def reconcile_pending_time(self, now, solar):
        """A newer planned occurrence supersedes a deferred goal, even across restarts.

        This only processes windows which already have a pending time occurrence.
        Weekly recurrence needs at most eight local dates to identify the latest one.
        """
        day = now.astimezone(self.zone).date()
        for target, slots in list(self.rt['pending'].items()):
            old = slots.get('time')
            if not old or target not in self.windows():
                continue
            since = datetime.fromisoformat(old.get('scheduled') or old['created'])
            candidates = []
            for days_back in range(8):
                date = day - timedelta(days=days_back)
                for p in self.config['programs']:
                    if p['kind'] != 'time' or not self.execution_enabled(p, now) or date.weekday() not in p['days']:
                        continue
                    for r in p['rides']:
                        if not r['enabled'] or target not in r['targets']:
                            continue
                        due = self.due(r, date, solar)
                        if due and since < due <= now:
                            candidates.append((due, p, r, f"{date}:{r['id']}"))
            if not candidates:
                continue
            latest = max(item[0] for item in candidates)
            due_rows = [item for item in candidates if item[0] == latest]
            if len(due_rows) != 1:
                slots.pop('time', None)
                self.log(now, 'error', self.windows()[target]['name']+': widersprüchliche neuere Zeitfahrten.', window=target)
                continue
            due, p, r, key = due_rows[0]
            if key in self.rt['claimed']:
                slots.pop('time', None)  # Already closed; never resurrect the older goal.
                continue
            self.rt['claimed'].append(key)
            self._queue(now, p, r, [target], key, scheduled=due)
        del self.rt['claimed'][:-2000]

    def finish(self, target, intent, now, error=None):
        slots = self.rt['pending'].get(target, {})
        current = slots.get(intent['kind'])
        if current and current['id'] == intent['id']:
            slots.pop(intent['kind'])
        if intent['kind'] == 'opening' and intent.get('phase') == 'release':
            self.rt['opening_holds'].pop(target, None)
        if intent['kind'] == 'sensor' and not error:
            program = next((p for p in self.config['programs'] if p['id'] == intent['program']), None)
            ride = next((r for r in program['rides'] if r['id'] == intent['ride']), None) if program else None
            state = self.rt['rule_states'].get(target+':'+intent['program'])
            if ride and state is not None:
                state['applied'] = ride.get('edge') == 'active'
        if intent['kind'] == 'time':
            scheduled = datetime.fromisoformat(intent.get('scheduled') or intent['created'])
            self.rt['time_results'][self.occurrence(intent)] = {
                'date': str(scheduled.astimezone(self.zone).date()),
                'status': 'error' if error else 'done', 'reason': str(error) if error else ''}
        if intent.get('one_time'):
            action = next((item for item in self.rt['one_time'] if item['id'] == intent['id']), None)
            if action:
                if error:
                    action.update(status='error', reason=str(error))
                else:
                    self.rt['one_time'].remove(action)
        self.expire_command_results(now)
        program = next((p for p in self.config['programs'] if p['id'] == intent['program']), None)
        command = ('Einzelfahrt' if intent.get('one_time') else
                   'Öffnen' if intent.get('phase') == 'active' else
                   'Rückkehr' if intent.get('phase') == 'release' else
                   program['name'] if program else intent['name'])
        message = f"{self.windows().get(target, {}).get('name', target)}: {error or intent['name'] + ' ausgeführt'}"
        fields = {'window': target, 'command': command, 'position': intent.get('position'),
                  'tilt': intent.get('tilt'), 'program': intent['program'], 'source': intent['kind']}
        self.rt['command_results'].append({'id': intent['id'], 'time': stamp(now),
            'kind': 'error' if error else 'done', 'message': str(error) if error else '', **fields})
        self.log(now, 'error' if error else 'done', message, **fields)

    def upcoming(self, now, solar, limit=20):
        rows = []
        for offset in range(8):
            day = now.astimezone(self.zone).date() + timedelta(days=offset)
            for p in self.config['programs']:
                probe = datetime.combine(day, time(12), self.zone)
                if p['kind'] != 'time' or not self.eligible(p, probe):
                    continue
                for r in p['rides']:
                    due = self.due(r, day, solar) if r['enabled'] else None
                    if due and due > now:
                        rows.append({'time': stamp(due), 'program': p['id'], 'ride': r['id'],
                                     'name': p['name'] + ' / ' + r['name'],
                                     'skip': r['skip_next'] or f"{day}:{r['id']}" in self.rt['skipped_occurrences'],
                                     'targets': r['targets']})
        return sorted(rows, key=lambda r: (r['time'], r['ride']))[:limit]


    @staticmethod
    def occurrence(intent):
        """Accept persisted 0.1.0 intents which had no explicit occurrence field."""
        return intent.get('occurrence') or intent['id'].rsplit(':', 1)[0]

    def planned_today(self, now, solar, states=None):
        """Future time events and outstanding carried/sensor occurrences only.

        Global OFF/vacation are displayed as pauses. Disabled programs/rides/windows
        are excluded. Completed, discarded and untracked past events are absent.
        Sensor rows only exist after an actual trigger.
        """
        day = now.astimezone(self.zone).date()
        windows = self.windows()
        rows = {}
        programs = {p['id']: p for p in self.config['programs']}

        def base(p, r, key, due, targets, status='planned'):
            return {'occurrence': key, 'program': p['id'], 'ride': r['id'],
                    'name': p['name'] + ' / ' + r['name'], 'kind': p['kind'],
                    'time': stamp(due), 'targets': targets, 'position': r['position'],
                    'tilt': r['tilt'], 'status': status, 'reason': '',
                    'skip': key in self.rt['skipped_occurrences'] or r['skip_next'],
                    'can_undo': due > now, 'carried': False}

        for p in self.config['programs']:
            if not p['enabled'] or day.weekday() not in p['days'] or p['kind'] != 'time':
                continue
            for r in p['rides']:
                targets = [t for t in r['targets'] if windows[t]['enabled']]
                if not r['enabled'] or not targets:
                    continue
                due = self.due(r, day, solar)
                key = f"{day}:{r['id']}"
                if due is None or due <= now or key in self.rt['claimed']:
                    continue
                row = base(p, r, key, due, targets)
                if not self.config['enabled']:
                    row['status'] = 'paused'; row['reason'] = 'Steuerung ausgeschaltet'
                elif self.config['vacation'] and p['pause_in_vacation']:
                    row['status'] = 'paused'; row['reason'] = 'Urlaubspause'
                elif states is not None and not row['skip']:
                    contacts = self.blocking_contacts(windows[targets[0]], states)
                    if contacts:
                        row['blocked_contacts'] = contacts
                        row['contact_preview'] = True
                rows[key] = row

        for target, slots in self.rt['pending'].items():
            if target not in windows or not windows[target]['enabled']:
                continue
            for intent in slots.values():
                created = datetime.fromisoformat(intent['created'])
                scheduled = datetime.fromisoformat(intent.get('scheduled') or intent['created'])
                carried = scheduled.astimezone(self.zone).date() < day
                if intent['kind'] in ('shade', 'opening'):
                    key = self.occurrence(intent)
                    row = rows.setdefault(key, {'occurrence': key, 'program': intent['program'], 'ride': intent['ride'],
                        'name': intent['name'], 'kind': intent['kind'], 'time': stamp(scheduled), 'targets': [],
                        'position': intent['position'], 'tilt': intent['tilt'], 'status': 'pending',
                        'reason': intent.get('reason', ''), 'skip': False, 'can_undo': False, 'carried': carried})
                    row['targets'].append(target)
                    continue
                p = programs.get(intent['program'])
                if not p or not self.execution_enabled(p, now):
                    continue
                r = next((r for r in p['rides'] if r['id'] == intent['ride'] and r['enabled']), None)
                if not r:
                    continue
                key = self.occurrence(intent)
                due = (scheduled if intent.get('scheduled') else self.due(r, created.astimezone(self.zone).date(), solar)) if p['kind'] == 'time' else created
                if due is None:
                    due = created
                row = rows.setdefault(key, base(p, r, key, due, [], 'pending'))
                if target not in row['targets']:
                    row['targets'].append(target)
                if row['status'] != 'pending':
                    row['reason'] = ''
                row['status'] = 'pending'
                row['skip'] = False  # A skip_next flag set now belongs to a future trigger.
                row['can_undo'] = False
                row['carried'] = carried
                reason = intent.get('reason', '')
                if reason and reason not in row['reason']:
                    row['reason'] = '; '.join(filter(None, [row['reason'], reason]))
                row['blocked_contacts'] = intent.get('blocked_contacts', [])
        return sorted(rows.values(), key=lambda row: (row['time'], row['name'], row['occurrence']))

    def skip_today(self, now, solar, occurrence, value):
        """Change this concrete execution only; never silently skip tomorrow."""
        row = next((r for r in self.planned_today(now, solar) if r['occurrence'] == occurrence), None)
        if row is None:
            raise ValueError('Diese Fahrt ist nicht mehr offen. Bitte aktualisieren.')
        if row['status'] == 'contact_skipped':
            raise ValueError('Diese Fahrt wurde wegen eines Öffnungskontakts verworfen und kann nicht nachgeholt werden.')
        if row['status'] in ('done', 'error', 'closed', 'missed', 'skipped'):
            raise ValueError('Diese Fahrt ist nicht mehr offen und kann nicht erneut eingeplant werden.')
        if not value and not row['can_undo']:
            raise ValueError('Eine bereits fällige Fahrt kann nicht erneut eingeplant werden.')
        if value:
            self.rt['skipped_occurrences'][occurrence] = {'date': str(now.astimezone(self.zone).date())}
            for slots in self.rt['pending'].values():
                for kind, intent in list(slots.items()):
                    if self.occurrence(intent) == occurrence:
                        slots.pop(kind)
                        if kind == 'opening' and intent.get('phase') == 'release':
                            self.rt['opening_holds'].pop(intent['window'], None)
            self.log(now, 'skipped', row['name'] + ': heutige Ausführung ausgelassen', program=row['program'])
        else:
            self.rt['skipped_occurrences'].pop(occurrence, None)
            # An existing next-trigger skip is shown in today's row as well.
            program = next(p for p in self.config['programs'] if p['id'] == row['program'])
            ride = next(r for r in program['rides'] if r['id'] == row['ride'])
            ride['skip_next'] = False
        return row


    def current_schedule_goal(self, window, now, solar, fallback):
        """Resolve the latest non-skipped time target per channel, up to one week back."""
        day = now.astimezone(self.zone).date()
        candidates = []
        for days_back in range(8):
            date = day - timedelta(days=days_back)
            for p in self.config['programs']:
                if p['kind'] != 'time' or not p['enabled'] or date.weekday() not in p['days']:
                    continue
                if self.config['vacation'] and p['pause_in_vacation']:
                    continue
                for r in p['rides']:
                    if not r['enabled'] or window['id'] not in r['targets']:
                        continue
                    due = self.due(r, date, solar)
                    key = f"{date}:{r['id']}"
                    if due is None or due > now or key in self.rt['skipped_occurrences']:
                        continue
                    candidates.append((due, r))
        goal = {}
        for attr in ('position', 'tilt'):
            values = [(due, r[attr]) for due, r in candidates if r[attr] is not None]
            if values:
                latest = max(due for due, _ in values)
                last_values = {v for due, v in values if due == latest}
                goal[attr] = last_values.pop() if len(last_values) == 1 else fallback.get(attr)
            else:
                goal[attr] = fallback.get(attr)
        return goal

    @staticmethod
    def measured_sensors(gate, states):
        values = {}
        for axis in ('lux', 'temp'):
            entity = gate.get(axis+'_entity')
            if not entity:
                continue
            try:
                value = float(states.get(entity, {}).get('state', 'unknown'))
                if not math.isfinite(value):
                    return None
                unit = states.get(entity, {}).get('attributes', {}).get('unit_of_measurement')
                if axis == 'temp':
                    if unit == '°F': value = (value-32)*5/9
                    elif unit == 'K': value -= 273.15
                    elif unit not in (None, '', '°C', 'C'): return None
                else:
                    if unit == 'klx': value *= 1000
                    elif unit not in (None, '', 'lx'): return None
                values[axis] = value
            except (TypeError, ValueError):
                return None
        return values or None

    @staticmethod
    def thresholds(gate, values):
        highs = [value >= gate[axis+'_on'] for axis, value in values.items()]
        lows = [value <= gate[axis+'_off'] for axis, value in values.items()]
        return all(highs), any(lows)

    def update_shading(self, now, states, climates, solar):
        effective = {}
        for wid, window in self.windows().items():
            any_active = False; blocks = False; unknown = False
            for program in self.config['programs']:
                if program.get('sensor_mode') != 'climate': continue
                targeted = [r for r in program['rides'] if wid in r['targets']]
                if not targeted: continue
                rides = [r for r in targeted if r['enabled']]
                key = wid+':'+program['id']
                state = self.rt['rule_states'].setdefault(key, {'active': False, 'high_since': None, 'low_since': None, 'before': {}, 'applied': False})
                if not rides or not window['enabled'] or not self.eligible(program, now):
                    state.update(active=False, high_since=None, low_since=None); effective[key] = False; continue
                gate = self.rule(wid, rides[0]['sensor_rule'], program['id'])
                blocks_rule = any(r['edge'] == 'active' for r in rides)
                values = self.measured_sensors(gate, states)
                if values is None:
                    state.update(low_since=None, high_since=None); effective[key] = None
                    unknown = unknown or blocks_rule
                else:
                    high, low = self.thresholds(gate, values)
                    if not state['active']:
                        if high:
                            if state.get('high_since') is None: state['high_since'] = stamp(now)
                            if now >= datetime.fromisoformat(state['high_since'])+timedelta(seconds=gate['on_delay_seconds']):
                                attrs = states.get(window['cover'], {}).get('attributes', {})
                                hold = self.rt['opening_holds'].get(wid)
                                before = deepcopy(hold['before']) if hold else {}
                                if not hold:
                                    for axis, attr in [('position','current_position'),('tilt','current_tilt_position')]:
                                        value = attrs.get(attr)
                                        if isinstance(value,(int,float)) and not isinstance(value,bool) and math.isfinite(value) and 0 <= value <= 100:
                                            before[axis] = value
                                    if window['cover_type'] == 'shutter': before.pop('tilt', None)
                                state.update(active=True, high_since=None, low_since=None, before=before, applied=False)
                        else: state['high_since'] = None
                    elif low:
                        if state.get('low_since') is None: state['low_since'] = stamp(now)
                        if now >= datetime.fromisoformat(state['low_since'])+timedelta(seconds=gate['release_delay_seconds']):
                            state.update(active=False, low_since=None, high_since=None)
                    else: state['low_since'] = None
                    effective[key] = bool(state['active'])
                any_active = any_active or state['active']
                blocks = blocks or (blocks_rule and state['active'])
            self.rt['shading'][wid] = {'active': bool(any_active), 'blocks_time': bool(blocks)}
            effective[wid] = None if unknown else bool(any_active)
        return effective

    def shading_blocking(self, window_id):
        state = self.rt['shading'].get(window_id, {})
        return state.get('active', False) and state.get('blocks_time', True)

    def sensor_paused(self, key, now):
        return self.rt['sensor_pauses'].get(key) == str(now.astimezone(self.zone).date())

    def reset_program_edges(self, program_id):
        program = next((p for p in self.config['programs'] if p['id'] == program_id), None)
        if program:
            for r in program['rides']:
                for target in r['targets']:
                    self.rt['edges'][r['id']+':'+target] = False

    def expire_sensor_pauses(self, now):
        today = str(now.astimezone(self.zone).date())
        for key, date in list(self.rt['sensor_pauses'].items()):
            if date != today:
                self.rt['sensor_pauses'].pop(key)
                if key.startswith('program:'):
                    self.reset_program_edges(key.split(':', 1)[1])

    def sensors_today(self, now):
        """Calendar-eligible sensor programs, including those paused for today.

        Global/vacation pauses are shown explicitly. Out-of-season or disabled
        definitions are absent; today's manual suspension remains visible for undo.
        """
        date = now.astimezone(self.zone).date()
        tomorrow = datetime.combine(date+timedelta(days=1), time.min, self.zone)
        windows = self.windows()
        rows = []
        for program in self.config['programs']:
            if program.get('sensor_mode') == 'opening':
                holds = [wid for wid, hold in self.rt['opening_holds'].items() if hold['program'] == program['id']]
                local = now.astimezone(self.zone); day = local.date()
                today = (day.weekday() in program['days'] and in_season(program['season'], day))
                if program['opening_start'] > program['opening_end']:
                    yesterday = day-timedelta(days=1)
                    today = today or (yesterday.weekday() in program['days'] and in_season(program['season'], yesterday))
                if not holds and (not program['enabled'] or not today):
                    continue
                targets = list(dict.fromkeys(holds+[r['targets'][0] for r in program['rides'] if r['enabled'] and windows[r['targets'][0]]['enabled']]))
                if not targets:
                    continue
                reason = 'Position bis zum Schließen geschützt' if any(self.rt['opening_holds'][wid]['phase'] == 'active' for wid in holds) else 'Rückkehr wird ausgeführt' if holds else ''
                if not holds and not self.opening_eligible(program, now, check_pause=False):
                    reason = 'Außerhalb des Zeitfensters' if self.execution_enabled(program, now) else 'Programm pausiert'
                rows.append({'id': 'program:'+program['id'], 'source': 'program', 'sensor_mode':'opening', 'name':program['name'],
                             'targets': targets, 'season':deepcopy(program['season']), 'paused':self.sensor_paused('program:'+program['id'],now),
                             'pause_until':stamp(tomorrow), 'triggered':bool(holds), 'blocked_reason':reason,
                             'opening_start':program['opening_start'], 'opening_end':program['opening_end']})
                continue
            calendar_day = date.weekday() in program['days'] and in_season(program.get('season'), date)
            if program.get('start', '00:00') > program.get('end', '00:00'):
                yesterday = date-timedelta(days=1)
                calendar_day = calendar_day or (yesterday.weekday() in program['days'] and in_season(program.get('season'), yesterday))
            if (program['kind'] != 'sensor' or not program['enabled'] or not calendar_day
                    or not any(r['enabled'] and any(windows[t]['enabled'] for t in r['targets']) for r in program['rides'])):
                continue
            targets = list(dict.fromkeys(t for r in program['rides'] for t in r['targets']))
            reason = ''
            if not self.config['enabled']:
                reason = 'Steuerung ausgeschaltet'
            elif self.config['vacation'] and program['pause_in_vacation']:
                reason = 'Urlaubspause'
            elif not self.climate_calendar(program, now):
                reason = 'Außerhalb des Zeitfensters'
            rows.append({'id': 'program:'+program['id'], 'source': 'program', 'sensor_mode': 'climate', 'name': program['name'], 'targets': targets,
                         'season': deepcopy(program['season']), 'paused': self.sensor_paused('program:'+program['id'], now),
                         'pause_until': stamp(tomorrow), 'triggered': any(self.rt['rule_states'].get(t+':'+program['id'], {}).get('active') for r in program['rides'] for t in r['targets']),
                         'blocked_reason': reason})
        return sorted(rows, key=lambda row: (row['name'].casefold(), row['id']))

    def pause_sensor_today(self, key, value, now):
        row = next((row for row in self.sensors_today(now) if row['id'] == key), None)
        if row is None:
            raise ValueError('Diese Sensorregel ist heute nicht freigegeben. Bitte aktualisieren.')
        if value:
            self.rt['sensor_pauses'][key] = str(now.astimezone(self.zone).date())
            for target, slots in self.rt['pending'].items():
                for kind, intent in list(slots.items()):
                    if ((row['source'] == 'window' and kind == 'shade' and target in row['targets']) or
                            (row['source'] == 'program' and kind == 'sensor' and intent['program'] == key.split(':', 1)[1])):
                        slots.pop(kind)
            if row['source'] == 'window':
                state = self.rt['shading'].get(row['targets'][0])
                if state:
                    state.update(active=False, low_since=None, blocks_time=False)
        else:
            self.rt['sensor_pauses'].pop(key, None)
        if row['source'] == 'program':
            self.reset_program_edges(key.split(':', 1)[1])
        self.log(now, 'setting', row['name'] + (': Sensorregel bis Mitternacht ausgesetzt' if value else ': Sensorregel wieder aktiviert'))
        return row
