# Release verification: Shutter Manager 1.5.2

Prepared on 2026-11-10. Publication requires the complete Python suite, all application browser flows, upstream UI Kit unit/browser/gallery suites, HACS and Hassfest to pass for the release commit.

The program-layout test compares actual shared program groups, program rows, action rows and controls with an independent ShadowRoot containing only HA UI Kit 1.2.1 CSS. It checks computed typography, indentation, padding, gaps, borders, control geometry and relative layout on desktop/mobile in both themes, with collapsed/expanded programs and admin/non-admin controls. Screenshots and numeric measurements are retained as workflow artifacts. Static checks reject local shared-selector and typography overrides.

The movement engine, protocol 7 and 1.5-second tilt-to-height delay are unchanged. All Home Assistant I/O is simulated; no physical actuators are operated. Both release archives are validated for metadata, checksums, CRC, source bytes and the exclusive rollladenplaner integration path.

After installation, restart Home Assistant Core and reload the browser/app. Settings and Help show card/integration 1.5.2 and UI 1.2.1.
