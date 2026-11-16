# Release validation — 1.11.1

- 386 local Python tests passed, including a new selected-cover-order save/restart test with no motor I/O.
- The production-component test verifies fixed 0/100 blind height in both modes, tilt-only blind sliders, shutter height sliders/presets, guarded target selection, shared drag handles, draft-only reordering, stable selection and admin-only sorting.
- Required browser gates exercise real held mouse drag, native touch input, keyboard ordering, save/reload/cancel, selection changes without reordering retained covers, and the hybrid control policy in both the manual card and planning dialog. The matrix includes 320/390/1100 px, light/dark themes and admin/reader/operator/manager roles against actual production WebSocket endpoints and durable fixtures.
- Full Python, real Wecker interoperability, upstream Kit build/unit/browser, existing application browsers, HACS and Hassfest checks are required by the release workflow before publication. HA I/O is simulated; no physical actuator is operated.
- The pinned UI Kit remains the unchanged released 1.7.0 bundle. Protocol 7, recurring program data, existing roles and the two-second tilt-to-height delay are preserved.

Restart HA Core and reload the browser/app. Existing card_id values and selected devices remain valid.
