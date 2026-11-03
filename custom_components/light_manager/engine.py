"""Deterministic light arbitration. No Home Assistant imports or device I/O."""
from __future__ import annotations

from copy import deepcopy
from datetime import date, datetime, time, timedelta, timezone
import json
import math
import re
from zoneinfo import ZoneInfo

PRIORITY = {'contact': 4, 'motion': 3, 'lux': 2, 'time': 1}
KINDS = {'time', 'contact', 'motion', 'lux'}
EMPTY = {'schema': 4, 'vacation': False, 'lamps': [], 'rooms': [], 'zones': [], 'sensors': [], 'programs': []}
INVALID = {'unknown', 'unavailable', None, ''}


def signature(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'))


def require(ok, message):
    if not ok:
        raise ValueError(message)


def entity(value, domain):
    require(isinstance(value, str) and re.fullmatch(domain + r'\.[a-z0-9_]+', value),
            f'Ungültige {domain}-Entität: {value}')


def number(value, low, high, label):
    require(type(value) in (int, float) and math.isfinite(value) and low <= value <= high,
            f'{label}: Wert zwischen {low} und {high} erforderlich.')


def clock(value):
    require(isinstance(value, str) and re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d', value),
            f'Ungültige Uhrzeit: {value}')
    return time.fromisoformat(value)


def upgrade_config(raw):
    """Convert legacy targets without inventing rooms or retaining removed actions."""
    require(isinstance(raw, dict) and raw.get('schema') in (1, 2, 3, 4), 'Unbekanntes Sicherungsformat.')
    c = deepcopy(raw)
    if c['schema'] in (2, 3, 4):
        require('groups' not in c and 'scenes' not in c, 'Nicht unterstützte Konfigurationsbereiche.')
        if c['schema'] == 2:
            used = set()
            for p in c.get('programs', []):
                for a in p.get('actions', []):
                    used.update(a.get('sensors', []))
                    if a.get('lux_entity'): used.add(a['lux_entity'])
            c['sensors'] = [{'entity': e, 'name': e} for e in sorted(used)]
        c['schema'] = 4
        return c
    require(isinstance(c.get('lamps'), list) and isinstance(c.get('programs'), list), 'Ungültige Konfiguration.')
    lamp_ids = {l.get('id') for l in c['lamps'] if isinstance(l, dict)}
    groups = {}
    for g in c.get('groups', []):
        require(isinstance(g, dict) and isinstance(g.get('id'), str) and isinstance(g.get('lamps'), list)
                and all(isinstance(v, str) and v in lamp_ids for v in g['lamps']), 'Ungültige frühere Lampengruppe.')
        groups[g['id']] = g['lamps']
    for program in c['programs']:
        require(isinstance(program, dict) and isinstance(program.get('actions'), list), 'Ungültiges Programm.')
        actions = []
        for a in program['actions']:
            require(isinstance(a, dict), 'Ungültige Lichtaktion.')
            if a.get('mode') == 'scene':
                continue
            require(isinstance(a.get('targets'), list), 'Ungültige Schaltziele.')
            a['targets'] = list(dict.fromkeys(t for old in a['targets'] for t in groups.get(old, [old])))
            a.pop('scene', None)
            actions.append(a)
        program['actions'] = actions
        program['season_enabled'] = bool(program.get('season_from') or program.get('season_to'))
        if not actions:
            program['enabled'] = False
    c.pop('groups', None); c.pop('scenes', None); c['schema'] = 2
    return upgrade_config(c)


def scene_matches(light_entity, scene_entity):
    """Match the complete light object ID and a nonempty scene suffix."""
    if not isinstance(light_entity, str) or not light_entity.startswith('light.') or not isinstance(scene_entity, str):
        return False
    prefix = 'scene.' + light_entity[len('light.'):] + '_'
    return scene_entity.startswith(prefix) and len(scene_entity) > len(prefix)


def restrict_scene_config(raw):
    """Clean older links and retain orphaned scene actions as disabled drafts."""
    c = upgrade_config(raw)
    removed = disabled = 0
    for lamp in c['lamps']:
        previous = lamp.get('scenes', [])
        retained = [scene for scene in previous if scene_matches(lamp['entity'], scene)]
        removed += len(previous) - len(retained)
        if retained != previous:
            lamp['scenes'] = retained
    for program in c['programs']:
        for action in program['actions']:
            if action.get('mode') != 'scene' or not action.get('enabled'):
                continue
            selected = [lamp for lamp in c['lamps'] if lamp['id'] in action['targets'] or
                        set(lamp['rooms'] + lamp['zones']) & set(action['targets'])]
            if not any(t.startswith('area:') for t in action['targets']) and (not selected or not all(scene_matches(lamp['entity'], action.get('scene')) for lamp in selected)):
                action['enabled'] = False
                disabled += 1
    return c, removed, disabled


def removed_action_key(value, retained=frozenset()):
    """Identify obsolete runtime owners without changing an actual light state."""
    try:
        key = json.loads(value)
        return (isinstance(key, list) and len(key) > 1 and isinstance(key[1], dict)
                and key[1].get('mode') == 'scene' and key[1].get('id') not in retained)
    except (TypeError, ValueError):
        return False


def contact_states(config, ident):
    """Return explicit states; only binary sensors have an implicit mapping."""
    sensor = next((s for s in config['sensors'] if s['entity'] == ident), {})
    binary = ident.startswith('binary_sensor.')
    return sensor.get('open_states', ['on'] if binary else []), sensor.get('closed_states', ['off'] if binary else [])


def validate(raw):
    """Validate backups and frontend edits alike; return an isolated config."""
    c = upgrade_config(raw)
    area_order = c.get('area_order', [])
    require(isinstance(area_order, list) and all(isinstance(id_, str) and id_.startswith('area:') and len(id_) > 5 for id_ in area_order),
            'Ungültige Bereichsreihenfolge.')
    if 'area_order' in c:
        c['area_order'] = list(dict.fromkeys(area_order))
    require(type(c.get('vacation')) is bool, 'Urlaubsmodus muss ein Schalter sein.')
    all_ids = set()
    for section in ('lamps', 'rooms', 'zones', 'programs'):
        require(isinstance(c.get(section), list) and len(c[section]) <= 500, f'{section}: ungültige Liste.')
        for item in c[section]:
            require(isinstance(item, dict), 'Ungültiger Eintrag.')
            ident = item.get('id')
            require(isinstance(ident, str) and 0 < len(ident) <= 100 and ident not in all_ids,
                    'IDs müssen eindeutig sein.')
            all_ids.add(ident)
            require(isinstance(item.get('name'), str) and 0 < len(item['name'].strip()) <= 120,
                    'Bitte einen Namen mit höchstens 120 Zeichen eingeben.')
    ids = lambda section: {x['id'] for x in c[section]}
    lamp_ids = ids('lamps')
    targets = lamp_ids | ids('rooms') | ids('zones')
    seen_entities = set()
    require(isinstance(c.get('sensors'), list) and len(c['sensors']) <= 500, 'Ungültige Sensorauswahl.')
    sensor_entities = set()
    for s in c['sensors']:
        require(isinstance(s, dict), 'Ungültiger Sensor.')
        entity(s.get('entity'), r'(?:binary_sensor|sensor)')
        require(s['entity'] not in sensor_entities, 'Dieser Sensor wurde bereits aufgenommen.')
        require(isinstance(s.get('name'), str) and 0 < len(s['name'].strip()) <= 120, 'Ungültiger Sensorname.')
        sensor_entities.add(s['entity'])
        if 'open_states' in s or 'closed_states' in s:
            for key in ('open_states', 'closed_states'):
                values = s.get(key)
                require(isinstance(values, list) and 0 < len(values) <= 30 and
                        all(isinstance(v, str) and 0 < len(v.strip()) <= 120 and v.strip() not in INVALID for v in values),
                        'Offen- und Geschlossen-Zustände vollständig angeben.')
                s[key] = list(dict.fromkeys(v.strip() for v in values))
            require(not set(s['open_states']) & set(s['closed_states']), 'Offen- und Geschlossen-Zustände dürfen sich nicht überschneiden.')
    for l in c['lamps']:
        entity(l.get('entity'), 'light')
        require(l['entity'] not in seen_entities, 'Diese Lampe wurde bereits aufgenommen.')
        seen_entities.add(l['entity'])
        for kind in ('rooms', 'zones'):
            require(isinstance(l.get(kind), list) and set(l[kind]) <= ids(kind), 'Unbekanntes Zimmer / Zone.')
        require(l.get('fallback') in ('off', 'keep', 'restore'), 'Ungültiges Rückfallverhalten.')
        require(type(l.get('is_group', False)) is bool, 'Ungültige Gruppenkennzeichnung.')
        require(isinstance(l.get('members', []), list), 'Ungültige Gruppenmitglieder.')
        for e in l.get('members', []):
            entity(e, 'light')
            require(e != l['entity'], 'Eine Lichtgruppe darf sich nicht selbst enthalten.')
    action_ids = set()
    for p in c['programs']:
        require(p.get('kind') in KINDS, 'Unbekannte Programmart.')
        p.setdefault('season_enabled', False)
        for k in ('enabled', 'pause_in_vacation', 'season_enabled'):
            require(type(p.get(k)) is bool, f'{k}: Schalter erforderlich.')
        require(isinstance(p.get('days'), list) and bool(p['days']) and
                all(type(d) is int and 0 <= d <= 6 for d in p['days']), 'Bitte Wochentage auswählen.')
        p.pop('order', None)
        clock(p.get('start')); clock(p.get('end'))
        for k in ('season_from', 'season_to'):
            if p.get(k):
                try:
                    date.fromisoformat('2000-' + p[k])
                except (ValueError, TypeError):
                    raise ValueError('Saison bitte als MM-TT angeben.') from None
        require(bool(p.get('season_from')) == bool(p.get('season_to')), 'Saisonbeginn und Saisonende zusammen ausfüllen.')
        require(isinstance(p.get('actions'), list) and len(p['actions']) <= 200, 'Ungültige Aktionen.')
        require(not p['enabled'] or bool(p['actions']), 'Ein aktives Programm benötigt mindestens eine Aktion.')
        require(not p['season_enabled'] or bool(p.get('season_from') and p.get('season_to')), 'Saisonbeginn und Saisonende zusammen ausfüllen.')
        if 'paused_on' in p:
            require(p['kind'] != 'time', 'Nur Sensorprogramme können ausgesetzt werden.')
            try: date.fromisoformat(p['paused_on'])
            except (ValueError, TypeError): raise ValueError('Ungültiges Pausendatum.') from None
        if p.get('once_date'):
            require(p['kind'] == 'time', 'Einmalige Schaltung muss ein Zeitprogramm sein.')
            try: date.fromisoformat(p['once_date'])
            except (ValueError, TypeError): raise ValueError('Ungültiges Datum der Einmalschaltung.') from None
        if 'targets' in p:
            shared = p['targets']
            require(isinstance(shared, list) and
                    all(isinstance(t, str) and (t in targets or t.startswith('area:') and len(t) > 5) for t in shared),
                    'Ungültige gemeinsame Schaltziele.')
        for a in p['actions']:
            require(isinstance(a, dict) and isinstance(a.get('id'), str) and a['id'] not in action_ids | all_ids,
                    'Aktionen benötigen eindeutige IDs.')
            action_ids.add(a['id'])
            if 'name' in a:
                require(isinstance(a['name'], str), 'Ungültiger Name der Schaltaktion.')
                a['name'] = a['name'].strip()
            require(type(a.get('enabled')) is bool, 'Aktion: Schalter erforderlich.')
            require(a.get('mode') in ('on', 'off', 'scene'), 'Ungültige Lichtaktion.')
            if 'targets' in p:
                a['targets'] = list(p['targets'])
            require(isinstance(a.get('targets'), list) and bool(a['targets']) and all(isinstance(t, str) and (t in targets or t.startswith('area:') and len(t)>5) for t in a['targets']),
                    'Bitte ausgewählte Lampen, Zimmer oder Zonen auswählen.')
            if p.get('once_date'): require(a.get('event') == 'fixed', 'Einmalschaltung benötigt eine feste Uhrzeit.')
            if a['mode'] == 'scene':
                entity(a.get('scene'), 'scene')
                selected = [l for l in c['lamps'] if l['id'] in a['targets'] or
                            set(l['rooms'] + l['zones']) & set(a['targets'])]
                require(not a['enabled'] or any(t.startswith('area:') for t in a['targets']) or (bool(selected) and all(scene_matches(l['entity'], a['scene']) for l in selected)),
                        'Bitte eine mit der Auswahl verknüpfte Hue-Szene auswählen.')
                # The user owns the mapping. Never inspect the scene's actual members.
                a['brightness'] = None; a['kelvin'] = None; a['rgb'] = None
            else:
                a.pop('scene', None)
            if a.get('brightness') is not None:
                number(a['brightness'], 1, 100, 'Helligkeit')
            if a.get('kelvin') is not None:
                number(a['kelvin'], 1000, 10000, 'Farbtemperatur')
            if a.get('rgb') is not None:
                require(isinstance(a['rgb'], list) and len(a['rgb']) == 3, 'Ungültige Farbe.')
                for v in a['rgb']: number(v, 0, 255, 'Farbe')
            require(not (a.get('kelvin') is not None and a.get('rgb') is not None), 'Farbe oder Farbtemperatur auswählen.')
            # Legacy backups may contain fades. Light Manager always switches directly.
            a.pop('transition', None)
            for key in ('skips',):
                require(isinstance(a.get(key, []), list) and len(a.get(key, [])) <= 30, 'Ungültige Auslassungen.')
                for day in a.get(key, []):
                    try: date.fromisoformat(day)
                    except (ValueError, TypeError): raise ValueError('Ungültiges Auslassdatum.') from None
            if p['kind'] == 'time':
                require(a.get('event') in ('fixed', 'sunrise', 'sunset'), 'Ungültiges Zeitereignis.')
                clock(a.get('time')); clock(a.get('earliest')); clock(a.get('latest'))
                require(a['earliest'] <= a['latest'], 'Frühestens muss vor Spätestens liegen.')
                number(a.get('offset', 0), -720, 720, 'Sonnenversatz')
            else:
                a.setdefault('end_action', 'fallback')
                require(a['end_action'] in ('restore', 'off', 'keep', 'fallback'), 'Ungültige Abschlussaktion.')
                number(a.get('delay', 0), 0, 86400, 'Nachlauf / Freigabeverzögerung')
                if p['kind'] in ('contact', 'motion'):
                    require(isinstance(a.get('sensors'), list) and bool(a['sensors']), 'Bitte Sensoren auswählen.')
                    for e in a['sensors']:
                        entity(e, r'(?:binary_sensor|sensor)' if p['kind'] == 'contact' else 'binary_sensor')
                        require(e in sensor_entities, 'Bitte Sensoren zuerst in den Einstellungen auswählen.')
                        if p['kind'] == 'contact':
                            opened, closed = contact_states(c, e)
                            require(bool(opened and closed), 'Offen- und Geschlossen-Zustände zuerst in den Einstellungen festlegen.')
                if p['kind'] == 'lux' or a.get('lux_entity'):
                    entity(a.get('lux_entity'), 'sensor')
                    require(a['lux_entity'] in sensor_entities, 'Bitte Sensoren zuerst in den Einstellungen auswählen.')
                    number(a.get('lux_on'), 0, 1000000, 'Einschaltschwelle')
                if p['kind'] == 'lux':
                    number(a.get('lux_off'), 0, 1000000, 'Freigabeschwelle')
                    a.setdefault('lux_end', 'above')
                    require(a['lux_end'] in ('above', 'below'), 'Ungültige Helligkeits-Endbedingung.')
                    require(a['lux_on'] < a['lux_off'] if a['lux_end'] == 'above' else a['lux_off'] < a['lux_on'],
                            'Endschwelle muss passend zur Endbedingung über oder unter der Einschaltschwelle liegen.')
                    number(a.get('on_delay', 0), 0, 86400, 'Einschaltverzögerung')
    return c


class Engine:
    def __init__(self, config=None, runtime=None, tz='Europe/Berlin'):
        legacy_runtime = (config or EMPTY).get('schema') != 4
        self.config = validate(config or deepcopy(EMPTY))
        self.zone = ZoneInfo(tz)
        self.rt = deepcopy(runtime or {})
        for k in ('sensors', 'delivered', 'controlled', 'sensor_frames', 'endings', 'once_done'):
            self.rt.setdefault(k, {})
        current = {a['id'] for p in self.config['programs'] for a in p['actions']}
        retained = {a['id'] for p in self.config['programs'] for a in p['actions'] if a['mode'] == 'scene'}
        self.rt['sensors'] = {k: v for k, v in self.rt['sensors'].items() if k in current}
        if legacy_runtime:
            self.rt['controlled'] = {k: v for k, v in self.rt['controlled'].items() if not removed_action_key(v.get('key'), retained)}
            self.rt['delivered'] = {k: v for k, v in self.rt['delivered'].items() if not removed_action_key(v, retained)}
        self.status = {}; self.rules = []; self.warnings = []; self.planned = []

    def replace(self, config):
        checked = validate(config)
        old = {a['id']: (p, a) for p in self.config['programs'] for a in p['actions']}
        for p in checked['programs']:
            for a in p['actions']:
                # Renames and display organization must not restart sensor timers.
                prev = old.get(a['id'])
                significant = lambda program: {k: v for k, v in program.items() if k not in ('name', 'actions', 'order')}
                if not prev or prev[1] != a or significant(prev[0]) != significant(p):
                    generation = self.rt['sensors'].get(a['id'], {}).get('generation', 0)
                    self.rt['sensors'][a['id']] = {'active': False, 'generation': generation}
                elif p['kind'] == 'contact' and any(contact_states(self.config, e) != contact_states(checked, e) for e in a['sensors']):
                    # A changed mapping invalidates a close deadline, not an open hold.
                    self.rt['sensors'].get(a['id'], {}).pop('pending', None)
        current = {a['id'] for p in checked['programs'] for a in p['actions']}
        self.rt['sensors'] = {k: v for k, v in self.rt['sensors'].items() if k in current}
        self.config = checked

    def valid_day(self, p, day):
        if p.get('once_date') and str(day) != p['once_date']: return False
        if day.weekday() not in p['days']: return False
        return self.in_season(p, day)

    def in_season(self, p, day):
        start, end = p.get('season_from'), p.get('season_to')
        if not p.get('season_enabled') or not start: return True
        value = day.strftime('%m-%d')
        return start <= value <= end if start <= end else value >= start or value <= end

    def window_blocks(self, p, local):
        current = local.strftime('%H:%M')
        start, end = p['start'], p['end']
        day = local.date()
        reasons = []
        if start < end and not start <= current < end or start > end and end <= current < start:
            reasons.append('Uhrzeit')
        if start > end and current < end:
            day -= timedelta(days=1)
        if day.weekday() not in p['days']:
            reasons.append('Tag')
        if not self.in_season(p, day):
            reasons.append('Saison')
        return reasons

    def in_window(self, p, local):
        return not self.window_blocks(p, local)

    def walltime(self, day, value):
        local = datetime.combine(day, clock(value), self.zone)
        # Normalize nonexistent DST times forward; ambiguous times run once (fold=0).
        return local.astimezone(timezone.utc).astimezone(self.zone)

    def due(self, a, day, solar):
        if a['event'] == 'fixed':
            moment = self.walltime(day, a['time'])
        else:
            moment = solar(a['event'], day) if solar else None
            if moment is not None:
                moment = moment.astimezone(timezone.utc) + timedelta(minutes=a['offset'])
        if moment is None: return None
        lower = self.walltime(day, a['earliest']); upper = self.walltime(day, a['latest'])
        return min(max(moment, lower), upper)

    def target_lamps(self, targets, states=None):
        result = set()
        for target in targets:
            if target.startswith('area:'):
                result.update(l['id'] for l in self.config['lamps'] if (states or {}).get(l['entity'], {}).get('area') == target[5:])
            if any(l['id'] == target for l in self.config['lamps']): result.add(target)
            for kind in ('rooms', 'zones'):
                if any(x['id'] == target for x in self.config[kind]):
                    result.update(l['id'] for l in self.config['lamps'] if target in l[kind])
        return result

    def leaves(self, lamp_id, states):
        by_entity = {l['entity']: l for l in self.config['lamps']}
        def walk(e, visited):
            require(e not in visited, f'Zyklische Lichtgruppe: {e}')
            l = by_entity.get(e, {})
            attrs = states.get(e, {}).get('attributes', {})
            native = attrs.get('entity_id', [])
            if isinstance(native, str): native = [native]
            native = [v for v in native if isinstance(v, str) and v.startswith('light.')]
            members = native or l.get('members')
            require(not (l.get('is_group') or attrs.get('is_hue_group')) or bool(members),
                    f'{l.get("name", e)}: bitte vollständige Gruppenmitglieder hinterlegen.')
            if not members: return {e}
            out = set()
            for member in members: out.update(walk(member, visited | {e}))
            return out
        l = next(x for x in self.config['lamps'] if x['id'] == lamp_id)
        return walk(l['entity'], set())

    def expand(self, targets, states):
        return set().union(*(self.leaves(i, states) for i in self.target_lamps(targets, states)))

    @staticmethod
    def lux(a, states):
        state = states.get(a.get('lux_entity'), {})
        try:
            value = float(state.get('state'))
            if not math.isfinite(value) or value < 0: return None
            unit = state.get('attributes', {}).get('unit_of_measurement', 'lx')
            return value * (1000 if unit == 'klx' else 1)
        except (ValueError, TypeError): return None

    def binary_condition(self, kind, action, states):
        readings = []
        for entity_id in action['sensors']:
            value = states.get(entity_id, {}).get('state')
            opened, closed = contact_states(self.config, entity_id) if kind == 'contact' else (['on'], ['off'])
            readings.append(None if value in INVALID else True if value in opened else False if value in closed else None)
        if True in readings:
            return True
        return False if all(reading is False for reading in readings) else None

    def sensor(self, p, a, now, states, eligible):
        slot = self.rt['sensors'].setdefault(a['id'], {'active': False, 'generation': 0})
        kind = p['kind']; active = slot['active']; condition = None
        if kind in ('motion', 'contact'):
            condition = self.binary_condition(kind, a, states)
        else:
            value = self.lux(a, states)
            if value is not None:
                if slot.get('blocked'):
                    if value > a['lux_on']: slot.pop('blocked', None)
                    else: return False, slot
                end_met = value <= a['lux_off'] if a['lux_end'] == 'below' else value >= a['lux_off']
                if active:
                    condition = False if end_met else True
                else:
                    condition = value <= a['lux_on']
        unknown = condition is None
        if unknown:
            self.warnings.append(f'{p["name"]}: Sensorwert nicht verfügbar; laufender Vorrang bleibt erhalten.')
            slot.pop('pending', None)
        # Explicit disabling releases; contact holds can outlive the time window / vacation.
        enabled = p['enabled'] and a['enabled']
        if not enabled or (not eligible and not (kind == 'contact' and active)):
            slot.update(active=False); slot.pop('pending', None); slot.pop('on_since', None)
            return False, slot
        if condition is True and eligible:
            slot.pop('pending', None)
            gate = True
            if kind == 'motion' and a.get('lux_entity') and not active:
                value = self.lux(a, states)
                gate = value is not None and value <= a['lux_on']
                if value is None: self.warnings.append(f'{p["name"]}: Lux-Bedingung nicht verfügbar.')
            if not active and gate:
                if kind == 'lux' and a.get('on_delay', 0):
                    # Separate activation timer: do not reset it on each low reading.
                    since = slot.setdefault('on_since', now.timestamp())
                    if now.timestamp() - since < a['on_delay']: return False, slot
                slot['active'] = True; slot['generation'] += 1
                slot.pop('on_since', None)
        elif condition is False:
            slot.pop('on_since', None)
            if active:
                deadline = slot.setdefault('pending', now.timestamp() + a.get('delay', 0))
                if now.timestamp() >= deadline:
                    slot['active'] = False; slot.pop('pending', None)
                    if kind == 'lux': slot['blocked'] = True
        else:
            # Unknown or hysteresis band must never count towards release/activation.
            slot.pop('on_since', None); slot.pop('pending', None)
        return slot['active'], slot

    def plan(self, now, states, solar=None):
        now = now.astimezone(timezone.utc); local = now.astimezone(self.zone)
        self.rules = []; self.warnings = []; self.status = {}; self.planned = []
        # Keep restart-safe timer state, but discard obsolete sensor slots.
        candidates = []; active_sensors = set()
        self.rt['once_done'] = {k:v for k,v in self.rt['once_done'].items() if v['date'] == str(local.date())}
        for pi, p in enumerate(self.config['programs']):
            base_enabled = (not p.get('once_date') or p['once_date'] == str(local.date())) and p['enabled'] and not (self.config['vacation'] and p['pause_in_vacation'])
            for ai, a in enumerate(p['actions']):
                eligible = base_enabled and a['enabled']
                occurrence = None; due = None; active = False
                if p['kind'] == 'time':
                    if eligible:
                        # Latest action per light is computed even while sensors have priority.
                        for days_ago in range(8):
                            day = local.date() - timedelta(days=days_ago)
                            if not self.valid_day(p, day) or str(day) in a.get('skips', []): continue
                            t = self.due(a, day, solar)
                            if t is not None and t.timestamp() <= now.timestamp():
                                due = t; active = True; occurrence = f'{a["id"]}:{day}'
                                break
                    day = local.date()
                    if base_enabled and a['enabled'] and self.valid_day(p, day):
                        t = self.due(a, day, solar)
                        self.planned.append({'program': p['id'], 'action': a['id'], 'name': p['name'],
                                             'due': t.isoformat() if t else None, 'mode': a['mode'],
                                             'skipped': str(day) in a.get('skips', []), 'date': str(day)})
                else:
                    reasons = self.window_blocks(p, local)
                    if not p['enabled']:
                        reasons.append('Deaktiviert')
                    if self.config['vacation'] and p['pause_in_vacation']:
                        reasons.append('Im Urlaub ausgesetzt')
                    if not a['enabled']:
                        reasons.append('Schaltaktion deaktiviert')
                    if p.get('paused_on') == str(local.date()):
                        reasons.append('Für heute ausgesetzt')
                    sensor_eligible = eligible and not reasons
                    active, slot = self.sensor(p, a, now, states, sensor_eligible)
                    if p['kind'] == 'contact' and self.binary_condition('contact', a, states) is not True:
                        reasons.append('Öffnung')
                    if p['kind'] == 'lux' or p['kind'] == 'motion' and a.get('lux_entity'):
                        value = self.lux(a, states)
                        if value is None or (not active and (value > a['lux_on'] or slot.get('blocked'))):
                            reasons.append('Helligkeit')
                    occurrence = f'{a["id"]}:{slot["generation"]}'
                    self.rules.append({'program': p['id'], 'action': a['id'], 'name': p['name'],
                                       'kind': p['kind'], 'active': active, 'eligible': sensor_eligible,
                                       'blocked_reasons': reasons, 'deadline': slot.get('pending')})
                if not active: continue
                try:
                    targets = a['targets']
                    if a['mode'] == 'scene':
                        selected_ids = self.target_lamps(targets, states)
                        if not selected_ids or not all(scene_matches(l['entity'], a['scene']) for l in self.config['lamps'] if l['id'] in selected_ids):
                            self.warnings.append(f'{p["name"]}: Hue-Szene passt nicht zur Auswahl.'); continue
                    affected = self.expand(targets, states)
                    if not affected:
                        self.warnings.append(f'{p["name"]}: keine Lampen zugeordnet.'); continue
                except ValueError as err:
                    self.warnings.append(str(err)); continue
                if p['kind'] != 'time': active_sensors.update((e, occurrence) for e in affected)
                key = signature([occurrence, a, None, sorted(affected)])
                # At the same time, an explicit one-time action overrides a recurring schedule.
                rank = (PRIORITY[p['kind']], due.timestamp() if due else 0, bool(p.get('once_date')), -pi, -ai)
                candidates.append({'key': key, 'rank': rank, 'program': p['id'], 'name': p['name'],
                                   'kind': p['kind'], 'action': a, 'entities': affected,
                                   'once_date': p.get('once_date'),
                                   'sensor': None if p['kind'] == 'time' or a['end_action'] == 'fallback' else
                                   {'token': occurrence, 'end_action': a['end_action']}})
        # Unwind ended overrides from the bottom of each snapshot chain. If a lower
        # override ended under a higher one, the higher return inherits its result.
        for e, frames in list(self.rt['sensor_frames'].items()):
            i = 0
            while i < len(frames):
                frame = frames[i]
                if (e, frame['token']) in active_sensors:
                    i += 1; continue
                result = frame['base'] if frame['end_action'] == 'restore' else {'mode': 'off'}
                if i + 1 < len(frames):
                    if frame['end_action'] != 'keep': frames[i+1]['base'] = deepcopy(result)
                else:
                    self.rt['endings'][e] = {'key': 'end:' + frame['token'],
                                             'action': None if frame['end_action'] == 'keep' else deepcopy(result),
                                             'unknown': frame['end_action'] == 'restore' and result is None}
                frames.pop(i)
            if not frames: self.rt['sensor_frames'].pop(e, None)
        winners = {}
        for c in sorted(candidates, key=lambda x: x['rank'], reverse=True):
            if c['action']['mode'] == 'scene' and any(e in winners for e in c['entities']):
                # A native scene cannot be split into individual light requests.
                continue
            for e in c['entities']: winners.setdefault(e, c)
        for rule in self.rules:
            rule['effective'] = any(c['action']['id'] == rule['action'] for c in winners.values())
        for e, c in winners.items():
            self.status[e] = {'program': c['name'], 'kind': c['kind'], 'mode': c['action']['mode']}
        commands = []; emitted_scenes = set()
        for e, c in winners.items():
            if c['action']['mode'] == 'scene':
                if c['key'] in emitted_scenes: continue
                emitted_scenes.add(c['key'])
                entities = sorted(c['entities'])
                if all(self.rt['delivered'].get(ident) == c['key'] for ident in entities):
                    for ident in entities: self.rt['endings'].pop(ident, None)
                    continue
                bases = {ident: deepcopy(self.rt['endings'][ident]['action']) for ident in entities
                         if ident in self.rt['endings'] and (self.rt['endings'][ident]['action'] is not None or self.rt['endings'][ident].get('unknown'))}
                commands.append({'entities': entities, 'key': c['key'], 'action': deepcopy(c['action']),
                                 'sensor': deepcopy(c['sensor']), 'return_bases': bases, 'release': False})
                continue
            ending = self.rt['endings'].get(e)
            if self.rt['delivered'].get(e) == c['key']:
                self.rt['endings'].pop(e, None); continue
            command = {'entities': [e], 'key': c['key'], 'action': deepcopy(c['action']),
                       'sensor': deepcopy(c['sensor']), 'release': False}
            if ending and (ending['action'] is not None or ending.get('unknown')):
                command['return_base'] = deepcopy(ending['action'])
            commands.append(command)
        for e, control in list(self.rt['controlled'].items()):
            if e in winners: continue
            ending = self.rt['endings'].get(e)
            if ending:
                if ending.get('unknown'):
                    self.warnings.append(f'{e}: kein bekannter Ausgangszustand für die Rückkehr.'); continue
                if ending['action'] is None:
                    self.rt['controlled'].pop(e, None); self.rt['delivered'].pop(e, None)
                    self.rt['endings'].pop(e, None); continue
                commands.append({'entities': [e], **deepcopy(ending), 'release': True})
                self.status[e] = {'program': 'Abschlussaktion', 'kind': 'fallback', 'mode': ending['action']['mode']}
                continue
            lamp = next((l for l in self.config['lamps'] if l['entity'] == e), None)
            if not lamp:
                lamp = next((l for l in self.config['lamps'] if self._contains(l['id'], e, states)), None)
            fallback = lamp.get('fallback', 'keep') if lamp else 'keep'
            if fallback == 'keep':
                self.rt['controlled'].pop(e, None); self.rt['delivered'].pop(e, None); continue
            a = {'mode': 'off'} if fallback == 'off' else deepcopy(control['base'])
            if a is None:
                self.warnings.append(f'{e}: kein bekannter Ausgangszustand für die Rückkehr.'); continue
            commands.append({'entities': [e], 'key': 'release:' + control['key'],
                             'action': a, 'release': True})
            self.status[e] = {'program': 'Rückfallverhalten', 'kind': 'fallback', 'mode': a['mode']}
        once = {c['key']: c for c in candidates if c['once_date']}
        for key, candidate in once.items():
            if candidate['action']['mode'] != 'off':
                continue
            for lamp_id in sorted(self.target_lamps(candidate['action']['targets'], states)):
                lamp = next(l for l in self.config['lamps'] if l['id'] == lamp_id)
                entity = lamp['entity']
                group = states.get(entity, {})
                if group.get('state') not in ('on', 'off') or not group.get('attributes', {}).get('is_hue_group'):
                    continue
                members = self.leaves(lamp_id, states)
                pending = [cmd for cmd in commands if cmd['key'] == key and len(cmd['entities']) == 1
                           and cmd['entities'][0] in members and 'service_entity' not in cmd]
                if len(pending) != len(members):
                    continue
                commands = [cmd for cmd in commands if cmd not in pending]
                commands.append({**pending[0], 'entities': sorted(members), 'service_entity': entity})
        for command in commands:
            candidate = once.get(command['key'])
            if candidate:
                command['once_date'] = candidate['once_date']
                command['once_entities'] = sorted(candidate['entities'])
        for key, candidate in once.items():
            action_id = candidate['action']['id']
            if action_id not in self.rt['once_done'] and all(self.rt['delivered'].get(e) == key for e in candidate['entities']):
                self.rt['once_done'][action_id] = {'date': candidate['once_date'], 'key': key, 'entities': sorted(candidate['entities']), 'complete': True}
        self.planned.sort(key=lambda r: r['due'] or '9999')
        self.warnings = list(dict.fromkeys(self.warnings))
        return commands

    def _contains(self, ident, e, states):
        try: return e in self.leaves(ident, states)
        except ValueError: return False

    @staticmethod
    def base(state):
        if state.get('state') not in ('on', 'off'): return None
        result = {'mode': state['state']}
        attrs = state.get('attributes', {})
        if state['state'] == 'on':
            if attrs.get('brightness') is not None: result['brightness'] = max(1, attrs['brightness'] * 100 / 255)
            if attrs.get('color_mode') == 'color_temp' and attrs.get('color_temp_kelvin'):
                result['kelvin'] = attrs['color_temp_kelvin']
            elif attrs.get('rgb_color'): result['rgb'] = list(attrs['rgb_color'])
        return result

    def claim(self, command, states):
        """Snapshot before I/O; persist this before changing hardware."""
        if command['release']: return
        for e in command['entities']:
            self.rt['controlled'].setdefault(e, {'base': self.base(states.get(e, {})), 'key': command['key']})
            self.rt['controlled'][e]['key'] = command['key']
            sensor = command.get('sensor')
            if sensor:
                frames = self.rt['sensor_frames'].setdefault(e, [])
                if not any(f['token'] == sensor['token'] for f in frames):
                    base = command.get('return_bases', {}).get(e, command.get('return_base', self.base(states.get(e, {}))))
                    # Unknown snapshots must never be fabricated as an off state.
                    frames.append({**deepcopy(sensor), 'base': deepcopy(base)})
            self.rt['endings'].pop(e, None)

    def success(self, command):
        if command.get('once_date'):
            action_id = command['action']['id']
            done = self.rt['once_done'].get(action_id, {})
            entities = set(done.get('entities', [])) if done.get('key') == command['key'] else set()
            entities.update(command['entities'])
            self.rt['once_done'][action_id] = {'date': command['once_date'], 'key': command['key'],
                                              'entities': sorted(entities),
                                              'complete': entities >= set(command['once_entities'])}
        for e in command['entities']:
            if command['release']:
                self.rt['controlled'].pop(e, None); self.rt['delivered'].pop(e, None)
                self.rt['endings'].pop(e, None)
            else: self.rt['delivered'][e] = command['key']
