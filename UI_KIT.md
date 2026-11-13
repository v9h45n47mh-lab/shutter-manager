# Shared UI provenance

Shutter Manager 1.6.0 bundles unmodified HA UI Kit 1.4.1 from v9h45n47mh-lab/ha-ui-kit, pinned to commit 393474e75869ba79195d800624a5a793a51fe2c4. Original JS, CSS, manifest and MIT license live in frontend/family-ui/1.4.1/ and are verified by family-ui.lock.json. Prior fixed versions remain available for existing module URLs. No runtime CDN or main/latest request is used.

Shared navigation, program groups/rows, actions, fields, selection lists, weekday/season controls, buttons and native dialogs remain in use. UI_CSS owns common fonts, weights, colors, icon sizes, indentation, spacing and control geometry. No local shared-style overrides are added. Wecker rows use the kit's media-alarm icon in the standard icon size and a shared secondary-text hint. No separate icon path or HA icon dependency is introduced.

Wecker preview data is an optional, read-only backend view. Ownership, entity access, native program behavior and the Wecker scheduler remain outside the UI Kit. There are no skip, remove, edit or execute controls for external alarm rows. Existing native controls retain their behavior and permissions.

Independent UI-only ShadowRoots compare the actual program components, navigation, Settings text, fields, selection lists and dialogs across desktop/mobile and both themes. The alarm preview flow additionally checks the actual shared icon, chronological order, read-only controls, owner/admin roles, refresh, DE/EN and escaped source names. Upstream build, unit, browser, account-tile, gallery, program-row and music-player suites are required before release.

Configuration protocol 7 and the 2.0-second tilt-to-height delay are unchanged.
