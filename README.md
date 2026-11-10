# Shutter Manager

A local Home Assistant integration and dashboard card for cover schedules, sensor shading, and window-contact opening programs.

**Version 1.5.2 · Home Assistant Core 2026.10.0 or newer · German and English card UI**

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
- Compact sensor-program rows and text-only “Skip” / “Auslassen” controls.
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

The integration registers the card resource automatically. A separate dashboard resource is normally unnecessary. The legacy card type `custom:rollladenplaner-card` and old resource URL remain available for existing dashboards.

The Home Assistant integration domain and folder stay `rollladenplaner` to preserve existing installations and stored configuration. The visible product name, card type, new resource URL, and release file names use **Shutter Manager**.

## Existing installations

Update the custom HACS repository, download the release, restart Home Assistant Core, and reload the browser or app. Check the card's Guide or Settings to confirm that the card and integration both report version 1.5.2.

If you have manually added the old resource URL, it remains supported. New manual resources can use `/shutter-manager/shutter-manager-card.js?v=1.5.2`. Do not load both URLs on the same dashboard.

## New in 1.5.2

Programs uses the shared HA UI Kit 1.2.1 program groups, program rows and action rows with unmodified styling. Removed the local Light Manager compatibility profile and duplicate shared-control CSS. Typography, indentation, row spacing, mobile layout and common controls now come exclusively from the pinned UI Kit. Functions, authorization and the 1.5-second movement handoff are retained. Isolated UI Kit comparisons cover desktop/mobile, both themes and collapsed/expanded programs.

## Changes in 1.5.1

Updated the locally bundled HA UI Kit to 1.2.0 and adopted its program group, program row and action row components. Programs no longer contains a Vacation button/filter; vacation mode is controlled in Settings. Program typography and row spacing match the pinned Light Manager reference, including 14 px program names, desktop/mobile group headings, action text and metadata indentation.

## Features retained from 1.5.0

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

- `Shutter-Manager-1.5.2.zip`: complete package with the integration folder, documentation, and tests.
- `shutter-manager.zip`: integration folder only, for manual installation under `/config/custom_components/rollladenplaner/`.

The release workflow runs the Python and browser checks, then builds and attaches both archives when a release is published. The version in the release tag must match `manifest.json`.

## Operation and limits

The underlying cover entities must provide position control and position feedback. A manually selected cover type cannot add capabilities the entity does not expose. For blinds with a tilt target, the integration commands tilt first, waits 1.5 seconds after the service call succeeds, then commands height. If a movement phase has no target confirmation after 150 seconds, it logs an error and stops the device when supported.

The integration evaluates every five seconds. Unavailable contacts are not treated as closed. Opening priority applies to automatic actions from Shutter Manager; manual controls and other integrations operate independently. Holiday data, wind protection, and frost protection are not built in.

Administrators configure the integration. Other users need Home Assistant read and control permissions for the relevant entities. Configuration and pending actions are stored locally.

## Development checks

```bash
python3 -m pip install -r tests/requirements.txt
python3 -m unittest discover -s tests -q
node tests/sensor-selection.cjs
node --check custom_components/rollladenplaner/frontend/shutter-manager-card.js
python3 scripts/build_release.py --check-only --tag v1.5.2
python3 scripts/build_release.py --tag v1.5.2
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

Commit and push the complete cleaned tree, then create the new tag `v1.5.2` from that commit. Verify that the tag contains only `custom_components/rollladenplaner` before downloading through HACS. HACS must show `/config/custom_components/rollladenplaner` as the Shutter Manager installation destination.

## Sensor selection in Settings

Use the central **Sensors → Select sensors** button to search and register temperature, illuminance, and contact sensors. The selection is stored with the configuration and included in backups. Selected sensors are available in the cover sensor-assignment editor. Referenced sensors cannot be removed from the central selection until their sensor assignments or contacts have been removed. Registration and display-name changes do not issue motor commands.

Selected sensors have individual pencil controls in the expanded Sensors section. They edit local display names and preserve the sensor entity IDs. Leave a name blank to restore its Home Assistant label.
