# Release verification: Shutter Manager 1.3.5

Local verification completed on 2026-11-08 against this release source.

| Check | Result |
| --- | --- |
| Python behavior tests | PASS: 303 tests |
| JavaScript sensor-selection checks | PASS |
| Card JavaScript syntax and Python compilation | PASS |
| Program overview and general browser regressions: tests/ui-test.cjs | PASS |
| Production Manager save/restore flow: tests/save-flow.cjs | PASS |
| Sensor selection and individual rename: tests/settings-flow.cjs | PASS |
| Shared shading editor: tests/shading-flow.cjs | PASS |
| Settings/navigation/history: tests/release-131.cjs | PASS |
| Release metadata/layout for tag v1.3.5 | PASS |
| Archive CRC and source-byte comparison | Performed by scripts/build_release.py |

Program-overview checks verify removal of individual action counts and program-type labels for time, opening and shading programs. Weekdays, vacation pause, opening time windows and shading thresholds remain visible. The checks cover German and English labels, mobile display, program folding and editing, group folding and ordering. The mobile overview was visually inspected; removing the labels leaves no empty metadata row.

All five browser flows passed with the production card and simulated Home Assistant I/O. Existing Settings chevrons, per-sensor pencil naming, save/reload, alias isolation, permissions, history results, local midnight, full illuminance values and icon navigation remain covered. The 303 Python tests retain the one-second tilt-to-height timer and movement/contact regression coverage.

Both embedded guides and HOWTO.md describe the compact overview and match release 1.3.5. The configuration protocol remains 7; no data-model migration is introduced by this UI change.

Publication is opt-in: a main-branch commit marked [publish-release] runs the complete Validate workflow and may publish only after the tests, HACS and Hassfest jobs succeed. The release/tag and both archives use that checked commit. GitHub Actions records the remote validation and publication results.

The full archive contains exactly one integration, custom_components/rollladenplaner, plus documentation, tests, scripts and GitHub workflows. Backend, manifest, card, guides and automatic resource URLs use 1.3.5. Source timestamps are preserved; dependencies, browsers, caches, old releases and unrelated integrations are excluded.

No physical actuator was operated. After installing, restart Home Assistant Core and reload the browser/app. Both displayed versions should report 1.3.5.
