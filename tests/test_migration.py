"""Configuration upgrade and selection-boundary behavior."""
from copy import deepcopy
import json
import unittest
from test_engine import Engine, validate, fixture, program, action, lamp, state, at


class MigrationTests(unittest.TestCase):
    def legacy(self):
        c=fixture(program('p','time',[action('plain',targets=['oldgroup'],time='17:00'),action('gone',mode='scene',scene='s')],season_from='10-01',season_to='03-31'))
        c.update(schema=1,groups=[{'id':'oldgroup','name':'Old','lamps':['l']}],scenes=[{'id':'s','name':'Old scene'}])
        return c

    def test_legacy_groups_expand_to_selected_lamps_and_removed_actions_disappear(self):
        c=self.legacy();checked=validate(c)
        self.assertEqual(checked['schema'],4);self.assertNotIn('groups',checked);self.assertNotIn('scenes',checked)
        self.assertEqual(checked['programs'][0]['actions'][0]['targets'],['l'])
        self.assertEqual([a['id'] for a in checked['programs'][0]['actions']],['plain'])
        self.assertTrue(checked['programs'][0]['season_enabled'])
        self.assertEqual(c['schema'],1);self.assertEqual(len(c['programs'][0]['actions']),2)

    def test_scene_only_program_is_retained_as_disabled_empty_shell(self):
        c=self.legacy();c['programs'][0]['actions']=c['programs'][0]['actions'][1:]
        e=Engine(c);p=e.config['programs'][0];self.assertFalse(p['enabled']);self.assertEqual(p['actions'],[])
        self.assertEqual(e.plan(at('2026-11-02T17:30:00'),{'light.flur':state('on')}),[])

    def test_obsolete_runtime_owner_does_not_switch_off_a_light_on_upgrade(self):
        c=self.legacy();c['programs'][0]['actions']=c['programs'][0]['actions'][1:]
        key=json.dumps(['gone:2026-11-02',{'mode':'scene'},'scene.old',['light.flur']])
        rt={'sensors':{'gone':{'active':True}},'delivered':{'light.flur':key},'controlled':{'light.flur':{'key':key,'base':{'mode':'off'}}}}
        e=Engine(c,rt);self.assertEqual(e.rt['controlled'],{});self.assertEqual(e.rt['sensors'],{})
        self.assertEqual(e.plan(at('2026-11-02T17:30:00'),{'light.flur':state('on')}),[])

    def test_active_contact_deadline_and_original_state_survive_upgrade(self):
        c=fixture(program('contact','contact',[action(delay=30)]));c.update(schema=1,groups=[],scenes=[])
        now=at('2026-11-02T17:00:00');e=Engine(c);states={'light.flur':state('off'),'binary_sensor.tuer':state('on')}
        for cmd in e.plan(now,states):e.claim(cmd,states);e.success(cmd)
        states['binary_sensor.tuer']=state('off');e.plan(now.replace(second=5),states)
        other=Engine(c,e.rt);self.assertEqual(other.rt['sensors']['a']['pending'],e.rt['sensors']['a']['pending'])
        self.assertEqual(other.rt['controlled']['light.flur']['base'],{'mode':'off'})

    def test_disabled_season_ignores_retained_dates_then_enabling_applies_them(self):
        c=fixture(program('p','time',[action()],season_enabled=False,season_from='06-01',season_to='08-31'))
        e=Engine(c);self.assertTrue(e.valid_day(e.config['programs'][0],at('2026-11-02T17:00:00').date()))
        c['programs'][0]['season_enabled']=True;e.replace(c)
        self.assertFalse(e.valid_day(e.config['programs'][0],at('2026-11-02T17:00:00').date()))

    def test_empty_program_can_be_saved_disabled_but_not_enabled(self):
        c=fixture(program('p','time',[],enabled=False));self.assertEqual(validate(c)['programs'][0]['actions'],[])
        c['programs'][0]['enabled']=True
        with self.assertRaises(ValueError):validate(c)

    def test_unselected_direct_entity_cannot_be_targeted(self):
        c=fixture(program('p','time',[action(targets=['light.other'])]))
        with self.assertRaises(ValueError):validate(c)

    def test_rooms_and_zones_only_expand_selected_members(self):
        c=fixture(program('p','time',[action(targets=['r','z'])]));c['rooms']=[{'id':'r','name':'r'}];c['zones']=[{'id':'z','name':'z'}]
        c['lamps'][0].update(rooms=['r'],zones=['z']);e=Engine(c)
        self.assertEqual(e.expand(['r','z'],{'light.flur':state('off'),'light.other':state('off')}),{'light.flur'})

    def test_modern_config_rejects_removed_sections_and_legacy_unknown_members(self):
        c=fixture();c['groups']=[]
        with self.assertRaises(ValueError):validate(c)
        c=self.legacy();c['groups'][0]['lamps']=['missing']
        with self.assertRaises(ValueError):validate(c)
