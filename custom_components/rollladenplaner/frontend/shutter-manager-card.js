import {UI_CSS, UI_VERSION, icon as uiIcon, ICON_NAMES, escapeHtml, navigation, section as uiSection, row as uiRow, toggle as uiToggle, filterButton, button as uiButton, programAddButton, programOrderButtons, programGroup as uiProgramGroup, programRow as uiProgramRow, actionRow as uiActionRow, iconButton, dialog as uiDialog, versionInfo, bindUI, field as uiField, selectField as uiSelectField, multiSelect as uiMultiSelect, weekdayPicker as uiWeekdayPicker, seasonPicker as uiSeasonPicker} from './family-ui/1.2.1/family-ui.js';
/* Shutter Manager 1.5.2 — local, dependency-free Home Assistant card. */
const HOWTO_HTML = "<h2>Howto – Shutter Manager 1.5.2</h2><p>Die Oberfläche verwendet das lokal mitgelieferte HA UI Kit 1.2.1 für Symbole, Farben, Schriften, Abstände, Programm-Aktionen und Dialoge. Die Programm-Sortierpfeile verwenden die HA-Akzentfarbe. Dialoge unterstützen Escape, begrenzte Tab-Navigation und die Rückkehr zum auslösenden Bedienelement. Die UI-Version steht in Einstellungen und Hilfe.</p><p>Der Shutter Manager verbindet Zeitprogramme, übergeordnete Beschattungsprogramme und Öffnungsprogramme. Ab 1.3.0 enthalten die Geräteeinstellungen nur Sensorzuordnungen und Kontakte. Gemeinsame Schwellenwerte, Verzögerungen, Gültigkeit und Fahrziele werden im Programm gepflegt. Das reine Zuordnen eines Sensors löst keine Fahrt aus.</p><h3>Schnellstart</h3><ol><li>Einstellungen → Rollläden auswählen: bestehende HA-Geräte übernehmen und bei Bedarf Gerätetyp sowie Anzeigename ändern.</li><li>Einstellungen → Sensoren auswählen: Temperatur-, Helligkeits- und Kontaktsensoren suchen, auswählen und speichern. Bereits verwendete Sensoren bleiben ausgewählt.</li><li>Rollladen bearbeiten → Sensorzuordnungen → + Sensorzuordnung: nur Name und zugehörige Temperatur-/Helligkeitssensoren pflegen. Öffnungskontakte stehen separat. Mehrere Sensorzuordnungen pro Gerät bleiben möglich.</li><li>Programme → + Programm → Sensorprogramm → Temperatur / Helligkeit: Name, Aktivierung, Urlaubspause, Wochentage, Saison und tägliches Zeitfenster einstellen.</li><li>Gemeinsame Rollläden und Jalousien auswählen. Jedes Gerät wird anhand seiner eigenen Sensoren ausgewertet. Unter Auswertung Helligkeit, Temperatur oder beide wählen und gemeinsame Schwellenwerte sowie Verzögerungen festlegen.</li><li>Abschlussaktion wählen. Die automatisch ergänzten Fahrten aufklappen und Zielhöhe sowie bei Jalousien die Lamellen einstellen. Die Fahrt verweist auf die passende Sensorzuordnung des Geräts. Speichern übernimmt den gesamten Entwurf.</li></ol><h3>Beschattungsbedingungen</h3><p>Bei Helligkeit beginnt die Beschattung ab der oberen lx-Schwelle, bei Temperatur ab der oberen °C-Schwelle. Bei beiden Sensorarten müssen beide oberen Schwellen erreicht sein (UND). Für die Freigabe genügt eine der unteren Schwellen (ODER). Die Freigabeschwelle muss jeweils unter der Aktivierungsschwelle liegen. Messwerte werden in °C und lx ausgewertet; °F, Kelvin und klx werden umgerechnet.</p><p>Aktivierungs- und Freigabebedingung müssen jeweils während der gesamten eingestellten Verzögerung erfüllt bleiben. Ändert sich die Bedingung oder fehlt ein benötigter Messwert, beginnt die entsprechende Wartezeit bei erneut erfüllter Bedingung von vorn. Jeder Rollladen hat einen eigenen Zustand und eigene Wartezeiten. Ein fehlender Sensorwert eines Geräts löst keine Rückfahrt aus und ersetzt keinen anderen Sensor.</p><p>Neue Programme starten mit 0 Sekunden Aktivierungs- und 300 Sekunden Freigabeverzögerung. 0 bedeutet keine zusätzliche Wartezeit. Bei bereits erfüllter Bedingung starten erlaubt eine Auslösung auch beim Start oder Neustart mit bereits hohen Werten. Ohne diese Option wird ein sofort erfüllter Zustand zunächst als Ausgangszustand eingelesen.</p><h3>Gültigkeit und Abschlussaktion</h3><p>Gleiche Von-/Bis-Uhrzeiten bedeuten ganztägig. Normale Zeitfenster schließen den Beginn ein und das Ende aus. Bei Fenstern über Mitternacht gelten nach Mitternacht Wochentag und Saison des Starttags. Saisonanfang und -ende zählen mit; Winterzeiträume über den Jahreswechsel sind möglich. Zeitlich überlappende Beschattungsprogramme für dasselbe Gerät werden beim Speichern abgewiesen. Nicht überlappende Zeitfenster dürfen unterschiedliche Schwellen nutzen.</p><p>Die Abschlussaktion gilt bei sensorischer Freigabe und beim Verlassen des Zeitfensters beziehungsweise der Kalendergültigkeit nach tatsächlich ausgeführter Beschattung. Feste Rückfahrposition verwendet die Freigabefahrt pro Gerät. Aktuelle Zeitplanposition verwendet das inzwischen gültige Zeitplanziel und ersatzweise die vor der Beschattung gemeldete Position. Position vor Beschattung stellt diese Ausgangsposition einschließlich bekannter Lamellen wieder her. Position beibehalten löst keine Rückfahrt aus. Fehlt die Ausgangsposition, wird kein Ziel erfunden; eine Meldung erscheint im Verlauf.</p><p>Aussetzen, Urlaubspause oder Deaktivieren löst keine pauschale Rückfahrt aus. Kontakte und Öffnungsvorrang gelten auch für Rückfahrten. Eine am Zeitfensterende noch blockierte Rückfahrt bleibt wartend, solange das Programm weiterhin aktiviert ist; ein neuer Zeitplan oder Beschattungsauftrag kann sie ersetzen.</p><h3>Übernahme vorhandener Einstellungen</h3><p>Beim Update werden bisherige Schwellenwerte und Freigabeverzögerungen aus den Sensorregeln in die zugehörigen Programme übernommen. Sensoren, Fahrziele, Wochentage, Saison und Aktivierung bleiben erhalten. Verwendet ein altes Programm unterschiedliche Bedingungen oder Abschlussaktionen, entstehen getrennte Programme mit Namenszusatz. Unbenutzte alte Regeln mit Parametern werden als deaktivierte Programme übernommen. Mehrere Sensorzuordnungen bleiben erhalten.</p><p>Vor der ersten Speicherung des neuen Modells bleibt die ursprüngliche Konfiguration samt Laufzeitdaten als migration_backup im lokalen Integrationsspeicher erhalten. Zusätzlich vor dem Update eine Sicherung über Einstellungen erstellen. Wiederhergestellte Programme bleiben zunächst deaktiviert. Alte Karten können das neue Datenmodell nicht überschreiben: nach dem Update Home Assistant Core vollständig neu starten und Browser oder App neu laden. Oberfläche und Integration müssen beide 1.5.2 anzeigen.</p><h3>Einstellungen und Sensor-Auswahl</h3><p>Die Einstellungen verwenden die gemeinsamen Bereichs- und Eintragsabstände aus HA UI Kit 1.2.1: Sprache mit Sprachwahl rechts, kompakter Urlaubsmodus, Geräte- und Sensorzeilen mit Auswahlknöpfen rechts, Aktueller Status und Heutige Historie mit aufklappbarer Überschrift und Pfeil wie bei den anderen Bereichen, danach Sicherung. Zum Auf- und Zuklappen die Überschrift anklicken oder mit Enter beziehungsweise Leertaste bedienen; zusätzliche Anzeigen-Buttons entfallen. Ausgewählte Sensoren lassen sich direkt im aufgeklappten Bereich Sensoren über ihr Stiftsymbol umbenennen. Jeder Dialog ändert nur den gewählten Sensor; ein leeres Namensfeld stellt den HA-Namen wieder her. Der separate Punkt Sensoranzeigenamen entfällt. Aktueller Status enthält ausschließlich die Gerätenamen und Positionswerte. Befehle und Ergebnisse stehen ausschließlich in der Heutigen Historie. Alle Bereiche lassen sich unabhängig einklappen. Sensor-Auswahl, eigene Anzeigenamen und Konfiguration bleiben nach Neustart erhalten und sind Teil der Sicherung. Leer gelassene Anzeigenamen verwenden den HA-Namen.</p><p>Sensorvorschläge werden nach Geräteklasse oder Einheit gefiltert. Alle Sensoren anzeigen erlaubt die Zuordnung von Sensoren mit unvollständigen Metadaten. Vor dem Speichern Sensorart und Einheit prüfen. Aktueller Status zeigt den Gerätenamen links und Höhe/Lamellen rechts; Offen/Geschlossen und die doppelte Positionszeile entfallen. Rollläden zeigen nur die Höhe. Eine zusätzliche Liste Letzte Fahrbefehle entfällt. Der Bereich Aktueller Status ist zuklappbar.</p><h3>Navigation und Messwerte</h3><p>Programme bleibt links als Text. Direkt daneben öffnen ein Uhr-Icon das Zeitprogramm und ein Sensor-Icon die Sensorprogramme. Tooltips und Beschriftungen für Screenreader benennen beide Reiter. Hilfe (?) und Einstellungen bleiben rechts.</p><p>Helligkeit wird vollständig in lx angezeigt, mit Tausenderpunkten und ohne Nachkommastellen, beispielsweise 20.300 lx statt 20k lx. Bruchteile werden auf ganze lx gerundet. klx-Messwerte werden zuvor in lx umgerechnet. Das Format mit Punkten gilt auch bei englischer Oberfläche; Rohwerte und Programmschwellen werden nicht verändert.</p><h3>Heutige Historie</h3><p>Ein eigener, unabhängig zuklappbarer Punkt in den Einstellungen zeigt die heute abgeschlossenen oder fehlgeschlagenen Fahrbefehle chronologisch mit Uhrzeit, Gerätename, Befehl/Ziel und Ergebnis. Wartende oder geplante Fahrten bleiben im Zeitprogramm. Erfolgreich bedeutet, dass die Integration den Zielzustand bestätigt hat; ein akzeptierter Serviceaufruf allein genügt nicht. Erkannte Fehler werden als Fehlgeschlagen mit Grund angezeigt.</p><p>Die Historie bleibt nach Neuladen und Neustart erhalten und wechselt mit dem lokalen Home-Assistant-Tag. Sie ist nicht auf die letzten 20 Meldungen begrenzt. Beim ersten Update werden verfügbare ältere Protokolleinträge übernommen; deren fehlende Zielwerte werden nicht ergänzt. Nur berechtigte Geräte sind sichtbar. Die Sicherung exportiert weiterhin die Konfiguration; die Tageshistorie gehört zu den lokalen Laufzeitdaten.</p><h3>Zeitprogramme und Einzelfahrten</h3><p>Zeitprogramme unterstützen einzelne Wochentage, feste Uhrzeit, Sonnenaufgang/-untergang, Versatz und frühestens/spätestens. Die Liste wird nach der wirksamen Uhrzeit für heute sortiert. Eine zukünftige Programmfahrt kann einmal ausgelassen und wieder eingeplant werden. Bereits erledigte oder verworfene Fahrten werden nicht erneut nachgeholt. Eine ausdrücklich in die Zukunft verschobene Fahrt wird neu eingeplant.</p><p>Im Zeitprogramm über + Einzelfahrt eine Fahrt für genau ein Gerät am heutigen Tag einplanen. Sie wird chronologisch einsortiert und erzeugt kein gespeichertes Programm. Nach erfolgreicher Ausführung verschwindet sie. Bei Blockierung oder Fehler bleibt sie sichtbar; abgelaufene Fahrten werden am Folgetag verworfen. Lamellen sind nur bei Jalousien verfügbar.</p><h3>Öffnungsprogramme</h3><p>Am Gerät einen Öffnungskontakt zuweisen. Im Sensorprogramm die Art Öffnungskontakt, Wochentage, Von/Bis und optional Saison einstellen. Eine Fahrt pro Gerät mit Zielhöhe und optionalen Lamellen hinzufügen. Bei bereits geöffnetem Fenster starten erlaubt eine Auslösung mit bereits offenem Kontakt. Ein offener Kontakt genügt zum Halten; die eigene Kontaktsperre verhindert die Öffnungsfahrt nicht.</p><p><strong>Ein aktiver Öffnungsvorrang steht über Temperatur/Helligkeit und Zeitprogrammen.</strong> Er bleibt bis zum bestätigten Schließen aller Kontakte erhalten, auch nach Ende des Zeitfensters, Tageswechsel oder Neustart. Nicht verfügbare Kontakte zählen nicht als geschlossen. Nach dem Schließen gilt: aktive Beschattung, dann eine während der Öffnung fällige und noch wartende Zeitfahrt, sonst die vor dem Öffnen gemeldete Position. Bereits abgeschlossene Zeitfahrten werden nicht wiederholt.</p><h3>Vorrang und Nachholen</h3><p>Ohne Öffnungsvorrang gelten die Kontaktregeln: Trotzdem fahren, Nicht fahren oder Fahrt nachholen. Nicht fahren verwirft die konkrete Fahrt. Bei Nachholen wird das Ziel nach bestätigtem Schließen beim nächsten Auswertungszyklus erneut geprüft. Neuere fällige Zeitfahrten ersetzen ältere wartende Ziele desselben Geräts. Aktive Beschattung hält Zeitfahrten zurück; diese aktualisieren das Ziel für danach.</p><h3>Manuelle Fahrten und Aussetzen</h3><p>Eine manuelle Fahrt deaktiviert keine Regel. Solange die Sensorbedingung erfüllt bleibt, wird die Beschattung nicht ständig erneut angefahren. Nach Freigabe und erneuter Aktivierung kann sie wieder auslösen. Andere Steuerungen und manuelle Bedienung arbeiten unabhängig.</p><p>Im Tab Sensorprogramme lässt sich ein Programm bis zur nächsten lokalen Mitternacht pausieren, auch über Neustarts hinweg. Offene Beschattungsaufträge dieses Programms werden aufgehoben. Ein bereits bestehender Öffnungsvorrang bleibt bis zum Schließen geschützt und kehrt danach zurück. Reaktivierung kann bei weiterhin hohen Werten erneut auslösen.</p><h3>Oberfläche, Kopieren und Sicherung</h3><p>Der Urlaubsmodus wird ausschließlich in den Einstellungen geschaltet. Die Programmübersicht zeigt alle Programme; es gibt dort keinen Urlaubsknopf und keinen Urlaubsfilter. Programmgruppen, Programmzeilen, Fahrten und gemeinsame Bedienelemente verwenden vollständig die Gestaltung aus HA UI Kit 1.2.1. Schriftart, Schriftgrößen, Schriftstärken, Einrückungen und Abstände werden ohne lokale CSS-Überschreibungen aus dem UI Kit übernommen. Die Programmübersicht zeigt keine Fahrtenanzahl und keine Programmart mehr. Wochentage, Zeitfenster und Beschattungsschwellen bleiben als kompakte Angaben sichtbar. Der Hinweis Pause im Urlaub entfällt in der Übersicht. Auch aufgeklappte Programme und Fahrten verwenden die gemeinsamen UI-Kit-Abstände. In der mobilen Ansicht bis 600 px stehen Schalter und Bearbeiten neben dem Programmnamen; Sortierpfeile und Programm kopieren werden ausgeblendet. In der Desktopansicht sind Sortieren und Kopieren verfügbar. Programme und Fahrten lassen sich einzeln oder gesammelt auf-/zuklappen. Neue Fahrten öffnen direkt. Kopieren und Verschieben einzelner Fahrten erfolgt über eine Zielprogrammauswahl und wird erst beim Speichern gemeinsam übernommen. Es gelten danach Bedingungen, Tage, Urlaub und Gültigkeit des Zielprogramms. Bei Beschattungsprogrammen müssen Sensorzuordnung und benötigte Sensorarten weiterhin passen. Konflikte werden gemeldet; Abbrechen verwirft den Entwurf. Ganze Programme können mit neuer ID kopiert werden.</p><p>Der Messwertebereich im Programme-Tab zeigt Sonnenzeiten, Kontakte, Temperatur und Helligkeit; Sensoren werden nach Anzeigename sortiert. Änderungen der Messwerte verwerfen keine offenen Eingaben. Unter Einstellungen → Sicherung die Konfiguration exportieren oder wiederherstellen. Administratoren konfigurieren; andere Benutzer benötigen HA-Lese- und Steuerrechte für die betroffenen Geräte.</p><h3>Betrieb und Grenzen</h3><p>Die reguläre Auswertung erfolgt alle fünf Sekunden. Bei Jalousien wird zuerst die Lamellenposition gesetzt, nach erfolgreichem Serviceaufruf 1,5 Sekunden gewartet und danach die Höhe gefahren. Ein eigener Timer löst diesen Übergang unabhängig vom Fünf-Sekunden-Takt aus und prüft vorher Kontaktsperren und den aktuellen Auftrag erneut. Bei Stopp, Auftragswechsel oder Entladen der Integration wird der Timer verworfen. Ohne Zielbestätigung wird nach 150 Sekunden je Bewegungsphase ein Fehler gemeldet und nach Möglichkeit gestoppt. Geräte ohne Lamellenziel erhalten nur den Höhenbefehl. Positionslogik und Rückmeldung stammen aus der HA-Cover-Integration.</p><p>Gespeicherte Warteaufträge überleben Neustarts; verpasste vergangene Uhrzeiten werden nicht pauschal nachgeholt. Erkannt fehlgeschlagene Befehle erscheinen im Verlauf; eine erfolgreiche Serviceannahme allein beweist keine physische Fahrt. Feiertage, Wind-/Frostschutz und eine automatische manuelle Sperre sind nicht eingebaut.</p>";
const CARD_VERSION = '1.5.2';
const ENGLISH = {
  'Programme':'Programs','Zeitprogramm':'Schedule','Sensorprogramme':'Sensor programs','Messwerte':'Sensor readings','Sonnenzeiten und Sensorwerte':'Sun times and sensor readings','Sonnenaufgang':'Sunrise','Sonnenuntergang':'Sunset','Öffnungssensoren':'Contact sensors','Temperatur':'Temperature','Helligkeit':'Brightness','Weitere Sensoren':'Other sensors',
  'Neu laden':'Reload','+ Programm':'+ Program','Fahrt':'action','Fahrten':'actions','Öffnungsprogramm':'Opening program','Sensorprogramm':'Sensor program','Zeitprogramme':'Time programs','Sensorprogramme':'Sensor programs','Außerhalb des Zeitfensters':'Outside the time window','Nach oben sortieren':'Move up','Nach unten sortieren':'Move down','Keine Tage':'No days','Pause im Urlaub':'Paused during vacation','Regel:':'Rule:','Bitte auswählen':'Please select','Noch keine Fahrten. Unter Bearbeiten hinzufügen.':'No actions yet. Add one using Edit.','Zuerst in den Einstellungen die Rollläden und Sensoren zuordnen. Danach ein Zeit- oder Sensorprogramm anlegen.':'First add covers and sensors in Settings. Then create a schedule or sensor program.',
  'Urlaubsmodus':'Vacation mode','Markierte Programme im Urlaub aussetzen':'Pause selected programs during vacation','Rollläden und Jalousien':'Shutters and blinds','Sensoranzeigenamen':'Sensor display names','Bearbeiten':'Edit','Noch keine Sensoren zugeordnet.':'No sensors assigned yet.','Sicherung':'Backup','Sicherung erstellen':'Create backup','Sicherung wiederherstellen':'Restore backup','Rollläden hinzufügen':'Add covers','Jalousie':'Blind','Rollladen':'Shutter','Kein Öffnungskontakt':'No contact sensor','Vorhandene Rollläden und Jalousien über „Rollläden hinzufügen“ auswählen. Die Anzeigenamen lassen sich anschließend unter Bearbeiten ändern.':'Select existing covers using “Add covers”. You can change their display names using Edit.',
  'Aktuelle Fahrten':'Current actions','Wird ausgeführt':'Running','Wartet auf Ausführung':'Waiting to run','Geplant':'Schedule','Pausiert':'Paused','Wartet':'Waiting','Ausgelassen':'Skipped','Einmal ausgelassen':'Skipped once','Offen seit':'Open since','Wieder einplanen':'Reschedule','Einmal auslassen':'Skip once','Auslassen':'Skip','Heute':'Today','Für heute ausgesetzt':'Paused for today','Position bis zum Schließen geschützt':'Position protected until closed','Beschattung aktiv':'Shading active','Sensorbedingung erfüllt':'Sensor condition met','Bereit':'Ready','Automatisch wieder ab morgen, 00:00 Uhr':'Automatically resumes tomorrow at midnight','Heute wieder aktivieren':'Resume for today','Bis morgen aussetzen':'Pause until tomorrow','Heute sind keine Sensorprogramme oder direkten Beschattungsregeln freigegeben. Wochentage und Saison werden berücksichtigt.':'No sensor programs or direct shading rules are active today. Weekdays and seasons are taken into account.',
  'Anzeigename im Planer':'Display name','Rollladen / Jalousie':'Cover','Typ':'Type','Automatisch erkennen':'Detect automatically','Anderer Cover-Typ':'Other cover type','Programmtyp':'Program type','Programm aktiv':'Program enabled','Im Urlaub aussetzen':'Pause during vacation','Wochentage':'Weekdays','Fahrten':'Actions','Alle aufklappen':'Expand all','Alle zuklappen':'Collapse all','Auslöser':'Trigger','Uhrzeit':'Time','Frühestens':'Earliest','Spätestens':'Latest','Fenster':'Window','Höhe':'Position','Lamellen':'Tilt','Unverändert':'Unchanged','Auswahl':'Selection','+ Fahrt hinzufügen':'+ Add action','Entfernen':'Remove','Verschieben':'Move','Kopieren':'Copy','Speichern':'Save','Abbrechen':'Cancel','Löschen':'Delete','Schließen':'Close','Zielprogramm':'Target program','Übernahme abbrechen':'Cancel transfer','Sicherung erstellen':'Create backup','Sicherung wiederherstellen':'Restore backup','Sensorregel':'Sensor rule','Name der Sensorregel':'Sensor rule name','Temperatur (optional)':'Temperature (optional)','Helligkeit (optional)':'Brightness (optional)','Aktiv ab Temperatur (°C)':'Activate at temperature (°C)','Freigabe ab / unter Temperatur (°C)':'Release below temperature (°C)','Aktiv ab Helligkeit (lx)':'Activate at brightness (lx)','Freigabe ab / unter Helligkeit (lx)':'Release below brightness (lx)','Freigabeverzögerung (Sekunden)':'Release delay (seconds)','Regel entfernen':'Remove rule','+ Sensorregel':'+ Sensor rule','Kontakt':'Contact sensor','Zustand bei offenem Fenster':'State when window is open','Wenn offen':'When open','Kontakt entfernen':'Remove contact','Gültigkeitszeitraum':'Validity period','Von':'From','Bis':'To','Bei bereits erfüllter Bedingung starten':'Start when condition is already met','Wochentage einzeln auswählen':'Select weekdays','Urlaubsmodus aktivieren':'Enable vacation mode','Unbekannt':'Unknown','Nicht verfügbar':'Unavailable','Ausgesetzt bis Tür geschlossen':'Paused until door closes','wird nachgeholt':'will be retried','Eintrag dauerhaft löschen?':'Permanently delete this item?','Datei zu groß (max. 2 MB).':'File too large (max. 2 MB).','Zielprogramm nicht mehr vorhanden. Bitte neu laden.':'Target program no longer exists. Please reload.','Fenster zuerst aus allen Fahrten entfernen.':'Remove this window from all actions first.','Für jede Fahrt genau einen Rollladen auswählen.':'Select exactly one cover for each action.','Eine benannte Sensorregel für das Gerät auswählen.':'Select a named sensor rule for this cover.','Für jede Fahrt mindestens eine Position festlegen. Reine Lamellenfahrten benötigen den Typ Jalousie.':'Set at least one position for each action. Tilt-only actions require a blind.',
  'Oberfläche':'Card','Integration':'Integration','Version nicht gemeldet':'Version not reported','Rollläden und Jalousien hinzufügen':'Add shutters and blinds','Alle sichtbaren auswählen':'Select all visible','Auswahl aufheben':'Clear selection','ausgewählt':'selected','Hinzufügen':'Add','Rollläden und Sensoren':'Covers and sensors','Howto':'Guide','Howto – Anleitung':'Guide','Einstellungen':'Settings','Aktiv':'Enabled','Fahrt aktiv':'Action enabled','Rollladen aktiv':'Cover enabled','Keine offene Fahrt':'No pending action','Keine offenen Fahrten':'No pending actions','Sensoranzeigenamen bearbeiten':'Edit sensor display names','Vorhandene Rollläden und Jalousien über „Rollläden hinzufügen“ auswählen.':'Select existing covers using “Add covers”.','Sprache':'Language','Sensorregeln':'Sensor rules','Einzelne Fahrten dauerhaft deaktivieren.':'Permanently disable individual actions.','Diese Anleitung neben dem Zahnrad öffnen.':'Open this guide next to the settings button.','Zeitfahrten aktualisieren das Ziel für danach.':'Schedule actions update the target for later.','Anzeigenamen und Gerätetyp lassen sich im Planer ändern.':'You can change display names and cover type in the planner.','Fenster bearbeiten':'Edit cover','Programm bearbeiten':'Edit program','Rollläden hinzufügen':'Add covers','Rollläden auswählen':'Select covers','Keine offenen Fahrten für heute.':'No upcoming or pending actions for today.','Keine offene Fahrt für heute.':'No upcoming or pending action for today.','Öffnet':'Open','Geschlossen':'Closed','Offen':'Open','Nicht verfügbar':'Unavailable','Unbekannt':'Unknown','Wird ausgelassen':'Will be skipped','Ausgesetzt':'Paused','Verstrichen':'Past due','Wird nachgeholt':'Will be retried','Keine offene Fahrt':'No pending action','Wartet auf Tür':'Waiting for door','Sonnenaufgang':'Sunrise','Sonnenuntergang':'Sunset','Montag':'Monday','Dienstag':'Tuesday','Mittwoch':'Wednesday','Donnerstag':'Thursday','Freitag':'Friday','Samstag':'Saturday','Sonntag':'Sunday','Heute sind keine Programme aktiv.':'No programs are active today.','Heute ist keine Fahrt geplant.':'No actions are scheduled for today.','Aufgabe nicht möglich.':'Action unavailable.','Bitte zuerst neu laden.':'Please reload first.','Die Konfiguration wurde geändert. Bitte neu laden.':'The configuration changed. Please reload.','Konfiguration gespeichert.':'Configuration saved.','Keine Berechtigung zum Steuern.':'You do not have permission to control this.','Sensorwert fehlt':'Sensor value missing','Werte aktualisieren sich automatisch.':'Values update automatically.','Urlaub':'Vacation','Wahr':'On','Falsch':'Off','Noch keine Programme angelegt.':'No programs created yet.','Keine Programme vorhanden.':'No programs available.','Leere Konfiguration':'Empty configuration','Konfiguration importieren':'Import configuration','Importieren':'Import','Exportieren':'Export','Sensoranzeigenamen speichern':'Save sensor display names','Leer lassen, um den Namen aus Home Assistant zu verwenden.':'Leave blank to use the Home Assistant name.','Gültig ab':'Valid from','Gültig bis':'Valid until','Jährlichen Zeitraum begrenzen':'Limit annual date range','Saison aktivieren':'Enable season','Bei bereits erfüllter Bedingung starten':'Trigger immediately if condition is already met','Sensorprogramm-Art':'Sensor program type','Temperatur und Helligkeit':'Temperature and brightness','Kontakt geschlossen':'Contact closed','Kontakt offen':'Contact open','Trotzdem fahren':'Proceed anyway','Nicht fahren':'Do not move','Fahrt nachholen':'Retry after closing','Einzelne Fahrt auslassen':'Skip action once','Einstellungen speichern':'Save settings','Rollladen ausgewählt':'Cover selected','Neues Programm':'New program','Neue Fahrt':'New action','Neue Regel':'New rule','Name':'Name','Sicherung wiederherstellen':'Restore backup','Konfigurationssicherung':'Configuration backup','Konfiguration':'Configuration','Sensorwert':'Sensor reading','Ereignis':'Event','Öffnung':'Opening','Beschattung':'Shading','Wieder freigegeben':'Condition released','Aktuelle Zeitplanposition übernehmen':'Use current scheduled position','Position':'Position','Lamellenposition':'Tilt position','Unverändert lassen':'Leave unchanged','Position bis Schließen geschützt':'Position protected until closed','Heute wieder aktivieren':'Resume today','Programm kopieren':'Copy program','Programm bearbeiten':'Edit program','Programm':'Program','(Kopie)':'(copy)','(dieses Programm)':'(this program)','Übernahme vorgemerkt':'Transfer staged','Übernahme':'Transfer','Übernahmen':'Transfers','vorgemerkt – mit Speichern übernehmen.':'staged — save to apply.','Letzte Übernahme rückgängig':'Undo last transfer','Zielprogramm nicht mehr vorhanden. Bitte neu laden.':'Target program no longer exists. Please reload.','Datei konnte nicht gelesen werden.':'Could not read file.','Speichern fehlgeschlagen.':'Save failed.','Sicherung importiert.':'Backup imported.','Nur Administratoren können diese Änderung vornehmen.':'Only administrators can make this change.','Sensorregel speichern':'Save sensor rule','Keine Fahrten vorhanden.':'No actions available.','Keine Programme zur Auswahl.':'No programs available.'
};
const HOWTO_HTML_EN = "<h2>Shutter Manager 1.5.2</h2><p>The interface uses the locally bundled HA UI Kit 1.2.1 for icons, colors, typography, spacing, program controls and dialogs. Program sorting arrows use the HA accent color. Dialogs support Escape, contained Tab navigation and focus return to the opener. Settings and Help show the UI version.</p><p>Shutter Manager combines time schedules, overarching shading programs, and contact-based opening programs. Cover settings contain sensor assignments and contacts only. Shared thresholds, delays, validity, target positions, and end actions belong to programs. Assigning a sensor alone does not move a cover.</p><h3>Quick start</h3><ol><li>In Settings → Select covers, add existing HA covers and choose their display names and type.</li><li>In Settings → Select sensors, search for temperature, illuminance, or contact sensors and save the selection. Sensors already in use remain selected.</li><li>Edit a cover → Sensor assignments: set a name and its own illuminance and/or temperature sensors. Assign opening contacts separately. Multiple sensor assignments per cover remain available.</li><li>Programs → + Program → Sensor program → Temperature / brightness: set the name, enabled/vacation controls, weekdays, optional season, and daily window.</li><li>Select shared target covers and choose brightness, temperature, or both. Define shared activation/release thresholds and delays. Each cover is evaluated independently against its own assigned sensors.</li><li>Choose an end action. Expand the generated per-cover actions to set position and optional blind tilt and select the appropriate sensor assignment. Save applies the whole draft.</li></ol><h3>Shading conditions</h3><p>Shading activates at or above the upper brightness or temperature threshold. With both axes selected, both upper thresholds must be met (AND). Either lower threshold releases shading (OR). Each release threshold must be below its activation threshold. Conditions use °C and lx; °F, Kelvin, and klx are converted.</p><p>Activation and release conditions must each hold continuously for their own delay. A changed condition or unavailable required reading resets that timer. State and timers are independent for every cover; one missing reading never substitutes another cover&#x27;s sensor or manufactures a release.</p><p>New programs default to no activation delay and a 300-second release delay. Zero means no additional wait. Start when condition is already met permits triggering at startup or restart with high readings. Otherwise, an immediately met condition is initially used as the baseline.</p><h3>Daily validity and end actions</h3><p>Equal start/end times mean all day. Daily windows include the start and exclude the end. Overnight windows use the weekday and season of the start date. Annual season boundaries are inclusive and may cross New Year. Overlapping shading programs for the same cover are rejected. Disjoint daily windows may use different shared thresholds.</p><p>The end action applies on sensor release and on leaving the program&#x27;s daily/calendar validity after shading has actually completed. Fixed return position uses each cover&#x27;s release action. Current scheduled position uses the currently applicable schedule, falling back to the position reported before shading. Position before shading restores that captured position and known tilt. Keep position issues no return command. Unknown original positions are not invented; a message is logged.</p><p>Pausing, disabling, or a vacation pause does not automatically return all covers. Contact protection and opening priority also apply to return movements. A return blocked at the end of a daily window may remain pending while the program stays enabled; newer schedule or shading goals may supersede it.</p><h3>Migration from earlier versions</h3><p>Existing thresholds and release delays move from named cover rules to their programs. Sensor assignments, targets, weekdays, seasons, enabled flags, and pending work are preserved. A legacy program using different condition sets or end actions is split into separately named programs. Unused parameter rules become disabled programs. Multiple sensor associations are retained.</p><p>The original configuration and runtime are retained as migration_backup in local integration storage before the migrated model is first persisted. Also export a configuration backup before updating. Restored programs start disabled. After updating, restart Home Assistant Core and reload the browser/app. Both card and integration should report 1.5.2. Older cards cannot overwrite the new protocol.</p><h3>Settings and sensor selection</h3><p>Settings use the shared section and entry spacing from HA UI Kit 1.2.1. The layout uses the shared UI Kit components: language controls on the right, compact vacation control, cover and sensor rows with selection buttons, clickable headings and chevrons for Current status and Today&#x27;s history, then backup. Click a section heading or press Enter or Space to expand or collapse it; separate Show/Hide buttons are removed. In the expanded Sensors section, use the pencil beside a selected sensor to rename it. Each dialog edits only that sensor; clearing its name restores the HA name. The separate Sensor display names section is removed. Current status contains only device names and positions. Commands and results appear only in Today&#x27;s history. The sections in Settings can be collapsed independently. Sensor selection, names, and configuration survive restarts and backups. A blank custom name restores the HA name.</p><p>Sensor suggestions use device class or unit. Show all sensors allows assigning sensors with incomplete metadata; check the sensor type and unit. Current status shows the device name on the left and position/tilt on the right; Open/Closed and the duplicate position line are removed. Shutters show position only. The extra Recent movement commands list has been removed. Current status remains collapsible.</p><h3>Navigation and readings</h3><p>Programs remains a text tab on the left. A clock icon for Schedule and a sensor icon for Sensor programs sit directly beside it, with descriptive tooltips and screen-reader labels. Help (?) and Settings stay on the right.</p><p>Brightness is displayed as a full lx value with dots as thousands separators and no decimal places, for example 20.300 lx instead of 20k lx. Fractional readings are rounded to whole lx. klx readings are converted to lx first. This dotted format also applies in English; raw readings and program thresholds are unchanged.</p><h3>Today&#x27;s history</h3><p>A separate, independently collapsible Settings section shows today&#x27;s completed and failed movement commands chronologically, with time, device, command/target, and result. Pending and planned movements remain in Schedule. Completed means the integration confirmed the target state; an accepted service call alone is insufficient. Detected failures show a reason.</p><p>History survives reloads and restarts and rolls over with the Home Assistant local date. It is not limited to the last 20 messages. On the first update, available older log entries are retained without inventing missing target details. Only permitted devices are visible. Configuration backup still exports configuration; daily history belongs to local runtime data.</p><h3>Schedules and one-time movements</h3><p>Schedules support individual weekdays, fixed times, sunrise/sunset, offsets, and earliest/latest bounds. Actions sort by their effective time today. Upcoming recurring actions may be skipped once and rescheduled. Completed or discarded actions are not replayed. Moving an action explicitly into the future reschedules it.</p><p>In Schedule, use + One-time movement for one cover today. One-time movements are inserted chronologically. Each does not create a saved program and disappears after success. It stays visible while blocked or after an error and expires the next day; tilt is available only for blinds.</p><h3>Opening programs and priority</h3><p>Assign a contact to a cover, then create a sensor program of type Opening contact with weekdays, daily window, optional season, and one target action per cover. Start when window is already open permits activation from an already-open contact. One open contact is enough to hold the opening position; the cover&#x27;s own contact policy does not block its opening action.</p><p>An active opening override outranks shading and schedules until all contacts are confirmed closed, including across a daily window, date change, or restart. Unavailable contacts are not treated as closed. After closing, priority is active shading, then a time action that became due and is still waiting during the opening, otherwise the position recorded before opening. Completed schedule actions are not replayed.</p><h3>Contacts, manual operation, and daily pause</h3><p>Without an opening override, contacts may allow proceeding, discard the action, or retry after confirmed closure. Newer due schedule goals replace older waiting goals for the same cover. Active shading defers schedule movements and updates the target used after release.</p><p>Manual movement does not disable a program. Shading is not continually reasserted while its condition stays active. It may trigger again after release and reactivation. Other integrations and manual controls operate independently.</p><p>Sensor programs can be paused until local midnight, including across restarts. Outstanding shading goals for that program are cancelled. A latched opening override keeps its protection until closure and then returns. Resuming may trigger again when readings remain high.</p><h3>Editor, copy, and backups</h3><p>Vacation mode is controlled only in Settings. Programs shows every program, with no Vacation button or filter. Program groups, program rows, actions and shared controls use HA UI Kit 1.2.1 styling throughout. Font family, sizes, weights, indentation and spacing come from the UI Kit without local CSS overrides. The program overview omits action counts and program-type labels. Weekdays, time windows and shading thresholds remain as compact details. The vacation-pause hint is omitted from the overview. Expanded programs and actions also use the shared UI Kit spacing. In the mobile layout up to 600 px, the switch and Edit sit beside the program name; sorting arrows and Copy program are hidden. Sorting and copying remain available on desktop. Programs and actions can be expanded or collapsed individually or together. New actions open immediately. Copy/move uses a target-program dialog and remains staged until Save applies both sides. The destination program&#x27;s conditions, weekdays, vacation, and validity apply. Sensor assignments must meet its required sensor types. Conflicts remain visible without losing the draft. Whole-program copies receive new IDs.</p><p>The Programs readings panel shows sun times, contacts, temperature, and illuminance, sorted by display name. Reading updates do not discard editor inputs. Use Settings → Backup to export or restore configuration. Administrators configure; other users require HA read/control permissions for affected devices.</p><h3>Operation and limits</h3><p>Regular evaluation runs every five seconds. For blinds, the integration commands tilt first, waits 1.5 seconds after the successful service call, and then commands height. A dedicated timer triggers this handoff independently of the five-second interval and rechecks contact blocking and the current goal first. Stopping, replacing the goal, or unloading the integration cancels the timer. Each movement phase has a 150-second target-confirmation timeout; detected failures are logged and stopped where supported. Covers without tilt targets receive only height commands. Position direction and feedback come from the underlying HA cover integration.</p><p>Pending work survives restarts; missed past times are not indiscriminately replayed. A successful service call alone does not prove physical movement. Holiday calendars, wind/frost protection, and automatic manual-operation locks are not built in.</p>";
Object.assign(ENGLISH,{
  'Fenster öffnet':'Window opens','Wieder freigegeben':'Released','Helligkeit und Temperatur erreicht':'Brightness and temperature reached','Temperatur erreicht':'Temperature reached','Helligkeit erreicht':'Brightness reached','Sensorbedingung erreicht':'Sensor condition met','Aktuelle Zeitplanposition':'Current scheduled position','Position unverändert':'Position unchanged','Deaktiviert':'Disabled','Ganzjährig':'Year-round','Gültig ab':'Valid from','Gültig bis':'Valid until','Heute sind keine zukünftigen oder nachzuholenden Fahrten vorhanden.':'No upcoming or pending actions for today.','Für heute sind keine zukünftigen oder nachzuholenden Fahrten vorhanden.':'No upcoming or pending actions for today.','Für heute gültige Programme. Öffnungsvorrang bleibt bis zum Schließen bestehen.':'Programs valid today. Opening priority remains until the contact closes.','Heute sind keine Sensorprogramme oder direkten Beschattungsregeln freigegeben. Wochentage und Saison werden berücksichtigt.':'No sensor programs or direct shading rules are active today. Weekdays and validity periods are taken into account.','Keine Geräte mit hinterlegtem Temperatur- oder Helligkeitssensor.':'No covers have an assigned temperature or brightness sensor.','Keine Geräte mit zugewiesenem Öffnungskontakt.':'No covers have an assigned contact sensor.','Noch keine Programme angelegt.':'No programs created yet.','Für heute keine offene Fahrt':'No pending action for today','Für heute keine offenen Fahrten':'No pending actions for today','Bitte eine Fahrt und ein passendes Zielprogramm auswählen.':'Select an action and a compatible target program.','Bitte einen Namen vergeben.':'Enter a name.','Bitte wählen':'Please choose','Das Zielprogramm enthält bereits 100 Fahrten.':'The target program already contains 100 actions.','Die Helligkeit für die Freigabe muss unter der Aktivierungshelligkeit liegen.':'The release brightness must be lower than the activation brightness.','Die Temperatur für die Freigabe muss unter der Aktivierungstemperatur liegen.':'The release temperature must be lower than the activation temperature.','Freigabeverzögerung zwischen 0 und 86400 Sekunden eintragen.':'Enter a release delay between 0 and 86400 seconds.','Mindestens einen Temperatur- oder Helligkeitssensor auswählen.':'Select at least one temperature or brightness sensor.','Konfiguration ersetzen? Importierte Programme bleiben zunächst ausgeschaltet.':'Replace configuration? Imported programs are initially disabled.','Speichern fehlgeschlagen.':'Save failed.','Konfiguration gespeichert.':'Configuration saved.','Sicherung importiert.':'Backup restored.','Die Konfiguration wurde geändert. Bitte neu laden.':'The configuration changed. Please reload.','Keine Berechtigung zum Steuern.':'You do not have permission to control this.','Eintrag dauerhaft löschen?':'Permanently delete this item?','Programm kopieren':'Copy program','Zeitprogramm':'Schedule','Sensorprogramme':'Sensor programs','Rollladensteuerung':'Shutter Manager','Gültigkeitszeitraum (TT.MM.)':'Validity period (DD.MM.)','Von (TT.MM.)':'From (DD.MM.)','Bis (TT.MM.)':'To (DD.MM.)','Von / Bis':'From / To','Auslöser bis':'Trigger until','Name oder Entität':'Name or entity','Sensorwert fehlt':'Sensor value missing','Saison aktivieren':'Enable validity period','Fenster bearbeiten':'Edit cover','Zustand bei offenem Fenster':'State when window is open','Automatisch wieder ab morgen, 00:00 Uhr':'Automatically resumes tomorrow at midnight','Position bis zum Schließen geschützt':'Position protected until the contact closes','Für heute ausgesetzt':'Paused for today','Heute wieder aktivieren':'Resume today','Eine Fahrt steuert genau einen Rollladen.':'Each action controls one cover.','Öffnet':'Open','Trotzdem fahren':'Proceed anyway','Nicht fahren':'Do not move','Fahrt nachholen':'Retry after closing','Insgesamt':'Total','Sensorregeln':'Sensor rules','Rolläden hinzufügen':'Add covers','Wieder einplanen':'Reschedule','Ausgelassen':'Skipped','Einmal ausgelassen':'Skipped once','Verstrichen':'Past due','Ausgesetzt':'Paused','Keine offene Fahrt':'No pending action','Keine offenen Fahrten':'No pending actions','Wartet –':'Waiting —','Ausgesetzt –':'Paused —','Ausgesetzt bis Tür geschlossen':'Paused until door closes','Öffnungssensor bei Fälligkeit nicht verfügbar':'Contact sensor unavailable when action is due','Tür bei Fälligkeit offen':'Door open when action is due','wird nachgeholt':'will be retried','Offen seit':'Open since','Nicht verfügbar':'Unavailable','Unbekannt':'Unknown','Geschlossen':'Closed','Offen':'Open','Programm aktiv':'Program enabled','Fahrt aktiv':'Action enabled','Rollladen aktiv':'Cover enabled','Keine Tage':'No days','Pause im Urlaub':'Paused during vacation','Markierte Programme im Urlaub aussetzen':'Pause selected programs during vacation','Sicherung':'Backup','Sicherung erstellen':'Create backup','Sicherung wiederherstellen':'Restore backup','Sensoranzeigenamen':'Sensor display names','Rollläden und Jalousien':'Shutters and blinds','Rollläden und Jalousien hinzufügen':'Add shutters and blinds','Rollläden hinzufügen':'Add covers','Rollläden auswählen':'Select covers','Keine offenen Fahrten für heute.':'No upcoming or pending actions for today.','Sonnenzeiten und Sensorwerte':'Sun times and sensor readings','Weitere Sensoren':'Other sensors'
});
Object.assign(ENGLISH,{
  "Sensorzuordnungen": "Sensor assignments",
  "Sensorzuordnung": "Sensor assignment",
  "Name der Sensorzuordnung": "Sensor assignment name",
  "Zuordnung entfernen": "Remove assignment",
  "+ Sensorzuordnung": "+ Sensor assignment",
  "Hier nur Sensoren zuordnen. Schwellenwerte, Verzögerungen und Fahrziele im Beschattungsprogramm festlegen.": "Assign sensors here. Define thresholds, delays, and targets in the shading program.",
  "Gemeinsame Rollläden und Jalousien": "Shared target covers",
  "Jedes Gerät verwendet seine eigenen Sensoren. Schwellenwerte und Verzögerungen gelten gemeinsam für alle ausgewählten Geräte.": "Each cover uses its own sensors. Thresholds and delays apply to all selected covers.",
  "Tägliches Zeitfenster": "Daily window",
  "Gleiche Uhrzeiten gelten ganztägig. Zeitfenster über Mitternacht beziehen sich auf den Starttag.": "Equal times mean all day. Overnight windows use the start date.",
  "Beschattungsbedingungen": "Shading conditions",
  "Auswertung": "Evaluation",
  "Aktivierungsverzögerung (Sekunden)": "Activation delay (seconds)",
  "Bei zwei Sensoren müssen beide oberen Schwellen erreicht sein. Für die Freigabe genügt eine untere Schwelle. Die Bedingung muss während der gesamten Verzögerung erfüllt bleiben.": "With two sensors, both upper thresholds must be met. Either lower threshold releases shading. The condition must remain true for the entire delay.",
  "Abschlussaktion": "End action",
  "Nach Freigabe oder Zeitfensterende": "After release or window end",
  "Position vor Beschattung": "Position before shading",
  "Feste Rückfahrposition": "Fixed return position",
  "Position beibehalten": "Keep position",
  "Rückfahrziele werden in den Fahrten festgelegt. Ohne passende Zeitfahrt verwendet die Zeitplan-Rückkehr die Position vor der Beschattung. Aussetzen oder Deaktivieren löst keine Rückfahrt aus.": "Set return targets in the actions. Without an applicable schedule, schedule return uses the pre-shading position. Pausing or disabling does not trigger a return.",
  "Sensoren in den Einstellungen zuweisen.": "Assign sensors in Settings.",
  "Ganztägig": "All day",
  "Zuordnung:": "Assignment:"
});
const CONFIG_SCHEMA = 7;
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const POLICY = {defer: 'Fahrt nachholen', skip: 'Nicht fahren', drive: 'Trotzdem fahren'};
const esc = escapeHtml;
const clone = v => JSON.parse(JSON.stringify(v));
const uid = () => 'id_' + (crypto.randomUUID ? crypto.randomUUID().replaceAll('-', '') : Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join(''));
const options = (items, current) => items.map(([v,t]) => `<option value="${esc(v)}" ${String(v) === String(current) ? 'selected' : ''}>${esc(t)}</option>`).join('');
const field = (label, input, extra='') => `<label class="field ${extra}"><span>${esc(label)}</span>${input}</label>`;
const input = (key, value, type='text', attrs='') => `<input data-key="${esc(key)}" type="${type}" value="${esc(value)}" ${attrs}>`;
const check = (key, value, label, disabled=false) => `<label class="check"><input type="checkbox" data-key="${esc(key)}" ${value ? 'checked' : ''} ${disabled ? 'disabled' : ''}>${esc(label)}</label>`;
const toggle = (action, value, label, attrs='', disabled=false) => {
  const data=Object.fromEntries([...attrs.matchAll(/data-([a-z-]+)="([^"]*)"/g)].map(match=>[match[1],match[2]]));
  const accessible=label || ({program:'Programm aktiv',ride:'Fahrt aktiv',window:'Rollladen aktiv'}[action] || action);
  return uiToggle({action,checked:value,label:accessible,disabled,data,iconOnly:!label});
};

class ShutterManagerCard extends HTMLElement {
  setConfig(config) { this.config = config; if (!this.shadowRoot) this.attachShadow({mode:'open'}); this.render(); }
  set hass(hass) {
    this._hass = hass;
    this.updateOverview();
    if (!this.loaded && !this.loading && this.isConnected) this.refresh();
  }
  connectedCallback() {
    this.timer = setInterval(() => { if (!this.editor && !this.onceFormOpen && !this.busy && document.visibilityState === 'visible') this.refresh(); }, 5000);
    this.resizeObserver=new ResizeObserver(()=>this.revealTab());this.resizeObserver.observe(this);
    if(this.shadowRoot)this.unbindUI ||= bindUI(this.shadowRoot, ({originalEvent}) => this.onClick(originalEvent));
    if (this._hass) this.refresh();
  }
  disconnectedCallback() { clearInterval(this.timer);this.resizeObserver?.disconnect();this.unbindUI?.();this.unbindUI=null; }
  revealTab() {
    const nav=this.shadowRoot?.querySelector('nav'),selected=nav?.querySelector('.selected');
    if(!selected) return;
    const box=nav.getBoundingClientRect(),tab=selected.getBoundingClientRect();
    if(tab.right>box.right)nav.scrollLeft+=tab.right-box.right;
    else if(tab.left<box.left)nav.scrollLeft-=box.left-tab.left;
  }
  getCardSize() { return 5; }
  getGridOptions() { return {columns:12, min_columns:6, rows:'auto'}; }
  async refresh() {
    if (!this._hass || this.loading || this.editor) return;
    this.loading = true;
    try {
      this.data = await this._hass.callWS({type:'rollladenplaner/get'});
      this.loaded = true; this.error = this.compatible?'':this.versionMessage(); this.render();
    } catch(e) { this.error = e.message || String(e); this.render(); }
    finally { this.loading = false; }
  }
  get compatible() { return this.data?.config_schema===CONFIG_SCHEMA; }
  versionMessage() {
    return 'Karte '+CARD_VERSION+' · Geladene Integration: '+(this.data?.backend_version || 'Version nicht gemeldet')+'. Bitte Home Assistant vollständig neu starten (Terminal: ha core restart) und danach Browser/App neu laden. Bis dahin wird nichts geändert.';
  }
  sensorRulesMatch(expected, saved) {
    const normalize=g=>({id:g.id,name:(g.name || '').trim(),temp_entity:g.temp_entity || null,lux_entity:g.lux_entity || null});
    const rules=w=>{const source=w.sensor_rules?.length || !w.climate?(w.sensor_rules || []):[{...w.climate,id:'legacy',name:w.climate.name || 'Beschattung'}];return source.map(normalize).sort((a,b)=>a.id.localeCompare(b.id));};
    return expected.windows.every(w=>{const actual=saved?.windows?.find(x=>x.id===w.id);return !!actual && JSON.stringify(rules(w))===JSON.stringify(rules(actual));});
  }
  programConditionsMatch(expected,saved) {
    const keys=['conditions','start','end','end_action'];
    const stable=value=>JSON.stringify(value && typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))):value);
    return expected.programs.filter(p=>p.kind==='sensor' && p.sensor_mode!=='opening' && p.conditions).every(p=>{
      const actual=saved?.programs.find(item=>item.id===p.id);
      return actual && keys.every(key=>stable(p[key])===stable(actual[key]));
    });
  }
  sensorNamesMatch(expected, saved) {
    const normalized=c=>Object.entries(c?.sensor_names || {}).map(([key,value])=>[key,value.trim()]).sort(([a],[b])=>a.localeCompare(b));
    return JSON.stringify(normalized(expected))===JSON.stringify(normalized(saved));
  }
  async request(type, data) {
    if (this.busy) return false;
    if(!this.compatible){this.error=this.versionMessage();return false;}
    this.busy = true;
    const submitted=type==='save'?clone(data.config):null;
    try {
      const response=await this._hass.callWS({type:'rollladenplaner/' + type, revision:this.data.revision, ...data,...(submitted?{config:submitted,config_schema:CONFIG_SCHEMA}:{})});
      this.data=response;
      if(submitted && (!this.programConditionsMatch(submitted,response.config) || !this.sensorRulesMatch(submitted,response.config) || !this.sensorNamesMatch(submitted,response.config) || JSON.stringify([...(submitted.sensors || [])].sort())!==JSON.stringify([...(response.config.sensors || [])].sort()))) {
        if(this.editor)this.editor.revision=response.revision;
        this.error='Speichern nicht bestätigt: Die Integration hat die Programmbedingungen, Sensorzuordnungen, Sensorauswahl oder Sensoranzeigenamen nicht vollständig übernommen. Deine Eingaben bleiben im Dialog. Bitte Home Assistant vollständig neu starten (ha core restart).';
        return false;
      }
      this.error = ''; return true;
    } catch(e) { this.error = e.message || String(e); return false; }
    finally { this.busy = false; }
  }
  get windows() { return this.data?.config.windows || []; }
  isBlind(window) {
    if(!window) return false;
    if(window.cover_type && window.cover_type!=='auto') return window.cover_type==='blind';
    const a=this._hass.states[window.cover]?.attributes;
    return a ? a.device_class==='blind' || !!((Number(a.supported_features)||0)&128) : window.resolved_type==='blind';
  }
  windowName(id) { return this.windows.find(w => w.id === id)?.name || id; }
  covers(program, ride) {
    return [...new Set((ride ? [ride] : program.rides).flatMap(r => r.targets).map(t => this.windows.find(w => w.id === t)?.cover).filter(Boolean))];
  }
  can(program) { return this.data?.admin || this.data?.controls[program.id]; }
  when(ride, kind) {
    if(ride.edge==='opening')return this.language()==='en'?'Window opens':'Fenster öffnet';
    if (kind === 'sensor') {
      const program=this.editor?.type==='program' && this.editor.item.rides.some(r=>r.id===ride.id)?this.editor.item:this.data.config.programs.find(p=>p.rides.some(r=>r.id===ride.id));
      const rule={...this.selectedRule(this.windows.find(w=>w.id===ride.targets[0]),ride)};
      if(program?.conditions?.mode==='lux')rule.temp_entity=null;
      if(program?.conditions?.mode==='temp')rule.lux_entity=null;
      return ride.edge === 'active' ? this.sensorTriggerText(rule) : (this.language()==='en'?'Released':'Wieder freigegeben');
    }
    if (ride.event === 'fixed') return this.language()==='en'?`at ${this.clockLabel(ride.time)}`:ride.time + ' Uhr';
    let text = ride.event === 'sunrise' ? 'Sonnenaufgang' : 'Sonnenuntergang';
    if (ride.offset) text += ` ${ride.offset > 0 ? '+' : '−'} ${Math.abs(ride.offset)} Min.`;
    const due = ride.today_due ? new Date(ride.today_due).toLocaleTimeString(this.locale(), {hour:'2-digit',minute:'2-digit',timeZone:this.data?.time_zone || this._hass?.config?.time_zone}) : '';
    const prefix = due ? (this.language()==='en'?due:due+' Uhr')+' · ' : '';
    return `${prefix}${text} · ${ride.earliest}–${ride.latest}`;
  }
  clockLabel(value) {
    if(this.language()!=='en')return value;
    const [hours,minutes]=String(value||'00:00').split(':').map(Number), suffix=hours<12?'AM':'PM';
    return `${hours%12||12}:${String(minutes||0).padStart(2,'0')} ${suffix}`;
  }
  sensorTriggerText(g) {
    if(g?.lux_entity && g?.temp_entity) return 'Helligkeit und Temperatur erreicht';
    if(g?.temp_entity) return 'Temperatur erreicht';
    if(g?.lux_entity) return 'Helligkeit erreicht';
    return 'Sensorbedingung erreicht';
  }
  gateSummary(g) {
    return [g.lux_entity?this.sensorName(g.lux_entity):'',g.temp_entity?this.sensorName(g.temp_entity):''].filter(Boolean).join(' · ');
  }
  targetsText(ride) {
    if(ride.restore_schedule) return 'Aktuelle Zeitplanposition';
    if(ride.restore_before) return 'Position vor Beschattung';
    return [ride.position != null ? `Höhe ${ride.position}%` : '', ride.tilt != null ? `Lamellen ${ride.tilt}%` : ''].filter(Boolean).join(' · ');
  }
  usedSensors() {
    const refs=[...(this.data?.config.sensors || []),...(this.data?.sensor_entities || this.windows.flatMap(w=>[
      ...(w.contacts || []).map(c=>c.entity),...(w.sensor_rules || []).flatMap(g=>[g.temp_entity,g.lux_entity])]))];
    return [...new Set(refs.filter(Boolean))].sort((a,b)=>this.sensorName(a).localeCompare(this.sensorName(b),this.language()==='en'?'en':'de'));
  }
  sensorName(entity) { return this.data?.config.sensor_names?.[entity] || this._hass?.states[entity]?.attributes.friendly_name || entity; }
  sensorKind(entity) {
    if(this.windows.some(w=>(w.contacts || []).some(c=>c.entity===entity)))return 'opening';
    if(this.windows.some(w=>(w.sensor_rules || []).some(g=>g.temp_entity===entity)))return 'temperature';
    if(this.windows.some(w=>(w.sensor_rules || []).some(g=>g.lux_entity===entity)))return 'illuminance';
    const a=this._hass?.states[entity]?.attributes || {};
    if(entity.startsWith('binary_sensor.') || entity.startsWith('input_boolean.'))return 'opening';
    if(a.device_class==='temperature' || ['°C','°F','K'].includes(a.unit_of_measurement))return 'temperature';
    if(a.device_class==='illuminance' || ['lx','klx','lux'].includes(String(a.unit_of_measurement || '').trim().toLowerCase()))return 'illuminance';
    return 'other';
  }
  sensorValue(entity) {
    const s=this._hass?.states[entity];
    if(!s || s.state==='unavailable')return 'Nicht verfügbar';
    if(s.state==='unknown')return 'Unbekannt';
    if(this.sensorKind(entity)==='opening') {
      const contact=this.windows.flatMap(w=>w.contacts || []).filter(c=>c.entity===entity);
      if(contact.length && new Set(contact.map(c=>c.open_state)).size===1)return s.state===contact[0].open_state?'Offen':'Geschlossen';
      if(['window','door','opening','garage_door'].includes(s.attributes.device_class))return s.state==='on'?'Offen':'Geschlossen';
      return s.state==='on'?'Offen':s.state==='off'?'Geschlossen':s.state;
    }
    const number=Number(s.state), numeric=s.state.trim()!=='' && Number.isFinite(number);
    if(numeric && this.sensorKind(entity)==='temperature')return new Intl.NumberFormat(this.locale(),{minimumFractionDigits:1,maximumFractionDigits:1}).format(number)+' '+(s.attributes.unit_of_measurement || '°C');
    if(numeric && this.sensorKind(entity)==='illuminance') {
      const unit=String(s.attributes.unit_of_measurement || 'lx').trim().toLowerCase();
      if(['lx','klx','lux'].includes(unit)) {
        const lux=number*(unit==='klx'?1000:1);
        return new Intl.NumberFormat('de-DE',{useGrouping:true,maximumFractionDigits:0}).format(lux)+' lx';
      }
    }
    return (numeric?new Intl.NumberFormat(this.locale(),{maximumFractionDigits:2}).format(number):s.state)+(s.attributes.unit_of_measurement?' '+s.attributes.unit_of_measurement:'');
  }
  sunTime(event) {
    const date=new Date(this.data?.sun_times?.[event] || NaN);
    if(!Number.isFinite(date.getTime()))return '—';
    return date.toLocaleTimeString(this.locale(),{hour:'2-digit',minute:'2-digit',timeZone:this.data.time_zone || this._hass?.config?.time_zone});
  }
  overviewHtml() {
    const sensors=this.usedSensors();
    return `<div class="sun-row">${[['sunrise','Sonnenaufgang'],['sunset','Sonnenuntergang']].map(([event,label])=>`<span class="sun-value" title="${label}" aria-label="${label} ${esc(this.sunTime(event))}">${this.statusIcon(event)}<span>${esc(this.sunTime(event))}</span></span>`).join('')}</div>${[['opening','Öffnungssensoren'],['temperature','Temperatur'],['illuminance','Helligkeit'],['other','Weitere Sensoren']].map(([kind,label])=>{
      const entities=sensors.filter(entity=>this.sensorKind(entity)===kind);
      return entities.length?`<section class="overview-group" aria-label="${label}"><h4>${label}</h4><div class="sensor-grid">${entities.map(entity=>{
        const value=this.sensorValue(entity), lock=kind==='opening' && ['Offen','Geschlossen'].includes(value);
        return `<div class="overview-item sensor-value" title="${esc(entity)}"><span class="sensor-label">${esc(this.sensorName(entity))}</span><span class="sensor-state">${this.statusIcon(lock?(value==='Offen'?'unlock':'lock'):kind==='opening'?'unknown':kind)}<span ${lock?'class="visually-hidden"':''}>${esc(value)}</span></span></div>`;
      }).join('')}</div></section>`:'';
    }).join('')}`;
  }
  statusIcon(kind) {
    return uiIcon(ICON_NAMES.includes(kind)?kind:'unknown').replace('class="ui-icon','class="ui-icon status-icon');
  }
  overviewVisible() {
    if(this.showOverview===undefined){try{this.showOverview=localStorage.getItem(this.foldKey()+':overview')!=='hidden';}catch{this.showOverview=true;}}
    return this.showOverview;
  }
  updateOverview() {
    const overview=this.shadowRoot?.querySelector('.overview');
    if(overview && this.data){overview.innerHTML=this.overviewHtml();this.translateCard(overview);}
  }
  fmt(date) { return new Date(date).toLocaleString(this.locale(), {weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}); }
  captureEditorView() {
    const body=this.shadowRoot.querySelector('.modal-body'), active=this.shadowRoot.activeElement;
    if(!body)return null;
    let focus=null;
    if(active?.closest('.modal')) {
      focus={key:active.dataset.key,target:active.dataset.rideTarget,action:active.dataset.action,index:active.dataset.index,valueKey:active.dataset.valueKey,
        rideId:active.closest('[data-ride-id]')?.dataset.rideId};
      if(typeof active.selectionStart==='number')Object.assign(focus,{start:active.selectionStart,end:active.selectionEnd,direction:active.selectionDirection});
    }
    return {top:body.scrollTop,left:body.scrollLeft,focus};
  }
  restoreEditorView(view) {
    const body=this.shadowRoot.querySelector('.modal-body');
    if(!body || !view)return;
    const f=view.focus;
    if(f) {
      const panel=f.rideId?[...body.querySelectorAll('[data-ride-id]')].find(el=>el.dataset.rideId===f.rideId):null;
      const scope=f.rideId?panel:this.shadowRoot.querySelector('.modal');
      const index=panel?.dataset.rideIndex;
      const reindex=key=>f.rideId && key?.startsWith('rides.')?key.replace(/^rides\.\d+\./,'rides.'+index+'.'):key;
      const target=[...(scope?.querySelectorAll('input,select,textarea,button') || [])].find(el=>
        f.key!==undefined?el.dataset.key===reindex(f.key):f.target!==undefined?el.dataset.rideTarget===(index ?? f.target):
        f.action!==undefined?el.dataset.action===f.action && (f.valueKey!==undefined?el.dataset.valueKey===reindex(f.valueKey):f.index===undefined || el.dataset.index===(index ?? f.index)):false);
      if(target && !target.disabled) {
        target.focus({preventScroll:true});
        if(f.start!==undefined && target.setSelectionRange)target.setSelectionRange(f.start,f.end,f.direction);
      }
    }
    body.scrollTop=view.top;body.scrollLeft=view.left;
  }
  navigationHtml() {
    const current=this.tab || 0, active=current===3?'settings':current===4?'help':String(current);
    return navigation({label:'Rollladensteuerung',active,helpLabel:'Howto',items:[{id:'0',label:'Programme'},{id:'1',label:'Zeitprogramm',icon:'schedule'},{id:'2',label:'Sensorprogramme',icon:'sensors'}]})
      .replaceAll('data-action="navigate"','data-action="tab"').replaceAll('data-page="settings"','data-tab="3"').replaceAll('data-page="help"','data-tab="4"').replaceAll('data-page=','data-tab=');
  }
  render() {
    if (!this.shadowRoot) return;
    if(this.editor && !this.renderedEditor) {
      const opener=this.shadowRoot.activeElement;
      this.editorReturnFocus=opener?.dataset.action?'button'+Object.entries(opener.dataset).map(([key,value])=>`[data-${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${CSS.escape(value)}"]`).join(''):null;
    }
    const d = this.data, admin = d?.admin;
    const navScroll=this.shadowRoot.querySelector('nav')?.scrollLeft || 0;
    const editorView=this.returnEditorView || (this.editor && this.editor===this.renderedEditor && (this.editor.transfer || null)===this.renderedTransfer?this.captureEditorView():null);
    this.returnEditorView=null;
    // Keep HA's Lit host mounted: its shadow slot is not available immediately
    // after construction, so recreating it makes modal scroll restoration see
    // zero-height content and silently clamp scrollTop back to zero.
    let card=this.shadowRoot.querySelector('ha-card');
    if(!card) {
      this.shadowRoot.innerHTML='<style></style><ha-card></ha-card>';
      card=this.shadowRoot.querySelector('ha-card');
    }
    this.shadowRoot.querySelector('style').textContent=this.css();
    card.innerHTML = `
      ${d ? this.navigationHtml() : ''}
      ${d && (this.tab||0)===0?`<div class="overview-panel"><button class="overview-toggle" data-action="toggle-overview" aria-controls="overview-content" aria-expanded="${this.overviewVisible()}">${uiIcon('chevron',{expanded:this.overviewVisible()})}<span>Messwerte</span></button><section id="overview-content" class="overview" aria-label="Sonnenzeiten und Sensorwerte" ${this.overviewVisible()?'':'hidden'}>${this.overviewHtml()}</section></div>`:''}
      ${this.error ? `<div class="error" role="alert">${esc(this.error)} <button data-action="refresh">Neu laden</button></div>` : ''}
      ${d ? `<main>${(this.tab||0)===0 ? this.programList() : this.tab===1 ? this.plannedList() : this.tab===2 ? this.sensorProgramList() : this.tab===3 ? this.settingsList() : this.howtoList()}</main>` : '<main>Integration unter Einstellungen → Geräte & Dienste hinzufügen.</main>'}
      ${this.editor ? this.editorDialogHtml() : ''}
    `;
    this.applySharedControls(card);
    this.applySharedIconButtons(card);
    const modal=card.querySelector('dialog.modal');
    if(modal) {
      modal.addEventListener('cancel', event=>{event.preventDefault();if(this.editor?.transfer)this.cancelTransfer();else this.editor=null;this.render();});
      modal.showModal();
    }
    this.translateCard(card);
    if(this.shadowRoot.querySelector('nav')) this.shadowRoot.querySelector('nav').scrollLeft=navScroll;
    this.revealTab();
    this.unbindUI ||= bindUI(this.shadowRoot, ({originalEvent}) => this.onClick(originalEvent));
    this.shadowRoot.addEventListener('change', this.changeHandler ||= e => this.onChange(e));
    this.shadowRoot.addEventListener('input', this.inputHandler ||= e => this.onInput(e));
    this.shadowRoot.addEventListener('keydown', this.keyHandler ||= e => { if(e.key === 'Escape' && this.editor) {e.preventDefault();if(this.editor.transfer)this.cancelTransfer();else this.editor=null;this.render();} });
    if (this.editor && this.focusEditor) {
      this.focusEditor = false;
      this.shadowRoot.querySelector('.modal input, .modal button')?.focus({preventScroll:true});
    } else this.restoreEditorView(editorView);
    if(this.focusRide && this.editor?.type==='program') {
      const panel=[...this.shadowRoot.querySelectorAll('[data-ride-id]')].find(el=>el.dataset.rideId===this.focusRide);
      const body=this.shadowRoot.querySelector('.modal-body');
      if(panel && body) {
        const top=panel.getBoundingClientRect().top-body.getBoundingClientRect().top;
        body.scrollTop+=top-8;
        panel.querySelector('[data-ride-target]')?.focus({preventScroll:true});
      }
    }
    if(this.focusTransfer) {
      this.shadowRoot.querySelector('.transfer-modal [data-transfer-target]')?.focus({preventScroll:true});
    }
    this.focusTransfer=null;
    this.focusRide=null;this.renderedEditor=this.editor;this.renderedTransfer=this.editor?.transfer || null;
    if(!this.editor && this.editorReturnFocus) {
      this.shadowRoot.querySelector(this.editorReturnFocus)?.focus({preventScroll:true});this.editorReturnFocus=null;
    }
  }
  editorDialogHtml() {
    const template=document.createElement('template');template.innerHTML=this.editorHtml();
    const source=template.content.querySelector('.modal');
    const html=uiDialog({id:'shutter-editor',title:source.querySelector('h3').textContent,
      content:source.querySelector('.modal-body').innerHTML,actions:source.querySelector('footer').innerHTML,
      closeLabel:this.language()==='en'?'Close':'Schließen'});
    const close=this.editor?.transfer?'cancel-transfer':'cancel';
    return html.replace('data-ui="close-dialog"',`data-action="${close}"`)
      .replace('class="modal"',`class="modal${source.classList.contains('transfer-modal')?' transfer-modal':''}"`)
      .replace('aria-labelledby=',`aria-label="${esc(source.getAttribute('aria-label'))}" aria-labelledby=`);
  }
  applySharedControls(card) {
    // Preserve application data attributes while rendering the shared controls.
    for(const [index,label] of [...card.querySelectorAll('label.field')].entries()) {
      const source=label.querySelector(':scope>input,:scope>select');
      if(!source || source.matches('[type=checkbox],[type=range]'))continue;
      const text=label.querySelector(':scope>span')?.textContent || '',id=source.id || 'shutter-field-'+index;
      const template=document.createElement('template');
      template.innerHTML=source.tagName==='SELECT'?uiSelectField({id,label:text,value:source.value,options:[],disabled:source.disabled}):uiField({id,label:text,value:source.value,type:source.type,disabled:source.disabled});
      const shared=template.content.firstElementChild,target=shared.querySelector('input,select');
      for(const attribute of source.attributes)target.setAttribute(attribute.name,attribute.value);
      target.id=id;shared.htmlFor=id;
      if(source.tagName==='SELECT')target.innerHTML=source.innerHTML;
      for(const cls of label.classList)shared.classList.add(cls);
      label.replaceWith(shared);
    }
    for(const [index,list] of [...card.querySelectorAll('.cover-list,.sensor-selection-list')].entries()) {
      const sources=[...list.querySelectorAll('label.cover-option')];
      if(!sources.length)continue;
      const items=sources.map((row,i)=>({value:String(i),label:row.querySelector('strong').textContent,description:row.querySelector('small')?.textContent,hint:row.querySelectorAll('small')[1]?.textContent,disabled:row.querySelector('input').disabled}));
      const values=sources.flatMap((row,i)=>row.querySelector('input').checked?[String(i)]:[]);
      const template=document.createElement('template');template.innerHTML=uiMultiSelect({id:'shutter-selection-'+index,label:'',items,values,search:false,all:false});
      const shared=template.content.firstElementChild;shared.removeAttribute('data-ui-multi');shared.removeAttribute('data-control-action');
      shared.querySelector('legend').hidden=true;shared.querySelector('[data-selection-count]').remove();shared.querySelector('.fui-selection-empty').remove();
      for(const [i,row] of [...shared.querySelectorAll('label.cover-option')].entries()) {
        const source=sources[i],input=row.querySelector('input');
        for(const attribute of source.attributes)if(attribute.name!=='class')row.setAttribute(attribute.name,attribute.value);
        for(const attribute of source.querySelector('input').attributes)input.setAttribute(attribute.name,attribute.value);
      }
      list.classList.remove('fui-selection-list');list.replaceChildren(shared);
    }
    for(const original of [...card.querySelectorAll('button[data-action]')]) {
      if(original.querySelector('svg') || original.closest('nav,.program-order') || original.matches('.toggle,.program-title,.program-group-head,.settings-fold,.overview-toggle,.settings-button'))continue;
      const template=document.createElement('template');
      template.innerHTML=uiButton({label:original.textContent,action:original.dataset.action,disabled:original.disabled,variant:original.classList.contains('primary')?'primary':original.classList.contains('danger')?'danger':'text'});
      const shared=template.content.firstElementChild;
      for(const attribute of original.attributes)shared.setAttribute(attribute.name,attribute.value);
      original.replaceWith(shared);
    }
  }
  applySharedIconButtons(card) {
    for(const original of card.querySelectorAll('button[data-action]')) {
      if(original.matches('.settings-button,.icon-tab') || original.textContent.trim())continue;
      const svg=original.querySelector('svg[data-icon]');
      if(!svg || svg.dataset.icon==='chevron')continue;
      const data={...original.dataset};delete data.action;
      const label=original.getAttribute('aria-label') || original.title;
      if(!label)continue;
      const template=document.createElement('template');
      template.innerHTML=iconButton({icon:svg.dataset.icon,label,action:original.dataset.action,data,disabled:original.disabled,danger:original.classList.contains('danger')});
      const shared=template.content.firstElementChild;
      for(const cls of original.classList)shared.classList.add(cls);
      if(original.title)shared.title=original.title;
      original.replaceWith(shared);
    }
  }
  language() {
    try { return localStorage.getItem('shutter-manager:language:'+(this._hass?.user?.id || 'local')) === 'en' ? 'en' : 'de'; }
    catch { return 'de'; }
  }
  locale() { return this.language()==='en'?'en-GB':'de-DE'; }
  setLanguage(language) {
    try { localStorage.setItem('shutter-manager:language:'+(this._hass?.user?.id || 'local'), language === 'en' ? 'en' : 'de'); } catch {}
  }
  translateCard(card) {
    if (this.language() !== 'en' || !card) return;
    const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const raw=node.nodeValue, trimmed=raw.trim();
      let translated=ENGLISH[trimmed] || trimmed;
      const count=trimmed.match(/^(\d+) Fahrten?$/);
      if(count)translated=`${count[1]} ${Number(count[1])===1?'action':'actions'}`;
      for(const [de,en] of [['Wartet –','Waiting —'],['Ausgesetzt –','Paused —'],['Ausgesetzt bis Tür geschlossen','Paused until door closes'],[' · wird nachgeholt',' · will be retried'],['(dieses Programm)','(this program)'],[' Uhr',''],[' Min.',' min'],['Höhe ','Position '],['Lamellen ','Tilt '],['Öffnungsprogramm','Opening program'],['Außerhalb des Zeitfensters','Outside the time window'],['Nicht fahren','Do not move'],['Trotzdem fahren','Proceed anyway'],['Fahrt nachholen','Retry after closing']])translated=translated.replaceAll(de,en);
      if (translated!==trimmed) node.nodeValue=raw.replace(trimmed,translated);
    }
    for(const el of card.querySelectorAll('[aria-label],[title],[placeholder]')) for(const attr of ['aria-label','title','placeholder']) {
      const value=el.getAttribute(attr); if(value && ENGLISH[value]) el.setAttribute(attr,ENGLISH[value]);
    }
  }
  foldKey() { return 'shutter-manager:expanded:'+CARD_VERSION+':'+ (this._hass?.user?.id || 'local')+':'+location.pathname+':'+(this.config?.title || 'default'); }
  collapsedProgramGroups() {
    if(!this.collapsedGroups) {
      try {const values=JSON.parse(localStorage.getItem(this.foldKey()+':groups') || '[]');this.collapsedGroups=new Set(Array.isArray(values)?values:[]);}
      catch {this.collapsedGroups=new Set();}
    }
    return this.collapsedGroups;
  }
  expanded() {
    if(!this.expandedPrograms) {
      try {const ids=JSON.parse(localStorage.getItem(this.foldKey()) || '[]');this.expandedPrograms=new Set(Array.isArray(ids)?ids:[]);}
      catch {this.expandedPrograms=new Set();}
    }
    return this.expandedPrograms;
  }
  programList() {
    const {config:c,admin}=this.data,programs=c.programs;
    const actions=admin?`<div class="page-actions"><span></span>${programAddButton()}</div>`:'';
    if(!programs.length)return actions+'<div class="empty">Zuerst in den Einstellungen die Rollläden und Sensoren zuordnen. Danach ein Zeit- oder Sensorprogramm anlegen.</div>';
    return actions+[{key:'time',name:'Zeitprogramme',programs:programs.filter(p=>p.kind==='time')},{key:'sensor',name:'Sensorprogramme',programs:programs.filter(p=>p.kind==='sensor')}].filter(group=>group.programs.length).map(group=>{
      const expanded=!this.collapsedProgramGroups().has(group.key);
      const content=expanded?group.programs.map((p,index)=>{
        const domId='program-'+group.key+'-'+index,open=this.expanded().has(p.id),meta=[];
        if(this.isOpening(p))meta.push(p.opening_start+'–'+p.opening_end);
        else if(p.conditions){
          meta.push(p.start===p.end?'Ganztägig':p.start+'–'+p.end);
          meta.push([p.conditions.mode!=='temp'?'≥ '+p.conditions.lux_on+' lx':'',p.conditions.mode!=='lux'?'≥ '+p.conditions.temp_on+' °C':''].filter(Boolean).join(' · '));
        }
        meta.push(p.days.map(i=>DAYS[i]).join(' · ') || 'Keine Tage');
        const rides=open?p.rides.map(r=>{
          let row=uiActionRow({title:this.windowName(r.targets[0]),description:this.when(r,p.kind),detail:this.targetsText(r),enabled:r.enabled,
            actions:toggle('ride',r.enabled,'',`data-program="${esc(p.id)}" data-target="${esc(r.id)}"`,!this.can(p))});
          if(p.kind==='sensor' && !this.isOpening(p))row=row.replace('</span>',`</span><small>Zuordnung: ${esc(this.selectedRule(this.windows.find(w=>w.id===r.targets[0]),r)?.name || 'Bitte auswählen')}</small>`);
          return row;
        }).join(''):'';
        let row=uiProgramRow({id:domId,title:p.name,meta,enabled:p.enabled,expanded:open,index,count:group.programs.length,editable:admin,
          content:open?`<div class="actions">${rides || '<p>Noch keine Fahrten. Unter Bearbeiten hinzufügen.</p>'}</div>`:''});
        row=row.replaceAll(`data-program="${domId}"`,`data-program="${esc(p.id)}"`)
          .replace('data-ui="collapse"',`data-action="fold-program" data-program="${esc(p.id)}"`)
          .replace('data-action="program-enabled"','data-action="program"')
          .replace(`aria-label="${esc(p.name+' aktiv')}"`,'aria-label="Programm aktiv"');
        if(!this.can(p))row=row.replace(/<button[^>]*role="switch"[^>]*>/,tag=>tag.slice(0,-1)+' disabled>');
        return row;
      }).join(''):'';
      return uiProgramGroup({id:'program-group-'+group.key,title:group.name,count:group.programs.length,expanded,content})
        .replace('data-ui="collapse"',`data-action="fold-program-group" data-group="${group.key}"`);
    }).join('');
  }

  howtoList() { return `<article class="howto">${versionInfo({frontend:CARD_VERSION,backend:this.data.backend_version || 'Version nicht gemeldet',ui:UI_VERSION,label:this.language()==='en'?'Interface':'Oberfläche'}).replace('class="version-info"','class="version-info"')}${this.language()==='en'?HOWTO_HTML_EN:HOWTO_HTML}</article>`; }
  isOpening(program=this.editor?.item) { return program?.kind==='sensor' && program.sensor_mode==='opening'; }
  hasOpeningContacts(window) { return !!window?.contacts?.length; }
  hasSensors(window) { return !!window?.sensor_rules?.some(g=>g.lux_entity || g.temp_entity); }
  selectedRule(window, ride) { return window?.sensor_rules?.find(g=>g.id===ride.sensor_rule); }
  settingsSectionVisible(section) {
    if(!this.settingsSections){
      this.settingsSections={};
      for(const key of ['covers','sensors','status','daily-history']){
        const defaultVisible=false;
        try {
          const saved=localStorage.getItem(this.foldKey()+':settings:'+key);
          this.settingsSections[key]=saved===null?defaultVisible:saved==='visible';
        } catch { this.settingsSections[key]=defaultVisible; }
      }
    }
    return this.settingsSections[section] ?? true;
  }
  settingsSection(section,title,content,options={}) {
    return uiSection({id:'settings-'+section,title:options.heading || title,content,trailing:options.trailing || '',expanded:this.settingsSectionVisible(section)})
      .replace(`data-settings="settings-${section}"`,`data-settings="${section}"`)
      .replace('data-ui="collapse"',`data-action="toggle-settings-section" data-section="${section}"`);
  }
  coverStateList() {
    return this.windows.map(w=>{
      const item=(this.data?.cover_states || []).find(x=>x.window===w.id) || {};
      const position=item.position!=null && Number.isFinite(Number(item.position))?`${Number(item.position)}%`:'—';
      const tilt=item.tilt!=null && Number.isFinite(Number(item.tilt))?`${Number(item.tilt)}%`:'—';
      const axes=[`${this.language()==='en'?'Position':'Höhe'} ${position}`,this.isBlind(w)?`${this.language()==='en'?'Tilt':'Lamellen'} ${tilt}`:''].filter(Boolean).join(' · ');
      return uiRow({title:w.name,trailing:`<span class="cover-position">${esc(axes)}</span>`}).replace('class="setting-row"',`class="setting-row cover-status-row" data-window="${esc(w.id)}"`);
    }).join('') || `<p class="hint">${this.language()==='en'?'No covers added.':'Keine Rollläden oder Jalousien hinzugefügt.'}</p>`;
  }
  dailyHistory() {
    const english=this.language()==='en',rows=[...(this.data?.daily_history || [])].sort((a,b)=>a.time.localeCompare(b.time));
    if(!rows.length)return `<p class="hint">${english?'No movements completed today.':'Heute wurden noch keine Fahrbefehle ausgeführt.'}</p>`;
    const zone=this.data?.time_zone || this._hass?.config?.time_zone;
    return `<div class="daily-history" role="list">${rows.map(row=>{
      const failed=row.kind==='error',label=failed?(english?'Failed':'Fehlgeschlagen'):(english?'Completed':'Erfolgreich');
      const time=new Date(row.time).toLocaleTimeString(this.locale(),{hour:'2-digit',minute:'2-digit',timeZone:zone});
      const description=row.command?[row.command,this.targetsText(row)].filter(Boolean).join(' · '):row.message;
      return `<div class="daily-history-row ${failed?'failed':'completed'}" role="listitem"><time datetime="${esc(row.time)}">${esc(time)}</time><div class="daily-command"><strong>${esc(this.windowName(row.window))}</strong><small>${esc(description)}</small>${failed && row.command && row.message?`<small class="failure-reason" title="${esc(row.message)}">${esc(row.message)}</small>`:''}</div><span class="command-result">${this.statusIcon(failed?'failure':'success')}${label}</span></div>`;
    }).join('')}</div>`;
  }
  settingsList() {
    const {config:c,admin}=this.data;
    return `<section class="settings-group language-group">${uiRow({title:'Sprache',trailing:`<div class="language-picker">${filterButton({label:'🇩🇪 DE',action:'set-language',selected:this.language()==='de',data:{language:'de'}})}${filterButton({label:'🇬🇧 EN',action:'set-language',selected:this.language()==='en',data:{language:'en'}})}</div>`}).replace('<strong>','<strong role="heading" aria-level="3">')}</section>
      <section class="settings-group">${uiRow({title:this.language()==='en'?'Vacation mode':'Urlaubsmodus',trailing:toggle('vacation',c.vacation,this.language()==='en'?'Vacation mode':'Urlaubsmodus','',!admin)})}</section>
      ${this.settingsSection('covers',this.language()==='en'?'Shutters and blinds':'Rollläden und Jalousien',this.windowList(),{trailing:admin?`${uiButton({label:this.language()==='en'?'Select covers':'Rollläden auswählen',action:'select-covers',variant:'primary'}).replace('class="primary"','class="primary settings-select"')}`:''})}
      ${this.settingsSection('sensors',this.language()==='en'?'Sensors':'Sensoren',this.sensorSettingsList(),{trailing:admin?`${uiButton({label:this.language()==='en'?'Select sensors':'Sensoren auswählen',action:'select-sensors',variant:'primary'}).replace('class="primary"','class="primary settings-select"')}`:''})}
      ${this.settingsSection('status',this.language()==='en'?'Current status':'Aktueller Status',this.coverStateList())}
      ${this.settingsSection('daily-history',this.language()==='en'?"Today's history":'Heutige Historie',this.dailyHistory())}
      ${admin?'<section class="settings-group"><h3>Sicherung</h3><div class="toolbar backup-actions"><button data-action="export">Sicherung erstellen</button><button data-action="import">Sicherung wiederherstellen</button></div><input type="file" id="import-file" accept="application/json,.json" hidden></section>':''}${versionInfo({frontend:CARD_VERSION,backend:this.data.backend_version || 'Version nicht gemeldet',ui:UI_VERSION,label:this.language()==='en'?'Interface':'Oberfläche'}).replace('class="version-info"','class="version-info settings-version-info"')}`;
  }
  pending() {
    const entries = Object.entries(this.data.pending).flatMap(([w,slots])=>Object.values(slots).map(s=>`<div><strong>${esc(this.windowName(w))}</strong> · ${esc(s.name)}<br><small>${esc(s.reason || (this.data.moving.includes(w)?'Wird ausgeführt':'Wartet auf Ausführung'))}</small></div>`));
    return entries.length ? `<section class="pending"><h3>Aktuelle Fahrten</h3>${entries.join('')}</section>` : '';
  }
  windowList() {
    const {admin}=this.data;
    return this.windows.map(w=>{
      const description=[(this.isBlind(w)?'Jalousie':'Rollladen')+' · '+w.cover,
        ...(w.contacts || []).map(c=>(this._hass.states[c.entity]?.attributes.friendly_name || c.entity)+': '+POLICY[c.policy]),
        ...(w.sensor_rules || []).map(g=>g.name+': '+this.gateSummary(g))].join(' · ');
      return uiRow({title:w.name,description,trailing:toggle('window',w.enabled,'',`data-target="${w.id}"`,!admin)+(admin?iconButton({icon:'edit',label:'Bearbeiten',action:'edit-window',data:{target:w.id}}):'')}).replace('class="setting-row"','class="setting-row window"');
    }).join('') || '<div class="empty">Vorhandene Rollläden und Jalousien über „Rollläden auswählen“ auswählen. Die Anzeigenamen lassen sich anschließend unter Bearbeiten ändern.</div>';
  }
  plannedReason(row) {
    if(row.blocked_contacts?.length) {
      const unavailable=row.blocked_contacts.some(c=>c.unavailable);
      const names=row.blocked_contacts.map(c=>this.sensorName(c.entity)).join(', ');
      if(row.contact_preview && row.blocked_contacts.some(c=>c.policy==='skip'))return `Wird ausgelassen, falls ${unavailable?'Öffnungssensor bei Fälligkeit nicht verfügbar':'Tür bei Fälligkeit offen'} (${names})`;
      return `${unavailable?'Ausgesetzt – Öffnungssensor nicht verfügbar':'Ausgesetzt bis Tür geschlossen'} (${names})${row.contact_preview?'':' · wird nachgeholt'}`;
    }
    if(row.status==='moving')return 'Wird ausgeführt';
    return row.status==='pending' && row.reason?`Wartet – ${row.reason}`:row.reason || '';
  }
  plannedList() {
    const rows = (this.data.planned || []).filter(row=>['planned','paused','pending','moving','error'].includes(row.status));
    const labels = {planned:'Geplant', paused:'Pausiert', pending:'Wartet', moving:'Wird ausgeführt'};
    const date = this.data.planned_date ? new Date(this.data.planned_date+'T12:00:00').toLocaleDateString(this.locale(),{weekday:'long',day:'2-digit',month:'2-digit'}) : 'Heute';
    const once=this.onceForm || {time:'',target:'',position:'100',tilt:''}, onceWindow=this.windows.find(w=>w.id===once.target);
    const onceForm=this.onceFormOpen?`<div class="once-form"><label class="field"><span>Uhrzeit</span><input data-once="time" type="time" value="${esc(once.time)}"></label><label class="field"><span>Rollladen / Jalousie</span><select data-once="target"><option value="">Bitte auswählen</option>${this.windows.filter(w=>w.enabled).map(w=>`<option value="${esc(w.id)}" ${w.id===once.target?'selected':''}>${esc(w.name)}</option>`).join('')}</select></label><label class="field"><span>Höhe (%)</span><input data-once="position" type="number" min="0" max="100" value="${esc(once.position)}"></label>${onceWindow && this.isBlind(onceWindow)?`<label class="field"><span>Lamellen (%) · optional</span><input data-once="tilt" type="number" min="0" max="100" value="${esc(once.tilt)}" placeholder="unverändert"></label>`:''}<div class="toolbar full"><button data-action="cancel-once-form">Abbrechen</button><button class="primary" data-action="add-once">Einzelfahrt einplanen</button></div></div>`:'';
    return `<div class="toprow planned-heading"><h3>${esc(date)}</h3><button data-action="open-once-form">+ Einzelfahrt</button></div>${onceForm}
      ${rows.map(row=>`<section class="planned-row setting-row ${row.skip?'skipped':''}" title="${esc([row.name,row.status==='contact_skipped'?'Ausgelassen':row.skip?'Einmal ausgelassen':labels[row.status] || row.status,this.plannedReason(row),row.carried?'Offen seit '+this.fmt(row.time):''].filter(Boolean).join(' · '))}">
        <time class="planned-time" datetime="${esc(row.time)}">${esc(new Date(row.time).toLocaleTimeString(this.locale(),{hour:'2-digit',minute:'2-digit',timeZone:this.data.time_zone || this._hass?.config?.time_zone}))}</time>
        <div class="planned-cover row-text"><div class="planned-target"><strong>${esc(row.targets.map(t=>this.windowName(t)).join(', '))}</strong><span class="planned-position hint">${esc(this.targetsText(row))}</span></div></div>
        <div class="planned-action">${row.one_time?`<button data-action="cancel-once" data-target="${esc(row.occurrence)}" aria-label="Einzelfahrt entfernen" ${!row.can_control?'disabled':''}>Entfernen</button>`:`<button data-action="skip-today" data-occurrence="${esc(row.occurrence)}" aria-label="${row.skip?(this.language()==='en'?'Reschedule':'Wieder einplanen'):(this.language()==='en'?'Skip':'Auslassen')}" class="${row.skip?'':'primary'}" ${!row.can_control || (row.skip && !row.can_undo)?'disabled':''}>${row.skip?(this.language()==='en'?'Reschedule':'Wieder einplanen'):(this.language()==='en'?'Skip':'Auslassen')}</button>`}</div>
        ${this.plannedReason(row)?`<small class="planned-reason">${esc(this.plannedReason(row))}</small>`:''}
      </section>`).join('') || '<div class="empty">Für heute sind keine zukünftigen oder nachzuholenden Fahrten vorhanden.</div>'}`;
  }
  defaultSeason() { return {enabled:false,start:'04-01',end:'10-31'}; }
  seasonDate(value) {
    const match=String(value || '').match(/^(\d{2})-(\d{2})$/);
    return match?match[2]+'.'+match[1]+'.':value;
  }
  seasonText(season) {
    if(!season?.enabled)return this.language()==='en'?'Year-round':'Ganzjährig';
    if(this.language()!=='en')return this.seasonDate(season.start)+' – '+this.seasonDate(season.end);
    const label=value=>{const m=String(value||'').match(/^(\d{2})-(\d{2})$/);return m?new Date(Date.UTC(2024,Number(m[1])-1,Number(m[2]))).toLocaleDateString(this.locale(),{day:'numeric',month:'short',timeZone:'UTC'}):value;};
    return label(season.start)+' – '+label(season.end);
  }
  sharedWeekdays(values) {
    const template=document.createElement('template');template.innerHTML=uiWeekdayPicker({id:'shutter-weekdays',values});
    const shared=template.content.firstElementChild;shared.removeAttribute('data-ui-checks');shared.removeAttribute('data-control-action');
    for(const input of shared.querySelectorAll('input'))input.dataset.day=input.value;
    return shared.outerHTML;
  }
  seasonEditor(path,value) {
    const season=value || this.defaultSeason();
    const template=document.createElement('template');
    template.innerHTML=uiSeasonPicker({id:'shutter-season',label:'',enabled:season.enabled,start:season.start || '04-01',end:season.end || '10-31'});
    const shared=template.content.firstElementChild;shared.classList.add('full');shared.removeAttribute('data-ui-season');shared.removeAttribute('data-control-action');shared.querySelector('legend').hidden=true;
    const enabled=shared.querySelector('[data-season-enabled]');enabled.dataset.key=path+'.enabled';enabled.parentElement.lastChild.textContent='Gültigkeitszeitraum';
    shared.querySelector('[name=start]').dataset.key=path+'.start';shared.querySelector('[name=end]').dataset.key=path+'.end';
    if(!season.enabled)shared.querySelector('.season-dates').remove();
    return shared.outerHTML;
  }
  sensorProgramList() {
    const rows=this.data.sensor_programs || [];
    const date=this.data.planned_date?new Date(this.data.planned_date+'T12:00:00').toLocaleDateString(this.locale(),{weekday:'long',day:'2-digit',month:'2-digit'}):'Heute';
    return `<div class="toprow"><div><h3>${esc(date)}</h3><p class="hint">Für heute gültige Programme. Öffnungsvorrang bleibt bis zum Schließen bestehen.</p></div></div>
      ${rows.map(row=>`<section class="sensor-row setting-row ${row.paused?'sensor-paused':''}"><div class="sensor-summary row-text"><strong>${esc(row.targets.map(t=>this.windowName(t)).join(', '))}</strong><small>${esc(row.name)} · ${row.sensor_mode==='opening'?'Öffnungsprogramm':row.source==='window'?'Direkte Beschattung':'Sensorprogramm'} · ${esc(this.seasonText(row.season))}</small><span class="plan-status fui-status-tag active">${row.paused?'Für heute ausgesetzt'+(row.sensor_mode==='opening' && row.triggered?' · Position bis zum Schließen geschützt':''):row.blocked_reason?esc(row.blocked_reason):row.triggered?(row.source==='window'?'Beschattung aktiv':'Sensorbedingung erfüllt'):'Bereit'}${row.paused?' · Automatisch wieder ab morgen, 00:00 Uhr':''}</span></div><div class="sensor-action"><button class="${row.paused?'':'primary'}" data-action="sensor-pause" data-rule="${esc(row.id)}" ${row.can_control?'':'disabled'}>${row.paused?'Heute wieder aktivieren':'Bis morgen aussetzen'}</button></div></section>`).join('') || '<div class="empty">Heute sind keine Sensorprogramme oder direkten Beschattungsregeln freigegeben. Wochentage und Saison werden berücksichtigt.</div>'}`;
  }
  coverCandidates() {
    const existing = new Map(this.windows.map(w=>[w.cover,w]));
    return Object.entries(this._hass.states).filter(([id])=>id.startsWith('cover.')).map(([entity,state])=>{
      const a=state.attributes || {}, kind=a.device_class;
      return {entity,name:a.friendly_name || entity,existing:existing.get(entity),
        supported:!!((Number(a.supported_features)||0)&132),
        other:!!kind && !['blind','shutter'].includes(kind),
        type:kind==='blind'?'Jalousie':kind==='shutter'?'Rollladen':kind?'Anderer Cover-Typ':'Rollladen / Jalousie'};
    }).sort((a,b)=>a.name.localeCompare(b.name,this.language()==='en'?'en':'de'));
  }
  referencedSensors() {
    return [...new Set(this.windows.flatMap(w=>[...(w.contacts || []).map(c=>c.entity),...(w.sensor_rules || []).flatMap(g=>[g.temp_entity,g.lux_entity])]).filter(Boolean))];
  }
  sensorCandidates() {
    const ids=new Set([...Object.keys(this._hass.states).filter(id=>/^(sensor|binary_sensor|input_boolean)\./.test(id)),...this.usedSensors()]);
    const used=new Set(this.referencedSensors());
    return [...ids].map(entity=>({entity,name:this.sensorName(entity),used:used.has(entity),available:!!this._hass.states[entity]})).sort((a,b)=>a.name.localeCompare(b.name,this.locale()));
  }
  sensorSettingsList() {
    return this.usedSensors().map(entity=>uiRow({title:this.sensorName(entity),description:entity,
      trailing:this.data.admin?iconButton({icon:'edit',label:(this.language()==='en'?'Rename sensor':'Sensor umbenennen')+': '+this.sensorName(entity),action:'edit-sensor-name',data:{entity}}):''})
      .replace('class="setting-row"',`class="setting-row sensor-name-row" data-selected-sensor="${esc(entity)}"`)).join('') || `<p class="hint">${this.language()==='en'?'No sensors selected.':'Noch keine Sensoren ausgewählt.'}</p>`;
  }
  sensorSelectionHtml() {
    const e=this.editor, selected=new Set(e.selected), en=this.language()==='en';
    return `<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-label="${en?'Select sensors':'Sensoren auswählen'}"><div class="modal-head"><h3>${en?'Select sensors':'Sensoren auswählen'}</h3><button data-action="cancel" aria-label="${en?'Close':'Schließen'}">✕</button></div><div class="modal-body"><label class="field import-search"><span>${en?'Search sensors':'Sensor suchen'}</span><input type="search" data-sensor-search value="${esc(e.search)}" placeholder="${en?'Name or entity':'Name oder Entität'}"></label><div class="sensor-selection-list fui-selection-list">${this.sensorCandidates().map(c=>`<label class="cover-option" data-sensor-row="${esc(c.entity)}"><input type="checkbox" data-sensor-choice="${esc(c.entity)}" ${selected.has(c.entity)?'checked':''} ${c.used?'disabled':''}><span><strong>${esc(c.name)}</strong><small>${esc(c.entity)}</small>${c.used?`<small>${en?'Used by a cover rule or contact':'In einer Sensorregel oder als Kontakt verwendet'}</small>`:!c.available?`<small>${en?'Currently unavailable':'Momentan nicht verfügbar'}</small>`:''}</span></label>`).join('') || `<p class="hint">${en?'No sensor entities available.':'Keine Sensor-Entitäten vorhanden.'}</p>`}</div><p data-sensor-empty class="hint" hidden>${en?'No matching sensors.':'Keine passenden Sensoren.'}</p></div><footer>${this.error?`<p class="modal-save-error" role="alert">${esc(this.error)}</p>`:''}<small><span data-sensor-count>${e.selected.length}</span> ${en?'selected':'ausgewählt'}</small><div class="toolbar"><button data-action="cancel">${en?'Cancel':'Abbrechen'}</button><button class="primary" data-action="save-sensors">${en?'Save':'Speichern'}</button></div></footer></section></div>`;
  }
  updateSensorSelection() {
    const query=(this.editor.search || '').trim().toLocaleLowerCase(this.locale());let visible=0;
    for(const row of this.shadowRoot.querySelectorAll('[data-sensor-row]')){row.hidden=!!query && !row.textContent.toLocaleLowerCase(this.locale()).includes(query);if(!row.hidden)visible++;}
    this.shadowRoot.querySelector('[data-sensor-count]').textContent=this.editor.selected.length;
    this.shadowRoot.querySelector('[data-sensor-empty]').hidden=visible>0;
  }
  coverVisible(c) {
    const e=this.editor, q=(e.search || '').trim().toLocaleLowerCase('de');
    return (e.showOther || !c.other) && (!q || (c.name+' '+c.entity).toLocaleLowerCase('de').includes(q));
  }
  coverImportHtml() {
    const e=this.editor, selected=new Set(e.selected), candidates=this.coverCandidates();
    return `<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-label="Rollläden hinzufügen"><div class="modal-head"><h3>Rollläden und Jalousien hinzufügen</h3><button data-action="cancel" aria-label="Schließen">✕</button></div>
      <div class="modal-body">${this.error?`<p class="error">${esc(this.error)}</p>`:''}<p class="hint">Vorhandene Home-Assistant-Entitäten auswählen. Anzeigenamen kannst du danach im Planer ändern.</p>
      <label class="field import-search"><span>Suchen</span><input data-import-search type="search" value="${esc(e.search || '')}" placeholder="Name oder Entität"></label>
      <label class="check"><input data-import-other type="checkbox" ${e.showOther?'checked':''}>Auch andere Cover-Typen anzeigen</label>
      <div class="toolbar import-toolbar"><button data-action="select-visible-covers">Alle sichtbaren auswählen</button><button data-action="clear-cover-selection">Auswahl aufheben</button></div>
      <div class="cover-list fui-selection-list">${candidates.map(c=>`<label class="cover-option" data-cover-row="${esc(c.entity)}" ${this.coverVisible(c)?'':'hidden'}><input type="checkbox" data-import-cover="${esc(c.entity)}" ${c.existing || selected.has(c.entity)?'checked':''} ${c.existing || !c.supported?'disabled':''}><span><strong>${esc(c.existing?.name || c.name)}</strong><small>${esc(c.entity)}</small><small>${c.existing?'Bereits hinzugefügt':!c.supported?'Keine Positions- oder Lamellensteuerung':esc(c.type)}</small></span></label>`).join('') || '<p class="empty">Keine cover-Entitäten in Home Assistant vorhanden.</p>'}</div><p class="hint" data-import-empty ${candidates.some(c=>this.coverVisible(c))?'hidden':''}>Keine Treffer für diese Auswahl.</p></div>
      <footer><small><span data-import-count>${e.selected.length}</span> ausgewählt</small><div class="toolbar"><button data-action="cancel">Abbrechen</button><button class="primary" data-action="import-covers" ${e.selected.length?'':'disabled'}>Hinzufügen</button></div></footer></section></div>`;
  }
  updateCoverSelection() {
    const e=this.editor, selected=new Set(e.selected), candidates=this.coverCandidates();
    for(const row of this.shadowRoot.querySelectorAll('[data-cover-row]')) {
      const c=candidates.find(c=>c.entity===row.dataset.coverRow);
      row.hidden=!c || !this.coverVisible(c);
      const input=row.querySelector('input');
      if(c && !c.existing) input.checked=selected.has(c.entity);
    }
    this.shadowRoot.querySelector('[data-import-count]').textContent=e.selected.length;
    this.shadowRoot.querySelector('[data-action="import-covers"]').disabled=!e.selected.length;
    this.shadowRoot.querySelector('[data-import-empty]').hidden=candidates.some(c=>this.coverVisible(c));
  }
  async importCovers() {
    const e=this.editor, config=clone(this.data.config), selected=new Set(e.selected);
    const items=this.coverCandidates().filter(c=>selected.has(c.entity) && !c.existing && c.supported);
    if(!items.length) return;
    for(const c of items) config.windows.push({id:uid(),name:c.name.slice(0,120),cover:c.entity,enabled:true,contacts:[]});
    if(await this.request('save',{config,revision:e.revision})) this.editor=null;
    this.render();
  }
  entitySelect(key, value, domains, sensorType=null) {
    const entities = Object.entries(this._hass.states).filter(([e,s])=>domains.some(d=>e.startsWith(d+'.')) && (!sensorType || this.editor?.showAllSensors || (this.data.config.sensors || []).includes(e) || this.sensorType(s,sensorType))).map(([e,s])=>[e,(s.attributes.friendly_name || e)+' · '+e]).sort((a,b)=>a[1].localeCompare(b[1]));
    if(value && !entities.some(([e])=>e===value)) entities.unshift([value,value+(this._hass.states[value]?' (bereits zugewiesen)':' (nicht verfügbar)')]);
    return `<select data-key="${esc(key)}">${options([['','Bitte wählen'],...entities],value)}</select>`;
  }
  sensorType(state, type) {
    const a=state.attributes || {},unit=String(a.unit_of_measurement || '').trim().toLowerCase();
    return type==='temp'?a.device_class==='temperature' || ['°c','c','°f','k'].includes(unit):a.device_class==='illuminance' || ['lx','klx','lux'].includes(unit);
  }
  ruleEditor(g,i) {
    const k='sensor_rules.'+i+'.';
    return `<section class="subpanel grid sensor-rule-editor">${field('Name der Sensorzuordnung',input(k+'name',g.name))}<div class="toolbar"><button class="danger" data-action="delete-rule" data-index="${i}">Zuordnung entfernen</button></div>
      ${field('Temperatur (optional)',this.entitySelect(k+'temp_entity',g.temp_entity,['sensor'],'temp'))}${field('Helligkeit (optional)',this.entitySelect(k+'lux_entity',g.lux_entity,['sensor'],'lux'))}
    </section>`;
  }
  initClimate(program=this.editor.item) {
    program.conditions ||= {mode:'lux',lux_on:30000,lux_off:20000,temp_on:25,temp_off:23,on_delay_seconds:0,release_delay_seconds:300};
    program.start ??= '00:00';program.end ??= '00:00';program.end_action ||= 'schedule';
    program.targets=[...new Set(program.rides.flatMap(r=>r.targets))];
  }
  matchingBindings(window,program=this.editor.item) {
    const mode=program.conditions?.mode || 'lux';
    return (window.sensor_rules || []).filter(g=>(mode==='temp' || !!g.lux_entity) && (mode==='lux' || !!g.temp_entity));
  }
  setEndAction(program=this.editor.item,addMissing=false) {
    if(program.end_action==='keep')program.rides=program.rides.filter(r=>r.edge!=='inactive');
    if(addMissing && program.end_action!=='keep')for(const active of program.rides.filter(r=>r.edge==='active')) {
      if(!program.rides.some(r=>r.edge==='inactive' && r.targets[0]===active.targets[0]))program.rides.push({...clone(active),id:uid(),edge:'inactive',position:100,tilt:null});
    }
    for(const r of program.rides.filter(r=>r.edge==='inactive')) {
      r.restore_schedule=program.end_action==='schedule';r.restore_before=program.end_action==='restore';
      if(r.restore_schedule || r.restore_before){r.position=null;r.tilt=null;}
      else if(r.position==null && r.tilt==null)r.position=100;
    }
    this.initClimate(program);
  }
  climateEditor(program) {
    this.initClimate(program);
    const cond=program.conditions;
    return `<h4>Gemeinsame Rollläden und Jalousien</h4><p class="hint">Jedes Gerät verwendet seine eigenen Sensoren. Schwellenwerte und Verzögerungen gelten gemeinsam für alle ausgewählten Geräte.</p><div class="program-targets">${this.windows.filter(w=>this.hasSensors(w)).map(w=>{const selected=program.targets.includes(w.id),valid=this.matchingBindings(w,program).length>0;return `<label class="check"><input type="checkbox" data-program-target="${esc(w.id)}" ${selected?'checked':''} ${!valid && !selected?'disabled':''}><span>${esc(w.name)}${valid?'':' · '+(this.language()==='en'?'required sensors missing':'benötigte Sensoren fehlen')}</span></label>`;}).join('') || '<p class="hint">Sensoren in den Einstellungen zuweisen.</p>'}</div>
      <h4>Tägliches Zeitfenster</h4><div class="grid">${field('Von',input('start',program.start,'time'))}${field('Bis',input('end',program.end,'time'))}</div><p class="hint">Gleiche Uhrzeiten gelten ganztägig. Zeitfenster über Mitternacht beziehen sich auf den Starttag.</p>
      <h4>Beschattungsbedingungen</h4><div class="grid">${field('Auswertung',`<select data-key="conditions.mode">${options([['lux','Helligkeit'],['temp','Temperatur'],['both','Temperatur und Helligkeit']],cond.mode)}</select>`,'full')}
      ${cond.mode!=='temp'?field('Aktiv ab Helligkeit (lx)',input('conditions.lux_on',cond.lux_on,'number','min="0" max="1000000"'))+field('Freigabe ab / unter Helligkeit (lx)',input('conditions.lux_off',cond.lux_off,'number','min="0" max="1000000"')):''}
      ${cond.mode!=='lux'?field('Aktiv ab Temperatur (°C)',input('conditions.temp_on',cond.temp_on,'number','min="-50" max="80" step="0.5"'))+field('Freigabe ab / unter Temperatur (°C)',input('conditions.temp_off',cond.temp_off,'number','min="-50" max="80" step="0.5"')):''}
      ${field('Aktivierungsverzögerung (Sekunden)',input('conditions.on_delay_seconds',cond.on_delay_seconds,'number','min="0" max="86400" step="1"'))}${field('Freigabeverzögerung (Sekunden)',input('conditions.release_delay_seconds',cond.release_delay_seconds,'number','min="0" max="86400" step="1"'))}</div>
      <p class="hint">Bei zwei Sensoren müssen beide oberen Schwellen erreicht sein. Für die Freigabe genügt eine untere Schwelle. Die Bedingung muss während der gesamten Verzögerung erfüllt bleiben.</p>
      <h4>Abschlussaktion</h4>${field('Nach Freigabe oder Zeitfensterende',`<select data-key="end_action">${options([['schedule','Aktuelle Zeitplanposition'],['restore','Position vor Beschattung'],['fixed','Feste Rückfahrposition'],['keep','Position beibehalten']],program.end_action)}</select>`)}<p class="hint">Rückfahrziele werden in den Fahrten festgelegt. Ohne passende Zeitfahrt verwendet die Zeitplan-Rückkehr die Position vor der Beschattung. Aussetzen oder Deaktivieren löst keine Rückfahrt aus.</p>`;
  }
  policySelect(key, value) { return `<select data-key="${key}">${options(Object.entries(POLICY),value)}</select>`; }
  editorHtml() {
    const e = this.editor;
    if(e.type==='program' && e.transfer)return this.transferHtml();
    if(e.type==='covers') return this.coverImportHtml();
    if(e.type==='sensors') return this.sensorSelectionHtml();
    if(e.type==='sensor-name')return `<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-label="${this.language()==='en'?'Rename sensor':'Sensor umbenennen'}"><div class="modal-head"><h3>${this.language()==='en'?'Rename sensor':'Sensor umbenennen'}</h3><button data-action="cancel" aria-label="Schließen">✕</button></div><div class="modal-body"><p class="hint">Leer lassen, um den Namen aus Home Assistant zu verwenden.</p><label class="field sensor-name-field"><span>${esc(e.entity)}</span>${input('name',e.item.name,'text',`maxlength="120" placeholder="${esc(this._hass.states[e.entity]?.attributes.friendly_name || e.entity)}"`)}</label></div><footer>${this.error?`<p class="modal-save-error" role="alert">${esc(this.error)}</p>`:''}<span></span><div class="toolbar"><button data-action="cancel">Abbrechen</button><button class="primary" data-action="save-sensor-name">Speichern</button></div></footer></section></div>`;
    const item = e.item;
    let content;
    if (e.type === 'window') {
      item.sensor_rules ||= [];
      content = `<div class="grid">${field('Anzeigename im Planer',input('name',item.name))}${field('Rollladen / Jalousie',this.entitySelect('cover',item.cover,['cover']))}${field('Typ',`<select data-key="cover_type">${options([['auto','Automatisch erkennen'],['shutter','Rollladen'],['blind','Jalousie']],item.cover_type || 'auto')}</select>`)}${check('enabled',item.enabled,'Fenster aktiv')}</div>
        <h4>Öffnungskontakte</h4><p class="hint">Bei mehreren Kontakten genügt ein offener Kontakt zum Sperren. „Nicht fahren“ hat Vorrang vor „Nachholen“.</p>
        ${item.contacts.map((c,i)=>`<div class="subpanel grid">${field('Kontakt',this.entitySelect(`contacts.${i}.entity`,c.entity,['binary_sensor','sensor','input_boolean']))}${field('Zustand bei offenem Fenster',input(`contacts.${i}.open_state`,c.open_state))}${field('Wenn offen',this.policySelect(`contacts.${i}.policy`,c.policy))}<button data-action="delete-contact" data-index="${i}">Kontakt entfernen</button></div>`).join('')}
        <button data-action="add-contact">+ Kontakt</button>
        <h4>Sensorzuordnungen</h4><p class="hint">Hier nur Sensoren zuordnen. Schwellenwerte, Verzögerungen und Fahrziele im Beschattungsprogramm festlegen.</p><button data-action="toggle-sensor-filter" aria-pressed="${!!e.showAllSensors}">${this.language()==='en'?(e.showAllSensors?'Show matching sensors':'Show all sensors'):(e.showAllSensors?'Passende Sensoren anzeigen':'Alle Sensoren anzeigen')}</button>${e.showAllSensors?`<p class="hint">${this.language()==='en'?'Select temperature or illuminance sensors only. Check the units before saving.':'Nur Temperatur- oder Helligkeitssensoren auswählen. Vor dem Speichern die Einheit prüfen.'}</p>`:''}${item.sensor_rules.map((g,i)=>this.ruleEditor(g,i)).join('')}<button data-action="add-rule">+ Sensorzuordnung</button>`;
    } else {
      content = `<div class="grid">${field('Name',input('name',item.name))}${field('Programmtyp',`<select data-key="kind" ${e.transferOperations?.length?'disabled':''}>${options([['time','Zeitprogramm'],['sensor','Sensorprogramm']],item.kind)}</select>`)}${check('enabled',item.enabled,'Programm aktiv')}${check('pause_in_vacation',item.pause_in_vacation,'Im Urlaub aussetzen')}</div>
        ${this.sharedWeekdays(item.days)}
        ${item.kind==='sensor'?this.seasonEditor('season',item.season):''}
        ${item.kind==='sensor'?`<div class="grid">${field('Sensorprogramm-Art',`<select data-key="sensor_mode" ${e.transferOperations?.length?'disabled':''}>${options([['climate','Temperatur / Helligkeit'],['opening','Öffnungskontakt']],item.sensor_mode || 'climate')}</select>`,'full')}${this.isOpening(item)?field('Von',input('opening_start',item.opening_start || '00:00','time'))+field('Bis',input('opening_end',item.opening_end || '23:59','time')):''}</div>`+check('start_on_high',item.start_on_high || false,this.isOpening(item)?'Bei bereits geöffnetem Fenster starten':'Bei bereits erfüllter Bedingung starten'):''}
        ${item.kind==='sensor' && !this.isOpening(item)?this.climateEditor(item):''}
        ${e.transferOperations?.length?`<div class="transfer-notice hint" role="status">${e.transferOperations.length} ${e.transferOperations.length===1?'Übernahme':'Übernahmen'} vorgemerkt – mit Speichern übernehmen.<button data-action="undo-transfer">Letzte Übernahme rückgängig</button></div>`:''}
        <div class="rides-heading"><h4>Fahrten</h4>${item.rides.length?`<div class="toolbar"><button data-action="expand-rides">Alle aufklappen</button><button data-action="collapse-rides">Alle zuklappen</button></div>`:''}</div>${item.rides.map((r,i)=>this.rideEditor(r,i,item.kind)).join('')}<button data-action="add-ride">+ Fahrt hinzufügen</button>`;
    }
    return `<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-label="${e.type==='window'?'Fenster':'Programm'} bearbeiten"><div class="modal-head"><h3>${e.type==='window'?'Fenster':'Programm'} bearbeiten</h3><button data-action="cancel" aria-label="Schließen">✕</button></div><div class="modal-body">${content}</div><footer>${this.error?`<p class="modal-save-error" role="alert">${esc(this.error)}</p>`:''}${!e.isNew?'<button class="danger" data-action="delete-item">Löschen</button>':'<span></span>'}<div class="toolbar"><button data-action="cancel">Abbrechen</button><button class="primary" data-action="save-editor">Speichern</button></div></footer></section></div>`;
  }
  positionSlider(key,value,label,required=false) {
    const active=value!==null && value!==undefined, height=key.endsWith('.position') || key.endsWith('.shade_position');
    const n=active?Number(value):0;
    return `<div class="position-control"><div class="slider-head"><label for="slider-${key}">${esc(label)}</label><output data-value-for="${key}">${active?n+' %':'Unverändert'}</output></div><input id="slider-${key}" data-key="${key}" type="range" min="0" max="100" step="1" value="${n}" aria-label="${esc(label)}" aria-valuetext="${active?n+' Prozent':'Unverändert'}" style="--range-percent:${n}%">${required?'':`<div class="slider-foot"><button type="button" class="keep-value ${active?'':'selected'}" data-action="keep-value" data-value-key="${key}" aria-pressed="${!active}">Unverändert</button></div>`}</div>`;
  }
  rideEditor(r,i,kind) {
    const k='rides.'+i+'.', window=this.windows.find(w=>w.id===r.targets[0]);
    const opening=kind==='sensor' && this.isOpening();
    const candidates=this.windows.filter(w=>kind!=='sensor' || (opening?this.hasOpeningContacts(w):this.hasSensors(w)));
    const choices=candidates.map(w=>`<option value="${esc(w.id)}" ${r.targets[0]===w.id?'selected':''}>${esc(w.name)}</option>`).join('');
    const rule=this.selectedRule(window,r);
    const expanded=!this.collapsedRides().has(r.id);
    return `<div class="subpanel ride-editor" data-ride-index="${i}" data-ride-id="${esc(r.id)}"><div class="ride-editor-head"><button type="button" class="ride-fold" data-action="fold-ride" data-index="${i}" aria-expanded="${expanded}" aria-controls="ride-body-${i}">${uiIcon('chevron',{expanded:expanded})}<span class="ride-fold-text"><strong data-ride-title>${esc(window?.name || 'Neue Fahrt')}</strong><span data-ride-summary>${esc(this.rideSummary(r,kind))}</span></span></button><div class="toolbar ride-editor-actions">${check(k+'enabled',r.enabled,'Aktiv')}<button class="danger ride-icon" data-action="delete-ride" data-index="${i}" aria-label="Entfernen" title="Entfernen">${this.statusIcon('trash')}</button><button class="ride-icon" data-action="prepare-transfer" data-mode="move" data-index="${i}" aria-label="Verschieben" title="Verschieben" ${this.transferTargets('move').length && window?'':'disabled'}>${this.statusIcon('move')}</button><button class="ride-icon" data-action="prepare-transfer" data-mode="copy" data-index="${i}" aria-label="Kopieren" title="Kopieren" ${this.transferTargets('copy').length && window?'':'disabled'}>${this.statusIcon('copy')}</button></div></div><div id="ride-body-${i}" class="ride-editor-body grid" ${expanded?'':'hidden'}>${field('Rollladen / Jalousie',`<select data-ride-target="${i}" aria-label="Rollladen / Jalousie"><option value="">Bitte auswählen</option>${choices}</select>`,'full')}
      ${kind==='sensor' && !opening && window?field('Sensorzuordnung',`<select data-key="${k}sensor_rule"><option value="">Bitte auswählen</option>${options((window.sensor_rules || []).map(g=>[g.id,g.name]),r.sensor_rule)}</select>`,'full'):''}
      ${kind==='time' ? '<div class="timing-grid full">'+field('Auslöser',`<select data-key="${k}event">${options([['fixed','Uhrzeit'],['sunrise','Sonnenaufgang'],['sunset','Sonnenuntergang']],r.event)}</select>`)+
        (r.event==='fixed'?field('Uhrzeit',input(k+'time',r.time,'time')):field('Versatz (Min.)',input(k+'offset',r.offset,'number','min="-720" max="720" title="Negative Werte = vor dem Sonnenereignis"')))+
        field('Frühestens',input(k+'earliest',r.earliest,'time'))+field('Spätestens',input(k+'latest',r.latest,'time'))+'</div>' : opening?'<p class="hint full">Beim Öffnen eines zugeordneten Kontakts. Position bleibt bis zum Schließen geschützt.</p>':field('Auslösen, wenn',`<select data-key="${k}edge">${options([['active',this.sensorTriggerText(rule)],...(this.editor.item.end_action==='keep'?[]:[['inactive','Wieder freigegeben']])],r.edge)}</select>`,'full')}
      ${kind==='sensor' && !candidates.length?`<p class="hint full">${opening?'Keine Geräte mit zugewiesenem Öffnungskontakt.':'Keine Geräte mit hinterlegtem Temperatur- oder Helligkeitssensor.'} Sensoren in den Einstellungen zuweisen.</p>`:''}
      ${kind==='sensor' && !opening && r.edge==='inactive' && (r.restore_schedule || r.restore_before)?`<p class="hint full">${r.restore_schedule?'Aktuelle Zeitplanposition':'Position vor Beschattung'}</p>`:''}
      ${window && !r.restore_schedule && !r.restore_before ? this.positionSlider(k+'position',r.position,'Höhe',opening)+(this.isBlind(window)?this.positionSlider(k+'tilt',r.tilt,'Lamellen'):'') : !window?'<p class="hint full">Einen Rollladen oder eine Jalousie auswählen.</p>':''}

    </div></div>`;
  }
  transferTargets(mode=this.editor?.transfer?.mode || 'copy') {
    const e=this.editor;
    const targets=this.data.config.programs.filter(p=>p.id!==e.item.id).map(p=>e.targetPrograms?.[p.id] || p);
    if(mode==='copy')targets.push(e.item);
    return targets.filter(p=>p.kind===e.item.kind && (p.kind!=='sensor' || (p.sensor_mode || 'climate')===(e.item.sensor_mode || 'climate'))).sort((a,b)=>a.name.localeCompare(b.name,this.language()==='en'?'en':'de'));
  }
  transferHtml() {
    const transfer=this.editor.transfer, copy=transfer.mode==='copy';
    return `<div class="overlay"><section class="modal transfer-modal" role="dialog" aria-modal="true" aria-label="Fahrt ${copy?'kopieren':'verschieben'}"><div class="modal-head"><h3>Fahrt ${copy?'kopieren':'verschieben'}</h3><button data-action="cancel-transfer" aria-label="Schließen">✕</button></div><div class="modal-body">${field('Zielprogramm',`<select data-transfer-target aria-label="Zielprogramm">${options(this.transferTargets().map(p=>[p.id,p.name+(p.id===this.editor.item.id?' (dieses Programm)':'')]),transfer.target)}</select>`)}</div><footer>${this.error?`<p class="modal-save-error" role="alert">${esc(this.error)}</p>`:''}<span></span><div class="toolbar"><button data-action="cancel-transfer" aria-label="Übernahme abbrechen">Abbrechen</button><button class="primary" data-action="confirm-transfer">${copy?'Kopieren':'Verschieben'}</button></div></footer></section></div>`;
  }
  cancelTransfer() {
    this.returnEditorView=this.editor?.transfer?.returnView || null;
    if(this.editor)this.editor.transfer=null;
    this.error='';
  }
  stageTransfer() {
    const e=this.editor, operation=e.transfer, ride=e.item.rides.find(r=>r.id===operation?.rideId);
    const destination=this.transferTargets().find(p=>p.id===operation?.target);
    if(!ride || !destination){this.error='Bitte eine Fahrt und ein passendes Zielprogramm auswählen.';return;}
    if(destination.rides.length>=100){this.error='Das Zielprogramm enthält bereits 100 Fahrten.';return;}
    const same=destination.id===e.item.id;
    const target=same?e.item:clone(destination), added=clone(ride), sourceIndex=e.item.rides.indexOf(ride);
    if(operation.mode==='copy'){added.id=uid();added.skip_next=false;}
    target.rides.push(added);
    if(!same){e.targetPrograms ||= Object.create(null);e.targetPrograms[target.id]=target;}
    else this.collapsedRides().add(added.id);
    (e.transferOperations ||= []).push({mode:operation.mode,ride:clone(ride),sourceIndex,target:target.id,addedId:added.id});
    if(operation.mode==='move')e.item.rides.splice(sourceIndex,1);
    e.transfer=null;this.error='';
  }
  undoTransfer() {
    const e=this.editor, operation=e.transferOperations?.pop();
    if(!operation)return;
    const target=operation.target===e.item.id?e.item:e.targetPrograms[operation.target];
    target.rides=target.rides.filter(r=>r.id!==operation.addedId);
    if(operation.mode==='move') {
      e.item.rides.splice(Math.min(operation.sourceIndex,e.item.rides.length),0,operation.ride);
      this.collapsedRides().add(operation.ride.id);
    }
    e.transfer=null;this.error='';
  }
  collapsedRides() { return this.editor.collapsedRides ||= new Set(); }
  rideSummary(ride,kind) {
    const rule=kind==='sensor'?this.selectedRule(this.windows.find(w=>w.id===ride.targets[0]),ride):null;
    return [this.when(ride,kind),rule?.name,this.targetsText(ride),!ride.enabled?'Deaktiviert':''].filter(Boolean).join(' · ');
  }
  updateRideHeaders() {
    if(this.editor?.type!=='program')return;
    for(const panel of this.shadowRoot.querySelectorAll('.ride-editor')) {
      const r=this.editor.item.rides[Number(panel.dataset.rideIndex)];
      if(!r)continue;
      const expanded=!this.collapsedRides().has(r.id), button=panel.querySelector('.ride-fold');
      button.setAttribute('aria-expanded',String(expanded));
      button.querySelector('.chevron').classList.toggle('expanded',expanded);
      panel.querySelector('.ride-editor-body').hidden=!expanded;
      panel.querySelector('[data-ride-title]').textContent=this.windows.find(w=>w.id===r.targets[0])?.name || 'Neue Fahrt';
      panel.querySelector('[data-ride-summary]').textContent=this.rideSummary(r,this.editor.item.kind);
    }
  }
  newRule() { return {id:uid(),name:'Sensoren',lux_entity:'',temp_entity:''}; }
  onInput(event) {
    const el = event.target;
    if(el.dataset.once) {
      this.onceForm ||= {time:'',target:'',position:'100',tilt:''};
      this.onceForm[el.dataset.once]=el.value;
      return;
    }
    if(this.editor?.type==='sensors') {if(el.hasAttribute('data-sensor-search')){this.editor.search=el.value;this.updateSensorSelection();}return;}
    if(this.editor?.type==='covers') {
      if(el.hasAttribute('data-import-search')) {this.editor.search=el.value;this.updateCoverSelection();}
      return;
    }
    if (!this.editor || !el.dataset.key || el.tagName !== 'INPUT' || el.type === 'checkbox') return;
    const value=['number','range'].includes(el.type)?(el.value===''?null:Number(el.value)):el.value;
    this.assign(el.dataset.key,value);
    if(el.dataset.key.startsWith('rides.'))this.updateRideHeaders();
    if(el.type==='range') {
      const output=this.shadowRoot.querySelector(`output[data-value-for="${el.dataset.key}"]`);
      if(output) output.textContent=el.value+' %';
      el.setAttribute('aria-valuetext',el.value+' Prozent');el.style.setProperty('--range-percent',el.value+'%');
      const keep=el.closest('.position-control')?.querySelector('.keep-value');
      if(keep){keep.classList.remove('selected');keep.setAttribute('aria-pressed','false');}
    }
  }
  assign(path, value) {
    const parts = path.split('.'); let obj = this.editor.item;
    for (const part of parts.slice(0,-1)) {if(obj[part]==null) obj[part]={};obj = obj[part];}
    obj[parts.at(-1)] = value;
  }
  onChange(event) {
    const el = event.target;
    if(el.dataset.once) {
      this.onceForm ||= {time:'',target:'',position:'100',tilt:''};
      this.onceForm[el.dataset.once]=el.value;
      if(el.dataset.once==='target') {
        if(!this.isBlind(this.windows.find(w=>w.id===el.value))) this.onceForm.tilt='';
        this.render();
      }
      return;
    }
    if (el.id === 'import-file') { this.importFile(el.files[0]); return; }
    if (!this.editor) return;
    if(el.hasAttribute('data-transfer-target')){this.editor.transfer.target=el.value;return;}
    if(this.editor.type==='sensors') {if(el.dataset.sensorChoice){const selected=new Set(this.editor.selected);el.checked?selected.add(el.dataset.sensorChoice):selected.delete(el.dataset.sensorChoice);this.editor.selected=[...selected];this.updateSensorSelection();}return;}
    if(this.editor.type==='covers') {
      if(el.hasAttribute('data-import-other')) this.editor.showOther=el.checked;
      if(el.dataset.importCover) {
        const selected=new Set(this.editor.selected);
        el.checked?selected.add(el.dataset.importCover):selected.delete(el.dataset.importCover);
        this.editor.selected=[...selected];
      }
      this.updateCoverSelection();return;
    }
    if(el.dataset.programTarget) {
      const program=this.editor.item,window=this.windows.find(w=>w.id===el.dataset.programTarget);
      if(el.checked && !program.rides.some(r=>r.targets.includes(window.id))) {
        const binding=this.matchingBindings(window,program)[0];
        if(!binding)return;
        program.rides.push({id:uid(),targets:[window.id],enabled:true,edge:'active',sensor_rule:binding.id,position:0,tilt:null});
        this.setEndAction(program,true);
      } else if(!el.checked)program.rides=program.rides.filter(r=>!r.targets.includes(window.id));
      this.render();return;
    }
    if (el.dataset.day !== undefined) {
      const days = new Set(this.editor.item.days), day = Number(el.dataset.day);
      el.checked ? days.add(day) : days.delete(day); this.editor.item.days=[...days].sort(); return;
    }
    if(el.dataset.rideTarget!==undefined) {
      const ride=this.editor.item.rides[Number(el.dataset.rideTarget)], old=this.windows.find(w=>w.id===ride.targets[0]);
      const window=this.windows.find(w=>w.id===el.value);
      ride.targets=window?[window.id]:[];
      if(this.editor.item.kind==='sensor' && !this.isOpening()) {
        const existing=this.editor.item.rides.find(r=>r!==ride && r.targets[0]===window?.id)?.sensor_rule;
        ride.sensor_rule=existing || window?.sensor_rules?.[0]?.id || '';
      }
      if(!this.isBlind(window)) ride.tilt=null;
      else if(!this.isBlind(old) && ride.tilt==null) ride.tilt=50;
      this.render();return;
    }
    const key = el.dataset.key;
    if (!key) return;
    const value=el.type==='checkbox'?el.checked:['number','range'].includes(el.type)?(el.value===''?null:Number(el.value)):el.value;
    this.assign(key,value);
    if(key.startsWith('rides.'))this.updateRideHeaders();
    if (key === 'kind' || key === 'sensor_mode') {
      if(this.editor.item.kind==='sensor' && !this.editor.item.season) this.editor.item.season=this.defaultSeason();
      for(const r of this.editor.item.rides) {
        Object.assign(r,{event:'fixed',time:'07:00',offset:0,earliest:'00:00',latest:'23:59',edge:'active'});
        const window=this.windows.find(w=>w.id===r.targets[0]);
        if(this.editor.item.kind==='sensor') {
          if(this.isOpening()) {if(!this.hasOpeningContacts(window))r.targets=[];delete r.sensor_rule;delete r.restore_schedule;r.edge='opening';r.position=100;r.tilt=this.isBlind(window)?50:null;this.editor.item.opening_start ||= '00:00';this.editor.item.opening_end ||= '23:59';}
          else {if(!this.hasSensors(window))r.targets=[];r.sensor_rule=window?.sensor_rules?.[0]?.id || ''; }
        } else {delete r.sensor_rule;delete r.restore_schedule;}
      }
    }
    if(key.endsWith('.sensor_rule')) {
      const ride=this.editor.item.rides[Number(key.split('.')[1])];
      for(const r of this.editor.item.rides)if(r.targets[0]===ride.targets[0])r.sensor_rule=value;
    }
    if(this.editor.item.kind==='sensor' && !this.isOpening()) {this.initClimate();if(key==='end_action')this.setEndAction(this.editor.item,true);if(key.endsWith('.edge'))this.setEndAction();}
    if(key.endsWith('.edge') && value==='active'){const ride=this.editor.item.rides[Number(key.split('.')[1])];ride.restore_schedule=false;ride.restore_before=false;if(ride.position==null && ride.tilt==null)ride.position=0;}
    if(key==='kind' || key==='sensor_mode' || key==='conditions.mode' || key==='end_action' || key==='season.enabled' || key==='cover' || key==='cover_type' || /\.(temp_entity|lux_entity|sensor_rule|edge|restore_schedule|event)$/.test(key))this.render();
  }
  async onClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled || this.busy) return;
    const a = button.dataset.action, ds=button.dataset;
    const p = this.data?.config.programs.find(p=>p.id===ds.program), r=p?.rides.find(r=>r.id===ds.target);
    if(a==='prepare-transfer') {
      if(this.editor?.type!=='program' || !this.data.admin)return;
      const ride=this.editor.item.rides[Number(ds.index)], target=this.transferTargets(ds.mode)[0];
      if(!ride || !target)return;
      this.editor.transfer={rideId:ride.id,mode:ds.mode,target:target.id,returnView:this.captureEditorView()};
      this.focusTransfer=ride.id;this.error='';this.render();return;
    }
    if(a==='cancel-transfer'){this.cancelTransfer();this.render();return;}
    if(a==='confirm-transfer'){
      if(this.editor?.type==='program' && this.data.admin){const view=this.editor.transfer?.returnView;this.stageTransfer();if(!this.editor.transfer)this.returnEditorView=view;}
      this.render();return;
    }
    if(a==='undo-transfer'){if(this.editor?.type==='program' && this.data.admin)this.undoTransfer();this.render();return;}
    if(a==='set-language') {
      this.setLanguage(ds.language); this.render(); return;
    }
    if(a==='copy-program') {
      if(!this.data.admin || !p)return;
      const item=clone(p); item.id=uid(); item.name=(p.name || (this.language()==='en'?'Program':'Programm'))+(this.language()==='en'?' (copy)':' (Kopie)');
      item.rides=item.rides.map(ride=>({...ride,id:uid()}));
      this.editor={type:'program',isNew:true,revision:this.data.revision,item};
      this.editor.collapsedRides=new Set(item.rides.map(ride=>ride.id)); this.focusEditor=true; this.error=''; this.render(); return;
    }
    if(a==='tab') {this.tab=Number(ds.tab);this.render();return;}
    if(a==='toggle-settings-section') {const section=ds.section;if(!['covers','sensors','status','daily-history'].includes(section))return;this.settingsSections ||= {};this.settingsSections[section]=!this.settingsSectionVisible(section);try{localStorage.setItem(this.foldKey()+':settings:'+section,this.settingsSections[section]?'visible':'hidden');}catch{}this.render();return;}
    if(a==='refresh') {await this.refresh();return;}
    if(a==='toggle-overview') {
      this.showOverview=!this.overviewVisible();
      try{localStorage.setItem(this.foldKey()+':overview',this.showOverview?'visible':'hidden');}catch{}
      button.setAttribute('aria-expanded',String(this.showOverview));
      button.querySelector('.chevron').classList.toggle('expanded',this.showOverview);
      this.shadowRoot.querySelector('.overview').hidden=!this.showOverview;return;
    }
    if(a==='edit-sensor-name') {
      if(!this.data.admin || !this.usedSensors().includes(ds.entity))return;
      this.editor={type:'sensor-name',entity:ds.entity,revision:this.data.revision,item:{name:this.data.config.sensor_names?.[ds.entity] || ''}};
      this.error='';this.focusEditor=true;this.render();return;
    }
    if(a==='save-sensor-name') {
      if(this.editor?.type!=='sensor-name' || !this.data.admin)return;
      const config=clone(this.data.config);config.sensor_names ||= {};
      const name=this.editor.item.name.trim(),entity=this.editor.entity;
      if(name)config.sensor_names[entity]=name;else delete config.sensor_names[entity];
      if(await this.request('save',{config,revision:this.editor.revision}))this.editor=null;
      this.render();return;
    }
    if(['fold-ride','expand-rides','collapse-rides'].includes(a)) {
      if(this.editor?.type!=='program')return;
      const collapsed=this.collapsedRides();
      if(a==='expand-rides')collapsed.clear();
      else if(a==='collapse-rides')this.editor.item.rides.forEach(r=>collapsed.add(r.id));
      else {const ride=this.editor.item.rides[Number(ds.index)];if(!ride)return;collapsed.has(ride.id)?collapsed.delete(ride.id):collapsed.add(ride.id);}
      this.updateRideHeaders();return;
    }
    if(a==='sensor-pause') {
      const row=this.data.sensor_programs?.find(row=>row.id===ds.rule);
      if(!row) return;
      const entities=[...new Set(row.targets.map(t=>this.windows.find(w=>w.id===t)?.cover).filter(Boolean))];
      await this.request('action',{action:'sensor_pause',target:row.id,value:!row.paused,entity_id:entities});
      this.render();return;
    }
    if(a==='keep-value') {this.assign(ds.valueKey,null);this.render();return;}
    if(a==='fold-program') {
      const expanded=this.expanded();
      expanded.has(ds.program)?expanded.delete(ds.program):expanded.add(ds.program);
      try {localStorage.setItem(this.foldKey(),JSON.stringify([...expanded]));} catch {}
      this.render();return;
    }
    if(a==='fold-program-group') {
      const collapsed=this.collapsedProgramGroups();
      collapsed.has(ds.group)?collapsed.delete(ds.group):collapsed.add(ds.group);
      try {localStorage.setItem(this.foldKey()+':groups',JSON.stringify([...collapsed]));} catch {}
      this.render();return;
    }
    if(a==='move-program') {
      if(!this.data.admin || !p)return;
      const config=clone(this.data.config), from=config.programs.findIndex(item=>item.id===p.id);
      const group=config.programs.filter(item=>item.kind===p.kind), position=group.findIndex(item=>item.id===p.id);
      const other=group[position+(ds.direction==='up'?-1:1)];
      if(!other)return;
      const to=config.programs.findIndex(item=>item.id===other.id);
      [config.programs[from],config.programs[to]]=[config.programs[to],config.programs[from]];
      await this.request('save',{config});
      this.render();return;
    }
    if(a==='open-once-form') {this.onceForm={time:'',target:'',position:'100',tilt:''};this.onceFormOpen=true;this.render();return;}
    if(a==='cancel-once-form') {this.onceFormOpen=false;this.onceForm=null;this.render();return;}
    if(a==='add-once') {
      const value=key=>this.shadowRoot.querySelector(`[data-once="${key}"]`)?.value;
      const time=value('time'),target=value('target'),position=value('position'),tilt=value('tilt') ?? '';
      if(!time || !target || position==='' || Number(position)<0 || Number(position)>100 || (tilt!=='' && (Number(tilt)<0 || Number(tilt)>100))) {this.error='Bitte Zeit, Gerät und gültige Position eingeben.';this.render();return;}
      if(await this.request('action',{action:'add_once',value:true,target,time,position:Number(position),tilt:tilt===''?null:Number(tilt),entity_id:[this.windows.find(w=>w.id===target)?.cover].filter(Boolean)})){this.onceFormOpen=false;this.onceForm=null;this.error='';}
      this.render();return;
    }
    if(a==='cancel-once') {await this.request('action',{action:'cancel_once',value:true,target:ds.target,entity_id:[]});this.render();return;}
    if(a==='skip-today') {
      const row=this.data.planned.find(row=>row.occurrence===ds.occurrence);
      if(!row) return;
      const program=this.data.config.programs.find(p=>p.id===row.program), ride=program?.rides.find(r=>r.id===row.ride);
      const entities=row.kind==='shade'?row.targets.map(t=>this.windows.find(w=>w.id===t)?.cover).filter(Boolean):ride?this.covers(program,ride):[];
      if(!entities.length) return;
      await this.request('action',{action:'skip_today',value:!row.skip,occurrence:row.occurrence,entity_id:entities});
      this.render();return;
    }
    if(a==='import-covers') {await this.importCovers();return;}
    if(a==='select-visible-covers') {
      this.editor.selected=[...new Set([...this.editor.selected,...this.coverCandidates().filter(c=>!c.existing && c.supported && this.coverVisible(c)).map(c=>c.entity)])];
      this.updateCoverSelection();return;
    }
    if(a==='clear-cover-selection') {this.editor.selected=[];this.updateCoverSelection();return;}
    if(['vacation','window','program','ride'].includes(a)) {
      const value = !(a==='vacation'?this.data.config.vacation:a==='window'?this.windows.find(w=>w.id===ds.target).enabled:a==='program'?p.enabled:r.enabled);
      await this.request('action',{action:a,value,target:ds.target||'',program:ds.program||'',entity_id:p?this.covers(p,r):[]});
      this.render();return;
    }
    if(a==='select-sensors') {if(!this.data.admin)return;this.editor={type:'sensors',revision:this.data.revision,selected:this.usedSensors(),search:''};this.error='';this.focusEditor=true;this.render();return;}
    if(a==='save-sensors') {if(!this.data.admin || this.editor?.type!=='sensors')return;const config=clone(this.data.config);config.sensors=[...new Set([...this.editor.selected,...this.referencedSensors()])].sort();if(await this.request('save',{config,revision:this.editor.revision}))this.editor=null;this.render();return;}
    if(a==='select-covers') {
      this.editor={type:'covers',revision:this.data.revision,selected:[],search:'',showOther:false};
      this.focusEditor=true;
    } else if(a==='edit-window') {
      this.editor={type:'window',isNew:false,revision:this.data.revision,item:clone(this.windows.find(w=>w.id===ds.target))};
      this.focusEditor=true;
    } else if(a==='new-program' || a==='edit-program') {
      this.editor={type:'program',isNew:a==='new-program',revision:this.data.revision,item:a==='new-program'?{id:uid(),name:'',kind:'time',enabled:true,pause_in_vacation:true,days:[0,1,2,3,4],rides:[]}:clone(p)};
      this.editor.collapsedRides=new Set(this.editor.item.rides.map(ride=>ride.id));
      this.focusEditor=true;
    } else if(a==='cancel') {this.editor=null;this.error='';await this.refresh();return;}
    else if(a==='toggle-sensor-filter')this.editor.showAllSensors=!this.editor.showAllSensors;
    else if(a==='add-rule')(this.editor.item.sensor_rules ||= []).push(this.newRule());
    else if(a==='delete-rule')this.editor.item.sensor_rules.splice(Number(ds.index),1);
    else if(a==='add-contact') this.editor.item.contacts.push({entity:'',open_state:'on',policy:'defer'});
    else if(a==='delete-contact') this.editor.item.contacts.splice(Number(ds.index),1);
    else if(a==='add-ride') {const ride={id:uid(),targets:[],enabled:true,event:'fixed',time:'07:00',offset:0,earliest:'00:00',latest:'23:59',position:0,tilt:null,edge:'active'};if(this.isOpening()){ride.position=100;ride.edge='opening';}this.editor.item.rides.push(ride);this.focusRide=ride.id;}
    else if(a==='delete-ride') this.editor.item.rides.splice(Number(ds.index),1);
    else if(a==='save-editor') {await this.saveEditor(false);return;}
    else if(a==='delete-item') {
      if(!confirm('Eintrag dauerhaft löschen?')) return;
      await this.saveEditor(true);return;
    } else if(a==='export') {
      const url=URL.createObjectURL(new Blob([JSON.stringify(this.data.config,null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='shutter-manager-configuration.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
    } else if(a==='import') {this.shadowRoot.querySelector('#import-file').click();return;}
    this.render();
  }
  async saveEditor(remove) {
    const e = this.editor, config=clone(this.data.config), key=e.type==='window'?'windows':'programs';
    if(e.type==='program' && !remove)for(const target of Object.values(e.targetPrograms || {})) {
      const targetIndex=config.programs.findIndex(p=>p.id===target.id);
      if(targetIndex<0){this.error='Zielprogramm nicht mehr vorhanden. Bitte neu laden.';this.render();return;}
      config.programs[targetIndex]=clone(target);
    }
    if(e.type==='window' && remove && config.programs.some(p=>p.rides.some(r=>r.targets.includes(e.item.id)))) {
      this.error='Fenster zuerst aus allen Fahrten entfernen.';this.render();return;
    }
    const index=config[key].findIndex(x=>x.id===e.item.id);
    if(remove) config[key].splice(index,1);
    else if(index<0) config[key].push(e.item);
    else config[key][index]=e.item;
    if(e.type==='window' && !remove) {
      for(const g of e.item.sensor_rules || []) {
        const name=g.name?.trim() || 'Sensorregel';let message='';
        if(!g.name?.trim())message='Bitte einen Namen vergeben.';
        else if(!g.temp_entity && !g.lux_entity)message='Mindestens einen Temperatur- oder Helligkeitssensor auswählen.';
        if(message){this.error='„'+name+'“: '+message;this.render();return;}
      }
    }
    for(const program of config.programs.filter(p=>p.kind==='sensor' && !this.isOpening(p) && p.conditions)) {
      const c=program.conditions;let message='';
      if((c.mode!=='temp' && c.lux_off>=c.lux_on) || (c.mode!=='lux' && c.temp_off>=c.temp_on))message='Freigabeschwellen müssen unter Aktivierungsschwellen liegen.';
      if([c.on_delay_seconds,c.release_delay_seconds].some(v=>!Number.isFinite(v) || v<0 || v>86400))message='Verzögerungen zwischen 0 und 86400 Sekunden eintragen.';
      if(message){this.error=program.name+': '+message;this.render();return;}
      this.setEndAction(program);
    }
    for(const program of config.programs) for(const ride of program.rides) {
      const window=config.windows.find(w=>w.id===ride.targets[0]);
      if(ride.targets.length!==1 || !window) {this.error='Für jede Fahrt genau einen Rollladen auswählen.';this.render();return;}
      if(program.kind==='sensor' && !this.isOpening(program) && !this.selectedRule(window,ride)) {this.error='Eine benannte Sensorregel für das Gerät auswählen.';this.render();return;}
      ride.name=window.name;
      const oldWindow=this.windows.find(w=>w.id===window.id);
      const changedType=e.type==='window' && window.id===e.item.id && (oldWindow?.cover!==window.cover || oldWindow?.cover_type!==window.cover_type);
      // Target selection already adjusts axes. Preserve unchanged tilt goals
      // when editing/transferring another ride and a cover is currently offline.
      if(changedType && !this.isBlind(window)) ride.tilt=null;
      if(ride.position==null && ride.tilt==null && !ride.restore_schedule && !ride.restore_before) {this.error='Für jede Fahrt mindestens eine Position festlegen. Reine Lamellenfahrten benötigen den Typ Jalousie.';this.render();return;}
    }
    const ok=await this.request('save',{config,revision:e.revision});
    if(ok) this.editor=null;
    this.render();
  }
  async importFile(file) {
    if(!file) return;
    if(file.size>2*1024*1024) {this.error='Datei zu groß (max. 2 MB).';this.render();return;}
    try {
      const config=JSON.parse(await file.text());
      config.enabled=false;
      if(!confirm('Konfiguration ersetzen? Importierte Programme bleiben zunächst ausgeschaltet.')) return;
      await this.request('save',{config});
    } catch(e) {this.error=e.message || String(e);}
    this.render();
  }
  css() { return UI_CSS + `
/* Only cover-specific arrangements remain; shared components use UI_CSS. */
.toprow{display:flex;align-items:center;justify-content:space-between;gap:var(--fui-section-padding);margin:var(--fui-section-padding) 0}
.toprow:empty{display:none}
.program-targets{display:grid;gap:var(--fui-row-padding);margin:var(--fui-section-padding) 0}
.planned-heading{margin:var(--fui-section-padding) 0 var(--fui-row-padding)}
.once-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--fui-section-padding);padding:var(--fui-section-padding) 0}
.planned-row{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:var(--fui-row-padding) var(--fui-section-padding);align-items:center}
.planned-time{font-variant-numeric:tabular-nums}
.planned-cover,.sensor-summary{display:flex;flex-direction:column;gap:var(--fui-row-padding);min-width:0;overflow-wrap:anywhere}
.planned-target{display:flex;align-items:baseline;gap:var(--fui-row-padding) var(--fui-section-padding);flex-wrap:wrap;min-width:0}
.planned-reason{grid-column:2/-1}
.planned-action,.sensor-action{align-self:center}
.skipped .planned-cover,.sensor-paused .sensor-summary{opacity:.6}
.skipped strong{text-decoration:line-through}
.sensor-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--fui-row-padding) var(--fui-section-padding)}
.timing-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--fui-section-padding)}
.howto-table{overflow-x:auto}
.rides-heading,.transfer-notice{display:flex;align-items:center;justify-content:space-between;gap:var(--fui-row-padding);flex-wrap:wrap;margin-top:var(--fui-section-padding)}
.import-search{margin:var(--fui-section-padding) 0}
@media(max-width:600px){
.planned-row{grid-template-columns:40px minmax(0,1fr) auto}
.planned-target{flex-direction:column;align-items:flex-start}
.sensor-row{grid-template-columns:minmax(0,1fr)}
.timing-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.toprow{align-items:flex-start}
}
@media(max-width:380px){.timing-grid{grid-template-columns:minmax(0,1fr)}}
`; }
}
if(!customElements.get('shutter-manager-card')) customElements.define('shutter-manager-card', ShutterManagerCard);
if(!customElements.get('rollladenplaner-card')) customElements.define('rollladenplaner-card', class extends ShutterManagerCard {});
window.customCards = window.customCards || [];
if(!window.customCards.some(c=>c.type==='shutter-manager-card')) window.customCards.push({type:'shutter-manager-card', name:'Shutter Manager', description:'Schedules and sensor rules for shutters and blinds', preview:false});
if(!window.customCards.some(c=>c.type==='rollladenplaner-card')) window.customCards.push({type:'rollladenplaner-card', name:'Shutter Manager (legacy card type)', description:'Legacy card type retained for existing dashboards', preview:false});
