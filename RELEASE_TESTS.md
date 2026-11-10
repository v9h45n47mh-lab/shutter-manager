# Release verification: Shutter Manager 1.5.1

Verified on 2026-11-10. The pre-release validation run passed: https://github.com/v9h45n47mh-lab/shutter-manager/actions/runs/42865492680 . Publication also requires the same checks to pass on the exact release commit.

- PASS: all 303 Python tests, JavaScript syntax, shared UI checks and sensor-selection checks.
- PASS: all seven application browser flows (UI Kit integration, real Light Manager program layout, general UI, save/reload, Settings, shading, and compact status/history).
- PASS: all 15 upstream HA UI Kit unit tests, its browser and catalogue/gallery suites, reproducible build, checksum and vendoring checks.
- PASS: HACS and Hassfest.
- PASS: release metadata and both ZIP archive contents, CRC and source-byte verification.

This release uses fixed HA UI Kit 1.2.0 at commit a3b7a7d3bd3a05a97093b2263c5b6fc7d2c4af50. The read-only program-layout flow compares the production card with Light Manager 1.2.2 at commit 4599ef0a4303f2b62706f3b73e7b9990b972f5a8 in the same theme/browser. All 12 combinations of light/dark theme, 320/390/1100 px width and collapsed/expanded programs passed. Font family, size, weight, line height, letter spacing, color, metadata indentation and row padding match. Program names use 14 px and weight 500; metadata is 12 px with a 28 px indent. Screenshots and numeric measurements are recorded in the UI workflow artifact.

Desktop/mobile program comparisons, Settings and native dialogs in both themes were visually inspected. Regression coverage verifies removal of the Programs Vacation control, complete-group ordering, visibility of every program even with former transient filter state, Settings vacation controls, non-admin access, program/action folds, editors/save/restore, sensors, history and movement/contact behavior. German and English help describe the new behavior.

The movement engine is unchanged. The configuration protocol remains 7 and the tilt-to-height delay remains 1.5 seconds. Home Assistant I/O is simulated; no physical actuators are operated. Release archives include the unmodified UI Kit files, checksum manifest and license, exclude internal references/screenshots, preserve source timestamps and are checked against source bytes. The integration path remains custom_components/rollladenplaner.

After installing, restart Home Assistant Core and reload the browser/app. Settings and Help show card/integration 1.5.1 and UI 1.2.0.
