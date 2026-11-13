"""Read-only interoperability with pinned, separately installed Wecker/Music source."""
import importlib.util
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'.ci/wecker-reference/tests'))
import test_wake_cards as wake_fixture

spec = importlib.util.spec_from_file_location('shutter_wecker_preview', ROOT/'custom_components/rollladenplaner/wecker.py')
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


class InteroperabilityTests(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        wake_fixture.WakeCardTests.setUpClass()

    async def asyncSetUp(self):
        self.reference = wake_fixture.WakeCardTests()
        self.hass, self.entry, self.owner, self.admin, self.other, self.config, self.states, self.permission = self.reference.fixture()
        self.wake = self.reference.wake
        await self.reference.activate(self.hass, self.admin, self.config, time='07:00')
        self.windows = [{'id':'one','cover':'cover.one'},{'id':'two','cover':'cover.two'}]
        self.hass.services.async_call.reset_mock()
        self.hass.config_entries.async_update_entry.reset_mock()
        self.hass.bus.async_fire.reset_mock()

    async def rows(self, user=None):
        return await preview.async_planned_wecker(self.hass, user or self.owner, self.windows, self.reference.now, self.reference.now.tzinfo)

    def assert_read_only(self):
        for call in self.hass.services.async_call.await_args_list:
            self.assertEqual(call.args[:2], ('calendar','get_events'))
        self.hass.config_entries.async_update_entry.assert_not_called()
        self.hass.bus.async_fire.assert_not_called()

    async def test_real_api_maps_both_cover_goals_without_actuating_any_device(self):
        rows = await self.rows()
        self.assertEqual([(row['targets'],row['position']) for row in rows], [(['one'],75),(['two'],100)])
        self.assertTrue(all(row['time'].startswith('2026-11-13T06:00:00') for row in rows))
        self.assertTrue(all(not row['can_control'] for row in rows))
        self.assert_read_only()

    async def test_real_api_rejects_another_owner_even_with_entity_access(self):
        self.assertEqual(await self.rows(self.other), [])
        self.assertEqual(len(await self.rows(self.admin)), 2)
        self.assert_read_only()

    async def test_real_calendar_rules_hide_school_wakes_on_all_day_events(self):
        self.hass.services.async_call.return_value = {'calendar.school':{'events':[{'start':'2026-11-13','end':'2026-11-14'}]}}
        self.assertEqual(await self.rows(), [])
        self.assert_read_only()

    async def test_timed_calendar_events_do_not_hide_the_wake(self):
        self.hass.services.async_call.return_value = {'calendar.school':{'events':[{'start':'2026-11-13T00:00:00+01:00','end':'2026-11-14T00:00:00+01:00'}]}}
        self.assertEqual(len(await self.rows()), 2)
        self.assert_read_only()

    async def test_claimed_or_disabled_wakes_are_not_shown_again(self):
        record = self.entry.options['wake_cards'][self.config['alarm_id']]
        record['runs'] = {'2026-11-13/schultag/wake':True}
        self.assertEqual(await self.rows(), [])
        record.pop('runs')
        record['settings']['types']['schultag']['enabled'] = False
        self.assertEqual(await self.rows(), [])
        self.assert_read_only()


if __name__ == '__main__':
    unittest.main()
