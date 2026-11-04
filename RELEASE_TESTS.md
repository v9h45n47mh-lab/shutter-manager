# Release verification: Shutter Manager 1.3.0

Verified on 2026-11-04 against the source packaged in this release.

## Automated checks

| Check | Result |
| --- | --- |
| Python behavior tests (`python3 -m unittest discover -s tests -q`) | PASS: 283 tests |
| JavaScript sensor selection (`node tests/sensor-selection.cjs`) | PASS |
| JavaScript syntax (`node --check custom_components/rollladenplaner/frontend/shutter-manager-card.js`) | PASS |
| Python compilation (`python3 -m compileall -q custom_components/rollladenplaner scripts tests`) | PASS |
| General card/browser regressions (`node tests/ui-test.cjs`) | PASS |
| Production Manager save/restore flow (`node tests/save-flow.cjs`) | PASS |
| Desktop/mobile settings and sensor selection (`node tests/settings-flow.cjs`) | PASS |
| Desktop/mobile 1.3 program editor (`node tests/shading-flow.cjs`) | PASS |
| Release metadata/layout (`python3 scripts/build_release.py --check-only --tag v1.3.0`) | PASS |
| Archive CRC and source-byte comparison | PASS; performed by the build script |

Python tests used the pinned dependency in `tests/requirements.txt`. Browser tests used Playwright with a local headless Chromium executable. CI installs Chromium through Playwright. The Validate and Release workflows both include all four browser scripts.

## Covered release behavior

- Cover settings store only named sensor associations and contacts. Program conditions survive save and reload.
- Shared program thresholds evaluate each cover's own assigned sensors; missing required sensors are rejected rather than borrowed from another cover.
- Activation AND, release OR, independent delays, unknown-reading timer reset, and timer restoration across restart.
- Fixed, schedule, pre-shading-position and keep end actions; contact-protected returns at daily window end; no invented return for an unknown original position or an unexecuted blocked shading goal; no tilt return command for an explicitly configured shutter.
- Daily and overnight validity, weekday/season anchoring, overlap rejection and disjoint-window acceptance, daily pause, disabled actions, and permission checks on every shared target.
- Legacy parameter migration, splitting different condition sets, preserving multiple sensor assignments, pending work, runtime state and pauses, retaining unused settings as disabled programs, and keeping the original model as a one-time migration backup.
- Older/missing save protocols are rejected, and missing conditions in a save response do not close the editor or discard inputs.
- Existing schedules, one-time movements, contact/opening priority, command history, sensor selection, settings layout, copy/move, live values and editor input/scroll preservation.
- German and English guide versions match the integration manifest. New editor labels and both guides describe program-owned conditions.

## Packaging and scope

The complete archive is `Shutter-Manager-1.3.0.zip`. It contains documentation, tests, scripts, GitHub workflows, and exactly one integration at `custom_components/rollladenplaner`. The integration-only archive is `shutter-manager.zip`. Both are built from the same verified source. Frontend, backend, manifest, resource URLs, guides, and release tag use 1.3.0; the save protocol is 6.

The archives preserve source file modification times rather than assigning a fixed January date. Build dependencies, browser binaries, caches, old release archives, unrelated Light Manager files, and stale root-level integration copies are excluded.

Home Assistant APIs, services, devices, and position feedback are simulated in these tests. No real actuator was operated. HACS and Hassfest jobs are configured in GitHub Actions; they have not been executed in this local verification session. After installation, restart Home Assistant Core, reload the browser/app, and verify both displayed versions are 1.3.0.
