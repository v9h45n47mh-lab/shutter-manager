"""Explicit HA fakes: adapter behavior and real WS schema, not HA Core validation."""
import importlib.util
from pathlib import Path
import sys
import types
from copy import deepcopy
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch
import probatio as vol
from test_engine import fixture, program, action, lamp, state, at

ROOT=Path(__file__).resolve().parents[1]
def module(name,**attrs):
    obj=types.ModuleType(name)
    for k,v in attrs.items():setattr(obj,k,v)
    sys.modules[name]=obj;return obj
for name in ('homeassistant','homeassistant.components','homeassistant.helpers'):
    module(name)
def identity(*args,**kwargs):
    return args[0] if len(args)==1 and callable(args[0]) else lambda fn:fn

def schema(definition):
    def decorator(fn):fn.ws_schema=vol.Schema({vol.Required('id'):int}).extend(definition);return fn
    return decorator
module('homeassistant.components.frontend',add_extra_js_url=identity)
module('homeassistant.components.websocket_api',websocket_command=schema,require_admin=identity,async_response=identity,async_register_command=identity)
module('homeassistant.components.http',StaticPathConfig=lambda *a:None)
module('homeassistant.const',EVENT_HOMEASSISTANT_STARTED='started',Platform=types.SimpleNamespace(SENSOR='sensor'))
module('homeassistant.core',callback=identity)
module('homeassistant.helpers.area_registry',async_get=lambda h:getattr(h,'areas',types.SimpleNamespace(async_list_areas=lambda:[])))
module('homeassistant.helpers.device_registry',async_get=lambda h:getattr(h,'devices',types.SimpleNamespace(async_get=lambda ident:None)))
module('homeassistant.helpers.entity_registry',async_get=lambda h:h.registry)
module('homeassistant.helpers.dispatcher',async_dispatcher_send=identity)
module('homeassistant.helpers.event',async_track_state_change_event=lambda *a:lambda:None,async_track_time_interval=lambda *a:lambda:None)
module('homeassistant.helpers.service',async_register_admin_service=identity)
module('homeassistant.helpers.sun',get_astral_event_date=lambda *a:None)
class Store:
    def __init__(self,*a):self.async_save=AsyncMock();self.async_load=AsyncMock(return_value=None)
module('homeassistant.helpers.storage',Store=Store)
spec=importlib.util.spec_from_file_location('lm_adapter',ROOT/'custom_components/light_manager/__init__.py',submodule_search_locations=[str(ROOT/'custom_components/light_manager')])
adapter=importlib.util.module_from_spec(spec);sys.modules[spec.name]=adapter;spec.loader.exec_module(adapter)

class AdapterTests(IsolatedAsyncioTestCase):
    def setUp(self):
        self.s={'light.flur':state('off',supported_color_modes=['color_temp'],supported_features=32)}
        def states():return [types.SimpleNamespace(entity_id=e,state=v['state'],attributes=v['attributes']) for e,v in self.s.items()]
        self.hass=types.SimpleNamespace(config=types.SimpleNamespace(time_zone='Europe/Berlin'),data={},
            registry=types.SimpleNamespace(async_get=lambda e:types.SimpleNamespace(platform='hue') if e=='scene.flur_abend' else None),
            states=types.SimpleNamespace(async_all=states,get=lambda e:next((s for s in states() if s.entity_id==e),None)),
            services=types.SimpleNamespace(async_call=AsyncMock()))
        self.m=adapter.Manager(self.hass);self.hass.data[adapter.DOMAIN]=self.m
        self.now=at('2026-11-01T17:30:00');self.patch=patch.object(adapter,'utcnow',lambda:self.now);self.patch.start();self.addCleanup(self.patch.stop)

    async def test_ws_save_accepts_structured_config_and_persists_without_duplicate_calls(self):
        c=fixture(program('p','time',[action(time='18:00')]))
        checked=adapter.ws_save.ws_schema({'id':1,'type':'light_manager/save','config':c,'revision':0})
        self.assertEqual(checked['config'],c)
        await self.m.save(c,0);self.assertEqual(self.m.revision,1)
        self.assertEqual(self.hass.services.async_call.call_args.args[:2],('light','turn_on'))
        self.assertEqual(self.hass.services.async_call.call_args.args[2]['brightness_pct'],80)
        self.assertEqual(self.m.store.async_save.call_args.args[0]['config'],c)
        await self.m.pulse();self.assertEqual(self.hass.services.async_call.await_count,1)
        snapshot=self.m.snapshot();self.assertEqual(snapshot['config'],c)

    async def test_unsupported_light_values_are_visible_and_not_silently_dropped(self):
        self.s['light.flur']['attributes']['supported_color_modes']=['onoff']
        await self.m.save(fixture(program('p','time',[action(time='18:00')])),0)
        self.hass.services.async_call.assert_not_called();self.assertIn('keine Helligkeitssteuerung',str(self.m.errors))
        self.assertTrue(self.m.engine.rt['controlled'])

    async def test_service_failure_retries_after_thirty_seconds_and_retains_goal(self):
        self.hass.services.async_call.side_effect=RuntimeError('Bridge nicht erreichbar')
        await self.m.save(fixture(program('p','time',[action(time='18:00')])),0)
        self.assertTrue(self.m.errors);self.assertFalse(self.m.engine.rt['delivered'])
        await self.m.pulse();self.assertEqual(self.hass.services.async_call.await_count,1)
        self.now+=adapter.timedelta(seconds=30);self.hass.services.async_call.side_effect=None
        await self.m.pulse();self.assertEqual(self.hass.services.async_call.await_count,2);self.assertFalse(self.m.errors)

    async def test_stale_revision_cannot_overwrite_saved_config(self):
        c=fixture();await self.m.save(c,0)
        other=deepcopy(c);other['lamps'][0]['name']='Überschreiben'
        with self.assertRaises(ValueError):await self.m.save(other,0)
        self.assertEqual(self.m.engine.config,c)

    async def test_invalid_target_domain_and_non_hue_scene_never_saved(self):
        c=fixture();c['lamps'][0]['entity']='switch.flur'
        with self.assertRaises(ValueError):await self.m.save(c,0)
        c=fixture();c['scenes']=[{'id':'s','name':'s','entity':'scene.fremd','targets':['l'],'scope_confirmed':True}]
        with self.assertRaises(ValueError):await self.m.save(c,0)
        self.assertEqual(self.m.revision,0)

    async def test_only_light_services_are_used_after_legacy_migration(self):
        c=fixture(program('p','time',[action('normal',time='18:00'),action('old',mode='scene',scene='s')]))
        c.update(schema=1,groups=[],scenes=[{'id':'s','name':'old'}])
        await self.m.save(c,0)
        self.assertEqual([a['id'] for a in self.m.engine.config['programs'][0]['actions']],['normal'])
        self.assertTrue(all(call.args[0]=='light' for call in self.hass.services.async_call.call_args_list))

    async def test_get_does_not_advance_engine_or_write_store(self):
        before=deepcopy(self.m.engine.rt);self.m.snapshot();self.m.snapshot()
        self.assertEqual(self.m.engine.rt,before);self.m.store.async_save.assert_not_called()

    async def test_store_failure_prevents_device_commands(self):
        self.m.store.async_save.side_effect=RuntimeError('Storage unavailable')
        with self.assertRaises(RuntimeError):await self.m.save(fixture(program('p','time',[action()])),0)
        self.hass.services.async_call.assert_not_called()
        self.assertEqual(self.m.revision,0)
        self.assertEqual(self.m.engine.config['programs'],[])

    async def test_on_and_off_explicitly_override_legacy_fades_with_zero(self):
        for mode in ('on','off'):
            a=action(mode=mode,transition=45)
            data=self.m.service_data(a,self.s['light.flur'])
            self.assertEqual(data['transition'],0)
        self.s['light.flur']['attributes']['supported_features']=0
        self.assertEqual(self.m.service_data(action(mode='off'),self.s['light.flur']),{'transition':0})

    async def test_last_color_sends_no_color_fields_and_keeps_brightness_independent(self):
        a=action(brightness=25,kelvin=None,rgb=None)
        data=self.m.service_data(a,self.s['light.flur'])
        self.assertEqual(data,{'brightness_pct':25,'transition':0})

    async def test_white_temperature_must_fit_each_individual_light(self):
        self.s['light.flur']['attributes'].update(min_color_temp_kelvin=3000,max_color_temp_kelvin=5000)
        self.assertEqual(self.m.service_data(action(kelvin=4000),self.s['light.flur'])['color_temp_kelvin'],4000)
        with self.assertRaises(ValueError):self.m.service_data(action(kelvin=2700),self.s['light.flur'])

    async def test_legacy_backup_fade_is_removed_before_persistence_and_io(self):
        c=fixture(program('p','time',[action(time='18:00',transition=99)]))
        await self.m.save(c,0)
        self.assertNotIn('transition',self.m.engine.config['programs'][0]['actions'][0])
        self.assertEqual(c['programs'][0]['actions'][0]['transition'],99)
        self.assertEqual(self.hass.services.async_call.call_args.args[2]['transition'],0)

    async def test_upgrade_saves_original_before_replacing_persistent_config(self):
        c=fixture(program('p','time',[action('gone',mode='scene')]))
        c.update(schema=1,groups=[],scenes=[])
        original={'config':c,'runtime':{},'revision':4,'history':[]}
        self.m.store.async_load.return_value=deepcopy(original)
        backup=types.SimpleNamespace(async_save=AsyncMock())
        with patch.object(adapter,'Store',return_value=backup):await self.m.load()
        backup.async_save.assert_awaited_once_with(original)
        saved=self.m.store.async_save.call_args.args[0]
        self.assertEqual(saved['config']['schema'],4);self.assertEqual(saved['revision'],5)
        self.assertFalse(saved['config']['programs'][0]['enabled'])
        self.hass.services.async_call.assert_not_called()

    async def test_backup_failure_prevents_upgrade_and_device_commands(self):
        c=fixture();c.update(schema=1,groups=[],scenes=[])
        self.m.store.async_load.return_value={'config':c,'runtime':{},'revision':0}
        backup=types.SimpleNamespace(async_save=AsyncMock(side_effect=RuntimeError('No space')))
        with patch.object(adapter,'Store',return_value=backup):
            with self.assertRaises(RuntimeError):await self.m.load()
        self.assertEqual(self.m.engine.config['lamps'],[]);self.m.store.async_save.assert_not_called()
        self.hass.services.async_call.assert_not_called()

    async def test_schema_two_migration_saves_backup_and_selects_used_sensor(self):
        c=fixture(program('p','motion',[action(lux_entity='sensor.lux')]))
        c['schema']=2;c.pop('sensors');c['programs'][0]['order']=1
        original={'config':c,'runtime':{},'revision':2,'history':[]}
        self.m.store.async_load.return_value=deepcopy(original)
        backup=types.SimpleNamespace(async_save=AsyncMock())
        with patch.object(adapter,'Store',return_value=backup) as factory:await self.m.load()
        self.assertEqual(factory.call_args.args[-1],'light_manager_pre_030')
        backup.async_save.assert_awaited_once_with(original)
        self.assertEqual(self.m.snapshot()['schema'],4)
        self.assertEqual({s['entity'] for s in self.m.engine.config['sensors']},{'binary_sensor.tuer','sensor.lux'})
        self.assertEqual(self.m.revision,3)
        self.hass.services.async_call.assert_not_called()

    async def test_sensor_completion_restores_kelvin_and_brightness_via_actual_adapter(self):
        self.s['light.flur']=state('on',brightness=51,color_mode='color_temp',color_temp_kelvin=2700,
                                   supported_color_modes=['color_temp'],min_color_temp_kelvin=2000,max_color_temp_kelvin=6500)
        self.s['binary_sensor.tuer']=state('on')
        c=fixture(program('p','contact',[action(delay=0,end_action='restore')]))
        await self.m.save(c,0)
        self.s['light.flur']['attributes']['brightness']=204
        self.s['binary_sensor.tuer']=state('off')
        await self.m.pulse()
        call=self.hass.services.async_call.call_args.args
        self.assertEqual(call[:2],('light','turn_on'))
        self.assertEqual(call[2],{'entity_id':'light.flur','transition':0,'brightness_pct':20,'color_temp_kelvin':2700})
        self.assertFalse(self.m.engine.rt['controlled'])

    async def test_hue_group_membership_is_resolved_from_loaded_api_without_network(self):
        self.m.engine=adapter.Engine(fixture())
        self.m.engine.config['lamps']=[lamp('g','light.group',is_group=True)]
        self.s.update({'light.group':state('off',is_hue_group=True),'light.two':state('off')})
        records={'light.group':types.SimpleNamespace(platform='hue',unique_id='group-uuid')}
        self.hass.registry=types.SimpleNamespace(async_get=lambda e:records.get(e),async_get_entity_id=lambda domain,platform,uid:{'one':'light.flur','two':'light.two'}.get(uid))
        controller=types.SimpleNamespace(get_lights=lambda uid:[types.SimpleNamespace(id='one'),types.SimpleNamespace(id='two')] if uid=='group-uuid' else [])
        bridge=types.SimpleNamespace(api=types.SimpleNamespace(groups=types.SimpleNamespace(grouped_light=controller)))
        self.hass.config_entries=types.SimpleNamespace(async_entries=lambda domain:[types.SimpleNamespace(runtime_data=bridge)])
        states=self.m.states();self.assertEqual(states['light.group']['attributes']['entity_id'],['light.flur','light.two'])
        self.assertEqual(self.m.engine.expand(['g'],states),{'light.flur','light.two'})
        self.hass.services.async_call.assert_not_called()

    async def test_catalog_contains_all_lights_and_no_scene_entities(self):
        self.s['scene.old']=state('unknown');self.s['light.other']=state('off')
        entities={r['entity'] for r in self.m.catalog()}
        self.assertIn('light.other',entities);self.assertNotIn('scene.old',entities)

    async def test_catalog_includes_sensor_contacts_outside_illuminance_class(self):
        self.s['sensor.window']=state('tilted',device_class='enum',options=['open','tilted','closed'])
        self.s['sensor.window_number']=state('2')
        self.s['sensor.lux']=state('20',device_class='illuminance',unit_of_measurement='lx')
        entities={r['entity'] for r in self.m.catalog()}
        self.assertTrue({'sensor.window','sensor.window_number','sensor.lux'}<=entities)

    async def test_hue_scene_catalog_and_activation_without_member_verification(self):
        self.s['scene.flur_abend']=state('unknown',friendly_name='Evening',entity_id=['light.other'])
        self.s['scene.foreign']=state('unknown',friendly_name='Foreign')
        c=fixture(program('p','time',[action(mode='scene',scene='scene.flur_abend',time='18:00')]))
        c['lamps'][0]['scenes']=['scene.flur_abend']
        self.assertIn('scene.flur_abend',{s['entity'] for s in self.m.catalog()})
        self.assertNotIn('scene.foreign',{s['entity'] for s in self.m.catalog()})
        await self.m.save(c,0)
        self.assertEqual(self.hass.services.async_call.call_args.args,('scene','turn_on',{'entity_id':'scene.flur_abend','transition':0}))
        await self.m.pulse();self.assertEqual(self.hass.services.async_call.await_count,1)

    async def test_scene_service_failure_is_visible_and_retried(self):
        self.s['scene.flur_abend']=state('unknown')
        c=fixture(program('p','time',[action(mode='scene',scene='scene.flur_abend',time='18:00')]))
        c['lamps'][0]['scenes']=['scene.flur_abend']
        self.hass.services.async_call.side_effect=RuntimeError('Hue unavailable')
        await self.m.save(c,0);self.assertTrue(self.m.errors)
        await self.m.pulse();self.assertEqual(self.hass.services.async_call.await_count,1)
        self.now+=adapter.timedelta(seconds=30);self.hass.services.async_call.side_effect=None
        await self.m.pulse();self.assertFalse(self.m.errors)
        self.assertEqual(self.hass.services.async_call.await_count,2)

    async def test_schema_three_backup_keeps_runtime_before_upgrade(self):
        c=fixture();c['schema']=3
        original={'config':c,'runtime':{'sensors':{},'controlled':{}},'revision':9,'history':[]}
        self.m.store.async_load.return_value=deepcopy(original)
        backup=types.SimpleNamespace(async_save=AsyncMock())
        with patch.object(adapter,'Store',return_value=backup) as factory:await self.m.load()
        self.assertEqual(factory.call_args.args[-1],'light_manager_pre_030')
        backup.async_save.assert_awaited_once_with(original)
        self.assertEqual(self.m.engine.config['schema'],4);self.assertEqual(self.m.revision,10)
        self.hass.services.async_call.assert_not_called()

    async def test_unavailable_scene_does_not_mark_delivery_or_send_light_commands(self):
        self.s['scene.flur_abend']=state('unavailable')
        c=fixture(program('p','time',[action(mode='scene',scene='scene.flur_abend',time='18:00')]))
        c['lamps'][0]['scenes']=['scene.flur_abend']
        await self.m.save(c,0)
        self.hass.services.async_call.assert_not_called()
        self.assertFalse(self.m.engine.rt['delivered'])
        self.assertIn('Hue-Szene nicht verfügbar',str(self.m.errors))

    async def test_033_cleanup_backs_up_original_before_disabling_orphan_action(self):
        c=fixture(program('p','time',[action(mode='scene',scene='scene.other_night')]))
        c['lamps'][0]['scenes']=['scene.other_night','scene.flur_hell']
        original={'config':c,'runtime':{'sensors':{},'controlled':{}},'revision':7,'history':[]}
        self.m.store.async_load.return_value=deepcopy(original)
        backup=types.SimpleNamespace(async_save=AsyncMock())
        with patch.object(adapter,'Store',return_value=backup) as factory:await self.m.load()
        self.assertEqual(factory.call_args.args[-1],'light_manager_pre_040')
        backup.async_save.assert_awaited_once_with(original)
        self.assertEqual(self.m.revision,8)
        self.assertEqual(self.m.engine.config['lamps'][0]['scenes'],['scene.flur_hell'])
        self.assertFalse(self.m.engine.config['programs'][0]['actions'][0]['enabled'])
        self.assertEqual(self.m.engine.config['programs'][0]['actions'][0]['scene'],'scene.other_night')
        self.hass.services.async_call.assert_not_called()
        saved=deepcopy(self.m.store.async_save.call_args.args[0]);self.m.store.async_load.return_value=saved
        with patch.object(adapter,'Store') as factory:await self.m.load()
        factory.assert_not_called();self.assertEqual(self.m.revision,8)

    async def test_033_cleanup_aborts_if_original_backup_cannot_be_saved(self):
        c=fixture();c['lamps'][0]['scenes']=['scene.other_night']
        original={'config':c,'runtime':{},'revision':7,'history':[]}
        self.m.store.async_load.return_value=deepcopy(original)
        backup=types.SimpleNamespace(async_save=AsyncMock(side_effect=RuntimeError('disk full')))
        with patch.object(adapter,'Store',return_value=backup):
            with self.assertRaises(RuntimeError):await self.m.load()
        self.m.store.async_save.assert_not_called();self.hass.services.async_call.assert_not_called()

    async def test_040_once_requires_future_today_and_valid_future_is_saved(self):
        for day,clock in [('2026-11-02','20:00'),('2026-11-01','18:00')]:
            c=fixture(program('once','time',[action(time=clock)],once_date=day))
            with self.assertRaisesRegex(ValueError,'Zukunft'):await self.m.save(c,0)
        c=fixture(program('once','time',[action(time='20:00')],once_date='2026-11-01'))
        await self.m.save(c,0)
        self.assertEqual(self.m.engine.config['programs'][0]['once_date'],'2026-11-01')
        self.hass.services.async_call.assert_not_called()
