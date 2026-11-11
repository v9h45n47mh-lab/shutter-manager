"""Keep the embedded guide aligned with one-time movement behavior."""
from pathlib import Path
import json
import re
import unittest

SOURCE = (Path(__file__).resolve().parents[1] / "custom_components/rollladenplaner/frontend/shutter-manager-card.js").read_text()


class GuideTests(unittest.TestCase):
    def test_both_embedded_guides_match_the_manifest_release(self):
        root = Path(__file__).resolve().parents[1]
        version = json.loads((root / 'custom_components/rollladenplaner/manifest.json').read_text())['version']
        for name in ('HOWTO_HTML', 'HOWTO_HTML_EN'):
            guide = json.loads(re.search(r'^const '+name+r' = (.*);$', SOURCE, re.M)[1])
            self.assertIn('Shutter Manager '+version, guide)
        self.assertIn('Shutter Manager '+version, (root / 'HOWTO.md').read_text())

    def test_guides_explain_program_owned_conditions_and_migration(self):
        self.assertIn('Gemeinsame Schwellenwerte, Verzögerungen, Gültigkeit und Fahrziele werden im Programm gepflegt', SOURCE)
        self.assertIn('Cover settings contain sensor assignments and contacts only', SOURCE)
        self.assertIn('independently against its own assigned sensors', SOURCE)
        self.assertIn('migration_backup', SOURCE)

    def test_both_guides_document_one_time_movements(self):
        self.assertIn("Einzelfahrten", SOURCE)
        self.assertIn("One-time movements", SOURCE)
        self.assertIn("erzeugt kein gespeichertes Programm", SOURCE)
        self.assertIn("does not create a saved program", SOURCE)
        self.assertIn("bleibt sie sichtbar", SOURCE)
        self.assertIn("stays visible", SOURCE)
        self.assertIn("Lamellen sind nur bei Jalousien verfügbar", SOURCE)
        self.assertIn("tilt is available only for blinds", SOURCE)

    def test_all_settings_sections_are_collapsible_and_guide_describes_execution_order(self):
        self.assertIn('data-action="toggle-settings-section"', SOURCE)
        for section in ("covers", "sensors", "status", "daily-history"):
            self.assertIn(f"'{section}'", SOURCE)
        self.assertIn('sections in Settings can be collapsed independently', SOURCE)
        self.assertIn('clickable headings and chevrons', SOURCE)
        self.assertIn('use the pencil beside a selected sensor', SOURCE)
        self.assertIn('über ihr Stiftsymbol umbenennen', SOURCE)
        self.assertIn("settingsSectionVisible(section)", SOURCE)
        self.assertIn(":settings:'+section", SOURCE)
        self.assertIn('commands tilt first, waits 2.0 seconds', SOURCE)
        self.assertIn('nach erfolgreichem Serviceaufruf 2,0 Sekunden', SOURCE)
        self.assertIn('Vacation mode is controlled only in Settings', SOURCE)
        self.assertIn('Der Urlaubsmodus wird ausschließlich in den Einstellungen geschaltet', SOURCE)
        self.assertNotIn('toggle-vacation-filter', SOURCE)
        self.assertIn('ohne lokale CSS-Überschreibungen', SOURCE)
        self.assertIn('without local CSS overrides', SOURCE)
        self.assertIn('gemeinsamen Einrückung von 28 px', SOURCE)
        self.assertIn('shared 28 px indent', SOURCE)
        self.assertIn('A dedicated timer triggers this handoff', SOURCE)
        self.assertIn('Ein eigener Timer löst diesen Übergang', SOURCE)
