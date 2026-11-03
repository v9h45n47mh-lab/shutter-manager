"""Enum contacts, explicit closed evidence and selected target unions."""
from copy import deepcopy
from datetime import timedelta
import unittest
from test_engine import Engine, validate, fixture, program, action, lamp, state, at, deliver


class Release022Tests(unittest.TestCase):
    def setUp(self):
        self.t=at('2026-11-02T17:00:00')
        self.c=fixture(program('contact','contact',[action(sensors=['sensor.window'],delay=10,end_action='restore')]))
        self.c['sensors'].append({'entity':'sensor.window','name':'Window','open_states':['open','tilted'],'closed_states':['closed']})
        self.s={'sensor.window':state('open'),'light.flur':state('off'),'binary_sensor.tuer':state('off')}

    def test_enum_contacts_open_tilted_closed_and_restoration(self):
        e=Engine(self.c);deliver(e,e.plan(self.t,self.s),self.s)
        self.s['sensor.window']=state('tilted');self.assertEqual(e.plan(self.t,self.s),[])
        self.s['sensor.window']=state('closed');e.plan(self.t+timedelta(seconds=1),self.s)
        self.assertEqual(e.plan(self.t+timedelta(seconds=10),self.s),[])
        command=e.plan(self.t+timedelta(seconds=11),self.s)[0]
        self.assertTrue(command['release']);self.assertEqual(command['action'],{'mode':'off'})

    def test_unmapped_value_and_unavailable_never_count_as_closed(self):
        for unknown in ('unavailable','unknown','other','off',''):
            e=Engine(self.c);deliver(e,e.plan(self.t,self.s),self.s)
            self.s['sensor.window']=state('closed');e.plan(self.t+timedelta(seconds=1),self.s)
            self.s['sensor.window']=state(unknown)
            self.assertEqual(e.plan(self.t+timedelta(seconds=20),self.s),[])
            self.assertTrue(e.rt['sensors']['a']['active']);self.assertNotIn('pending',e.rt['sensors']['a'])
            self.s['sensor.window']=state('open')

    def test_numeric_states_are_explicit_strings_and_survive_restart(self):
        self.c['sensors'][-1].update(open_states=['1','2'],closed_states=['0'])
        self.s['sensor.window']=state('2');e=Engine(self.c);deliver(e,e.plan(self.t,self.s),self.s)
        self.s['sensor.window']=state('0');e.plan(self.t+timedelta(seconds=1),self.s)
        e=Engine(e.config,e.rt)
        self.assertEqual(e.plan(self.t+timedelta(seconds=10),self.s),[])
        self.assertTrue(e.plan(self.t+timedelta(seconds=11),self.s)[0]['release'])

    def test_mixed_contacts_require_all_confirmed_closed(self):
        self.c['programs'][0]['actions'][0]['sensors'].append('binary_sensor.tuer')
        e=Engine(self.c);deliver(e,e.plan(self.t,self.s),self.s)
        self.s['sensor.window']=state('closed');self.s['binary_sensor.tuer']=state('on')
        e.plan(self.t,self.s);self.assertNotIn('pending',e.rt['sensors']['a'])
        self.s['binary_sensor.tuer']=state('unavailable');e.plan(self.t,self.s)
        self.assertNotIn('pending',e.rt['sensors']['a'])
        self.s['binary_sensor.tuer']=state('off');e.plan(self.t,self.s)
        self.assertTrue(e.plan(self.t+timedelta(seconds=10),self.s)[0]['release'])

    def test_only_selected_mapped_sensor_contacts_are_accepted(self):
        c=deepcopy(self.c);c['sensors']=[s for s in c['sensors'] if s['entity']!='sensor.window']
        with self.assertRaisesRegex(ValueError,'auswählen'):validate(c)
        c=deepcopy(self.c);c['sensors'][-1].pop('open_states');c['sensors'][-1].pop('closed_states')
        with self.assertRaisesRegex(ValueError,'Zustände zuerst'):validate(c)
        c['programs']=[];self.assertEqual(validate(c)['sensors'][-1]['entity'],'sensor.window')

    def test_ambiguous_missing_and_reserved_mappings_rejected(self):
        for fields in ({'open_states':['open'],'closed_states':['open']},
                       {'open_states':['unknown'],'closed_states':['closed']},
                       {'open_states':['open'],'closed_states':[]},
                       {'open_states':[1],'closed_states':['closed']}):
            c=deepcopy(self.c);c['sensors'][-1].update(fields)
            with self.assertRaises(ValueError):validate(c)

    def test_mapping_edit_cancels_deadline_but_does_not_release_active_hold(self):
        e=Engine(self.c);deliver(e,e.plan(self.t,self.s),self.s)
        self.s['sensor.window']=state('closed');e.plan(self.t+timedelta(seconds=1),self.s)
        c=deepcopy(e.config);c['sensors'][-1]['closed_states']=['shut'];e.replace(c)
        self.assertNotIn('pending',e.rt['sensors']['a'])
        self.assertEqual(e.plan(self.t+timedelta(seconds=20),self.s),[])
        self.assertTrue(e.rt['sensors']['a']['active'])
        self.s['sensor.window']=state('shut');e.plan(self.t+timedelta(seconds=21),self.s)
        self.assertTrue(e.plan(self.t+timedelta(seconds=31),self.s)[0]['release'])

    def test_sensor_rename_keeps_pending_deadline_and_delivered_goal(self):
        e=Engine(self.c);deliver(e,e.plan(self.t,self.s),self.s)
        self.s['sensor.window']=state('closed');e.plan(self.t+timedelta(seconds=1),self.s)
        deadline=e.rt['sensors']['a']['pending']
        c=deepcopy(e.config);c['sensors'][-1]['name']='New name';e.replace(c)
        self.assertEqual(e.rt['sensors']['a']['pending'],deadline)
        self.assertEqual(e.plan(self.t+timedelta(seconds=2),self.s),[])

    def test_binary_contact_can_be_inverted_without_changing_motion_semantics(self):
        c=fixture(program('contact','contact',[action(delay=0)]))
        c['sensors'][0].update(open_states=['off'],closed_states=['on'])
        e=Engine(c);self.assertTrue(e.plan(self.t,self.s))
        c['programs'][0]['kind']='motion';e=Engine(c)
        self.assertFalse(e.plan(self.t,self.s))

    def test_rooms_zones_and_individuals_resolve_union_with_kelvin(self):
        c=fixture(program('time','time',[action(targets=['room','zone','l'],kelvin=3500,time='17:00')]))
        c['rooms']=[{'id':'room','name':'Office'}];c['zones']=[{'id':'zone','name':'Ground floor'}]
        c['lamps'][0]['rooms']=['room'];c['lamps'][0]['zones']=['zone']
        c['lamps'].append(lamp('two','light.two',zones=['zone']))
        e=Engine(c);commands=e.plan(self.t,{**self.s,'light.two':state('off')})
        self.assertEqual({x['entities'][0] for x in commands},{'light.flur','light.two'})
        self.assertEqual(len(commands),2)
        self.assertTrue(all(x['action']['kelvin']==3500 for x in commands))

