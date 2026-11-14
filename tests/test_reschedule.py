"""One-execution time exceptions preserve recurrence, precedence and permissions."""
from copy import deepcopy
from datetime import timedelta
from types import SimpleNamespace as NS
from unittest import TestCase, IsolatedAsyncioTestCase
from unittest.mock import AsyncMock

from test_engine import Engine, at, fixture, solar
import test_manager as host


class RescheduleEngineTests(TestCase):
    def setUp(self):
        config, self.states = fixture()
        config['programs'][0]['days'] = list(range(7))
        self.engine = Engine(config)
        self.now = at('2026-11-14T06:10')
        self.key = '2026-11-14:r'

    def shift(self, clock):
        return self.engine.reschedule_time(self.now, solar, self.key, clock)

    def fire(self, text):
        due = at(text)
        self.engine.tick(due-timedelta(seconds=5), self.states, solar)
        return self.engine.tick(due, self.states, solar)

    def test_earlier_time_executes_once_and_keeps_the_original_program(self):
        before = deepcopy(self.engine.config)
        self.assertEqual(self.shift('06:30'), at('2026-11-14T06:30'))
        ready = self.fire('2026-11-14T06:30')
        self.assertEqual(ready['w']['scheduled'], at('2026-11-14T06:30').isoformat())
        self.engine.finish('w', ready['w'], at('2026-11-14T06:30'))
        self.assertEqual(self.fire('2026-11-14T07:00'), {})
        self.assertEqual(self.engine.config, before)
        self.assertEqual(self.engine.due(self.engine.config['programs'][0]['rides'][0], at('2026-11-15T07:00').astimezone(self.engine.zone).date(), solar), at('2026-11-15T07:00'))

    def test_later_time_suppresses_the_original_and_can_exceed_the_normal_bound(self):
        self.shift('09:00')
        self.assertEqual(self.fire('2026-11-14T07:00'), {})
        self.assertIn('w', self.fire('2026-11-14T09:00'))

    def test_repeated_changes_replace_one_exception_and_original_time_resets_it(self):
        self.shift('06:30'); self.shift('08:00')
        self.assertEqual(len(self.engine.rt['time_overrides']), 1)
        row = self.engine.planned_next24(self.now, solar)[0]
        self.assertTrue(row['rescheduled'])
        self.assertEqual(row['original_time'], at('2026-11-14T07:00').isoformat())
        self.shift('07:00')
        self.assertEqual(self.engine.rt['time_overrides'], {})
        self.assertFalse(self.engine.planned_next24(self.now, solar)[0]['rescheduled'])

    def test_past_now_and_invalid_values_are_rejected_without_mutation(self):
        before = deepcopy(self.engine.rt)
        for clock in ['06:09', '06:10', '24:00', '25:30', '9:00', '2026-11-15T09:00', '', None]:
            with self.subTest(clock=clock), self.assertRaises(ValueError):
                self.shift(clock)
            self.assertEqual(self.engine.rt, before)

    def test_tomorrow_is_bound_to_its_own_day_even_when_moved_outside_the_preview(self):
        self.now = at('2026-11-13T18:00')
        self.assertEqual(self.shift('06:00'), at('2026-11-14T06:00'))
        self.shift('23:00')
        self.assertEqual(self.engine.planned_next24(self.now, solar), [])
        rows = self.engine.planned_next24(at('2026-11-14T01:00'), solar)
        self.assertEqual(rows[0]['time'], at('2026-11-14T23:00').isoformat())

    def test_claimed_skipped_and_already_pending_occurrences_cannot_be_shifted(self):
        original = deepcopy(self.engine.rt)
        self.engine.rt['claimed'].append(self.key)
        with self.assertRaises(ValueError): self.shift('08:00')
        self.engine.rt = deepcopy(original)
        self.engine.rt['skipped_occurrences'][self.key] = {'date':'2026-11-14'}
        with self.assertRaises(ValueError): self.shift('08:00')
        self.engine.rt = deepcopy(original)
        self.states['binary_sensor.fenster']['state'] = 'on'
        self.fire('2026-11-14T07:00')
        self.now = at('2026-11-14T07:01')
        with self.assertRaises(ValueError): self.shift('08:00')

    def test_restart_preserves_a_future_exception_and_does_not_replay_after_completion(self):
        self.shift('06:30')
        self.engine = Engine(self.engine.config, deepcopy(self.engine.rt))
        ready = self.fire('2026-11-14T06:30')
        self.engine.finish('w', ready['w'], at('2026-11-14T06:30'))
        self.engine = Engine(self.engine.config, deepcopy(self.engine.rt))
        self.engine.rearm_future_time_occurrences(at('2026-11-14T06:45'), solar)
        self.assertEqual(self.fire('2026-11-14T07:00'), {})

    def test_enable_pauses_and_names_do_not_erase_a_time_exception(self):
        self.shift('06:30')
        program = self.engine.config['programs'][0]
        program['enabled'] = False;program['rides'][0]['enabled'] = False
        self.engine.tick(self.now, self.states, solar)
        self.assertIn(self.key, self.engine.rt['time_overrides'])
        program['enabled'] = True;program['rides'][0]['enabled'] = True
        program['name'] = 'Renamed';program['rides'][0]['name'] = 'Renamed ride'
        self.assertIn('w', self.fire('2026-11-14T06:30'))

    def test_schedule_or_cover_changes_invalidate_a_stale_time_exception(self):
        self.shift('06:30')
        changed = deepcopy(self.engine.config)
        changed['programs'][0]['rides'][0]['time'] = '07:30'
        self.engine.replace_config(changed, self.now, solar)
        self.engine.tick(self.now, self.states, solar)
        self.assertEqual(self.engine.rt['time_overrides'], {})
        self.assertEqual(self.engine.planned_next24(self.now, solar)[0]['time'], at('2026-11-14T07:30').isoformat())

    def test_deferred_contact_work_keeps_its_effective_time_and_is_not_queued_twice(self):
        self.shift('06:30');self.states['binary_sensor.fenster']['state'] = 'on'
        self.assertEqual(self.fire('2026-11-14T06:30'), {})
        self.assertEqual(self.engine.rt['pending']['w']['time']['scheduled'], at('2026-11-14T06:30').isoformat())
        self.states['binary_sensor.fenster']['state'] = 'off'
        ready = self.engine.tick(at('2026-11-14T06:31'), self.states, solar)
        self.engine.finish('w', ready['w'], at('2026-11-14T06:31'))
        self.assertEqual(self.fire('2026-11-14T07:00'), {})

    def test_schedule_restoration_uses_effective_order_after_a_shift(self):
        later = deepcopy(self.engine.config['programs'][0]['rides'][0])
        later.update(id='later', time='06:45', position=50)
        self.engine.config['programs'][0]['rides'].append(later)
        self.shift('06:30')
        goal = self.engine.current_schedule_goal(self.engine.windows()['w'], at('2026-11-14T07:30'), solar, {})
        self.assertEqual(goal['position'], 50)

    def test_dst_gaps_are_rejected_and_an_ambiguous_clock_uses_the_future_fold(self):
        self.now = at('2026-03-29T01:00');self.key = '2026-03-29:r'
        with self.assertRaisesRegex(ValueError, 'Zeitumstellung'): self.shift('02:30')
        self.now = at('2026-10-25T02:40');self.key = '2026-10-25:r'
        expected = at('2026-10-25T02:30')+timedelta(hours=1)
        self.assertEqual(self.shift('02:30'), expected)

    def test_skip_and_undo_keep_the_changed_execution_time(self):
        self.shift('06:30')
        self.engine.skip_today(self.now,solar,self.key,True)
        self.assertEqual(self.engine.planned_next24(self.now,solar)[0]['time'],at('2026-11-14T06:30').isoformat())
        self.engine.skip_today(self.now,solar,self.key,False)
        self.assertIn('w',self.fire('2026-11-14T06:30'))

    def test_global_pause_still_blocks_a_shifted_event_without_replaying_the_original(self):
        self.engine.config['enabled']=False
        self.shift('06:30')
        self.assertEqual(self.fire('2026-11-14T06:30'),{})
        self.engine.config['enabled']=True
        self.assertEqual(self.fire('2026-11-14T07:00'),{})


class RescheduleManagerTests(IsolatedAsyncioTestCase):
    def setUp(self):
        host.AdapterTests.setUp(self)
        self.c['programs'][0]['days'] = list(range(7))
        self.m.engine = host.adapter.Engine(self.c)
        self.now = at('2026-11-14T06:10')
        self.admin = NS(is_admin=True)
        self.message = {'action':'reschedule','value':True,'occurrence':'2026-11-14:r',
                        'time':'06:30','entity_id':['cover.wohnen'],'revision':self.m.revision}

    async def test_success_persists_without_config_changes_or_immediate_motor_commands(self):
        before = deepcopy(self.m.engine.config)
        await self.m.action(self.admin, self.message)
        self.assertEqual(self.m.engine.config, before)
        self.hass.services.async_call.assert_not_called()
        saved = deepcopy(self.m.store.async_save.call_args.args[0])
        self.m.store.async_load = AsyncMock(return_value=saved)
        await self.m.load()
        row = self.m.snapshot(self.admin)['planned'][0]
        self.assertEqual(row['time'], at('2026-11-14T06:30').isoformat())
        self.assertTrue(row['rescheduled']);self.assertTrue(row['reschedulable'])

    async def test_stale_forged_and_unauthorized_requests_are_rejected_without_mutation(self):
        before = deepcopy(self.m.engine.rt)
        read_only = NS(is_admin=False,permissions=NS(check_entity=lambda entity,policy:policy=='read'))
        for user,message in [(read_only,self.message),(self.admin,{**self.message,'entity_id':[]}),
                             (self.admin,{**self.message,'revision':self.m.revision+1}),
                             (self.admin,{**self.message,'occurrence':'wecker:read-only'}),
                             (self.admin,{**self.message,'time':'06:09'})]:
            with self.assertRaises(ValueError): await self.m.action(user,message)
            self.assertEqual(self.m.engine.rt,before)
        self.hass.services.async_call.assert_not_called()

    async def test_one_time_movement_changes_only_its_time_and_keeps_one_runtime_record(self):
        before = deepcopy(self.m.engine.config)
        await self.m.action(self.admin,{'action':'add_once','value':True,'target':'w','time':'06:40','position':20,'tilt':None,'revision':self.m.revision})
        item = self.m.engine.rt['one_time'][0]
        await self.m.action(self.admin,{**self.message,'occurrence':item['id'],'time':'06:20','revision':self.m.revision})
        self.assertEqual(len(self.m.engine.rt['one_time']),1)
        self.assertEqual(item['scheduled'],at('2026-11-14T06:20').isoformat())
        self.assertEqual(item['position'],20);self.assertIsNone(item['tilt'])
        self.assertEqual(self.m.engine.config,before)
        self.hass.services.async_call.assert_not_called()

    async def test_due_or_failed_one_time_movements_cannot_be_shifted(self):
        self.m.engine.rt['one_time']=[{'id':'once_test','target':'w','position':20,
            'scheduled':at('2026-11-14T06:20').isoformat(),'status':'error'}]
        with self.assertRaises(ValueError):
            await self.m.action(self.admin,{**self.message,'occurrence':'once_test'})
        self.m.engine.rt['one_time'][0]['status']='planned'
        self.now=at('2026-11-14T06:21')
        with self.assertRaises(ValueError):
            await self.m.action(self.admin,{**self.message,'occurrence':'once_test'})

    async def test_tomorrows_occurrence_cannot_be_moved_to_today(self):
        self.now=at('2026-11-13T18:00')
        await self.m.action(self.admin,{**self.message,'time':'06:00'})
        self.assertEqual(self.m.snapshot(self.admin)['planned'][0]['time'],at('2026-11-14T06:00').isoformat())

    async def test_a_program_occurrence_that_became_due_while_editing_is_rejected(self):
        self.now=at('2026-11-14T07:00')
        with self.assertRaises(ValueError):await self.m.action(self.admin,self.message)
        self.assertEqual(self.m.engine.rt['time_overrides'],{})

    async def test_renaming_through_a_real_config_save_preserves_the_one_time_exception(self):
        await self.m.action(self.admin,self.message)
        config=self.m.snapshot(self.admin)['config']
        config['programs'][0]['name']='New display name'
        await self.m.save(config,self.m.revision)
        self.assertEqual(self.m.snapshot(self.admin)['planned'][0]['time'],at('2026-11-14T06:30').isoformat())

    async def test_disabled_one_time_target_does_not_offer_a_nonfunctional_shift_control(self):
        await self.m.action(self.admin,{'action':'add_once','value':True,'target':'w','time':'06:40','position':20,'tilt':None,'revision':self.m.revision})
        self.m.engine.config['windows'][0]['enabled']=False
        row=next(row for row in self.m.snapshot(self.admin)['planned'] if row.get('one_time'))
        self.assertFalse(row['reschedulable'])
        with self.assertRaises(ValueError):
            await self.m.action(self.admin,{**self.message,'occurrence':row['occurrence'],'revision':self.m.revision})
