# Release verification: Shutter Manager 1.5.3

Prepared on 2026-11-10. Publication requires the complete Python suite, all seven application browser flows, upstream UI Kit unit/browser/gallery/program-row suites, HACS and Hassfest to pass for the exact release commit.

HA UI Kit 1.2.2 is pinned to commit 6e398ba9415ed5a0b64e9703d11ab935ee7ea47d. Its original JS, CSS, checksum manifest and license are shipped unchanged. Static checks reject local shared-selector, typography, color and symbol overrides.

The program-layout comparison uses an independent ShadowRoot containing only the UI Kit styles and renderers. It compares navigation, program groups/rows, actions and common controls across 24 light/dark, 320/390/1100 px, collapsed/expanded and admin/user combinations. An additional assertion measures the actual program-title text, metadata and action text against the shared 28 px indent. General icon-button spacing remains covered by upstream tests. Fields, select fields, selection lists, Settings text and native dialogs are compared against an isolated UI Kit reference in both themes. Screenshots and measurements are retained as workflow artifacts.

The movement engine is unchanged, protocol remains 7 and the tilt-to-height delay remains 1.5 seconds. Home Assistant I/O is simulated; no physical actuators are operated. Release archives are checked for metadata, CRC, source bytes and the exclusive rollladenplaner integration path. Internal test references/screenshots are excluded.

After installation, restart Home Assistant Core and reload the browser/app. Settings and Help show card/integration 1.5.3 and UI 1.2.2.
