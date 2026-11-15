# Release validation — 1.7.2

Validated on 2026-11-15 against candidate ee9253b4c29df6815414002cd9b5092a17101a51 in GitHub Actions run 43688552020. The release workflow repeats the required checks on the published commit before creating the tag and assets.

- 349 Python tests, seven actual Wecker interoperability checks, 26 shared UI Kit unit tests, six upstream browser suites and all ten application browser suites passed. HACS and Hassfest passed.
- The new failures-flow browser suite runs the real production card and Manager with durable fixture storage. It checks failed-only results, the complete daily history beyond 20 entries, target/reason details, HA-local clocks despite a different browser time zone, midnight rollover, read-permission filtering, loading, empty and connection-failure states, retry, automatic live refresh, DE/EN, escaped names/titles/reasons and the absence of editing or movement controls. All reads assert zero actuator service calls.
- The failure view was checked at 320, 390 and 1100 px in light/dark themes for administrator and restricted-reader profiles. Its stylesheet is byte-for-byte the unmodified pinned UI_CSS, with shared row headings, failure icons and the existing daily-history layout. No local common typography, color, icon or spacing overrides were added.
- The ui-kit-desktop-mobile artifact contains 98 screenshots plus existing style measurements. Failure screenshots were explicitly inspected at 1100 px in light and dark, 320 px in light and 390 px in dark. Long content wraps, restricted devices are absent from reader views and there is no horizontal overflow.
- Existing schedules, skip/restore controls, one-execution time changes, read-only alarm rows, settings, sensor selection, shading, saves, keyboard behavior and permissions passed their existing regression suites.
- The dashboard YAML was parsed and checked. Both archive formats pass CRC, version, source-byte and exclusive rollladenplaner integration-path checks; the complete package includes dashboard-failures.yaml. The source timestamp-preserving archive builder is retained.

Scheduling, actuator commands, configuration protocol 7 and the 2.0-second tilt-to-height delay are unchanged. The shared HA UI Kit remains 1.5.2 at fefbfd91e5a6e611efededee541342cc12c709e9, with unchanged vendored source files and verified lock hashes. HA I/O is simulated; no physical actuator was operated. English release notes and German/English Help/HOWTO include the new dashboard configuration.

After installation, restart Home Assistant Core and reload the browser/app. Card and integration must report 1.7.2. Then paste dashboard-failures.yaml into a Manual card on the destination dashboard.
