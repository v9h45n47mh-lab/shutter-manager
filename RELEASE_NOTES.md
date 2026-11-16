# Shutter Manager 1.11.2

- New manual cards added through the dashboard card picker now receive unique persistent IDs, allowing independent device selections, order, control modes, columns and presets on the same or different dashboards.
- Added New configuration to the HA-admin-only visual card editor for detaching copied cards into a fresh independent configuration. Existing configurations, explicit shared IDs and the legacy default profile are retained.
- Isolated late read/write replies when an existing element switches configuration IDs, preventing old-profile data from populating the new card. Added production storage, cross-card selection authorization and simultaneous multi-card browser regressions across desktop/mobile and light/dark themes. Updated both guides and packaged a two-card YAML example.

Restart HA Core and reload the browser/app. New cards are independent automatically; for existing copies choose New configuration in the visual card editor.
