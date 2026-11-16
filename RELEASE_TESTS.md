# Release validation — 1.11.0

- 383 local Python regression tests passed, including manual-card persistence, atomic settings, stale revisions, native device access, central role revocation, actual-admin-only setup, immediate and scheduled commands, midnight timer rollover, confirmed history, failed service calls, failed Stop and the unchanged two-second tilt-to-height handoff.
- Local syntax and pinned-kit checks passed. The bundle remains the unchanged released HA UI Kit 1.7.0; schema 7 and existing recurring configuration are retained.
- The release workflow requires the full Python, real Wecker interoperability, upstream UI Kit build/unit/browser, existing application browser suites, new manual-card browser suite, HACS and Hassfest checks before publishing this commit. The new suite compares actual shared-component styles, checks 320/390/1100-px light/dark layouts and screenshots, and exercises settings, presets, sliders, Stop, timer/clock actions, timetable visibility, roles and denied devices against production WebSocket endpoints and durable fixtures.
- All actuator I/O in tests is simulated. No physical HA device is operated.

Restart HA Core and reload the browser/app after installation. The resource is registered automatically. Use dashboard-manual.yaml or the Shutter Manager – Bedienung card picker entry.
