# Release validation — 1.11.2

- 388 local Python tests passed, including independent profile settings/revisions/selections across save/restart and denial of a target selected only on another card.
- The production-component test checks 100 unique persistent card IDs, the crypto fallback, legacy default compatibility and late read/write reply isolation when an element changes IDs. Existing control-policy, drag-order and admin-guard checks remain in force.
- The new required browser suite renders two actual cards simultaneously against production WebSocket/storage fixtures. It checks independent selection, order, modes and presets, editing each card without changing the other, reload persistence, retargeted in-flight reads, the copied-card visual editor action and admin restrictions at 320/390/1100 px in light/dark themes.
- Release gates require the full backend, real Wecker interoperability, upstream UI Kit build/unit/browser, all existing application browser suites, multi-instance suite, HACS and Hassfest checks before publishing this commit. All actuator I/O is simulated; no physical device is operated.
- The unchanged UI Kit 1.7.0, protocol 7, scheduling, one-time movements, existing permissions and two-second tilt-to-height handoff are retained.

Restart HA Core and reload the browser/app. Existing card IDs and legacy default settings are preserved.
