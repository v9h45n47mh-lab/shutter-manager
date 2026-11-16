# Zentrale Berechtigungen

Rollenrechte: Programme ansehen, Programme bedienen/Fahrten ändern und Programme/Einstellungen verwalten. Native Geräteberechtigungen bleiben zusätzlich wirksam.

Berechtigungen werden jetzt in **Family Access → Anwendung → Rolle** verwaltet. Benutzer können mehrere Rollen erhalten; ihre Freigaben ergänzen sich. Vorhandene Anwendungsrechte werden einmalig in Rollen mit dem Zusatz „übernommen“ importiert und den bisherigen Benutzern zugeordnet. Dashboardfreigaben und die Aktivierung der Dashboardnavigation werden dadurch nicht verändert.

Zum Entziehen eines Rechts alle zugewiesenen Rollen einschließlich übernommener Rollen prüfen. Neue Benutzer erhalten nach der Übernahme keine automatischen Anwendungsrechte. Echte HA-Administratoren behalten Vollzugriff zur Wiederherstellung. Geräte-, Eigentümer- und externe Kontoberechtigungen gelten zusätzlich; eine Rolle erzeugt keine HA-Administratorrechte.

**Aktualisierung:** zuerst Family Access Manager 1.1.0 oder neuer, danach die beteiligten Anwendungen aktualisieren und Home Assistant neu starten. Solange Family Access nicht eingerichtet ist, bleibt die bisherige Rechtevergabe erhalten. Ist Family Access eingerichtet, aber nicht verfügbar oder zu alt, werden Anwendungsaktionen für normale Benutzer abgelehnt. Lokale Benutzer-/Personen-, Geräte- und Musikkontozuordnungen bleiben für Identität und Eigentum erhalten; Rechte werden zentral vergeben.


## Manual-control card (1.11.0)

- Viewing requires the existing Shutter Manager `view` grant and native HA read access per cover.
- Movement, Stop and planning require `control` or `manage`, plus native HA control and read access to the selected cover. No new central role grant is introduced.
- Card setup requires an actual HA administrator. An application `manage` role alone cannot change device selection, presets or card settings. These checks also apply to direct WebSocket requests.
- Only devices selected in the server-stored card configuration can be operated. Unreadable covers are omitted. Multiple card IDs maintain independent setup; identical IDs share setup.
- Role changes and device revocations are checked on every request; the frontend polls visible data every five seconds. Contacts, shading and opening holds remain effective.


## Manual-card names and transport visibility (1.11.3)

Per-card display names and the direction/Stop visibility option are setup data and require an actual HA administrator on every save. Names are filtered by native device read access. Hiding controls does not create or revoke permissions; all command and planning requests retain the existing central/native checks. Aliases never rename global Shutter Manager or HA entities. Older clients may omit these new fields without erasing saved options.
