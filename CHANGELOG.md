# Changelog / Änderungen

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

- Für die Installation als benutzerdefiniertes HACS-Repository vorbereitet.
- HACS-Metadaten, Repository-Verweise, MIT-Lizenz und öffentliche Installationsanleitung ergänzt.
- Reproduzierbare Integrations- und manuelle ZIP-Dateien sowie Validierungs- und Release-Workflows ergänzt.
- Fahrlogik gegenüber 0.10.0 unverändert.

## 0.10.0

- Stift-Symbole zum Bearbeiten von Programmen, Geräten und Sensoranzeigenamen.
- Öffnungsprogramme mit Tagen, Zeitfenster, Zielhöhe und Lamellen.
- Öffnungsvorrang bis zum Schließen aller Kontakte; anschließend Temperatur/Helligkeit, aktueller Zeitplan oder ursprüngliche Position.
- Öffnungsvorrang und ursprüngliche Position bleiben über Neustarts erhalten.
