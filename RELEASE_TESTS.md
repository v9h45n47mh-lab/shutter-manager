# Release validation — 1.11.5

- Reproduced the original failure before the fix: 17 direct-command cases failed with an open-contact error, covering missing, disabled and out-of-validity opening programs.
- 405 local Python tests passed after the fix. Production regressions cover native Up/Down, height and tilt, missing programs, disabled programs/rides, time/weekday/season validity, vacation and per-day pauses, unrelated covers, existing latched holds, persistence/restart and validity starting during the tilt-to-height wait.
- Explicit time-program regressions retain defer and skip contact policies without an opening program. Scheduled one-time actions remain blocked by the contact. Unavailable-contact behavior, role/native permissions and timing regressions remain in force.
- Real-card browser tests use the production WebSocket adapter and durable storage with a known-open contact: missing, disabled and out-of-season opening programs allow direct native and preset commands; an eligible opening program still refuses them. These cases run at 320/1100 px in light/dark themes alongside the existing 320/390/1100 px UI Kit, manual-card, settings and application suites.
- Publication requires all backend, real Wecker interoperability, unchanged upstream UI Kit build/unit/browser, application browser suites, HACS and Hassfest gates for the exact commit. Chromium runs in GitHub Actions; all actuator I/O is simulated.

The UI Kit 1.7.0, protocol 7, stored programs, access rules and two-second tilt-to-height delay are unchanged. Restart HA Core and reload the browser/app.
