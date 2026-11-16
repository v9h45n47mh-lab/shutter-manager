# Release validation — 1.11.3

- 394 local Python tests passed, including per-card names and transport visibility across persistence/restart, strict input validation, older payload compatibility, native-read filtering and denial of setup changes by non-admin application managers.
- Production-component checks cover descending preset rendering without source mutation, escaped aliases, endpoint labels, reverse Kit ranges, hidden transport controls and existing independent card IDs, ordering and access guards.
- Required browser regressions cover 320/390/1100 px in light/dark themes: bottom-right Settings, independent staged/saved/reset aliases, per-card transport toggles, reversed native slider input and unchanged submitted values, endpoint labels in DE/EN, reload persistence and removal of legacy element/picker registration. Existing main-card navigation and all other application flows are retained.
- Publication requires the full backend, real Wecker interoperability, upstream UI Kit build/unit/browser, all application browser suites, HACS and Hassfest checks for the exact release commit. Browser results are collected by GitHub Actions; local Chromium is unavailable in this workspace. Actuator I/O is simulated throughout.
- The unchanged UI Kit 1.7.0, protocol 7, native/central permissions, timer scheduling and two-second tilt-to-height sequence remain effective.

Restart HA Core and reload the browser/app. Existing manual-card IDs and default profiles are retained. Change the removed legacy YAML type custom:rollladenplaner-card to custom:shutter-manager-card.
