"""Optional, read-only cover previews from the installed Wecker integration."""
import asyncio
from collections.abc import Mapping
from datetime import datetime, timedelta, timezone
import sys

DOMAIN = 'wecker_manager'
MODULE = 'custom_components.wecker_manager.wake_cards'
PREVIEW_TIMEOUT_SECONDS = 3.0


def _scheduled(value, now):
    if not isinstance(value, str):
        return None
    try:
        at = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return None
    if at.tzinfo is None or not now <= at <= now.astimezone(timezone.utc) + timedelta(hours=24):
        return None
    return at


async def async_planned_wecker(hass, user, windows, now, zone):
    """Use Wecker's own calendar, day-type, DST and completed-run calculation."""
    if not windows or not getattr(hass, 'data', {}).get(DOMAIN):
        return []
    api = sys.modules.get(MODULE)
    if api is None or not all(callable(getattr(api, name, None)) for name in
                              ('entry_for', 'checked_record', 'upcoming_info', 'allowed_entity', 'day_definitions')):
        return []
    try:
        entry = api.entry_for(hass)
        key = api.KEY
        records = entry.options.get(key, {})
        if not isinstance(records, Mapping):
            return []
    except Exception:
        return []
    visible = {window['cover']: window['id'] for window in reversed(windows)}
    semaphore = asyncio.Semaphore(4)

    async def preview(alarm_id, original):
        async with semaphore:
            try:
                binding = original['binding']
                if not user.is_admin and binding['owner_id'] != user.id:
                    return []
                if not any(item.get('entity_id') in visible for item in binding.get('covers', [])):
                    return []
                _, record, owner = await api.checked_record(hass, user, alarm_id, binding['card_id'])
                info = await api.upcoming_info(hass, user, alarm_id, binding['card_id'])
                # Discard a preview if its card/settings changed during calendar I/O.
                current_entry, current, owner = await api.checked_record(hass, user, alarm_id, binding['card_id'])
                if current_entry is not entry or current is not record:
                    return []
                names = {day['id']: day['name'] for day in api.day_definitions(record)}
                rows = []
                for kind, planned in info.get('types', {}).items():
                    if planned.get('active') is not True or not record['settings']['types'].get(kind, {}).get('enabled'):
                        continue
                    at = _scheduled(planned.get('at'), now)
                    if at is None:
                        continue
                    for item in record['binding'].get('covers', []):
                        entity = item.get('entity_id')
                        position = item.get('position')
                        if entity not in visible or type(position) is not int or not 0 <= position <= 100:
                            continue
                        try:
                            api.allowed_entity(hass, owner, user, entity, 'cover', control=False)
                        except Exception:
                            continue
                        occurrence = f"wecker:{binding['card_id']}:{kind}:{at.isoformat()}:{visible[entity]}"
                        rows.append({'occurrence': occurrence, 'program': '__wecker__', 'ride': occurrence,
                                     'source': 'wecker', 'source_name': f"{record.get('name') or 'Wecker'} · {names.get(kind, kind)}",
                                     'name': record.get('name') or 'Wecker', 'kind': 'time', 'time': at.isoformat(),
                                     'targets': [visible[entity]], 'cover_entity': entity, 'position': position, 'tilt': None,
                                     'status': 'planned', 'reason': '', 'skip': False, 'can_undo': False,
                                     'carried': False, 'can_control': False})
                return rows
            except Exception:
                # Optional previews must not break native schedules or leak account errors.
                return []

    try:
        async with asyncio.timeout(PREVIEW_TIMEOUT_SECONDS):
            batches = await asyncio.gather(*(preview(alarm_id, record) for alarm_id, record in list(records.items())))
    except TimeoutError:
        return []
    rows = [row for batch in batches for row in batch]
    rows.sort(key=lambda row: (datetime.fromisoformat(row['time']).astimezone(timezone.utc), row['occurrence']))
    return rows
