"""Optional Wecker previews preserve ownership, device access and native control."""
from copy import deepcopy
from datetime import datetime, timezone
import importlib.util
from pathlib import Path
import sys
from types import SimpleNamespace as NS
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch
from zoneinfo import ZoneInfo

spec = importlib.util.spec_from_file_location('wecker_preview_test', Path(__file__).parents[1]/'custom_components/rollladenplaner/wecker.py')
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


class WeckerPreviewTests(IsolatedAsyncioTestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 13, 5, 0, tzinfo=timezone.utc)
        self.zone = ZoneInfo('Europe/Berlin')
        self.owner = NS(id='max', is_admin=False, is_active=True, readable={'cover.one', 'cover.two'})
        self.other = NS(id='paul', is_admin=False, is_active=True, readable={'cover.one', 'cover.two'})
        self.admin = NS(id='admin', is_admin=True, is_active=True, readable={'cover.one', 'cover.two'})
        self.record = {'binding': {'card_id': 'card_max', 'owner_id': 'max', 'covers': [
            {'entity_id': 'cover.one', 'position': 75}, {'entity_id': 'cover.two', 'position': 100}]},
            'settings': {'types': {'school': {'enabled': True}}}, 'revision': 1, 'name': 'Maximilian'}
        self.entry = NS(options={'wake_cards': {'max_alarm': self.record}})
        self.hass = NS(data={'wecker_manager': {'entry': self.entry}}, services=NS(async_call=AsyncMock()))
        self.windows = [{'id': 'w1', 'cover': 'cover.one'}, {'id': 'w2', 'cover': 'cover.two'}]
        self.info = {'types': {'school': {'active': True, 'at': '2026-11-13T06:00:00+00:00'}}}
        async def checked(hass, caller, alarm_id, card_id):
            record = self.entry.options['wake_cards'][alarm_id]
            if not caller.is_active or not self.owner.is_active or (not caller.is_admin and record['binding']['owner_id'] != caller.id):
                raise PermissionError()
            if record['binding']['card_id'] != card_id:
                raise ValueError()
            return self.entry, record, self.owner
        def allowed(hass, owner, caller, entity, domain, *, control):
            self.assertFalse(control)
            if entity not in owner.readable or entity not in caller.readable:
                raise PermissionError()
            return NS(state='open')
        self.api = NS(KEY='wake_cards', entry_for=lambda hass: self.entry,
            checked_record=AsyncMock(side_effect=checked), upcoming_info=AsyncMock(side_effect=lambda *a: deepcopy(self.info)),
            allowed_entity=allowed, day_definitions=lambda record: [{'id': 'school', 'name': 'Schultag'}])
        modules = patch.dict(sys.modules, {preview.MODULE: self.api});modules.start();self.addCleanup(modules.stop)

    async def rows(self, user=None):
        return await preview.async_planned_wecker(self.hass, user or self.owner, self.windows, self.now, self.zone)

    async def test_absent_or_unloaded_integration_is_optional(self):
        self.hass.data = {}
        self.assertEqual(await self.rows(), [])
        self.api.upcoming_info.assert_not_awaited()
        self.hass.data = {'wecker_manager': {}}
        self.assertEqual(await self.rows(), [])

    async def test_only_selected_devices_are_returned_as_read_only(self):
        self.windows = self.windows[:1]
        rows = await self.rows()
        self.assertEqual(len(rows), 1)
        self.assertEqual((rows[0]['targets'], rows[0]['position'], rows[0]['tilt']), (['w1'], 75, None))
        self.assertEqual(rows[0]['source'], 'wecker')
        self.assertEqual(rows[0]['source_name'], 'Maximilian · Schultag')
        self.assertFalse(rows[0]['can_control']);self.assertFalse(rows[0]['can_undo'])
        self.hass.services.async_call.assert_not_awaited()

    async def test_other_users_alarm_is_not_queried(self):
        self.assertEqual(await self.rows(self.other), [])
        self.api.checked_record.assert_not_awaited();self.api.upcoming_info.assert_not_awaited()

    async def test_admin_may_read_the_alarm_with_device_permissions(self):
        self.assertEqual(len(await self.rows(self.admin)), 2)
        self.admin.readable.remove('cover.one')
        self.assertEqual([row['targets'] for row in await self.rows(self.admin)], [['w2']])

    async def test_owner_and_caller_must_be_allowed_to_read_the_device(self):
        self.owner.readable.remove('cover.two')
        self.assertEqual([row['targets'] for row in await self.rows()], [['w1']])
        self.owner.is_active = False
        self.assertEqual(await self.rows(), [])

    async def test_disabled_completed_and_unmatched_occurrences_are_omitted(self):
        self.record['settings']['types']['school']['enabled'] = False
        self.assertEqual(await self.rows(), [])
        self.record['settings']['types']['school']['enabled'] = True
        self.info['types']['school']['active'] = False
        self.assertEqual(await self.rows(), [])
        self.info['types'] = {}
        self.assertEqual(await self.rows(), [])

    async def test_only_future_times_on_the_current_ha_local_day_are_shown(self):
        for at in ['2026-11-13T04:59:59+00:00', '2026-11-13T23:00:00+00:00', '2026-11-13T06:00:00', 'invalid']:
            self.info['types']['school']['at'] = at
            self.assertEqual(await self.rows(), [], at)
        self.info['types']['school']['at'] = '2026-11-13T22:59:59Z'
        self.assertEqual(len(await self.rows()), 2)

    async def test_dst_fold_uses_instants_instead_of_wall_clock_order(self):
        self.now = datetime(2026, 10, 25, 0, 40, tzinfo=timezone.utc)
        self.info['types']['school']['at'] = '2026-10-25T01:30:00+00:00'
        self.assertEqual(len(await self.rows()), 2)
        self.info['types']['school']['at'] = '2026-10-25T00:30:00+00:00'
        self.assertEqual(await self.rows(), [])

    async def test_settings_changed_during_calendar_io_are_not_shown_as_stale(self):
        async def changed(*args):
            self.entry.options = {'wake_cards': {'max_alarm': {**self.record, 'revision': 2}}}
            return self.info
        self.api.upcoming_info.side_effect = changed
        self.assertEqual(await self.rows(), [])

    async def test_errors_and_timeouts_cannot_break_the_native_view(self):
        self.api.upcoming_info.side_effect = RuntimeError('private upstream error')
        self.assertEqual(await self.rows(), [])
        async def delayed(*args):
            import asyncio
            await asyncio.sleep(10)
        self.api.upcoming_info.side_effect = delayed
        with patch.object(preview, 'PREVIEW_TIMEOUT_SECONDS', .01):
            self.assertEqual(await self.rows(), [])

    async def test_invalid_position_and_incompatible_optional_api_are_ignored(self):
        self.record['binding']['covers'][0]['position'] = True
        self.assertEqual([row['targets'] for row in await self.rows()], [['w2']])
        self.api.upcoming_info = None
        self.assertEqual(await self.rows(), [])
