# Release verification: Shutter Manager 1.5.2

Verified on 2026-11-10. Pre-release validation passed: https://github.com/v9h45n47mh-lab/shutter-manager/actions/runs/42870907075 . Publication is also gated on the complete checks for the exact release commit.

- PASS: all 303 Python tests, JavaScript syntax, pinned UI/checksum checks and sensor-selection checks.
- PASS: seven application browser flows: UI Kit integration, isolated component layout, general UI, save/reload, Settings, shading and status/history.
- PASS: all 16 upstream HA UI Kit unit tests, browser suite, catalogue/gallery suite and dedicated program-row suite; reproducible build and vendoring checks.
- PASS: HACS and Hassfest.
- PASS: release metadata and both ZIP archives, CRC, exclusive integration path and source-byte verification.

The pinned HA UI Kit 1.2.1 commit is 78324b4f971b96ec198647a0ac08fcde1a0073d8. The program-layout flow creates an independent ShadowRoot containing only the unmodified UI Kit CSS and renderers. All 24 combinations of light/dark, 320/390/1100 px, collapsed/expanded and admin/non-admin passed. Navigation, program groups, rows, actions, fonts, weight, line height, indentation, padding, gaps, borders, switch/edit/sort/copy controls and relative geometry match the reference. Static guards reject local shared-component selectors, typography and color overrides.

The common-control flow compares Settings list text, input/select fields and native dialog sections with a separate UI-only ShadowRoot. Desktop/mobile program comparisons, Settings and native dialogs in both themes were visually inspected. Workflow artifacts contain 50 screenshots/measurement files. The final release run additionally records selection-list comparisons and screenshots in both themes.

Functional coverage includes program and action folds, mobile controls, ordering, editing, save/reload, error/retry, sensor selection/renaming, retained drafts, imports, contact protection, one-time movements and read-only/control permissions. German and English Help describe the shared design and current behavior.

The movement engine is unchanged, configuration protocol remains 7 and the tilt-to-height delay remains 1.5 seconds. All Home Assistant I/O is simulated; no physical actuators are operated. The installation path remains custom_components/rollladenplaner. Internal test references and screenshots are excluded from both release archives.

After installation, restart Home Assistant Core and reload the browser/app. Settings and Help show card/integration 1.5.2 and UI 1.2.1.
