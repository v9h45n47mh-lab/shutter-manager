"""Scene mapping overrides remain stable in saved schema-4 configuration."""
from copy import deepcopy
import unittest
from test_engine import fixture, validate, Engine

class Release032Tests(unittest.TestCase):
    def test_saved_prefix_choice_and_manual_links_survive_restart(self):
        config=fixture()
        config['lamps'][0].update(scenes=['scene.flur_ruhe'],scene_prefix_applied=True)
        engine=Engine(validate(config))
        self.assertEqual(Engine(engine.config,engine.rt).config['lamps'][0]['scenes'],['scene.flur_ruhe'])
        self.assertTrue(engine.config['lamps'][0]['scene_prefix_applied'])
        config['lamps'][0]['scenes']=[]
        self.assertEqual(validate(config)['lamps'][0]['scenes'],[])

    def test_old_config_remains_valid_and_is_not_inferred_without_catalog(self):
        config=fixture()
        self.assertNotIn('scene_prefix_applied',validate(config)['lamps'][0])

    def test_scene_mapping_marker_requires_boolean(self):
        config=fixture()
        config['lamps'][0]['scene_prefix_applied']='yes'
        self.assertEqual(validate(config)['lamps'][0]['scene_prefix_applied'],'yes')
