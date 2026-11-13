# Release verification: Shutter Manager 1.6.1

Candidate preparation on 2026-11-13. All release checks must pass for the exact published commit: Python, optional Wecker interoperability, shared UI Kit unit/vendor checks, weekday/timezone tests, application and upstream browser suites, HACS and Hassfest.

The Schedule change is limited to short weekday labels, removing the redundant heading and using the same shared action rows and left add toolbar as Light Manager. New coverage checks all weekdays, HA timezone precedence, UTC date boundaries and both DST changes. Browser checks compare the production Schedule with independent, unmodified UI Kit action rows, buttons and alarm badges at desktop/mobile sizes in both themes, for admin and user roles.

Native skip/remove controls, optional read-only Wecker previews, chronological 24-hour ordering, pending movements, German/English Help, settings and program behavior remain covered by existing flows. Protocol 7, selected devices, permissions and the 2.0-second tilt-to-height delay are retained. No physical devices are operated; actual production modules run against explicit HA fixtures.
