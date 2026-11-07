# Release verification: Shutter Manager 1.3.2

Local verification completed on 2026-11-07 against this release source.

| Check | Result |
| --- | --- |
| Python behavior tests | PASS: 295 tests |
| JavaScript sensor-selection checks | PASS |
| Card JavaScript syntax and Python compilation | PASS |
| General card/browser regressions: tests/ui-test.cjs | PASS |
| Production Manager save/restore flow: tests/save-flow.cjs | PASS |
| Desktop/mobile sensor selection: tests/settings-flow.cjs | PASS |
| Shared shading editor: tests/shading-flow.cjs | PASS |
| Layout/history regressions: tests/release-131.cjs | PASS |
| Release workflow YAML and embedded Python syntax | PASS |
| Release metadata/layout for tag v1.3.2 | PASS |
| Archive CRC and source-byte comparison | Performed by scripts/build_release.py |

The five browser flows use real card code, the production Python Manager and simulated Home Assistant I/O. The dedicated layout test verifies that Recent movement commands is absent in German and English, while Current status and Today's history remain independently collapsible. Position-only status rows, history targets/results, persistence, permissions, HA-local midnight, full lux values, icon navigation and 320/390/1100px layouts remain covered. The mobile layout was visually inspected.

The GitHub repository contained 17 unrelated legacy Light Manager development files that were absent from the clean Shutter Manager package. Its previous Validate run failed with 11 test-discovery errors. These foreign tests/scripts are removed in this release; the build checks also reject direct references to the Light Manager integration in test/development source. No Light Manager repository or installation is changed.

Publication is opt-in: a main-branch commit marked [publish-release] runs the complete Validate workflow and may publish only after the tests, HACS and Hassfest jobs succeed. It builds the archives from that checked commit and creates the GitHub release/tag targeting the same commit. Ordinary commits do not publish releases. GitHub Actions records the remote check and publication results.

The full archive contains exactly one integration, custom_components/rollladenplaner, plus documentation, tests, scripts and GitHub workflows. Backend, manifest, card, guides and automatic resource URLs use 1.3.2. The configuration protocol remains 7. File timestamps are preserved from source rather than replaced by a fixed January date. Dependencies, browsers, caches, old releases and unrelated integration files are excluded.

No physical actuator was operated. After installing, restart Home Assistant Core and reload the browser/app. Both displayed versions should report 1.3.2.
