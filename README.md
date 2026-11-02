# Shutter Manager

A local Home Assistant integration and dashboard card for cover schedules, sensor shading, and window-contact opening programs.

**Version 1.2.0 · Home Assistant Core 2026.10.0 or newer · German and English card UI**

Shutter Manager controls existing `cover` entities. Manage covers, sensor rules, and programs in one dashboard card. Choose German 🇩🇪 or English 🇬🇧 in Settings.

## Features

- Schedules for selected weekdays, fixed times, sunrise/sunset, offsets, and earliest/latest limits.
- Position and, for supported blinds, tilt. Each action controls one cover.
- Temperature and/or brightness rules with hysteresis and a release delay. When both sensors are assigned, activation uses AND logic.
- Contact policies to proceed, discard, or retry an action after the window or door closes.
- Opening programs that keep a cover at its opening position until all assigned contacts close.
- Sortable programs, grouped by time schedules and sensor programs; each group can be collapsed independently.
- After closing: active temperature/brightness shading first, then a time action still pending because it became due while the contact was open, otherwise the position recorded before opening. Completed time actions are not replayed.
- Annual validity periods and vacation pauses for sensor programs.
- A compact list of future and pending actions, with one-time skip controls. Solar-triggered actions show today’s calculated time, even when their program is inactive.
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

Update the custom HACS repository, download the release, restart Home Assistant Core, and reload the browser or app. Check the card's Guide or Settings to confirm that the card and integration both report version 1.2.0.

If you have manually added the old resource URL, it remains supported. New manual resources can use `/shutter-manager/shutter-manager-card.js?v=1.2.0`. Do not load both URLs on the same dashboard.

## Release files

GitHub Releases provide:

- `Shutter-Manager-1.2.0.zip`: complete package with the integration folder, documentation, and tests.
- `shutter-manager.zip`: integration folder only, for manual installation under `/config/custom_components/rollladenplaner/`.

The release workflow builds and attaches both archives when a release is published. The version in the release tag must match `manifest.json`.

## Operation and limits

The underlying cover entities must provide position control and position feedback. A manually selected cover type cannot add capabilities the entity does not expose. The integration commands the position first and tilt second. If a movement phase has no target confirmation after 150 seconds, it logs an error and stops the device when supported.

The integration evaluates every five seconds. Unavailable contacts are not treated as closed. Opening priority applies to automatic actions from Shutter Manager; manual controls and other integrations operate independently. Holiday data, wind protection, and frost protection are not built in.

Administrators configure the integration. Other users need Home Assistant read and control permissions for the relevant entities. Configuration and pending actions are stored locally.

## Development checks

```bash
python3 -m pip install -r tests/requirements.txt
python3 -m unittest discover -s tests -q
node --check custom_components/rollladenplaner/frontend/shutter-manager-card.js
python3 scripts/build_release.py --check-only --tag v1.2.0
python3 scripts/build_release.py --tag v1.2.0
```

Browser tests use Playwright and Chromium. GitHub Actions runs behavior tests plus HACS and Hassfest validation.

## License

[MIT](LICENSE)
