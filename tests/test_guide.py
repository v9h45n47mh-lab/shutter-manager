"""Keep the embedded guide aligned with one-time movement behavior."""
from pathlib import Path
import unittest

SOURCE = (Path(__file__).resolve().parents[1] / "custom_components/rollladenplaner/frontend/shutter-manager-card.js").read_text()


class GuideTests(unittest.TestCase):
    def test_both_guides_document_one_time_movements(self):
        self.assertIn("Einzelfahrten", SOURCE)
        self.assertIn("One-time movements", SOURCE)
        self.assertIn("erzeugt kein gespeichertes Programm", SOURCE)
        self.assertIn("does not create a saved program", SOURCE)
        self.assertIn("bleibt sie sichtbar", SOURCE)
        self.assertIn("stays visible", SOURCE)
        self.assertIn("Lamellen sind nur bei Jalousien verfügbar", SOURCE)
        self.assertIn("tilt is available only for blinds", SOURCE)

    def test_current_status_is_collapsible_and_guide_describes_execution_order(self):
        self.assertIn('data-action="toggle-cover-status"', SOURCE)
        self.assertIn('current status section in Settings can be collapsed', SOURCE)
        self.assertIn('commands tilt first, waits three seconds', SOURCE)
        self.assertIn('waits three seconds', SOURCE)
