# Shutter Manager 1.11.1

- Added drag-and-drop ordering for selected covers in the manual card Settings using the unchanged HA UI Kit 1.7.0 order handle. Mouse, touch, keyboard movement and cancellation are supported. Apply saves the card order; Cancel discards it. Adding or removing covers preserves the relative order of the retained selection.
- Blinds now always use fixed 0% and 100% height buttons in both control modes. Only tilt uses configurable presets or a slider. Shutters retain configurable height presets and the height slider. The same policy applies to one-time planning; blind-only Settings hide shutter height presets.
- Kept server-enforced HA-admin-only Settings, central/native device permissions, shared styling, timer persistence, recurring programs and the two-second tilt-to-height handoff. Added component, persistence and desktop/mobile light/dark browser regressions and refreshed both embedded guides.

Restart HA Core and reload the browser/app. In the existing manual card, open Settings, drag the selected devices under Order and choose Apply.
