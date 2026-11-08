# Release verification: Shutter Manager 1.3.4

Local verification completed on 2026-11-08 against this release source.

| Check | Result |
| --- | --- |
| Python behavior tests | PASS: 303 tests |
| JavaScript sensor-selection checks | PASS |
| Card JavaScript syntax and Python compilation | PASS |
| General card/browser regressions: tests/ui-test.cjs | PASS |
| Production Manager save/restore flow: tests/save-flow.cjs | PASS |
| Sensor selection and per-sensor rename: tests/settings-flow.cjs | PASS |
| Shared shading editor: tests/shading-flow.cjs | PASS |
| Settings/navigation/history: tests/release-131.cjs | PASS |
| Release metadata/layout for tag v1.3.4 | PASS |
| Archive CRC and source-byte comparison | Performed by scripts/build_release.py |

The Settings browser checks verify one chevron heading per section, removal of separate Show/Hide controls and the Sensor display names section, aligned arrows, Enter/Space controls, independent folding, saved states after page reload, German/English labels and 320/390/1100px layouts without horizontal overflow. Collapsed mobile settings and expanded sensor rows were visually inspected.

The per-sensor pencil flow uses the production Python Manager and durable fixture storage. It covers single-sensor editing, preservation of other aliases and HA entity names, drafts during live reading updates, failed-save retention and retry, successful save/reload, cancel, clearing an alias, English keyboard controls, selected-sensor removal protection and read-only users without edit buttons. Existing aliases and configuration backups retain the same data model.

All five browser flows passed. Shading configuration, one-time actions, save/restore, permissions, compact current status, today's chronological history, HA-local midnight, illuminance formatting and icon navigation remain covered. The 303 Python tests also retain the one-second tilt-to-height boundary, dedicated timer, contact rechecks and timer cancellation introduced in 1.3.3.

Publication is opt-in: a main-branch commit marked [publish-release] runs the complete Validate workflow and may publish only after the tests, HACS and Hassfest jobs succeed. The release/tag and both archives use that checked commit. GitHub Actions records the remote validation and publication results.

The full archive contains exactly one integration, custom_components/rollladenplaner, plus documentation, tests, scripts and GitHub workflows. Backend, manifest, card, both guides and automatic resource URLs use 1.3.4. The configuration protocol remains 7. Source timestamps are preserved; dependencies, browsers, caches, old releases and unrelated integrations are excluded.

Home Assistant I/O was simulated; no physical actuator was operated. After installing, restart Home Assistant Core and reload the browser/app. Both displayed versions should report 1.3.4.
