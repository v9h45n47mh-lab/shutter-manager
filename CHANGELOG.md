# Changelog / Änderungen

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
