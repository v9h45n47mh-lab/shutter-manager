"""Strict scene names and safe migration of older manual scene assignments."""
from copy import deepcopy
import unittest
from test_engine import m, Engine, validate, fixture, program, action, lamp, state, at, deliver

class Release033Tests(unittest.TestCase):
    def test_exact_full_prefix_including_underscores_and_nonempty_suffix(self):
        for scene in ['scene.badezimmer_badezimmer_nachtlicht','scene.badezimmer_badezimmer_hell']:
            self.assertTrue(m.scene_matches('light.badezimmer_badezimmer',scene))
        for scene in ['scene.badezimmer_nachtlicht','scene.badezimmer_badezimmerx_hell','scene.badezimmer_badezimmer_','scene.other_hell','light.badezimmer_badezimmer_hell']:
            self.assertFalse(m.scene_matches('light.badezimmer_badezimmer',scene))

    def test_invalid_link_is_rejected_even_when_not_used_in_a_program(self):
        config=fixture();config['lamps'][0]['scenes']=['scene.other_hell']
        validate(config)  # Retired settings are ignored in 0.4.0.

    def test_unselected_matching_scene_cannot_be_enabled_in_a_program(self):
        config=fixture(program('p','time',[action(mode='scene',scene='scene.flur_nachtlicht')]))
        config['lamps'][0]['scenes']=['scene.flur_hell']
        validate(config)  # Automatic matching no longer needs a manual link.

    def test_room_zone_and_direct_targets_activate_only_selected_matching_scenes(self):
        for target in ['l','room','zone']:
            with self.subTest(target=target):
                config=fixture(program('p','time',[action(mode='scene',scene='scene.flur_nachtlicht',targets=[target],time='17:00')]))
                config['rooms']=[{'id':'room','name':'Room'}];config['zones']=[{'id':'zone','name':'Zone'}]
                config['lamps'][0].update(scenes=['scene.flur_nachtlicht'],rooms=['room'],zones=['zone'])
                commands=Engine(config).plan(at('2026-11-02T17:00:00'),{'light.flur':state('off'),'scene.flur_nachtlicht':state('unknown',entity_id=['light.other'])})
                self.assertEqual(commands[0]['action']['scene'],'scene.flur_nachtlicht')

    def test_migration_keeps_links_and_disables_only_orphan_actions(self):
        config=fixture(program('p','time',[action('valid',mode='scene',scene='scene.flur_hell'),action('bad',mode='scene',scene='scene.other_night'),action('normal',mode='on')]))
        config['lamps'][0]['scenes']=['scene.flur_hell','scene.other_night']
        original=deepcopy(config)
        cleaned,removed,disabled=m.restrict_scene_config(config)
        self.assertEqual(config,original)
        self.assertEqual((removed,disabled),(1,1))
        self.assertEqual(cleaned['lamps'][0]['scenes'],['scene.flur_hell'])
        self.assertEqual([a['enabled'] for a in cleaned['programs'][0]['actions']],[True,False,True])
        self.assertEqual(cleaned['programs'][0]['actions'][1]['scene'],'scene.other_night')
        self.assertEqual(m.restrict_scene_config(cleaned),(cleaned,0,0))
        validate(cleaned)
        commands=Engine(cleaned).plan(at('2026-11-02T18:00:00'),{'light.flur':state('off')})
        self.assertFalse(any(c['action'].get('scene')=='scene.other_night' for c in commands))

    def test_invalid_disabled_scene_cannot_be_reenabled(self):
        config=fixture(program('p','time',[action(mode='scene',scene='scene.other_night',enabled=False)]))
        validate(config)
        config['programs'][0]['actions'][0]['enabled']=True
        with self.assertRaisesRegex(ValueError,'verknüpfte'):validate(config)

    def test_active_legacy_contact_scene_releases_without_replaying_invalid_scene(self):
        config=fixture(program('p','contact',[action(mode='scene',scene='scene.flur_night',end_action='restore',delay=0)]))
        config['lamps'][0]['scenes']=['scene.flur_night']
        engine=Engine(config)
        # Recreate a previously valid 0.3.2 mapping and its active runtime snapshot.
        engine.config['lamps'][0]['scenes']=['scene.other_night']

        states={'light.flur':state('on',brightness=51),'binary_sensor.tuer':state('on')}
        now=at('2026-11-02T18:00:00')
        deliver(engine,engine.plan(now,states),states)
        states['light.flur']=state('on',brightness=204)
        engine.config['programs'][0]['actions'][0]['scene']='scene.other_night'
        cleaned,_,disabled=m.restrict_scene_config(engine.config)
        self.assertEqual(disabled,1)
        restarted=Engine(cleaned,engine.rt)
        commands=restarted.plan(now,states)
        self.assertEqual(len(commands),1)
        self.assertTrue(commands[0]['release'])
        self.assertEqual(commands[0]['action'],{'mode':'on','brightness':20.0})
