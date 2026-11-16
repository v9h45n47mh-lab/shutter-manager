# Shutter Manager 1.11.3

- Manual-card presets and sliders now run from 100 on the left to 0 on the right. Height endpoint buttons read Unten/Down (100) and Oben/Up (0), including one-time planning; tilt remains numeric. Stored presets and submitted target values are unchanged.
- Added per-card cover display names, edited with the pencil beside each selected cover. Empty names restore the Shutter Manager name. Names survive restarts, remain independent between card IDs and are filtered by native read permissions; global names are unchanged.
- Moved the manual card's admin-only Settings gear to the bottom right and added a per-card switch for the Up/Stop/Down row. Removed bottom success notices while retaining actionable errors and planning details. The main program card keeps its existing navigation.
- Removed the legacy rollladenplaner-card element and picker entry. Existing dashboards using that type must switch to custom:shutter-manager-card; the integration domain and resource compatibility routes remain intact.
- Preserved admin-only setup, central/native control permissions, independent card profiles, scheduling and the two-second tilt-to-height handoff. Added backend and responsive light/dark browser regressions and updated both guides.

Restart HA Core and reload the browser/app. If a dashboard still uses custom:rollladenplaner-card, replace its type with custom:shutter-manager-card. Manual cards keep their IDs and saved configuration.
