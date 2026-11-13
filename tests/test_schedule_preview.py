"""Rolling schedule previews remain read-only and skips target one execution."""
from copy import deepcopy
from datetime import datetime, timedelta
import unittest

from test_engine import Engine, at, fixture, solar


class SchedulePreviewTests(unittest.TestCase):
    def setUp(self):
        config, self.states = fixture()
        config['programs'][0]['days'] = list(range(7))
        self.engine = Engine(config)

    def test_tomorrow_is_included_without_replaying_todays_completed_time(self):
        now = at('2026-11-13T18:00')
        before = deepcopy(self.engine.rt)
        rows = self.engine.planned_next24(now, solar, self.states)
        self.assertEqual([row['occurrence'] for row in rows], ['2026-11-14:r'])
        self.assertEqual(datetime.fromisoformat(rows[0]['time']), at('2026-11-14T07:00'))
        self.assertEqual(self.engine.planned_today(now, solar), [])
        self.assertEqual(self.engine.rt, before)

    def test_bounds_exclude_past_and_beyond_24_hours(self):
        now = at('2026-11-13T07:00')
        ride = self.engine.config['programs'][0]['rides'][0]
        self.assertEqual(len(self.engine.planned_next24(now, solar)), 1)
        ride.update(time='07:01', earliest='00:00', latest='23:59')
        rows = self.engine.planned_next24(now, solar)
        self.assertEqual([row['occurrence'] for row in rows], ['2026-11-13:r'])
        self.assertEqual(datetime.fromisoformat(rows[0]['time']) - now, timedelta(minutes=1))

    def test_tomorrows_weekday_and_solar_time_are_used(self):
        now = at('2026-11-13T23:00')
        program = self.engine.config['programs'][0]
        program['days'] = [5]
        program['rides'][0].update(event='sunrise', offset=30, earliest='00:00', latest='23:59')
        calls = []
        def daily_solar(event, day):
            calls.append(day.isoformat())
            return solar(event, day)
        rows = self.engine.planned_next24(now, daily_solar)
        self.assertEqual([row['occurrence'] for row in rows], ['2026-11-14:r'])
        self.assertEqual(datetime.fromisoformat(rows[0]['time']), at('2026-11-14T08:00'))
        self.assertEqual(calls, ['2026-11-14'])

    def test_spring_dst_includes_two_local_dates_within_24_elapsed_hours(self):
        now = at('2026-03-29T00:30')
        ride = self.engine.config['programs'][0]['rides'][0]
        ride.update(time='00:45', earliest='00:00', latest='23:59', skip_next=True)
        rows = self.engine.planned_next24(now, solar)
        self.assertEqual([row['occurrence'] for row in rows], ['2026-03-29:r', '2026-03-30:r'])
        self.assertEqual([row['skip'] for row in rows], [True, False])
        self.engine.skip_today(now, solar, rows[1]['occurrence'], True)
        self.engine.skip_today(now, solar, rows[1]['occurrence'], False)
        self.assertTrue(ride['skip_next'], 'undoing tomorrow must not clear todays next-trigger skip')

    def test_fall_dst_does_not_include_more_than_24_elapsed_hours(self):
        now = at('2026-10-25T00:30')
        ride = self.engine.config['programs'][0]['rides'][0]
        ride.update(time='00:45', earliest='00:00', latest='23:59')
        rows = self.engine.planned_next24(now, solar)
        self.assertEqual([row['occurrence'] for row in rows], ['2026-10-25:r'])
        self.assertGreater(at('2026-10-26T00:45') - now, timedelta(hours=24))

    def test_tomorrows_concrete_skip_survives_restart_and_midnight(self):
        now = at('2026-11-13T23:00')
        key = '2026-11-14:r'
        self.engine.skip_today(now, solar, key, True)
        restarted = Engine(self.engine.config, deepcopy(self.engine.rt))
        restarted.tick(at('2026-11-14T00:01'), self.states, solar)
        self.assertTrue(restarted.planned_next24(at('2026-11-14T00:01'), solar)[0]['skip'])
        restarted.tick(at('2026-11-14T06:59:55'), self.states, solar)
        self.assertEqual(restarted.tick(at('2026-11-14T07:00'), self.states, solar), {})
        self.assertIn(key, restarted.rt['claimed'])
        self.assertFalse(restarted.config['programs'][0]['rides'][0]['skip_next'])
        self.assertFalse(restarted.planned_next24(at('2026-11-14T07:01'), solar)[0]['skip'])

    def test_outstanding_carried_movements_are_retained(self):
        self.states['binary_sensor.fenster']['state'] = 'on'
        self.engine.tick(at('2026-11-13T06:59:55'), self.states, solar)
        self.engine.tick(at('2026-11-13T07:00'), self.states, solar)
        rows = self.engine.planned_next24(at('2026-11-14T00:01'), solar, self.states)
        self.assertEqual([row['occurrence'] for row in rows], ['2026-11-13:r', '2026-11-14:r'])
        self.assertEqual(rows[0]['status'], 'pending')
        self.assertTrue(rows[0]['carried'])
