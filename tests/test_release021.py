"""Selection boundaries and sensor completion across arbitration and restarts."""
from copy import deepcopy
from datetime import timedelta
import unittest
from test_engine import Engine, validate, fixture, program, action, state, at, deliver


class Release021Tests(unittest.TestCase):
    def setUp(self):
        self.t = at('2026-11-02T17:00:00')
        self.s = {'light.flur': state('on', brightness=51, color_mode='color_temp', color_temp_kelvin=2700),
                  'binary_sensor.tuer': state('off'), 'binary_sensor.bewegung': state('off'),
                  'sensor.lux': state('60', unit_of_measurement='lx')}

    def make(self, kind='motion', **kw):
        return Engine(fixture(program('p', kind, [action(end_action='restore', **kw)])))

    def test_restore_motion_brightness_and_white_after_continuous_absence(self):
        e = self.make(delay=20)
        self.s['binary_sensor.tuer'] = state('on')
        deliver(e, e.plan(self.t, self.s), self.s)
        self.s['light.flur'] = state('on', brightness=204)
        self.s['binary_sensor.tuer'] = state('off')
        e.plan(self.t+timedelta(seconds=1), self.s)
        self.s['binary_sensor.tuer'] = state('on')
        self.assertEqual(e.plan(self.t+timedelta(seconds=15), self.s), [])
        self.s['binary_sensor.tuer'] = state('off')
        e.plan(self.t+timedelta(seconds=18), self.s)
        self.assertEqual(e.plan(self.t+timedelta(seconds=37), self.s), [])
        commands = e.plan(self.t+timedelta(seconds=38), self.s)
        self.assertEqual(commands[0]['action'], {'mode':'on', 'brightness':20, 'kelvin':2700})
        deliver(e, commands, self.s)
        self.assertEqual(e.plan(self.t+timedelta(seconds=39), self.s), [])

    def test_contact_restore_after_close_includes_rgb(self):
        e = self.make('contact', delay=0)
        self.s['light.flur'] = state('on', brightness=102, color_mode='xy', rgb_color=[10,80,255])
        self.s['binary_sensor.tuer'] = state('on')
        deliver(e, e.plan(self.t, self.s), self.s)
        self.s['binary_sensor.tuer'] = state('off')
        result = e.plan(self.t+timedelta(seconds=1), self.s)[0]['action']
        self.assertEqual(result, {'mode':'on','brightness':40,'rgb':[10,80,255]})

    def test_original_off_state_is_restored(self):
        e = self.make('contact', delay=0)
        self.s['light.flur'] = state('off')
        self.s['binary_sensor.tuer'] = state('on')
        deliver(e, e.plan(self.t, self.s), self.s)
        self.s['binary_sensor.tuer'] = state('off')
        self.assertEqual(e.plan(self.t, self.s)[0]['action'], {'mode':'off'})

    def test_lux_below_end_waits_continuously_then_stays_off_until_rearmed(self):
        e = Engine(fixture(program('p','lux',[action(lux_entity='sensor.lux',lux_on=80,lux_off=20,
                        lux_end='below',on_delay=0,delay=10,end_action='off')])))
        deliver(e, e.plan(self.t, self.s), self.s)
        self.s['sensor.lux'] = state('15'); e.plan(self.t+timedelta(seconds=1), self.s)
        self.s['sensor.lux'] = state('30'); e.plan(self.t+timedelta(seconds=8), self.s)
        self.s['sensor.lux'] = state('15'); e.plan(self.t+timedelta(seconds=9), self.s)
        self.assertEqual(e.plan(self.t+timedelta(seconds=18), self.s), [])
        commands = e.plan(self.t+timedelta(seconds=19), self.s)
        self.assertEqual(commands[0]['action'], {'mode':'off'})
        deliver(e, commands, self.s)
        self.assertEqual(e.plan(self.t+timedelta(seconds=60), self.s), [])
        self.s['sensor.lux'] = state('100'); e.plan(self.t+timedelta(seconds=61), self.s)
        self.s['sensor.lux'] = state('60')
        self.assertTrue(e.plan(self.t+timedelta(seconds=62), self.s))

    def test_unknown_lux_breaks_end_timer_and_restart_preserves_it(self):
        e = Engine(fixture(program('p','lux',[action(lux_entity='sensor.lux',on_delay=0,delay=10,end_action='off')])))
        deliver(e, e.plan(self.t, self.s), self.s)
        self.s['sensor.lux'] = state('200'); e.plan(self.t+timedelta(seconds=1), self.s)
        self.s['sensor.lux'] = state('unavailable'); e.plan(self.t+timedelta(seconds=9), self.s)
        self.s['sensor.lux'] = state('200'); e.plan(self.t+timedelta(seconds=10), self.s)
        e = Engine(e.config, e.rt)
        self.assertEqual(e.plan(self.t+timedelta(seconds=19), self.s), [])
        self.assertEqual(e.plan(self.t+timedelta(seconds=20), self.s)[0]['action'], {'mode':'off'})

    def test_restore_survives_restart_and_failed_completion_without_recapture(self):
        e = self.make('contact', delay=0)
        self.s['binary_sensor.tuer'] = state('on'); commands=e.plan(self.t, self.s)
        e.claim(commands[0], self.s)  # Persisted before device I/O; no success yet.
        self.s['light.flur'] = state('on',brightness=204)
        e = Engine(e.config,e.rt)
        deliver(e,e.plan(self.t,self.s),self.s)
        self.s['binary_sensor.tuer'] = state('off')
        first = e.plan(self.t,self.s)[0]
        e = Engine(e.config,e.rt)
        second = e.plan(self.t,self.s)[0]
        self.assertEqual(first,second)
        self.assertEqual(second['action']['brightness'],20)

    def test_current_time_program_wins_over_completion(self):
        c = fixture(program('time','time',[action('old',time='17:00',brightness=30),action('new',time='18:30',brightness=70)]),
                    program('motion','motion',[action('motion_action',delay=0,end_action='off')]))
        e = Engine(c); deliver(e,e.plan(self.t,self.s),self.s)
        self.s['binary_sensor.tuer']=state('on'); deliver(e,e.plan(self.t,self.s),self.s)
        self.s['binary_sensor.tuer']=state('off')
        commands=e.plan(self.t+timedelta(hours=1),self.s)
        self.assertEqual(commands[0]['action']['brightness'],70)
        self.assertFalse(commands[0]['release'])

    def test_nested_ended_motion_is_not_restored_by_later_contact_close(self):
        c=fixture(program('motion','motion',[action('motion_action',sensors=['binary_sensor.bewegung'],delay=0,end_action='restore')]),
                  program('door','contact',[action('door_action',delay=0,end_action='restore')]))
        e=Engine(c)
        self.s['binary_sensor.bewegung']=state('on');deliver(e,e.plan(self.t,self.s),self.s)
        self.s['light.flur']=state('on',brightness=204)
        self.s['binary_sensor.tuer']=state('on');deliver(e,e.plan(self.t,self.s),self.s)
        self.s['binary_sensor.bewegung']=state('off');self.assertEqual(e.plan(self.t,self.s),[])
        self.s['binary_sensor.tuer']=state('off')
        self.assertEqual(e.plan(self.t,self.s)[0]['action']['brightness'],20)

    def test_keep_end_does_not_fall_back_to_lamp_off(self):
        e=Engine(fixture(program('p','contact',[action(delay=0,end_action='keep')])))
        self.s['binary_sensor.tuer']=state('on');deliver(e,e.plan(self.t,self.s),self.s)
        self.s['binary_sensor.tuer']=state('off')
        self.assertEqual(e.plan(self.t,self.s),[])
        self.assertFalse(e.rt['controlled'])

    def test_sensor_activated_under_contact_inherits_return_without_stale_contact_state(self):
        c=fixture(program('motion','motion',[action('motion_action',sensors=['binary_sensor.bewegung'],delay=0,end_action='restore')]),
                  program('door','contact',[action('door_action',delay=0,end_action='restore')]))
        e=Engine(c)
        self.s['binary_sensor.tuer']=state('on');deliver(e,e.plan(self.t,self.s),self.s)
        self.s['light.flur']=state('on',brightness=204)
        self.s['binary_sensor.bewegung']=state('on');self.assertEqual(e.plan(self.t,self.s),[])
        self.s['binary_sensor.tuer']=state('off');e.plan(self.t,self.s)
        e=Engine(e.config,e.rt)  # Restart between planning and claiming the handover.
        deliver(e,e.plan(self.t,self.s),self.s)
        self.s['binary_sensor.bewegung']=state('off')
        self.assertEqual(e.plan(self.t,self.s)[0]['action']['brightness'],20)

    def test_missing_original_state_never_becomes_implicit_off(self):
        e=self.make('contact',delay=0)
        self.s['light.flur']=state('unavailable');self.s['binary_sensor.tuer']=state('on')
        commands=e.plan(self.t,self.s);e.claim(commands[0],self.s)
        self.s['light.flur']=state('on');self.s['binary_sensor.tuer']=state('off')
        self.assertEqual(e.plan(self.t,self.s),[])
        self.assertTrue(any('Ausgangszustand' in w for w in e.warnings))

    def test_schema_two_selects_used_sensors_and_preserves_old_fallback(self):
        c=fixture(program('p','motion',[action(lux_entity='sensor.lux')]))
        c['schema']=2;c.pop('sensors');a=c['programs'][0]['actions'][0];a.pop('end_action');a.pop('lux_end')
        c['programs'][0]['order']=1
        checked=validate(c)
        self.assertEqual(checked['schema'],4)
        self.assertEqual({s['entity'] for s in checked['sensors']},{'binary_sensor.tuer','sensor.lux'})
        self.assertEqual(checked['programs'][0]['actions'][0]['end_action'],'fallback')
        self.assertNotIn('order',checked['programs'][0])

    def test_unselected_used_sensors_rejected_but_unused_can_be_removed(self):
        c=fixture(program('p','motion',[action()]))
        c['sensors']=[s for s in c['sensors'] if s['entity']!='binary_sensor.tuer']
        with self.assertRaisesRegex(ValueError,'Einstellungen'):validate(c)
        c['sensors'].append({'entity':'binary_sensor.tuer','name':'Door'})
        c['sensors']=[s for s in c['sensors'] if s['entity']!='sensor.lux']
        self.assertEqual(len(validate(c)['sensors']),2)

    def test_time_ties_use_list_order_and_different_times_use_latest(self):
        c=fixture(program('first','time',[action('a',time='17:00')],order=9999),
                  program('second','time',[action('b',time='17:00')],order=0))
        e=Engine(c);e.plan(self.t,self.s)
        self.assertEqual(e.status['light.flur']['program'],'first')
        c['programs'][1]['actions'][0]['time']='17:30';e.replace(c);e.plan(self.t,self.s)
        self.assertEqual(e.status['light.flur']['program'],'second')

    def test_invalid_end_settings_are_rejected(self):
        for values in ({'end_action':'bad'},{'lux_end':'below','lux_off':100},{'lux_end':'bad'}):
            c=fixture(program('p','lux',[action(lux_entity='sensor.lux',**values)]))
            with self.assertRaises(ValueError):validate(c)

    def test_edit_active_sensor_keeps_original_and_advances_generation(self):
        e=self.make('contact',delay=0)
        self.s['binary_sensor.tuer']=state('on');deliver(e,e.plan(self.t,self.s),self.s)
        self.s['light.flur']=state('on',brightness=102)
        c=deepcopy(e.config);c['programs'][0]['actions'][0]['brightness']=90;e.replace(c)
        commands=e.plan(self.t,self.s);deliver(e,commands,self.s)
        self.s['binary_sensor.tuer']=state('off')
        self.assertEqual(e.rt['sensors']['a']['generation'],2)
        self.assertEqual(e.plan(self.t,self.s)[0]['action']['brightness'],20)

