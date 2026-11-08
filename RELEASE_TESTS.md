# Release verification: Shutter Manager 1.3.9

Local verification completed on 2026-11-08 against this release source.

| Check | Result |
| --- | --- |
| Python behavior tests | PASS: 303 tests |
| JavaScript sensor-selection checks | PASS |
| Card JavaScript syntax and Python compilation | PASS |
| General UI: tests/ui-test.cjs | PASS |
| Production Manager save/restore flow: tests/save-flow.cjs | PASS |
| Settings and sensor rename: tests/settings-flow.cjs | PASS |
| Shared shading editor: tests/shading-flow.cjs | PASS |
| Settings/navigation/history: tests/release-131.cjs | PASS |
| Baseline source compared with published 1.3.8 commit | PASS: all 41 tracked files matched before preparing this release |
| Runtime source and guides compared with 1.3.8 after normalizing version strings | PASS: identical |
| Release metadata/layout for tag v1.3.9 | PASS |
| Archive CRC and source-byte comparison | Performed by scripts/build_release.py |

This release reissues 1.3.8 without functional, layout, configuration or installation changes. Only synchronized version strings and release documentation change. All tests, movement engine logic, configuration schema and HACS metadata remain byte-for-byte unchanged. The baseline commit is 90575580207175878aa393b7fb5cffdf8eed13a9.

All five standard browser flows passed with the production card and simulated Home Assistant I/O. Desktop/mobile controls, sensor selection/renaming, settings folds, vacation filtering, shading, save/reload, permissions, navigation and history remain covered. The 303 Python tests retain the one-second tilt-to-height timer and movement/contact regressions.

Backend, manifest, card, both guides and automatic resource URLs use 1.3.9. The configuration protocol remains 7. The full archive contains exactly one integration, custom_components/rollladenplaner, plus documentation, tests, scripts and GitHub workflows. Dependencies, caches, internal screenshots and build metadata are excluded. Source timestamps are preserved.

Publication runs only for main-branch commits marked [publish-release], after the tests, HACS and Hassfest jobs succeed. The release/tag and both archives use that checked commit. GitHub Actions records remote validation and publication results.

No physical actuator was operated. After installing, restart Home Assistant Core and reload the browser/app. Both displayed versions should report 1.3.9. This release does not claim to fix the previously reported GitHub download timeout.
