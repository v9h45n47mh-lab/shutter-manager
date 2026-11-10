# Release verification: Shutter Manager 1.5.0

Prepared on 2026-11-10. Local Python verification passed 303 tests. Local UI Kit build, four upstream unit tests and integrity checks passed. The local browser process is blocked by the execution environment; browser verification is therefore required in GitHub Actions before publication.

The Validate workflow runs all five existing application browser flows, the shared UI Kit browser suite and the new application/UI Kit comparison. The comparison covers light/dark themes, DE/EN, 320/375/390/430/1100 px, shared program controls, collapsed Settings, native modal keyboard focus, focus return and local module loading. Screenshots and measurements are uploaded as the ui-kit-desktop-mobile workflow artifact for review.

The UI Kit is pinned at 1.1.0, commit 6e57c4079ff20d56a7cbd91470216c27c9767e13. Build verification checks module/CSS/license SHA-256 values and delivery through both card aliases. Release archives are checked against source bytes and preserve source timestamps. The complete archive includes UI_KIT.md and the locally bundled UI; internal build references and screenshots are excluded.

The movement engine remains byte-for-byte unchanged. Existing program/save/restore, contact/movement, permissions, sensor selection/names and daily-history regressions remain in the full suite. The configuration protocol remains 7 and the tilt-to-height delay remains 1.5 seconds. Home Assistant I/O is simulated; no physical actuators are operated.

Publication is gated on successful tests, HACS and Hassfest jobs. The release tag and both archives use the same checked commit. After installing, restart Home Assistant Core and reload the browser/app. Settings and Help show card/integration 1.5.0 and UI 1.1.0.
