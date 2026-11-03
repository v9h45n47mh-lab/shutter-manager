# Light Manager 1.0.3 – Installation

## HACS

Sobald das GitHub-Release veröffentlicht ist, das Repository `https://github.com/v9h45n47mh-lab/light-manager` in HACS unter **Benutzerdefinierte Repositories** mit der Kategorie **Integration** hinzufügen. **Light Manager** herunterladen und Home Assistant neu starten.

Bei einem Wechsel von der manuellen Installation die bestehende Integration eingerichtet lassen. HACS installiert in denselben Ordner `custom_components/light_manager`. Programme und Einstellungen werden von der bestehenden Integration geladen.

## Manuelle Installation


## Update einer vorhandenen Installation

ZIP nach `/config/Light-Manager-1.0.3-GitHub.zip` hochladen, danach im Terminal:

```bash
unzip -o /config/Light-Manager-1.0.3-GitHub.zip 'custom_components/light_manager/*' -d /config && ha core restart
```

Die Integration nicht löschen und nicht erneut hinzufügen. Browser oder HA-App vollständig neu laden. Unter Einstellungen bzw. Hilfe müssen Oberfläche und Integration beide **1.0.3** melden. Entferne einen eventuell manuell angelegten Light-Manager-Eintrag aus den Dashboard-Ressourcen. Die Integration registriert die Karte automatisch.

Lampen, Anzeigenamen, Zuordnungen und weiterhin unterstützte Programme werden übernommen. Frühere eigene Gruppen werden in ihre ausgewählten Lampen aufgelöst. Entfernte Aktionsarten entfallen; Programme ohne verbleibende Aktionen bleiben deaktiviert erhalten. Bei der Umstellung von Schema 1/2/3 auf Schema 4 wird die bisherige Konfiguration automatisch unter `/config/.storage/light_manager_pre_030` gesichert. Die bisherige Konfiguration wird nicht durch eine leere Standardkonfiguration ersetzt. Eine Rückkehr zu einer älteren Version benötigt die ursprüngliche Konfiguration. Bereits verwendete Sensoren werden in die zentrale Auswahl übernommen. Bestehende Sensoraktionen behalten zunächst das bisherige Abschlussverhalten über die Lampeneinstellung. Alte Reihenfolgenzahlen entfallen; bei gleicher Zeit bzw. Sensorpriorität gilt die gespeicherte Listenposition.

### Änderungen nach dem Update

Hue-Szenen sind direkt unter **Farbe** im Programmdialog verfügbar. Die Szenenauswahl in den Einstellungen entfällt; neue Hue-Szenen werden automatisch berücksichtigt. Es werden ausschließlich Szenen angeboten, die anhand ihrer Entity-ID für alle Ziele der Aktion passen. Einmalige Schaltungen für heute lassen sich im Zeitprogramm über **+** erstellen.

Bisherige Szenenaktionen ohne passende Szene für alle Ziele werden deaktiviert und bleiben zur Korrektur erhalten. Vor der Bereinigung wird die ursprüngliche Konfiguration mit Laufzeit unter `/config/.storage/light_manager_pre_040` gesichert. Schlägt die Sicherung fehl, wird die Umstellung abgebrochen.

## Neuinstallation

1. ZIP entpacken.
2. Ordner `custom_components/light_manager` nach `/config/custom_components/light_manager` kopieren.
3. Home Assistant vollständig neu starten.
4. Einstellungen → Geräte & Dienste → Integration hinzufügen → Light Manager.
5. Eine manuelle Dashboard-Karte anlegen:

```yaml
type: custom:light-manager-card
grid_options:
  columns: 12
  rows: auto
```

Die Kartendatei wird automatisch registriert. Bei „Custom element doesn't exist“ Browser/App vollständig neu laden. Das ZIP ist eine Custom Integration, kein HA-Backup und kein Add-on.

## Erster Ablauf

1. Zahnrad → Zonen anlegen.
2. Zimmer anlegen.
3. Unter Lampen auswählen die gewünschten `light.*` anhand von Anzeigename und Entity-ID markieren und speichern. Bereits vorhandene Lichtgruppen stehen in derselben Auswahl.
4. Die ausgewählten Lampen bearbeiten: Anzeigenamen und beliebig viele Zonen-/Zimmerzuordnungen pflegen. Zuordnungen lassen sich auch direkt im Zimmer-/Zoneneditor ändern. Passende Hue-Szenen sind bereits vorausgewählt; bei Bedarf unter Lampe bearbeiten anpassen.
5. Unter Sensoren auswählen die benötigten Sensoren markieren; nur diese sind in Programmen wählbar.
6. Programm erstellen und Schaltaktionen für ausgewählte Lampen, Zonen oder Zimmer hinzufügen. Neue Programme starten deaktiviert.

Helligkeit wird über den Prozentregler eingestellt. Letzte Einstellung behält die vorhandene Helligkeit bei. Farbe bietet Letzte Einstellung, Weißtöne von kalt nach warm sowie einen Farbkreis mit verschiebbarem Marker. Saison erscheint erst nach Setzen von Saison einschränken; Eingabe TT.MM.

Zonen, Zimmer, Lampen und Sensoren sind in den Einstellungen klappbar. Je Zone/Zimmer lassen sich die zugeordneten Lampen zusätzlich einzeln aufklappen. Gewählte Lampen-/Sensorlisten zeigen nur Namen. Name und Entity-ID bleiben in den Auswahldialogen sichtbar. `sensor.*`-Öffnungskontakte nach der Auswahl über das Stift-Symbol bearbeiten und die echten Offen-/Geschlossen-Zustände zuordnen; mehrere Werte durch Komma trennen.

DE/EN in den Einstellungen schaltet Oberfläche und Anleitung um. Lampenstatus und JSON-Sicherung liegen ebenfalls dort.

## Entfernen

Zunächst die Integration unter Geräte & Dienste löschen, dann den Ordner entfernen und Home Assistant neu starten. Schon ausgeführte Lichtbefehle werden nicht rückgängig gemacht.

Sensoraktionen bieten Bei Programmende mit Wiederherstellen, Ausschalten, Beibehalten oder Lampeneinstellung. Nachlauf bzw. Endbedingung und Dauer werden in der Aktion eingestellt. Die Abschlussaktion gilt, wenn kein verbleibendes Programm die Lampe übernimmt.

## Hue-Szenen verwenden

1. Unter Einstellungen eine gewählte Lampe bearbeiten.
2. Gewünschte Hue-Szenen verknüpfen und speichern.
3. Im Programm Ziele wählen, dann Lichtaktion Hue-Szene und die gewünschte verknüpfte Szene wählen.

Auch über Zimmer/Zonen gewählte Lampen stellen ihre Szenen bereit. Die tatsächliche Lampenzuordnung in Hue wird nicht geprüft; der Bearbeiter stellt die passende Verknüpfung sicher. Zeit- und Sensorprogramme zeigen jetzt den Programmnamen als Überschrift.

Alle Klappbereiche starten geschlossen: Einstellungen, Lampenzuordnungen, Messwerte, Programme, Schaltaktionen und Zonen/Zimmer/Hue-Szenen im Lampeneditor. Manuell geöffnete Bereiche bleiben während der Bearbeitung offen.
