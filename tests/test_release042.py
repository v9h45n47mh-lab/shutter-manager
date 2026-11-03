"""Area targets and successful one-time delivery."""
import unittest
from test_engine import Engine, action, at, fixture, lamp, program, state


class Release042Tests(unittest.TestCase):
    def test_area_tracks_managed_members_and_deduplicates_direct_target(self):
        config = fixture(program('p', 'time', [action(targets=['area:kitchen', 'l'])]))
        config['lamps'].append(lamp('other', 'light.other'))
        states = {
            'light.flur': {**state('off'), 'area': 'kitchen'},
            'light.other': {**state('off'), 'area': 'kitchen'},
            'light.unmanaged': {**state('off'), 'area': 'kitchen'},
        }
        engine = Engine(config, tz='UTC')
        self.assertEqual(engine.expand(['area:kitchen', 'l'], states), {'light.flur', 'light.other'})
        states['light.other']['area'] = 'office'
        self.assertEqual(engine.expand(['area:kitchen', 'l'], states), {'light.flur'})

    def test_once_remains_open_until_all_targets_succeed(self):
        config = fixture(program('p', 'time', [action(targets=['l', 'other'])], once_date='2026-11-03'))
        config['lamps'].append(lamp('other', 'light.other'))
        states = {'light.flur': state('off'), 'light.other': state('off')}
        engine = Engine(config, tz='UTC')
        commands = engine.plan(at('2026-11-03T18:00:00'), states)
        self.assertEqual(len(commands), 2)
        engine.success(commands[0])
        self.assertFalse(engine.rt['once_done']['a']['complete'])
        engine = Engine(config, engine.rt, tz='UTC')
        engine.success(commands[1])
        self.assertTrue(engine.rt['once_done']['a']['complete'])

    def test_once_off_wins_against_recurring_on_at_same_time(self):
        config = fixture(
            program('daily', 'time', [action('daily_on', mode='on')]),
            program('once', 'time', [action('once_off', mode='off')], once_date='2026-11-03'),
        )
        engine = Engine(config, tz='UTC')
        commands = engine.plan(at('2026-11-03T18:00:00'), {'light.flur': state('on')})
        self.assertEqual([cmd['action']['mode'] for cmd in commands], ['off'])
        engine.success(commands[0])
        self.assertTrue(engine.rt['once_done']['once_off']['complete'])

    def test_once_off_uses_native_hue_group_for_full_coverage(self):
        config = fixture(program('once', 'time', [action(mode='off')], once_date='2026-11-03'))
        states = {
            'light.flur': state('on', entity_id=['light.one', 'light.two'], is_hue_group=True),
            'light.one': state('on'),
            'light.two': state('on'),
        }
        engine = Engine(config, tz='UTC')
        commands = engine.plan(at('2026-11-03T18:00:00'), states)
        self.assertEqual(len(commands), 1)
        self.assertEqual(commands[0]['service_entity'], 'light.flur')
        self.assertEqual(commands[0]['entities'], ['light.one', 'light.two'])
        engine.success(commands[0])
        self.assertTrue(engine.rt['once_done']['a']['complete'])
