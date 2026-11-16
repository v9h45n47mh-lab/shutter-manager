# Shutter Manager 1.11.0

- Added the separate `custom:shutter-manual-card` with any number of selected covers, responsive columns, no heading, shared up/stop/down icons and a top-right planning icon per device.
- Added server-stored, HA-admin-only setup for fixed positions or sliders. Percentage presets follow the alarm quick-time layout: individual editable entries with a trash icon and an add-value action, limited to four distinct integer values per axis. Fixed-position buttons occupy equal-width columns without height/tilt separator lines.
- Added immediate position/tilt commands and production-engine one-time actions using either a 1–1440-minute timer or a future clock on the current HA-local day. Timers may cross midnight. Scheduled actions appear in the existing timetable, survive restarts and create no saved program. The existing one-open-action-per-cover limit is retained.
- Reused the existing central view/control/manage grants and native HA device permissions, with admin-only card setup enforced separately on the server. Contacts, opening priority, shading, confirmed-result history and the 2.0-second tilt-to-height sequence remain effective. Failed movement/stop requests report errors; Stop prevents current goals from restarting and preserves future timers.
- Used the unmodified current released HA UI Kit 1.7.0 for all shared components, icons, typography and colors. Added production-endpoint, persistence, native-permission and desktop/mobile light/dark browser regression checks; refreshed both in-card guides and setup documentation.

Restart Home Assistant Core and reload the browser/app. Add `custom:shutter-manual-card` with `card_id: default`; use its top-right admin Settings to choose devices.
