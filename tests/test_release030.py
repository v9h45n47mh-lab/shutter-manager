"""Manually linked Hue scenes and deterministic scene-wide arbitration."""
from copy import deepcopy
from datetime import timedelta
import unittest
from test_engine import Engine, validate, fixture, program, action, lamp, state, at, deliver


class Release030Tests(unittest.TestCase):
    def setUp(self):
        self.t=at('2026-11-02T17:00:00')
        self.c=fixture(program('schedule','time',[action('scene_action',mode='scene',scene='scene.flur_spots_group_calm',targets=['room'],time='17:00')]))
        self.c['rooms']=[{'id':'room','name':'Office'}]
        self.c['lamps'][0].update(rooms=['room'],scenes=['scene.flur_spots_group_calm','scene.flur_spots_group_bright'])
        self.c['lamps'].append(lamp('two','light.flur_spots',rooms=['room'],scenes=['scene.flur_spots_group_calm']))
        self.s={'light.flur':state('on',brightness=51,color_mode='color_temp',color_temp_kelvin=2700),
                'light.flur_spots':state('off'),'binary_sensor.tuer':state('off'),
                'scene.flur_spots_group_calm':state('unknown',entity_id=['light.completely_different'])}

    def test_one_scene_command_for_multiple_lights_without_member_comparison(self):
        e=Engine(self.c);commands=e.plan(self.t,self.s)
        self.assertEqual(len(commands),1);self.assertEqual(commands[0]['entities'],['light.flur','light.flur_spots'])
        self.assertEqual(commands[0]['action']['scene'],'scene.flur_spots_group_calm')
        self.assertIsNone(commands[0]['action']['brightness'])
        deliver(e,commands,self.s);self.assertEqual(e.plan(self.t,self.s),[])

    def test_delivered_scene_and_sensor_snapshots_survive_restart(self):
        self.c['programs'][0]['kind']='contact';self.c['programs'][0]['actions'][0].update(end_action='restore',delay=0)
        self.s['binary_sensor.tuer']=state('on');e=Engine(self.c);deliver(e,e.plan(self.t,self.s),self.s)
        e=Engine(e.config,e.rt);self.assertEqual(e.plan(self.t,self.s),[])
        self.s['binary_sensor.tuer']=state('off');commands=e.plan(self.t,self.s)
        values={c['entities'][0]:c['action'] for c in commands}
        self.assertEqual(values['light.flur'],{'mode':'on','brightness':20,'kelvin':2700})
        self.assertEqual(values['light.flur_spots'],{'mode':'off'})

    def test_contact_blocks_whole_scene_then_scene_resumes_once(self):
        self.c['programs'].append(program('contact','contact',[action('contact_action',delay=0)]))
        self.s['binary_sensor.tuer']=state('on');e=Engine(self.c);commands=e.plan(self.t,self.s)
        self.assertEqual(len(commands),1);self.assertEqual(commands[0]['action']['id'],'contact_action')
        self.assertNotIn('light.flur_spots',e.status)
        deliver(e,commands,self.s)
        self.s['binary_sensor.tuer']=state('off');commands=e.plan(self.t,self.s)
        self.assertEqual(len(commands),1);self.assertEqual(commands[0]['action']['mode'],'scene')
        deliver(e,commands,self.s);self.assertEqual(e.plan(self.t,self.s),[])

    def test_same_time_higher_stored_scene_wins_and_is_not_split(self):
        self.c['programs'].append(program('other','time',[action('normal',time='17:00')]))
        e=Engine(self.c);self.assertEqual(e.plan(self.t,self.s)[0]['action']['mode'],'scene')
        self.c['programs'].reverse();e=Engine(self.c);commands=e.plan(self.t,self.s)
        self.assertEqual(len(commands),1);self.assertEqual(commands[0]['action']['id'],'normal')

    def test_native_group_mapping_and_direct_mapping_deduplicate(self):
        self.c['lamps'].append(lamp('group','light.flur_spots_group',scenes=['scene.flur_spots_group_calm'],is_group=True))
        self.s['light.flur_spots_group']=state('on',entity_id=['light.flur','light.flur_spots'])
        self.c['programs'][0]['actions'][0]['targets']=['room','group','l']
        commands=Engine(self.c).plan(self.t,self.s)
        self.assertEqual(len(commands),1);self.assertEqual(commands[0]['entities'],['light.flur','light.flur_spots'])

    def test_scene_scope_uses_all_matching_lights_without_manual_links(self):
        self.c['lamps'][1]['scenes']=[]
        command=Engine(self.c).plan(self.t,self.s)[0]
        self.assertEqual(command['entities'],['light.flur','light.flur_spots'])

    def test_scene_choice_requires_link_but_never_matching_hue_members(self):
        checked=validate(self.c);self.assertEqual(checked['programs'][0]['actions'][0]['scene'],'scene.flur_spots_group_calm')
        self.c['programs'][0]['actions'][0]['scene']='scene.unlinked'
        with self.assertRaisesRegex(ValueError,'verknüpfte'):validate(self.c)
        self.c['programs'][0]['actions'][0]['scene']='light.wrong_domain'
        with self.assertRaises(ValueError):validate(self.c)

    def test_old_config_and_active_timer_are_preserved_on_schema_upgrade(self):
        c=fixture(program('contact','contact',[action('contact_action',delay=30,end_action='restore')]))
        c['schema']=3;self.s['binary_sensor.tuer']=state('on');e=Engine(c)
        deliver(e,e.plan(self.t,self.s),self.s);self.s['binary_sensor.tuer']=state('off')
        e.plan(self.t+timedelta(seconds=1),self.s);other=Engine(c,e.rt)
        self.assertEqual(other.config['schema'],4)
        self.assertEqual(other.rt,e.rt);self.assertEqual(other.plan(self.t+timedelta(seconds=20),self.s),[])
        self.assertTrue(other.plan(self.t+timedelta(seconds=31),self.s)[0]['release'])

    def test_scene_losing_sensor_priority_is_reported_as_waiting(self):
        self.c['programs'][0]['kind']='motion'
        self.c['programs'].append(program('contact','contact',[action('contact_action',delay=0)]))
        self.s['binary_sensor.tuer']=state('on');e=Engine(self.c);e.plan(self.t,self.s)
        rule=next(r for r in e.rules if r['program']=='schedule')
        self.assertTrue(rule['active']);self.assertFalse(rule['effective'])

    def test_scene_completion_retries_keep_each_lamp_original_state(self):
        self.c['programs'][0]['kind']='contact';self.c['programs'][0]['actions'][0].update(end_action='restore',delay=0)
        self.s['binary_sensor.tuer']=state('on');e=Engine(self.c);cmd=e.plan(self.t,self.s)[0]
        e.claim(cmd,self.s)  # A service retry must not capture already-changed values.
        self.s['light.flur']=state('on',brightness=204);self.s['light.flur_spots']=state('on',brightness=204)
        deliver(e,e.plan(self.t,self.s),self.s);self.s['binary_sensor.tuer']=state('off')
        commands=e.plan(self.t,self.s);other=Engine(e.config,e.rt)
        self.assertEqual(other.plan(self.t,self.s),commands)
        self.assertEqual(next(c for c in commands if c['entities']==['light.flur_spots'])['action'],{'mode':'off'})

    def test_removed_scene_program_still_releases_owned_lights_after_restart(self):
        e=Engine(self.c);deliver(e,e.plan(self.t,self.s),self.s)
        c=deepcopy(e.config);c['programs']=[];e.replace(c)
        e=Engine(e.config,e.rt);commands=e.plan(self.t,self.s)
        self.assertEqual(len(commands),2)
        self.assertTrue(all(c['release'] and c['action']['mode']=='off' for c in commands))

