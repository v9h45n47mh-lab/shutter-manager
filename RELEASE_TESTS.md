# Release verification: Shutter Manager 1.5.0

Verification completed on 2026-11-10. The application code was checked in [Validate run 42857799276](https://github.com/v9h45n47mh-lab/shutter-manager/actions/runs/42857799276), commit e034cd0656fe2d77be3938b7dda876bcd8586403. The final release commit repeats all publication gates.

| Check | Result |
| --- | --- |
| Python behavior tests | PASS: 303 tests locally and in GitHub Actions |
| Sensor selection and card JavaScript syntax | PASS |
| UI Kit upstream build, unit and generated-file checks | PASS: build, 4 unit tests and integrity check |
| Vendored module/CSS/license checksums | PASS: unchanged UI Kit 1.1.0 |
| Shared UI Kit browser suite | PASS: mobile/desktop, themes, keyboard, dialogs and isolated cards |
| Application/UI Kit comparison | PASS: real component parity at 320/375/390/430/1100 px, light/dark and DE/EN |
| General UI: tests/ui-test.cjs | PASS |
| Production Manager save/restore: tests/save-flow.cjs | PASS |
| Settings/sensor rename: tests/settings-flow.cjs | PASS |
| Shared shading editor: tests/shading-flow.cjs | PASS |
| Settings/navigation/history: tests/release-131.cjs | PASS |
| HACS and Hassfest | PASS |
| Desktop/mobile screenshot review | PASS: program/settings layouts and native dialogs in light/dark themes |
| Release layout and archive CRC/source-byte comparison | PASS: scripts/build_release.py |

Local Chromium launch is blocked by the execution environment. All browser checks therefore ran in GitHub Actions. The ui-kit-desktop-mobile artifact contains screenshots and measurements from the actual production card and locally bundled module. Shared program-add and ordering controls match the real upstream component metrics; arrows use the HA accent color. Native dialogs contain Tab navigation, support Escape, return focus to the opener and maintain readable input contrast with complete HA theme tokens.

UI Kit 1.1.0 is pinned to upstream commit 6e57c4079ff20d56a7cbd91470216c27c9767e13. Its manifest and lock retain the original module/CSS/license SHA-256 values. Both supported card aliases serve every required local UI file. No CDN or main/latest runtime request is introduced.

The movement engine remains byte-for-byte unchanged. The backend differs only in version metadata and the two local UI static routes. Existing program/save/restore, contact/movement, authorization, sensor selection/names and daily-history regressions passed. The configuration protocol remains 7 and the tilt-to-height delay remains 1.5 seconds. Home Assistant I/O was simulated; no physical actuator was operated.

The complete archive includes UI_KIT.md and the locally bundled UI; build references, dependencies and screenshots are excluded. Archive content is checked against source bytes and source timestamps are preserved. Publication is gated on tests, HACS and Hassfest. The tag and both archives use the same checked commit.

After installing, restart Home Assistant Core and reload the browser/app. Settings and Help show card/integration 1.5.0 and UI 1.1.0.
