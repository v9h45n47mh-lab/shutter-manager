# Release verification: Shutter Manager 1.3.6

Local verification completed on 2026-11-08 against the final release source.

| Check | Result |
| --- | --- |
| Python behavior tests | PASS: 303 tests |
| JavaScript sensor-selection checks | PASS |
| Card JavaScript syntax and Python compilation | PASS |
| Compact layout, mobile controls and Vacation filter: tests/ui-test.cjs | PASS |
| Production Manager save/restore flow: tests/save-flow.cjs | PASS |
| Sensor selection and individual rename: tests/settings-flow.cjs | PASS |
| Shared shading editor: tests/shading-flow.cjs | PASS |
| Settings/navigation/history: tests/release-131.cjs | PASS |
| Release metadata/layout for tag v1.3.6 | PASS |
| Archive CRC and source-byte comparison | Performed by scripts/build_release.py |

The expanded-program layout checks cover reduced header/action gaps and compact action details. At viewport widths of 320, 390 and 600 px, both sorting arrows and Copy program are hidden; only the switch and Edit remain beside the title. Mobile editing works, the layout has no horizontal overflow, and sorting/copying become available again above the mobile breakpoint. Desktop sorting and program copying remain covered. The mobile expanded-program layout was visually inspected.

Vacation-filter checks cover left alignment opposite + Program on desktop/mobile, keyboard toggle and pressed state, empty results, matching time and sensor programs, filtered group counts, refresh/tab retention and translated labels. Clicking the filter neither changes configuration/vacation mode nor sends save/action requests. Read-only users can use it. Explicit desktop sorting while filtered swaps visible programs while preserving hidden program positions. The active mobile filter was visually inspected.

All five browser flows passed with the production card and simulated Home Assistant I/O. Existing sensor-name pencils, Settings chevrons, save/reload, permissions, daily history, shading configuration, full illuminance values and icon navigation remain covered. The 303 Python tests retain the one-second tilt-to-height timer and movement/contact regression coverage.

Both embedded guides and HOWTO.md explain the compact layout, responsive controls and view-only Vacation filter, and match release 1.3.6. The configuration protocol remains 7; no data-model migration is introduced.

Publication is opt-in: a main-branch commit marked [publish-release] runs the complete Validate workflow and may publish only after the tests, HACS and Hassfest jobs succeed. The release/tag and both archives use that checked commit. GitHub Actions records the remote validation and publication results.

The full archive contains exactly one integration, custom_components/rollladenplaner, plus documentation, tests, scripts and GitHub workflows. Backend, manifest, card, guides and automatic resource URLs use 1.3.6. Source timestamps are preserved; dependencies, browsers, caches, old releases and unrelated integrations are excluded.

No physical actuator was operated. After installing, restart Home Assistant Core and reload the browser/app. Both displayed versions should report 1.3.6.
