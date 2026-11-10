# Shared UI provenance

Shutter Manager 1.5.0 bundles HA UI Kit 1.1.0 from [v9h45n47mh-lab/ha-ui-kit](https://github.com/v9h45n47mh-lab/ha-ui-kit), pinned to commit 6e57c4079ff20d56a7cbd91470216c27c9767e13.

The module, CSS, release manifest and MIT license live in custom_components/rollladenplaner/frontend/family-ui/1.1.0/. The adjacent family-ui.lock.json records the fixed module path and SHA-256 checksums. Both supported card URL aliases expose these files. No CDN or automatic main/latest download is used at runtime.

The card uses the shared navigation, Settings sections/rows, icon registry/buttons, switches, filters, program-add/order controls, native dialogs and version information. Form controls use the shared styles; application-specific schedule and sensor layouts preserve their existing data bindings. Common styles come from UI_CSS and are not restated in the card.

The movement engine, configuration protocol and authorization checks are retained. The delay after the successful tilt service call remains 1.5 seconds.

Verification includes upstream build/unit/integrity checks, pinned-file checksum and static-route checks, the complete application test suite and comparisons against the real shared components in light/dark themes at 320, 375, 390, 430 and 1100 px. Tests use simulated Home Assistant I/O.
