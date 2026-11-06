"""Daily execution results remain separate from bounded diagnostics and planned work."""
from copy import deepcopy
from datetime import timedelta
import types
from unittest import TestCase, IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch
from test_engine import Engine, fixture, at, solar
from test_manager import adapter, FakeState


def command(now, key='job', position=40):
    return {'id':key,'occurrence':key,'kind':'time','program':'p','ride':'r','window':'w',
        'name':'Wohnbereich / Wohnen','position':position,'tilt':None,'created':now.isoformat(),'scheduled':now.isoformat()}


class DailyResultTests(TestCase):
    def setUp(self):
        self.config,self.states=fixture();self.engine=Engine(self.config);self.now=at('2026-11-06T12:00')
    def test_targets_and_detected_errors_are_recorded_in_execution_order(self):
        self.engine.finish('w',command(self.now),self.now)
        later=self.now+timedelta(seconds=5)
        self.engine.finish('w',command(later,'second',60),later,'Position nicht bestätigt')
        rows=self.engine.command_results_today(later)
        self.assertEqual([r['kind'] for r in rows],['done','error'])
        self.assertEqual([r['position'] for r in rows],[40,60])
        self.assertEqual(rows[0]['command'],'Wohnbereich');self.assertEqual(rows[1]['message'],'Position nicht bestätigt')
    def test_full_day_is_not_truncated_by_the_diagnostic_log_limit(self):
        for n in range(145):
            now=self.now+timedelta(seconds=n)
            self.engine.finish('w',command(now,'job_'+str(n)),now)
        for n in range(150):self.engine.log(self.now,'config','Saved')
        self.assertEqual(len(self.engine.rt['history']),100)
        self.assertEqual(len(self.engine.command_results_today(now)),145)
    def test_waiting_and_generic_diagnostic_messages_do_not_create_execution_results(self):
        self.engine.log(self.now,'error','Keine Ausgangsposition bekannt',window='w')
        self.engine.rt['pending']['w']={'time':command(self.now)}
        self.assertEqual(self.engine.command_results_today(self.now),[])
    def test_results_survive_restart_without_duplicates_or_invented_targets(self):
        self.engine.finish('w',command(self.now),self.now)
        restored=Engine(self.engine.config,self.engine.rt)
        self.assertEqual(restored.command_results_today(self.now),self.engine.command_results_today(self.now))
        self.assertEqual(len(Engine(restored.config,restored.rt).rt['command_results']),1)
    def test_available_legacy_logs_migrate_including_failures(self):
        log=[{'time':self.now.isoformat(),'kind':'error','window':'w','message':'Timeout'},
             {'time':(self.now-timedelta(seconds=5)).isoformat(),'kind':'done','window':'w','message':'Completed'},
             {'time':self.now.isoformat(),'kind':'config','message':'Saved'}]
        engine=Engine(self.config,{'history':log})
        rows=engine.command_results_today(self.now)
        self.assertEqual([r['kind'] for r in rows],['done','error'])
        self.assertNotIn('position',rows[0]);self.assertNotIn('command',rows[0])
    def test_today_uses_ha_local_date_at_midnight_and_prunes_old_rows(self):
        late=at('2026-11-05T23:59:55');midnight=at('2026-11-06T00:00')
        self.engine.finish('w',command(late,'yesterday'),late)
        self.engine.finish('w',command(midnight,'today'),midnight)
        self.assertEqual([r['id'] for r in self.engine.command_results_today(midnight)],['today'])
        self.assertEqual(len(self.engine.rt['command_results']),1)
    def test_local_date_remains_correct_on_both_dst_changes(self):
        for day in ['2026-03-29','2026-10-25']:
            engine=Engine(self.config);now=at(day+'T00:30');engine.finish('w',command(now),now)
            self.assertEqual(len(engine.command_results_today(at(day+'T23:30'))),1)
    def test_snapshot_style_reads_are_pure_and_skip_malformed_legacy_timestamps(self):
        self.engine.rt['command_results']=[{'time':'broken','kind':'done','window':'w'}]
        original=deepcopy(self.engine.rt)
        self.assertEqual(self.engine.command_results_today(self.now),[])
        self.assertEqual(self.engine.rt,original)
    def test_daily_expiry_happens_on_tick_without_a_new_command(self):
        self.engine.finish('w',command(self.now),self.now)
        self.engine.tick(at('2026-11-07T00:00'),self.states,solar)
        self.assertEqual(self.engine.rt['command_results'],[])


class DailyResultAdapterTests(IsolatedAsyncioTestCase):
    def setUp(self):
        self.config,self.states=fixture();self.now=at('2026-11-06T12:00')
        self.states['cover.wohnen']['attributes'].update(supported_features=12,current_position=100)
        self.hass=types.SimpleNamespace(config=types.SimpleNamespace(time_zone='Europe/Berlin'),
            states=types.SimpleNamespace(get=lambda entity:FakeState(self.states[entity]['state'],**self.states[entity].get('attributes',{})) if entity in self.states else None),
            services=types.SimpleNamespace(async_call=AsyncMock()))
        self.manager=adapter.Manager(self.hass);self.manager.engine=adapter.Engine(self.config)
        self.manager.states=lambda:self.states;self.manager.solar=solar
    async def test_service_acceptance_is_not_recorded_as_completed_before_feedback(self):
        intent=command(self.now)
        await self.manager.advance('w',intent,self.now,self.states)
        self.hass.services.async_call.assert_awaited_once()
        self.assertEqual(self.manager.engine.command_results_today(self.now),[])
        self.states['cover.wohnen']['attributes']['current_position']=40
        await self.manager.advance('w',intent,self.now+timedelta(seconds=5),self.states)
        self.assertEqual(self.manager.engine.command_results_today(self.now)[0]['kind'],'done')
    async def test_service_failure_is_visible_as_failed(self):
        self.hass.services.async_call.side_effect=RuntimeError('Actuator failure')
        with self.assertLogs(adapter._LOGGER,level='ERROR'):
            await self.manager.advance('w',command(self.now),self.now,self.states)
        row=self.manager.engine.command_results_today(self.now)[0]
        self.assertEqual(row['kind'],'error');self.assertIn('Actuator failure',row['message'])
    async def test_results_persist_and_snapshot_respects_read_permissions_and_day_boundary(self):
        self.manager.engine.finish('w',command(self.now),self.now)
        await self.manager.persist();saved=deepcopy(self.manager.store.async_save.call_args.args[0])
        self.manager.store.async_load=AsyncMock(return_value=saved)
        with patch.object(adapter,'utcnow',lambda:self.now):
            await self.manager.load()
            self.assertEqual(len(self.manager.snapshot(types.SimpleNamespace(is_admin=True))['daily_history']),1)
            denied=types.SimpleNamespace(is_admin=False,permissions=types.SimpleNamespace(check_entity=lambda *args:False))
            self.assertEqual(self.manager.snapshot(denied)['daily_history'],[])
        with patch.object(adapter,'utcnow',lambda:at('2026-11-07T00:00')):
            self.assertEqual(self.manager.snapshot(types.SimpleNamespace(is_admin=True))['daily_history'],[])
