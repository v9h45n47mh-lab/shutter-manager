"""Manual-card storage, native permissions and production movement regression tests."""
from copy import deepcopy
from datetime import timedelta
import types
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

import test_manager as manager_tests
from test_manager import adapter, FakeState
from test_engine import at

manual = adapter.manual


class ManualTests(IsolatedAsyncioTestCase):
    def setUp(self):
        manager_tests.AdapterTests.setUp(self)
        self.c['programs'] = []
        self.c['windows'][0]['contacts'] = []
        self.c['windows'][0]['climate'] = None
        self.m.engine = adapter.Engine(self.c)
        self.m.engine.last = self.now
        self.hass.data = {}
        self.user = types.SimpleNamespace(is_admin=True)
        self.setup = {**deepcopy(manual.DEFAULTS), 'selected':['w']}
        self.m.manual_cards = {'test': {'revision':1, 'settings':deepcopy(self.setup)}}
        self.s['cover.wohnen']['attributes'].update(supported_features=140, current_position=100, current_tilt_position=0)
        self.hass.states.get = lambda key: FakeState(self.s[key]['state'], **self.s[key].get('attributes', {})) if key in self.s else None

    def role(self, grants, *, native=True):
        self.hass.data['family_access_manager'] = types.SimpleNamespace(application_protocol=1, application_permissions=lambda *_: grants)
        return types.SimpleNamespace(is_admin=False, permissions=types.SimpleNamespace(check_entity=lambda *_: native))

    async def action(self, **values):
        return await manual.action(self.m, self.user, {'card_id':'test','target':'w','action':'position','position':25,**values}, self.now)

    async def test_values_are_distinct_integers_and_limited_to_four(self):
        for invalid in ([],[0,25,50,75,100],[0,0],[-1],[101],[50.5],[True],['50']):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):manual.preset_values(invalid)
        for length in range(1,5):self.assertEqual(len(manual.preset_values([0,25,50,100][:length])),length)

    async def test_card_settings_are_durable_and_do_not_reset_programs_or_move(self):
        before=deepcopy(self.m.engine.config)
        await manual.save(self.m,self.user,{'card_id':'test','card_revision':1,'settings':{**self.setup,'height_values':[0,30,60,100]}})
        self.assertEqual(self.m.manual_cards['test']['revision'],2)
        saved=deepcopy(self.m.store.async_save.call_args.args[0])
        loaded=adapter.Manager(self.hass);loaded.store.async_load.return_value=saved;loaded.solar=self.m.solar
        await loaded.load()
        self.assertEqual(loaded.manual_cards,self.m.manual_cards)
        self.assertEqual(self.m.engine.config,before)
        self.hass.services.async_call.assert_not_called()

    async def test_stale_or_invalid_settings_are_atomic(self):
        before=deepcopy(self.m.manual_cards)
        for revision,settings in [(0,self.setup),(1,{**self.setup,'height_values':[0]*4}),(1,{**self.setup,'selected':['missing']}),(1,{**self.setup,'mode':'invalid'})]:
            with self.assertRaises((ValueError,PermissionError)):
                await manual.save(self.m,self.user,{'card_id':'test','card_revision':revision,'settings':settings})
            self.assertEqual(self.m.manual_cards,before)

    async def test_role_manage_does_not_expose_or_grant_admin_setup(self):
        self.user=self.role({'view':True,'control':True,'manage':True})
        self.assertFalse(manual.snapshot(self.m,self.user,'test',self.now)['can_configure'])
        with self.assertRaises(PermissionError):await manual.save(self.m,self.user,{'card_id':'test','card_revision':1,'settings':self.setup})

    async def test_view_and_device_permissions_are_required(self):
        self.user=self.role({'view':True},native=True)
        self.assertFalse(manual.snapshot(self.m,self.user,'test',self.now)['available'][0]['can_control'])
        with self.assertRaises(PermissionError):await self.action()
        self.user=self.role({'view':True,'control':True},native=False)
        self.assertEqual(manual.snapshot(self.m,self.user,'test',self.now)['available'],[])
        with self.assertRaises(PermissionError):await self.action()
        self.user=self.role({'control':True})
        with self.assertRaises(PermissionError):manual.snapshot(self.m,self.user,'test',self.now)
        with self.assertRaises(PermissionError):await self.action()
        self.hass.services.async_call.assert_not_called()

    async def test_permission_revocation_and_unselected_device_fail_closed(self):
        grants={'view':True,'control':True};self.user=self.role(grants)
        self.m.manual_cards['test']['settings']['selected']=[]
        with self.assertRaises(PermissionError):await self.action()
        self.m.manual_cards['test']['settings']['selected']=['w'];grants['control']=False
        with self.assertRaises(PermissionError):await self.action()
        self.hass.services.async_call.assert_not_called()

    async def test_immediate_height_uses_production_motor_pipeline_and_history(self):
        programs=deepcopy(self.m.engine.config['programs'])
        await self.action(position=25)
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_position')
        self.assertEqual(self.hass.services.async_call.call_args.args[2]['position'],25)
        self.s['cover.wohnen']['attributes']['current_position']=25;self.now+=timedelta(seconds=5)
        await self.m._pulse_locked()
        self.assertEqual(self.m.engine.rt['one_time'],[])
        self.assertEqual(self.m.engine.rt['command_results'][-1]['kind'],'done')
        self.assertEqual(self.m.engine.config['programs'],programs)

    async def test_tilt_only_and_combined_goal_keep_two_second_sequence(self):
        await self.action(position=None,tilt=50)
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_tilt_position')
        self.s['cover.wohnen']['attributes']['current_tilt_position']=50;self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.hass.services.async_call.reset_mock()
        await self.action(position=25,tilt=100)
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_tilt_position')
        self.now+=timedelta(seconds=1.999);await self.m._pulse_locked();self.assertEqual(self.hass.services.async_call.call_count,1)
        self.now+=timedelta(milliseconds=1);await self.m._pulse_locked()
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_position')

    async def test_shutters_reject_tilt_and_unknown_positions(self):
        self.m.engine.config['windows'][0]['cover_type']='shutter'
        with self.assertRaises(ValueError):await self.action(position=None,tilt=50)
        for invalid in (-1,101,float('nan'),True):
            with self.assertRaises(ValueError):await self.action(position=invalid)
        with self.assertRaises(ValueError):await self.action(position=None,tilt=None)
        self.hass.services.async_call.assert_not_called()

    async def test_contact_and_opening_holds_refuse_immediate_commands(self):
        self.m.engine.config['windows'][0]['contacts']=[{'entity':'binary_sensor.fenster','open_state':'on','policy':'defer'}]
        self.s['binary_sensor.fenster']['state']='on'
        with self.assertRaises(ValueError):await self.action()
        self.assertEqual(self.m.engine.rt['one_time'],[])
        self.hass.services.async_call.assert_not_called()

    async def test_timer_is_in_main_schedule_and_survives_restart(self):
        await self.action(action='plan',mode='timer',minutes=15,position=60)
        self.hass.services.async_call.assert_not_called()
        rows=self.m.snapshot(self.user)['planned'];self.assertEqual(len(rows),1);self.assertTrue(rows[0]['one_time'])
        saved=deepcopy(self.m.store.async_save.call_args.args[0]);fresh=adapter.Manager(self.hass)
        fresh.store.async_load.return_value=saved;fresh.solar=self.m.solar;fresh.states=self.m.states
        await fresh.load();self.now+=timedelta(minutes=15);await fresh._pulse_locked()
        self.assertEqual(self.hass.services.async_call.call_args.args[2]['position'],60)
        self.assertEqual(fresh.engine.config['programs'],[])

    async def test_timer_may_cross_midnight_and_clock_is_today_future_only(self):
        self.now=at('2026-11-15T23:50')
        await self.action(action='plan',mode='timer',minutes=20)
        self.assertEqual(self.m.engine.rt['one_time'][0]['scheduled'],'2026-11-15T23:10:00+00:00')
        self.m.engine.rt['one_time'].clear()
        for values in ({'mode':'clock','time':'23:49'},{'mode':'timer','minutes':0},{'mode':'timer','minutes':1441},{'mode':'clock','time':'bad'}):
            with self.assertRaises(ValueError):await self.action(action='plan',**values)
        await self.action(action='plan',mode='clock',time='23:59')

    async def test_stop_cancels_current_goal_but_preserves_future_timer(self):
        await self.action(position=25)
        future={'id':'future','target':'w','created':self.now.isoformat(),'scheduled':(self.now+timedelta(hours=1)).isoformat(),'position':100,'tilt':None,'status':'planned'}
        self.m.engine.rt['one_time'].append(future)
        await self.action(action='stop')
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'stop_cover')
        self.hass.services.async_call.reset_mock();self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.hass.services.async_call.assert_not_called()
        self.assertIn(future,self.m.engine.rt['one_time'])

    async def test_current_service_error_is_recorded_without_claiming_success(self):
        self.hass.services.async_call.side_effect=RuntimeError('fixture transport error')
        with self.assertLogs(adapter.__name__,level='ERROR'):
            with self.assertRaises(ValueError):await self.action(position=25)
        self.assertEqual(self.m.engine.rt['command_results'][-1]['kind'],'error')
        self.assertEqual(self.m.engine.rt['one_time'][0]['status'],'error')

    async def test_failed_stop_is_reported_and_recorded(self):
        self.hass.services.async_call.side_effect=RuntimeError('fixture stop failure')
        with self.assertRaisesRegex(ValueError,'Stopp fehlgeschlagen'):
            await self.action(action='stop')
        self.assertEqual(self.m.engine.rt['command_results'][-1]['kind'],'error')
        self.assertIn('Stopp fehlgeschlagen',self.m.engine.rt['command_results'][-1]['message'])

    async def test_directions_use_native_services_with_inverted_device_positions(self):
        self.s['cover.wohnen']['attributes']['supported_features']=143
        self.s['cover.wohnen']['attributes']['current_position']=0
        await self.action(action='up')
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'open_cover')
        self.assertNotIn('position',self.hass.services.async_call.call_args.args[2])
        self.assertEqual(self.m.engine.rt['one_time'],[])
        self.assertEqual(self.m.engine.rt['command_results'],[],'service acknowledgement does not claim a confirmed target')
        await self.action(action='down')
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'close_cover')

    async def test_native_direction_failures_are_recorded(self):
        self.s['cover.wohnen']['attributes']['supported_features']=143
        self.hass.services.async_call.side_effect=RuntimeError('fixture direction failure')
        with self.assertRaisesRegex(ValueError,'Fahrbefehl fehlgeschlagen'):await self.action(action='up')
        self.assertEqual(self.m.engine.rt['command_results'][-1]['kind'],'error')

    async def test_card_ids_are_validated_and_independent(self):
        for invalid in ('','../other','with space','x'*81):
            with self.assertRaises(ValueError):manual.snapshot(self.m,self.user,invalid,self.now)
        self.assertEqual(manual.snapshot(self.m,self.user,'another',self.now)['settings']['selected'],[])
        self.assertEqual(manual.snapshot(self.m,self.user,'test',self.now)['settings']['selected'],['w'])

    async def test_selected_cover_order_is_preserved_across_save_and_restart(self):
        for wid in ['second','third']:
            self.m.engine.config['windows'].append({**deepcopy(self.m.engine.config['windows'][0]),'id':wid,'cover':'cover.'+wid,'name':wid})
        settings={**self.setup,'selected':['third','w','second']}
        await manual.save(self.m,self.user,{'card_id':'test','card_revision':1,'settings':settings})
        self.assertEqual(manual.snapshot(self.m,self.user,'test',self.now)['settings']['selected'],['third','w','second'])
        fresh=adapter.Manager(self.hass);fresh.solar=self.m.solar
        fresh.store.async_load.return_value=deepcopy(self.m.store.async_save.call_args.args[0]);await fresh.load()
        self.assertEqual(manual.snapshot(fresh,self.user,'test',self.now)['settings']['selected'],['third','w','second'])
        self.hass.services.async_call.assert_not_called()
