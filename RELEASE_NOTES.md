# Shutter Manager 1.11.4

- Corrected manual-card height endpoints to Oben/Up at 100 and Unten/Down at 0. Preset buttons, current values, live slider output and accessible value text use these labels; intermediate height values and all tilt values remain percentages. The same rules apply to one-time planning and survive dialog mode changes and Kit initialization.
- Applied the existing UI Kit Settings-button presentation to the bottom-right gear, including the shared icon, neutral color, icon dimensions and responsive padding. No local shared-style overrides or Kit bundle changes were introduced.
- Restored rollladenplaner-card as a compatibility alias of the current main card, fixing existing Beschattungsmanager dashboards that reported Custom element doesn't exist after 1.11.3. The picker still offers only the current main and manual cards; existing dashboard YAML and stored configurations continue working.
- Added UI Kit Settings parity, height/tilt endpoint and live-planning browser checks at 320/390/1100 pixels in light/dark themes. The full production save-flow suite now also exercises the old dashboard type through its alias. Permissions, numeric targets, per-card settings, scheduling and the two-second tilt-to-height sequence are unchanged.

Restart HA Core and reload the browser/app. Existing dashboards using custom:rollladenplaner-card work again without a YAML change.
