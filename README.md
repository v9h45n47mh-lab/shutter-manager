# Light Manager

Lokale Home-Assistant-Integration zur Steuerung von Lampen und Lichtgruppen über Zeit- und Sensorprogramme.

- Zeitprogramme mit festen Uhrzeiten, Sonnenaufgang oder Sonnenuntergang sowie Einmalaktionen für heute.
- Sensorprogramme für Öffnungskontakte, Bewegung und Helligkeit mit Status, Sperrgründen und Pause bis Mitternacht.
- Gemeinsame Schaltziele pro Programm, gruppiert nach Home-Assistant-Bereichen.
- Lichtwerte und passende Hue-Szenen, Messwerte, Lampenstatus und Sicherung.
- Deutsch und Englisch mit integrierter Anleitung im **?-Tab**.

## Installation und Update

Siehe [INSTALLATION.md](INSTALLATION.md) für HACS und manuelle Installation. Die vorhandene Integration bleibt beim Update eingerichtet.

## Einrichtung

1. Bei einer Erstinstallation unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** den **Light Manager** auswählen.
2. Eine manuelle Dashboard-Karte mit dem folgenden YAML hinzufügen.
3. Über das Zahnrad Lampen und Sensoren auswählen. Die Lampen werden nach HA-Bereichen gruppiert.
4. Unter **Programme** ein Zeit- oder Sensorprogramm anlegen. Die gewählten Lampen und Bereiche gelten für alle Schaltaktionen des Programms.

```yaml
type: custom:light-manager-card
```

## GitHub-Release

Dieses Paket ist für `v9h45n47mh-lab/light-manager` vorbereitet. Bei einem anderen Repository die Felder `documentation`, `issue_tracker` und `codeowners` in `custom_components/light_manager/manifest.json` anpassen. Die entpackten Dateien ins Repository-Stammverzeichnis übernehmen und aus diesem Stand das Release mit Tag `v1.0.2` erstellen. HACS verwendet die Integrationsdateien aus dem getaggten Repository.

[Changelog](CHANGELOG.md) · [MIT-Lizenz](LICENSE)
