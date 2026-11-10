# Release verification: Shutter Manager 1.5.1

Prepared on 2026-11-10. Publication is gated on the complete Python suite, all application browser flows, the upstream UI Kit browser/gallery suites, HACS and Hassfest.

This release uses fixed HA UI Kit 1.2.0 at commit a3b7a7d3bd3a05a97093b2263c5b6fc7d2c4af50. The new read-only program-layout flow compares the production card with Light Manager 1.2.2 at commit 4599ef0a4303f2b62706f3b73e7b9990b972f5a8 in the same theme/browser, on desktop and mobile, collapsed and expanded. Font family/size/weight, line height, letter spacing, color, metadata indentation and row padding are compared. Screenshots and numeric measurements are recorded in the UI workflow artifact.

Regression coverage verifies removal of the Programs Vacation control, complete-group ordering, visibility of every program even with former transient filter state, Settings vacation controls, non-admin access, program/action folds, editors/save/restore, sensors, history and movement/contact behavior.

The movement engine is unchanged. The configuration protocol remains 7 and the tilt-to-height delay remains 1.5 seconds. Home Assistant I/O is simulated; no physical actuators are operated. Release archives include the unmodified UI Kit files, checksum manifest and license, exclude internal references/screenshots, preserve source timestamps and are checked against source bytes.

After installing, restart Home Assistant Core and reload the browser/app. Settings and Help show card/integration 1.5.1 and UI 1.2.0.
