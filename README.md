# Beschattungsmanager

A local Home Assistant integration and dashboard card for cover schedules, sensor shading and window-contact opening programs.

**Version 0.10.1 · Home Assistant Core ab 2026.10.0 · deutsche Dashboard-Oberfläche**

Der Beschattungsmanager steuert Rollläden und Jalousien über bereits vorhandene `cover`-Entitäten. Geräte, Sensorregeln und Programme werden in einer Dashboard-Karte gepflegt.

## Funktionen

- Zeitprogramme mit einzeln auswählbaren Wochentagen, festen Uhrzeiten oder Sonnenaufgang/-untergang, Versatz sowie frühestens/spätestens.
- Höhe und bei Jalousien Lamellen; eine Fahrt steuert genau ein Gerät. 0 % Höhe bedeutet unten, 100 % oben.
- Temperatur- und/oder Helligkeitsregeln mit Hysterese und Freigabeverzögerung. Bei zwei Sensoren gilt eine UND-Verknüpfung.
- Öffnungskontakte können Fahrten erlauben, verwerfen oder bis zum Schließen zurückstellen. Neuere fällige Fahrten ersetzen ältere wartende Ziele.
- Öffnungsprogramme mit Wochentagen, Zeitfenster, Zielhöhe und Lamellen. Die Position bleibt bis zum Schließen aller Kontakte vor niedrigeren Programmen geschützt, auch nach Zeitfensterende und Neustart.
- Priorität beim Schließen: aktive Temperatur-/Helligkeitsbeschattung, aktueller Zeitplan, sonst Position vor dem Öffnen einschließlich Lamellen.
- Jährliche Gültigkeitszeiträume, Urlaubsausnahmen und Tagespausen für Sensorprogramme.
- Kompakte Liste zukünftiger und nachzuholender Fahrten mit sichtbarem Wartegrund und einmaligem Auslassen.
- Einklappbare Programme/Fahrten, Kopieren und Verschieben, Stift-Symbole zum Bearbeiten, Sensoranzeigenamen und Konfigurationssicherung.

Die vollständige Anleitung ist unter **Howto ?** in der Karte und in [HOWTO.md](HOWTO.md) enthalten. Änderungen stehen in [CHANGELOG.md](CHANGELOG.md).

## Installation über HACS

Dieses Repository wird zunächst als **benutzerdefiniertes Repository** hinzugefügt. Es ist dadurch nicht automatisch Bestandteil des HACS-Standardkatalogs.

1. HACS öffnen → Menü oben rechts → **Benutzerdefinierte Repositories**.
2. Repository `https://github.com/v9h45n47mh-lab/beschattungsmanager` eintragen und Typ **Integration** auswählen.
3. **Beschattungsmanager** suchen, herunterladen und Home Assistant vollständig neu starten.
4. **Einstellungen → Geräte & Dienste → Integration hinzufügen → Beschattungsmanager**.
5. Dem Dashboard eine manuelle Karte hinzufügen:

```yaml
type: custom:rollladenplaner-card
grid_options:
  columns: 12
  rows: auto
```

Die Integration lädt die Kartendatei selbst. Eine zusätzliche Dashboard-Ressource ist normalerweise nicht erforderlich. Die interne Domain `rollladenplaner` bleibt aus Kompatibilitätsgründen erhalten.

### Bestehende manuelle Installation übernehmen

Die bestehende Integration und ihre Programme beibehalten. Das Repository wie oben in HACS hinzufügen, herunterladen und Home Assistant vollständig neu starten. Danach Browser/App vollständig neu laden. Unter Howto müssen Oberfläche und Integration dieselbe Version anzeigen.

Nicht gleichzeitig alte und neue manuelle Dashboard-Ressourcen laden. Falls bereits eine manuelle Ressource gepflegt wird, lautet die versionsbezogene URL `/rollladenplaner/rollladenplaner-card.js?v=0.10.1`.

## Manueller Download

Unter **Releases** werden folgende Archive bereitgestellt:

- `Beschattungsmanager-0.10.1.zip`: vollständiges Paket mit `custom_components/rollladenplaner/`, Anleitung und Tests.
- `rollladenplaner.zip`: nur der Inhalt des Integrationsordners; direkt nach `/config/custom_components/rollladenplaner/` entpacken.

Für das vollständige Paket nach Upload nach `/config/`:

```bash
unzip -o /config/Beschattungsmanager-0.10.1.zip 'custom_components/rollladenplaner/*' -d /config
ha core restart
```

Danach Browser/App vollständig neu laden. Die normale HACS-Installation nutzt das Repository-Layout `custom_components/rollladenplaner` und funktioniert unabhängig von den zusätzlich erzeugten ZIP-Assets.

## Betrieb und Grenzen

Die Integration benötigt vorhandene Positionssteuerung und Positionsrückmeldungen. Ein manuell gewählter Gerätetyp erzeugt keine fehlende Aktor-Funktion. Es wird zuerst die Höhe, dann die Lamellenposition geprüft. Nach 150 Sekunden je Bewegungsphase ohne Zielbestätigung wird ein Fehler protokolliert und, falls unterstützt, gestoppt.

Die Auswertung erfolgt alle fünf Sekunden. Unbekannte Kontakte gelten nicht als geschlossen. Öffnungsvorrang betrifft nur automatische Fahrten dieses Beschattungsmanagers; manuelle Bedienung und andere Integrationen arbeiten unabhängig. Wind-, Regen- und Frostschutz sowie Feiertagsdaten sind nicht eingebaut.

Administratoren konfigurieren. Andere Benutzer benötigen passende native Lese- und Steuerrechte. Konfiguration und offene Aufträge werden lokal gespeichert. Die Dashboard-Oberfläche ist deutsch; die Integration enthält deutsche und englische Übersetzungen.

## Entwicklung und Prüfung

```bash
python3 -m pip install -r tests/requirements.txt
python3 -m unittest discover -s tests -q
node --check custom_components/rollladenplaner/frontend/rollladenplaner-card.js
python3 scripts/build_release.py --check-only
python3 scripts/build_release.py --tag v0.10.1
```

Browserprüfungen verwenden Playwright und Chromium:

```bash
npm install --prefix .ci playwright
npx --prefix .ci playwright install --with-deps chromium
NODE_PATH="$PWD/.ci/node_modules" node tests/ui-test.cjs
NODE_PATH="$PWD/.ci/node_modules" node tests/save-flow.cjs
```

234 Verhaltenstests sowie Browser- und Speichertests prüfen unter anderem Prioritäten, Neustarts, Rückkehrpositionen, Konflikte, Motorsequenz und Rechte. Die Tests simulieren Home Assistant und Motoren; sie ersetzen keine Prüfung an realen Aktoren.

GitHub Actions prüft Tests, HACS und Hassfest. Nach dem Veröffentlichen einer Release baut der Release-Workflow die ZIP-Dateien und hängt sie an. Der Tag muss zur Version in `manifest.json` passen.

## Lizenz

[MIT](LICENSE)
