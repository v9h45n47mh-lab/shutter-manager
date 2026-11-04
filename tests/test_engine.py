"""Behavior tests for scheduling and precedence, without an HA installation."""
import importlib.util
from pathlib import Path
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('planner_engine', ROOT / 'custom_components/rollladenplaner/engine.py')
module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
Engine, validate = module.Engine, module.validate_config
TZ = ZoneInfo('Europe/Berlin')
AUTO = 'auto_50e721e49c013f00'


def at(text):
    return datetime.fromisoformat(text).replace(tzinfo=TZ).astimezone(timezone.utc)


def solar(event, day):
    return datetime.combine(day, datetime.strptime('07:30' if event == 'sunrise' else '18:00', '%H:%M').time(), TZ)


def fixture():
    window = {'id':'w','name':'Wohnen','cover':'cover.wohnen','enabled':True,'contacts':[
        {'entity':'binary_sensor.fenster','open_state':'on','policy':'defer'}], 'travel_seconds':120}
    ride = {'id':'r','name':'Morgen','enabled':True,'skip_next':False,'targets':['w'],'event':'fixed',
            'time':'07:00','earliest':'06:00','latest':'08:00','offset':0,'position':0,'tilt':50,'defer_minutes':120}
    p = {'id':'p','name':'Wohnbereich','kind':'time','enabled':True,'days':[0,1,2,3,4],
         'pause_in_vacation':True,'rides':[ride]}
    config={'enabled':True,'vacation':False,'windows':[window],'programs':[p]}
    states={'cover.wohnen':{'state':'open','attributes':{'current_position':100}},
            'binary_sensor.fenster':{'state':'off'}}
    return config, states


def climate(c):
    c['windows'][0]['climate']={'lux_entity':'sensor.lux','temp_entity':'sensor.temp','lux_on':30000,'lux_off':20000,
        'temp_on':25,'temp_off':23,'auto_shade':False,'release_delay_seconds':0}


class SchedulingTests(unittest.TestCase):
    def setUp(self):
        self.c,self.s=fixture(); self.e=Engine(self.c)
        self.before=at('2026-10-30T06:59:55'); self.now=self.before+timedelta(seconds=5)
    def fire(self):
        self.e.tick(self.before,self.s,solar)
        return self.e.tick(self.now,self.s,solar)
    def test_schedules_once(self):
        ready=self.fire();self.assertIn('w',ready)
        self.e.finish('w',ready['w'],self.now)
        self.assertFalse(self.e.tick(self.now+timedelta(seconds=5),self.s,solar))
    def test_startup_does_not_replay(self):
        self.assertFalse(self.e.tick(self.now,self.s,solar))
        self.assertFalse(self.e.tick(self.now+timedelta(seconds=5),self.s,solar))
    def test_long_gap_does_not_replay(self):
        self.e.tick(self.before,self.s,solar)
        self.assertFalse(self.e.tick(self.now+timedelta(minutes=5),self.s,solar))
    def test_weekdays_are_individual(self):
        self.e.config['programs'][0]['days']=[0,2]
        self.assertFalse(self.fire())
    def test_vacation_selected(self):
        self.e.config['vacation']=True
        self.assertFalse(self.fire())
        self.e=Engine({**self.c,'vacation':True});self.e.config['programs'][0]['pause_in_vacation']=False
        self.assertIn('w',self.fire())
    def test_skip_once_survives_restart(self):
        self.e.config['programs'][0]['rides'][0]['skip_next']=True
        self.assertFalse(self.fire())
        self.assertFalse(self.e.config['programs'][0]['rides'][0]['skip_next'])
        restart=Engine(self.e.config,self.e.rt)
        restart.tick(self.now,self.s,solar)
        self.assertFalse(restart.tick(self.now+timedelta(seconds=5),self.s,solar))
        monday=at('2026-11-02T06:59:55')
        restart.tick(monday,self.s,solar)
        self.assertIn('w',restart.tick(monday+timedelta(seconds=5),self.s,solar))
    def test_disabled_ride(self):
        self.e.config['programs'][0]['rides'][0]['enabled']=False
        self.assertFalse(self.fire())
    def test_contact_defer_then_release(self):
        self.s['binary_sensor.fenster']['state']='on'
        self.assertFalse(self.fire());self.assertIn('w',self.e.rt['pending'])
        self.s['binary_sensor.fenster']['state']='off'
        self.assertIn('w',self.e.tick(self.now+timedelta(minutes=2),self.s,solar))
    def test_contact_skip_never_replays(self):
        self.e.config['windows'][0]['contacts'][0]['policy']='skip'
        self.s['binary_sensor.fenster']['state']='on'
        self.assertFalse(self.fire())
        self.s['binary_sensor.fenster']['state']='off'
        self.assertFalse(self.e.tick(self.now+timedelta(minutes=2),self.s,solar))
    def test_contact_drive(self):
        self.e.config['windows'][0]['contacts'][0]['policy']='drive'
        self.s['binary_sensor.fenster']['state']='on'
        self.assertIn('w',self.fire())
    def test_unknown_contact_blocks(self):
        self.s.pop('binary_sensor.fenster')
        self.assertFalse(self.fire())
    def test_unavailable_cover_defers(self):
        self.s['cover.wohnen']['state']='unavailable'
        self.assertFalse(self.fire())
    def test_pending_keeps_waiting_without_timeout(self):
        self.s['binary_sensor.fenster']['state']='on';self.fire()
        self.s['binary_sensor.fenster']['state']='off'
        self.assertIn('w',self.e.tick(self.now+timedelta(hours=3),self.s,solar))
        self.assertFalse(any(h['kind']=='expired' for h in self.e.rt['history']))
    def test_latest_replaces_pending_even_when_skipped(self):
        r=deepcopy(self.c['programs'][0]['rides'][0]);r.update(id='evening',time='07:01',skip_next=True)
        self.e.config['programs'][0]['rides'].append(r)
        self.s['binary_sensor.fenster']['state']='on';self.fire()
        self.e.tick(self.now+timedelta(minutes=1),self.s,solar)
        self.s['binary_sensor.fenster']['state']='off'
        self.assertFalse(self.e.tick(self.now+timedelta(minutes=1,seconds=5),self.s,solar))
    def test_newer_ride_wins(self):
        r=deepcopy(self.c['programs'][0]['rides'][0]);r.update(id='later',time='07:01',tilt=100)
        self.e.config['programs'][0]['rides'].append(r)
        self.s['binary_sensor.fenster']['state']='on';self.fire()
        self.e.tick(self.now+timedelta(minutes=1),self.s,solar)
        self.s['binary_sensor.fenster']['state']='off'
        self.assertEqual(self.e.tick(self.now+timedelta(minutes=1,seconds=5),self.s,solar)['w']['tilt'],100)
    def test_restart_retains_valid_defer(self):
        self.s['binary_sensor.fenster']['state']='on';self.fire()
        restart=Engine(self.e.config,self.e.rt);self.s['binary_sensor.fenster']['state']='off'
        self.assertIn('w',restart.tick(self.now+timedelta(minutes=5),self.s,solar))
    def test_valid_friday_goal_can_be_caught_up_on_saturday(self):
        self.s['binary_sensor.fenster']['state']='on';self.fire()
        self.s['binary_sensor.fenster']['state']='off'
        self.assertIn('w',self.e.tick(at('2026-10-31T07:00:00'),self.s,solar))
    def test_solar_clamped(self):
        r=deepcopy(self.e.config['programs'][0]['rides'][0]);r.update(event='sunrise',offset=-120)
        day=self.now.astimezone(TZ).date()
        self.assertEqual(self.e.due(r,day,solar).astimezone(TZ).strftime('%H:%M'),'06:00')
        r['offset']=120
        self.assertEqual(self.e.due(r,day,solar).astimezone(TZ).strftime('%H:%M'),'08:00')
        r.update(event='sunset',offset=60,earliest='17:00',latest='22:00')
        self.assertEqual(self.e.due(r,day,solar).astimezone(TZ).strftime('%H:%M'),'19:00')
    def test_dst_uses_local_clock(self):
        r=self.e.config['programs'][0]['rides'][0]
        self.assertEqual(self.e.due(r,at('2026-10-24T12:00').astimezone(TZ).date(),solar).hour,5)
        self.assertEqual(self.e.due(r,at('2026-10-26T12:00').astimezone(TZ).date(),solar).hour,6)
    def test_nonexistent_dst_time_is_clamped_after_normalizing(self):
        r=deepcopy(self.e.config['programs'][0]['rides'][0]);r.update(time='02:30',earliest='00:00',latest='03:00')
        day=at('2026-03-29T12:00').astimezone(TZ).date()
        self.assertEqual(self.e.due(r,day,solar).astimezone(TZ).strftime('%H:%M'),'03:00')
    def test_missing_astronomical_event(self):
        r=self.e.config['programs'][0]['rides'][0];r['event']='sunrise'
        self.assertIsNone(self.e.due(r,self.now.date(),lambda *_:None))
    def test_simultaneous_solar_boundaries_are_rejected_at_runtime(self):
        r=deepcopy(self.e.config['programs'][0]['rides'][0]);r.update(id='second',event='sunrise',offset=-30)
        self.e.config['programs'][0]['rides'][0].update(event='sunrise',offset=-60,earliest='07:00')
        r['earliest']='07:00'
        self.e.config['programs'][0]['rides'].append(r)
        self.assertFalse(self.fire())
        self.assertTrue(any('gleichzeitig' in h['message'] for h in self.e.rt['history']))
    def test_edit_does_not_run_old_schedule(self):
        self.e.replace_config(self.c,self.now)
        self.assertFalse(self.e.tick(self.now+timedelta(seconds=5),self.s,solar))
    def test_upcoming_excludes_weekend(self):
        upcoming=self.e.upcoming(at('2026-10-30T08:00'),solar)
        self.assertTrue(upcoming)
        self.assertEqual(datetime.fromisoformat(upcoming[0]['time']).astimezone(TZ).weekday(),0)


class ReschedulingTests(unittest.TestCase):
    def setUp(self):
        self.c,self.s=fixture()
        self.c['programs'][0]['days']=[5]
        self.c['programs'][0]['rides'][0].update(time='18:00',earliest='00:00',latest='23:59',position=85,tilt=0)
        self.e=Engine(self.c);self.key='2026-10-31:r'
    def fire(self):
        self.e.tick(at('2026-10-31T17:59:55'),self.s,solar)
        return self.e.tick(at('2026-10-31T18:00'),self.s,solar)
    def test_open_at_1800_closes_1801_reschedule_1802_skip_and_run_1803(self):
        self.s['binary_sensor.fenster']['state']='on';self.assertFalse(self.fire())
        self.assertEqual(self.e.planned_today(at('2026-10-31T18:00'),solar)[0]['status'],'pending')
        self.s['binary_sensor.fenster']['state']='off'
        ready=self.e.tick(at('2026-10-31T18:01'),self.s,solar);self.assertIn('w',ready)
        self.e.finish('w',ready['w'],at('2026-10-31T18:01'))
        changed=deepcopy(self.e.config);changed['programs'][0]['rides'][0]['time']='18:03'
        now=at('2026-10-31T18:02');self.e.replace_config(changed,now,solar)
        row=self.e.planned_today(now,solar)[0]
        self.assertEqual(row['status'],'planned');self.assertTrue(row['can_undo'])
        self.e.skip_today(now,solar,self.key,True)
        self.assertTrue(self.e.planned_today(now,solar)[0]['skip'])
        self.e.skip_today(now,solar,self.key,False)
        ready=self.e.tick(at('2026-10-31T18:03'),self.s,solar)
        self.assertEqual(ready['w']['position'],85)
        self.e.finish('w',ready['w'],at('2026-10-31T18:03'))
        self.assertEqual(self.e.planned_today(at('2026-10-31T18:04'),solar),[])
        self.assertFalse(self.e.tick(at('2026-10-31T18:04'),self.s,solar))
    def test_upgrade_repairs_legacy_future_claim_without_replaying_past(self):
        self.s['binary_sensor.fenster']['state']='on';self.fire()
        changed=deepcopy(self.e.config);changed['programs'][0]['rides'][0]['time']='18:03'
        legacy=deepcopy(self.e.rt);legacy['pending']={}
        upgrade=Engine(changed,legacy);now=at('2026-10-31T18:02')
        upgrade.rearm_future_time_occurrences(now,solar)
        self.assertNotIn(self.key,upgrade.rt['claimed'])
        self.assertTrue(upgrade.planned_today(now,solar)[0]['can_undo'])
        self.assertFalse(upgrade.tick(now,self.s,solar))
        self.assertFalse(upgrade.rt['pending'])
        past=Engine(self.e.config,legacy);past.rearm_future_time_occurrences(now,solar)
        self.assertIn(self.key,past.rt['claimed']);self.assertEqual(past.planned_today(now,solar),[])
    def test_regular_future_skip_survives_repair(self):
        now=at('2026-10-31T17:59');self.e.skip_today(now,solar,self.key,True)
        self.e.rearm_future_time_occurrences(now,solar)
        self.assertTrue(self.e.planned_today(now,solar)[0]['skip'])
        self.assertFalse(self.fire())
    def test_solar_offset_change_rearms_effective_future_due_time(self):
        self.c['programs'][0]['rides'][0].update(event='sunset',offset=0)
        self.e=Engine(self.c);ready=self.fire();self.e.finish('w',ready['w'],at('2026-10-31T18:00'))
        changed=deepcopy(self.e.config);changed['programs'][0]['rides'][0]['offset']=3
        now=at('2026-10-31T18:02');self.e.replace_config(changed,now,solar)
        self.assertTrue(self.e.planned_today(now,solar)[0]['can_undo'])
        self.assertIn('w',self.e.tick(at('2026-10-31T18:03'),self.s,solar))


class SensorTests(unittest.TestCase):
    def setUp(self):
        self.c,self.s=fixture();climate(self.c)
        self.s.update({'sensor.lux':{'state':'35000'},'sensor.temp':{'state':'26'}})
        monitored=deepcopy(self.c)
        sensor=deepcopy(monitored['programs'][0]);sensor.update(id='monitor',kind='sensor')
        sensor['rides'][0].update(id='monitor_active',edge='active')
        monitored['programs'].append(sensor)
        self.e=Engine(monitored);self.now=at('2026-10-30T07:00')
    def fire(self):
        self.e.tick(self.now-timedelta(seconds=5),self.s,solar)
        return self.e.tick(self.now,self.s,solar)
    def test_both_high_blocks_time(self):
        self.assertFalse(self.fire())
    def test_one_low_does_not_activate(self):
        self.s['sensor.temp']['state']='24'
        self.assertIn('w',self.fire())
    def test_hysteresis(self):
        self.fire();self.s['sensor.lux']['state']='25000';self.s['sensor.temp']['state']='24'
        self.assertFalse(self.e.tick(self.now+timedelta(seconds=5),self.s,solar))
        self.s['sensor.temp']['state']='23'
        self.assertIn('w',self.e.tick(self.now+timedelta(seconds=10),self.s,solar))
    def test_sensor_unknown_does_not_release(self):
        self.fire();self.s['sensor.temp']['state']='unknown'
        self.assertFalse(self.e.tick(self.now+timedelta(seconds=5),self.s,solar))
    def add_sensor(self):
        p=deepcopy(self.c['programs'][0]);p.update(id='s',kind='sensor',name='Hitze')
        p['rides'][0].update(id='heat',edge='active',position=0,tilt=100)
        q=deepcopy(p['rides'][0]);q.update(id='release',edge='inactive',tilt=50)
        p['rides'].append(q);self.c['programs'].append(p);self.e=Engine(self.c)
    def test_sensor_edges_and_priority(self):
        self.add_sensor();self.s['sensor.lux']['state']='10000'
        self.e.tick(self.now-timedelta(seconds=5),self.s,solar)
        self.s['sensor.lux']['state']='40000'
        ready=self.e.tick(self.now,self.s,solar)
        self.assertEqual(ready['w']['kind'],'sensor')
        self.assertEqual(ready['w']['tilt'],100)
        self.e.finish('w',ready['w'],self.now)
        self.assertFalse(self.e.tick(self.now+timedelta(seconds=5),self.s,solar))
        self.s['sensor.temp']['state']='22'
        ready=self.e.tick(self.now+timedelta(seconds=10),self.s,solar)
        self.assertEqual(ready['w']['ride'],'release')
    def test_contact_precedes_sensor(self):
        self.add_sensor();self.s['sensor.lux']['state']='10000';self.s['binary_sensor.fenster']['state']='on'
        self.e.tick(self.now-timedelta(seconds=5),self.s,solar)
        self.s['sensor.lux']['state']='40000'
        self.assertFalse(self.e.tick(self.now,self.s,solar))
        self.s['sensor.lux']['state']='unknown'
        self.s['binary_sensor.fenster']['state']='off'
        self.assertFalse(self.e.tick(self.now+timedelta(seconds=5),self.s,solar))
    def test_obsolete_sensor_goal_not_replayed(self):
        self.add_sensor();self.s['sensor.lux']['state']='10000';self.s['binary_sensor.fenster']['state']='on'
        self.e.tick(self.now-timedelta(seconds=5),self.s,solar)
        self.s['sensor.lux']['state']='40000';self.e.tick(self.now,self.s,solar)
        self.s['sensor.temp']['state']='20';self.e.tick(self.now+timedelta(seconds=5),self.s,solar)
        self.s['binary_sensor.fenster']['state']='off'
        ready=self.e.tick(self.now+timedelta(seconds=10),self.s,solar)
        self.assertEqual(ready['w']['ride'],'release')
    def test_initial_high_is_baseline(self):
        self.add_sensor();self.assertFalse(self.e.tick(self.now+timedelta(minutes=1),self.s,solar))


class ValidationTests(unittest.TestCase):
    def setUp(self): self.c,_=fixture()
    def test_duplicate_cover(self):
        w=deepcopy(self.c['windows'][0]);w['id']='other';self.c['windows'].append(w)
        with self.assertRaises(ValueError):validate(self.c)
    def test_bad_target(self):
        self.c['programs'][0]['rides'][0]['targets']=['missing']
        with self.assertRaises(ValueError):validate(self.c)
    def test_nan_position(self):
        self.c['programs'][0]['rides'][0]['position']=float('nan')
        with self.assertRaises(ValueError):validate(self.c)
    def test_inverted_bounds(self):
        self.c['programs'][0]['rides'][0].update(earliest='18:00',latest='06:00')
        with self.assertRaises(ValueError):validate(self.c)
    def test_missing_climate_for_sensor_program(self):
        self.c['programs'][0].update(kind='sensor')
        with self.assertRaises(ValueError):validate(self.c)
    def test_hysteresis_bounds(self):
        climate(self.c);self.c['windows'][0]['climate']['lux_off']=40000
        with self.assertRaises(ValueError):validate(self.c)
    def test_duplicate_time_target(self):
        r=deepcopy(self.c['programs'][0]['rides'][0]);r['id']='other';self.c['programs'][0]['rides'].append(r)
        with self.assertRaises(ValueError):validate(self.c)
    def test_injection_entity(self):
        self.c['windows'][0]['cover']='cover.x; arbitrary'
        with self.assertRaises(ValueError):validate(self.c)




class PlannedTodayTests(unittest.TestCase):
    def setUp(self):
        self.c,self.s=fixture();self.e=Engine(self.c);self.now=at('2026-10-30T06:30')
    def rows(self):return self.e.planned_today(self.now,solar)
    def test_day_plan_only_keeps_future_and_pending_without_replaying_past(self):
        later=deepcopy(self.c['programs'][0]['rides'][0]);later.update(id='evening',time='18:00',earliest='17:00',latest='20:00')
        self.c['programs'][0]['rides'].append(later);self.e=Engine(self.c)
        self.now=at('2026-10-30T12:00')
        before=deepcopy(self.e.rt)
        rows=self.rows();self.assertEqual([r['ride'] for r in rows],['evening'])
        self.assertEqual(self.e.rt,before,'reading the day plan cannot create a pending goal')
        self.assertFalse(self.e.tick(self.now,self.s,solar))
        self.assertFalse(self.e.rt['pending'])
        for value in (True,False):
            with self.assertRaisesRegex(ValueError,'nicht mehr offen'):
                self.e.skip_today(self.now,solar,'2026-10-30:r',value)
    def test_future_contact_preview_then_actual_suspension_and_release(self):
        self.s['binary_sensor.fenster']['state']='on'
        row=self.e.planned_today(self.now,solar,self.s)[0]
        self.assertTrue(row['contact_preview']);self.assertEqual(row['status'],'planned')
        self.assertFalse(self.e.rt['pending'])
        self.e.tick(at('2026-10-30T06:59:55'),self.s,solar)
        self.now=at('2026-10-30T07:00');self.e.tick(self.now,self.s,solar)
        row=self.e.planned_today(self.now,solar,self.s)[0]
        self.assertEqual(row['status'],'pending');self.assertIn('Fensterkontakt',row['reason'])
        self.assertNotIn('verstrichen',row['reason'])
        self.s['binary_sensor.fenster']['state']='off';self.now+=timedelta(seconds=5)
        ready=self.e.tick(self.now,self.s,solar);self.assertIn('w',ready)
        self.e.finish('w',ready['w'],self.now)
        self.e=Engine(self.e.config,self.e.rt)
        self.assertEqual(self.rows(),[])
        self.assertFalse(self.e.tick(self.now,self.s,solar))
    def test_failed_execution_stays_diagnostic_and_not_in_open_list(self):
        self.e.tick(at('2026-10-30T06:59:55'),self.s,solar)
        self.now=at('2026-10-30T07:00');ready=self.e.tick(self.now,self.s,solar)
        self.e.finish('w',ready['w'],self.now,'Positionssteuerung nicht unterstützt')
        self.assertEqual(self.rows(),[])
        self.assertIn('nicht unterstützt',self.e.rt['time_results']['2026-10-30:r']['reason'])
        self.assertFalse(self.e.rt['pending']['w'])
    def test_old_claimed_occurrence_is_not_reported_as_success(self):
        self.e.rt['claimed']=['2026-10-30:r'];self.now=at('2026-10-30T12:00')
        self.assertEqual(self.rows(),[])
    def test_reading_alone_does_not_mutate_or_rearm_an_old_claim(self):
        self.e.rt['claimed']=['2026-10-30:r'];self.now=at('2026-10-30T06:30')
        self.assertEqual(self.rows(),[])
        with self.assertRaisesRegex(ValueError,'nicht mehr offen'):
            self.e.skip_today(self.now,solar,'2026-10-30:r',True)
    def test_contact_skip_is_recorded_but_absent_from_open_list(self):
        self.e.config['windows'][0]['contacts'][0]['policy']='skip'
        self.s['binary_sensor.fenster']['state']='on'
        self.e.tick(at('2026-10-30T06:59:55'),self.s,solar)
        self.now=at('2026-10-30T07:00');self.assertFalse(self.e.tick(self.now,self.s,solar))
        self.assertEqual(self.rows(),[])
        record=next(iter(self.e.rt['contact_skips'].values()))['intent']
        self.assertEqual(record['blocked_contacts'],[{'entity':'binary_sensor.fenster','policy':'skip','unavailable':False}])
        with self.assertRaisesRegex(ValueError,'nicht mehr offen'):self.e.skip_today(self.now,solar,'2026-10-30:r',True)
        self.e=Engine(self.e.config,self.e.rt)
        self.s['binary_sensor.fenster']['state']='off';self.now+=timedelta(minutes=5)
        self.assertFalse(self.e.tick(self.now,self.s,solar));self.assertEqual(self.rows(),[])
        self.now=at('2026-10-31T00:00');self.e.tick(self.now,self.s,solar)
        self.assertEqual(self.rows(),[]);self.assertEqual(self.e.rt['contact_skips'],{})
    def test_unavailable_contact_is_distinguished_from_open_contact(self):
        self.s.pop('binary_sensor.fenster')
        self.e.tick(at('2026-10-30T06:59:55'),self.s,solar)
        self.now=at('2026-10-30T07:00');self.e.tick(self.now,self.s,solar)
        self.assertTrue(self.rows()[0]['blocked_contacts'][0]['unavailable'])
        self.s['binary_sensor.fenster']={'state':'off'}
        ready=self.e.tick(self.now+timedelta(seconds=5),self.s,solar)
        self.assertIn('w',ready);self.assertEqual(ready['w']['blocked_contacts'],[])
    def test_future_only_today_sorted_without_twenty_row_limit(self):
        rides=[]
        for i in range(25):
            r=deepcopy(self.c['programs'][0]['rides'][0]);r.update(id='r'+str(i),time=f'07:{i:02d}')
            rides.append(r)
        self.c['programs'][0]['rides']=rides;self.e=Engine(self.c)
        self.assertEqual(len(self.rows()),25)
        self.assertEqual(self.rows()[0]['time'],at('2026-10-30T07:00').isoformat())
        self.assertTrue(all(r['occurrence'].startswith('2026-10-30:') for r in self.rows()))
    def test_master_off_is_visible_as_paused(self):
        self.e.config['enabled']=False
        self.assertEqual(self.rows()[0]['status'],'paused')
    def test_vacation_has_own_pause_reason(self):
        self.e.config['vacation']=True
        self.assertEqual(self.rows()[0]['reason'],'Urlaubspause')
    def test_weekend_and_disabled_are_not_open(self):
        self.now=at('2026-10-31T06:30');self.assertEqual(self.rows(),[])
        self.now=at('2026-10-30T06:30');self.e.config['programs'][0]['rides'][0]['enabled']=False
        self.assertEqual(self.rows(),[])
    def test_concrete_skip_only_affects_today(self):
        row=self.rows()[0];self.e.skip_today(self.now,solar,row['occurrence'],True)
        self.assertTrue(self.rows()[0]['skip'])
        self.assertFalse(self.e.config['programs'][0]['rides'][0]['skip_next'])
        self.e.tick(at('2026-10-30T06:59:55'),self.s,solar)
        self.assertFalse(self.e.tick(at('2026-10-30T07:00'),self.s,solar))
        self.e.tick(at('2026-11-02T06:59:55'),self.s,solar)
        self.assertIn('w',self.e.tick(at('2026-11-02T07:00'),self.s,solar))
    def test_undo_future_skip(self):
        key=self.rows()[0]['occurrence'];self.e.skip_today(self.now,solar,key,True)
        self.e.skip_today(self.now,solar,key,False)
        self.assertFalse(self.rows()[0]['skip'])
    def test_skip_and_undo_persist_across_restart(self):
        key=self.rows()[0]['occurrence'];self.e.skip_today(self.now,solar,key,True)
        self.e=Engine(self.e.config,self.e.rt)
        self.assertTrue(self.rows()[0]['skip'])
        self.e.skip_today(self.now,solar,key,False);self.assertFalse(self.rows()[0]['skip'])
    def test_waiting_trip_is_visible_and_cancelled_without_skipping_next(self):
        self.s['binary_sensor.fenster']['state']='on'
        self.e.tick(at('2026-10-30T06:59:55'),self.s,solar)
        self.e.tick(at('2026-10-30T07:00'),self.s,solar)
        self.now=at('2026-10-30T07:05');row=self.rows()[0]
        self.assertEqual(row['status'],'pending');self.assertIn('Fensterkontakt',row['reason'])
        self.e.skip_today(self.now,solar,row['occurrence'],True)
        self.s['binary_sensor.fenster']['state']='off'
        self.assertFalse(self.e.tick(self.now,self.s,solar));self.assertEqual(self.rows(),[])
        self.assertFalse(self.e.config['programs'][0]['rides'][0]['skip_next'])
    def test_completed_row_disappears_and_cannot_skip_next_execution(self):
        self.e.tick(at('2026-10-30T06:59:55'),self.s,solar)
        ready=self.e.tick(at('2026-10-30T07:00'),self.s,solar)
        self.e.finish('w',ready['w'],at('2026-10-30T07:01'))
        self.now=at('2026-10-30T07:02');self.assertEqual(self.rows(),[])
        with self.assertRaises(ValueError):self.e.skip_today(self.now,solar,'2026-10-30:r',True)
    def test_one_time_next_flag_can_be_cleared_from_today(self):
        self.e.config['programs'][0]['rides'][0]['skip_next']=True
        self.assertTrue(self.rows()[0]['skip'])
        self.e.skip_today(self.now,solar,self.rows()[0]['occurrence'],False)
        self.assertFalse(self.e.config['programs'][0]['rides'][0]['skip_next'])
    def test_partial_group_shows_only_remaining_window(self):
        w=deepcopy(self.c['windows'][0]);w.update(id='w2',cover='cover.essen',name='Essen')
        self.c['windows'].append(w);self.c['programs'][0]['rides'][0]['targets'].append('w2')
        self.s['cover.essen']={'state':'open'};self.e=Engine(self.c)
        self.e.tick(at('2026-10-30T06:59:55'),self.s,solar)
        ready=self.e.tick(at('2026-10-30T07:00'),self.s,solar)
        self.e.finish('w',ready['w'],at('2026-10-30T07:01'))
        self.now=at('2026-10-30T07:02');self.assertEqual(self.rows()[0]['targets'],['w2'])
    def test_one_time_action_runs_once_and_disappears_after_success(self):
        action={'id':'once_test','target':'w','created':at('2026-10-30T07:00').isoformat(),
                'scheduled':at('2026-10-30T07:01').isoformat(),'position':35,'tilt':20,
                'status':'planned','reason':''}
        self.e.rt['one_time'].append(action)
        self.assertFalse(self.e.tick(at('2026-10-30T07:00:55'),self.s,solar))
        ready=self.e.tick(at('2026-10-30T07:01'),self.s,solar)
        self.assertEqual((ready['w']['id'],ready['w']['position'],ready['w']['tilt']),('once_test',35,20))
        self.e.finish('w',ready['w'],at('2026-10-30T07:02'))
        self.assertEqual(self.e.rt['one_time'],[])

    def test_one_time_error_stays_visible(self):
        action={'id':'once_error','target':'w','created':at('2026-10-30T07:00').isoformat(),
                'scheduled':at('2026-10-30T07:01').isoformat(),'position':35,'tilt':None,
                'status':'planned','reason':''}
        self.e.rt['one_time'].append(action)
        ready=self.e.tick(at('2026-10-30T07:01'),self.s,solar)
        self.e.finish('w',ready['w'],at('2026-10-30T07:02'),error='Fahrt fehlgeschlagen')
        self.assertEqual(action['status'],'error')
        self.assertEqual(action['reason'],'Fahrt fehlgeschlagen')

    def test_one_time_action_expires_after_local_day(self):
        action={'id':'once_expired','target':'w','created':at('2026-10-30T07:00').isoformat(),
                'scheduled':at('2026-10-30T07:01').isoformat(),'position':35,'tilt':None,
                'status':'planned','reason':''}
        self.e.rt['one_time'].append(action)
        self.assertFalse(self.e.tick(at('2026-10-31T00:01'),self.s,solar))
        self.assertEqual(self.e.rt['one_time'],[])

    def test_local_day_not_utc_date(self):
        self.e.config['programs'][0]['days']=[4,5]
        self.e.config['programs'][0]['rides'][0].update(time='00:15',earliest='00:00')
        self.now=at('2026-10-31T00:05')
        self.assertTrue(self.rows()[0]['occurrence'].startswith('2026-10-31:'))


class AutomaticShadingTests(unittest.TestCase):
    def setUp(self):
        self.c,self.s=fixture();climate(self.c)
        self.c['windows'][0]['climate'].update(auto_shade=True,shade_position=0,shade_tilt=100,release_delay_seconds=30)
        self.s['cover.wohnen']['attributes']['current_tilt_position']=50
        self.s.update({'sensor.lux':{'state':'10000'},'sensor.temp':{'state':'20'}})
        self.e=Engine(self.c);self.now=at('2026-10-30T08:00')
    def tick(self,seconds=0):return self.e.tick(self.now+timedelta(seconds=seconds),self.s,solar)
    def high(self):self.s['sensor.lux']['state']='40000';self.s['sensor.temp']['state']='27'
    def low(self):self.s['sensor.temp']['state']='22'
    def finish(self,ready,seconds=0):
        if 'w' in ready:self.e.finish('w',ready['w'],self.now+timedelta(seconds=seconds))
    def test_high_drives_separate_position_without_time_trigger(self):
        self.tick();self.high();ready=self.tick(5)
        self.assertEqual((ready['w']['kind'],ready['w']['position'],ready['w']['tilt']),('sensor',0,100))
        self.finish(ready,5);self.assertFalse(self.tick(10))
    def test_one_high_variable_is_insufficient(self):
        self.s['sensor.lux']['state']='40000';self.assertFalse(self.tick())
    def test_release_delay_in_seconds_and_latest_time_plan(self):
        self.high();self.finish(self.tick())
        self.low();self.assertFalse(self.tick(5));self.assertFalse(self.tick(34))
        ready=self.tick(35);self.assertEqual(ready['w']['ride'],AUTO+'_release')
        self.assertEqual((ready['w']['position'],ready['w']['tilt']),(0,50))
    def test_lower_condition_must_remain_true_for_whole_delay(self):
        self.high();self.finish(self.tick());self.low();self.tick(5)
        self.s['sensor.temp']['state']='24';self.tick(20)  # above off, below on
        self.low();self.assertFalse(self.tick(30));self.assertFalse(self.tick(59))
        self.assertEqual(self.tick(60)['w']['ride'],AUTO+'_release')
    def test_unknown_sensor_resets_release_timer(self):
        self.high();self.finish(self.tick());self.low();self.tick(5)
        self.s['sensor.lux']['state']='unavailable';self.tick(20)
        self.s['sensor.lux']['state']='35000';self.assertFalse(self.tick(30))
        self.assertEqual(self.tick(60)['w']['ride'],AUTO+'_release')
    def test_future_skip_next_does_not_erase_current_time_plan(self):
        self.e.config['programs'][0]['rides'][0]['skip_next']=True
        goal=self.e.current_schedule_goal(self.e.windows()['w'],self.now,solar,{'position':100,'tilt':0})
        self.assertEqual((goal['position'],goal['tilt']),(0,50))
    def test_current_evening_plan_replaces_morning_on_release(self):
        r=deepcopy(self.c['programs'][0]['rides'][0]);r.update(id='evening',time='18:00',earliest='17:00',latest='22:00',tilt=100)
        self.c['programs'][0]['rides'].append(r);self.e=Engine(self.c)
        self.high();self.finish(self.tick())
        self.now=at('2026-10-30T18:30');self.low();self.tick()
        ready=self.tick(30);self.assertEqual(ready['w']['tilt'],100)
    def test_skipped_evening_is_not_used_as_release_target(self):
        r=deepcopy(self.c['programs'][0]['rides'][0]);r.update(id='evening',time='18:00',earliest='17:00',latest='22:00',tilt=100)
        self.c['programs'][0]['rides'].append(r);self.e=Engine(self.c)
        self.e.skip_today(self.now,solar,'2026-10-30:evening',True)
        self.high();self.finish(self.tick());self.now=at('2026-10-30T18:30');self.low();self.tick()
        self.assertEqual(self.tick(30)['w']['tilt'],50)
    def test_contact_precedes_automatic_shade(self):
        self.high();self.s['binary_sensor.fenster']['state']='on'
        self.assertFalse(self.tick())
        self.assertIn('Fensterkontakt',self.e.rt['pending']['w']['sensor']['reason'])
        self.s['binary_sensor.fenster']['state']='off';self.assertEqual(self.tick(5)['w']['kind'],'sensor')
    def test_fallback_without_time_program_uses_position_before_heat(self):
        self.c['programs']=[];self.e=Engine(self.c);self.high();self.finish(self.tick())
        self.low();self.tick(5);ready=self.tick(35)
        self.assertEqual((ready['w']['position'],ready['w']['tilt']),(100,50))
    def test_planned_view_includes_auto_shade_and_cancel(self):
        self.high();self.tick()
        rows=[r for r in self.e.planned_today(self.now,solar) if r['kind']=='sensor']
        self.assertEqual(rows[0]['kind'],'sensor')
        self.e.skip_today(self.now,solar,rows[0]['occurrence'],True)
        self.assertFalse(self.tick(5))
    def test_delay_persists_on_restart(self):
        self.high();self.finish(self.tick());self.low();self.tick(5)
        self.e=Engine(self.e.config,self.e.rt)
        self.assertFalse(self.tick(34));self.assertEqual(self.tick(35)['w']['ride'],AUTO+'_release')
    def test_zero_seconds_release(self):
        next(p for p in self.e.config['programs'] if p['id']==AUTO)['conditions']['release_delay_seconds']=0
        self.high();self.finish(self.tick());self.low()
        self.assertEqual(self.tick(5)['w']['ride'],AUTO+'_release')
    def test_no_future_shade_action_after_global_off(self):
        self.high();self.tick();self.e.config['enabled']=False
        self.assertFalse(self.tick(5));self.assertFalse(self.e.rt['shading']['w']['active'])
    def test_fixed_travel_timeout_not_configurable_via_legacy_import(self):
        self.c['windows'][0]['travel_seconds']=9999
        self.assertNotIn('travel_seconds',validate(self.c)['windows'][0])
        self.assertEqual(module.TRAVEL_TIMEOUT_SECONDS,150)


class ShadingConfigurationTests(unittest.TestCase):
    def test_refresh_keeps_before_position_but_applies_changed_shade_target(self):
        c,s=fixture();climate(c);c['programs']=[]
        c['windows'][0]['climate'].update(auto_shade=True,shade_position=0,shade_tilt=100,release_delay_seconds=0)
        s.update({'sensor.lux':{'state':'40000'},'sensor.temp':{'state':'28'}})
        s['cover.wohnen']['attributes']['current_tilt_position']=50
        e=Engine(c);now=at('2026-10-30T08:00');ready=e.tick(now,s,solar);e.finish('w',ready['w'],now)
        s['cover.wohnen']['attributes']['current_position']=0
        c2=deepcopy(e.config);c2['programs'][0]['rides'][0]['tilt']=75
        e.replace_config(c2,now+timedelta(seconds=5))
        ready=e.tick(now+timedelta(seconds=5),s,solar);self.assertEqual(ready['w']['tilt'],75)
        e.finish('w',ready['w'],now+timedelta(seconds=5))
        s['sensor.temp']['state']='22'
        self.assertEqual(e.tick(now+timedelta(seconds=10),s,solar)['w']['position'],100)
    def test_direct_shading_and_sensor_program_cannot_compete(self):
        c,_=fixture();climate(c);c['windows'][0]['climate']['auto_shade']=True
        c['programs'][0]['kind']='sensor'
        with self.assertRaisesRegex(ValueError,'gleichzeitige Fahrten'):
            validate(c)
    def test_negative_release_delay_rejected(self):
        c,_=fixture();climate(c);c['windows'][0]['climate']['release_delay_seconds']=-1
        with self.assertRaises(ValueError):validate(c)
    def test_existing_sensor_program_migrates_to_program_mode(self):
        c,_=fixture();climate(c);c['windows'][0]['climate'].pop('auto_shade')
        c['programs'][0]['kind']='sensor'
        checked=validate(c);self.assertNotIn('climate',checked['windows'][0]);self.assertEqual(len(checked['programs']),1);self.assertEqual(checked['programs'][0]['rides'][0]['sensor_rule'],'legacy')




class SingleCoverRideTests(unittest.TestCase):
    def grouped(self):
        c,s=fixture()
        c['windows'].append({'id':'w2','name':'Essen','cover':'cover.essen','enabled':True,'contacts':[]})
        c['programs'][0]['rides'][0]['targets']=['w','w2']
        s['cover.essen']={'state':'open','attributes':{'current_position':100}}
        return c,s
    def test_grouped_legacy_config_splits_to_exactly_one_target(self):
        c,_=self.grouped();checked=validate(c);rides=checked['programs'][0]['rides']
        self.assertEqual([r['targets'] for r in rides],[['w'],['w2']])
        self.assertEqual([r['name'] for r in rides],['Wohnen','Essen'])
        self.assertEqual([(r['time'],r['position'],r['tilt']) for r in rides],[('07:00',0,50),('07:00',0,50)])
        self.assertEqual(rides[0]['id'],'r');self.assertNotEqual(rides[1]['id'],'r')
    def test_group_migration_is_deterministic_and_idempotent(self):
        c,_=self.grouped();a=validate(c);b=validate(c)
        self.assertEqual(a,b);self.assertEqual(a,validate(a))
    def test_name_not_required_and_tracks_window_rename(self):
        c,_=fixture();c['programs'][0]['rides'][0].pop('name');c['windows'][0]['name']='Neuer Name'
        self.assertEqual(validate(c)['programs'][0]['rides'][0]['name'],'Neuer Name')
    def test_manual_shutter_has_no_tilt_axis(self):
        c,_=fixture();c['windows'][0]['cover_type']='shutter'
        self.assertIsNone(validate(c)['programs'][0]['rides'][0]['tilt'])
    def test_tilt_only_ride_cannot_be_silently_converted_to_shutter_height(self):
        c,_=fixture();c['windows'][0]['cover_type']='shutter';c['programs'][0]['rides'][0]['position']=None
        with self.assertRaisesRegex(ValueError,'Höhe erforderlich'):validate(c)
    def test_manual_blind_allows_tilt_independent_of_name(self):
        c,_=fixture();c['windows'][0].update(name='Küche',cover_type='blind')
        self.assertEqual(validate(c)['programs'][0]['rides'][0]['tilt'],50)
    def test_type_detection_uses_features_or_device_class_or_override(self):
        self.assertTrue(module.is_blind({'cover_type':'auto'},{'supported_features':128}))
        self.assertTrue(module.is_blind({'cover_type':'auto'},{'device_class':'blind'}))
        self.assertFalse(module.is_blind({'cover_type':'auto'},{'supported_features':12}))
        self.assertFalse(module.is_blind({'cover_type':'shutter'},{'supported_features':128}))
        self.assertTrue(module.is_blind({'cover_type':'blind'},{}))
    def test_long_legacy_id_produces_valid_unique_short_ids(self):
        c,_=self.grouped();c['programs'][0]['rides'][0]['id']='x'*64
        rides=validate(c)['programs'][0]['rides']
        self.assertTrue(all(len(r['id'])<=64 for r in rides));self.assertNotEqual(rides[0]['id'],rides[1]['id'])
    def test_group_skip_marker_is_carried_to_both_individual_occurrences(self):
        c,_=self.grouped()
        rt={'skipped_occurrences':{'2026-10-30:r':{'date':'2026-10-30'}}}
        e=Engine(c,rt);rows=e.planned_today(at('2026-10-30T06:30'),solar)
        self.assertEqual(len(rows),2);self.assertTrue(all(r['skip'] for r in rows))
    def test_legacy_claimed_and_pending_groups_are_remapped(self):
        c,s=self.grouped()
        runtime={'pending':{},'claimed':['2026-10-30:r']}
        for wid in ('w','w2'):
            runtime['pending'][wid]={'time':{'id':'2026-10-30:r:'+wid,'program':'p','ride':'r','window':wid,'kind':'time',
                'position':0,'tilt':50,'created':at('2026-10-30T07:00').isoformat(),
                'expires':at('2026-10-30T09:00').isoformat(),'name':'Old group','reason':''}}
        e=Engine(c,runtime)
        rows=e.planned_today(at('2026-10-30T07:05'),solar)
        self.assertEqual(len(rows),2);self.assertTrue(all(len(r['targets'])==1 for r in rows))
        ids={r['id'] for r in e.config['programs'][0]['rides']}
        self.assertEqual({r['ride'] for r in rows},ids)
        self.assertEqual(len(e.rt['claimed']),2)
        for wid,slots in e.rt['pending'].items():
            intent=slots['time'];self.assertEqual(intent['id'],intent['occurrence']+':'+wid)
            self.assertIn(intent['ride'],ids)
    def test_one_individual_skip_leaves_the_other_target_scheduled(self):
        c,s=self.grouped();e=Engine(c)
        rows=e.planned_today(at('2026-10-30T06:30'),solar)
        chosen=next(r for r in rows if r['targets']==['w2'])
        e.skip_today(at('2026-10-30T06:30'),solar,chosen['occurrence'],True)
        e.tick(at('2026-10-30T06:59:55'),s,solar)
        self.assertEqual(list(e.tick(at('2026-10-30T07:00'),s,solar)),['w'])




class IndefiniteCatchupTests(unittest.TestCase):
    def setUp(self):
        self.c,self.s=fixture();self.e=Engine(self.c);self.before=at('2026-10-30T06:59:55');self.now=at('2026-10-30T07:00')
        self.s['binary_sensor.fenster']['state']='on'
    def begin(self):self.e.tick(self.before,self.s,solar);return self.e.tick(self.now,self.s,solar)
    def add_evening(self,skip=False):
        r=deepcopy(self.c['programs'][0]['rides'][0]);r.update(id='evening',time='18:00',earliest='17:00',latest='22:00',tilt=100,skip_next=skip)
        self.e.config['programs'][0]['rides'].append(r)
    def test_no_configured_deadline_in_new_or_legacy_config(self):
        self.c['programs'][0]['rides'][0]['defer_minutes']=1
        self.e=Engine(self.c);self.begin()
        self.assertNotIn('defer_minutes',self.e.config['programs'][0]['rides'][0])
        self.assertNotIn('expires',self.e.rt['pending']['w']['time'])
    def test_pending_is_visible_on_next_day_and_can_be_cancelled(self):
        self.begin();now=at('2026-10-31T11:00');self.e.tick(now,self.s,solar)
        rows=self.e.planned_today(now,solar)
        self.assertEqual(len(rows),1);self.assertTrue(rows[0]['carried'])
        self.assertEqual(rows[0]['time'],self.now.isoformat())
        self.e.skip_today(now,solar,rows[0]['occurrence'],True)
        self.s['binary_sensor.fenster']['state']='off'
        self.assertFalse(self.e.tick(now+timedelta(seconds=5),self.s,solar))
    def test_latest_goal_after_long_outage_replaces_old_blocked_goal(self):
        self.add_evening();self.begin()
        self.s['binary_sensor.fenster']['state']='off'
        ready=self.e.tick(at('2026-10-30T20:00'),self.s,solar)
        self.assertEqual(ready['w']['ride'],'evening');self.assertEqual(ready['w']['tilt'],100)
    def test_skipped_newer_goal_cancels_old_one_even_after_outage(self):
        self.add_evening(skip=True);self.begin()
        self.s['binary_sensor.fenster']['state']='off'
        self.assertFalse(self.e.tick(at('2026-10-30T20:00'),self.s,solar))
        self.assertFalse(self.e.config['programs'][0]['rides'][1]['skip_next'])
    def test_cross_program_latest_time_replaces_old_goal(self):
        p=deepcopy(self.c['programs'][0]);p['id']='p2';p['name']='Abends'
        p['rides'][0].update(id='evening',time='18:00',earliest='17:00',latest='22:00',tilt=100)
        self.e.config['programs'].append(p);self.begin()
        self.e.tick(at('2026-10-30T17:59:55'),self.s,solar)
        self.e.tick(at('2026-10-30T18:00'),self.s,solar)
        self.s['binary_sensor.fenster']['state']='off'
        self.assertEqual(self.e.tick(at('2026-10-30T18:01'),self.s,solar)['w']['program'],'p2')
    def test_restart_drops_legacy_expiry_but_retains_latest_goal(self):
        self.begin();self.e.rt['pending']['w']['time']['expires']=at('2026-10-30T07:01').isoformat()
        restart=Engine(self.e.config,self.e.rt)
        self.assertNotIn('expires',restart.rt['pending']['w']['time'])
        self.s['binary_sensor.fenster']['state']='off'
        self.assertIn('w',restart.tick(at('2026-10-31T11:00'),self.s,solar))
    def test_old_release_cannot_run_after_a_newer_time_goal(self):
        self.add_evening();self.c['programs'][0]['rides']=deepcopy(self.e.config['programs'][0]['rides']);climate(self.c)
        p=deepcopy(self.c['programs'][0]);p.update(id='release_program',kind='sensor')
        p['rides']=[dict(p['rides'][0],id='release_ride',edge='inactive')]
        self.c['programs'].append(p);self.e=Engine(self.c)
        self.s.update({'sensor.lux':{'state':'40000'},'sensor.temp':{'state':'28'}})
        self.s['binary_sensor.fenster']['state']='on'
        self.e.tick(at('2026-10-30T16:59'),self.s,solar)
        self.s['sensor.temp']['state']='22';self.e.tick(at('2026-10-30T17:00'),self.s,solar)
        self.assertIn('sensor',self.e.rt['pending']['w'])
        self.e.tick(at('2026-10-30T17:59:55'),self.s,solar);self.e.tick(at('2026-10-30T18:00'),self.s,solar)
        self.s['binary_sensor.fenster']['state']='off'
        ready=self.e.tick(at('2026-10-30T18:01'),self.s,solar)
        self.assertEqual(ready['w']['ride'],'evening');self.assertNotIn('sensor',self.e.rt['pending']['w'])
    def test_sensor_priority_is_retained_while_heat_is_active(self):
        climate(self.c);self.c['windows'][0]['climate'].update(auto_shade=True,shade_position=0,shade_tilt=100)
        self.s.update({'sensor.lux':{'state':'40000'},'sensor.temp':{'state':'28'}})
        self.e=Engine(self.c);self.begin()
        self.s['binary_sensor.fenster']['state']='off'
        ready=self.e.tick(at('2026-10-30T10:00'),self.s,solar)
        self.assertEqual(ready['w']['kind'],'sensor')
    def test_new_date_occurrence_supersedes_the_previous_date(self):
        self.begin();self.e.tick(at('2026-11-02T06:59:55'),self.s,solar)
        self.e.tick(at('2026-11-02T07:00'),self.s,solar)
        self.s['binary_sensor.fenster']['state']='off'
        ready=self.e.tick(at('2026-11-02T07:05'),self.s,solar)
        self.assertEqual(ready['w']['occurrence'],'2026-11-02:r')
    def test_startup_still_does_not_create_unrequested_backlog(self):
        self.s['binary_sensor.fenster']['state']='off'
        self.assertFalse(self.e.tick(at('2026-10-30T20:00'),self.s,solar))




class PendingConfigurationTests(unittest.TestCase):
    def test_unrelated_rename_does_not_clear_a_pending_action(self):
        c, states = fixture(); states['binary_sensor.fenster']['state']='on'; e=Engine(c)
        e.tick(at('2026-10-30T06:59:55'),states,solar);e.tick(at('2026-10-30T07:00'),states,solar)
        updated=deepcopy(e.config);updated['windows'][0]['name']='Wohnen neu'
        e.replace_config(updated,at('2026-10-30T09:00'))
        self.assertIn('time',e.rt['pending']['w'])
        states['binary_sensor.fenster']['state']='off'
        ready=e.tick(at('2026-10-30T10:00'),states,solar)
        self.assertIn('w',ready);self.assertIn('Wohnen neu',ready['w']['name'])
    def test_explicit_change_of_pending_ride_cancels_its_old_target(self):
        c, states = fixture(); states['binary_sensor.fenster']['state']='on'; e=Engine(c)
        e.tick(at('2026-10-30T06:59:55'),states,solar);e.tick(at('2026-10-30T07:00'),states,solar)
        updated=deepcopy(e.config);updated['programs'][0]['rides'][0]['time']='11:00'
        e.replace_config(updated,at('2026-10-30T09:00'))
        states['binary_sensor.fenster']['state']='off'
        self.assertFalse(e.tick(at('2026-10-30T10:00'),states,solar))



class SingleSensorRuleTests(unittest.TestCase):
    def setup_rule(self,mode='temp',combination='and'):
        c,s=fixture()
        g={'auto_shade':True,'shade_position':0,'shade_tilt':100,'release_delay_seconds':10}
        if mode in ('temp','both'):
            g.update(temp_entity='sensor.temp',temp_on=23,temp_off=21)
        if mode in ('lux','both'):
            g.update(lux_entity='sensor.lux',lux_on=1000,lux_off=600)
        if mode=='both':g['combination']=combination
        c['windows'][0]['climate']=g
        s.update({'sensor.temp':{'state':'24'},'sensor.lux':{'state':'1200'}})
        return c,s,Engine(c)
    def test_temperature_alone_triggers_without_lux_values(self):
        c,s,e=self.setup_rule();s.pop('sensor.lux');now=at('2026-10-30T08:00')
        ready=e.tick(now,s,solar);self.assertEqual(ready['w']['kind'],'sensor')
        self.assertIsNone(e.config['windows'][0]['sensor_rules'][0]['lux_entity'])
        self.assertNotIn('combination',e.config['windows'][0]['sensor_rules'][0])
    def test_temperature_only_release_delay(self):
        c,s,e=self.setup_rule();now=at('2026-10-30T08:00')
        ready=e.tick(now,s,solar);e.finish('w',ready['w'],now)
        s['sensor.temp']['state']='20';self.assertFalse(e.tick(now+timedelta(seconds=5),s,solar))
        self.assertFalse(e.tick(now+timedelta(seconds=14),s,solar))
        self.assertEqual(e.tick(now+timedelta(seconds=15),s,solar)['w']['ride'],AUTO+'_release')
    def test_brightness_alone_does_not_need_temperature(self):
        c,s,e=self.setup_rule('lux');s.pop('sensor.temp')
        self.assertEqual(e.tick(at('2026-10-30T08:00'),s,solar)['w']['kind'],'sensor')
        self.assertIsNone(e.config['windows'][0]['sensor_rules'][0]['temp_entity'])
    def test_single_sensor_below_threshold_does_not_trigger(self):
        c,s,e=self.setup_rule();s['sensor.temp']['state']='22'
        self.assertFalse(e.tick(at('2026-10-30T08:00'),s,solar))
    def test_and_requires_both_upper_thresholds(self):
        c,s,e=self.setup_rule('both','and');s['sensor.lux']['state']='800'
        self.assertFalse(e.tick(at('2026-10-30T08:00'),s,solar))
    def test_legacy_or_is_converted_to_fixed_and(self):
        c,s,e=self.setup_rule('both','or');s['sensor.lux']['state']='800';now=at('2026-10-30T08:00')
        self.assertFalse(e.tick(now,s,solar))
        s['sensor.lux']['state']='1200';self.assertIn('w',e.tick(now+timedelta(seconds=5),s,solar))
    def test_and_releases_when_either_lower_threshold_is_met(self):
        c,s,e=self.setup_rule('both','or');now=at('2026-10-30T08:00')
        ready=e.tick(now,s,solar);e.finish('w',ready['w'],now)
        s['sensor.temp']['state']='20'
        self.assertFalse(e.tick(now+timedelta(seconds=5),s,solar))
        self.assertFalse(e.tick(now+timedelta(seconds=14),s,solar))
        self.assertEqual(e.tick(now+timedelta(seconds=15),s,solar)['w']['ride'],AUTO+'_release')
    def test_assigned_but_unavailable_sensor_is_not_ignored(self):
        c,s,e=self.setup_rule('both','or');s['sensor.lux']['state']='unavailable'
        self.assertFalse(e.tick(at('2026-10-30T08:00'),s,solar))
    def test_zero_assigned_sensors_is_invalid(self):
        c,s=fixture();c['windows'][0]['climate']={'auto_shade':True}
        with self.assertRaisesRegex(ValueError,'Mindestens einen Temperatur'):validate(c)
    def test_obsolete_conjunction_is_not_persisted(self):
        c,s,e=self.setup_rule('both');c['windows'][0]['climate']['combination']='single'
        self.assertNotIn('combination',validate(c)['windows'][0]['sensor_rules'][0])




class AnnualSeasonTests(unittest.TestCase):
    def test_german_dates_and_canonical_dates_are_equivalent(self):
        self.assertEqual(module.normalize_season({'enabled':True,'start':'1.4.','end':'31.10'}),
                         {'enabled':True,'start':'04-01','end':'10-31'})
    def test_start_and_end_are_inclusive_and_repeat_each_year(self):
        season=module.normalize_season({'enabled':True,'start':'01.04.','end':'31.10.'})
        for year in (2026,2027):
            for text,expected in [('03-31',False),('04-01',True),('10-31',True),('11-01',False)]:
                self.assertEqual(module.in_season(season,datetime.fromisoformat(f'{year}-{text}').date()),expected)
    def test_winter_range_crosses_year_boundary(self):
        season=module.normalize_season({'enabled':True,'start':'01.11.','end':'31.03.'})
        for text,expected in [('2026-11-01',True),('2027-01-15',True),('2027-03-31',True),('2027-04-01',False),('2026-10-31',False)]:
            self.assertEqual(module.in_season(season,datetime.fromisoformat(text).date()),expected)
    def test_invalid_calendar_date_rejected(self):
        with self.assertRaisesRegex(ValueError,'Saisondatum'):
            module.normalize_season({'enabled':True,'start':'31.04.','end':'31.10.'})
    def test_disabled_season_does_not_limit_existing_programs(self):
        season=module.normalize_season(None)
        self.assertFalse(season['enabled']);self.assertTrue(module.in_season(season,at('2026-12-31T12:00').date()))
    def test_non_overlapping_seasonal_sensor_programs_can_share_a_window(self):
        c,s=fixture();climate(c)
        p=deepcopy(c['programs'][0]);p.update(id='summer',kind='sensor',days=list(range(7)),season={'enabled':True,'start':'01.04.','end':'31.10.'})
        p['rides'][0].update(id='summer_active',edge='active')
        q=deepcopy(p);q.update(id='winter',season={'enabled':True,'start':'01.11.','end':'31.03.'});q['rides'][0]['id']='winter_active'
        c['programs']=[p,q]
        e=Engine(c)
        self.assertEqual([r['name'] for r in e.sensors_today(at('2026-10-31T12:00'))],[p['name']])
        self.assertEqual(e.sensors_today(at('2026-11-01T12:00'))[0]['id'],'program:winter')
    def test_overlapping_seasons_still_reject_conflicting_sensor_programs(self):
        c,s=fixture();climate(c)
        p=deepcopy(c['programs'][0]);p.update(id='summer',kind='sensor',season={'enabled':True,'start':'04-01','end':'10-31'})
        p['rides'][0].update(id='summer_active',edge='active')
        q=deepcopy(p);q['id']='overlap';q['rides'][0]['id']='overlap_active'
        q['season']={'enabled':True,'start':'10-31','end':'03-31'}
        c['programs']=[p,q]
        with self.assertRaisesRegex(ValueError,'gleichzeitige'):validate(c)
    def test_local_date_is_used_at_the_season_boundary(self):
        c,s=fixture();climate(c)
        c['windows'][0]['climate'].update(auto_shade=True,season={'enabled':True,'start':'04-01','end':'10-31'})
        e=Engine(c)
        self.assertTrue(e.sensors_today(at('2026-10-31T23:59:59')))
        self.assertFalse(e.sensors_today(at('2026-11-01T00:00:00')))


class SensorSeasonAndPauseTests(unittest.TestCase):
    def setUp(self):
        self.c,self.s=fixture();climate(self.c)
        self.c['programs'][0]['days']=list(range(7))
        self.c['windows'][0]['climate'].update(auto_shade=True,shade_position=0,shade_tilt=100,season={'enabled':False})
        self.s.update({'sensor.lux':{'state':'40000'},'sensor.temp':{'state':'28'}})
        self.now=at('2026-10-30T12:00');self.e=Engine(self.c)
    def manual(self):
        self.c['windows'][0]['climate']['auto_shade']=False
        p=deepcopy(self.c['programs'][0]);p.update(id='sensor',kind='sensor',name='Sommer',days=list(range(7)),season={'enabled':True,'start':'04-01','end':'10-31'})
        p['rides'][0].update(id='sensor_active',edge='active',tilt=100)
        r=deepcopy(p['rides'][0]);r.update(id='sensor_release',edge='inactive',tilt=50);p['rides'].append(r)
        self.c['programs'].append(p);self.e=Engine(self.c)
    def test_auto_outside_season_does_not_shade_or_block_time_program(self):
        self.c['windows'][0]['climate']['season']={'enabled':True,'start':'04-01','end':'10-29'}
        self.e=Engine(self.c);before=at('2026-10-30T06:59:55')
        self.e.tick(before,self.s,solar)
        ready=self.e.tick(before+timedelta(seconds=5),self.s,solar)
        self.assertEqual(ready['w']['kind'],'time');self.assertFalse(self.e.sensors_today(self.now))
    def test_auto_inside_season_shades(self):
        self.c['windows'][0]['climate']['season']={'enabled':True,'start':'04-01','end':'10-31'}
        self.e=Engine(self.c)
        self.assertEqual(self.e.tick(self.now,self.s,solar)['w']['kind'],'sensor')
    def test_pause_cancels_pending_sensor_action_without_a_release_movement(self):
        self.e.tick(self.now,self.s,solar)
        self.e.pause_sensor_today('program:'+AUTO,True,self.now)
        self.assertFalse(self.e.tick(self.now+timedelta(seconds=5),self.s,solar))
        self.assertTrue(self.e.sensors_today(self.now)[0]['paused'])
        self.assertFalse(self.e.rt['shading']['w']['active'])
    def test_time_program_remains_enabled_while_sensor_is_paused(self):
        now=at('2026-10-30T06:59:55');self.e.tick(now,self.s,solar)
        self.e.pause_sensor_today('program:'+AUTO,True,now)
        ready=self.e.tick(now+timedelta(seconds=5),self.s,solar)
        self.assertEqual(ready['w']['kind'],'time')
        self.assertTrue(self.e.config['programs'][0]['enabled'])
    def test_pause_survives_restart_and_expires_at_local_midnight(self):
        self.e.tick(self.now,self.s,solar);self.e.pause_sensor_today('program:'+AUTO,True,self.now)
        self.e=Engine(self.e.config,self.e.rt)
        self.assertFalse(self.e.tick(at('2026-10-30T23:59:59'),self.s,solar))
        self.assertEqual(self.e.tick(at('2026-10-31T00:00:00'),self.s,solar)['w']['kind'],'sensor')
        self.assertFalse(self.e.sensors_today(at('2026-10-31T00:00:00'))[0]['paused'])
    def test_undo_today_reactivates_a_still_high_auto_rule(self):
        self.e.tick(self.now,self.s,solar);self.e.pause_sensor_today('program:'+AUTO,True,self.now)
        self.e.tick(self.now+timedelta(seconds=5),self.s,solar)
        self.e.pause_sensor_today('program:'+AUTO,False,self.now+timedelta(seconds=10))
        self.assertEqual(self.e.tick(self.now+timedelta(seconds=10),self.s,solar)['w']['kind'],'sensor')
    def test_end_of_season_cancels_a_blocked_sensor_goal(self):
        self.c['windows'][0]['climate']['season']={'enabled':True,'start':'04-01','end':'10-31'}
        self.e=Engine(self.c);self.s['binary_sensor.fenster']['state']='on'
        self.e.tick(at('2026-10-31T23:59:55'),self.s,solar)
        self.s['binary_sensor.fenster']['state']='off'
        self.assertFalse(self.e.tick(at('2026-11-01T00:00'),self.s,solar))
        self.assertNotIn('shade',self.e.rt['pending'].get('w',{}))
    def test_no_sensor_programs_are_added_to_time_program_listing(self):
        self.manual();rows=self.e.sensors_today(self.now)
        self.assertEqual([r['id'] for r in rows],['program:sensor'])
    def test_manual_sensor_is_suppressed_for_the_whole_day(self):
        self.manual();self.s['sensor.temp']['state']='20';self.e.tick(self.now,self.s,solar)
        self.e.pause_sensor_today('program:sensor',True,self.now)
        self.s['sensor.temp']['state']='28'
        self.assertFalse(self.e.tick(self.now+timedelta(seconds=5),self.s,solar))
        self.assertFalse(self.e.shading_blocking('w'))
    def test_manual_program_can_resume_at_midnight_after_a_restart(self):
        self.manual();self.e.tick(self.now,self.s,solar)
        self.e.pause_sensor_today('program:sensor',True,self.now)
        self.e=Engine(self.e.config,self.e.rt);self.e.rt['edges']={}
        self.assertEqual(self.e.tick(at('2026-10-31T00:00'),self.s,solar)['w']['ride'],'sensor_active')
    def test_season_entry_does_not_manufacture_a_release_edge(self):
        self.manual();self.s['sensor.temp']['state']='20'
        self.e.tick(at('2026-03-31T23:59:55'),self.s,solar)
        self.assertFalse(self.e.tick(at('2026-04-01T00:00'),self.s,solar))
    def test_today_list_reports_global_pause_without_hiding_rules(self):
        self.e.config['enabled']=False
        row=self.e.sensors_today(self.now)[0]
        self.assertEqual(row['blocked_reason'],'Steuerung ausgeschaltet')
    def test_suspension_uses_calendar_midnight_not_24_hours_at_dst_change(self):
        now=at('2026-10-25T00:30');self.e.pause_sensor_today('program:'+AUTO,True,now)
        row=self.e.sensors_today(now)[0]
        self.assertEqual(datetime.fromisoformat(row['pause_until']),at('2026-10-26T00:00'))
        self.assertTrue(self.e.sensor_paused('program:'+AUTO,at('2026-10-25T23:59')))
        self.assertFalse(self.e.sensor_paused('program:'+AUTO,at('2026-10-26T00:00')))
    def test_inactive_sensor_program_cannot_keep_blocking_a_time_rule(self):
        self.manual();self.e.config['programs'][1]['enabled']=False
        self.e.tick(at('2026-10-30T06:59:55'),self.s,solar)
        ready=self.e.tick(at('2026-10-30T07:00'),self.s,solar)
        self.assertEqual(ready['w']['kind'],'time')


class NamedRuleTests(unittest.TestCase):
    def setUp(self):
        self.c,self.s=fixture();self.now=at('2026-10-30T12:00')
        self.c['windows'][0]['sensor_rules']=[
            {'id':'summer','name':'Sommer','temp_entity':'sensor.temp','lux_entity':'sensor.lux','temp_on':25,'temp_off':23,'lux_on':30000,'lux_off':20000},
            {'id':'winter','name':'Winter','temp_entity':'sensor.temp','temp_on':18,'temp_off':16}]
        self.s.update({'sensor.temp':{'state':'28'},'sensor.lux':{'state':'40000'}})
    def program(self,rule='summer',start='04-01',end='10-31',pid='summer_program'):
        return {'id':pid,'name':pid,'kind':'sensor','enabled':True,'start_on_high':True,'days':list(range(7)),
                'season':{'enabled':True,'start':start,'end':end},'pause_in_vacation':True,'rides':[
                    {'id':pid+'_on','targets':['w'],'sensor_rule':rule,'edge':'active','position':0,'tilt':100},
                    {'id':pid+'_off','targets':['w'],'sensor_rule':rule,'edge':'inactive','position':100,'tilt':50}]}
    def engine(self):
        self.c['programs'].append(self.program());return Engine(self.c)
    def test_parameters_alone_never_drive_or_block_a_time_program(self):
        e=Engine(self.c);e.tick(at('2026-10-30T06:59:55'),self.s,solar)
        self.assertEqual(e.tick(at('2026-10-30T07:00'),self.s,solar)['w']['kind'],'time')
    def test_two_rules_are_stored_by_name_and_do_not_have_seasons(self):
        self.c['windows'][0]['sensor_rules'][0]['season']={'enabled':True,'start':'11-01','end':'03-31'}
        e=self.engine();rules=e.windows()['w']['sensor_rules']
        self.assertEqual([g['name'] for g in rules],['Sommer','Winter']);self.assertNotIn('season',rules[0]);self.assertNotIn('climate',e.windows()['w'])
    def test_default_release_delay_is_300(self):
        self.assertEqual(next(p for p in self.engine().config['programs'] if p['id']=='summer_program')['conditions']['release_delay_seconds'],300)
    def test_selected_rule_controls_activation(self):
        self.s['sensor.temp']['state']='20';e=self.engine();self.assertFalse(e.tick(self.now,self.s,solar))
    def test_different_rules_can_apply_in_disjoint_seasons(self):
        e=self.engine();self.c['programs'].append(self.program('winter','11-01','03-31','winter_program'))
        e=Engine(self.c);self.s['sensor.temp']['state']='20'
        self.assertFalse(e.tick(self.now,self.s,solar))
        self.assertEqual(e.tick(at('2026-11-01T12:00'),self.s,solar)['w']['program'],'winter_program')
    def test_different_rules_cannot_compete_in_overlapping_programs(self):
        self.c['programs']=[self.program(),self.program('winter','04-01','10-31','other')]
        with self.assertRaises(ValueError):Engine(self.c)
    def test_missing_rule_reference_is_rejected(self):
        p=self.program();p['rides'][0]['sensor_rule']='missing';self.c['programs']=[p]
        with self.assertRaises(ValueError):Engine(self.c)
    def test_duplicate_rule_id_is_rejected(self):
        self.c['windows'][0]['sensor_rules'][1]['id']='summer'
        with self.assertRaises(ValueError):Engine(self.c)
    def test_rule_requires_at_least_one_actual_sensor(self):
        self.c['windows'][0]['sensor_rules'][1].pop('temp_entity')
        with self.assertRaises(ValueError):Engine(self.c)
    def test_active_and_release_choose_same_rule_in_program(self):
        p=self.program();p['rides'][1]['sensor_rule']='winter';self.c['programs']=[p]
        with self.assertRaises(ValueError):Engine(self.c)
    def test_both_values_are_required_even_if_import_says_or(self):
        self.c['windows'][0]['sensor_rules'][0]['combination']='or';self.s['sensor.lux']['state']='1000'
        self.assertFalse(self.engine().tick(self.now,self.s,solar))
    def test_release_waits_default_300_seconds(self):
        e=self.engine();job=e.tick(self.now,self.s,solar)['w'];e.finish('w',job,self.now)
        self.s['sensor.temp']['state']='22';e.tick(self.now+timedelta(seconds=5),self.s,solar)
        self.assertFalse(e.tick(self.now+timedelta(seconds=304),self.s,solar))
        self.assertEqual(e.tick(self.now+timedelta(seconds=305),self.s,solar)['w']['ride'],'summer_program_off')
    def test_unused_unavailable_rule_does_not_block_selected_rule(self):
        self.c['windows'][0]['sensor_rules'][1]['temp_entity']='sensor.missing'
        self.assertIn('w',self.engine().tick(self.now,self.s,solar))
    def test_manual_move_is_not_reasserted_while_sensor_stays_high(self):
        e=self.engine();job=e.tick(self.now,self.s,solar)['w'];e.finish('w',job,self.now)
        self.s['cover.wohnen']['attributes']['current_position']=100
        self.assertFalse(e.tick(self.now+timedelta(seconds=5),self.s,solar))
    def test_renaming_rule_does_not_reassert_high_sensor(self):
        e=self.engine();job=e.tick(self.now,self.s,solar)['w'];e.finish('w',job,self.now)
        c=deepcopy(e.config);c['windows'][0]['sensor_rules'][0]['name']='Neuer Name'
        e.replace_config(c,self.now+timedelta(seconds=5));self.assertFalse(e.tick(self.now+timedelta(seconds=5),self.s,solar))
    def test_deleting_referenced_rule_is_rejected(self):
        e=self.engine();c=deepcopy(e.config);c['windows'][0]['sensor_rules'].pop(0)
        with self.assertRaises(ValueError):e.replace_config(c,self.now)
    def test_unit_conversion_fahrenheit_and_klx(self):
        self.s['sensor.temp']={'state':'86','attributes':{'unit_of_measurement':'°F'}}
        self.s['sensor.lux']={'state':'40','attributes':{'unit_of_measurement':'klx'}}
        self.assertIn('w',self.engine().tick(self.now,self.s,solar))
    def test_unsupported_unit_is_not_treated_as_temperature(self):
        self.s['sensor.temp']['attributes']={'unit_of_measurement':'W'}
        self.assertFalse(self.engine().tick(self.now,self.s,solar))
    def test_old_direct_gate_becomes_program_with_validity_and_restore(self):
        c,_=fixture();climate(c);c['windows'][0]['climate'].update(auto_shade=True,season={'enabled':True,'start':'04-01','end':'10-31'},release_delay_seconds=900)
        e=Engine(c);p=next(p for p in e.config['programs'] if p['id']==AUTO)
        self.assertEqual(p['season']['start'],'04-01');self.assertTrue(p['rides'][1]['restore_schedule']);self.assertEqual(p['conditions']['release_delay_seconds'],900)
        self.assertEqual(Engine(e.config).config,e.config)
    def test_expired_release_delay_after_restart_still_restores(self):
        c,_=fixture();climate(c);c['windows'][0]['climate'].update(auto_shade=True,release_delay_seconds=10)
        e=Engine(c);job=e.tick(self.now,self.s,solar)['w'];e.finish('w',job,self.now)
        self.s['sensor.temp']['state']='22';e.tick(self.now+timedelta(seconds=5),self.s,solar)
        restart=Engine(e.config,e.rt);restart.rt['edges']={}
        self.assertEqual(restart.tick(self.now+timedelta(seconds=20),self.s,solar)['w']['ride'],AUTO+'_release')
    def test_pause_resumes_selected_rule_after_midnight(self):
        e=self.engine();e.tick(self.now,self.s,solar);e.pause_sensor_today('program:summer_program',True,self.now)
        self.assertFalse(e.tick(self.now+timedelta(seconds=5),self.s,solar))
        self.assertEqual(e.tick(at('2026-10-31T00:00'),self.s,solar)['w']['program'],'summer_program')


    def test_disabled_legacy_rule_without_goal_remains_disabled(self):
        c,_=fixture();c['windows'][0]['climate']={'temp_entity':'sensor.temp','auto_shade':False,'shade_position':None,'shade_tilt':None}
        e=Engine(c);self.assertFalse(next(p for p in e.config['programs'] if p['id']==AUTO)['enabled'])
    def test_invalid_legacy_switch_is_not_coerced_to_active(self):
        c,_=fixture();c['windows'][0]['climate']={'temp_entity':'sensor.temp','auto_shade':'false'}
        with self.assertRaises(ValueError):Engine(c)
    def test_legacy_manual_rule_keeps_release_timer(self):
        c,_=fixture();climate(c);c['windows'][0]['climate']['release_delay_seconds']=300
        c['programs'][0].update(kind='sensor');c['programs'][0]['rides'][0].update(edge='inactive')
        runtime={'shading':{'w':{'active':True,'low_since':self.now.isoformat(),'before':{'position':100}}}}
        e=Engine(c,runtime);self.s['sensor.temp']['state']='22'
        self.assertFalse(e.tick(self.now+timedelta(seconds=5),self.s,solar))
        self.assertIn('w',e.tick(self.now+timedelta(seconds=300),self.s,solar))

    def test_changing_cover_does_not_reuse_previous_devices_before_position(self):
        e=self.engine();job=e.tick(self.now,self.s,solar)['w'];e.finish('w',job,self.now)
        c=deepcopy(e.config);c['windows'][0]['cover']='cover.new'
        self.s['cover.new']={'state':'open','attributes':{'current_position':60}}
        e.replace_config(c,self.now+timedelta(seconds=5));e.tick(self.now+timedelta(seconds=5),self.s,solar)
        self.assertEqual(e.rt['rule_states']['w:summer_program']['before']['position'],60)

class SensorDisplayNameTests(unittest.TestCase):
    def test_legacy_config_and_alias_backup_round_trip(self):
        c,_=fixture()
        self.assertEqual(validate(c)['sensor_names'],{})
        c['sensor_names']={'sensor.temp':'  Außen Süd  ','binary_sensor.fenster':'Terrassentür'}
        checked=validate(c)
        self.assertEqual(checked['sensor_names']['sensor.temp'],'Außen Süd')
        self.assertEqual(validate(checked),checked)

    def test_invalid_alias_metadata_is_rejected(self):
        for names in ([],{'light.x':'Licht'},{'sensor.temp':''},{'sensor.temp':23},{'sensor.temp':'x'*121}):
            with self.subTest(names=names), self.assertRaises(ValueError):
                c,_=fixture();c['sensor_names']=names;validate(c)

if __name__=='__main__':unittest.main()
