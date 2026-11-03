# Changelog

## 1.2.8

- Made all four Settings sections collapsible: shutters and blinds, current status, recent movement commands, and sensor display names. Each section remembers its expanded state in the browser.


## 1.2.7

- Make program group headings larger and individual program names smaller on desktop and mobile.

## 1.2.6

- Make the current cover status in Settings collapsible.
- For blinds with a tilt target, send tilt first, wait three seconds after the service call succeeds, then set the cover position.
- Updated the German and English in-card guides.


## 1.2.5

- Added current cover state, position, and blind tilt readings to Settings.
- Added a recent movement history with successful and detected failed commands, filtered by entity read permissions.
- Updated the German and English in-card guides.


## 1.2.4

- Updated the in-card German and English guides to document one-time movements, including device support, tilt availability, expiry, and execution behavior.


## 1.2.3

- Added the one-time movement fields to the WebSocket action schema so scheduled actions can be submitted successfully.


## 1.2.2

- One-time movement form entries are preserved across card updates.
- Tilt controls are hidden for shutters and remain available only for blinds.


## 1.2.1

- The Time Program tab supports one-time movements for an individual shutter or blind on the current day. Successful movements disappear from the list and do not create a saved program.
- One-time movements remain visible while blocked or after an error; expired movements are discarded the following day.


## 1.2.0

- Sensor-program entries use a compact, schedule-like layout.
- One-time skip controls use the text “Auslassen” / “Skip” without an extra icon.
- Time programs show today’s calculated time before the solar trigger and time window, including an inactive program preview.
- A time action that becomes due during an opening return stays queued and runs after the return movement; the selected return target remains fixed during that movement.

## 1.1.0

- Opening-program return priority is now active temperature/brightness shading, an actually pending time action that became due while the contact was open, then the position and tilt recorded immediately before opening. Previously completed schedule targets are not replayed over a later manual position.
- Programs are grouped into independently collapsible time-program and sensor-program sections. Sections start expanded, while individual programs start collapsed.
- Administrators can reorder programs within each group; order is persisted with the configuration.
- Removed the explanatory 0%/100% direction labels from position sliders.
- Completed English translations for dynamic position/tilt labels and opening-program status text.
- Opening-program actions continue to support selecting a target position and optional blind tilt.


## 1.0.0

- Renamed the product to Shutter Manager across the user interface, integration metadata, card registration, documentation, and release archives. The Home Assistant domain `rollladenplaner` and old card/resource aliases remain for compatibility.
- Added English card and guide translations with a persistent 🇩🇪 / 🇬🇧 language picker in Settings.
- Added editable full-program copies with unique program and action IDs.
- Reset saved program expansion state for this release so programs open collapsed by default.
- Prepared version 1.0.0 HACS and manual release archives.

## 0.10.1

- Prepared the integration for installation as a custom HACS repository.
- Added HACS metadata, repository references, an MIT license, and public installation instructions.
- Added reproducible integration and manual ZIP archives, along with validation and release workflows.
- Movement logic is unchanged from version 0.10.0.

## 0.10.0

- Added pencil icons for editing programs, devices, and sensor display names.
- Added opening programs with selected days, time windows, target positions, and blind tilt.
- Opening priority remains active until all contacts close; afterward, active temperature/brightness shading takes priority, followed by the current schedule or the original position.
- Opening priority and the original position are preserved across restarts.
