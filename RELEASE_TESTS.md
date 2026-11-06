# Release verification: Shutter Manager 1.3.1

Verified on 2026-11-06 against the source packaged in this release.

| Check | Result |
| --- | --- |
| Python behavior tests (`python3 -m unittest discover -s tests -q`) | PASS: 295 tests |
| JavaScript sensor selection (`node tests/sensor-selection.cjs`) | PASS |
| JavaScript syntax (`node --check custom_components/rollladenplaner/frontend/shutter-manager-card.js`) | PASS |
| Python compilation (`python3 -m compileall -q custom_components/rollladenplaner scripts tests`) | PASS |
| General card/browser regressions (`node tests/ui-test.cjs`) | PASS |
| Production Manager save/restore flow (`node tests/save-flow.cjs`) | PASS |
| Desktop/mobile settings and sensor selection (`node tests/settings-flow.cjs`) | PASS |
| Shared shading program editor (`node tests/shading-flow.cjs`) | PASS |
| Navigation, values, status and daily history (`node tests/release-131.cjs`) | PASS |
| Release metadata/layout (`python3 scripts/build_release.py --check-only --tag v1.3.1`) | PASS |
| Archive CRC and source-byte comparison | PASS; performed by the build script |

Python tests used the pinned dependency from tests/requirements.txt. Browser tests used Playwright with headless Chromium 153. GitHub Actions installs Playwright and Chromium, and both Validate and Release workflows run all five browser scripts.

## Release-specific coverage

- Exact integer lux formatting at 0/999/1,000/20,300/123,456, fractional readings, klx conversion and unit whitespace/case. Dotted thousands are retained in German and English; sensor values are not modified.
- Only Programs keeps its text label. Clock and sensor tabs sit directly beside it; Help and Settings align at the right edge. Tooltips, accessible names, keyboard operation and active-page state work in both languages.
- Current status contains recent commands, shows device names with position/tilt on the right, omits Open/Closed and duplicate position lines, and omits tilt for shutters.
- A separate collapsible daily history displays chronological times, device names, targets, completed results and failures. It folds independently from Current status and keeps fold state over page reloads.
- Daily results survive Manager and browser reloads and are not truncated by the diagnostic log's 100-message limit; 145 results remain after unrelated logs replace all diagnostics.
- No completed result is recorded merely because the service accepted a command. Feedback confirms success; service failure creates a failed result. Planned/waiting goals and generic diagnostics do not create new execution results.
- Available legacy logs migrate without invented targets. Date filtering and expiry use the Home Assistant timezone, including local midnight and both DST changes. Entity read permissions filter the response.
- Actual layouts inspected at 320/390/1100px with no horizontal overflow. German/English help and release versions were checked.
- Existing shading, scheduling, one-time movements, contact/opening priority, persistence, sensor selection, copy/move and save-failure regression tests remain successful.

## Packaging and scope

The complete archive is Shutter-Manager-1.3.1.zip; the integration-only archive is shutter-manager.zip. The full archive contains documentation, tests, scripts, GitHub workflows, and exactly one integration under custom_components/rollladenplaner. Frontend, backend, manifest, automatic resource URLs, guides and release tag use 1.3.1. The WebSocket protocol is 7.

Archives preserve source modification times and are checked for CRC integrity and byte-for-byte agreement with source. Dependencies, browser binaries, caches, older releases and unrelated integration folders are excluded.

Home Assistant APIs, services, devices and position feedback are simulated. No real actuator was operated. HACS and Hassfest jobs are configured but were not run locally. After installing, restart Home Assistant Core and reload the browser/app; both displayed versions should read 1.3.1.
