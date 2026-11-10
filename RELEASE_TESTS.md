# Release verification: Shutter Manager 1.5.3

Verified on 2026-11-10. Pre-release validation passed: https://github.com/v9h45n47mh-lab/shutter-manager/actions/runs/42878619683 . Publication also requires the same checks to pass for the exact release commit.

- PASS: all 303 Python tests, JavaScript syntax, pinned UI/checksum checks and sensor selection.
- PASS: all seven application browser flows: UI Kit integration, isolated component layout, general UI, save/reload, Settings, shading and status/history.
- PASS: all 16 upstream HA UI Kit unit tests, browser suite, catalogue/gallery suite and dedicated program-row suite; reproducible build and vendoring checks.
- PASS: HACS and Hassfest.
- PASS: both release archives, metadata, CRC, source-byte checks and the exclusive rollladenplaner integration path.

HA UI Kit 1.2.2 is pinned to commit 6e398ba9415ed5a0b64e9703d11ab935ee7ea47d. Its original JS, CSS, checksum manifest and license are shipped unchanged. Static checks reject local shared-selector, typography, color and symbol overrides. All application CSS and movement logic remain unchanged from 1.5.2; the alignment correction comes exclusively from the updated kit.

The program-layout comparison uses an independent ShadowRoot containing only UI Kit styles and renderers. All 24 light/dark, 320/390/1100 px, collapsed/expanded and admin/user combinations passed. It compares navigation, program groups/rows, actions, typography, indentation, spacing, borders, controls and relative geometry. The actual production card additionally passes explicit assertions that program-title text, metadata and action text share the 28 px indent. Upstream tests verify that general icon buttons retain their normal spacing.

Fields, select fields, selection lists, Settings text and native dialogs are compared against an isolated UI Kit reference in both themes. The artifact contains 52 screenshot/measurement files. Program comparisons at desktop/mobile widths, long titles, non-admin controls, selection lists and native dialogs were visually inspected in light and dark themes. No overflow or clipping was observed in those views.

Functional coverage preserves program/action folds, ordering, editors, save/reload, error/retry, sensor selection/renaming, retained drafts, imports, contact protection, one-time movements and read-only/control permissions. German and English Help describe the shared alignment and current behavior.

The movement engine is unchanged, configuration protocol remains 7 and the tilt-to-height delay remains 1.5 seconds. Home Assistant I/O is simulated; no physical actuators are operated. Internal test references and screenshots are excluded from the release archives.

After installation, restart Home Assistant Core and reload the browser/app. Settings and Help show card/integration 1.5.3 and UI 1.2.2.
