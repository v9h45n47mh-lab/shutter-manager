"""Program-owned shading, independent device evaluation, and legacy migration."""
from copy import deepcopy
from datetime import timedelta
import unittest
from test_engine import Engine, validate, fixture, at, solar


def shading_fixture():
    config, states = fixture()
    config['windows'][0]['contacts'] = []
    config['windows'][0]['sensor_rules'] = [{'id':'main','name':'Süd','lux_entity':'sensor.south','temp_entity':'sensor.temp'}]
    config['windows'].append({'id':'east','name':'Ost','cover':'cover.east','contacts':[],
        'sensor_rules':[{'id':'main','name':'Ost','lux_entity':'sensor.east','temp_entity':'sensor.east_temp'}]})
    program = {'id':'shade','name':'Sommerbeschattung','kind':'sensor','sensor_mode':'climate','enabled':True,
        'pause_in_vacation':True,'days':list(range(7)),'start_on_high':True,'start':'00:00','end':'00:00',
        'end_action':'restore','conditions':{'mode':'both','lux_on':30000,'lux_off':20000,'temp_on':25,'temp_off':23,
            'on_delay_seconds':0,'release_delay_seconds':10},'rides':[]}
    for wid in ['w','east']:
        for edge in ['active','inactive']:
            program['rides'].append({'id':wid+'_'+edge,'targets':[wid],'sensor_rule':'main','edge':edge,
                'position':20 if edge=='active' else None,'tilt':None})
    config['programs'] = [program]
    states.update({'cover.east':{'state':'open','attributes':{'current_position':65}},
        'sensor.south':{'state':'40000'},'sensor.east':{'state':'10000'},
        'sensor.temp':{'state':'28'},'sensor.east_temp':{'state':'28'}})
    return config, states


class ShadingProgramTests(unittest.TestCase):
    def setUp(self):
        self.config,self.states=shading_fixture()
        self.program=self.config['programs'][0]
        self.now=at('2026-10-30T12:00')
    def test_model_round_trip_has_only_assignments_on_covers(self):
        checked=validate(self.config)
        self.assertEqual(checked,validate(checked))
        self.assertEqual(set(checked['windows'][0]['sensor_rules'][0]),{'id','name','lux_entity','temp_entity'})
        self.assertEqual(checked['programs'][0]['targets'],['w','east'])
        self.assertEqual(checked['programs'][0]['conditions']['lux_on'],30000)
    def test_shared_thresholds_evaluate_each_device_independently(self):
        engine=Engine(self.config)
        jobs=engine.tick(self.now,self.states,solar)
        self.assertEqual(set(jobs),{'w'})
        engine.finish('w',jobs['w'],self.now)
        self.states['sensor.east']['state']='40000'
        self.assertEqual(set(engine.tick(self.now+timedelta(seconds=5),self.states,solar)),{'east'})
    def test_one_missing_sensor_does_not_block_the_other_device(self):
        self.states['sensor.east']['state']='unavailable'
        self.assertEqual(set(Engine(self.config).tick(self.now,self.states,solar)),{'w'})
    def test_program_mode_ignores_unselected_temperature_axis(self):
        self.program['conditions']['mode']='lux';self.states['sensor.temp']['state']='unavailable'
        self.assertIn('w',Engine(self.config).tick(self.now,self.states,solar))
    def test_required_sensor_is_not_silently_borrowed(self):
        del self.config['windows'][1]['sensor_rules'][0]['temp_entity']
        with self.assertRaisesRegex(ValueError,'fehlen Sensoren'):validate(self.config)
    def test_activation_delay_restarts_after_a_low_or_missing_reading(self):
        self.program['conditions']['on_delay_seconds']=20
        engine=Engine(self.config)
        self.assertFalse(engine.tick(self.now,self.states,solar))
        self.states['sensor.south']['state']='unknown'
        engine.tick(self.now+timedelta(seconds=15),self.states,solar)
        self.states['sensor.south']['state']='40000'
        self.assertFalse(engine.tick(self.now+timedelta(seconds=20),self.states,solar))
        self.assertFalse(engine.tick(self.now+timedelta(seconds=39),self.states,solar))
        self.assertIn('w',engine.tick(self.now+timedelta(seconds=40),self.states,solar))
    def test_activation_timer_and_before_position_survive_restart(self):
        self.program['conditions']['on_delay_seconds']=20
        engine=Engine(self.config);engine.tick(self.now,self.states,solar)
        engine=Engine(engine.config,engine.rt)
        job=engine.tick(self.now+timedelta(seconds=20),self.states,solar)['w']
        engine.finish('w',job,self.now+timedelta(seconds=20))
        self.assertEqual(engine.rt['rule_states']['w:shade']['before']['position'],100)
    def test_either_lower_threshold_releases_after_shared_delay(self):
        engine=Engine(self.config);job=engine.tick(self.now,self.states,solar)['w'];engine.finish('w',job,self.now)
        self.states['sensor.temp']['state']='22'
        self.assertFalse(engine.tick(self.now+timedelta(seconds=5),self.states,solar))
        release=engine.tick(self.now+timedelta(seconds=15),self.states,solar)['w']
        self.assertEqual(release['position'],100)
    def test_restore_uses_original_position_instead_of_current_schedule(self):
        original,_=fixture();original['programs'][0]['rides'][0].update(position=42)
        self.config['programs'].append(original['programs'][0])
        engine=Engine(self.config);job=engine.tick(self.now,self.states,solar)['w'];engine.finish('w',job,self.now)
        self.states['sensor.temp']['state']='22';engine.tick(self.now+timedelta(seconds=5),self.states,solar)
        self.assertEqual(engine.tick(self.now+timedelta(seconds=15),self.states,solar)['w']['position'],100)
    def test_schedule_end_action_uses_applicable_schedule(self):
        self.program['end_action']='schedule'
        original,_=fixture();original['programs'][0]['rides'][0].update(position=42)
        self.config['programs'].append(original['programs'][0])
        engine=Engine(self.config);job=engine.tick(self.now,self.states,solar)['w'];engine.finish('w',job,self.now)
        self.states['sensor.temp']['state']='22';engine.tick(self.now+timedelta(seconds=5),self.states,solar)
        self.assertEqual(engine.tick(self.now+timedelta(seconds=15),self.states,solar)['w']['position'],42)
    def test_fixed_end_action_uses_per_device_return_position(self):
        self.program['end_action']='fixed'
        for ride in self.program['rides']:
            if ride['edge']=='inactive':ride['position']=77
        engine=Engine(self.config);job=engine.tick(self.now,self.states,solar)['w'];engine.finish('w',job,self.now)
        self.states['sensor.temp']['state']='22';engine.tick(self.now+timedelta(seconds=5),self.states,solar)
        self.assertEqual(engine.tick(self.now+timedelta(seconds=15),self.states,solar)['w']['position'],77)
    def test_keep_end_action_has_no_return(self):
        self.program['end_action']='keep';self.program['rides']=[r for r in self.program['rides'] if r['edge']=='active']
        engine=Engine(self.config);job=engine.tick(self.now,self.states,solar)['w'];engine.finish('w',job,self.now)
        self.states['sensor.temp']['state']='22';engine.tick(self.now+timedelta(seconds=5),self.states,solar)
        self.assertFalse(engine.tick(self.now+timedelta(seconds=15),self.states,solar))
    def test_window_end_returns_after_confirmed_shading(self):
        self.program.update(start='10:00',end='13:00')
        engine=Engine(self.config);job=engine.tick(self.now,self.states,solar)['w'];engine.finish('w',job,self.now)
        release=engine.tick(at('2026-10-30T13:00'),self.states,solar)['w']
        self.assertTrue(release['end_of_program']);self.assertEqual(release['position'],100)
    def test_unexecuted_shading_does_not_move_on_window_exit(self):
        self.program.update(start='10:00',end='13:00')
        self.config['windows'][0]['contacts']=[{'entity':'binary_sensor.fenster','policy':'defer','open_state':'on'}]
        self.states['binary_sensor.fenster']['state']='on'
        engine=Engine(self.config);self.assertFalse(engine.tick(self.now,self.states,solar))
        self.states['binary_sensor.fenster']['state']='off'
        self.assertFalse(engine.tick(at('2026-10-30T13:00'),self.states,solar))
    def test_window_end_return_keeps_contact_protection(self):
        self.program.update(start='10:00',end='13:00')
        self.config['windows'][0]['contacts']=[{'entity':'binary_sensor.fenster','policy':'defer','open_state':'on'}]
        engine=Engine(self.config);job=engine.tick(self.now,self.states,solar)['w'];engine.finish('w',job,self.now)
        self.states['binary_sensor.fenster']['state']='on'
        self.assertFalse(engine.tick(at('2026-10-30T13:00'),self.states,solar))
        engine=Engine(engine.config,engine.rt)
        self.states['binary_sensor.fenster']['state']='off'
        self.assertEqual(engine.tick(at('2026-10-30T13:05'),self.states,solar)['w']['position'],100)
    def test_daily_pause_does_not_issue_a_return(self):
        engine=Engine(self.config);job=engine.tick(self.now,self.states,solar)['w'];engine.finish('w',job,self.now)
        engine.pause_sensor_today('program:shade',True,self.now)
        self.assertFalse(engine.tick(self.now+timedelta(seconds=5),self.states,solar))
    def test_overnight_window_uses_start_weekday_and_season(self):
        self.program.update(start='22:00',end='06:00',days=[5],season={'enabled':True,'start':'10-31','end':'10-31'})
        engine=Engine(self.config)
        self.assertIn('w',engine.tick(at('2026-11-01T02:00'),self.states,solar))
        self.assertFalse(engine.eligible(engine.config['programs'][0],at('2026-11-01T06:00')))
    def test_different_daily_windows_can_use_different_thresholds(self):
        self.program.update(start='08:00',end='12:00')
        second=deepcopy(self.program);second.update(id='afternoon',start='12:00',end='18:00')
        for r in second['rides']:r['id']='afternoon_'+r['id']
        second['conditions']['lux_on']=50000;self.config['programs'].append(second)
        self.assertEqual(len(validate(self.config)['programs']),2)
    def test_overlapping_windows_are_rejected_even_with_same_binding(self):
        second=deepcopy(self.program);second['id']='other'
        for r in second['rides']:r['id']='other_'+r['id']
        self.config['programs'].append(second)
        with self.assertRaisesRegex(ValueError,'gleichzeitige'):validate(self.config)
    def test_overnight_overlap_crosses_weekday_and_year_boundary(self):
        self.program.update(start='22:00',end='06:00',days=[3],season={'enabled':True,'start':'12-31','end':'12-31'})
        second=deepcopy(self.program);second.update(id='newyear',start='04:00',end='08:00',days=[4],season={'enabled':True,'start':'01-01','end':'01-01'})
        for r in second['rides']:r['id']='other_'+r['id']
        self.config['programs'].append(second)
        with self.assertRaisesRegex(ValueError,'gleichzeitige'):validate(self.config)
    def test_disabled_program_does_not_conflict(self):
        second=deepcopy(self.program);second.update(id='other',enabled=False)
        for r in second['rides']:r['id']='other_'+r['id']
        self.config['programs'].append(second)
        self.assertEqual(len(validate(self.config)['programs']),2)

    def test_disabled_actions_neither_crash_nor_block_schedules(self):
        for r in self.program['rides']:r['enabled']=False
        engine=Engine(self.config)
        self.assertFalse(engine.tick(self.now,self.states,solar))
        self.assertFalse(engine.shading_blocking('w'))

    def test_delayed_activation_resumes_without_start_on_high(self):
        self.program['start_on_high']=False;self.program['conditions']['on_delay_seconds']=20
        engine=Engine(self.config);engine.tick(self.now,self.states,solar)
        engine=Engine(engine.config,engine.rt);engine.rt['edges']={}
        self.assertIn('w',engine.tick(self.now+timedelta(seconds=20),self.states,solar))

    def test_release_timer_resumes_without_start_on_high(self):
        self.program['start_on_high']=False
        engine=Engine(self.config)
        self.states['sensor.south']['state']='10000';engine.tick(self.now,self.states,solar)
        self.states['sensor.south']['state']='40000'
        job=engine.tick(self.now+timedelta(seconds=5),self.states,solar)['w'];engine.finish('w',job,self.now)
        self.states['sensor.south']['state']='10000';engine.tick(self.now+timedelta(seconds=10),self.states,solar)
        engine=Engine(engine.config,engine.rt);engine.rt['edges']={}
        self.assertEqual(engine.tick(self.now+timedelta(seconds=20),self.states,solar)['w']['position'],100)

    def test_overnight_program_is_visible_and_pausable_after_midnight(self):
        self.program.update(start='22:00',end='06:00',days=[5],season={'enabled':True,'start':'10-31','end':'10-31'})
        engine=Engine(self.config);now=at('2026-11-01T02:00')
        row=engine.sensors_today(now)[0];self.assertEqual(row['id'],'program:shade');self.assertFalse(row['blocked_reason'])
        engine.pause_sensor_today(row['id'],True,now)
        self.assertTrue(engine.sensors_today(now)[0]['paused'])

    def test_shutter_restore_never_creates_a_tilt_command(self):
        self.config['windows'][0]['cover_type']='shutter'
        self.states['cover.wohnen']['attributes']['current_tilt_position']=50
        engine=Engine(self.config);job=engine.tick(self.now,self.states,solar)['w'];engine.finish('w',job,self.now)
        self.states['sensor.temp']['state']='22';engine.tick(self.now+timedelta(seconds=5),self.states,solar)
        release=engine.tick(self.now+timedelta(seconds=15),self.states,solar)['w']
        self.assertEqual(release['position'],100);self.assertIsNone(release['tilt'])

    def test_unknown_before_position_is_not_used_as_a_return_goal(self):
        self.states['cover.wohnen']['attributes']['current_position']=float('nan')
        engine=Engine(self.config);job=engine.tick(self.now,self.states,solar)['w'];engine.finish('w',job,self.now)
        self.states['sensor.temp']['state']='22';engine.tick(self.now+timedelta(seconds=5),self.states,solar)
        self.assertFalse(engine.tick(self.now+timedelta(seconds=15),self.states,solar))
        self.assertEqual(engine.rt['history'][0]['kind'],'error')


class MigrationTests(unittest.TestCase):
    def legacy(self):
        config,states=shading_fixture();p=config['programs'][0]
        for key in ('conditions','start','end','end_action'):p.pop(key)
        for index,w in enumerate(config['windows']):
            w['sensor_rules'][0].update(lux_on=30000+index*10000,lux_off=20000,temp_on=25,temp_off=23,release_delay_seconds=30+index*15)
        for r in p['rides']:
            if r['edge']=='inactive':r.update(position=100,restore_schedule=True)
        return config,states
    def test_incompatible_legacy_conditions_split_without_losing_actions(self):
        config,states=self.legacy();engine=Engine(config)
        self.assertEqual(len(engine.config['programs']),2)
        self.assertEqual({p['conditions']['lux_on'] for p in engine.config['programs']},{30000,40000})
        self.assertEqual({p['conditions']['release_delay_seconds'] for p in engine.config['programs']},{30,45})
        self.assertEqual({r['id'] for p in engine.config['programs'] for r in p['rides']},{'w_active','w_inactive','east_active','east_inactive'})
        self.assertEqual(Engine(engine.config).config,engine.config)
    def test_equal_legacy_thresholds_stay_in_one_program(self):
        config,states=self.legacy()
        for w in config['windows']:w['sensor_rules'][0].update(lux_on=30000,release_delay_seconds=30)
        self.assertEqual(len(Engine(config).config['programs']),1)
    def test_split_preserves_pending_jobs_state_and_daily_pause(self):
        config,states=self.legacy();now=at('2026-10-30T12:00')
        runtime={'rule_states':{'east:main':{'active':True,'low_since':now.isoformat(),'before':{'position':65}}},
            'sensor_pauses':{'program:shade':'2026-10-30'},'pending':{'east':{'sensor':{
                'id':'old','program':'shade','kind':'sensor','ride':'east_active','window':'east','sensor_rule':'main'}}}}
        engine=Engine(config,runtime)
        migrated=next(p for p in engine.config['programs'] if p['targets']==['east'])
        self.assertEqual(engine.rt['pending']['east']['sensor']['program'],migrated['id'])
        self.assertEqual(engine.rt['sensor_pauses']['program:'+migrated['id']],'2026-10-30')
        self.assertEqual(engine.rt['rule_states']['east:'+migrated['id']]['before']['position'],65)
    def test_unused_rule_parameters_are_retained_in_disabled_program(self):
        config,states=self.legacy();config['programs']=[]
        engine=Engine(config)
        self.assertEqual(len(engine.config['programs']),2)
        self.assertTrue(all(not p['enabled'] for p in engine.config['programs']))
        self.assertEqual(Engine(engine.config).config,engine.config)
    def test_migration_preserves_multiple_sensor_associations(self):
        config,states=self.legacy();extra=deepcopy(config['windows'][0]['sensor_rules'][0]);extra.update(id='winter',name='Winter',lux_entity='sensor.winter',lux_on=12000,lux_off=8000)
        config['windows'][0]['sensor_rules'].append(extra)
        engine=Engine(config)
        self.assertEqual({g['id'] for g in engine.windows()['w']['sensor_rules']},{'main','winter'})
        self.assertIn(12000,{p['conditions']['lux_on'] for p in engine.config['programs']})
