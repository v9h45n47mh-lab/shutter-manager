"""Automatic common scenes and date-bound one-time schedules."""
import unittest
from test_engine import Engine,validate,fixture,program,action,lamp,state,at,deliver
class Release040Tests(unittest.TestCase):
 def test_automatic_scene_without_settings_and_mixed_targets_rejected(self):
  c=fixture(program('p','time',[action(mode='scene',scene='scene.flur_night')]))
  validate(c)
  c['lamps'].append(lamp('other','light.other'))
  c['programs'][0]['actions'][0]['targets'].append('other')
  with self.assertRaises(ValueError):validate(c)
 def test_matching_room_scene_without_links(self):
  c=fixture(program('p','time',[action(mode='scene',scene='scene.flur_night',targets=['room'])]))
  c['rooms']=[{'id':'room','name':'Room'}];c['lamps'][0]['rooms']=['room']
  self.assertEqual(Engine(c).plan(at('2026-11-02T18:00:00'),{'light.flur':state('off')})[0]['action']['scene'],'scene.flur_night')
 def test_once_no_early_run_no_replay_after_restart_and_no_next_day(self):
  c=fixture(program('p','time',[action()],once_date='2026-11-02'))
  e=Engine(c,tz='UTC');states={'light.flur':state('off')}
  self.assertEqual(e.plan(at('2026-11-02T17:59:00'),states),[])
  commands=e.plan(at('2026-11-02T18:00:00'),states);self.assertEqual(len(commands),1);deliver(e,commands,states)
  e=Engine(e.config,e.rt,tz='UTC');self.assertEqual(e.plan(at('2026-11-02T19:00:00'),states),[])
  self.assertFalse(any(not c['release'] for c in e.plan(at('2026-11-03T18:00:00'),states)))
  self.assertEqual(e.planned,[])
 def test_once_rejects_sensor_and_solar(self):
  for kind,event in [('contact','fixed'),('time','sunset')]:
   with self.subTest(kind=kind):
    with self.assertRaises(ValueError):validate(fixture(program('p',kind,[action(event=event)],once_date='2026-11-02')))
