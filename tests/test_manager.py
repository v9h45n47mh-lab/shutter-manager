"""Test HA adapter behavior with an explicit fake host, not real HA/motors."""
import asyncio
from copy import deepcopy
from datetime import timedelta
import importlib.util
from pathlib import Path
import sys
import types
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, Mock, patch

# Isolate Home Assistant imports; these stubs do not verify HA API compatibility.
ROOT=Path(__file__).resolve().parents[1]

def module(name, **attrs):
    m=types.ModuleType(name)
    for k,v in attrs.items():setattr(m,k,v)
    sys.modules[name]=m
    return m

for name in ['homeassistant','homeassistant.auth','homeassistant.auth.permissions','homeassistant.components','homeassistant.helpers']:
    module(name)
module('homeassistant.auth.permissions.const',POLICY_CONTROL='control',POLICY_READ='read')
def identity(*args,**kwargs):
    if len(args)==1 and callable(args[0]):return args[0]
    return lambda f:f
module('homeassistant.components.frontend',add_extra_js_url=identity)
import probatio as schema
def websocket_command(definition):
    def decorate(func):
        func.ws_schema=schema.Schema({schema.Required('id'):int,schema.Required('type'):str}).extend(definition)
        return func
    return decorate
module('homeassistant.components.websocket_api',websocket_command=websocket_command,async_response=identity,require_admin=identity)
module('homeassistant.components.cover',CoverEntityFeature=types.SimpleNamespace(SET_POSITION=4,SET_TILT_POSITION=128,STOP=8))
module('homeassistant.components.http',StaticPathConfig=lambda *a:None)
module('homeassistant.const',Platform=types.SimpleNamespace(SENSOR='sensor'))
module('homeassistant.core',callback=identity)
module('homeassistant.exceptions',HomeAssistantError=RuntimeError)
module('homeassistant.helpers.dispatcher',async_dispatcher_send=lambda *a:None)
module('homeassistant.helpers.event',async_call_later=lambda *a:Mock(),async_track_time_interval=lambda *a:None)
class Store:
    def __init__(self,*a):self.async_save=AsyncMock();self.async_load=AsyncMock(return_value=None)
module('homeassistant.helpers.storage',Store=Store)
module('homeassistant.helpers.service',async_register_admin_service=identity)
module('homeassistant.helpers.sun',get_astral_event_date=lambda *a:None)
spec=importlib.util.spec_from_file_location('adapter_test',ROOT/'custom_components/rollladenplaner/__init__.py',submodule_search_locations=[str(ROOT/'custom_components/rollladenplaner')])
adapter=importlib.util.module_from_spec(spec);sys.modules[spec.name]=adapter;spec.loader.exec_module(adapter)
from test_engine import fixture, at, solar, AUTO

class FakeState:
    def __init__(self,state,**attrs):self.state=state;self.attributes=attrs

class AdapterTests(IsolatedAsyncioTestCase):
    async def test_opening_preempts_motion_holds_then_returns_to_time_goal(self):
        from test_opening import opening_fixture
        self.c,self.s=opening_fixture()
        original,_=fixture();original['programs'][0]['rides'][0].update(time='09:01',earliest='00:00',latest='23:59')
        self.c['programs'].append(original['programs'][0]);self.m.engine=adapter.Engine(self.c)
        self.now=at('2026-10-30T08:59:55');await self.m._pulse_locked()
        self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.hass.services.async_call.assert_not_called()
        self.hass.services.async_call.reset_mock()
        self.s['binary_sensor.fenster']['state']='on';self.now+=timedelta(seconds=5)
        await self.m._pulse_locked()
        self.assertEqual([c.args[1] for c in self.hass.services.async_call.call_args_list],['set_cover_tilt_position'])
        self.assertEqual(self.hass.services.async_call.call_args.args[2]['tilt_position'],40)
        self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_position')
        self.assertEqual(self.hass.services.async_call.call_args.args[2]['position'],100)
        self.s['cover.wohnen']['attributes']['current_position']=100
        self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.hass.services.async_call.reset_mock();self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.hass.services.async_call.assert_not_called()
        self.now=at('2026-10-30T09:01');await self.m._pulse_locked()
        self.hass.services.async_call.assert_not_called()
        self.assertIn('w',self.m.engine.rt['opening_holds'])
        user=types.SimpleNamespace(is_admin=True)
        self.assertTrue(self.m.snapshot(user)['sensor_programs'][0]['triggered'])
        self.s['binary_sensor.fenster']['state']='off';self.now+=timedelta(seconds=5)
        await self.m._pulse_locked()
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_tilt_position')
        self.assertEqual(self.hass.services.async_call.call_args.args[2]['tilt_position'],50)
        self.assertEqual(self.m.snapshot(user)['planned'][0]['kind'],'opening')
        release=self.m.engine.rt['pending']['w']['opening']
        self.assertEqual((release['position'],release['tilt']),(0,50))
        self.s['cover.wohnen']['attributes'].update(current_position=release['position'],current_tilt_position=release['tilt'])
        self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.assertNotIn('w',self.m.engine.rt['opening_holds']);self.assertEqual(self.m.snapshot(user)['planned'],[])

    async def test_opening_restart_and_permissions_preserve_the_original_position(self):
        from test_opening import opening_fixture
        self.c,self.s=opening_fixture();self.m.engine=adapter.Engine(self.c)
        self.now=at('2026-10-30T09:00');await self.m._pulse_locked()
        self.s['binary_sensor.fenster']['state']='on';self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        saved=deepcopy(self.m._saved)
        self.m.store.async_load=AsyncMock(return_value=saved);await self.m.load()
        self.assertEqual(self.m.engine.rt['opening_holds']['w']['before'],{'position':30,'tilt':15})
        user=types.SimpleNamespace(is_admin=False,permissions=types.SimpleNamespace(check_entity=lambda entity,policy:policy=='read'))
        view=self.m.snapshot(user);self.assertEqual(view['planned'][0]['kind'],'opening');self.assertFalse(view['planned'][0]['can_control'])
        with self.assertRaisesRegex(ValueError,'Steuerberechtigung'):
            await self.m.action(user,{'action':'skip_today','value':True,'occurrence':view['planned'][0]['occurrence'],'entity_id':['cover.wohnen'],'revision':self.m.revision})
        self.s['cover.wohnen']['attributes'].update(current_position=100,current_tilt_position=40)
        self.s['binary_sensor.fenster']['state']='off';self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_tilt_position')
        self.assertEqual(self.hass.services.async_call.call_args.args[2]['tilt_position'],15)
        self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_position')
        self.assertEqual(self.hass.services.async_call.call_args.args[2]['position'],30)

    async def test_integration_boot_has_no_reserved_schema_collision(self):
        # HA interprets CONFIG_SCHEMA as its YAML config validator before setup.
        # The WebSocket data schema version must never shadow that startup hook.
        if hasattr(adapter, 'CONFIG_SCHEMA'):
            self.assertTrue(callable(adapter.CONFIG_SCHEMA), 'CONFIG_SCHEMA is a reserved HA validator hook')
        hass=types.SimpleNamespace(http=types.SimpleNamespace(async_register_static_paths=AsyncMock()))
        with patch.object(adapter, 'StaticPathConfig', side_effect=lambda *args:args), \
             patch.object(adapter.frontend, 'add_extra_js_url') as add_js, \
             patch.object(adapter.websocket_api, 'async_register_command', create=True) as register_ws:
            self.assertTrue(await adapter.async_setup(hass, {}))
        path, filename, cache=hass.http.async_register_static_paths.call_args.args[0][0]
        self.assertEqual(path, '/rollladenplaner/rollladenplaner-card.js')
        self.assertTrue(Path(filename).is_file())
        self.assertFalse(cache)
        self.assertEqual(add_js.call_count, 2)
        self.assertEqual(add_js.call_args_list[0].args[1], '/rollladenplaner/rollladenplaner-card.js?v='+adapter.INTEGRATION_VERSION)
        self.assertEqual(add_js.call_args_list[1].args[1], '/shutter-manager/shutter-manager-card.js?v='+adapter.INTEGRATION_VERSION)
        self.assertEqual(hass.http.async_register_static_paths.call_args.args[0][1][0], '/shutter-manager/shutter-manager-card.js')
        paths=hass.http.async_register_static_paths.call_args.args[0]
        self.assertEqual([row[0] for row in paths[2:]], ['/rollladenplaner/family-ui','/shutter-manager/family-ui'])
        for _, directory, cache in paths[2:]:
            self.assertTrue((Path(directory)/'1.4.1/family-ui.js').is_file())
            self.assertFalse(cache)
        self.assertEqual(register_ws.call_count, 3)

    async def test_product_rename_preserves_custom_entry_names(self):
        from unittest.mock import Mock
        for title in ('Rollladenplaner', 'Blind Planner', 'Beschattungsmanager', 'Meine Beschattung'):
            with self.subTest(title=title):
                manager=types.SimpleNamespace(load=AsyncMock(), pulse=AsyncMock())
                entry=types.SimpleNamespace(title=title)
                entries=types.SimpleNamespace(async_update_entry=Mock(), async_forward_entry_setups=AsyncMock())
                hass=types.SimpleNamespace(data={}, config_entries=entries)
                with patch.object(adapter, 'Manager', return_value=manager):
                    self.assertTrue(await adapter.async_setup_entry(hass, entry))
                if title in ('Rollladenplaner', 'Blind Planner', 'Beschattungsmanager'):
                    entries.async_update_entry.assert_called_once_with(entry, title='Shutter Manager')
                else:
                    entries.async_update_entry.assert_not_called()
                self.assertIs(hass.data['rollladenplaner'], manager)
                self.assertIs(entry.runtime_data, manager)

    def setUp(self):
        self.c,self.s=fixture()
        self.states={'cover.wohnen':FakeState('open',supported_features=140,current_position=100,current_tilt_position=0)}
        self.hass=types.SimpleNamespace(config=types.SimpleNamespace(time_zone='Europe/Berlin'),
            states=types.SimpleNamespace(get=lambda key:self.states.get(key)),services=types.SimpleNamespace(async_call=AsyncMock()))
        self.m=adapter.Manager(self.hass)
        self.m.engine=adapter.Engine(self.c)
        self.now=at('2026-10-30T07:00')
        clock=patch.object(adapter,'utcnow',lambda:self.now);clock.start();self.addCleanup(clock.stop)
        self.m.states=lambda:self.s;self.m.solar=solar
        self.m.engine.tick(self.now-timedelta(seconds=5),self.s,solar)
        self.intent=self.m.engine.tick(self.now,self.s,solar)['w']
        self.s['cover.wohnen']['attributes']['supported_features']=140
        timer=patch.object(adapter,'async_call_later');self.schedule=timer.start();self.addCleanup(timer.stop)
    async def test_tilt_precedes_height_with_two_second_pause(self):
        await self.m.advance('w',self.intent,self.now,self.s)
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_tilt_position')
        for elapsed in (1000,1500,1999):
            await self.m.advance('w',self.intent,self.now+timedelta(milliseconds=elapsed),self.s)
            self.assertEqual(self.hass.services.async_call.call_count,1)
        await self.m.advance('w',self.intent,self.now+timedelta(milliseconds=2000),self.s)
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_position')
        self.s['cover.wohnen']['attributes']['current_position']=0
        await self.m.advance('w',self.intent,self.now+timedelta(seconds=2),self.s)
        self.assertNotIn('w',self.m.moving)
        self.assertEqual(self.m.engine.rt['history'][0]['kind'],'done')
        self.assertEqual([call.args[1] for call in self.hass.services.async_call.call_args_list],['set_cover_tilt_position','set_cover_position'])
    async def test_height_timer_runs_before_the_next_regular_pulse(self):
        await self.m.pulse()
        self.schedule.assert_called_once()
        hass,delay,callback=self.schedule.call_args.args
        self.assertIs(hass,self.hass)
        self.assertEqual(delay,2.0)
        self.now+=timedelta(seconds=2.0)
        await callback(self.now)
        self.assertEqual([call.args[1] for call in self.hass.services.async_call.call_args_list],['set_cover_tilt_position','set_cover_position'])
        self.schedule.return_value.assert_called_once_with()
        await callback(self.now)
        self.assertEqual(self.hass.services.async_call.call_count,2)
    async def test_wait_starts_after_the_tilt_service_returns(self):
        async def slow_tilt(*args,**kwargs):
            self.now+=timedelta(seconds=2)
        self.hass.services.async_call.side_effect=slow_tilt
        await self.m.pulse()
        self.assertEqual(self.m.moving['w']['wait_until'],self.now+timedelta(seconds=2.0))
        callback=self.schedule.call_args.args[2]
        self.hass.services.async_call.side_effect=None
        self.now+=timedelta(milliseconds=1999)
        await self.m.pulse()
        self.assertEqual(self.hass.services.async_call.call_count,1)
        self.now+=timedelta(milliseconds=1)
        await callback(self.now)
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_position')
        self.assertEqual(self.m.moving['w']['deadline'],self.now+timedelta(seconds=150))
    async def test_height_timer_rechecks_contact_blocking(self):
        await self.m.pulse()
        callback=self.schedule.call_args.args[2]
        self.s['binary_sensor.fenster']['state']='on'
        self.now+=timedelta(seconds=2.0)
        await callback(self.now)
        self.assertEqual([call.args[1] for call in self.hass.services.async_call.call_args_list],['set_cover_tilt_position','stop_cover'])
        self.assertNotIn('w',self.m.moving)
        self.assertTrue(self.m.engine.rt['pending']['w']['time']['reason'])
        self.schedule.return_value.assert_called_once_with()
    async def test_disabling_program_cancels_the_height_timer(self):
        await self.m.pulse()
        callback=self.schedule.call_args.args[2]
        await self.m.action(types.SimpleNamespace(is_admin=True),{'action':'program','program':'p','value':False,'entity_id':['cover.wohnen'],'revision':self.m.revision})
        self.schedule.return_value.assert_called_once_with()
        self.now+=timedelta(seconds=2.0)
        await callback(self.now)
        self.assertNotIn('set_cover_position',[call.args[1] for call in self.hass.services.async_call.call_args_list])
        self.assertNotIn('w',self.m.moving)
    async def test_unload_cancels_the_height_timer_and_ignores_queued_callback(self):
        await self.m.pulse()
        callback=self.schedule.call_args.args[2]
        self.hass.data={adapter.DOMAIN:self.m}
        self.hass.config_entries=types.SimpleNamespace(async_unload_platforms=AsyncMock(return_value=True))
        self.m.unsub=Mock()
        self.assertTrue(await adapter.async_unload_entry(self.hass,types.SimpleNamespace(runtime_data=self.m)))
        self.m.unsub.assert_called_once_with()
        self.schedule.return_value.assert_called_once_with()
        self.now+=timedelta(seconds=2.0)
        await callback(self.now)
        self.assertNotIn('set_cover_position',[call.args[1] for call in self.hass.services.async_call.call_args_list])
        self.assertNotIn(adapter.DOMAIN,self.hass.data)
    async def test_failed_tilt_service_does_not_schedule_height(self):
        self.hass.services.async_call.side_effect=RuntimeError('offline')
        with self.assertLogs(adapter._LOGGER,level='WARNING'):
            await self.m.pulse()
        self.schedule.assert_not_called()
        self.assertNotIn('w',self.m.moving)
        self.assertNotIn('set_cover_position',[call.args[1] for call in self.hass.services.async_call.call_args_list])
    async def test_height_only_movement_does_not_schedule_a_tilt_wait(self):
        self.intent['tilt']=None
        await self.m.advance('w',self.intent,self.now,self.s)
        self.schedule.assert_not_called()
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_position')
    async def test_old_timer_cannot_advance_a_replacement_movement(self):
        await self.m.pulse()
        old_callback=self.schedule.call_args.args[2]
        old_motion=self.m.moving['w']
        await self.m.stop('w')
        self.schedule.return_value.assert_called_once_with()
        self.now+=timedelta(milliseconds=500)
        await self.m.pulse()
        self.assertIsNot(self.m.moving['w'],old_motion)
        new_callback=self.schedule.call_args.args[2]
        self.now+=timedelta(milliseconds=1500)
        await old_callback(self.now)
        self.assertNotIn('set_cover_position',[call.args[1] for call in self.hass.services.async_call.call_args_list])
        self.now+=timedelta(milliseconds=500)
        await new_callback(self.now)
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_position')
    async def test_saturday_1800_wait_1801_close_1802_edit_1803_can_skip(self):
        self.c['programs'][0]['days']=[5]
        self.c['programs'][0]['rides'][0].update(time='18:00',earliest='00:00',latest='23:59',position=85,tilt=0)
        self.m.engine=adapter.Engine(self.c)
        self.s['binary_sensor.fenster']['state']='on'
        self.now=at('2026-10-31T17:59:55');await self.m._pulse_locked()
        self.now=at('2026-10-31T18:00');await self.m._pulse_locked()
        self.hass.services.async_call.assert_not_called()
        admin=types.SimpleNamespace(is_admin=True)
        self.assertEqual(self.m.snapshot(admin)['planned'][0]['status'],'pending')
        self.s['binary_sensor.fenster']['state']='off';self.now=at('2026-10-31T18:01')
        await self.m._pulse_locked()
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_tilt_position')
        self.assertEqual(self.hass.services.async_call.call_args.args[2]['tilt_position'],0)
        self.s['cover.wohnen']['attributes']['current_tilt_position']=0
        self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_position')
        self.assertEqual(self.hass.services.async_call.call_args.args[2]['position'],85)
        self.s['cover.wohnen']['attributes']['current_position']=85
        self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.assertEqual(self.m.snapshot(admin)['planned'],[])
        changed=deepcopy(self.m.engine.config);changed['programs'][0]['rides'][0]['time']='18:03'
        self.now=at('2026-10-31T18:02');await self.m.save(changed,self.m.revision)
        row=self.m.snapshot(admin)['planned'][0];self.assertTrue(row['can_control']);self.assertTrue(row['can_undo'])
        await self.m.action(admin,{'action':'skip_today','value':True,'occurrence':row['occurrence'],'entity_id':['cover.wohnen'],'revision':self.m.revision})
        self.assertTrue(self.m.snapshot(admin)['planned'][0]['skip'])
        self.now=at('2026-10-31T18:03');await self.m._pulse_locked()
        self.assertEqual(self.m.snapshot(admin)['planned'],[])
    async def test_upgrade_rearms_stale_future_claim_and_preserves_new_skip(self):
        self.c['programs'][0]['days']=[5]
        self.c['programs'][0]['rides'][0].update(time='18:03',earliest='00:00',latest='23:59')
        self.now=at('2026-10-31T18:02');key='2026-10-31:r'
        self.m.store.async_load=AsyncMock(return_value={'config':self.c,'runtime':{'claimed':[key],
            'time_results':{key:{'date':'2026-10-31','status':'done','reason':''}},
            'skipped_occurrences':{key:{'date':'2026-10-31'}}},'revision':11})
        await self.m.load()
        self.assertNotIn(key,self.m.engine.rt['claimed'])
        self.assertNotIn(key,self.m.engine.rt['time_results'])
        admin=types.SimpleNamespace(is_admin=True)
        row=self.m.snapshot(admin)['planned'][0];self.assertFalse(row['skip'])
        await self.m.action(admin,{'action':'skip_today','value':True,'occurrence':key,'entity_id':['cover.wohnen'],'revision':self.m.revision})
        self.assertTrue(self.m.snapshot(admin)['planned'][0]['skip'])
        self.hass.services.async_call.assert_not_called()
    async def test_deferred_contact_closes_and_tilt_precedes_height(self):
        self.m.engine=adapter.Engine(self.c)
        self.s['binary_sensor.fenster']['state']='on'
        self.m.engine.tick(self.now-timedelta(seconds=5),self.s,solar)
        await self.m._pulse_locked()
        self.hass.services.async_call.assert_not_called()
        self.assertEqual(self.m.engine.planned_today(self.now,solar)[0]['status'],'pending')
        # Persisted pending goals also resume after a restart, without a new schedule edge.
        self.m.engine=adapter.Engine(self.m.engine.config,self.m.engine.rt)
        self.s['binary_sensor.fenster']['state']='off';self.now+=timedelta(seconds=5)
        await self.m._pulse_locked()
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_tilt_position')
        self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.assertEqual(self.hass.services.async_call.call_args.args[1],'set_cover_position')
        self.assertEqual(self.hass.services.async_call.call_args.args[2]['position'],0)
        self.s['cover.wohnen']['attributes']['current_position']=0
        self.now+=timedelta(seconds=5);await self.m._pulse_locked()
        self.assertEqual(self.m.engine.planned_today(self.now,solar),[])
    async def test_optional_wecker_rows_do_not_become_programs_or_executable_goals(self):
        user=types.SimpleNamespace(is_admin=True)
        row={'source':'wecker','time':(self.now+timedelta(minutes=1)).isoformat(),'targets':['w'],
             'cover_entity':'cover.wohnen','position':75,'tilt':None,'occurrence':'wecker:read-only','can_control':False}
        before=deepcopy(self.m.engine.config)
        with patch.object(adapter,'async_planned_wecker',AsyncMock(return_value=[row])):
            view=await self.m.async_snapshot(user)
        self.assertEqual(view['external_planned'],[row])
        self.assertEqual(self.m.engine.config,before)
        self.hass.services.async_call.assert_not_called()
        with self.assertRaises(ValueError):
            await self.m.action(user,{'action':'skip_today','value':True,'occurrence':'wecker:read-only','entity_id':['cover.wohnen'],'revision':self.m.revision})
        self.assertEqual(self.m.engine.config,before)

    async def test_wecker_rows_recheck_current_cover_selection_after_io(self):
        user=types.SimpleNamespace(is_admin=True)
        row={'source':'wecker','time':(self.now+timedelta(minutes=1)).isoformat(),'targets':['w'],
             'cover_entity':'cover.wohnen','position':75,'occurrence':'wecker:read-only'}
        async def changed(*args):
            self.m.engine.config['windows'][0]['cover']='cover.replaced'
            return [row]
        with patch.object(adapter,'async_planned_wecker',AsyncMock(side_effect=changed)):
            view=await self.m.async_snapshot(user)
        self.assertEqual(view['external_planned'],[])
        self.hass.services.async_call.assert_not_called()

    async def test_wecker_unavailable_keeps_the_native_planned_view(self):
        user=types.SimpleNamespace(is_admin=True)
        expected=self.m.snapshot(user)['planned']
        with patch.object(adapter,'async_planned_wecker',AsyncMock(return_value=[])):
            view=await self.m.async_snapshot(user)
        self.assertEqual(view['external_planned'],[])
        self.assertEqual(view['planned'],expected)

    async def test_wecker_preview_includes_tomorrow_but_rejects_outside_the_horizon(self):
        user=types.SimpleNamespace(is_admin=True)
        row={'source':'wecker','time':(self.now+timedelta(hours=23)).isoformat(),'targets':['w'],
             'cover_entity':'cover.wohnen','position':75,'occurrence':'wecker:tomorrow'}
        outside={**row,'occurrence':'wecker:outside','time':(self.now+timedelta(hours=24,seconds=1)).isoformat()}
        with patch.object(adapter,'async_planned_wecker',AsyncMock(return_value=[row,outside])):
            view=await self.m.async_snapshot(user)
        self.assertEqual(view['external_planned'],[row])
        self.hass.services.async_call.assert_not_called()

    async def test_tomorrows_native_row_keeps_skip_permissions(self):
        self.now=at('2026-11-13T23:00')
        self.c['programs'][0]['days']=[5]
        self.m.engine=adapter.Engine(self.c)
        user=types.SimpleNamespace(is_admin=False,permissions=types.SimpleNamespace(check_entity=lambda entity,policy:policy=='read'))
        row=self.m.snapshot(user)['planned'][0]
        self.assertEqual(row['occurrence'],'2026-11-14:r')
        self.assertFalse(row['can_control'])
        message={'action':'skip_today','value':True,'occurrence':row['occurrence'],
                 'entity_id':['cover.wohnen'],'revision':self.m.revision}
        with self.assertRaisesRegex(ValueError,'Steuerberechtigung'):
            await self.m.action(user,message)
        await self.m.action(types.SimpleNamespace(is_admin=True),message)
        self.assertTrue(self.m.snapshot(user)['planned'][0]['skip'])
        self.hass.services.async_call.assert_not_called()

    async def test_one_time_preview_also_uses_24_elapsed_hours_on_the_fall_dst_day(self):
        self.now=at('2026-10-25T00:01')
        self.m.engine.rt['one_time']=[{'id':name,'target':'w','position':75,
            'scheduled':(self.now+timedelta(hours=24,seconds=extra)).isoformat()}
            for name,extra in [('inside',0),('outside',1)]]
        rows=self.m.snapshot(types.SimpleNamespace(is_admin=True))['planned']
        self.assertEqual([row['occurrence'] for row in rows if row.get('one_time')],['inside'])

    async def test_height_timeout_after_tilt_and_pause(self):
        await self.m.advance('w',self.intent,self.now,self.s)
        await self.m.advance('w',self.intent,self.now+timedelta(seconds=2.0),self.s)
        await self.m.advance('w',self.intent,self.now+timedelta(seconds=154),self.s)
        services=[c.args[1] for c in self.hass.services.async_call.call_args_list]
        self.assertIn('set_cover_tilt_position',services)
        self.assertIn('set_cover_position',services)
        self.assertIn('stop_cover',services)
        self.assertEqual(self.m.engine.rt['history'][0]['kind'],'error')
    async def test_missing_feature_is_error(self):
        self.s['cover.wohnen']['attributes']['supported_features']=4
        await self.m.advance('w',self.intent,self.now,self.s)
        self.hass.services.async_call.assert_not_called()
        self.assertEqual(self.m.engine.rt['history'][0]['kind'],'error')
    async def test_command_failure_does_not_report_success(self):
        self.hass.services.async_call.side_effect=RuntimeError('fake offline')
        with self.assertLogs(adapter._LOGGER, level='WARNING'):
            await self.m.advance('w',self.intent,self.now,self.s)
        self.assertEqual(self.m.engine.rt['history'][0]['kind'],'error')
    async def test_stop_on_new_contact_block_before_tilt(self):
        self.m.states=lambda:self.s
        self.m.solar=solar
        adapter.utcnow=lambda:self.now
        await self.m.advance('w',self.intent,self.now,self.s)
        self.s['binary_sensor.fenster']['state']='on'
        await self.m._pulse_locked()
        self.assertNotIn('w',self.m.moving)
        self.assertIn('stop_cover',[c.args[1] for c in self.hass.services.async_call.call_args_list])
        self.assertTrue(self.m.engine.rt['pending']['w']['time']['reason'])
    async def test_removed_master_command_is_rejected(self):
        user=types.SimpleNamespace(is_admin=False)
        with self.assertRaisesRegex(ValueError,'Unbekannte Aktion'):
            await self.m.action(user,{'action':'master','value':False,'revision':0})
    async def test_controls_require_real_covers_not_spoofed_ids(self):
        user=types.SimpleNamespace(is_admin=False,permissions=types.SimpleNamespace(check_entity=lambda *a:False))
        for ids in ([],['cover.wohnen']):
            with self.assertRaisesRegex(ValueError,'Steuerberechtigung'):
                await self.m.action(user,{'action':'program','program':'p','target':'','value':False,'revision':0,'entity_id':ids})
        self.assertTrue(self.m.engine.config['programs'][0]['enabled'])
    async def test_websocket_schema_uses_current_core_validator(self):
        message=adapter.ws_action.ws_schema({'id':1,'type':'rollladenplaner/action','action':'skip','value':True,'revision':0})
        self.assertEqual(message['entity_id'],[])
        with self.assertRaises(schema.Invalid):
            adapter.ws_action.ws_schema({'id':1,'type':'rollladenplaner/action','action':'skip','value':'yes','revision':0})
    async def test_websocket_schema_accepts_one_time_movement_fields(self):
        message=adapter.ws_action.ws_schema({'id':1,'type':'rollladenplaner/action','action':'add_once',
            'value':True,'revision':0,'target':'w','time':'08:58','position':85,'tilt':None,'entity_id':['cover.wohnen']})
        self.assertEqual((message['time'],message['position'],message['tilt']),('08:58',85.0,None))
    async def test_stale_revision_is_rejected(self):
        with self.assertRaisesRegex(ValueError,'geändert'):
            await self.m.save(self.c,99)
    async def test_read_snapshot_omits_unauthorized_program(self):
        user=types.SimpleNamespace(is_admin=False,permissions=types.SimpleNamespace(check_entity=lambda *a:False))
        view=self.m.snapshot(user)
        self.assertEqual(view['config']['windows'],[])
        self.assertEqual(view['config']['programs'],[])
        self.assertEqual(view['planned'],[])
        self.assertNotIn('history',view)
    async def test_fixed_150_seconds_ignores_legacy_window_value(self):
        await self.m.advance('w',self.intent,self.now,self.s)
        self.assertNotIn('deadline',self.m.moving['w'])
        await self.m.advance('w',self.intent,self.now+timedelta(seconds=2.0),self.s)
        self.assertEqual(self.m.moving['w']['deadline'],self.now+timedelta(seconds=152.0))
        await self.m.advance('w',self.intent,self.now+timedelta(seconds=150),self.s)
        self.assertIn('w',self.m.moving)
        await self.m.advance('w',self.intent,self.now+timedelta(milliseconds=151999),self.s)
        self.assertIn('w',self.m.moving)
        await self.m.advance('w',self.intent,self.now+timedelta(seconds=152.0),self.s)
        self.assertNotIn('w',self.m.moving)
    async def test_skip_today_stops_current_motion_without_marking_next(self):
        await self.m.advance('w',self.intent,self.now,self.s)
        self.now+=timedelta(seconds=20)
        user=types.SimpleNamespace(is_admin=True)
        await self.m.action(user,{'action':'skip_today','value':True,'occurrence':'2026-10-30:r','entity_id':['cover.wohnen'],'revision':0})
        self.assertNotIn('w',self.m.moving)
        self.assertFalse(self.m.engine.config['programs'][0]['rides'][0]['skip_next'])
        self.assertFalse(self.m.engine.rt['pending'])
        self.assertIn('stop_cover',[c.args[1] for c in self.hass.services.async_call.call_args_list])
    async def test_planned_skip_permissions_and_spoofed_ids(self):
        self.m.engine=adapter.Engine(self.c);self.now=at('2026-10-30T06:30')
        user=types.SimpleNamespace(is_admin=False,permissions=types.SimpleNamespace(check_entity=lambda *a:False))
        for ids in ([],['cover.wohnen']):
            with self.assertRaisesRegex(ValueError,'Steuerberechtigung'):
                await self.m.action(user,{'action':'skip_today','value':True,'occurrence':'2026-10-30:r','entity_id':ids,'revision':0})
        self.assertFalse(self.m.engine.rt['skipped_occurrences'])
    async def test_completed_occurrence_cannot_accidentally_skip_tomorrow(self):
        self.m.engine.finish('w',self.intent,self.now)
        self.now+=timedelta(minutes=1)
        with self.assertRaisesRegex(ValueError,'nicht mehr offen'):
            await self.m.action(types.SimpleNamespace(is_admin=True),{'action':'skip_today','value':True,'occurrence':'2026-10-30:r','entity_id':['cover.wohnen'],'revision':0})
        self.assertFalse(self.m.engine.config['programs'][0]['rides'][0]['skip_next'])
    async def test_snapshot_exposes_moving_status(self):
        await self.m.advance('w',self.intent,self.now,self.s)
        view=self.m.snapshot(types.SimpleNamespace(is_admin=True))
        self.assertEqual(view['planned'][0]['status'],'moving')
    async def test_upgrade_drops_old_timeout_and_pauses_legacy_sensor_rules(self):
        c=deepcopy(self.c)
        c['windows'][0]['climate']={'lux_entity':'sensor.lux','temp_entity':'sensor.temp','lux_on':30000,'lux_off':20000,'temp_on':25,'temp_off':23,'policy':'defer'}
        self.m.store.async_load.return_value={'config':c,'runtime':{},'revision':5}
        await self.m.load()
        self.assertTrue(self.m.engine.config['enabled'])
        self.assertFalse(self.m.engine.config['programs'][0]['enabled'])
        self.assertNotIn('travel_seconds',self.m.engine.config['windows'][0])
        self.assertFalse(next(p for p in self.m.engine.config['programs'] if p['id']==AUTO)['enabled'])
    async def test_save_checks_direct_sensor_tilt_capability(self):
        c=deepcopy(self.c)
        c['windows'][0]['cover_type']='blind'
        c['windows'][0]['climate']={'lux_entity':'sensor.lux','temp_entity':'sensor.temp','lux_on':30000,'lux_off':20000,'temp_on':25,'temp_off':23,'auto_shade':True,'shade_position':0,'shade_tilt':100,'release_delay_seconds':45}
        self.states['cover.wohnen'].attributes['supported_features']=12
        with self.assertRaisesRegex(ValueError,'Lamellensteuerung'):
            await self.m.save(c,0)
    async def test_multiple_cover_import_and_local_rename_do_not_change_ha_entities(self):
        c=deepcopy(self.c);c['enabled']=False;c['windows'][0]['name']='Neuer Anzeigename'
        c['windows'].extend([{'id':'w2','name':'Essen','cover':'cover.essen','enabled':True,'contacts':[]},
                             {'id':'w3','name':'Küche','cover':'cover.kueche','enabled':True,'contacts':[]}])
        await self.m.save(c,0)
        self.assertEqual(len(self.m.engine.config['windows']),3)
        self.assertEqual(self.m.engine.config['windows'][0]['name'],'Neuer Anzeigename')
        self.hass.services.async_call.assert_not_called()
        self.assertEqual(self.states['cover.wohnen'].attributes['current_position'],100)
    async def test_vacation_does_not_stop_independent_shading(self):
        c=deepcopy(self.c)
        c['windows'][0]['climate']={'lux_entity':'sensor.lux','temp_entity':'sensor.temp','lux_on':30000,'lux_off':20000,'temp_on':25,'temp_off':23,'auto_shade':True,'shade_position':0,'shade_tilt':100,'release_delay_seconds':45}
        self.m.engine=adapter.Engine(c)
        self.s.update({'sensor.lux':{'state':'40000'},'sensor.temp':{'state':'28'}})
        ready=self.m.engine.tick(self.now,self.s,solar)
        await self.m.advance('w',ready['w'],self.now,self.s)
        self.hass.services.async_call.reset_mock()
        await self.m.action(types.SimpleNamespace(is_admin=True),{'action':'vacation','value':True,'revision':0})
        self.assertEqual(self.m.moving['w']['intent']['kind'],'sensor')
        self.assertNotIn('stop_cover',[c.args[1] for c in self.hass.services.async_call.call_args_list])
    async def test_sensor_pause_cancels_running_motion_but_keeps_programs_enabled(self):
        c=deepcopy(self.c)
        c['windows'][0]['climate']={'temp_entity':'sensor.temp','temp_on':23,'temp_off':21,'auto_shade':True,'shade_position':0,'shade_tilt':100,'release_delay_seconds':0}
        self.s['sensor.temp']={'state':'28'};self.m.engine=adapter.Engine(c)
        ready=self.m.engine.tick(self.now,self.s,solar);await self.m.advance('w',ready['w'],self.now,self.s)
        self.hass.services.async_call.reset_mock()
        await self.m.action(types.SimpleNamespace(is_admin=True),{'action':'sensor_pause','target':'program:'+AUTO,'value':True,'entity_id':['cover.wohnen'],'revision':0})
        self.assertNotIn('w',self.m.moving)
        self.assertTrue(self.m.engine.sensor_paused('program:'+AUTO,self.now))
        self.assertTrue(self.m.engine.config['programs'][0]['enabled'])
        self.assertEqual([c.args[1] for c in self.hass.services.async_call.call_args_list],['stop_cover'])
    async def test_sensor_pause_requires_control_of_actual_target_entities(self):
        c=deepcopy(self.c);c['windows'][0]['climate']={'temp_entity':'sensor.temp','auto_shade':True,'shade_position':0,'release_delay_seconds':0}
        self.m.engine=adapter.Engine(c)
        user=types.SimpleNamespace(is_admin=False,permissions=types.SimpleNamespace(check_entity=lambda *a:False))
        for ids in ([],['cover.wohnen']):
            with self.assertRaisesRegex(ValueError,'Steuerberechtigung'):
                await self.m.action(user,{'action':'sensor_pause','target':'program:'+AUTO,'value':True,'entity_id':ids,'revision':0})
        self.assertFalse(self.m.engine.rt['sensor_pauses'])
    async def test_hidden_covers_do_not_leak_through_sensor_program_list(self):
        c=deepcopy(self.c);c['windows'][0]['climate']={'temp_entity':'sensor.temp','auto_shade':True,'shade_position':0,'release_delay_seconds':0}
        self.m.engine=adapter.Engine(c)
        user=types.SimpleNamespace(is_admin=False,permissions=types.SimpleNamespace(check_entity=lambda *a:False))
        self.assertEqual(self.m.snapshot(user)['sensor_programs'],[])

    async def test_new_installation_has_no_hidden_master_pause(self):
        fresh=adapter.Manager(self.hass)
        self.assertTrue(fresh.engine.config['enabled'])
    async def test_old_master_pause_becomes_individual_pauses(self):
        c=deepcopy(self.c);c['enabled']=False
        c['windows'][0]['climate']={'temp_entity':'sensor.temp','temp_on':23,'temp_off':21,'auto_shade':True,'shade_position':0}
        self.m.store.async_load.return_value={'config':c,'runtime':{},'revision':1}
        await self.m.load()
        self.assertTrue(self.m.engine.config['enabled'])
        self.assertFalse(self.m.engine.config['programs'][0]['enabled'])
        self.assertFalse(next(p for p in self.m.engine.config['programs'] if p['id']==AUTO)['enabled'])
    async def test_old_active_master_preserves_individual_program_choices(self):
        c=deepcopy(self.c);c['enabled']=True
        self.m.store.async_load.return_value={'config':c,'runtime':{},'revision':1}
        await self.m.load()
        self.assertTrue(self.m.engine.config['programs'][0]['enabled'])
    async def test_import_preserves_pause_through_individual_controls(self):
        c=deepcopy(self.c);c['enabled']=False
        await self.m.save(c,0)
        self.assertTrue(self.m.engine.config['enabled'])
        self.assertFalse(self.m.engine.config['programs'][0]['enabled'])
        await self.m.action(types.SimpleNamespace(is_admin=True),{'action':'program','value':True,'program':'p','entity_id':['cover.wohnen'],'revision':self.m.revision})
        self.assertTrue(self.m.engine.config['programs'][0]['enabled'])

    async def test_master_migration_preserves_legacy_ride_ids_for_runtime_migration(self):
        c=deepcopy(self.c)
        c['windows'].append(dict(c['windows'][0],id='w2',cover='cover.essen'))
        c['programs'][0]['rides'][0]['targets']=['w','w2']
        normalized=adapter.Manager.individual_controls(c)
        self.assertEqual(len(normalized['programs'][0]['rides']),1)
        self.assertEqual(normalized['programs'][0]['rides'][0]['id'],'r')
        loaded=adapter.Engine(normalized)
        self.assertEqual(len(loaded.config['programs'][0]['rides']),2)

    async def test_enabling_competing_named_rule_program_is_rejected_and_rolled_back(self):
        c=deepcopy(self.c);c['windows'][0]['sensor_rules']=[{'id':'a','name':'A','temp_entity':'sensor.temp'},{'id':'b','name':'B','temp_entity':'sensor.temp'}]
        first=deepcopy(c['programs'][0]);first.update(kind='sensor',start_on_high=True);first['rides'][0].update(sensor_rule='a',edge='active')
        second=deepcopy(first);second.update(id='second',enabled=False);second['rides'][0].update(id='other_ride',sensor_rule='b')
        c['programs']=[first,second];self.m.engine=adapter.Engine(c)
        with self.assertRaises(ValueError):
            await self.m.action(types.SimpleNamespace(is_admin=True),{'action':'program','value':True,'program':'second','entity_id':['cover.wohnen'],'revision':0})
        self.assertFalse(self.m.engine.config['programs'][1]['enabled']);self.assertEqual(self.m.revision,0)
        self.hass.services.async_call.assert_not_called()

    async def test_rule_parameters_can_be_saved_with_an_unchanged_offline_cover(self):
        c=deepcopy(self.c)
        c['windows'].append({'id':'offline','name':'Offline','cover':'cover.offline','enabled':True,'contacts':[],'cover_type':'auto'})
        r=deepcopy(c['programs'][0]['rides'][0]);r.update(id='offline_ride',targets=['offline'],position=80,tilt=50)
        c['programs'][0]['rides'].append(r)
        self.m.engine=adapter.Engine(c)
        updated=deepcopy(self.m.engine.config)
        updated['windows'][0]['sensor_rules']=[{'id':'summer','name':'Sommer','temp_entity':'sensor.temp','temp_on':25,'temp_off':23,'release_delay_seconds':300}]
        await self.m.save(updated,0)
        self.assertEqual(self.m.engine.windows()['w']['sensor_rules'][0]['name'],'Sommer')
        self.assertEqual(self.m.engine.config['programs'][0]['rides'][1]['tilt'],50)
        self.assertTrue(self.m.store.async_save.called)

    async def test_changed_motor_goal_still_requires_available_cover(self):
        c=deepcopy(self.c)
        c['windows'].append({'id':'offline','name':'Offline','cover':'cover.offline','enabled':True,'contacts':[]})
        r=deepcopy(c['programs'][0]['rides'][0]);r.update(id='offline_ride',targets=['offline'],position=80,tilt=50)
        c['programs'][0]['rides'].append(r);self.m.engine=adapter.Engine(c)
        changed=deepcopy(self.m.engine.config);changed['programs'][0]['rides'][1]['position']=70
        with self.assertRaisesRegex(ValueError,'Entität nicht gefunden'):
            await self.m.save(changed,0)
        self.assertEqual(self.m.engine.config['programs'][0]['rides'][1]['position'],80)
        self.assertFalse(self.m.store.async_save.called)

    async def test_rule_parameters_can_be_saved_when_own_cover_metadata_is_unavailable(self):
        c=deepcopy(self.c);self.m.engine=adapter.Engine(c);self.states.clear()
        changed=deepcopy(self.m.engine.config)
        changed['windows'][0]['sensor_rules']=[{'id':'summer','name':'Sommer','temp_entity':'sensor.temp'}]
        await self.m.save(changed,0)
        self.assertEqual(self.m.engine.config['programs'][0]['rides'][0]['tilt'],50)
        self.assertEqual(self.m.engine.windows()['w']['sensor_rules'][0]['name'],'Sommer')

    async def test_snapshot_identifies_loaded_backend_and_sensor_rule_schema(self):
        snapshot=self.m.snapshot(types.SimpleNamespace(is_admin=True))
        self.assertEqual(snapshot['backend_version'],adapter.INTEGRATION_VERSION)
        self.assertEqual(snapshot['config_schema'],7)

    async def test_overview_uses_today_in_ha_timezone_even_after_sunset(self):
        self.now=at('2026-10-30T23:50')
        view=self.m.snapshot(types.SimpleNamespace(is_admin=True))
        self.assertEqual(view['sun_times']['date'],'2026-10-30')
        self.assertEqual(view['sun_times']['sunrise'],solar('sunrise',self.now.astimezone(self.m.engine.zone).date()).isoformat())
        self.assertEqual(view['sun_times']['sunset'],'2026-10-30T18:00:00+01:00')
        self.assertEqual(view['time_zone'],'Europe/Berlin')
        self.m.solar=lambda *args:None
        self.assertIsNone(self.m.snapshot(types.SimpleNamespace(is_admin=True))['sun_times']['sunrise'])

    async def test_display_sorts_rides_by_effective_time_without_changing_runtime(self):
        c=deepcopy(self.c);base=c['programs'][0]['rides'][0]
        specifications=[('evening',{'time':'18:00'}),('sunset',{'event':'sunset','offset':60,'latest':'18:30'}),
                        ('before_sunrise',{'event':'sunrise','offset':-30,'earliest':'07:15'}),
                        ('equal_time',{'time':'07:15'}),('sunrise',{'event':'sunrise'}),('morning',{'time':'06:30'})]
        c['programs'][0]['rides']=[dict(deepcopy(base),id=key,earliest='00:00',latest='23:59') for key,_ in specifications]
        for ride,(_,values) in zip(c['programs'][0]['rides'],specifications):ride.update(values)
        self.m.engine=adapter.Engine(c)
        before=deepcopy(self.m.engine.config);runtime=deepcopy(self.m.engine.rt)
        view=self.m.snapshot(types.SimpleNamespace(is_admin=True))
        self.assertEqual([r['id'] for r in view['config']['programs'][0]['rides']],
                         ['morning','before_sunrise','equal_time','sunrise','evening','sunset'])
        self.assertEqual(self.m.engine.config,before)
        self.assertEqual(self.m.engine.rt,runtime)
        self.hass.services.async_call.assert_not_called()
        self.m.solar=lambda event,day:None
        view=self.m.snapshot(types.SimpleNamespace(is_admin=True))
        self.assertEqual([r['id'] for r in view['config']['programs'][0]['rides']],
                         ['morning','equal_time','evening','sunset','before_sunrise','sunrise'])

    async def test_overview_sensor_names_and_ids_respect_entity_read_access(self):
        c=deepcopy(self.c)
        c['windows'][0]['sensor_rules']=[{'id':'summer','name':'Sommer','temp_entity':'sensor.temp','lux_entity':'sensor.lux'}]
        c['windows'].append({'id':'hidden','name':'Privat','cover':'cover.hidden','contacts':[],
                             'sensor_rules':[{'id':'x','name':'Privat','temp_entity':'sensor.private'}]})
        c['sensor_names']={'sensor.temp':'Außen','sensor.lux':'Helligkeit','sensor.private':'Privat','sensor.unused':'Alte Zuordnung'}
        self.m.engine=adapter.Engine(c)
        admin=self.m.snapshot(types.SimpleNamespace(is_admin=True))
        self.assertEqual(admin['sensor_entities'],['binary_sensor.fenster','sensor.lux','sensor.private','sensor.temp'])
        allowed={'cover.wohnen','sensor.temp'}
        user=types.SimpleNamespace(is_admin=False,permissions=types.SimpleNamespace(check_entity=lambda entity,policy:entity in allowed))
        view=self.m.snapshot(user)
        self.assertEqual(view['sensor_entities'],['sensor.temp'])
        self.assertEqual(view['config']['sensor_names'],{'sensor.temp':'Außen'})

    async def test_sensor_name_save_preserves_sensor_runtime_and_survives_store_reload(self):
        c=deepcopy(self.c)
        earlier=deepcopy(c['programs'][0]['rides'][0]);earlier.update(id='earlier',time='06:30')
        c['programs'][0]['rides'].append(earlier)
        c['windows'][0]['sensor_rules']=[{'id':'summer','name':'Sommer','temp_entity':'sensor.temp'}]
        self.m.engine=adapter.Engine(c)
        motion={'intent':{'id':'existing-motion'},'phase':'height'}
        self.m.moving['w']=motion
        runtime=deepcopy(self.m.engine.rt)
        changed=self.m.snapshot(types.SimpleNamespace(is_admin=True))['config'];changed['sensor_names']={'sensor.temp':'  Außentemperatur  '}
        await self.m.save(changed,0)
        self.assertEqual(self.m.engine.config['sensor_names'],{'sensor.temp':'Außentemperatur'})
        self.assertEqual(self.m.engine.rt,runtime)
        self.assertIs(self.m.moving['w'],motion)
        saved=deepcopy(self.m.store.async_save.call_args.args[0])
        loaded=adapter.Manager(self.hass);loaded.store.async_load.return_value=saved
        await loaded.load()
        self.assertEqual(loaded.engine.config['sensor_names'],{'sensor.temp':'Außentemperatur'})
        self.hass.services.async_call.assert_not_called()

    async def test_selected_sensors_survive_save_reload_without_motor_commands(self):
        changed=deepcopy(self.m.engine.config)
        changed['sensors']=['sensor.new_temperature','binary_sensor.new_contact']
        await self.m.save(changed,0)
        saved=deepcopy(self.m.store.async_save.call_args.args[0])
        loaded=adapter.Manager(self.hass);loaded.store.async_load.return_value=saved
        await loaded.load()
        self.assertEqual(loaded.engine.config['sensors'],['binary_sensor.new_contact','sensor.new_temperature'])
        loaded.states=self.m.states;loaded.solar=self.m.solar
        self.assertIn('sensor.new_temperature',loaded.snapshot(types.SimpleNamespace(is_admin=True))['sensor_entities'])
        self.hass.services.async_call.assert_not_called()

    async def test_selected_sensor_metadata_respects_read_permissions(self):
        config=deepcopy(self.c);config['sensors']=['sensor.allowed','sensor.private']
        config['sensor_names']={'sensor.allowed':'Allowed','sensor.private':'Private'}
        self.m.engine=adapter.Engine(config)
        user=types.SimpleNamespace(is_admin=False,permissions=types.SimpleNamespace(check_entity=lambda entity,policy:entity=='sensor.allowed'))
        snapshot=self.m.snapshot(user)
        self.assertEqual(snapshot['config']['sensors'],['sensor.allowed'])
        self.assertEqual(snapshot['sensor_entities'],['sensor.allowed'])
        self.assertEqual(snapshot['config']['sensor_names'],{'sensor.allowed':'Allowed'})

    async def test_websocket_rejects_incompatible_save_schema(self):
        self.hass.data={'rollladenplaner':self.m}
        from unittest.mock import Mock
        connection=types.SimpleNamespace(user=types.SimpleNamespace(is_admin=True),send_error=Mock(),send_result=Mock())
        await adapter.ws_save(self.hass,connection,{'id':42,'config':self.c,'revision':0,'config_schema':1})
        self.assertTrue(connection.send_error.called);self.assertFalse(connection.send_result.called)
        self.assertFalse(self.m.store.async_save.called)

    async def test_settings_snapshot_includes_cover_status_and_recent_command_history(self):
        self.states['cover.wohnen']=FakeState('opening',supported_features=140,current_position=42,current_tilt_position=18)
        self.m.engine.log(self.now,'done','Wohnen: Höhe 42% ausgeführt',window='w')
        self.m.engine.log(self.now+timedelta(seconds=1),'error','Wohnen: Befehl fehlgeschlagen',window='w')
        view=self.m.snapshot(types.SimpleNamespace(is_admin=True))
        self.assertEqual(view['cover_states'],[{'window':'w','state':'opening','position':42,'tilt':18,'moving':False}])
        self.assertEqual([row['kind'] for row in view['command_history']],['error','done'])

    async def test_settings_snapshot_hides_status_and_history_without_entity_read_permission(self):
        self.states['cover.wohnen']=FakeState('open',supported_features=140,current_position=100,current_tilt_position=0)
        self.m.engine.log(self.now,'error','Wohnen: Befehl fehlgeschlagen',window='w')
        user=types.SimpleNamespace(is_admin=False,permissions=types.SimpleNamespace(check_entity=lambda entity,policy:False))
        view=self.m.snapshot(user)
        self.assertEqual(view['cover_states'],[])
        self.assertEqual(view['command_history'],[])

class ShadingMigrationAdapterTests(IsolatedAsyncioTestCase):
    async def test_original_model_backup_is_retained_once_across_restart_and_save(self):
        from test_shading_programs import MigrationTests
        legacy,_=MigrationTests().legacy()
        hass=types.SimpleNamespace(config=types.SimpleNamespace(time_zone='Europe/Berlin'))
        manager=adapter.Manager(hass);original={'config':deepcopy(legacy),'runtime':{},'revision':4}
        manager.store.async_load=AsyncMock(return_value=original)
        with patch.object(adapter,'utcnow',lambda:at('2026-10-30T12:00')):
            await manager.load();await manager.persist()
            saved=deepcopy(manager.store.async_save.call_args.args[0])
            self.assertEqual(saved['migration_backup']['config'],legacy)
            self.assertEqual(saved['config']['model_version'],2)
            self.assertEqual(len(saved['config']['programs']),2)
            manager.store.async_load=AsyncMock(return_value=saved)
            await manager.load();manager.engine.config['programs'][0]['name']='Updated'
            await manager.persist()
            self.assertEqual(manager.store.async_save.call_args.args[0]['migration_backup'],saved['migration_backup'])

    async def test_schema_five_or_missing_cannot_overwrite_program_conditions(self):
        from test_shading_programs import shading_fixture
        from unittest.mock import Mock
        config,_=shading_fixture();hass=types.SimpleNamespace(config=types.SimpleNamespace(time_zone='Europe/Berlin'))
        manager=adapter.Manager(hass);manager.engine=adapter.Engine(config);hass.data={'rollladenplaner':manager}
        for version in [5,6,None]:
            connection=types.SimpleNamespace(user=types.SimpleNamespace(is_admin=True),send_error=Mock(),send_result=Mock())
            message={'id':1,'config':config,'revision':0}
            if version is not None:message['config_schema']=version
            await adapter.ws_save(hass,connection,message)
            connection.send_error.assert_called_once();connection.send_result.assert_not_called()
        manager.store.async_save.assert_not_called()

    async def test_shared_program_requires_control_permission_for_every_target(self):
        from test_shading_programs import shading_fixture
        config,states=shading_fixture()
        hass=types.SimpleNamespace(config=types.SimpleNamespace(time_zone='Europe/Berlin'),
            states=types.SimpleNamespace(get=lambda entity:FakeState(states[entity]['state'],**states[entity].get('attributes',{})) if entity in states else None))
        manager=adapter.Manager(hass);manager.engine=adapter.Engine(config);manager.states=lambda:states;manager.solar=solar
        user=types.SimpleNamespace(is_admin=False,permissions=types.SimpleNamespace(check_entity=lambda entity,policy:policy=='read' or entity=='cover.wohnen'))
        with patch.object(adapter,'utcnow',lambda:at('2026-10-30T12:00')):
            snapshot=manager.snapshot(user)
            self.assertFalse(snapshot['controls']['shade'])
            with self.assertRaisesRegex(ValueError,'Steuerberechtigung'):
                await manager.action(user,{'action':'sensor_pause','target':'program:shade','value':True,
                    'entity_id':['cover.wohnen','cover.east'],'revision':0})
        manager.store.async_save.assert_not_called()
