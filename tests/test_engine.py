"""Behavioral tests without HA imports; device I/O is tested separately."""
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('lm_engine', ROOT/'custom_components/light_manager/engine.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
Engine, validate, EMPTY = m.Engine, m.validate, m.EMPTY


def at(value): return datetime.fromisoformat(value).replace(tzinfo=timezone.utc)
def state(value, **attrs): return {'state': value, 'attributes': attrs}
def lamp(ident='l', entity='light.flur', **extra):
    return {'id':ident, 'name':ident, 'entity':entity, 'rooms':[], 'zones':[], 'fallback':'off', 'members':[], **extra}
def action(ident='a', **extra):
    return {'id':ident,'enabled':True,'mode':'on','targets':['l'],'brightness':80,'kelvin':None,'rgb':None,
            'event':'fixed','time':'18:00','offset':0,'earliest':'00:00','latest':'23:59',
            'sensors':['binary_sensor.tuer'],'delay':30,'lux_entity':'','lux_on':80,'lux_off':150,
            'on_delay':10,'end_action':'fallback','lux_end':'above','skips':[], **extra}
def program(ident, kind, actions, **extra):
    return {'id':ident,'name':ident,'kind':kind,'enabled':True,'pause_in_vacation':False,
            'days':list(range(7)),'start':'00:00','end':'00:00',
            'season_enabled':False,'season_from':'','season_to':'','actions':actions, **extra}
def fixture(*programs):
    c = deepcopy(EMPTY); c['lamps'] = [lamp()]; c['programs'] = list(programs)
    c['sensors'] = [{'entity':e,'name':e} for e in ('binary_sensor.tuer','binary_sensor.bewegung','sensor.lux')]
    return c

def deliver(e, commands, states):
    for cmd in commands: e.claim(cmd, states); e.success(cmd)


class EngineTests(unittest.TestCase):
    def setUp(self):
        self.t=at('2026-11-01T16:59:00') # 17:59 local.
        self.s={'light.flur':state('off'), 'binary_sensor.tuer':state('off'),
                'binary_sensor.bewegung':state('off'), 'sensor.lux':state('50',unit_of_measurement='lx')}

    def test_contact_motion_lux_time_priority_and_current_schedule_on_release(self):
        c=fixture(program('zeit','time',[action('ein',time='17:00'),action('aus',mode='off',time='18:30')]),
                  program('dunkel','lux',[action('lux',lux_entity='sensor.lux',on_delay=0,delay=0)]),
                  program('bewegung','motion',[action('motion',sensors=['binary_sensor.bewegung'],delay=0)]),
                  program('tuer','contact',[action('contact',delay=0)]))
        e=Engine(c);e.plan(self.t,self.s);self.assertEqual(e.status['light.flur']['program'],'dunkel')
        self.s['binary_sensor.bewegung']=state('on');e.plan(self.t,self.s);self.assertEqual(e.status['light.flur']['program'],'bewegung')
        self.s['binary_sensor.tuer']=state('on');cmd=e.plan(self.t,self.s);deliver(e,cmd,self.s)
        self.assertEqual(e.status['light.flur']['program'],'tuer')
        self.t+=timedelta(hours=1);self.s['sensor.lux']=state('200');self.s['binary_sensor.bewegung']=state('off')
        e.plan(self.t,self.s);self.assertEqual(e.status['light.flur']['program'],'tuer')
        self.s['binary_sensor.tuer']=state('off');cmd=e.plan(self.t,self.s)
        self.assertEqual(cmd[0]['action']['mode'],'off');self.assertEqual(e.status['light.flur']['program'],'zeit')

    def test_no_resend_and_next_occurrence_restores_automation_after_manual_change(self):
        e=Engine(fixture(program('zeit','time',[action()])))
        cmd=e.plan(self.t+timedelta(minutes=1),self.s);deliver(e,cmd,self.s)
        self.s['light.flur']=state('off') # Manual operation.
        self.assertEqual(e.plan(self.t+timedelta(minutes=2),self.s),[])
        self.assertTrue(e.plan(self.t+timedelta(days=1,minutes=1),self.s))

    def test_multiple_motion_sensors_and_renewed_motion_restart_followup(self):
        e=Engine(fixture(program('p','motion',[action(sensors=['binary_sensor.tuer','binary_sensor.bewegung'])])))
        self.s['binary_sensor.tuer']=state('on');e.plan(self.t,self.s)
        self.s['binary_sensor.tuer']=state('off');self.s['binary_sensor.bewegung']=state('on');e.plan(self.t+timedelta(seconds=10),self.s)
        self.assertNotIn('pending',e.rt['sensors']['a'])
        self.s['binary_sensor.bewegung']=state('off');e.plan(self.t+timedelta(seconds=20),self.s)
        self.s['binary_sensor.tuer']=state('on');e.plan(self.t+timedelta(seconds=40),self.s)
        self.assertNotIn('pending',e.rt['sensors']['a'])
        self.s['binary_sensor.tuer']=state('off');e.plan(self.t+timedelta(seconds=50),self.s)
        e.plan(self.t+timedelta(seconds=79),self.s);self.assertTrue(e.rt['sensors']['a']['active'])
        e.plan(self.t+timedelta(seconds=80),self.s);self.assertFalse(e.rt['sensors']['a']['active'])

    def test_unknown_contact_cancels_release_deadline_and_preserves_priority(self):
        e=Engine(fixture(program('p','contact',[action()])))
        self.s['binary_sensor.tuer']=state('on');deliver(e,e.plan(self.t,self.s),self.s)
        self.s['binary_sensor.tuer']=state('off');e.plan(self.t+timedelta(seconds=5),self.s)
        self.s['binary_sensor.tuer']=state('unavailable');e.plan(self.t+timedelta(seconds=40),self.s)
        self.assertTrue(e.rt['sensors']['a']['active']);self.assertTrue(e.warnings)
        self.s['binary_sensor.tuer']=state('off');e.plan(self.t+timedelta(seconds=50),self.s)
        cmd=e.plan(self.t+timedelta(seconds=80),self.s);self.assertTrue(cmd[0]['release'])

    def test_restart_keeps_release_deadline_and_successful_goals(self):
        e=Engine(fixture(program('p','motion',[action()])))
        self.s['binary_sensor.tuer']=state('on');deliver(e,e.plan(self.t,self.s),self.s)
        self.s['binary_sensor.tuer']=state('off');e.plan(self.t+timedelta(seconds=5),self.s)
        other=Engine(e.config,deepcopy(e.rt));self.assertEqual(other.plan(self.t+timedelta(seconds=20),self.s),[])
        commands=other.plan(self.t+timedelta(seconds=35),self.s);self.assertTrue(commands[0]['release'])

    def test_lux_hysteresis_continuous_delays_and_invalid_samples(self):
        e=Engine(fixture(program('p','lux',[action(lux_entity='sensor.lux')])))
        e.plan(self.t,self.s);self.assertFalse(e.rt['sensors']['a']['active'])
        self.s['sensor.lux']=state('100');e.plan(self.t+timedelta(seconds=8),self.s)
        self.s['sensor.lux']=state('50');e.plan(self.t+timedelta(seconds=10),self.s)
        self.assertFalse(e.plan(self.t+timedelta(seconds=19),self.s))
        self.assertTrue(e.plan(self.t+timedelta(seconds=20),self.s))
        self.s['sensor.lux']=state('200');e.plan(self.t+timedelta(seconds=30),self.s)
        self.s['sensor.lux']=state('nan');e.plan(self.t+timedelta(seconds=60),self.s)
        self.assertTrue(e.rt['sensors']['a']['active'])
        self.s['sensor.lux']=state('200');e.plan(self.t+timedelta(seconds=70),self.s)
        e.plan(self.t+timedelta(seconds=100),self.s);self.assertFalse(e.rt['sensors']['a']['active'])

    def test_motion_lux_gate_does_not_switch_off_from_its_own_light(self):
        e=Engine(fixture(program('p','motion',[action(lux_entity='sensor.lux',delay=0)])))
        self.s['binary_sensor.tuer']=state('on');e.plan(self.t,self.s)
        self.s['sensor.lux']=state('500');e.plan(self.t+timedelta(seconds=1),self.s)
        self.assertTrue(e.rt['sensors']['a']['active'])
        self.s['binary_sensor.tuer']=state('off');e.plan(self.t+timedelta(seconds=2),self.s)
        self.s['binary_sensor.tuer']=state('on');e.plan(self.t+timedelta(seconds=3),self.s)
        self.assertFalse(e.rt['sensors']['a']['active'])

    def test_night_window_uses_start_weekday_and_contact_survives_window_end(self):
        p=program('p','contact',[action(delay=0)],days=[6],start='22:00',end='02:00')
        e=Engine(fixture(p));self.s['binary_sensor.tuer']=state('on')
        self.assertTrue(e.plan(at('2026-11-01T22:00:00'),self.s))
        e.plan(at('2026-11-02T02:30:00'),self.s)
        self.assertTrue(e.rt['sensors']['a']['active'])
        self.s['binary_sensor.tuer']=state('off');e.plan(at('2026-11-02T02:31:00'),self.s)
        self.assertFalse(e.rt['sensors']['a']['active'])

    def test_fallback_restore_original_on_state(self):
        c=fixture(program('p','contact',[action(delay=0)]));c['lamps'][0]['fallback']='restore'
        self.s['light.flur']=state('on',brightness=51,color_mode='color_temp',color_temp_kelvin=2700)
        self.s['binary_sensor.tuer']=state('on');e=Engine(c);deliver(e,e.plan(self.t,self.s),self.s)
        self.s['binary_sensor.tuer']=state('off');cmd=e.plan(self.t+timedelta(seconds=1),self.s)
        self.assertTrue(cmd[0]['release']);self.assertEqual(cmd[0]['action']['kelvin'],2700)
        self.assertEqual(cmd[0]['action']['brightness'],20)
        deliver(e,cmd,self.s);self.assertEqual(e.plan(self.t+timedelta(seconds=2),self.s),[])

    def test_rooms_zones_and_overlapping_groups_deduplicate_individual_lamps(self):
        c=fixture(program('p','time',[action(targets=['r','z','l'],time='17:00')]))
        c['rooms']=[{'id':'r','name':'Flur'}];c['zones']=[{'id':'z','name':'EG'}]
        c['lamps'][0].update(rooms=['r'],zones=['z'])
        e=Engine(c);cmd=e.plan(self.t,self.s);self.assertEqual(len(cmd),1);self.assertEqual(cmd[0]['entities'],['light.flur'])

    def test_native_hue_group_expands_and_individual_contact_wins(self):
        c=fixture(program('zeit','time',[action('zeitaktion',targets=['hue'],time='17:00')]),
                  program('kontakt','contact',[action('kontaktaktion')]))
        c['lamps'].append(lamp('hue','light.erdgeschoss',is_group=True,members=['light.flur','light.kueche']))
        self.s.update({'light.kueche':state('off'),'light.erdgeschoss':state('off',is_hue_group=True)})
        self.s['binary_sensor.tuer']=state('on');e=Engine(c);cmd=e.plan(self.t,self.s)
        self.assertEqual(e.status['light.flur']['kind'],'contact');self.assertEqual(e.status['light.kueche']['kind'],'time')
        self.assertEqual({x['entities'][0] for x in cmd},{'light.flur','light.kueche'})

    def test_unknown_hue_group_members_are_not_commanded(self):
        c=fixture(program('p','time',[action(time='17:00')]));c['lamps'][0]['is_group']=True
        e=Engine(c);self.assertEqual(e.plan(self.t,self.s),[]);self.assertIn('Gruppenmitglieder',e.warnings[0])

    def test_new_config_rejects_removed_action_modes(self):
        c=fixture(program('p','time',[action(mode='scene')]))
        with self.assertRaises(ValueError):validate(c)

    def test_stored_position_resolves_same_priority_ignoring_legacy_order(self):
        c=fixture(program('a','contact',[action('aa')],order=20),program('b','contact',[action('bb')],order=10))
        self.s['binary_sensor.tuer']=state('on');e=Engine(c);e.plan(self.t,self.s)
        self.assertEqual(e.status['light.flur']['program'],'a')

    def test_skip_today_preserves_previous_schedule_goal(self):
        c=fixture(program('p','time',[action('ein',time='17:00',skips=['2026-11-01']),action('aus',mode='off',time='23:00')]))
        e=Engine(c);cmd=e.plan(self.t,self.s);self.assertEqual(cmd[0]['action']['mode'],'off')
        self.assertTrue(next(x for x in e.planned if x['action']=='ein')['skipped'])

    def test_sunset_offset_and_earliest_latest_use_same_concrete_time(self):
        a=action(event='sunset',offset=20,earliest='17:00',latest='18:00')
        e=Engine(fixture(program('p','time',[a])))
        solar=lambda event,day: datetime.combine(day,datetime.min.time(),timezone.utc)+timedelta(hours=16,minutes=38)
        self.assertEqual(e.due(a,self.t.date(),solar).astimezone(e.zone).strftime('%H:%M'),'17:58')
        a['latest']='17:40';self.assertEqual(e.due(a,self.t.date(),solar).astimezone(e.zone).strftime('%H:%M'),'17:40')

    def test_dst_skipped_time_normalizes_forward_and_ambiguous_time_runs_once(self):
        e=Engine();self.assertEqual(e.walltime(datetime(2026,3,29).date(),'02:30').strftime('%H:%M'),'03:30')
        self.assertEqual(e.walltime(datetime(2026,10,25).date(),'02:30').fold,0)

    def test_season_crossing_new_year_and_vacation(self):
        c=fixture(program('p','time',[action(time='17:00')],season_enabled=True,season_from='10-01',season_to='03-31',pause_in_vacation=True))
        e=Engine(c);self.assertTrue(e.plan(self.t,self.s));c['vacation']=True;e.replace(c)
        self.assertFalse(e.plan(self.t,self.s))

    def test_invalid_backups_and_non_lights_rejected(self):
        mutations=[lambda c:c['lamps'][0].update(entity='switch.flur'),
                   lambda c:c['programs'][0]['actions'][0].update(brightness=float('nan')),
                   lambda c:c['programs'][0].update(days=[]),
                   lambda c:c['programs'][0]['actions'][0].update(targets=['missing'])]
        for mutation in mutations:
            c=fixture(program('p','time',[action()]));mutation(c)
            with self.assertRaises(ValueError):validate(c)

    def test_native_groups_detect_cycles(self):
        c=fixture();c['lamps'][0]['members']=['light.zwei'];c['lamps'].append(lamp('zwei','light.zwei',members=['light.flur']))
        e=Engine(c)
        with self.assertRaises(ValueError):e.leaves('l',self.s)

    def test_rename_does_not_reset_running_contact_or_resend(self):
        c=fixture(program('p','contact',[action()]));e=Engine(c);self.s['binary_sensor.tuer']=state('on')
        deliver(e,e.plan(self.t,self.s),self.s);c['lamps'][0]['name']='Neu';c['programs'][0]['name']='Neu'
        e.replace(c);self.assertEqual(e.plan(self.t+timedelta(seconds=1),self.s),[])
        self.assertTrue(e.rt['sensors']['a']['active'])

if __name__ == '__main__': unittest.main()
