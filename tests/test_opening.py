"""Opening-contact priority, calendar, persistence and return behavior."""
from copy import deepcopy
from datetime import timedelta
import unittest
from test_engine import Engine, fixture, at, solar, validate


def opening_fixture():
    config, states = fixture()
    config['windows'][0]['cover_type'] = 'blind'
    config['programs'] = [{'id':'opening', 'name':'Lüften', 'kind':'sensor', 'sensor_mode':'opening',
        'enabled':True, 'pause_in_vacation':True, 'days':list(range(7)), 'start_on_high':False,
        'opening_start':'08:00', 'opening_end':'18:00',
        'rides':[{'id':'open_ride','targets':['w'],'position':100,'tilt':40,'enabled':True}]}]
    states['cover.wohnen']['attributes'].update(current_position=30,current_tilt_position=15,supported_features=140)
    return config, states


class OpeningTests(unittest.TestCase):
    def setUp(self):
        self.c,self.s=opening_fixture();self.now=at('2026-10-30T09:00')
        self.e=Engine(self.c);self.e.tick(self.now,self.s,solar)
    def tick(self, seconds=5):
        self.now+=timedelta(seconds=seconds)
        return self.e.tick(self.now,self.s,solar)
    def open(self):
        self.s['binary_sensor.fenster']['state']='on'
        return self.tick()
    def close(self):
        self.s['binary_sensor.fenster']['state']='off'
        return self.tick()
    def finish(self, result):
        intent=result['w'];attrs=self.s['cover.wohnen']['attributes']
        for axis,attr in [('position','current_position'),('tilt','current_tilt_position')]:
            if intent[axis] is not None:attrs[attr]=intent[axis]
        self.e.finish('w',intent,self.now)
    def add_time(self):
        c,_=fixture();p=c['programs'][0]
        p['rides'][0].update(time='08:00',earliest='00:00',latest='23:59',position=20,tilt=25)
        self.c['programs'].append(p)
    def add_climate(self):
        self.c['windows'][0]['sensor_rules']=[{'id':'summer','name':'Sommer','temp_entity':'sensor.temp',
            'lux_entity':'sensor.lux','temp_on':25,'temp_off':23,'lux_on':30000,'lux_off':20000,'release_delay_seconds':0}]
        self.c['programs'].append({'id':'heat','name':'Sommer','kind':'sensor','days':list(range(7)),
            'rides':[{'id':'heat_ride','targets':['w'],'sensor_rule':'summer','edge':'active','position':0,'tilt':90}]})
        self.s.update({'sensor.temp':{'state':'20'},'sensor.lux':{'state':'1000'}})
    def reset(self):
        self.e=Engine(self.c);self.e.tick(self.now,self.s,solar)
    def test_open_bypasses_own_contact_and_returns_to_previous_height_and_tilt(self):
        result=self.open();self.assertEqual((result['w']['position'],result['w']['tilt']),(100,40))
        self.finish(result);self.assertFalse(self.tick())
        self.assertIn('w',self.e.rt['opening_holds'])
        result=self.close();self.assertEqual((result['w']['position'],result['w']['tilt']),(30,15))
        self.finish(result);self.assertNotIn('w',self.e.rt['opening_holds'])
        self.assertFalse(self.tick())
    def test_time_firing_while_open_is_deferred_and_latest_time_wins_on_close(self):
        self.add_time();self.c['programs'][1]['rides'][0].update(time='09:01',position=60)
        self.reset();self.finish(self.open())
        self.now=at('2026-10-30T09:00:55');self.e.tick(self.now,self.s,solar)
        self.assertFalse(self.tick())
        self.assertIn('time',self.e.rt['pending']['w'])
        self.assertIn('Öffnungsprogramm',self.e.rt['pending']['w']['time']['reason'])
        result=self.close();self.assertEqual(result['w']['position'],60)
        self.finish(result);self.assertFalse(self.tick())
    def test_active_climate_has_priority_over_time_after_close(self):
        self.add_time();self.add_climate();self.reset();self.finish(self.open())
        self.s['sensor.temp']['state']='28';self.s['sensor.lux']['state']='40000'
        self.assertFalse(self.tick());self.assertEqual(self.e.rt['pending']['w']['sensor']['position'],0)
        result=self.close();self.assertEqual((result['w']['position'],result['w']['tilt']),(0,90))
    def test_climate_released_while_open_falls_back_to_time_not_stale_climate(self):
        self.add_time();self.add_climate();self.reset();self.finish(self.open())
        self.s['sensor.temp']['state']='28';self.s['sensor.lux']['state']='40000';self.tick()
        self.s['sensor.temp']['state']='20';self.tick()
        result=self.close();self.assertEqual((result['w']['position'],result['w']['tilt']),(20,25))
    def test_later_climate_release_restores_underlying_position_not_temporary_opening(self):
        self.add_climate()
        self.c['programs'][1]['rides'].append({'id':'heat_release','targets':['w'],'sensor_rule':'summer',
            'edge':'inactive','restore_schedule':True})
        self.reset();self.finish(self.open())
        self.s['sensor.temp']['state']='28';self.s['sensor.lux']['state']='40000';self.tick()
        self.finish(self.close())
        self.s['sensor.temp']['state']='20';result=self.tick()
        self.assertEqual((result['w']['position'],result['w']['tilt']),(30,15))
    def test_missing_climate_readings_wait_on_close_then_restore(self):
        self.add_climate();self.reset();self.finish(self.open());self.s['sensor.temp']['state']='unavailable'
        self.assertFalse(self.close());self.assertIn('Sensorwerte',self.e.rt['pending']['w']['opening']['reason'])
        self.s['sensor.temp']['state']='20';result=self.tick();self.assertEqual(result['w']['position'],30)
    def test_hold_survives_time_window_end_and_next_day(self):
        self.finish(self.open());self.now=at('2026-10-31T19:00');self.assertFalse(self.e.tick(self.now,self.s,solar))
        self.assertIn('w',self.e.rt['opening_holds'])
        self.assertTrue(self.e.sensors_today(self.now)[0]['triggered'])
        self.assertEqual(self.close()['w']['position'],30)
    def test_restart_while_open_preserves_original_fallback(self):
        self.finish(self.open());self.e=Engine(self.e.config,self.e.rt)
        self.e.rt['opening_edges']={};self.assertFalse(self.tick())
        result=self.close();self.assertEqual((result['w']['position'],result['w']['tilt']),(30,15))
    def test_two_contacts_require_both_confirmed_closed(self):
        self.c['windows'][0]['contacts'].append({'entity':'binary_sensor.door','open_state':'on','policy':'skip'})
        self.s['binary_sensor.door']={'state':'off'};self.reset();self.finish(self.open())
        self.s['binary_sensor.door']['state']='on';self.assertFalse(self.close())
        self.s['binary_sensor.door']['state']='unavailable';self.assertFalse(self.tick())
        self.s['binary_sensor.door']['state']='off';self.assertEqual(self.tick()['w']['position'],30)
    def test_unknown_contact_never_causes_a_new_opening(self):
        self.s['binary_sensor.fenster']['state']='unavailable';self.assertFalse(self.tick())
        self.assertFalse(self.e.rt['opening_holds'])
    def test_already_open_at_start_is_baseline_unless_opted_in(self):
        self.s['binary_sensor.fenster']['state']='on';e=Engine(self.c)
        self.assertFalse(e.tick(self.now,self.s,solar))
        self.c['programs'][0]['start_on_high']=True;e=Engine(self.c)
        self.assertEqual(e.tick(self.now,self.s,solar)['w']['position'],100)
    def test_open_outside_window_does_not_drive_when_window_begins(self):
        self.now=at('2026-10-30T07:00');self.reset();self.assertFalse(self.open())
        self.now=at('2026-10-30T08:00');self.assertFalse(self.e.tick(self.now,self.s,solar))
        self.assertFalse(self.e.rt['opening_holds'])
    def test_opt_in_starts_if_window_begins_with_contact_already_open(self):
        self.c['programs'][0]['start_on_high']=True;self.now=at('2026-10-30T07:00');self.reset();self.open()
        self.now=at('2026-10-30T08:00');self.assertEqual(self.e.tick(self.now,self.s,solar)['w']['position'],100)
    def test_days_season_and_vacation_restrict_new_openings(self):
        for edit in ('days','season','vacation'):
            with self.subTest(edit=edit):
                c,s=opening_fixture()
                if edit=='days':c['programs'][0]['days']=[0]
                elif edit=='season':c['programs'][0]['season']={'enabled':True,'start':'04-01','end':'09-30'}
                else:c['vacation']=True
                e=Engine(c);e.tick(self.now,s,solar);s['binary_sensor.fenster']['state']='on'
                self.assertFalse(e.tick(self.now+timedelta(seconds=5),s,solar))
    def test_overnight_window_uses_start_day_and_releases_after_window(self):
        self.c['programs'][0].update(days=[4],opening_start='22:00',opening_end='06:00')
        self.now=at('2026-10-31T03:00');self.reset();self.finish(self.open())
        self.now=at('2026-10-31T07:00');self.e.tick(self.now,self.s,solar)
        self.assertEqual(self.close()['w']['position'],30)
    def test_one_shot_skip_cancels_opening_but_keeps_priority_until_close(self):
        result=self.open();row=self.e.planned_today(self.now,solar)[0]
        self.e.skip_today(self.now,solar,row['occurrence'],True)
        self.assertFalse(self.tick());self.assertIn('w',self.e.rt['opening_holds'])
        self.assertEqual(self.close()['w']['position'],30)
    def test_cancel_return_does_not_regenerate_it(self):
        self.finish(self.open());self.close();row=self.e.planned_today(self.now,solar)[0]
        self.e.skip_today(self.now,solar,row['occurrence'],True)
        self.assertFalse(self.tick());self.assertNotIn('w',self.e.rt['opening_holds'])
    def test_reopen_interrupts_return_and_retains_original_fallback(self):
        self.finish(self.open());first=self.close()['w'];self.s['cover.wohnen']['attributes']['current_position']=70
        second=self.open()['w'];self.assertEqual(second['phase'],'active');self.assertNotEqual(first['id'],second['id'])
        self.finish({'w':second});self.assertEqual(self.close()['w']['position'],30)
    def test_manual_movement_does_not_repeat_opening_while_contact_stays_open(self):
        self.finish(self.open());self.s['cover.wohnen']['attributes']['current_position']=60
        self.assertFalse(self.tick());self.assertEqual(self.close()['w']['position'],30)
    def test_shutter_does_not_receive_tilt_targets_or_restore_tilt(self):
        self.c['windows'][0]['cover_type']='shutter';self.reset()
        result=self.open();self.assertIsNone(result['w']['tilt']);self.finish(result)
        self.assertIsNone(self.close()['w']['tilt'])
    def test_unavailable_cover_retains_pending_opening_then_retries(self):
        self.s['cover.wohnen']['state']='unavailable';self.assertFalse(self.open())
        self.assertIn('opening',self.e.rt['pending']['w'])
        self.s['cover.wohnen']['state']='open';self.assertEqual(self.tick()['w']['position'],100)
    def test_missing_previous_position_does_not_invent_a_return_target(self):
        self.s['cover.wohnen']['attributes']={};result=self.open();self.finish(result)
        self.assertFalse(self.close());self.assertNotIn('w',self.e.rt['opening_holds'])
        self.assertTrue(any('Rückkehrposition' in item['message'] for item in self.e.rt['history']))
    def test_disabling_program_prevents_new_openings_but_keeps_existing_hold(self):
        self.finish(self.open());self.e.config['programs'][0]['enabled']=False
        self.assertFalse(self.tick());self.assertIn('w',self.e.rt['opening_holds'])
        self.assertEqual(self.close()['w']['position'],30)
    def test_nonoverlapping_programs_allowed_overlapping_programs_rejected(self):
        second=deepcopy(self.c['programs'][0]);second['id']='second';second['rides'][0]['id']='second_ride'
        self.c['programs'].append(second)
        with self.assertRaisesRegex(ValueError,'überschneiden'):validate(self.c)
        second.update(opening_start='18:01',opening_end='23:59');validate(self.c)
    def test_contact_and_height_are_required_but_no_temperature_rule_is_needed(self):
        validate(self.c)
        self.c['windows'][0]['contacts']=[]
        with self.assertRaisesRegex(ValueError,'Öffnungskontakt'):validate(self.c)
        self.c,_=opening_fixture();self.c['programs'][0]['rides'][0]['position']=None
        with self.assertRaisesRegex(ValueError,'Zielhöhe'):validate(self.c)
    def test_overnight_conflict_across_adjacent_season_boundaries(self):
        first=self.c['programs'][0]
        first.update(opening_start='22:00',opening_end='06:00',season={'enabled':True,'start':'10-31','end':'10-31'})
        second=deepcopy(first);second.update(id='winter',opening_start='00:00',opening_end='08:00',season={'enabled':True,'start':'11-01','end':'11-01'})
        second['rides'][0]['id']='winter_ride';self.c['programs'].append(second)
        with self.assertRaisesRegex(ValueError,'überschneiden'):validate(self.c)
        second['season']={'enabled':True,'start':'11-02','end':'11-02'};validate(self.c)
