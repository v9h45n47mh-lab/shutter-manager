"""The dashboard visibility count follows actual daily results and HA-local dates."""
from copy import deepcopy
from datetime import timedelta
import importlib.util
from pathlib import Path
import sys
import types
from unittest import IsolatedAsyncioTestCase, TestCase
from unittest.mock import Mock, patch

from test_engine import Engine, fixture, at
from test_manager import adapter
from test_command_history import command


class FakeSensorEntity:
    """Minimal entity host; HA API compatibility is covered by Hassfest."""

    def async_on_remove(self, callback):
        self.remove_callback = callback

    def async_write_ha_state(self):
        self.writes.append(self.native_value)


path = Path(__file__).resolve().parents[1] / 'custom_components/rollladenplaner/sensor.py'
spec = importlib.util.spec_from_file_location(adapter.__name__ + '.sensor', path)
sensor = importlib.util.module_from_spec(spec)
with patch.dict(sys.modules, {
        'homeassistant.components.sensor': types.SimpleNamespace(SensorEntity=FakeSensorEntity),
        'homeassistant.const': types.SimpleNamespace(EntityCategory=types.SimpleNamespace(DIAGNOSTIC='diagnostic')),
        'homeassistant.helpers.dispatcher': types.SimpleNamespace(async_dispatcher_connect=Mock())}):
    spec.loader.exec_module(sensor)


class FailedMovementCountTests(TestCase):
    def setUp(self):
        config, self.states = fixture()
        self.engine = Engine(config)
        self.manager = types.SimpleNamespace(engine=self.engine, moving={})
        self.entity = sensor.FailedMovementsTodaySensor(self.manager)
        self.now = at('2026-11-15T08:00')
        self.clock = patch.object(sensor, 'utcnow', side_effect=lambda: self.now)
        self.clock.start()
        self.addCleanup(self.clock.stop)

    def finish(self, key, error='Target not confirmed', target='w'):
        self.engine.finish(target, command(self.now, key), self.now, error)

    def test_no_history_has_a_numeric_zero(self):
        self.assertEqual(self.entity.native_value, 0)
        self.assertIsInstance(self.entity.native_value, int)

    def test_only_failed_completed_attempts_are_counted(self):
        self.finish('ok', None)
        self.engine.log(self.now, 'error', 'Generic diagnostic failure', window='w')
        self.engine.rt['pending']['w'] = {'time': command(self.now, 'pending')}
        self.assertEqual(self.entity.native_value, 0)
        self.finish('failed')
        self.assertEqual(self.entity.native_value, 1)

    def test_a_later_success_keeps_the_recorded_failure(self):
        self.finish('first')
        self.finish('retry', None)
        self.assertEqual(self.entity.native_value, 1)

    def test_the_complete_history_is_not_limited_to_twenty_or_one_hundred(self):
        for number in range(145):
            self.finish(str(number))
        self.assertEqual(self.entity.native_value, 145)
        self.assertEqual(len(self.engine.rt['history']), 100)

    def test_failure_count_survives_an_engine_restart(self):
        self.finish('first')
        self.manager.engine = Engine(self.engine.config, deepcopy(self.engine.rt), self.engine.zone.key)
        self.assertEqual(self.entity.native_value, 1)

    def test_count_resets_at_ha_local_midnight_without_another_movement(self):
        self.now = at('2026-11-15T23:59:59')
        self.finish('late')
        self.now += timedelta(seconds=1)
        self.assertEqual(self.entity.native_value, 0)
        self.finish('new-day')
        self.assertEqual(self.entity.native_value, 1)

    def test_both_dst_days_use_the_same_local_date_as_the_history(self):
        for day in ['2026-03-29', '2026-10-25']:
            with self.subTest(day=day):
                self.manager.engine = self.engine = Engine(self.engine.config, tz='Europe/Berlin')
                self.now = at(day + 'T00:15')
                self.finish(day)
                self.now = at(day + 'T23:45')
                self.assertEqual(self.entity.native_value, 1)
                self.now += timedelta(hours=1)
                self.assertEqual(self.entity.native_value, 0)

    def test_removed_covers_are_omitted_like_the_daily_history_card(self):
        self.finish('first')
        self.engine.config['windows'] = []
        self.assertEqual(self.entity.native_value, 0)

    def test_disabled_covers_still_keep_their_completed_history(self):
        self.finish('first')
        self.engine.config['windows'][0]['enabled'] = False
        self.assertEqual(self.entity.native_value, 1)

    def test_malformed_dates_and_unknown_covers_do_not_count(self):
        self.engine.rt['command_results'] = [
            {'time': 'broken', 'kind': 'error', 'window': 'w'},
            {'time': self.now.isoformat(), 'kind': 'error', 'window': 'missing'}]
        self.assertEqual(self.entity.native_value, 0)

    def test_reading_the_count_does_not_change_configuration_or_runtime(self):
        self.finish('first')
        before = deepcopy((self.engine.config, self.engine.rt))
        self.assertEqual(self.entity.native_value, 1)
        self.assertEqual((self.engine.config, self.engine.rt), before)

    def test_no_private_cover_names_targets_or_reasons_are_exported(self):
        self.finish('private', 'Private failure detail')
        self.assertEqual(self.entity.extra_state_attributes, {})
        self.assertNotIn('Private', str(self.entity.extra_state_attributes))

    def test_status_entity_identity_and_attributes_are_unchanged(self):
        old = sensor.PlannerSensor(self.manager)
        self.assertEqual(old._attr_unique_id, 'rollladenplaner_status')
        self.assertEqual(old._attr_name, 'Shutter Manager')
        self.assertEqual(set(old.extra_state_attributes), {'programme', 'fenster', 'wartende_fahrten', 'bewegungen'})
        self.assertNotEqual(old._attr_unique_id, self.entity._attr_unique_id)
        self.assertFalse(self.entity._attr_should_poll)


class FailureSensorLifecycleTests(IsolatedAsyncioTestCase):
    async def test_setup_adds_the_existing_status_and_new_enabled_diagnostic_sensor(self):
        manager = object()
        add = Mock()
        await sensor.async_setup_entry(None, types.SimpleNamespace(runtime_data=manager), add)
        old, count = add.call_args.args[0]
        self.assertIsInstance(old, sensor.PlannerSensor)
        self.assertIsInstance(count, sensor.FailedMovementsTodaySensor)
        self.assertIs(old.manager, manager)
        self.assertIs(count.manager, manager)
        self.assertEqual(count._attr_name, 'Shutter Manager Failed Movements Today')
        self.assertEqual(count._attr_entity_category, 'diagnostic')
        self.assertEqual(count._attr_suggested_display_precision, 0)

    async def test_push_subscription_updates_the_count_and_registers_cleanup(self):
        config, _ = fixture()
        engine = Engine(config)
        entity = sensor.FailedMovementsTodaySensor(types.SimpleNamespace(engine=engine))
        entity.hass = object()
        entity.writes = []
        unsubscribe = Mock()
        connect = Mock(return_value=unsubscribe)
        with patch.object(sensor, 'async_dispatcher_connect', connect):
            await entity.async_added_to_hass()
        connect.assert_called_once_with(entity.hass, adapter.SIGNAL, entity.async_write_ha_state)
        self.assertIs(entity.remove_callback, unsubscribe)
        now = at('2026-11-15T23:59:59')
        engine.finish('w', command(now), now, 'Failed')
        with patch.object(sensor, 'utcnow', return_value=now):
            connect.call_args.args[2]()
        with patch.object(sensor, 'utcnow', return_value=now + timedelta(seconds=1)):
            connect.call_args.args[2]()
        self.assertEqual(entity.writes, [1, 0])
