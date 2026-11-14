# Shared UI provenance

Shutter Manager 1.7.0 bundles unmodified HA UI Kit 1.5.1 from v9h45n47mh-lab/ha-ui-kit, pinned to commit df91dc1dc0f579176028281be612f8c9da628b0d. Original JS, CSS, manifest and MIT license live in frontend/family-ui/1.4.1/ and are verified by family-ui.lock.json. Prior fixed versions remain available for existing module URLs. No runtime CDN or main/latest request is used.

Shared navigation, program groups/rows, actions, fields, selection lists, weekday/season controls, buttons and native dialogs remain in use. UI_CSS owns common fonts, weights, colors, icon sizes, indentation, spacing and control geometry. No local shared-style overrides are added. Schedule uses the same actionRow component as Light Manager, including its typography, indentation and spacing. The left toolbar uses the shared add button; Wecker rows use the kit's statusBadge with media-alarm at its unchanged 16 px badge size. No separate icon path or HA icon dependency is introduced.

Wecker preview data is an optional, read-only backend view. Ownership, entity access, native program behavior and the Wecker scheduler remain outside the UI Kit. There are no skip, remove, edit or execute controls for external alarm rows. Existing native controls retain their behavior and permissions.

Independent UI-only ShadowRoots compare the actual program components, navigation, Settings text, fields, selection lists and dialogs across desktop/mobile and both themes. The alarm preview flow additionally checks the actual shared icon, chronological order, read-only controls, owner/admin roles, refresh, DE/EN and escaped source names. Upstream build, unit, browser, account-tile, gallery, program-row and music-player suites are required before release.

Configuration protocol 7 and the 2.0-second tilt-to-height delay are unchanged.

Schedule actions use button({compact:true,icon:'skip-once'}) and the shared reschedule icon button. Default controls keep their geometry; compact controls retain a 40 px minimum touch height. No local shared-style overrides are used. The application validates future same-date times, persistence, stale requests and access rights.

Schedule uses the optional actionRow({inlineActions:true}) group so compact Skip and reschedule controls stay side by side at mobile widths. Native field fixtures include complete HA theme colors and color-scheme settings.
