# Release verification: Shutter Manager 1.6.0

Prepared on 2026-11-13. Publication requires the full Python suite, real-provider interoperability tests, eight application browser flows, all upstream UI Kit suites, HACS and Hassfest for the exact release commit.

Backend checks cover optional installation, owner/admin visibility, entity read permissions, selected covers, valid target positions, future times in the next 24 elapsed hours, including tomorrow and DST boundaries, DST offsets, completed/disabled/unmatched wakes, stale configuration after calendar I/O, timeouts and provider failures. Native timetable data, cover selection, configuration and motor execution remain independent. Forged attempts to skip an external occurrence are rejected.

The interoperability flow uses pinned read-only Wecker 1.4.0 source at c312f59b3872e82cb815517104e23fb51c3c3bdd and its Music Manager dependency at 5b312361676197bf1178ce76b63ab46ac76d3975. It exercises the actual upcoming API, all-day versus timed calendar rules, completed/disabled runs and ownership; preview calls may only read calendar events, without device commands or configuration writes.

The alarm browser flow uses the production card and the actual media-alarm icon from unmodified HA UI Kit 1.4.1, pinned at 393474e75869ba79195d800624a5a793a51fe2c4. It checks source markers, chronological merging, no external Skip/Remove/Edit controls, preserved native actions, admin/user roles, DE/EN, refresh/removal, older snapshots and XSS at 320/390/1100 px in both themes. Existing isolated UI parity and save/edit/permission flows remain required. Screenshots and measurements are workflow artifacts.

Protocol 7 and the 2.0-second tilt-to-height delay are unchanged. Schedule preview uses the execution engine's due-time rules; concrete skips may address tomorrow's visible execution and survive midnight/restart without affecting later repeats. HA I/O is simulated; no physical actuators are operated. Release ZIP archives are checked for metadata, source bytes, CRC and the exclusive rollladenplaner integration path. Internal references and screenshots are excluded.

After installation, restart Home Assistant Core and reload the browser/app. Settings and Help show card/integration 1.6.0 and UI 1.4.1.
