# Release verification: Shutter Manager 1.4.0

Prepared on 2026-11-09 against the release source. Full release verification runs in GitHub Actions because the local execution environment became unavailable after the focused timing checks.

| Check | Verification |
| --- | --- |
| Local timing regressions | PASS: 3 focused tests |
| Python behavior tests | 303 tests; GitHub Actions publication requirement |
| JavaScript sensor-selection checks | GitHub Actions publication requirement |
| Card JavaScript syntax | GitHub Actions publication requirement |
| General UI: tests/ui-test.cjs | GitHub Actions publication requirement |
| Production Manager save/restore flow: tests/save-flow.cjs | GitHub Actions publication requirement |
| Settings and sensor rename: tests/settings-flow.cjs | GitHub Actions publication requirement |
| Shared shading editor: tests/shading-flow.cjs | GitHub Actions publication requirement |
| Settings/navigation/history: tests/release-131.cjs | GitHub Actions publication requirement |
| HACS and Hassfest | GitHub Actions publication requirements |
| Baseline source compared with published 1.3.9 commit | PASS: all 41 tracked files matched before preparing this release |
| Release metadata/layout and archive CRC/source-byte comparison | Enforced by scripts/build_release.py in GitHub Actions |

The three local timing tests failed against the previous one-second behavior and passed after the change. They verify that height is not commanded at 1.000 or 1.499 seconds, starts at 1.500 seconds, uses a fractional-second timer, and waits from the successful return of the tilt service call. The timing, cancellation, contact-blocking, stale-timer and 150-second movement-timeout regressions use the new delay.

Both the earliest height-command timestamp and the dedicated timer use TILT_TO_HEIGHT_DELAY_SECONDS = 1.5. The regular evaluation interval remains five seconds. Contact/current-goal checks, cancellation on stop/replacement/unload, height-only commands and the 150-second target-confirmation timeout are retained.

Backend, manifest, card, both guides and automatic resource URLs use 1.4.0. The configuration protocol remains 7. The full archive contains exactly one integration, custom_components/rollladenplaner, plus documentation, tests, scripts and GitHub workflows. Build metadata, dependencies, caches and internal screenshots are excluded. Source timestamps are preserved.

The [Validate workflow](https://github.com/v9h45n47mh-lab/shutter-manager/actions/workflows/validate.yml) runs the full Python suite and all five browser flows with simulated Home Assistant I/O. Publication is gated on successful tests, HACS and Hassfest jobs. The tag and both archives are created from the same checked commit; the release notes confirm those gates passed.

No physical actuator was operated. After installing, restart Home Assistant Core and reload the browser/app. Both displayed versions should report 1.4.0.
