# Shutter Manager

## New in 1.11.5: direct commands and opening validity

Direct manual-card commands now work with a known-open contact when no eligible opening program applies to that cover. The check includes enabled programs/rides, weekday, time window, season and pauses. A hold already triggered during a valid opening program remains protected until confirmed closure.

This correction applies **only to immediate commands**. Recurring time programs, sensor programs and scheduled one-time actions retain their previous contact rules. Permissions, stored configurations and the two-second tilt-to-height delay are unchanged.

## New in 1.11.4: endpoint labels and existing dashboards

Height uses **Oben/Up at 100%** and **Unten/Down at 0%**, including current values, live sliders and one-time planning. Intermediate height values and every tilt value remain percentages. The bottom-right manual-card gear now matches the shared UI Kit Settings presentation.

Existing `custom:rollladenplaner-card` dashboards work again through an alias of the current main card, fixing the missing-custom-element error. No YAML change is required, and the card picker has no extra old entry. Existing permissions and stored configurations are preserved.

## New in 1.11.3: manual-card controls and names

Height endpoint buttons read **Oben/Up** at 100% on the left and **Unten/Down** at 0% on the right. Presets and sliders descend left to right, including one-time planning. Configure card-local cover names with the pencil beside each selected cover; clear the name to restore its original. Each card can show or hide its direction/Stop icons. The admin-only Settings gear is at the bottom right of the manual card, and bottom success notices are removed.

The old picker entry is removed. Existing `custom:rollladenplaner-card` dashboard YAML is supported by the current main card. The integration folder/domain stays `rollladenplaner`; `custom:shutter-manual-card` remains the separate manual card.

## New in 1.11.2: independent manual cards

Add multiple manual cards on any dashboards. Newly added cards receive independent persistent IDs automatically. For a copied card, choose **New configuration** in the visual card editor or assign a different `card_id`. Each ID stores its own cover selection, order, control mode, columns and presets. Existing cards retain their setup; identical IDs intentionally share it. See [dashboard-manual-multiple.yaml](dashboard-manual-multiple.yaml).

## New in 1.11.1

Reorder the manual card’s selected covers in Settings by holding and dragging the shared handle. Apply persists the order across reloads and restarts. Blinds always use 0%/100% height buttons and configure only tilt; shutters retain height presets or a height slider. This also applies to one-time planning. Existing card IDs and permissions remain unchanged.

## New in 1.11.0: manual-control card

Add **Shutter Manager – Bedienung** from the dashboard card picker, or use:

```yaml
type: custom:shutter-manual-card
card_id: default
```

Restart HA after updating, then reload the browser/app. Open the bottom-right gear as a HA administrator, select the covers already configured in Shutter Manager, and choose sliders or up to four fixed positions for each axis. Presets are edited individually using value/add/trash actions, matching alarm quick times. Plan timer or clock-based movements using the device clock icon; they appear in the regular Schedule. Existing roles and native HA device permissions apply; card setup itself remains HA-admin-only. See [HOWTO.md](HOWTO.md) and [dashboard-manual.yaml](dashboard-manual.yaml).

## Neu in 1.10.0

Manuell sortierbare Einträge werden am gemeinsamen Sortiergriff gedrückt gehalten und an die gewünschte Position gezogen. Die bisherigen Auf-/Ab-Pfeile entfallen. Maus, Touch und Tastatur am Griff werden unterstützt; Escape bricht den Vorgang ab. HA UI Kit 1.7.0 liefert Griff, Rückmeldung und Interaktion gemeinsam. Bestehende Rechte und gespeicherte Daten bleiben erhalten.

Ziehen sortiert Programme innerhalb ihrer jeweiligen Gruppe. Urlaubsbedingt pausierte Fahrten bleiben ausgegraut und ohne Aktionsbuttons. Deutsche und englische Hilfe angepasst.

## Neu in 1.10.0

Durch Urlaub pausierte Fahrten werden in der Zeitübersicht mit dem gleichen ausgegrauten UI-Kit-Zustand wie im Light Manager dargestellt. Alle Aktionsbuttons entfallen während der Urlaubspause, auch bei einmaligen und zusätzlich ausgelassenen Einträgen. Der Grund Urlaubspause bleibt sichtbar; nach Ende der Pause erscheinen die zulässigen Aktionen wieder. Deutsche und englische Hilfe angepasst. Steuerung, Kontaktschutz und Berechtigungen bleiben unverändert.

## Neu in 1.10.0

Hilfe und Anleitung verwenden **Family Administration → Urlaubsmodus** als zentrale Steuerung. Die Zeitübersicht zeigt pausierte Fahrten weiterhin mit dem Grund „Urlaubspause“. Programmbezogene Urlaubspausen, Fahrten, Sensor- und Kontaktvorrang sowie Berechtigungen bleiben unverändert.

## Zentraler Urlaubsmodus · 1.10.0

Der Urlaubsmodus wird ausschließlich unter **Family Access → Einstellungen → Urlaubsmodus** bedient. Die eigenen Urlaubsmodus-Bereiche und Schalter entfallen aus Light Manager, Shutter Manager und Hausarbeiten. Die Option „Im Urlaub pausieren“ je Programm bleibt erhalten; Programme ohne diese Option laufen weiter. Hausarbeiten pausieren ohne Änderung ihres Wiederholungsrhythmus und laufen beim Ausschalten ab heute weiter.

Beim ersten Start wird ein bisher aktiver Urlaubsmodus einmalig zentral als aktiv übernommen. Vergangene Urlaubstage aus Hausarbeiten bleiben erhalten. Eine bewusste zentrale Änderung hat Vorrang vor später startenden Anwendungen. Bei vorübergehend fehlendem Family Access bleibt der zuletzt bestätigte Zustand erhalten.

**Update:** zuerst Family Access Manager 1.2.0, danach Light Manager 1.5.0, Shutter Manager 1.10.0 und Hausarbeiten 0.5.0 installieren. Anschließend Home Assistant neu starten und Browser/App vollständig neu laden. Der zentrale Schalter speichert sofort, unabhängig von noch ungespeicherten Rollenänderungen. Bedienen dürfen echte HA-Administratoren und Eigentümer.

Automationen können `family_access_manager.set_vacation` mit `enabled: true/false` verwenden. Die bisherigen Light-/Shutter-Dienste leiten an diesen Dienst weiter und behalten den ursprünglichen HA-Benutzerkontext: echte Administratoren oder vertrauenswürdige HA-Automationen dürfen schalten. Ein reines Anwendungs-Verwaltungsrecht berechtigt nicht zum globalen Umschalten. Alte lokale WebSocket-Schreibzugriffe und Sicherungswerte können den zentralen Modus nicht überschreiben.


A local Home Assistant integration and dashboard card for cover schedules, sensor shading, and window-contact opening programs.

**Version 1.11.5 · Home Assistant Core 2026.10.0 or newer · German and English card UI**

Shutter Manager controls existing `cover` entities. Manage covers, sensor assignments, and programs in one dashboard card. Choose German 🇩🇪 or English 🇬🇧 in Settings.

## Features

- Schedules for selected weekdays, fixed times, sunrise/sunset, offsets, and earliest/latest limits.
- Position and, for supported blinds, tilt. Each action controls one cover.
- Overarching shading programs with shared temperature/illuminance thresholds, hysteresis, activation/release delays, and per-cover evaluation against assigned sensors. Both activation conditions use AND; either lower release threshold can end shading.
- Shared cover selection, daily windows (including overnight), annual seasons, and explicit end actions: fixed return targets, current schedule, pre-shading position, or keep position. Cover settings contain sensor assignments only.
- Contact policies to proceed, discard, or retry an action after the window or door closes.
- Opening programs that keep a cover at its opening position until all assigned contacts close.
- Sortable programs, grouped by time schedules and sensor programs; each group can be collapsed independently.
- After closing: active temperature/brightness shading first, then a time action still pending because it became due while the contact was open, otherwise the position recorded before opening. Completed time actions are not replayed.
- Annual validity periods and vacation pauses for sensor programs.
- A compact list of future and pending actions, with one-time skip controls. Solar-triggered actions show today’s calculated time, even when their program is inactive. Add one-time individual cover movements for today; completed movements disappear and create no saved program.
- Compact sensor-program rows and shared icon-only Skip/restore controls.
- A read-only failed-history view for other dashboards, using [dashboard-failures.yaml](dashboard-failures.yaml).
- Collapsible programs and actions, copy/move actions, full-program copy, sensor display names, and configuration backup.

The in-card Guide and [HOWTO.md](HOWTO.md) explain the features and their interaction. Changes are listed in [CHANGELOG.md](CHANGELOG.md).

## Install with HACS

Add this repository as a custom repository in HACS. The repository is not part of the HACS default catalog.

1. In HACS, open the menu and choose **Custom repositories**.
2. Add `https://github.com/v9h45n47mh-lab/shutter-manager` with type **Integration**.
3. Find **Shutter Manager**, download it, and restart Home Assistant Core.
4. Go to **Settings → Devices & services → Add integration** and add **Shutter Manager**.
5. Add a manual card to your dashboard:

```yaml
type: custom:shutter-manager-card
grid_options:
  columns: 12
  rows: auto
```

The integration registers the card resource automatically. A separate dashboard resource is normally unnecessary. The old resource URL remains supported. Existing `custom:rollladenplaner-card` YAML loads the current main card through a compatibility alias.

The Home Assistant integration domain and folder stay `rollladenplaner` to preserve existing installations and stored configuration. The visible product name, card type, new resource URL, and release file names use **Shutter Manager**.

## Existing installations

Update the custom HACS repository, download the release, restart Home Assistant Core, and reload the browser or app. Check the card's Guide or Settings to confirm that the card and integration both report version 1.10.0.

If you have manually added the old resource URL, it remains supported. New manual resources can use `/shutter-manager/shutter-manager-card.js?v=1.10.0`. Do not load both URLs on the same dashboard.

## New in 1.10.0

The diagnostic sensor `sensor.shutter_manager_failed_movements_today` counts today's recorded failed attempts across currently configured covers. Use its numeric state above 0 in a dashboard section's visibility to show or hide the whole section, including the heading. Paste [dashboard-failures-section.yaml](dashboard-failures-section.yaml) into the section code editor. The separate failure card shows only each movement's time and cover name; the full history in Settings retains the targets and failure reasons. The counter uses the HA-local day, survives restarts, and updates on the regular five-second cycle without an open dashboard.

## New in 1.7.2

Add `view: failed-history` to another Shutter Manager dashboard card to display only today's failed movements with their time, cover, targets and reason. This read-only view reuses the existing history, local date and entity permissions, refreshes automatically, and shows explicit loading, error and empty states. Paste [dashboard-failures.yaml](dashboard-failures.yaml) into a Manual card after updating.

## New in 1.7.1

Schedule uses the same icon-only Skip/restore controls as Light Manager. Skipped rows use shared light-grey text, omit redundant skip text and expose the distinct restore-schedule icon with an accessible label. HA UI Kit 1.7.0 supplies the canonical undo icon and skipped-state presentation.

## New in 1.7.0

Schedule has a compact **Skip** button with the shared icon and an adjacent **Reschedule once** clock control for future native program and one-time movements. Choose a future time on the occurrence's own day, before or after the original event. The exception survives restarts and changes only that execution; stored programs and regular recurrence are unchanged. Explicit one-execution times may exceed normal earliest/latest bounds, while contacts, shading and permissions still apply. Alarm movements remain read-only. HA UI Kit 1.5.1 supplies both icons and compact styling.

## New in 1.6.1

Schedule uses the same shared action rows and left-aligned add toolbar as Light Manager. Every time starts with its short weekday in the Home Assistant timezone; the redundant 24-hour heading is removed. Upcoming and outstanding movements retain their controls and permissions.

## New in 1.6.0

Schedule shows the next 24 elapsed hours across midnight without weekday or date headings. It optionally includes upcoming cover movements from the installed Wecker integration. Outstanding native movements remain visible until resolved. Native schedules, one-time movements and alarm movements share chronological display order. A small shared alarm icon marks the external source; alarm rows have no Skip, Remove or Edit controls. The alarm remains solely responsible for execution and settings, so the preview creates no stored program and sends no cover command.

The preview uses Wecker's actual calendar/day-type/completed-run calculation and checks alarm ownership plus device read access. Only covers selected in Shutter Manager are included. Missing or unavailable Wecker instances cannot break native schedules. Legacy YAML alarms are not imported. Interoperability is tested against Wecker 1.4.0 and its pinned Music Manager dependency.

Updated the unmodified, locally bundled HA UI Kit to 1.4.1 and use its `media-alarm` icon. The existing functions, configuration protocol 7 and 2.0-second tilt-to-height delay are retained.

## Changes in 1.5.4

Increased the wait between a successful blind tilt service call and the height command from 1.5 to 2.0 seconds. The dedicated timer still measures the wait from completion of the tilt service call, independently of the five-second evaluation. Contact checks, cancellation, the 150-second target-confirmation timeout and HA UI Kit 1.2.2 are retained.

## Changes in 1.5.3

Updated the unmodified, locally bundled HA UI Kit to 1.2.2. Program names, metadata and action text now align at the shared 28 px indent; general icon buttons keep their original spacing. Shared navigation, program groups/rows, fields, selection lists, date/weekday controls, buttons and native dialogs remain in use without local shared-style overrides. Functions, permissions, protocol 7 and the 1.5-second tilt-to-height delay are unchanged.

## Changes in 1.5.2

Programs uses the shared HA UI Kit 1.2.1 program groups, program rows and action rows with unmodified styling. Removed the local Light Manager compatibility profile and duplicate shared-control CSS. Typography, indentation, row spacing, mobile layout and common controls now come exclusively from the pinned UI Kit. Functions, authorization and the 1.5-second movement handoff are retained. Isolated UI Kit comparisons cover desktop/mobile, both themes and collapsed/expanded programs.

## Changes in 1.5.1

Updated the locally bundled HA UI Kit to 1.2.0 and adopted its program group, program row and action row components. Programs no longer contains a Vacation button/filter; vacation mode is controlled in Settings. Program typography and row spacing match the pinned Light Manager reference, including 14 px program names, desktop/mobile group headings, action text and metadata indentation.

## Features retained from 1.5.1

Adopted the locally bundled HA UI Kit 1.1.0 from the shared repository. Navigation, Settings rows/sections, icons, switches, filters, program controls, dialogs and version information now use the shared components and styles. Program sorting arrows use the HA accent color; + Program uses the shared text-plus button. Native dialogs contain keyboard focus and return focus to the opener. Both card aliases serve the pinned local UI modules. See [UI_KIT.md](UI_KIT.md) for provenance and verification.

## Features retained from 1.4.0

Increased the wait between a successful blind tilt service call and the height command from one second to 1.5 seconds. A dedicated timer handles the transition and rechecks contacts and the current goal. The wait begins after the tilt service call returns.

## Features retained from 1.3.9

Reissued version 1.3.8 as a new release with synchronized integration, card and resource versions. Functionality, layout, configuration and installation behavior are unchanged.

## Features retained from 1.3.8

Aligned Settings spacing with Light Manager 1.1.6: compact collapsible sections, headings, cover/sensor/status entries and footer spacing. The Vacation filter now matches its button padding and colors, with a solid accent background and contrasting text when selected.

## Features retained from 1.3.7

Removed the vacation-pause hint from individual program summaries in German and English. Vacation mode is controlled in Settings; the former Programs filter was removed in 1.5.1.

## Features retained from 1.3.6

The Vacation filter introduced in 1.3.6 was removed in 1.5.1. Programs now shows every program; vacation mode is controlled in Settings.

Reduced spacing around programs and between expanded actions, including the gap before the first action. In the mobile layout up to 600 px, only the enable switch and Edit appear beside each program name; program sorting arrows and Copy program are hidden. Desktop sorting and copying remain available. Schedule and target details keep their existing text sizes.

## Features retained from 1.3.5

Removed the action count and program-type label from each program summary in Programs. Weekdays, daily windows and shading thresholds remain in the compact summary. The Time programs and Sensor programs groups keep their headings and program counts.

## Features retained from 1.3.4

Current status and Today's history now use the same chevron headings as the other collapsible Settings sections. Click the heading or use Enter/Space; separate Show/Hide buttons are removed and saved fold states remain available.

Rename selected sensors directly using the pencil beside each sensor in the expanded Sensors section. Each dialog edits one local display name. Clearing the name restores the Home Assistant name; saved names remain in backups. The separate Sensor display names section is removed.

## Features retained from 1.3.3

Introduced a dedicated timer for the handoff between a successful tilt service call and the blind height command, independently of the regular five-second evaluation. Version 1.5.1 uses a 1.5-second wait. The timer rechecks contact blocking and the current goal. Stopping, replacing the goal, or unloading cancels the timer.

## Features retained from 1.3.2

Removed the extra Recent movement commands block. Current status shows only device names and position/tilt. The separate, independently collapsible Today's history retains chronological completed/failed commands and targets.

Removed unrelated legacy Light Manager test files from the Shutter Manager repository so CI tests this integration consistently. Explicit `[publish-release]` commits on main publish the release and its archives only after Python/browser tests, HACS and Hassfest succeed. Ordinary pushes do not publish releases.

## Features retained from 1.3.1

- Full illuminance readings with dotted thousands separators and no decimals, including lx conversion for klx sensors; raw sensor values and thresholds are unchanged.
- Icon-only Schedule and Sensor programs tabs beside Programs. Tooltips, accessible names, and active states remain available; Help and Settings stay on the right.
- Compact Current status rows: device name plus position/tilt, with device names and positions only.
- A separate collapsible Today's history section lists completed and failed commands, including time, targets and results. History survives restarts, uses the HA local date, respects entity read permissions and is not limited to the last 20 log messages. Existing available results migrate without invented targets.

## Upgrading from versions before 1.3.0

Export a backup from Settings before updating. Existing sensor assignments and program actions migrate automatically. Thresholds and release delays move into their programs. Programs that used different condition sets or end actions are split to preserve each device's settings; unused legacy parameter rules become disabled programs. Multiple sensor associations are retained. The original configuration and runtime are retained once as `migration_backup` in the integration's local storage before the migrated model is first persisted.

Review migrated programs before changing them. Conditions are now shared by a program, while each cover uses its own assigned sensors and its own action targets. Changing a program's thresholds affects all of its selected covers. Overlapping shading programs on the same cover are rejected; separate daily windows, weekdays, or seasons where needed.

Sensor release uses the configured release delay. When an actually completed shading cycle leaves its daily/calendar validity, the end action also runs. Pausing or disabling does not initiate a blanket return. Window contacts and opening priority still protect return movements. A return deferred by a contact can remain pending beyond the daily window while the program remains enabled. Newer schedule/shading goals can supersede it.

Frontend and backend use protocol 7. Older or missing save protocols are rejected. Update the integration and card together, restart Home Assistant Core, and reload the browser/app. The installation path remains `/config/custom_components/rollladenplaner`; Shutter Manager does not use the Light Manager directory.

## Release files

GitHub Releases provide:

- `Shutter-Manager-1.10.0.zip`: complete package with the integration folder, documentation, and tests.
- `shutter-manager.zip`: integration folder only, for manual installation under `/config/custom_components/rollladenplaner/`.

The release workflow runs the Python and browser checks, then builds and attaches both archives when a release is published. The version in the release tag must match `manifest.json`.

## Operation and limits

The underlying cover entities must provide position control and position feedback. A manually selected cover type cannot add capabilities the entity does not expose. For blinds with a tilt target, the integration commands tilt first, waits 2.0 seconds after the service call succeeds, then commands height. If a movement phase has no target confirmation after 150 seconds, it logs an error and stops the device when supported.

The integration evaluates every five seconds. Unavailable contacts are not treated as closed. Opening priority applies to automatic actions from Shutter Manager; manual controls and other integrations operate independently. Holiday data, wind protection, and frost protection are not built in.

Administrators configure the integration. Other users need Home Assistant read and control permissions for the relevant entities. Configuration and pending actions are stored locally.

## Development checks

```bash
python3 -m pip install -r tests/requirements.txt
python3 -m unittest discover -s tests -q
node tests/sensor-selection.cjs
node --check custom_components/rollladenplaner/frontend/shutter-manager-card.js
python3 scripts/build_release.py --check-only --tag v1.10.0
python3 scripts/build_release.py --tag v1.10.0
```

Browser tests use Playwright and Chromium. GitHub Actions runs behavior tests plus HACS and Hassfest validation.

For the browser checks, install Playwright into `.ci` and its Chromium binary, then run:

```bash
npm install --prefix .ci playwright
npx --prefix .ci playwright install --with-deps chromium
NODE_PATH="$PWD/.ci/node_modules" node tests/ui-test.cjs
NODE_PATH="$PWD/.ci/node_modules" node tests/save-flow.cjs
NODE_PATH="$PWD/.ci/node_modules" node tests/settings-flow.cjs
NODE_PATH="$PWD/.ci/node_modules" node tests/shading-flow.cjs
NODE_PATH="$PWD/.ci/node_modules" node tests/release-131.cjs
```

Tests simulate Home Assistant I/O and cover position feedback. They do not operate real actuators or replace an on-device acceptance test.

## License

[MIT](LICENSE)

## Replacing an existing GitHub repository checkout

Copy this package into the `shutter-manager` checkout. Under `custom_components`, keep only `rollladenplaner`. Remove unrelated integration folders such as `custom_components/light_manager` from this repository checkout before committing; copying a ZIP over an existing folder does not remove extra files. Preserve the checkout's `.git` directory and include this package's `.github` directory. If an older upload left integration files at the repository root, remove those duplicates (`manifest.json`, `__init__.py`, `engine.py`, `config_flow.py`, `sensor.py`, `services.yaml`, `strings.json` and any root `translations/` folder). These integration files belong only under `custom_components/rollladenplaner/`; retain this package's root `hacs.json`, documentation, and workflows. This cleanup applies to the Shutter Manager GitHub checkout, not the separate Light Manager repository or the Home Assistant configuration directory.

Commit and push the complete cleaned tree, then create the new tag `v1.10.0` from that commit. Verify that the tag contains only `custom_components/rollladenplaner` before downloading through HACS. HACS must show `/config/custom_components/rollladenplaner` as the Shutter Manager installation destination.

## Sensor selection in Settings

Use the central **Sensors → Select sensors** button to search and register temperature, illuminance, and contact sensors. The selection is stored with the configuration and included in backups. Selected sensors are available in the cover sensor-assignment editor. Referenced sensors cannot be removed from the central selection until their sensor assignments or contacts have been removed. Registration and display-name changes do not issue motor commands.

Selected sensors have individual pencil controls in the expanded Sensors section. They edit local display names and preserve the sensor entity IDs. Leave a name blank to restore its Home Assistant label.


## Zentrale Rollenrechte

Rollenrechte: Programme ansehen, Programme bedienen/Fahrten ändern und Programme/Einstellungen verwalten. Native Geräteberechtigungen bleiben zusätzlich wirksam.

Berechtigungen werden jetzt in **Family Access → Anwendung → Rolle** verwaltet. Benutzer können mehrere Rollen erhalten; ihre Freigaben ergänzen sich. Vorhandene Anwendungsrechte werden einmalig in Rollen mit dem Zusatz „übernommen“ importiert und den bisherigen Benutzern zugeordnet. Dashboardfreigaben und die Aktivierung der Dashboardnavigation werden dadurch nicht verändert.

Zum Entziehen eines Rechts alle zugewiesenen Rollen einschließlich übernommener Rollen prüfen. Neue Benutzer erhalten nach der Übernahme keine automatischen Anwendungsrechte. Echte HA-Administratoren behalten Vollzugriff zur Wiederherstellung. Geräte-, Eigentümer- und externe Kontoberechtigungen gelten zusätzlich; eine Rolle erzeugt keine HA-Administratorrechte.

**Aktualisierung:** zuerst Family Access Manager 1.1.0 oder neuer, danach die beteiligten Anwendungen aktualisieren und Home Assistant neu starten. Solange Family Access nicht eingerichtet ist, bleibt die bisherige Rechtevergabe erhalten. Ist Family Access eingerichtet, aber nicht verfügbar oder zu alt, werden Anwendungsaktionen für normale Benutzer abgelehnt. Lokale Benutzer-/Personen-, Geräte- und Musikkontozuordnungen bleiben für Identität und Eigentum erhalten; Rechte werden zentral vergeben.
