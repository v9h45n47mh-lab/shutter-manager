# Release verification: Shutter Manager 1.3.8

Local verification completed on 2026-11-08 against this release source.

| Check | Result |
| --- | --- |
| Python behavior tests | PASS: 303 tests |
| JavaScript sensor-selection checks | PASS |
| Card JavaScript syntax and Python compilation | PASS |
| Vacation button and general UI: tests/ui-test.cjs | PASS |
| Production Manager save/restore flow: tests/save-flow.cjs | PASS |
| Settings spacing and sensor rename: tests/settings-flow.cjs | PASS |
| Shared shading editor: tests/shading-flow.cjs | PASS |
| Settings/navigation/history: tests/release-131.cjs | PASS |
| Additional read-only browser comparison against Light Manager 1.1.6 | PASS |
| Release metadata/layout for tag v1.3.8 | PASS |
| Archive CRC and source-byte comparison | Performed by scripts/build_release.py |

The design reference is [Light Manager commit 2206d42c0597dc6b986bf9de102fb72cd14da760](https://github.com/v9h45n47mh-lab/light-manager/commit/2206d42c0597dc6b986bf9de102fb72cd14da760). The reference card blob was verified as 9c71c4960b82e6722507a057d470a57cf0666ab5 and used read-only. No Light Manager code or integration is packaged in this release.

The comparison rendered both real cards with the same browser/theme. Measured Settings section padding was 10 px above/below, heading text 14 px, chevron gap 6 px and arrow width 20 px in both cards. Inactive and active Vacation filters matched in padding (6 px / 12 px), font, foreground/background, border, radius and rendered height. The selected filter uses the solid primary-button colors. Desktop Settings were inspected side by side; mobile Settings and the selected filter were visually inspected.

Permanent browser regressions cover the reference Settings spacing, footer spacing, compact sensor rows, selection/renaming, German/English controls and desktop/mobile layouts. They also verify the Vacation button colors against the theme's primary button, its filtering behavior, keyboard use, group counts and filtered sorting. Filter clicks do not write configuration or change vacation mode.

All five standard browser flows passed with the production card and simulated Home Assistant I/O. Existing cover editing, independent Settings folds, status/history, save/reload, permissions, shading, full illuminance values and icon navigation remain covered. The 303 Python tests retain the one-second tilt-to-height timer and movement/contact regressions.

Backend, manifest, card, both guides and automatic resource URLs use 1.3.8. The configuration protocol remains 7. The full archive contains exactly one integration, custom_components/rollladenplaner, plus documentation, tests, scripts and GitHub workflows. Reference copies, comparison helpers, screenshots, dependencies, caches and old releases are excluded. Source timestamps are preserved.

Publication runs only for main-branch commits marked [publish-release], after the tests, HACS and Hassfest jobs succeed. The release/tag and both archives use that checked commit. GitHub Actions records remote validation and publication results.

No physical actuator was operated. After installing, restart Home Assistant Core and reload the browser/app. Both displayed versions should report 1.3.8.
