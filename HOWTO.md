# Howto – Shutter Manager 1.5.4

Die Oberfläche verwendet das lokal mitgelieferte HA UI Kit 1.2.2 für Symbole, Farben, Schriften, Abstände, Programm-Aktionen und Dialoge. Sortierpfeile nutzen die HA-Akzentfarbe. Dialoge unterstützen Escape, begrenzte Tab-Navigation und die Rückkehr zum auslösenden Bedienelement. Die UI-Version steht in Einstellungen und Hilfe. Programmname, Zusatztexte und Fahrten sind mit der gemeinsamen Einrückung von 28 px bündig ausgerichtet. Allgemeine Symbolbuttons behalten ihren UI-Kit-Abstand.

Der Shutter Manager verbindet Zeitprogramme, übergeordnete Beschattungsprogramme und Öffnungsprogramme. Ab 1.3.0 enthalten die Geräteeinstellungen nur Sensorzuordnungen und Kontakte. Gemeinsame Schwellenwerte, Verzögerungen, Gültigkeit und Fahrziele werden im Programm gepflegt. Das reine Zuordnen eines Sensors löst keine Fahrt aus.

## Schnellstart

1. Einstellungen → Rollläden auswählen: bestehende HA-Geräte übernehmen und bei Bedarf Gerätetyp sowie Anzeigename ändern.
2. Einstellungen → Sensoren auswählen: Temperatur-, Helligkeits- und Kontaktsensoren suchen, auswählen und speichern. Bereits verwendete Sensoren bleiben ausgewählt.
3. Rollladen bearbeiten → Sensorzuordnungen → + Sensorzuordnung: nur Name und zugehörige Temperatur-/Helligkeitssensoren pflegen. Öffnungskontakte stehen separat. Mehrere Sensorzuordnungen pro Gerät bleiben möglich.
4. Programme → + Programm → Sensorprogramm → Temperatur / Helligkeit: Name, Aktivierung, Urlaubspause, Wochentage, Saison und tägliches Zeitfenster einstellen.
5. Gemeinsame Rollläden und Jalousien auswählen. Jedes Gerät wird anhand seiner eigenen Sensoren ausgewertet. Unter Auswertung Helligkeit, Temperatur oder beide wählen und gemeinsame Schwellenwerte sowie Verzögerungen festlegen.
6. Abschlussaktion wählen. Die automatisch ergänzten Fahrten aufklappen und Zielhöhe sowie bei Jalousien die Lamellen einstellen. Die Fahrt verweist auf die passende Sensorzuordnung des Geräts. Speichern übernimmt den gesamten Entwurf.

## Beschattungsbedingungen

Bei Helligkeit beginnt die Beschattung ab der oberen lx-Schwelle, bei Temperatur ab der oberen °C-Schwelle. Bei beiden Sensorarten müssen beide oberen Schwellen erreicht sein (UND). Für die Freigabe genügt eine der unteren Schwellen (ODER). Die Freigabeschwelle muss jeweils unter der Aktivierungsschwelle liegen. Messwerte werden in °C und lx ausgewertet; °F, Kelvin und klx werden umgerechnet.

Aktivierungs- und Freigabebedingung müssen jeweils während der gesamten eingestellten Verzögerung erfüllt bleiben. Ändert sich die Bedingung oder fehlt ein benötigter Messwert, beginnt die entsprechende Wartezeit bei erneut erfüllter Bedingung von vorn. Jeder Rollladen hat einen eigenen Zustand und eigene Wartezeiten. Ein fehlender Sensorwert eines Geräts löst keine Rückfahrt aus und ersetzt keinen anderen Sensor.

Neue Programme starten mit 0 Sekunden Aktivierungs- und 300 Sekunden Freigabeverzögerung. 0 bedeutet keine zusätzliche Wartezeit. Bei bereits erfüllter Bedingung starten erlaubt eine Auslösung auch beim Start oder Neustart mit bereits hohen Werten. Ohne diese Option wird ein sofort erfüllter Zustand zunächst als Ausgangszustand eingelesen.

## Gültigkeit und Abschlussaktion

Gleiche Von-/Bis-Uhrzeiten bedeuten ganztägig. Normale Zeitfenster schließen den Beginn ein und das Ende aus. Bei Fenstern über Mitternacht gelten nach Mitternacht Wochentag und Saison des Starttags. Saisonanfang und -ende zählen mit; Winterzeiträume über den Jahreswechsel sind möglich. Zeitlich überlappende Beschattungsprogramme für dasselbe Gerät werden beim Speichern abgewiesen. Nicht überlappende Zeitfenster dürfen unterschiedliche Schwellen nutzen.

Die Abschlussaktion gilt bei sensorischer Freigabe und beim Verlassen des Zeitfensters beziehungsweise der Kalendergültigkeit nach tatsächlich ausgeführter Beschattung. Feste Rückfahrposition verwendet die Freigabefahrt pro Gerät. Aktuelle Zeitplanposition verwendet das inzwischen gültige Zeitplanziel und ersatzweise die vor der Beschattung gemeldete Position. Position vor Beschattung stellt diese Ausgangsposition einschließlich bekannter Lamellen wieder her. Position beibehalten löst keine Rückfahrt aus. Fehlt die Ausgangsposition, wird kein Ziel erfunden; eine Meldung erscheint im Verlauf.

Aussetzen, Urlaubspause oder Deaktivieren löst keine pauschale Rückfahrt aus. Kontakte und Öffnungsvorrang gelten auch für Rückfahrten. Eine am Zeitfensterende noch blockierte Rückfahrt bleibt wartend, solange das Programm weiterhin aktiviert ist; ein neuer Zeitplan oder Beschattungsauftrag kann sie ersetzen.

## Übernahme vorhandener Einstellungen

Beim Update werden bisherige Schwellenwerte und Freigabeverzögerungen aus den Sensorregeln in die zugehörigen Programme übernommen. Sensoren, Fahrziele, Wochentage, Saison und Aktivierung bleiben erhalten. Verwendet ein altes Programm unterschiedliche Bedingungen oder Abschlussaktionen, entstehen getrennte Programme mit Namenszusatz. Unbenutzte alte Regeln mit Parametern werden als deaktivierte Programme übernommen. Mehrere Sensorzuordnungen bleiben erhalten.

Vor der ersten Speicherung des neuen Modells bleibt die ursprüngliche Konfiguration samt Laufzeitdaten als migration_backup im lokalen Integrationsspeicher erhalten. Zusätzlich vor dem Update eine Sicherung über Einstellungen erstellen. Wiederhergestellte Programme bleiben zunächst deaktiviert. Alte Karten können das neue Datenmodell nicht überschreiben: nach dem Update Home Assistant Core vollständig neu starten und Browser oder App neu laden. Oberfläche und Integration müssen beide 1.5.4 anzeigen.

## Einstellungen und Sensor-Auswahl

Die Einstellungen verwenden die gemeinsamen Bereichs- und Eintragsabstände aus HA UI Kit 1.2.2: Sprache mit Sprachwahl rechts, kompakter Urlaubsmodus, Geräte- und Sensorzeilen mit Auswahlknöpfen rechts, Aktueller Status und Heutige Historie mit aufklappbarer Überschrift und Pfeil wie bei den anderen Bereichen, danach Sicherung. Zum Auf- und Zuklappen die Überschrift anklicken oder mit Enter beziehungsweise Leertaste bedienen; zusätzliche Anzeigen-Buttons entfallen. Ausgewählte Sensoren lassen sich direkt im aufgeklappten Bereich Sensoren über ihr Stiftsymbol umbenennen. Jeder Dialog ändert nur den gewählten Sensor; ein leeres Namensfeld stellt den HA-Namen wieder her. Der separate Punkt Sensoranzeigenamen entfällt. Aktueller Status enthält ausschließlich die Gerätenamen und Positionswerte. Befehle und Ergebnisse stehen ausschließlich in der Heutigen Historie. Alle Bereiche lassen sich unabhängig einklappen. Sensor-Auswahl, eigene Anzeigenamen und Konfiguration bleiben nach Neustart erhalten und sind Teil der Sicherung. Leer gelassene Anzeigenamen verwenden den HA-Namen.

Sensorvorschläge werden nach Geräteklasse oder Einheit gefiltert. Alle Sensoren anzeigen erlaubt die Zuordnung von Sensoren mit unvollständigen Metadaten. Vor dem Speichern Sensorart und Einheit prüfen. Aktueller Status zeigt den Gerätenamen links und Höhe/Lamellen rechts; Offen/Geschlossen und die doppelte Positionszeile entfallen. Rollläden zeigen nur die Höhe. Eine zusätzliche Liste Letzte Fahrbefehle entfällt. Der Bereich Aktueller Status ist zuklappbar.

## Navigation und Messwerte

Programme bleibt links als Text. Direkt daneben öffnen ein Uhr-Icon das Zeitprogramm und ein Sensor-Icon die Sensorprogramme. Tooltips und Beschriftungen für Screenreader benennen beide Reiter. Hilfe (?) und Einstellungen bleiben rechts.

Helligkeit wird vollständig in lx angezeigt, mit Tausenderpunkten und ohne Nachkommastellen, beispielsweise 20.300 lx statt 20k lx. Bruchteile werden auf ganze lx gerundet. klx-Messwerte werden zuvor in lx umgerechnet. Das Format mit Punkten gilt auch bei englischer Oberfläche; Rohwerte und Programmschwellen werden nicht verändert.

## Heutige Historie

Ein eigener, unabhängig zuklappbarer Punkt in den Einstellungen zeigt die heute abgeschlossenen oder fehlgeschlagenen Fahrbefehle chronologisch mit Uhrzeit, Gerätename, Befehl/Ziel und Ergebnis. Wartende oder geplante Fahrten bleiben im Zeitprogramm. Erfolgreich bedeutet, dass die Integration den Zielzustand bestätigt hat; ein akzeptierter Serviceaufruf allein genügt nicht. Erkannte Fehler werden als Fehlgeschlagen mit Grund angezeigt.

Die Historie bleibt nach Neuladen und Neustart erhalten und wechselt mit dem lokalen Home-Assistant-Tag. Sie ist nicht auf die letzten 20 Meldungen begrenzt. Beim ersten Update werden verfügbare ältere Protokolleinträge übernommen; deren fehlende Zielwerte werden nicht ergänzt. Nur berechtigte Geräte sind sichtbar. Die Sicherung exportiert weiterhin die Konfiguration; die Tageshistorie gehört zu den lokalen Laufzeitdaten.

## Zeitprogramme und Einzelfahrten

Zeitprogramme unterstützen einzelne Wochentage, feste Uhrzeit, Sonnenaufgang/-untergang, Versatz und frühestens/spätestens. Die Liste wird nach der wirksamen Uhrzeit für heute sortiert. Eine zukünftige Programmfahrt kann einmal ausgelassen und wieder eingeplant werden. Bereits erledigte oder verworfene Fahrten werden nicht erneut nachgeholt. Eine ausdrücklich in die Zukunft verschobene Fahrt wird neu eingeplant.

Im Zeitprogramm über + Einzelfahrt eine Fahrt für genau ein Gerät am heutigen Tag einplanen. Sie wird chronologisch einsortiert und erzeugt kein gespeichertes Programm. Nach erfolgreicher Ausführung verschwindet sie. Bei Blockierung oder Fehler bleibt sie sichtbar; abgelaufene Fahrten werden am Folgetag verworfen. Lamellen sind nur bei Jalousien verfügbar.

## Öffnungsprogramme

Am Gerät einen Öffnungskontakt zuweisen. Im Sensorprogramm die Art Öffnungskontakt, Wochentage, Von/Bis und optional Saison einstellen. Eine Fahrt pro Gerät mit Zielhöhe und optionalen Lamellen hinzufügen. Bei bereits geöffnetem Fenster starten erlaubt eine Auslösung mit bereits offenem Kontakt. Ein offener Kontakt genügt zum Halten; die eigene Kontaktsperre verhindert die Öffnungsfahrt nicht.

**Ein aktiver Öffnungsvorrang steht über Temperatur/Helligkeit und Zeitprogrammen.** Er bleibt bis zum bestätigten Schließen aller Kontakte erhalten, auch nach Ende des Zeitfensters, Tageswechsel oder Neustart. Nicht verfügbare Kontakte zählen nicht als geschlossen. Nach dem Schließen gilt: aktive Beschattung, dann eine während der Öffnung fällige und noch wartende Zeitfahrt, sonst die vor dem Öffnen gemeldete Position. Bereits abgeschlossene Zeitfahrten werden nicht wiederholt.

## Vorrang und Nachholen

Ohne Öffnungsvorrang gelten die Kontaktregeln: Trotzdem fahren, Nicht fahren oder Fahrt nachholen. Nicht fahren verwirft die konkrete Fahrt. Bei Nachholen wird das Ziel nach bestätigtem Schließen beim nächsten Auswertungszyklus erneut geprüft. Neuere fällige Zeitfahrten ersetzen ältere wartende Ziele desselben Geräts. Aktive Beschattung hält Zeitfahrten zurück; diese aktualisieren das Ziel für danach.

## Manuelle Fahrten und Aussetzen

Eine manuelle Fahrt deaktiviert keine Regel. Solange die Sensorbedingung erfüllt bleibt, wird die Beschattung nicht ständig erneut angefahren. Nach Freigabe und erneuter Aktivierung kann sie wieder auslösen. Andere Steuerungen und manuelle Bedienung arbeiten unabhängig.

Im Tab Sensorprogramme lässt sich ein Programm bis zur nächsten lokalen Mitternacht pausieren, auch über Neustarts hinweg. Offene Beschattungsaufträge dieses Programms werden aufgehoben. Ein bereits bestehender Öffnungsvorrang bleibt bis zum Schließen geschützt und kehrt danach zurück. Reaktivierung kann bei weiterhin hohen Werten erneut auslösen.

## Oberfläche, Kopieren und Sicherung

Der Urlaubsmodus wird ausschließlich in den Einstellungen geschaltet. Die Programmübersicht zeigt alle Programme; es gibt dort keinen Urlaubsknopf und keinen Urlaubsfilter. Programmgruppen, Programmzeilen, Fahrten und gemeinsame Bedienelemente verwenden vollständig die Gestaltung aus HA UI Kit 1.2.2. Schriftart, Schriftgrößen, Schriftstärken, Einrückungen und Abstände werden ohne lokale CSS-Überschreibungen aus dem UI Kit übernommen. Die Programmübersicht zeigt keine Fahrtenanzahl und keine Programmart mehr. Wochentage, Zeitfenster und Beschattungsschwellen bleiben als kompakte Angaben sichtbar. Der Hinweis Pause im Urlaub entfällt in der Übersicht. Auch aufgeklappte Programme und Fahrten verwenden die gemeinsamen UI-Kit-Abstände. In der mobilen Ansicht bis 600 px stehen Schalter und Bearbeiten neben dem Programmnamen; Sortierpfeile und Programm kopieren werden ausgeblendet. In der Desktopansicht sind Sortieren und Kopieren verfügbar. Programme und Fahrten lassen sich einzeln oder gesammelt auf-/zuklappen. Neue Fahrten öffnen direkt. Kopieren und Verschieben einzelner Fahrten erfolgt über eine Zielprogrammauswahl und wird erst beim Speichern gemeinsam übernommen. Es gelten danach Bedingungen, Tage, Urlaub und Gültigkeit des Zielprogramms. Bei Beschattungsprogrammen müssen Sensorzuordnung und benötigte Sensorarten weiterhin passen. Konflikte werden gemeldet; Abbrechen verwirft den Entwurf. Ganze Programme können mit neuer ID kopiert werden.

Der Messwertebereich im Programme-Tab zeigt Sonnenzeiten, Kontakte, Temperatur und Helligkeit; Sensoren werden nach Anzeigename sortiert. Änderungen der Messwerte verwerfen keine offenen Eingaben. Unter Einstellungen → Sicherung die Konfiguration exportieren oder wiederherstellen. Administratoren konfigurieren; andere Benutzer benötigen HA-Lese- und Steuerrechte für die betroffenen Geräte.

## Betrieb und Grenzen

Die reguläre Auswertung erfolgt alle fünf Sekunden. Bei Jalousien wird zuerst die Lamellenposition gesetzt, nach erfolgreichem Serviceaufruf 2,0 Sekunden gewartet und danach die Höhe gefahren. Ein eigener Timer löst diesen Übergang unabhängig vom Fünf-Sekunden-Takt aus und prüft vorher Kontaktsperren und den aktuellen Auftrag erneut. Bei Stopp, Auftragswechsel oder Entladen der Integration wird der Timer verworfen. Ohne Zielbestätigung wird nach 150 Sekunden je Bewegungsphase ein Fehler gemeldet und nach Möglichkeit gestoppt. Geräte ohne Lamellenziel erhalten nur den Höhenbefehl. Positionslogik und Rückmeldung stammen aus der HA-Cover-Integration.

Gespeicherte Warteaufträge überleben Neustarts; verpasste vergangene Uhrzeiten werden nicht pauschal nachgeholt. Erkannt fehlgeschlagene Befehle erscheinen im Verlauf; eine erfolgreiche Serviceannahme allein beweist keine physische Fahrt. Feiertage, Wind-/Frostschutz und eine automatische manuelle Sperre sind nicht eingebaut.

---

# Shutter Manager 1.5.4

The interface uses locally bundled HA UI Kit 1.2.2 components for icons, colors, typography, spacing, program controls and dialogs. Sorting arrows use the HA accent color. Dialogs support Escape, contained Tab navigation and focus return to the opener. Settings and Help show the UI version. Program names, metadata and actions align at the shared 28 px indent. General icon buttons retain their UI Kit spacing.

Shutter Manager combines time schedules, overarching shading programs, and contact-based opening programs. Cover settings contain sensor assignments and contacts only. Shared thresholds, delays, validity, target positions, and end actions belong to programs. Assigning a sensor alone does not move a cover.

## Quick start

1. In Settings → Select covers, add existing HA covers and choose their display names and type.
2. In Settings → Select sensors, search for temperature, illuminance, or contact sensors and save the selection. Sensors already in use remain selected.
3. Edit a cover → Sensor assignments: set a name and its own illuminance and/or temperature sensors. Assign opening contacts separately. Multiple sensor assignments per cover remain available.
4. Programs → + Program → Sensor program → Temperature / brightness: set the name, enabled/vacation controls, weekdays, optional season, and daily window.
5. Select shared target covers and choose brightness, temperature, or both. Define shared activation/release thresholds and delays. Each cover is evaluated independently against its own assigned sensors.
6. Choose an end action. Expand the generated per-cover actions to set position and optional blind tilt and select the appropriate sensor assignment. Save applies the whole draft.

## Shading conditions

Shading activates at or above the upper brightness or temperature threshold. With both axes selected, both upper thresholds must be met (AND). Either lower threshold releases shading (OR). Each release threshold must be below its activation threshold. Conditions use °C and lx; °F, Kelvin, and klx are converted.

Activation and release conditions must each hold continuously for their own delay. A changed condition or unavailable required reading resets that timer. State and timers are independent for every cover; one missing reading never substitutes another cover's sensor or manufactures a release.

New programs default to no activation delay and a 300-second release delay. Zero means no additional wait. Start when condition is already met permits triggering at startup or restart with high readings. Otherwise, an immediately met condition is initially used as the baseline.

## Daily validity and end actions

Equal start/end times mean all day. Daily windows include the start and exclude the end. Overnight windows use the weekday and season of the start date. Annual season boundaries are inclusive and may cross New Year. Overlapping shading programs for the same cover are rejected. Disjoint daily windows may use different shared thresholds.

The end action applies on sensor release and on leaving the program's daily/calendar validity after shading has actually completed. Fixed return position uses each cover's release action. Current scheduled position uses the currently applicable schedule, falling back to the position reported before shading. Position before shading restores that captured position and known tilt. Keep position issues no return command. Unknown original positions are not invented; a message is logged.

Pausing, disabling, or a vacation pause does not automatically return all covers. Contact protection and opening priority also apply to return movements. A return blocked at the end of a daily window may remain pending while the program stays enabled; newer schedule or shading goals may supersede it.

## Migration from earlier versions

Existing thresholds and release delays move from named cover rules to their programs. Sensor assignments, targets, weekdays, seasons, enabled flags, and pending work are preserved. A legacy program using different condition sets or end actions is split into separately named programs. Unused parameter rules become disabled programs. Multiple sensor associations are retained.

The original configuration and runtime are retained as migration_backup in local integration storage before the migrated model is first persisted. Also export a configuration backup before updating. Restored programs start disabled. After updating, restart Home Assistant Core and reload the browser/app. Both card and integration should report 1.5.4. Older cards cannot overwrite the new protocol.

## Settings and sensor selection

Settings use the shared section and entry spacing from HA UI Kit 1.2.2. The layout uses the shared UI Kit components: language controls on the right, compact vacation control, cover and sensor rows with selection buttons, clickable headings and chevrons for Current status and Today's history, then backup. Click a section heading or press Enter or Space to expand or collapse it; separate Show/Hide buttons are removed. In the expanded Sensors section, use the pencil beside a selected sensor to rename it. Each dialog edits only that sensor; clearing its name restores the HA name. The separate Sensor display names section is removed. Current status contains only device names and positions. Commands and results appear only in Today's history. The sections in Settings can be collapsed independently. Sensor selection, names, and configuration survive restarts and backups. A blank custom name restores the HA name.

Sensor suggestions use device class or unit. Show all sensors allows assigning sensors with incomplete metadata; check the sensor type and unit. Current status shows the device name on the left and position/tilt on the right; Open/Closed and the duplicate position line are removed. Shutters show position only. The extra Recent movement commands list has been removed. Current status remains collapsible.

## Navigation and readings

Programs remains a text tab on the left. A clock icon for Schedule and a sensor icon for Sensor programs sit directly beside it, with descriptive tooltips and screen-reader labels. Help (?) and Settings stay on the right.

Brightness is displayed as a full lx value with dots as thousands separators and no decimal places, for example 20.300 lx instead of 20k lx. Fractional readings are rounded to whole lx. klx readings are converted to lx first. This dotted format also applies in English; raw readings and program thresholds are unchanged.

## Today's history

A separate, independently collapsible Settings section shows today's completed and failed movement commands chronologically, with time, device, command/target, and result. Pending and planned movements remain in Schedule. Completed means the integration confirmed the target state; an accepted service call alone is insufficient. Detected failures show a reason.

History survives reloads and restarts and rolls over with the Home Assistant local date. It is not limited to the last 20 messages. On the first update, available older log entries are retained without inventing missing target details. Only permitted devices are visible. Configuration backup still exports configuration; daily history belongs to local runtime data.

## Schedules and one-time movements

Schedules support individual weekdays, fixed times, sunrise/sunset, offsets, and earliest/latest bounds. Actions sort by their effective time today. Upcoming recurring actions may be skipped once and rescheduled. Completed or discarded actions are not replayed. Moving an action explicitly into the future reschedules it.

In Schedule, use + One-time movement for one cover today. One-time movements are inserted chronologically. Each does not create a saved program and disappears after success. It stays visible while blocked or after an error and expires the next day; tilt is available only for blinds.

## Opening programs and priority

Assign a contact to a cover, then create a sensor program of type Opening contact with weekdays, daily window, optional season, and one target action per cover. Start when window is already open permits activation from an already-open contact. One open contact is enough to hold the opening position; the cover's own contact policy does not block its opening action.

An active opening override outranks shading and schedules until all contacts are confirmed closed, including across a daily window, date change, or restart. Unavailable contacts are not treated as closed. After closing, priority is active shading, then a time action that became due and is still waiting during the opening, otherwise the position recorded before opening. Completed schedule actions are not replayed.

## Contacts, manual operation, and daily pause

Without an opening override, contacts may allow proceeding, discard the action, or retry after confirmed closure. Newer due schedule goals replace older waiting goals for the same cover. Active shading defers schedule movements and updates the target used after release.

Manual movement does not disable a program. Shading is not continually reasserted while its condition stays active. It may trigger again after release and reactivation. Other integrations and manual controls operate independently.

Sensor programs can be paused until local midnight, including across restarts. Outstanding shading goals for that program are cancelled. A latched opening override keeps its protection until closure and then returns. Resuming may trigger again when readings remain high.

## Editor, copy, and backups

Vacation mode is controlled only in Settings. Programs shows every program, with no Vacation button or filter. Program groups, program rows, actions and shared controls use HA UI Kit 1.2.2 styling throughout. Font family, sizes, weights, indentation and spacing come from the UI Kit without local CSS overrides. The program overview omits action counts and program-type labels. Weekdays, time windows and shading thresholds remain as compact details. The vacation-pause hint is omitted from the overview. Expanded programs and actions also use the shared UI Kit spacing. In the mobile layout up to 600 px, the switch and Edit sit beside the program name; sorting arrows and Copy program are hidden. Sorting and copying remain available on desktop. Programs and actions can be expanded or collapsed individually or together. New actions open immediately. Copy/move uses a target-program dialog and remains staged until Save applies both sides. The destination program's conditions, weekdays, vacation, and validity apply. Sensor assignments must meet its required sensor types. Conflicts remain visible without losing the draft. Whole-program copies receive new IDs.

The Programs readings panel shows sun times, contacts, temperature, and illuminance, sorted by display name. Reading updates do not discard editor inputs. Use Settings → Backup to export or restore configuration. Administrators configure; other users require HA read/control permissions for affected devices.

## Operation and limits

Regular evaluation runs every five seconds. For blinds, the integration commands tilt first, waits 2.0 seconds after the successful service call, and then commands height. A dedicated timer triggers this handoff independently of the five-second interval and rechecks contact blocking and the current goal first. Stopping, replacing the goal, or unloading the integration cancels the timer. Each movement phase has a 150-second target-confirmation timeout; detected failures are logged and stopped where supported. Covers without tilt targets receive only height commands. Position direction and feedback come from the underlying HA cover integration.

Pending work survives restarts; missed past times are not indiscriminately replayed. A successful service call alone does not prove physical movement. Holiday calendars, wind/frost protection, and automatic manual-operation locks are not built in.
