# Release verification: Shutter Manager 1.3.7

Local verification completed on 2026-11-08 against this release source.

| Check | Result |
| --- | --- |
| Python behavior tests | PASS: 303 tests |
| JavaScript sensor-selection checks | PASS |
| Card JavaScript syntax and Python compilation | PASS |
| Program overview and Vacation filter: tests/ui-test.cjs | PASS |
| Production Manager save/restore flow: tests/save-flow.cjs | PASS |
| Sensor selection and individual rename: tests/settings-flow.cjs | PASS |
| Shared shading editor: tests/shading-flow.cjs | PASS |
| Settings/navigation/history: tests/release-131.cjs | PASS |
| Release metadata/layout for tag v1.3.7 | PASS |
| Archive CRC and source-byte comparison | Performed by scripts/build_release.py |

Program-overview regressions verify that the German and English vacation-pause hints are absent from individual summaries. Weekdays and the remaining schedule/condition details are still displayed. The mobile expanded-program overview was visually inspected.

The Vacation filter remains covered for matching time/sensor programs, empty results, group counts, keyboard controls, desktop/mobile alignment, refresh/tab retention, read-only users and filtered sorting. Filter clicks do not change vacation mode/configuration and do not issue save/action requests. Compact expanded spacing, mobile sorting/copy visibility and editing remain covered.

All five browser flows passed with the production card and simulated Home Assistant I/O. Existing Settings, sensor-name pencils, save/reload, permissions, daily history, shading configuration, illuminance values and icon navigation remain covered. The 303 Python tests retain the one-second tilt-to-height timer and movement/contact regression coverage.

Both embedded guides and HOWTO.md explain the removed hint and Vacation filter and match release 1.3.7. The configuration protocol remains 7; this change introduces no data-model migration.

Publication is opt-in: a main-branch commit marked [publish-release] runs the complete Validate workflow and may publish only after the tests, HACS and Hassfest jobs succeed. The release/tag and both archives use that checked commit. GitHub Actions records remote validation and publication results.

The full archive contains exactly one integration, custom_components/rollladenplaner, plus documentation, tests, scripts and GitHub workflows. Backend, manifest, card, guides and automatic resource URLs use 1.3.7. Source timestamps are preserved; dependencies, browsers, caches, old releases and unrelated integrations are excluded.

No physical actuator was operated. After installing, restart Home Assistant Core and reload the browser/app. Both displayed versions should report 1.3.7.
