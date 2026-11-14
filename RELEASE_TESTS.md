# Release verification: Shutter Manager 1.7.0

Prepared on 2026-11-14. Publication requires the full Python suite, real-provider interoperability, HA UI Kit 1.5.0 build/unit/vendor checks and all six upstream plus nine application browser suites, HACS and Hassfest for the exact release commit.

New coverage verifies earlier/later same-day overrides, tomorrow, invalid/past times, DST gaps/folds, changed configuration, unchanged programs, restart persistence, no original-time duplicate, contact precedence, correct restoration order, one-time movements, stale revisions and native/Wecker access boundaries. Browser tests run the production card with the actual Manager and durable fixture store, including compact controls, shared icons, roles, forms, cancel, failure/retry, DE/EN and desktop/mobile light/dark views. Physical HA I/O is simulated.
