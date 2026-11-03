# Changelog

## 1.0.2

- Align time and sensor program group headings with individual program names.

## 1.0.1

- Make program group headings larger and individual program names smaller on desktop and mobile.

## 1.0.0 – 03.11.2026

- Prepare the repository for GitHub releases and installation as a custom HACS integration.
- Show light display names in recent switching commands.

## 0.8.0 – 03.11.2026

- Add a collapsible readings panel to the sensor programs tab with a separately saved expansion state.

## 0.7.7 – 03.11.2026

- Show whether a sensor program meets its conditions and list the reasons when it is inactive. Motion programs can show as active before motion is detected.
- Explain sensor program status in the German and English help.

## 0.7.6 – 03.11.2026

- Keep program controls and sensor pause buttons beside their entries on mobile screens.
- Show weekdays and sensor validity windows in the program list. Remove program type, action count, and vacation badges from individual entries.
- Rewrite the German and English help to match the current interface and behavior.

## 0.7.5 – 03.11.2026

- Update the in-card guide for the current mobile program layout and sensor readings.


## 0.7.4 – 03.11.2026

- Improve navigation, touch targets, and editor layout on mobile displays.
- Hide missing-light warnings from one-time actions in the sensor-program overview.

## 0.7.3 – 03.11.2026

- Select shared lights and areas for all actions in a sensor program. Legacy programs with mixed targets keep their behavior until shared targets are selected and saved.
- Display current sensor readings next to sensor names in Settings.

## 0.7.2 – 03.11.2026

- Show the program name before the action name in the daily schedule.
- Allow lights to be removed when only completed or expired one-time actions reference them.

## 0.7.1 – 03.11.2026

- Hide elapsed recurring switching times from the daily schedule.
- Allow optional names for switching actions and show them in the editor and schedule.
- Show “Not active today” when a sensor program is not scheduled for the current weekday.

## 0.7.0 – 03.11.2026

- Select shared lights and areas for all actions in a time program. Legacy programs with mixed targets keep their existing behavior until shared targets are explicitly selected and saved.
- Show program details in two rows and order weekdays from Monday to Sunday.
- Right-align the additional action button and use the text button style.

## 0.6.1 – 03.11.2026

- Show sensor programs in three lines with the program name, type and time window, and status. Remove inline readings and the edit button from this overview.
- Label the one-time scheduling button “+ Additional action”.

## 0.6.0 – 03.11.2026

- Group programs into collapsible time and sensor sections with persistent manual ordering within each section.
- Duplicate programs as editable, initially disabled copies.
- Expand or collapse all actions in the program editor. Remember program, group, and measurement panel expansion per user in the browser.
- Show today's calculated switching times, including previews for disabled programs.
- Show specific reasons why sensor programs are blocked. Allow pausing sensor programs until midnight and resuming them earlier.
- Hide light counts in the settings area headings.

## 0.5.1 – 03.11.2026

- Lampen in den Einstellungen nach sortierbaren HA-Bereichen gruppiert. Innerhalb eines Bereichs werden Lampen alphabetisch angezeigt.
- Programme übernehmen dieselbe Bereichsreihenfolge und bieten die Auswahl ganzer Bereiche oder einzelner Lampen.
- Der Zeitdialog zeigt Auslöser, Uhrzeit oder Versatz sowie die beiden Zeitgrenzen. Die Grenzen gelten auch für feste Uhrzeiten.

## 0.5.0 – 03.11.2026

- Einmalschaltungen zeigen Lampen und Bereiche als Titel.
- Einmalschaltungen haben bei identischer Uhrzeit Vorrang vor wiederkehrenden Zeitprogrammen.
- Einmaliges Ausschalten steuert eine Hue-Gruppe direkt an, wenn die Aktion für alle Mitglieder Vorrang hat.

## 0.4.2 – 03.11.2026

- Home-Assistant-Bereiche werden automatisch übernommen. Programme können Bereiche und einzelne verwaltete Lampen kombinieren.
- Eindeutige Altziele werden auf HA-Bereiche umgestellt. Bei abweichendem Umfang bleiben die bisherigen Lampen als Einzelziele erhalten.
- Lampen lassen sich mit Bestätigung aus den Einstellungen entfernen.
- Erfolgreiche Einmalschaltungen verschwinden aus dem Zeitprogramm.

## 0.4.1 – 02.11.2026

- Szenen-Dropdowns im geöffneten Programmeditor bei Katalogabrufen aktualisiert. Neue passende Szenen erscheinen ohne erneutes Öffnen; entfernte Optionen verschwinden. Eine gelöschte gewählte Szene bleibt als nicht verfügbar erkennbar. Entwurf, Fokus und aktuelle Auswahl bleiben erhalten.
- Einmalschaltungen ausschließlich im Zeitprogramm, nicht unter Programme. Bearbeiten und Löschen direkt an der Tageszeile; deaktivierte heutige Einträge bleiben verwaltbar. Mobile Bedienelemente umbrechen in eine eigene Zeile.
- Keine Änderung an Ausführungslogik oder Schema 4. Vorhandene Einmalschaltungen werden automatisch in der neuen Ansicht dargestellt.

## 0.4.0 – 02.11.2026

- Automatische aktuelle Hue-Szenen unter Farbe im Programmdialog; keine Auswahl in den Einstellungen. Nur für alle Ziele anhand des vollständigen technischen Namens passende Szenen; neue Szenen automatisch verfügbar.
- Plus-Button im Zeitprogramm für einmalige Schaltungen heute mit fester Uhrzeit und Neustarterhalt; keine Wiederholung an Folgetagen.
- Datenübernahme mit Sicherung vor Deaktivierung nicht mehr zulässiger alter Szenenaktionen. Schema 4 bleibt erhalten.

## 0.3.3 – 02.11.2026

- Nur Hue-Szenen mit dem vollständigen technischen Lichtnamen als Präfix und nichtleerem Suffix sind zulässig (`light.ambiente` → `scene.ambiente_…`). Andere Szenen werden ausgeblendet; auch das Backend prüft die Namensregel. Die tatsächlichen Hue-Mitglieder werden weiterhin nicht geprüft.
- Bestehende unpassende Szenenverknüpfungen beim Laden bereinigt. Verwaiste Schaltaktionen bleiben deaktiviert zur Korrektur erhalten. Originalkonfiguration samt Laufzeit vor der Bereinigung unter `light_manager_pre_033` gesichert; keine Umstellung bei Sicherungsfehler.
- Zugeordnete passende Hue-Szenen in Schaltaktionen auswählbar und auslösbar, auch bei Zielen über Zimmer und Zonen. Es werden ausschließlich die ausgewählten Szenenverknüpfungen berücksichtigt; neue Vorschläge ersetzen keine gespeicherten Abwahlen.
- Szenennamen ohne vorangestellten Bereich: beispielsweise Nachtlicht statt Badezimmer Nachtlicht und Konzentrieren statt Büro Manuel Konzentrieren. Gilt im Lampeneditor und Programmdialog, Entity-IDs bleiben unverändert.
- Lampenauswahl mit kompakten bündigen Spalten Name/Entity-ID, kleinerer Schrift und weniger Abstand. Gewählte Lampen bleiben oben, übrige unter der Trennlinie; Suche und sofortige Umsortierung bleiben erhalten.
- Integration und Oberfläche 0.3.3, bestehendes Schema 4. DE/EN und Darstellung bei 390 Pixel Breite geprüft.

## 0.3.2 – 02.11.2026

- Hue-Szenenliste in bündigen Spalten für Name und Entity-ID; lange Angaben umbrechen ohne Überlappung.
- Automatische Szenenverknüpfung über den vollständigen technischen Lichtnamen mit anschließendem Unterstrich (`light.ambiente` → `scene.ambiente_…`), beim Übernehmen der Lampenauswahl oder ersten Bearbeiten einer Lampe. Manuelle Zuordnungen bleiben erhalten, Treffer können abgewählt werden; gespeicherte Abwahlen bleiben bestehen. Optionaler Knopf ergänzt neue passende Szenen. Keine Prüfung tatsächlicher Hue-Mitglieder.
- Lampen direkt im Zimmer-/Zoneneditor auswählen und abwählen. Bestehende Mehrfachzuordnungen, Anzeigenamen und übrige Lampeneinstellungen bleiben erhalten.
- Lampenauswahl in zwei alphabetisch nach Namen sortierten Bereichen: ausgewählt oben, übrige unter einer Linie. Sofortiges Umsortieren bei Änderungen; Suche und Tastaturbedienung bleiben erhalten.
- Zonen, Zimmer, Lampen und Sensoren in den Einstellungen kompakter: kleinere Schrift und weniger Abstand, bedienbare Bearbeiten-/Löschen-Schaltflächen bleiben erhalten.
- Urlaubsmodus direkt unter Sprache, entsprechend Shutter Manager. Alle Klappbereiche starten weiter geschlossen.
- Integration und Oberfläche 0.3.2; Schema 4 mit optionaler Kennzeichnung bereits gespeicherter Namenszuordnungen. Vorhandene Konfiguration und Laufzeit bleiben erhalten. Installierbares ZIP für manuellen Upload.

## 0.3.1 – 02.11.2026

- Hue-Szenen im Lampeneditor untereinander, jeweils mit Anzeigename und Entity-ID; lange Angaben umbrechen ohne Überlappung.
- Zeitprogramm kompakter: nur Programmname und Einschalten/Ausschalten neben Uhrzeit und Auslassen. Helligkeit, Farbwerte, Szenenname, Zielangaben und zusätzliche Zeitdetails entfallen in dieser Liste.
- Zonen, Zimmer und Hue-Szenen im Lampeneditor einzeln klappbar. Alle Klappbereiche starten beim Öffnen geschlossen; manuelles Aufklappen bleibt während der Bearbeitung erhalten.
- Bestehende Konfiguration und Ausführungslogik unverändert, Schema 4 bleibt erhalten.

## 0.3.0 – 02.11.2026

- Zonen und Zimmer in den Einstellungen auf-/zuklappbar; je einzelner Zone und Zimmer die zugeordneten Lampen separat klappbar.
- Hue-Szenen wieder aufgenommen. Mehrere manuelle Szenenverknüpfungen je Lampe, auch für native Lichtgruppen. Programm-Szenenauswahl über direkte Lampen sowie Zimmer-/Zonenzuordnungen. Kein Abgleich mit den tatsächlichen Szenenmitgliedern in Hue.
- Eigene Lichtaktion Hue-Szene; Lichtwerte kommen aus Hue. Ein nativer Szenenaufruf je wirksamem Auftrag, mit transition: 0. Vorrang bezieht sich auf manuell verknüpfte Ziele; die Szene wartet als Ganzes bei höherem Vorrang einer zugeordneten Lampe.
- Zeitprogramm und Sensorprogramme im Zeilenlayout des Shutter Managers. Programmname als Überschrift, ohne angehängte Zimmer-/Zonen-/Lampennamen. Zeitprogramm mit Uhrzeit, Lichtaktion, Zielangaben und Auslassen; Sensoransicht fasst Aktionen je Programm zusammen und zeigt Status und Sensorwerte.
- Schema 4 mit unveränderter Übernahme bestehender Konfiguration und Laufzeit. Original vor Umstellung unter light_manager_pre_030 gesichert; alte Sicherungsdateien bleiben erhalten.
- Szenenbesitzer, gespeicherte Ausgangszustände und ausstehende Rückkehr bleiben bei Neustarts erhalten. Szenendienstfehler werden angezeigt und erneut versucht.
- Neue Oberflächentexte und Anleitung in Deutsch und Englisch.

## 0.2.2 – 02.11.2026

- Formatierung der Lampen-/Sensorauswahl korrigiert: feste Abstände, Name über Entity-ID, sauberer Umbruch und keine überlappenden Zeilen auch bei langen Listen.
- Gewählte Lampen und Sensoren in den Einstellungen auf-/zuklappbar und nur mit Anzeigenamen. Auch Sensoren in Programmen erscheinen nur mit Namen. Auswahldialoge zeigen weiterhin Name und Entity-ID.
- Öffnungskontakte unterstützen ausgewählte sensor.* zusätzlich zu binary_sensor.*. In den Einstellungen sind Offen-/Geschlossen-Zustände konfigurierbar; mehrere Werte wie open/tilted oder 1/2 werden unterstützt. Unbekannte und nicht zugeordnete Werte geben einen aktiven Vorrang nicht frei.
- Zonen, Zimmer und Lampen bleiben frei kombinierbar. Weißtonprüfung berücksichtigt zugeordnete Lampen und native Gruppen mit einzelnen oder mehreren Mitgliedern. Meldungen für leere Zimmer/Zonen präzisiert.
- Kopfbereich/Messwerte an Shutter Manager angeglichen: separate Sonnenzeile, gruppierte Sensorwerte, gleiche Abstände, Schriftgrößen und Symbole. Werte aktualisieren sich bei geöffnetem Editor; der Klappzustand bleibt je Browser-Benutzer erhalten.
- Bestehende Konfiguration und Schema 3 bleiben erhalten; zusätzliche Kontaktzuordnungen sind optional. Neue Texte und Anleitung in Deutsch/Englisch.

## 0.2.1 – 02.11.2026

- Lampenauswahl mit Anzeigename und Entity-ID sowie Suche nach beiden Angaben.
- Zielauswahl im Programm in unabhängig aufklappbare Zonen, Zimmer und Lampen mit Auswahlzähler gegliedert.
- Zentrale Sensorauswahl in den Einstellungen, ebenfalls mit Name und Entity-ID. Programme können ausschließlich ausgewählte Sensoren verwenden; verwendete Sensoren können nicht unbemerkt abgewählt werden.
- Farbkreis mit weißer Mitte, verschiebbarem Marker und Farbvorschau; Maus, Touch und Tastatur. Separater Helligkeitsregler und Weißtonregler bleiben erhalten.
- Numerische Reihenfolge entfernt. Bei gleicher Schaltzeit bzw. Sensorpriorität gewinnt das weiter oben gespeicherte Programm. Verschiedene Schaltzeiten verwenden weiterhin den zuletzt fälligen Auftrag.
- Einstellbare Sensor-Abschlussaktionen: vorherigen Zustand wiederherstellen, ausschalten, beibehalten oder Lampeneinstellung. Kontaktende nach Schließen, Bewegungsende nach x Sekunden ohne Bewegung.
- Lux-Ende über oder unter einer getrennten Endschwelle für x Sekunden. Rückkehr berücksichtigt verbleibende Programme, verschachtelte Sensorvorränge, Neustarts und Dienstfehler.
- Schema 3: verwendete Sensoren werden aus alten Programmen übernommen; bestehendes Abschlussverhalten bleibt erhalten. Ursprüngliche Daten werden vor der Umstellung unter light_manager_pre_021 gesichert.
- Neue Texte und Anleitung in Deutsch und Englisch.

## 0.2.0 – 02.11.2026

- Einstellungen in der Reihenfolge Zonen, Zimmer, Lampen. Technische Mehrfachauswahl aller verfügbaren Lichtentitäten mit Suche. Nur ausgewählte Lichter stehen für weitere Zuordnungen und Programme bereit.
- Mehrfachzuordnung zu Zonen/Zimmern und Anzeigenamen erhalten. Programme schalten gewählte Lichtentitäten, Zonen oder Zimmer.
- Eigene Gruppenverwaltung und Hue-Szenen entfernt. Vorhandene HA-/Hue-Lichtgruppen bleiben als normale Lichtentitäten nutzbar; geladene Hue-Topologie kann Mitgliedschaften automatisch bereitstellen.
- Helligkeit per Prozentregler mit Letzte Einstellung. Saison standardmäßig verborgen, Haken Saison einschränken und Eingabe TT.MM.
- Programmdialog an Shutter Manager angeglichen: Name/Typ nebeneinander, Aktiv/Urlaub nebeneinander, Wochentagschips, Schaltaktionen und feste Fußzeile. Reihenfolge unter Erweitert.
- Sonnen-Symbole verwenden das Theme-Blau des Shutter Managers.
- Schema 2 mit Übernahme bestehender Einstellungen. Bisherige eigene Gruppen werden in direkte ausgewählte Ziele aufgelöst. Entfernte Aktionen werden nicht ausgeführt; Programme ohne verbleibende Aktion werden deaktiviert. Ursprüngliche Daten werden vor der Umstellung gesichert.


## 0.1.2 – 02.11.2026

- Sonnenaufgang und Sonnenuntergang: dieselben SVG-Pfade, Strichstärken und Abmessungen wie im Shutter Manager 1.2.0.
- Sprachwahl DE/EN in den Einstellungen. Oberfläche, Anleitung, Beschriftungen und eigene Validierungsfehler übersetzt; Benutzernamen und Entitätsnamen bleiben unverändert. Sprachwahl je HA-Benutzer in diesem Browser gespeichert.
- Keine einstellbaren Übergangszeiten. Ein-/Ausschalten und native Hue-Szenen erhalten ausdrücklich `transition: 0`. Alte gespeicherte Übergangszeiten werden beim Laden/Import entfernt.
- Farbauswahl in Programmen: Letzte Einstellung, Weißtöne, Farbe. Letzte Einstellung übermittelt keine Farbparameter.
- Weißtonregler links Kaltweiß, rechts Warmweiß; verwendet die Schnittmenge der unterstützten Kelvin-Bereiche aller ausgewählten Einzellampen, auch bei Gruppen und Zimmer-/Zonenzuordnungen. Unpassende Auswahlen werden vor dem Speichern angezeigt.
- Speicherformat, bestehende Lampen- und Programm-IDs bleiben kompatibel.

## 0.1.1 – 01.11.2026

- Layout am Shutter Manager ausgerichtet: drei Reiter mit Hilfe und Einstellungen rechts, aufklappbare Messwerte, Programme mit Schaltern und Stift-Symbol, kompakte Listen mit Trennlinien.
- Großen Titelbereich, Werbetext, doppelte Überschriften und wiederholte Erklärungstexte entfernt. Ausführliche Hilfe bleibt unter dem Fragezeichen erhalten.
- Einstellungen als durchgehende Abschnitte für Lampen, Gruppen, Zimmer, Zonen und Hue-Szenen. Lampenstatus bleibt über die Einstellungen erreichbar.
- Schaltaktionen im Editor auf- und zuklappbar; Kopieren/Entfernen als Icons. Dialogkopf und Speichern bleiben sichtbar, während der Formularbereich scrollt.
- Glühbirnen-Icon für die Integration, inklusive heller/dunkler PNG-Varianten mit 256 und 512 Pixeln. Kein externes Branding-Repository erforderlich.
- Bestehende Konfiguration und Steuerungslogik bleiben kompatibel.

## 0.1.0 – 01.11.2026

Erste manuell installierbare Version als eigenständige Integration und Dashboard-Karte. Lampen, Mehrfachzuordnung zu Zimmern/Zonen, Gruppen, Hue-Szenen, Zeit- und Sensorprogramme, zentrale Vorrangsentscheidung, Neustartdaten und JSON-Sicherung. Kein GitHub-Repository und keine HACS-Anbindung.
