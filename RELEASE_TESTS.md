# Release verification: Shutter Manager 1.3.3

Local verification completed on 2026-11-08 against this release source.

| Check | Result |
| --- | --- |
| Python behavior tests | PASS: 303 tests |
| JavaScript sensor-selection checks | PASS |
| Card JavaScript syntax and Python compilation | PASS |
| General card/browser regressions: tests/ui-test.cjs | PASS |
| Production Manager save/restore flow: tests/save-flow.cjs | PASS |
| Desktop/mobile sensor selection: tests/settings-flow.cjs | PASS |
| Shared shading editor: tests/shading-flow.cjs | PASS |
| Layout/history regressions: tests/release-131.cjs | PASS |
| Release metadata/layout for tag v1.3.3 | PASS |
| Archive CRC and source-byte comparison | Performed by scripts/build_release.py |

Timing regression coverage checks the 999 ms / 1 s boundary, a timer-driven height command before the next regular five-second pulse, and a one-second delay measured after a slow tilt service returns. It also verifies contact blocking at the timer callback, cancellation when a program is disabled or the integration unloads, stale callbacks after a replacement movement, failed tilt calls, height-only movements, and the unchanged 150-second height-confirmation timeout.

The five browser flows use real card code, the production Python Manager and simulated Home Assistant I/O. Sensor selection, shading configuration, save/reload, permissions, compact status without recent commands, today's history, full illuminance values, icon navigation and desktop/mobile layouts remain covered. Both embedded guides explain the one-second timer and are checked against the current release version.

Publication is opt-in: a main-branch commit marked [publish-release] runs the complete Validate workflow and may publish only after the tests, HACS and Hassfest jobs succeed. It builds the archives from that checked commit and creates the GitHub release/tag targeting the same commit. GitHub Actions records the remote check and publication results.

The full archive contains exactly one integration, custom_components/rollladenplaner, plus documentation, tests, scripts and GitHub workflows. Backend, manifest, card, guides and automatic resource URLs use 1.3.3. The configuration protocol remains 7. File timestamps are preserved from source rather than replaced by a fixed January date. Dependencies, browsers, caches, old releases and unrelated integration files are excluded.

No physical actuator was operated. After installing, restart Home Assistant Core and reload the browser/app. Both displayed versions should report 1.3.3.
