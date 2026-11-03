/* Shutter Manager 1.2.5 — local, dependency-free Home Assistant card. */
const HOWTO_HTML = "<h2>Howto – Shutter Manager 1.2.5</h2><p>Der Shutter Manager verbindet Zeitprogramme, Temperatur-/Helligkeitsbeschattung und Öffnungsprogramme mit Fensterkontakten. Einstellungen definieren Geräte und benannte Sensorregeln. Programme bestimmen, wann diese Regeln gelten und welche Fahrten sie auslösen. Eine Sensorregel allein fährt keinen Rollladen.</p><h3>Status und Schaltverlauf</h3><p>In den Einstellungen zeigen Rollläden und Jalousien ihren aktuellen Home-Assistant-Zustand sowie – sofern gemeldet – Höhe und Lamellenposition. Darunter stehen die letzten erfolgreichen und fehlgeschlagenen Fahrbefehle mit Zeit und Meldung. Fehlgeschlagene Fahrten werden nur angezeigt, wenn die Integration einen Fehler erkennt.</p><h3>Einzelfahrten</h3><p>Im Zeitprogramm über „+ Einzelfahrt“ eine Fahrt für einen einzelnen Rollladen oder eine Jalousie am heutigen Tag einplanen. Uhrzeit und Höhe angeben; Lamellen sind nur bei Jalousien verfügbar. Die Einzelfahrt ist ein temporärer Eintrag und erzeugt kein gespeichertes Programm. Nach erfolgreicher Ausführung verschwindet sie aus der Liste. Bei Blockierung oder Fehler bleibt sie sichtbar; am Folgetag wird eine abgelaufene Fahrt verworfen.</p><h3>Schnellstart</h3><ol><li><strong>Einstellungen ⚙ → Rollläden hinzufügen:</strong> Vorhandene Rollläden und Jalousien übernehmen. Anzeigenamen und Gerätetyp lassen sich im Planer ändern.</li><li><strong>Gerät bearbeiten → Sensorregeln → + Sensorregel:</strong> Einen Namen vergeben, beispielsweise „Sommer“ oder „Winter“. Temperatur, Helligkeit oder beide Sensoren auswählen, Schwellenwerte und Freigabeverzögerung festlegen. Mehrere Regeln am selben Fenster sind möglich.</li><li><strong>Programme → + Programm → Sensorprogramm:</strong> Wochentage und Gültigkeitszeitraum einstellen. Eine Fahrt hinzufügen und Gerät sowie benannte Sensorregel auswählen. Es erscheinen nur Geräte mit hinterlegten Regeln.</li><li><strong>Fahrziel pflegen:</strong> Für „Sensorbedingung erreicht“ Höhe und gegebenenfalls Lamellen einstellen. Bei Bedarf eine zweite Fahrt „Wieder freigegeben“ anlegen. Hier lässt sich eine feste Position oder „Aktuelle Zeitplanposition übernehmen“ wählen.</li><li><strong>Programm aktivieren:</strong> „Bei bereits erfüllter Bedingung starten“ bestimmt, ob bereits hohe Messwerte bei Start oder Neustart auslösen dürfen. Ohne diese Option wird zunächst ein Ausgangszustand eingelesen.</li><li><strong>Zeitprogramm / Sensorprogramme:</strong> Eine konkrete Fahrt einmalig auslassen oder ein Sensorprogramm bis zur nächsten Mitternacht pausieren.</li></ol><h3>Oberfläche</h3><div class=\"howto-table\"><table><thead><tr><th>Bereich</th><th>Funktion</th></tr></thead><tbody><tr><td><strong>Programme</strong></td><td>Zeit- und Sensorprogramme erstellen, bearbeiten, einzeln schalten, innerhalb der Gruppe sortieren und zuklappen. Gruppen sind unabhängig klappbar und standardmäßig geöffnet; Programme starten zugeklappt. Im Programmeditor Fahrten einzeln oder alle auf- und zuklappen. Einzelne Fahrten dauerhaft deaktivieren.</td></tr><tr><td><strong>Zeitprogramm</strong></td><td>Zukünftige Zeitfahrten für heute und tatsächlich offene Aufträge anzeigen, ergänzt um wartende Sensorfahrten und ältere Nachholaufträge. Einzelfahrten lassen sich über + Einzelfahrt für heute mit Uhrzeit, Gerät und Höhe einplanen; Lamellen sind nur bei Jalousien verfügbar. Sie werden nach erfolgreicher Ausführung entfernt, bleiben bei Blockierung oder Fehler sichtbar und verfallen am Folgetag. Sie erzeugen kein gespeichertes Programm. Erledigte und verworfene Fahrten sind nicht enthalten. Eine konkrete Programmfahrt einmalig auslassen oder eine zukünftige Auslassung zurücknehmen.</td></tr><tr><td><strong>Sensorprogramme</strong></td><td>Heute freigegebene Programme anzeigen und bis Mitternacht aussetzen oder wieder aktivieren.</td></tr><tr><td><strong>Howto ?</strong></td><td>Diese Anleitung neben dem Zahnrad öffnen.</td></tr><tr><td><strong>Einstellungen ⚙</strong></td><td>Geräte, Öffnungskontakte und benannte Sensorregeln pflegen; Urlaubsmodus und Sicherung bedienen. Keine Fahrziele oder Gültigkeitszeiträume an der Sensorregel.</td></tr></tbody></table></div><p>Bearbeiten erfolgt über das Stift-Symbol mit Tooltip „Bearbeiten“. Es gibt keinen globalen Aktiv-Schalter. Programme und Fahrten werden einzeln geschaltet. Die Beschriftungen „Aktiv“ und „Fahrt aktiv“ neben Schaltern entfallen; beschreibende Namen für Screenreader bleiben erhalten.</p><h3>Kopfbereich und Sensoranzeigenamen</h3><p>Nur im Reiter Programme zeigt der ein- und ausblendbare Messwertebereich zuerst Sonnenaufgang und Sonnenuntergang als Symbol mit Uhrzeit. Darunter folgen Öffnungssensoren, Temperatur und Helligkeit, innerhalb jeder Gruppe alphabetisch nach Anzeigename nebeneinander; weitere Einträge fließen bei Platzmangel in die nächste Zeile. Namen und Zustände stehen nebeneinander: Schloss offen/geschlossen, Thermometer mit einer Nachkommastelle und Helligkeit in Tausendern, beispielsweise 20k lx für 20.300 lx. Werte unter 1.000 lx bleiben in lx. Die Anzeige wird pro Benutzer, Browser und Karte gemerkt. Sonnenzeiten beziehen sich auf den heutigen Tag am HA-Standort in der HA-Zeitzone. Alle zugeordneten Temperatur-, Helligkeits- und Öffnungssensoren erscheinen einmalig mit aktuellen Werten, auch bei Zuordnungen in deaktivierten Programmen. Fehlende Werte erscheinen als „Nicht verfügbar“ oder „Unbekannt“; ohne Sonnenereignis steht „—“. Native Sensorleserechte sind erforderlich.</p><p>Unter <strong>Einstellungen → Sensoranzeigenamen → Bearbeiten</strong> vergeben Administratoren eigene Namen. Leer lassen stellt den HA-Namen wieder her. Die Namen gelten nur im Shutter Manager, bleiben nach Neustart erhalten und sind Teil der Sicherung. Reine Namensänderungen greifen nicht in laufende Fahrten ein. Messwerte aktualisieren sich auch bei geöffnetem Editor, ohne Eingaben zu verlieren.</p><h3>Öffnungsprogramme</h3><ol><li>In Einstellungen → Gerät bearbeiten → Öffnungskontakte einen Kontakt und seinen Offen-Zustand zuweisen.</li><li>Programm über das Stift-Symbol bearbeiten oder neu anlegen. Programmtyp Sensorprogramm und Sensorprogramm-Art Öffnungskontakt auswählen.</li><li>Wochentage, Von/Bis und bei Bedarf Gültigkeitszeitraum sowie Urlaubsausnahme einstellen.</li><li>Fahrt hinzufügen: Gerät mit zugeordnetem Öffnungskontakt, Zielhöhe und bei Jalousien Lamellen wählen. Zielhöhe einstellen; bei Jalousien können die Lamellen unverändert bleiben.</li><li>Speichern und aktivieren. Standardmäßig löst eine neu erkannte Öffnung innerhalb der Gültigkeit aus. „Bei bereits geöffnetem Fenster starten“ erlaubt auch einen bereits offenen Kontakt bei Start oder Beginn des Zeitfensters.</li></ol><p>Ein offener Kontakt genügt zum Halten. Der Öffnungsvorrang bleibt bis zum bestätigten Schließen aller Kontakte bestehen, auch nach Ende des Zeitfensters, Tages-/Saisonwechsel und Neustart. Nicht verfügbare Kontakte zählen nicht als geschlossen und lösen selbst keine neue Öffnung aus. Die eigene Kontakt-Sperrregel verhindert das automatische Öffnen nicht. Niedrigere Automatikfahrten des Shutter Managers warten.</p><p>Nach dem Schließen gilt: <strong>aktive Temperatur-/Helligkeitsbeschattung → eine während des offenen Kontakts fällige und noch wartende Zeitfahrt → Position unmittelbar vor dem Öffnen einschließlich Lamellen</strong>. Bereits vorher erledigte Zeitfahrten werden nicht wiederholt. Das Rückkehrziel bleibt während der Fahrt stabil. Eine während des Lüftens aktive Beschattung merkt sich ebenfalls die darunterliegende Ausgangsposition. Fehlende Werte verzögern die Rückkehr; bei unbekannter vorheriger Position wird kein Ziel erfunden (HA-Protokoll).</p><p>Für Nachtfenster über Mitternacht gelten nach Mitternacht Wochentag und Saison des vorherigen Starttags. Überlappende Öffnungsprogramme für dasselbe Gerät werden beim Speichern abgewiesen. Unter Sensorprogramme bleibt ein bestehender Vorrang außerhalb seines Zeitfensters sichtbar. Die Tagespause verhindert neue Auslösungen; ein bereits gestarteter Öffnungszyklus behält seinen Schutz bis zum Schließen und führt danach die Rückkehr aus. Manuelle Bedienung und externe Integrationen bleiben unabhängig.</p><h3>Benannte Sensorregeln</h3><p>Jede Regel enthält ihren Namen, einen Temperatur- und/oder Helligkeitssensor, obere Aktivierungs- und niedrigere Freigabeschwellen sowie die Freigabeverzögerung. Die Vorschlagslisten enthalten nur passende Sensoren anhand der Geräteklasse oder Einheit. Bereits zugewiesene Sensoren bleiben erhalten. Schwellen werden in °C und lx angegeben; °F, Kelvin und klx werden umgerechnet.</p><p>Bei zwei Sensoren gilt immer <strong>und</strong>: Beide oberen Schwellen müssen erreicht sein. Für die Freigabe genügt eine erreichte untere Schwelle. Bei nur einem Sensor entscheidet dessen Wert. Die Freigabebedingung muss über die gesamte Verzögerung bestehen bleiben. Steigt der Wert wieder aus dem Freigabebereich oder fehlt ein Messwert, beginnt die Wartezeit bei erneuter Freigabe von vorn.</p><p>Neue Regeln erhalten den Vorschlagswert <strong>300 Sekunden = 5 Minuten</strong>. Gespeicherte Verzögerungen bleiben erhalten. Ein Wert von 0 bedeutet Freigabe ohne zusätzliche Wartezeit.</p><p>Die Auswahl im Programm verweist auf die benannte Regel. Änderungen an deren Schwellen wirken daher in allen Programmen, die diese Regel nutzen. Für Aktivierung und Freigabe desselben Fensters wird innerhalb eines Programms dieselbe Regel verwendet. Widersprüchliche, gleichzeitig geltende Programme für denselben Rollladen werden abgewiesen; unterschiedliche Wochentage oder Gültigkeitszeiträume trennen sie.</p><h3>Gültigkeit und Fahrziele im Programm</h3><p><strong>Gültigkeitszeitraum</strong> wird nur im Sensorprogramm gepflegt. Start und Ende als TT.MM. wiederholen sich jährlich und zählen mit. Winterzeiträume über den Jahreswechsel sind möglich. Ohne Begrenzung gilt das Programm ganzjährig; zusätzlich gelten seine Wochentage, Aktivierung und eine mögliche Urlaubspause.</p><p>Jede Fahrt steuert genau einen Rollladen. Lamellenregler gibt es nur für Jalousien; die tatsächliche Integration muss die Funktion unterstützen. „Unverändert“ lässt eine Achse unangetastet.</p><p>Bei „Wieder freigegeben“ ist entweder ein eigenes Fahrziel oder die aktuelle Zeitplanposition möglich. Bei Rückkehr zum Zeitplan wird das inzwischen passende Ziel verwendet, beispielsweise die abends fällige Position. Ohne passenden Zeitplan gilt die vor der Sensorbeschattung gemeldete Position. Ohne Freigabefahrt gibt es keine automatische Rückfahrt.</p><h3>Fahrten im Programmeditor</h3><p>Beim Öffnen eines Programms sind alle vorhandenen Fahrten standardmäßig zugeklappt. Über den Pfeil an jeder Fahrt lassen sich ihre Eingabefelder auf- und zuklappen. „Alle aufklappen“ und „Alle zuklappen“ bedienen sämtliche Fahrten des geöffneten Programms. Gerät, Auslöser, Zielposition und Aktivierung bleiben in der Kopfzeile sichtbar. Neue Fahrten öffnen sich direkt im sichtbaren Bereich und fokussieren die Rollladenauswahl. Beim Bearbeiten bleiben Scrollposition und Fokus erhalten. Eingaben und Fahrverhalten bleiben beim Zuklappen erhalten; die Klappzustände gelten für den geöffneten Dialog.</p><h3>Fahrten kopieren und verschieben</h3><p>In der Kopfzeile stehen Papierkorb (Entfernen), Pfeil (Verschieben) und zwei Blätter (Kopieren), auch bei zugeklappten Fahrten. Es öffnet sich ein eigener Dialog mit ausschließlich der Zielprogrammauswahl. Die Quellfahrt wird nicht aufgeklappt oder bearbeitet. Abbrechen oder Escape führt zum unveränderten Programmentwurf zurück. Zielprogramm wählen und die Aktion bestätigen. Zum Kopieren stehen Programme desselben Typs und derselben Sensorprogramm-Art einschließlich des aktuellen Programms zur Wahl. „Dieses Programm“ erzeugt eine unabhängige Kopie im geöffneten Entwurf; anschließend aufklappen und beispielsweise die Uhrzeit ändern. Verschieben bietet nur andere Programme desselben Typs an. Gleiche aktivierte Fahrten zur selben Zeit müssen vor dem Speichern angepasst werden. Übernahmen sind zunächst vorgemerkt: Erst Speichern übernimmt Quelle und Ziel gemeinsam. Abbrechen verwirft die Änderungen; Letzte Übernahme rückgängig nimmt die letzte Kopie oder Verschiebung zurück.</p><p>Kopieren erhält die ursprüngliche Fahrt und vergibt der Kopie eine neue ID. Verschieben erhält die Fahrt-ID und entfernt die Fahrt aus der Quelle. Fahrparameter und Sensorregel bleiben erhalten. Wochentage, Urlaub und Gültigkeit richten sich nach dem Zielprogramm. Ein deaktiviertes Ziel bleibt ausgeschaltet. Konflikte und volle Zielprogramme werden gemeldet; die Eingaben bleiben erhalten.</p><h3>Zeitprogramme</h3><p>Die Anzeige sortiert Fahrten aufsteigend nach ihrer wirksamen Uhrzeit für heute, einschließlich Sonnenversatz und frühestens/spätestens. Eine am Ende ergänzte Morgenfahrt wird nach dem Speichern vor Abendfahrten angezeigt. Beim Öffnen und Aktualisieren wird die Reihenfolge neu berechnet; während der Eingabe bleibt sie stabil. Gleiche Uhrzeiten behalten ihre Reihenfolge, fehlende Sonnenzeiten stehen am Ende. Sensorprogramme behalten ihre Reihenfolge.</p><p>Der Reiter Zeitprogramm zeigt ausschließlich zukünftige Fahrten des aktuellen Tages und tatsächlich offene Aufträge mit Uhrzeit, Gerät, Zielposition und Auslassen. Erledigte, verworfene und nicht erfasste vergangene Fahrten sind nicht enthalten. Warteaufträge bleiben sichtbar, auch vom Vortag. Die Anzeige löst keine vergangenen Zeiten neu aus. Offene Kontakte mit Nachholen zeigen „Ausgesetzt bis Tür geschlossen“: vor Fälligkeit als aktuelle Sperrvorschau, bei einer tatsächlich wartenden Fahrt zusätzlich mit „wird nachgeholt“. „Nicht fahren“ verwirft die konkrete Ausführung; sie verschwindet aus der Liste und wird nicht nachgeholt. Weitere Sperren und nicht verfügbare Kontakte werden angezeigt.</p><p>Eine ausdrücklich in die Zukunft verschobene Fahrt desselben Tages wird neu eingeplant und kann wieder ausgelassen oder eingeplant werden. Es zählt die wirksame Zeit einschließlich frühestens/spätestens. Beim Update werden entsprechende Altkennzeichnungen bereinigt, ohne vergangene Zeiten neu auszulösen. Reine Namens- oder Parameteränderungen lösen keine abgeschlossene Fahrt nachträglich aus.</p><p>Wochentage sind einzeln auswählbar. Auslöser sind feste Uhrzeiten, Sonnenaufgang oder Sonnenuntergang. Sonnenzeiten können einen Versatz und Grenzen für frühestens/spätestens erhalten. Beispiel: Sonnenaufgang 05:20 Uhr mit −30 Minuten und frühestens 06:00 Uhr ergibt eine Fahrt um <strong>06:00 Uhr</strong>.</p><p>Der Urlaubsmodus pausiert nur entsprechend markierte Programme. Standort und Zeitzone werden aus Home Assistant übernommen.</p><h3>Vorrang und Nachholen</h3><p><strong>Ein aktiver Öffnungsvorrang steht über Temperatur/Helligkeit und Zeitprogrammen.</strong> Ohne aktiven Öffnungsvorrang gelten die Kontakt-Sperrregeln. Pro Kontakt ist einstellbar: trotzdem fahren, diese Fahrt verwerfen oder nach dem Schließen nachholen. Nicht verfügbare Kontakte werden bei einer Sperrregel nicht als geschlossen behandelt. Mit „Fahrt nachholen“ wird das Ziel nach Freigabe beim nächsten Auswertungszyklus (innerhalb von etwa fünf Sekunden) erneut geprüft. Erst wird die Höhe und danach gegebenenfalls die Lamellenposition angefahren. „Nicht fahren“ verwirft die konkrete Ausführung. Weitere Hindernisse werden im Zeitprogramm angezeigt.</p><p>Aktive Sensorbeschattung hat Vorrang vor Zeitfahrten. Zeitfahrten aktualisieren das Ziel für danach. Nachholen hat keine Zeitgrenze: Eine neuere fällige Zeitfahrt am selben Rollladen ersetzt eine ältere wartende Zeitfahrt. Bei Freigabe und Rückkehr zum Zeitplan zählt der aktuell gültige Stand.</p><h3>Manuelle Fahrten und Aussetzen</h3><p>Eine manuelle Fahrt deaktiviert keine Regel. Bleiben Sensorwerte hoch, wird die Beschattung nicht ständig erneut angefahren. Nach Freigabe und erneutem Erreichen der Schwellen kann sie wieder auslösen. Spätere Freigabe- oder Zeitfahrten können die manuelle Position verändern; es gibt keine automatische manuelle Sperre.</p><p><strong>Einmal auslassen</strong> betrifft eine konkrete Fahrt. <strong>Bis morgen aussetzen</strong> pausiert das ausgewählte Sensorprogramm bis zur nächsten lokalen Mitternacht, auch nach Neustart. Offene Temperatur-/Helligkeitsaufträge dieses Programms werden aufgehoben. Ein bereits gestarteter Öffnungszyklus bleibt bis zum Schließen geschützt und kehrt danach zurück. Bereits erreichte Positionen werden nicht pauschal zurückgefahren; Zeitprogramme bleiben aktiv. Bei Wiederaktivierung können weiterhin hohe Werte erneut auslösen, wenn das Programm heute gilt.</p><h3>Betrieb, Sicherung und Grenzen</h3><p>Die Auswertung erfolgt alle fünf Sekunden. Bei Jalousien wird erst die Höhe bestätigt, dann die Lamellenposition gesetzt. Ohne Bestätigung wird nach 150 Sekunden je Bewegungsphase ein Fehler gemeldet und, sofern unterstützt, gestoppt.</p><p>Konfiguration, Urlaubsmodus und Vormerkungen werden gespeichert. Nach Neustart werden verpasste Zeitpunkte nicht pauschal nachgeholt; bereits wartende Ziele bleiben erhalten und werden mit neueren Zeitfahrten abgeglichen.</p><p>Administratoren konfigurieren; andere Benutzer benötigen Steuerrechte für die betroffenen Rollläden. Eine Sicherung enthält die Konfiguration. Nach Wiederherstellen sind die importierten Programme zunächst deaktiviert.</p><p>Feiertagsdaten sowie Wind-/Frostschutz sind nicht eingebaut. Der Urlaubsmodus kann durch HA-Automationen gesetzt werden. Andere Steuerungen wie free@home-Grundprofile arbeiten unabhängig weiter.</p><h3>Wenn Speichern nicht klappt</h3><p>Die Fehlermeldung steht direkt über den Speicherknöpfen. Eingaben bleiben erhalten. Bei Sensorregeln muss die Freigabeschwelle unter der Aktivierungsschwelle liegen, beispielsweise aktiv ab 25 °C und Freigabe bei 23 °C. Mindestens einen Sensor auswählen. Unveränderte Programme anderer, momentan nicht verfügbarer Geräte blockieren das Speichern der Regelparameter nicht. Bei einem vorübergehenden Speicherfehler lässt sich Speichern erneut versuchen.</p><h3>Versionen prüfen</h3><p>Im Howto und in den Einstellungen stehen Oberfläche und tatsächlich geladene Integration getrennt. Eine Versionsnummer im Titel der Anleitung allein bezeichnet nur die Kartenoberfläche. Fehlt die Meldung der Integration oder unterstützt diese die Sensorregeln noch nicht, bleiben Schreibzugriffe gesperrt. Nach einem Code-Update Home Assistant vollständig neu starten, beispielsweise mit `ha core restart` im Terminal, und danach Browser/App neu laden. Ein Neuladen nur der Integration ersetzt diesen Neustart nicht. Die Karte kontrolliert zusätzlich, ob die gespeicherten Sensorregeln in der Antwort der Integration enthalten sind.</p>";
const CARD_VERSION = '1.2.5';
const ENGLISH = {
  'Programme':'Programs','Zeitprogramm':'Schedule','Sensorprogramme':'Sensor programs','Messwerte':'Sensor readings','Sonnenzeiten und Sensorwerte':'Sun times and sensor readings','Sonnenaufgang':'Sunrise','Sonnenuntergang':'Sunset','Öffnungssensoren':'Contact sensors','Temperatur':'Temperature','Helligkeit':'Brightness','Weitere Sensoren':'Other sensors',
  'Neu laden':'Reload','+ Programm':'+ Program','Fahrt':'action','Fahrten':'actions','Öffnungsprogramm':'Opening program','Sensorprogramm':'Sensor program','Zeitprogramme':'Time programs','Sensorprogramme':'Sensor programs','Außerhalb des Zeitfensters':'Outside the time window','Nach oben sortieren':'Move up','Nach unten sortieren':'Move down','Keine Tage':'No days','Pause im Urlaub':'Paused during vacation','Regel:':'Rule:','Bitte auswählen':'Please select','Noch keine Fahrten. Unter Bearbeiten hinzufügen.':'No actions yet. Add one using Edit.','Zuerst in den Einstellungen die Rollläden und Sensoren zuordnen. Danach ein Zeit- oder Sensorprogramm anlegen.':'First add covers and sensors in Settings. Then create a schedule or sensor program.',
  'Urlaubsmodus':'Vacation mode','Markierte Programme im Urlaub aussetzen':'Pause selected programs during vacation','Rollläden und Jalousien':'Shutters and blinds','Sensoranzeigenamen':'Sensor display names','Bearbeiten':'Edit','Noch keine Sensoren zugeordnet.':'No sensors assigned yet.','Sicherung':'Backup','Sicherung erstellen':'Create backup','Sicherung wiederherstellen':'Restore backup','Rollläden hinzufügen':'Add covers','Jalousie':'Blind','Rollladen':'Shutter','Kein Öffnungskontakt':'No contact sensor','Vorhandene Rollläden und Jalousien über „Rollläden hinzufügen“ auswählen. Die Anzeigenamen lassen sich anschließend unter Bearbeiten ändern.':'Select existing covers using “Add covers”. You can change their display names using Edit.',
  'Aktuelle Fahrten':'Current actions','Wird ausgeführt':'Running','Wartet auf Ausführung':'Waiting to run','Geplant':'Schedule','Pausiert':'Paused','Wartet':'Waiting','Ausgelassen':'Skipped','Einmal ausgelassen':'Skipped once','Offen seit':'Open since','Wieder einplanen':'Reschedule','Einmal auslassen':'Skip once','Auslassen':'Skip','Heute':'Today','Für heute ausgesetzt':'Paused for today','Position bis zum Schließen geschützt':'Position protected until closed','Beschattung aktiv':'Shading active','Sensorbedingung erfüllt':'Sensor condition met','Bereit':'Ready','Automatisch wieder ab morgen, 00:00 Uhr':'Automatically resumes tomorrow at midnight','Heute wieder aktivieren':'Resume for today','Bis morgen aussetzen':'Pause until tomorrow','Heute sind keine Sensorprogramme oder direkten Beschattungsregeln freigegeben. Wochentage und Saison werden berücksichtigt.':'No sensor programs or direct shading rules are active today. Weekdays and seasons are taken into account.',
  'Anzeigename im Planer':'Display name','Rollladen / Jalousie':'Cover','Typ':'Type','Automatisch erkennen':'Detect automatically','Anderer Cover-Typ':'Other cover type','Programmtyp':'Program type','Programm aktiv':'Program enabled','Im Urlaub aussetzen':'Pause during vacation','Wochentage':'Weekdays','Fahrten':'Actions','Alle aufklappen':'Expand all','Alle zuklappen':'Collapse all','Auslöser':'Trigger','Uhrzeit':'Time','Frühestens':'Earliest','Spätestens':'Latest','Fenster':'Window','Höhe':'Position','Lamellen':'Tilt','Unverändert':'Unchanged','Auswahl':'Selection','+ Fahrt hinzufügen':'+ Add action','Entfernen':'Remove','Verschieben':'Move','Kopieren':'Copy','Speichern':'Save','Abbrechen':'Cancel','Löschen':'Delete','Schließen':'Close','Zielprogramm':'Target program','Übernahme abbrechen':'Cancel transfer','Sicherung erstellen':'Create backup','Sicherung wiederherstellen':'Restore backup','Sensorregel':'Sensor rule','Name der Sensorregel':'Sensor rule name','Temperatur (optional)':'Temperature (optional)','Helligkeit (optional)':'Brightness (optional)','Aktiv ab Temperatur (°C)':'Activate at temperature (°C)','Freigabe ab / unter Temperatur (°C)':'Release below temperature (°C)','Aktiv ab Helligkeit (lx)':'Activate at brightness (lx)','Freigabe ab / unter Helligkeit (lx)':'Release below brightness (lx)','Freigabeverzögerung (Sekunden)':'Release delay (seconds)','Regel entfernen':'Remove rule','+ Sensorregel':'+ Sensor rule','Kontakt':'Contact sensor','Zustand bei offenem Fenster':'State when window is open','Wenn offen':'When open','Kontakt entfernen':'Remove contact','Gültigkeitszeitraum':'Validity period','Von':'From','Bis':'To','Bei bereits erfüllter Bedingung starten':'Start when condition is already met','Wochentage einzeln auswählen':'Select weekdays','Urlaubsmodus aktivieren':'Enable vacation mode','Unbekannt':'Unknown','Nicht verfügbar':'Unavailable','Ausgesetzt bis Tür geschlossen':'Paused until door closes','wird nachgeholt':'will be retried','Eintrag dauerhaft löschen?':'Permanently delete this item?','Datei zu groß (max. 2 MB).':'File too large (max. 2 MB).','Zielprogramm nicht mehr vorhanden. Bitte neu laden.':'Target program no longer exists. Please reload.','Fenster zuerst aus allen Fahrten entfernen.':'Remove this window from all actions first.','Für jede Fahrt genau einen Rollladen auswählen.':'Select exactly one cover for each action.','Eine benannte Sensorregel für das Gerät auswählen.':'Select a named sensor rule for this cover.','Für jede Fahrt mindestens eine Position festlegen. Reine Lamellenfahrten benötigen den Typ Jalousie.':'Set at least one position for each action. Tilt-only actions require a blind.',
  'Oberfläche':'Card','Integration':'Integration','Version nicht gemeldet':'Version not reported','Rollläden und Jalousien hinzufügen':'Add shutters and blinds','Alle sichtbaren auswählen':'Select all visible','Auswahl aufheben':'Clear selection','ausgewählt':'selected','Hinzufügen':'Add','Rollläden und Sensoren':'Covers and sensors','Howto':'Guide','Howto – Anleitung':'Guide','Einstellungen':'Settings','Aktiv':'Enabled','Fahrt aktiv':'Action enabled','Rollladen aktiv':'Cover enabled','Keine offene Fahrt':'No pending action','Keine offenen Fahrten':'No pending actions','Sensoranzeigenamen bearbeiten':'Edit sensor display names','Vorhandene Rollläden und Jalousien über „Rollläden hinzufügen“ auswählen.':'Select existing covers using “Add covers”.','Sprache':'Language','Sensorregeln':'Sensor rules','Einzelne Fahrten dauerhaft deaktivieren.':'Permanently disable individual actions.','Diese Anleitung neben dem Zahnrad öffnen.':'Open this guide next to the settings button.','Zeitfahrten aktualisieren das Ziel für danach.':'Schedule actions update the target for later.','Anzeigenamen und Gerätetyp lassen sich im Planer ändern.':'You can change display names and cover type in the planner.','Fenster bearbeiten':'Edit cover','Programm bearbeiten':'Edit program','Rollläden hinzufügen':'Add covers','Rollläden auswählen':'Select covers','Keine offenen Fahrten für heute.':'No upcoming or pending actions for today.','Keine offene Fahrt für heute.':'No upcoming or pending action for today.','Öffnet':'Open','Geschlossen':'Closed','Offen':'Open','Nicht verfügbar':'Unavailable','Unbekannt':'Unknown','Wird ausgelassen':'Will be skipped','Ausgesetzt':'Paused','Verstrichen':'Past due','Wird nachgeholt':'Will be retried','Keine offene Fahrt':'No pending action','Wartet auf Tür':'Waiting for door','Sonnenaufgang':'Sunrise','Sonnenuntergang':'Sunset','Montag':'Monday','Dienstag':'Tuesday','Mittwoch':'Wednesday','Donnerstag':'Thursday','Freitag':'Friday','Samstag':'Saturday','Sonntag':'Sunday','Heute sind keine Programme aktiv.':'No programs are active today.','Heute ist keine Fahrt geplant.':'No actions are scheduled for today.','Aufgabe nicht möglich.':'Action unavailable.','Bitte zuerst neu laden.':'Please reload first.','Die Konfiguration wurde geändert. Bitte neu laden.':'The configuration changed. Please reload.','Konfiguration gespeichert.':'Configuration saved.','Keine Berechtigung zum Steuern.':'You do not have permission to control this.','Sensorwert fehlt':'Sensor value missing','Werte aktualisieren sich automatisch.':'Values update automatically.','Urlaub':'Vacation','Wahr':'On','Falsch':'Off','Noch keine Programme angelegt.':'No programs created yet.','Keine Programme vorhanden.':'No programs available.','Leere Konfiguration':'Empty configuration','Konfiguration importieren':'Import configuration','Importieren':'Import','Exportieren':'Export','Sensoranzeigenamen speichern':'Save sensor display names','Leer lassen, um den Namen aus Home Assistant zu verwenden.':'Leave blank to use the Home Assistant name.','Gültig ab':'Valid from','Gültig bis':'Valid until','Jährlichen Zeitraum begrenzen':'Limit annual date range','Saison aktivieren':'Enable season','Bei bereits erfüllter Bedingung starten':'Trigger immediately if condition is already met','Sensorprogramm-Art':'Sensor program type','Temperatur und Helligkeit':'Temperature and brightness','Kontakt geschlossen':'Contact closed','Kontakt offen':'Contact open','Trotzdem fahren':'Proceed anyway','Nicht fahren':'Do not move','Fahrt nachholen':'Retry after closing','Einzelne Fahrt auslassen':'Skip action once','Einstellungen speichern':'Save settings','Rollladen ausgewählt':'Cover selected','Neues Programm':'New program','Neue Fahrt':'New action','Neue Regel':'New rule','Name':'Name','Sicherung wiederherstellen':'Restore backup','Konfigurationssicherung':'Configuration backup','Konfiguration':'Configuration','Sensorwert':'Sensor reading','Ereignis':'Event','Öffnung':'Opening','Beschattung':'Shading','Wieder freigegeben':'Condition released','Aktuelle Zeitplanposition übernehmen':'Use current scheduled position','Position':'Position','Lamellenposition':'Tilt position','Unverändert lassen':'Leave unchanged','Position bis Schließen geschützt':'Position protected until closed','Heute wieder aktivieren':'Resume today','Programm kopieren':'Copy program','Programm bearbeiten':'Edit program','Programm':'Program','(Kopie)':'(copy)','(dieses Programm)':'(this program)','Übernahme vorgemerkt':'Transfer staged','Übernahme':'Transfer','Übernahmen':'Transfers','vorgemerkt – mit Speichern übernehmen.':'staged — save to apply.','Letzte Übernahme rückgängig':'Undo last transfer','Zielprogramm nicht mehr vorhanden. Bitte neu laden.':'Target program no longer exists. Please reload.','Datei konnte nicht gelesen werden.':'Could not read file.','Speichern fehlgeschlagen.':'Save failed.','Sicherung importiert.':'Backup imported.','Nur Administratoren können diese Änderung vornehmen.':'Only administrators can make this change.','Sensorregel speichern':'Save sensor rule','Keine Fahrten vorhanden.':'No actions available.','Keine Programme zur Auswahl.':'No programs available.'
};
const HOWTO_HTML_EN = `<h2>Shutter Manager 1.2.5</h2><p>Shutter Manager combines time schedules, temperature/brightness shading, and window-contact opening programs. Settings define covers, contacts, and named sensor rules. Programs determine when those rules apply and which actions they trigger.</p><h3>Cover status and command history</h3><p>Settings show each shutter or blind’s current Home Assistant state and, when reported, its position and tilt. The latest successful and failed movement commands appear below with their time and message. Failed movements are shown when the integration detects an error.</p><h3>One-time movements</h3><p>In the Schedule tab, use “+ One-time movement” to add a movement for one cover or blind today. Set a time, position, and optional tilt for blinds. The movement is a temporary entry, not a saved program. It disappears after successful execution, remains listed if blocked or if execution fails, and is discarded the following day if it has expired.</p><h3>Quick start</h3><ol><li>In <strong>Settings → Add covers</strong>, select your existing Home Assistant cover entities.</li><li>Edit a cover to assign window contacts and create named temperature and/or brightness rules.</li><li>Under <strong>Programs → + Program</strong>, choose a schedule or sensor program, set weekdays and any validity period, then add actions.</li><li>Each action controls one cover. Set position and, for supported blinds, tilt. Position is 0% at the bottom and 100% at the top.</li><li>Use the Schedule tab to inspect upcoming and waiting actions, and skip a specific action once. Sensor programs can be paused until midnight.</li></ol><h3>Tabs and settings</h3><p><strong>Programs</strong> lists schedules and sensor programs. Programs start collapsed; use the chevron to expand them. Edit a program to expand individual actions or all actions. The copy icon on a program opens an editable independent copy; it receives a new ID and a “(copy)” name. Save to create it. A copied program keeps its weekdays and actions, so review its schedule before saving.</p><p><strong>Schedule</strong> shows future actions for today and actions that still need to run. Use “+ One-time movement” to schedule a cover or blind for today by time, device, and position; tilt is available only for blinds. A one-time movement is removed after success, stays visible while blocked or after an error, expires the next day, and does not create a saved program. Completed, dismissed, and unrecorded past actions are omitted. A blocked retry remains visible with its reason. “Skip once” applies to recurring schedule occurrences.</p><p><strong>Sensor programs</strong> shows programs currently valid today and allows pausing them until local midnight. An opening override remains in effect until all assigned contacts close, including across a schedule window, date change, or restart.</p><p><strong>Settings</strong> contains vacation mode, covers and sensor assignments, display names, and configuration backup and restore. Only programs marked for vacation are paused.</p><h3>Language</h3><p>Choose the 🇩🇪 or 🇬🇧 flag in Settings. The choice is saved in this browser for this Home Assistant user. German is the default.</p><h3>Sun times and sensor readings</h3><p>The readings panel is shown on the Programs tab and can be collapsed. It shows sunrise and sunset, then contact, temperature, and brightness sensors. Readings within a group are sorted alphabetically and flow across the available width. Temperature uses one decimal place. Brightness is abbreviated in thousands of lux (for example, 20k lx for 20,300 lx). Assign custom sensor names in Settings; blank names use Home Assistant’s friendly name.</p><h3>Named sensor rules</h3><p>A sensor rule contains a temperature sensor and/or brightness sensor, activation thresholds, lower release thresholds, and a release delay (default 300 seconds). If both sensors are selected, both activation thresholds must be met (AND). For release, either lower threshold is sufficient. The release condition must remain true for the full delay. Sensor rules only define thresholds; sensor programs define weekdays, validity, and actions.</p><p>More than one rule can be attached to a cover, such as “Summer” and “Winter”. A sensor program selects which rule to use. Sensor suggestions are filtered by sensor type.</p><h3>Opening programs and priority</h3><p>An opening program can raise a cover when a configured contact opens during its selected days and time window. Set the target position and optional tilt. A new opening keeps the cover protected at that position until all assigned contacts close.</p><p>After closing, the priority order is: <strong>active temperature/brightness shading → a time action that became due and is still waiting while the contact was open → position recorded immediately before opening</strong>. A time target completed before opening is not replayed. An opening override outranks other Shutter Manager automatic actions. Manual operation and other integrations remain independent.</p><h3>Schedules and contact policies</h3><p>Time schedules support individual weekdays, fixed times, sunrise or sunset, offsets, and earliest/latest limits. When a contact is open, each cover can be configured to proceed anyway, discard that action, or retry after closing. Unavailable contacts are not treated as closed. Retried actions have no time limit, but a newer due action on the same cover replaces the older one.</p><p>Sensor programs can have an annual validity period. Start and end dates are inclusive; a period may cross the end of the year. A program also needs to be enabled and match the current weekday. A vacation pause applies only when selected for that program.</p><h3>Actions, copy, and move</h3><p>Existing actions in the editor start collapsed. Use each chevron or the “Expand all” and “Collapse all” controls. The copy and move icons open a dialog that asks only for a target program. Copying to the current program creates an independent action that can then be edited. Transfers are staged and take effect together when you save; cancelling discards them.</p><p>For an entire program, use the copy icon in its header. The copied program gets a new ID and an editable “(copy)” name. Check the copied weekdays and times to avoid overlapping actions.</p><h3>Operation and limits</h3><p>The integration evaluates every five seconds. For supported blinds, it commands position first and tilt second. If a target is not confirmed within 150 seconds per movement phase, it logs an error and stops where supported. The integration requires existing cover entities and position feedback. A selected device type cannot add a capability the underlying entity does not provide.</p><p>Configuration, vacation mode, and waiting actions are stored locally. Missed past schedule times are not automatically replayed after restart. Administrators configure the integration; other users need Home Assistant permissions for relevant entities. Holiday calendars, wind protection, and frost protection are not built in.</p><h3>Troubleshooting</h3><p>After updating code, restart Home Assistant Core and reload the browser or app. Check that the card and integration versions match. If a rule does not save, verify that its release threshold is below its activation threshold and that at least one suitable sensor is selected. A sensor rule belongs to the cover settings, while validity and target positions belong to sensor programs.</p>`;
Object.assign(ENGLISH,{
  'Fenster öffnet':'Window opens','Wieder freigegeben':'Released','Helligkeit und Temperatur erreicht':'Brightness and temperature reached','Temperatur erreicht':'Temperature reached','Helligkeit erreicht':'Brightness reached','Sensorbedingung erreicht':'Sensor condition met','Aktuelle Zeitplanposition':'Current scheduled position','Position unverändert':'Position unchanged','Deaktiviert':'Disabled','Ganzjährig':'Year-round','Gültig ab':'Valid from','Gültig bis':'Valid until','Heute sind keine zukünftigen oder nachzuholenden Fahrten vorhanden.':'No upcoming or pending actions for today.','Für heute sind keine zukünftigen oder nachzuholenden Fahrten vorhanden.':'No upcoming or pending actions for today.','Für heute gültige Programme. Öffnungsvorrang bleibt bis zum Schließen bestehen.':'Programs valid today. Opening priority remains until the contact closes.','Heute sind keine Sensorprogramme oder direkten Beschattungsregeln freigegeben. Wochentage und Saison werden berücksichtigt.':'No sensor programs or direct shading rules are active today. Weekdays and validity periods are taken into account.','Keine Geräte mit hinterlegtem Temperatur- oder Helligkeitssensor.':'No covers have an assigned temperature or brightness sensor.','Keine Geräte mit zugewiesenem Öffnungskontakt.':'No covers have an assigned contact sensor.','Noch keine Programme angelegt.':'No programs created yet.','Für heute keine offene Fahrt':'No pending action for today','Für heute keine offenen Fahrten':'No pending actions for today','Bitte eine Fahrt und ein passendes Zielprogramm auswählen.':'Select an action and a compatible target program.','Bitte einen Namen vergeben.':'Enter a name.','Bitte wählen':'Please choose','Das Zielprogramm enthält bereits 100 Fahrten.':'The target program already contains 100 actions.','Die Helligkeit für die Freigabe muss unter der Aktivierungshelligkeit liegen.':'The release brightness must be lower than the activation brightness.','Die Temperatur für die Freigabe muss unter der Aktivierungstemperatur liegen.':'The release temperature must be lower than the activation temperature.','Freigabeverzögerung zwischen 0 und 86400 Sekunden eintragen.':'Enter a release delay between 0 and 86400 seconds.','Mindestens einen Temperatur- oder Helligkeitssensor auswählen.':'Select at least one temperature or brightness sensor.','Konfiguration ersetzen? Importierte Programme bleiben zunächst ausgeschaltet.':'Replace configuration? Imported programs are initially disabled.','Speichern fehlgeschlagen.':'Save failed.','Konfiguration gespeichert.':'Configuration saved.','Sicherung importiert.':'Backup restored.','Die Konfiguration wurde geändert. Bitte neu laden.':'The configuration changed. Please reload.','Keine Berechtigung zum Steuern.':'You do not have permission to control this.','Eintrag dauerhaft löschen?':'Permanently delete this item?','Programm kopieren':'Copy program','Zeitprogramm':'Schedule','Sensorprogramme':'Sensor programs','Rollladensteuerung':'Shutter Manager','Gültigkeitszeitraum (TT.MM.)':'Validity period (DD.MM.)','Von (TT.MM.)':'From (DD.MM.)','Bis (TT.MM.)':'To (DD.MM.)','Von / Bis':'From / To','Auslöser bis':'Trigger until','Name oder Entität':'Name or entity','Sensorwert fehlt':'Sensor value missing','Saison aktivieren':'Enable validity period','Fenster bearbeiten':'Edit cover','Zustand bei offenem Fenster':'State when window is open','Automatisch wieder ab morgen, 00:00 Uhr':'Automatically resumes tomorrow at midnight','Position bis zum Schließen geschützt':'Position protected until the contact closes','Für heute ausgesetzt':'Paused for today','Heute wieder aktivieren':'Resume today','Eine Fahrt steuert genau einen Rollladen.':'Each action controls one cover.','Öffnet':'Open','Trotzdem fahren':'Proceed anyway','Nicht fahren':'Do not move','Fahrt nachholen':'Retry after closing','Insgesamt':'Total','Sensorregeln':'Sensor rules','Rolläden hinzufügen':'Add covers','Wieder einplanen':'Reschedule','Ausgelassen':'Skipped','Einmal ausgelassen':'Skipped once','Verstrichen':'Past due','Ausgesetzt':'Paused','Keine offene Fahrt':'No pending action','Keine offenen Fahrten':'No pending actions','Wartet –':'Waiting —','Ausgesetzt –':'Paused —','Ausgesetzt bis Tür geschlossen':'Paused until door closes','Öffnungssensor bei Fälligkeit nicht verfügbar':'Contact sensor unavailable when action is due','Tür bei Fälligkeit offen':'Door open when action is due','wird nachgeholt':'will be retried','Offen seit':'Open since','Nicht verfügbar':'Unavailable','Unbekannt':'Unknown','Geschlossen':'Closed','Offen':'Open','Programm aktiv':'Program enabled','Fahrt aktiv':'Action enabled','Rollladen aktiv':'Cover enabled','Keine Tage':'No days','Pause im Urlaub':'Paused during vacation','Markierte Programme im Urlaub aussetzen':'Pause selected programs during vacation','Sicherung':'Backup','Sicherung erstellen':'Create backup','Sicherung wiederherstellen':'Restore backup','Sensoranzeigenamen':'Sensor display names','Rollläden und Jalousien':'Shutters and blinds','Rollläden und Jalousien hinzufügen':'Add shutters and blinds','Rollläden hinzufügen':'Add covers','Rollläden auswählen':'Select covers','Keine offenen Fahrten für heute.':'No upcoming or pending actions for today.','Sonnenzeiten und Sensorwerte':'Sun times and sensor readings','Weitere Sensoren':'Other sensors'
});
const CONFIG_SCHEMA = 4;
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const POLICY = {defer: 'Fahrt nachholen', skip: 'Nicht fahren', drive: 'Trotzdem fahren'};
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = v => JSON.parse(JSON.stringify(v));
const uid = () => 'id_' + (crypto.randomUUID ? crypto.randomUUID().replaceAll('-', '') : Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join(''));
const options = (items, current) => items.map(([v,t]) => `<option value="${esc(v)}" ${String(v) === String(current) ? 'selected' : ''}>${esc(t)}</option>`).join('');
const field = (label, input, extra='') => `<label class="field ${extra}"><span>${esc(label)}</span>${input}</label>`;
const input = (key, value, type='text', attrs='') => `<input data-key="${esc(key)}" type="${type}" value="${esc(value)}" ${attrs}>`;
const check = (key, value, label, disabled=false) => `<label class="check"><input type="checkbox" data-key="${esc(key)}" ${value ? 'checked' : ''} ${disabled ? 'disabled' : ''}>${esc(label)}</label>`;
const toggle = (action, value, label, attrs='', disabled=false) => `<button type="button" role="switch" class="toggle ${value?'on':''}" data-action="${action}" ${attrs} aria-label="${esc(label || ({program:'Programm aktiv',ride:'Fahrt aktiv',window:'Rollladen aktiv'}[action] || action))}" aria-checked="${!!value}" ${disabled?'disabled':''}><span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>${label?`<span>${esc(label)}</span>`:''}</button>`;

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
    if (this._hass) this.refresh();
  }
  disconnectedCallback() { clearInterval(this.timer);this.resizeObserver?.disconnect(); }
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
    const normalize=g=>({id:g.id,name:(g.name || '').trim(),temp_entity:g.temp_entity || null,lux_entity:g.lux_entity || null,
      temp_on:g.temp_on ?? 25,temp_off:g.temp_off ?? 23,lux_on:g.lux_on ?? 30000,lux_off:g.lux_off ?? 20000,release_delay_seconds:g.release_delay_seconds ?? 300});
    const rules=w=>{const source=w.sensor_rules?.length || !w.climate?(w.sensor_rules || []):[{...w.climate,id:'legacy',name:w.climate.name || 'Beschattung'}];return source.map(normalize).sort((a,b)=>a.id.localeCompare(b.id));};
    return expected.windows.every(w=>{const actual=saved?.windows?.find(x=>x.id===w.id);return !!actual && JSON.stringify(rules(w))===JSON.stringify(rules(actual));});
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
      if(submitted && (!this.sensorRulesMatch(submitted,response.config) || !this.sensorNamesMatch(submitted,response.config))) {
        if(this.editor)this.editor.revision=response.revision;
        this.error='Speichern nicht bestätigt: Die Integration hat die Sensorregeln oder Sensoranzeigenamen nicht vollständig übernommen. Deine Eingaben bleiben im Dialog. Bitte Home Assistant vollständig neu starten (ha core restart).';
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
    if (kind === 'sensor') return ride.edge === 'active' ? this.sensorTriggerText(this.selectedRule(this.windows.find(w=>w.id===ride.targets[0]),ride)) : (this.language()==='en'?'Released':'Wieder freigegeben');
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
    return [g.lux_entity?g.lux_on+' lx':'',g.temp_entity?g.temp_on+' °C':''].filter(Boolean).join(' und ');
  }
  targetsText(ride) {
    if(ride.restore_schedule) return 'Aktuelle Zeitplanposition';
    return [ride.position != null ? `Höhe ${ride.position}%` : '', ride.tilt != null ? `Lamellen ${ride.tilt}%` : ''].filter(Boolean).join(' · ');
  }
  usedSensors() {
    const refs=this.data?.sensor_entities || this.windows.flatMap(w=>[
      ...(w.contacts || []).map(c=>c.entity),...(w.sensor_rules || []).flatMap(g=>[g.temp_entity,g.lux_entity])]);
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
    if(a.device_class==='illuminance' || ['lx','klx'].includes(a.unit_of_measurement))return 'illuminance';
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
      const unit=s.attributes.unit_of_measurement || 'lx';
      if(['lx','klx'].includes(unit)) {
        const lux=number*(unit==='klx'?1000:1);
        return lux>=1000?Math.floor(lux/1000)+'k lx':new Intl.NumberFormat(this.locale(),{maximumFractionDigits:0}).format(lux)+' lx';
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
    const paths={
      sunrise:'<path d="M2 17h20M5 21h14M7 17a5 5 0 0 1 10 0M4 12l-2-2m18 2 2-2M12 9V2m-3 3 3-3 3 3"/>',
      sunset:'<path d="M2 17h20M5 21h14M7 17a5 5 0 0 1 10 0M4 12l-2-2m18 2 2-2M12 2v7m-3-3 3 3 3-3"/>',
      lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
      unlock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 7.5-2M12 15v2"/>',
      temperature:'<path d="M9 14.5V5a3 3 0 0 1 6 0v9.5a5 5 0 1 1-6 0M12 8v10"/><circle cx="12" cy="18" r="1"/>',
      illuminance:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
      trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/>',
      move:'<path d="M14 4H4v16h10M10 12h12m-4-4 4 4-4 4"/>',
      copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
      edit:'<path d="M4 16l12-12 4 4L8 20H4v-4M14 6l4 4"/>',
      unknown:'<circle cx="12" cy="12" r="9"/><path d="M10 8a2 2 0 1 1 3 2c-1 .5-1 1-1 2m0 4h.01"/>'
    };
    return `<svg class="status-icon" data-icon="${kind}" viewBox="0 0 24 24" aria-hidden="true">${paths[kind] || paths.unknown}</svg>`;
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
  render() {
    if (!this.shadowRoot) return;
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
      ${d ? `<div class="card-top"><nav aria-label="Rollladensteuerung">${['Programme','Zeitprogramm','Sensorprogramme'].map((t,i)=>`<button data-action="tab" data-tab="${i}" aria-current="${(this.tab||0)===i?'page':'false'}" class="${(this.tab||0)===i?'selected':''}">${t}</button>`).join('')}</nav><button class="settings-button ${this.tab===4?'selected':''}" data-action="tab" data-tab="4" aria-label="Howto" title="Howto – Anleitung" aria-current="${this.tab===4?'page':'false'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-3h2v-2h-2v2zm1-11a4 4 0 0 0-4 4h2a2 2 0 1 1 4 0c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5a4 4 0 0 0-4-4z"/></svg></button><button class="settings-button ${(this.tab||0)===3?'selected':''}" data-action="tab" data-tab="3" aria-label="Einstellungen" title="Einstellungen" aria-current="${this.tab===3?'page':'false'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.63l-1.92-3.32a.49.49 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.62-.94l-.36-2.54a.49.49 0 0 0-.49-.42h-3.84a.49.49 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.49.49 0 0 0-.6.22L2.68 8.85a.49.49 0 0 0 .12.63l2.03 1.58a7.3 7.3 0 0 0 0 1.88L2.8 14.52a.49.49 0 0 0-.12.63l1.92 3.32c.12.22.38.31.6.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.04.24.24.42.49.42h3.84c.25 0 .45-.18.49-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.09.48 0 .6-.22l1.92-3.32a.49.49 0 0 0-.12-.63zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg></button></div>` : ''}
      ${d && (this.tab||0)===0?`<div class="overview-panel"><button class="overview-toggle" data-action="toggle-overview" aria-controls="overview-content" aria-expanded="${this.overviewVisible()}"><svg class="chevron ${this.overviewVisible()?'expanded':''}" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg><span>Messwerte</span></button><section id="overview-content" class="overview" aria-label="Sonnenzeiten und Sensorwerte" ${this.overviewVisible()?'':'hidden'}>${this.overviewHtml()}</section></div>`:''}
      ${this.error ? `<div class="error" role="alert">${esc(this.error)} <button data-action="refresh">Neu laden</button></div>` : ''}
      ${d ? `<main>${(this.tab||0)===0 ? this.programList() : this.tab===1 ? this.plannedList() : this.tab===2 ? this.sensorProgramList() : this.tab===3 ? this.settingsList() : this.howtoList()}</main>` : '<main>Integration unter Einstellungen → Geräte & Dienste hinzufügen.</main>'}
      ${this.editor ? this.editorHtml() : ''}
    `;
    this.translateCard(card);
    if(this.shadowRoot.querySelector('nav')) this.shadowRoot.querySelector('nav').scrollLeft=navScroll;
    this.revealTab();
    this.shadowRoot.addEventListener('click', this.clickHandler ||= e => this.onClick(e));
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
    const {config:c, admin} = this.data;
    return `${admin?'<div class="page-actions"><button class="primary" data-action="new-program">+ Programm</button></div>':''}
      ${c.programs.length ? [{key:'time',name:'Zeitprogramme',programs:c.programs.filter(p=>p.kind==='time')},{key:'sensor',name:'Sensorprogramme',programs:c.programs.filter(p=>p.kind==='sensor')}].filter(group=>group.programs.length).map(group=>{
        const collapsed=this.collapsedProgramGroups().has(group.key);
        return `<section class="program-group"><button class="program-group-head" data-action="fold-program-group" data-group="${group.key}" aria-expanded="${!collapsed}"><svg class="chevron ${!collapsed?'expanded':''}" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg><strong>${group.name}</strong><span>${group.programs.length}</span></button>
        ${!collapsed?group.programs.map((p,index) => `<section class="program ${!p.enabled?'muted':''}">
          <div class="program-head"><div class="program-heading"><button class="program-title" data-action="fold-program" data-program="${p.id}" aria-expanded="${this.expanded().has(p.id)}"><svg class="chevron ${this.expanded().has(p.id)?'expanded':''}" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg><span>${esc(p.name)}</span></button><div class="tags"><span>${p.rides.length} ${p.rides.length===1?'Fahrt':'Fahrten'}</span><span>${this.isOpening(p)?'Öffnungsprogramm':p.kind === 'sensor'?'Sensorprogramm':'Zeitprogramm'}</span>${this.isOpening(p)?`<span>${esc(p.opening_start)}–${esc(p.opening_end)}</span>`:''}<span>${p.days.map(i=>DAYS[i]).join(' · ') || 'Keine Tage'}</span>${p.pause_in_vacation?'<span>Pause im Urlaub</span>':''}</div></div>
          <div class="toolbar">${admin?`<div class="program-order"><button data-action="move-program" data-program="${p.id}" data-direction="up" title="Nach oben sortieren" aria-label="Nach oben sortieren" ${index===0?'disabled':''}>↑</button><button data-action="move-program" data-program="${p.id}" data-direction="down" title="Nach unten sortieren" aria-label="Nach unten sortieren" ${index===group.programs.length-1?'disabled':''}>↓</button></div>`:''}${toggle('program',p.enabled,'',`data-program="${p.id}"`,!this.can(p))}${admin?`<button data-action="copy-program" data-program="${p.id}" class="edit-button" title="Programm kopieren" aria-label="Programm kopieren">${this.statusIcon('copy')}</button><button data-action="edit-program" data-program="${p.id}" class="edit-button" title="Bearbeiten" aria-label="Programm bearbeiten">${this.statusIcon('edit')}</button>`:''}</div></div>
          ${this.expanded().has(p.id) ? (p.rides.map(r => `<div class="ride ${!r.enabled?'muted':''}"><div class="ride-info"><strong>${esc(this.windowName(r.targets[0]))}</strong><span>${esc(this.when(r,p.kind))}</span>${p.kind==='sensor' && !this.isOpening(p)?`<small>Regel: ${esc(this.selectedRule(this.windows.find(w=>w.id===r.targets[0]),r)?.name || 'Bitte auswählen')}</small>`:''}<small>${esc(this.targetsText(r))}</small></div><div class="ride-actions">${toggle('ride',r.enabled,'',`data-program="${p.id}" data-target="${r.id}"`,!this.can(p))}</div></div>`).join('') || '<p>Noch keine Fahrten. Unter Bearbeiten hinzufügen.</p>') : ''}
        </section>`).join(''):''}</section>`;
      }).join('') : '<div class="empty">Zuerst in den Einstellungen die Rollläden und Sensoren zuordnen. Danach ein Zeit- oder Sensorprogramm anlegen.</div>'}
`;
  }
  howtoList() { return `<article class="howto"><p class="version-info">Oberfläche ${CARD_VERSION} · Integration ${esc(this.data.backend_version || 'Version nicht gemeldet')}</p>${this.language()==='en'?HOWTO_HTML_EN:HOWTO_HTML}</article>`; }
  isOpening(program=this.editor?.item) { return program?.kind==='sensor' && program.sensor_mode==='opening'; }
  hasOpeningContacts(window) { return !!window?.contacts?.length; }
  hasSensors(window) { return !!window?.sensor_rules?.some(g=>g.lux_entity || g.temp_entity); }
  selectedRule(window, ride) { return window?.sensor_rules?.find(g=>g.id===ride.sensor_rule); }
  coverStateText(item) {
    const state=item?.state || 'unavailable';
    const labels={open:'Geöffnet',closed:'Geschlossen',opening:'Öffnet',closing:'Schließt',unknown:'Unbekannt',unavailable:'Nicht verfügbar'};
    return this.language()==='en'?({open:'Open',closed:'Closed',opening:'Opening',closing:'Closing',unknown:'Unknown',unavailable:'Unavailable'}[state] || state):(labels[state] || state);
  }
  commandHistory() {
    const rows=this.data?.command_history || [];
    if(!rows.length)return `<p class="hint">${this.language()==='en'?'No movement commands recorded yet.':'Noch keine Fahrbefehle protokolliert.'}</p>`;
    return rows.map(row=>`<div class="command-history-row ${row.kind==='error'?'failed':''}"><strong>${esc(this.windowName(row.window))}</strong><span>${row.kind==='error'?(this.language()==='en'?'Failed':'Fehlgeschlagen'):(this.language()==='en'?'Completed':'Erfolgreich')}</span><small>${esc(this.fmt(row.time))} · ${esc(row.message)}</small></div>`).join('');
  }
  coverStateList() {
    return this.windows.map(w=>{
      const item=(this.data?.cover_states || []).find(x=>x.window===w.id) || {};
      const position=item.position!=null && Number.isFinite(Number(item.position))?`${this.language()==='en'?'Position':'Höhe'} ${Number(item.position)}%`:'';
      const tilt=this.isBlind(w)&&item.tilt!=null && Number.isFinite(Number(item.tilt))?`${this.language()==='en'?'Tilt':'Lamellen'} ${Number(item.tilt)}%`:'';
      const moving=item.moving?(this.language()==='en'?' · Moving':' · In Fahrt'):'';
      return `<div class="cover-status-row"><strong>${esc(w.name)}</strong><span>${esc(this.coverStateText(item))}${moving}</span><small>${esc([position,tilt].filter(Boolean).join(' · ') || (this.language()==='en'?'Position not reported':'Position nicht gemeldet'))}</small></div>`;
    }).join('') || `<p class="hint">${this.language()==='en'?'No covers added.':'Keine Rollläden oder Jalousien hinzugefügt.'}</p>`;
  }
  settingsList() {
    const {config:c,admin}=this.data;
    return `<section class="settings-group language-group"><h3>Sprache</h3><div class="language-picker"><button data-action="set-language" data-language="de" aria-pressed="${this.language()==='de'}" title="Deutsch">🇩🇪 <span>DE</span></button><button data-action="set-language" data-language="en" aria-pressed="${this.language()==='en'}" title="English">🇬🇧 <span>EN</span></button></div></section>
      <section class="settings-group"><div class="settings-row"><div><h3>Urlaubsmodus</h3><small>Markierte Programme im Urlaub aussetzen</small></div>${toggle('vacation',c.vacation,'Urlaubsmodus','',!admin)}</div></section>
      <section class="settings-group"><h3>Rollläden und Jalousien</h3>${this.windowList()}<h4>${this.language()==='en'?'Current status':'Aktueller Status'}</h4>${this.coverStateList()}</section>
      <section class="settings-group"><h3>${this.language()==='en'?'Recent movement commands':'Letzte Fahrbefehle'}</h3>${this.commandHistory()}</section>
      <section class="settings-group"><div class="settings-row"><h3>Sensoranzeigenamen</h3>${admin && this.usedSensors().length?`<button data-action="edit-sensor-names" class="edit-button" title="Bearbeiten" aria-label="Sensoranzeigenamen bearbeiten">${this.statusIcon('edit')}</button>`:''}</div>${this.usedSensors().length?this.usedSensors().map(entity=>`<div class="sensor-name-row"><span>${esc(this.sensorName(entity))}<small>${esc(entity)}</small></span></div>`).join(''):'<p class="hint">Noch keine Sensoren zugeordnet.</p>'}</section>
      ${admin?'<section class="settings-group"><h3>Sicherung</h3><div class="toolbar backup-actions"><button data-action="export">Sicherung erstellen</button><button data-action="import">Sicherung wiederherstellen</button></div><input type="file" id="import-file" accept="application/json,.json" hidden></section>':''}<p class="version-info">Oberfläche ${CARD_VERSION} · Integration ${esc(this.data.backend_version || 'Version nicht gemeldet')}</p>`;
  }
  pending() {
    const entries = Object.entries(this.data.pending).flatMap(([w,slots])=>Object.values(slots).map(s=>`<div><strong>${esc(this.windowName(w))}</strong> · ${esc(s.name)}<br><small>${esc(s.reason || (this.data.moving.includes(w)?'Wird ausgeführt':'Wartet auf Ausführung'))}</small></div>`));
    return entries.length ? `<section class="pending"><h3>Aktuelle Fahrten</h3>${entries.join('')}</section>` : '';
  }
  windowList() {
    const {admin} = this.data;
    return `<div class="toprow">${admin?'<button class="primary" data-action="select-covers">Rollläden hinzufügen</button>':''}</div>
      ${this.windows.map(w => `<section class="window"><div><h3>${esc(w.name)}</h3><small>${this.isBlind(w)?'Jalousie':'Rollladen'} · ${esc(w.cover)}</small><p>${w.contacts?.length ? w.contacts.map(c=>`${esc(this._hass.states[c.entity]?.attributes.friendly_name || c.entity)}: ${esc(POLICY[c.policy])}`).join('<br>') : 'Kein Öffnungskontakt'}${(w.sensor_rules || []).map(g=>`<br><strong>${esc(g.name)}</strong>: ${esc(this.gateSummary(g))} · Freigabe nach ${g.release_delay_seconds} s`).join('')}</p></div><div class="toolbar">${toggle('window',w.enabled,'',`data-target="${w.id}"`,!admin)}${admin?`<button data-action="edit-window" data-target="${w.id}" class="edit-button" title="Bearbeiten" aria-label="Bearbeiten">${this.statusIcon('edit')}</button>`:''}</div></section>`).join('') || '<div class="empty">Vorhandene Rollläden und Jalousien über „Rollläden hinzufügen“ auswählen. Die Anzeigenamen lassen sich anschließend unter Bearbeiten ändern.</div>'}`;
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
    const onceForm=this.onceFormOpen?`<div class="once-form"><label class="field"><span>Uhrzeit</span><input data-once="time" type="time" value="${esc(once.time)}"></label><label class="field"><span>Rollladen / Jalousie</span><select data-once="target"><option value="">Bitte auswählen</option>${this.windows.filter(w=>w.enabled).map(w=>`<option value="${esc(w.id)}" ${w.id===once.target?'selected':''}>${esc(w.name)}</option>`).join('')}</select></label><label class="field"><span>Höhe (%)</span><input data-once="position" type="number" min="0" max="100" value="${esc(once.position)}"></label>${onceWindow && this.isBlind(onceWindow)?`<label class="field"><span>Lamellen (%) · optional</span><input data-once="tilt" type="number" min="0" max="100" value="${esc(once.tilt)}" placeholder="unverändert"></label>`:''}<div class="toolbar end full"><button data-action="cancel-once-form">Abbrechen</button><button class="primary" data-action="add-once">Einzelfahrt einplanen</button></div></div>`:'';
    return `<div class="toprow planned-heading"><h3>${esc(date)}</h3><button data-action="open-once-form">+ Einzelfahrt</button></div>${onceForm}
      ${rows.map(row=>`<section class="planned-row ${row.skip?'skipped':''}" title="${esc([row.name,row.status==='contact_skipped'?'Ausgelassen':row.skip?'Einmal ausgelassen':labels[row.status] || row.status,this.plannedReason(row),row.carried?'Offen seit '+this.fmt(row.time):''].filter(Boolean).join(' · '))}">
        <time class="planned-time" datetime="${esc(row.time)}">${esc(new Date(row.time).toLocaleTimeString(this.locale(),{hour:'2-digit',minute:'2-digit',timeZone:this.data.time_zone || this._hass?.config?.time_zone}))}</time>
        <div class="planned-cover"><div class="planned-target"><strong>${esc(row.targets.map(t=>this.windowName(t)).join(', '))}</strong><span class="planned-position">${esc(this.targetsText(row))}</span></div></div>
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
  seasonEditor(path,value) {
    const season=value || this.defaultSeason();
    return `<div class="season-box full">${check(path+'.enabled',season.enabled,'Gültigkeitszeitraum')}${season.enabled?`<div class="season-dates">${field('Von (TT.MM.)',input(path+'.start',this.seasonDate(season.start || '04-01'),'text','inputmode="numeric" placeholder="01.04." maxlength="6"'))}${field('Bis (TT.MM.)',input(path+'.end',this.seasonDate(season.end || '10-31'),'text','inputmode="numeric" placeholder="31.10." maxlength="6"'))}</div>`:''}</div>`;
  }
  sensorProgramList() {
    const rows=this.data.sensor_programs || [];
    const date=this.data.planned_date?new Date(this.data.planned_date+'T12:00:00').toLocaleDateString(this.locale(),{weekday:'long',day:'2-digit',month:'2-digit'}):'Heute';
    return `<div class="toprow"><div><h3>${esc(date)}</h3><p class="hint">Für heute gültige Programme. Öffnungsvorrang bleibt bis zum Schließen bestehen.</p></div></div>
      ${rows.map(row=>`<section class="sensor-row ${row.paused?'sensor-paused':''}"><div class="sensor-summary"><strong>${esc(row.targets.map(t=>this.windowName(t)).join(', '))}</strong><small>${esc(row.name)} · ${row.sensor_mode==='opening'?'Öffnungsprogramm':row.source==='window'?'Direkte Beschattung':'Sensorprogramm'} · ${esc(this.seasonText(row.season))}</small><span class="plan-status">${row.paused?'Für heute ausgesetzt'+(row.sensor_mode==='opening' && row.triggered?' · Position bis zum Schließen geschützt':''):row.blocked_reason?esc(row.blocked_reason):row.triggered?(row.source==='window'?'Beschattung aktiv':'Sensorbedingung erfüllt'):'Bereit'}${row.paused?' · Automatisch wieder ab morgen, 00:00 Uhr':''}</span></div><div class="sensor-action"><button class="${row.paused?'':'primary'}" data-action="sensor-pause" data-rule="${esc(row.id)}" ${row.can_control?'':'disabled'}>${row.paused?'Heute wieder aktivieren':'Bis morgen aussetzen'}</button></div></section>`).join('') || '<div class="empty">Heute sind keine Sensorprogramme oder direkten Beschattungsregeln freigegeben. Wochentage und Saison werden berücksichtigt.</div>'}`;
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
      <div class="cover-list">${candidates.map(c=>`<label class="cover-option" data-cover-row="${esc(c.entity)}" ${this.coverVisible(c)?'':'hidden'}><input type="checkbox" data-import-cover="${esc(c.entity)}" ${c.existing || selected.has(c.entity)?'checked':''} ${c.existing || !c.supported?'disabled':''}><span><strong>${esc(c.existing?.name || c.name)}</strong><small>${esc(c.entity)}</small><small>${c.existing?'Bereits hinzugefügt':!c.supported?'Keine Positions- oder Lamellensteuerung':esc(c.type)}</small></span></label>`).join('') || '<p class="empty">Keine cover-Entitäten in Home Assistant vorhanden.</p>'}</div><p class="hint" data-import-empty ${candidates.some(c=>this.coverVisible(c))?'hidden':''}>Keine Treffer für diese Auswahl.</p></div>
      <footer><small><span data-import-count>${e.selected.length}</span> ausgewählt</small><div><button data-action="cancel">Abbrechen</button><button class="primary" data-action="import-covers" ${e.selected.length?'':'disabled'}>Hinzufügen</button></div></footer></section></div>`;
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
    const entities = Object.entries(this._hass.states).filter(([e,s])=>domains.some(d=>e.startsWith(d+'.')) && (!sensorType || this.sensorType(s,sensorType))).map(([e,s])=>[e,(s.attributes.friendly_name || e)+' · '+e]).sort((a,b)=>a[1].localeCompare(b[1]));
    if(value && !entities.some(([e])=>e===value)) entities.unshift([value,value+(this._hass.states[value]?' (bereits zugewiesen)':' (nicht verfügbar)')]);
    return `<select data-key="${esc(key)}">${options([['','Bitte wählen'],...entities],value)}</select>`;
  }
  sensorType(state, type) {
    const a=state.attributes || {},unit=a.unit_of_measurement;
    return type==='temp'?a.device_class==='temperature' || ['°C','C','°F','K'].includes(unit):a.device_class==='illuminance' || ['lx','klx'].includes(unit);
  }
  ruleEditor(g,i) {
    const k='sensor_rules.'+i+'.';
    return `<section class="subpanel grid sensor-rule-editor">${field('Name der Sensorregel',input(k+'name',g.name))}<div class="toolbar end"><button class="danger" data-action="delete-rule" data-index="${i}">Regel entfernen</button></div>
      ${field('Temperatur (optional)',this.entitySelect(k+'temp_entity',g.temp_entity,['sensor'],'temp'))}${field('Helligkeit (optional)',this.entitySelect(k+'lux_entity',g.lux_entity,['sensor'],'lux'))}
      ${g.temp_entity?field('Aktiv ab Temperatur (°C)',input(k+'temp_on',g.temp_on,'number','step="0.5"'))+field('Freigabe ab / unter Temperatur (°C)',input(k+'temp_off',g.temp_off,'number','step="0.5"')):''}
      ${g.lux_entity?field('Aktiv ab Helligkeit (lx)',input(k+'lux_on',g.lux_on,'number','min="0"'))+field('Freigabe ab / unter Helligkeit (lx)',input(k+'lux_off',g.lux_off,'number','min="0"')):''}
      ${g.temp_entity && g.lux_entity?'<span class="hint full">Temperatur und Helligkeit</span>':''}
      ${field('Freigabeverzögerung (Sekunden)',input(k+'release_delay_seconds',g.release_delay_seconds,'number','min="0" max="86400" step="1"'))}
    </section>`;
  }
  policySelect(key, value) { return `<select data-key="${key}">${options(Object.entries(POLICY),value)}</select>`; }
  editorHtml() {
    const e = this.editor;
    if(e.type==='program' && e.transfer)return this.transferHtml();
    if(e.type==='covers') return this.coverImportHtml();
    if(e.type==='sensor-names')return `<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-label="Sensoranzeigenamen bearbeiten"><div class="modal-head"><h3>Sensoranzeigenamen</h3><button data-action="cancel" aria-label="Schließen">✕</button></div><div class="modal-body"><p class="hint">Leer lassen, um den Namen aus Home Assistant zu verwenden.</p>${e.entities.map((entity,i)=>`<label class="field sensor-name-field"><span>${esc(entity)}</span>${input('names.'+i,e.item.names[i],'text',`maxlength="120" placeholder="${esc(this._hass.states[entity]?.attributes.friendly_name || entity)}"`)}</label>`).join('')}</div><footer>${this.error?`<p class="modal-save-error" role="alert">${esc(this.error)}</p>`:''}<span></span><div><button data-action="cancel">Abbrechen</button><button class="primary" data-action="save-sensor-names">Speichern</button></div></footer></section></div>`;
    const item = e.item;
    let content;
    if (e.type === 'window') {
      item.sensor_rules ||= [];
      content = `<div class="grid">${field('Anzeigename im Planer',input('name',item.name))}${field('Rollladen / Jalousie',this.entitySelect('cover',item.cover,['cover']))}${field('Typ',`<select data-key="cover_type">${options([['auto','Automatisch erkennen'],['shutter','Rollladen'],['blind','Jalousie']],item.cover_type || 'auto')}</select>`)}${check('enabled',item.enabled,'Fenster aktiv')}</div>
        <h4>Öffnungskontakte</h4><p class="hint">Bei mehreren Kontakten genügt ein offener Kontakt zum Sperren. „Nicht fahren“ hat Vorrang vor „Nachholen“.</p>
        ${item.contacts.map((c,i)=>`<div class="subpanel grid">${field('Kontakt',this.entitySelect(`contacts.${i}.entity`,c.entity,['binary_sensor','sensor','input_boolean']))}${field('Zustand bei offenem Fenster',input(`contacts.${i}.open_state`,c.open_state))}${field('Wenn offen',this.policySelect(`contacts.${i}.policy`,c.policy))}<button data-action="delete-contact" data-index="${i}">Kontakt entfernen</button></div>`).join('')}
        <button data-action="add-contact">+ Kontakt</button>
        <h4>Sensorregeln</h4>${item.sensor_rules.map((g,i)=>this.ruleEditor(g,i)).join('')}<button data-action="add-rule">+ Sensorregel</button>`;
    } else {
      content = `<div class="grid">${field('Name',input('name',item.name))}${field('Programmtyp',`<select data-key="kind" ${e.transferOperations?.length?'disabled':''}>${options([['time','Zeitprogramm'],['sensor','Sensorprogramm']],item.kind)}</select>`)}${check('enabled',item.enabled,'Programm aktiv')}${check('pause_in_vacation',item.pause_in_vacation,'Im Urlaub aussetzen')}</div>
        <h4>Wochentage</h4><div class="days">${DAYS.map((day,i)=>`<label><input type="checkbox" data-day="${i}" ${item.days.includes(i)?'checked':''}><span>${day}</span></label>`).join('')}</div>
        ${item.kind==='sensor'?this.seasonEditor('season',item.season):''}
        ${item.kind==='sensor'?`<div class="grid">${field('Sensorprogramm-Art',`<select data-key="sensor_mode" ${e.transferOperations?.length?'disabled':''}>${options([['climate','Temperatur / Helligkeit'],['opening','Öffnungskontakt']],item.sensor_mode || 'climate')}</select>`,'full')}${this.isOpening(item)?field('Von',input('opening_start',item.opening_start || '00:00','time'))+field('Bis',input('opening_end',item.opening_end || '23:59','time')):''}</div>`+check('start_on_high',item.start_on_high || false,this.isOpening(item)?'Bei bereits geöffnetem Fenster starten':'Bei bereits erfüllter Bedingung starten'):''}
        ${e.transferOperations?.length?`<div class="transfer-notice" role="status">${e.transferOperations.length} ${e.transferOperations.length===1?'Übernahme':'Übernahmen'} vorgemerkt – mit Speichern übernehmen.<button data-action="undo-transfer">Letzte Übernahme rückgängig</button></div>`:''}
        <div class="rides-heading"><h4>Fahrten</h4>${item.rides.length?`<div class="toolbar"><button data-action="expand-rides">Alle aufklappen</button><button data-action="collapse-rides">Alle zuklappen</button></div>`:''}</div>${item.rides.map((r,i)=>this.rideEditor(r,i,item.kind)).join('')}<button data-action="add-ride">+ Fahrt hinzufügen</button>`;
    }
    return `<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-label="${e.type==='window'?'Fenster':'Programm'} bearbeiten"><div class="modal-head"><h3>${e.type==='window'?'Fenster':'Programm'} bearbeiten</h3><button data-action="cancel" aria-label="Schließen">✕</button></div><div class="modal-body">${content}</div><footer>${this.error?`<p class="modal-save-error" role="alert">${esc(this.error)}</p>`:''}${!e.isNew?'<button class="danger" data-action="delete-item">Löschen</button>':'<span></span>'}<div><button data-action="cancel">Abbrechen</button><button class="primary" data-action="save-editor">Speichern</button></div></footer></section></div>`;
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
    return `<div class="subpanel ride-editor" data-ride-index="${i}" data-ride-id="${esc(r.id)}"><div class="ride-editor-head"><button type="button" class="ride-fold" data-action="fold-ride" data-index="${i}" aria-expanded="${expanded}" aria-controls="ride-body-${i}"><svg class="chevron ${expanded?'expanded':''}" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg><span class="ride-fold-text"><strong data-ride-title>${esc(window?.name || 'Neue Fahrt')}</strong><span data-ride-summary>${esc(this.rideSummary(r,kind))}</span></span></button><div class="toolbar ride-editor-actions">${check(k+'enabled',r.enabled,'Aktiv')}<button class="danger ride-icon" data-action="delete-ride" data-index="${i}" aria-label="Entfernen" title="Entfernen">${this.statusIcon('trash')}</button><button class="ride-icon" data-action="prepare-transfer" data-mode="move" data-index="${i}" aria-label="Verschieben" title="Verschieben" ${this.transferTargets('move').length && window?'':'disabled'}>${this.statusIcon('move')}</button><button class="ride-icon" data-action="prepare-transfer" data-mode="copy" data-index="${i}" aria-label="Kopieren" title="Kopieren" ${this.transferTargets('copy').length && window?'':'disabled'}>${this.statusIcon('copy')}</button></div></div><div id="ride-body-${i}" class="ride-editor-body grid" ${expanded?'':'hidden'}>${field('Rollladen / Jalousie',`<select data-ride-target="${i}" aria-label="Rollladen / Jalousie"><option value="">Bitte auswählen</option>${choices}</select>`,'full')}
      ${kind==='sensor' && !opening && window?field('Sensorregel',`<select data-key="${k}sensor_rule"><option value="">Bitte auswählen</option>${options((window.sensor_rules || []).map(g=>[g.id,g.name]),r.sensor_rule)}</select>`,'full'):''}
      ${kind==='time' ? '<div class="timing-grid full">'+field('Auslöser',`<select data-key="${k}event">${options([['fixed','Uhrzeit'],['sunrise','Sonnenaufgang'],['sunset','Sonnenuntergang']],r.event)}</select>`)+
        (r.event==='fixed'?field('Uhrzeit',input(k+'time',r.time,'time')):field('Versatz (Min.)',input(k+'offset',r.offset,'number','min="-720" max="720" title="Negative Werte = vor dem Sonnenereignis"')))+
        field('Frühestens',input(k+'earliest',r.earliest,'time'))+field('Spätestens',input(k+'latest',r.latest,'time'))+'</div>' : opening?'<p class="hint full">Beim Öffnen eines zugeordneten Kontakts. Position bleibt bis zum Schließen geschützt.</p>':field('Auslösen, wenn',`<select data-key="${k}edge">${options([['active',this.sensorTriggerText(rule)],['inactive','Wieder freigegeben']],r.edge)}</select>`,'full')}
      ${kind==='sensor' && !candidates.length?`<p class="hint full">${opening?'Keine Geräte mit zugewiesenem Öffnungskontakt.':'Keine Geräte mit hinterlegtem Temperatur- oder Helligkeitssensor.'} Sensoren in den Einstellungen zuweisen.</p>`:''}
      ${kind==='sensor' && !opening && r.edge==='inactive'?check(k+'restore_schedule',r.restore_schedule || false,'Aktuelle Zeitplanposition übernehmen'):''}
      ${window && !r.restore_schedule ? this.positionSlider(k+'position',r.position,'Höhe',opening)+(this.isBlind(window)?this.positionSlider(k+'tilt',r.tilt,'Lamellen'):'') : !window?'<p class="hint full">Einen Rollladen oder eine Jalousie auswählen.</p>':''}

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
    return `<div class="overlay"><section class="modal transfer-modal" role="dialog" aria-modal="true" aria-label="Fahrt ${copy?'kopieren':'verschieben'}"><div class="modal-head"><h3>Fahrt ${copy?'kopieren':'verschieben'}</h3><button data-action="cancel-transfer" aria-label="Schließen">✕</button></div><div class="modal-body">${field('Zielprogramm',`<select data-transfer-target aria-label="Zielprogramm">${options(this.transferTargets().map(p=>[p.id,p.name+(p.id===this.editor.item.id?' (dieses Programm)':'')]),transfer.target)}</select>`)}</div><footer>${this.error?`<p class="modal-save-error" role="alert">${esc(this.error)}</p>`:''}<span></span><div><button data-action="cancel-transfer" aria-label="Übernahme abbrechen">Abbrechen</button><button class="primary" data-action="confirm-transfer">${copy?'Kopieren':'Verschieben'}</button></div></footer></section></div>`;
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
  newRule() { return {id:uid(),name:'Neue Sensorregel',lux_entity:'',temp_entity:'',lux_on:30000,lux_off:20000,temp_on:25,temp_off:23,release_delay_seconds:300}; }
  onInput(event) {
    const el = event.target;
    if(el.dataset.once) {
      this.onceForm ||= {time:'',target:'',position:'100',tilt:''};
      this.onceForm[el.dataset.once]=el.value;
      return;
    }
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
    if(this.editor.type==='covers') {
      if(el.hasAttribute('data-import-other')) this.editor.showOther=el.checked;
      if(el.dataset.importCover) {
        const selected=new Set(this.editor.selected);
        el.checked?selected.add(el.dataset.importCover):selected.delete(el.dataset.importCover);
        this.editor.selected=[...selected];
      }
      this.updateCoverSelection();return;
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
    if(key.endsWith('.edge') && value==='active')this.editor.item.rides[Number(key.split('.')[1])].restore_schedule=false;
    if(key==='kind' || key==='sensor_mode' || key==='season.enabled' || key==='cover' || key==='cover_type' || /\.(temp_entity|lux_entity|sensor_rule|edge|restore_schedule|event)$/.test(key))this.render();
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
    if(a==='refresh') {await this.refresh();return;}
    if(a==='toggle-overview') {
      this.showOverview=!this.overviewVisible();
      try{localStorage.setItem(this.foldKey()+':overview',this.showOverview?'visible':'hidden');}catch{}
      button.setAttribute('aria-expanded',String(this.showOverview));
      button.querySelector('.chevron').classList.toggle('expanded',this.showOverview);
      this.shadowRoot.querySelector('.overview').hidden=!this.showOverview;return;
    }
    if(a==='edit-sensor-names') {
      if(!this.data.admin)return;
      const entities=this.usedSensors();
      this.editor={type:'sensor-names',entities,revision:this.data.revision,item:{names:entities.map(entity=>this.data.config.sensor_names?.[entity] || '')}};
      this.error='';this.focusEditor=true;this.render();return;
    }
    if(a==='save-sensor-names') {
      if(this.editor?.type!=='sensor-names' || !this.data.admin)return;
      const config=clone(this.data.config);config.sensor_names ||= {};
      this.editor.entities.forEach((entity,i)=>{const name=this.editor.item.names[i].trim();if(name)config.sensor_names[entity]=name;else delete config.sensor_names[entity];});
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
    else if(a==='add-rule')this.editor.item.sensor_rules.push(this.newRule());
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
        else if(g.temp_entity && (!Number.isFinite(g.temp_on) || !Number.isFinite(g.temp_off) || g.temp_off>=g.temp_on))message='Die Temperatur für die Freigabe muss unter der Aktivierungstemperatur liegen.';
        else if(g.lux_entity && (!Number.isFinite(g.lux_on) || !Number.isFinite(g.lux_off) || g.lux_off>=g.lux_on))message='Die Helligkeit für die Freigabe muss unter der Aktivierungshelligkeit liegen.';
        else if(!Number.isFinite(g.release_delay_seconds) || g.release_delay_seconds<0 || g.release_delay_seconds>86400)message='Freigabeverzögerung zwischen 0 und 86400 Sekunden eintragen.';
        if(message){this.error='„'+name+'“: '+message;this.render();return;}
      }
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
      if(ride.position==null && ride.tilt==null && !ride.restore_schedule) {this.error='Für jede Fahrt mindestens eine Position festlegen. Reine Lamellenfahrten benötigen den Typ Jalousie.';this.render();return;}
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
  css() { return `
    :host{display:block;color:var(--primary-text-color,#212121);font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif);font-size:14px}
    *{box-sizing:border-box}ha-card{display:block;background:var(--ha-card-background,var(--card-background-color,#fff));border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color,#e0e0e0));border-radius:var(--ha-card-border-radius,12px);box-shadow:var(--ha-card-box-shadow,none);overflow:hidden}
    h3,h4,p{margin:0}h3{font-size:16px;font-weight:500}h4{margin:20px 0 12px;font-size:14px;font-weight:500}small,.hint{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#727272)}
    button,input,select{font:inherit}button{color:var(--primary-color,#03a9f4);border:0;background:transparent;border-radius:var(--ha-button-border-radius,20px);padding:9px 14px;cursor:pointer;line-height:1.35;font-weight:500}button:hover{background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,transparent)}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:2px}button:disabled{opacity:.45;cursor:default}button.primary{background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff)}button.danger{color:var(--error-color,#db4437)}
    .card-top{display:flex;align-items:stretch;border-bottom:1px solid var(--divider-color,#e0e0e0);min-height:52px}nav{display:flex;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;padding:0 8px}nav::-webkit-scrollbar{display:none}nav button{flex-shrink:0;border-radius:0;border-bottom:2px solid transparent;color:var(--secondary-text-color,#727272);padding:16px 14px;white-space:nowrap;font-size:14px}nav button.selected{border-bottom-color:var(--primary-color,#03a9f4);color:var(--primary-color,#03a9f4)}.settings-button{width:48px;flex-shrink:0;display:grid;place-items:center;padding:12px;border-radius:0;color:var(--secondary-text-color,#727272)}.settings-button.selected{color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,transparent)}.settings-button svg{width:24px;height:24px;fill:currentColor}
    main{padding:8px 16px 16px}.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.page-actions{display:flex;justify-content:flex-end;padding:4px 0}.page-actions button{font-size:13px}.toprow{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:12px 0}.toprow:empty{display:none}.toprow .hint{margin-top:6px}.toprow>span{font-size:12px;color:var(--secondary-text-color,#727272)}
    .program-group{border-bottom:1px solid var(--divider-color,#e0e0e0)}.program-group-head{display:flex;width:100%;align-items:center;gap:8px;padding:12px 0;color:var(--primary-text-color,#212121);text-align:left;border-radius:4px}.program-group-head strong{font-size:15px;font-weight:500}.program-group-head>span:last-child{margin-left:auto;color:var(--secondary-text-color,#727272);font-size:12px}.program-group .program:last-child{border-bottom:0}.program,.window,.planned-row,.sensor-row{padding:16px 0;border-bottom:1px solid var(--divider-color,#e0e0e0)}.window,.planned-row,.sensor-row{border-bottom:1px solid var(--divider-color,#e0e0e0)}.program-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.program-heading{flex:1;min-width:0}.program-title{display:flex;align-items:center;gap:8px;padding:0;color:var(--primary-text-color,#212121);font-size:16px;text-align:left}.program-title span{overflow-wrap:anywhere}.chevron{width:20px;height:20px;flex-shrink:0;transform:rotate(-90deg);transition:transform .15s}.chevron.expanded{transform:rotate(0)}.chevron path{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.tags{display:flex;flex-wrap:wrap;gap:4px 10px;margin:6px 0 0 28px}.tags span{font-size:12px;color:var(--secondary-text-color,#727272)}.program-order{display:flex;gap:0}.program-order button{width:30px;height:34px;padding:4px;color:var(--secondary-text-color,#727272);font-size:18px;line-height:1}
    .toggle{display:inline-flex;align-items:center;gap:9px;padding:6px 0;color:var(--primary-text-color,#212121);font-size:12px;font-weight:400;white-space:nowrap;min-height:40px}.toggle:hover{background:transparent}.switch-track{display:inline-flex;align-items:center;width:36px;height:20px;border-radius:12px;background:var(--switch-unchecked-track-color,#9e9e9e);padding:2px;flex-shrink:0}.switch-thumb{display:block;width:16px;height:16px;border-radius:50%;background:var(--switch-unchecked-button-color,#fff);box-shadow:0 1px 3px #0003;transition:transform .15s}.toggle.on .switch-track{background:color-mix(in srgb,var(--primary-color,#03a9f4) 50%,transparent)}.toggle.on .switch-thumb{transform:translateX(16px);background:var(--primary-color,#03a9f4)}
    .ride{display:flex;justify-content:space-between;gap:16px;padding:14px 0;margin-left:28px;border-top:1px solid var(--divider-color,#e0e0e0)}.program-head+.ride{margin-top:14px}.ride-info{display:flex;flex-direction:column;gap:5px;min-width:0;overflow-wrap:anywhere}.ride-info strong{font-size:14px;font-weight:500}.ride-info>span{font-size:13px}.ride-actions{align-self:center}.muted>.program-head,.muted>.ride-info{opacity:.55}.window{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.window h3{font-size:15px}.window small{overflow-wrap:anywhere}.window p{font-size:12px;line-height:1.6;margin-top:8px}.settings-group{padding:16px 0;border-bottom:1px solid var(--divider-color,#e0e0e0)}.language-picker{display:flex;gap:8px}.language-picker button{min-width:70px;border:1px solid var(--divider-color,#e0e0e0);color:var(--primary-text-color,#212121);border-radius:var(--ha-button-border-radius,20px)}.language-picker button[aria-pressed="true"]{border-color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 12%,transparent);color:var(--primary-color,#03a9f4)}.language-picker button span{font-size:12px;font-weight:600}.settings-group:last-child{border-bottom:0}.settings-row{display:flex;align-items:center;justify-content:space-between;gap:16px}.settings-row small{display:block;margin-top:5px}.settings-row .toggle>span:last-child{display:none}.backup-actions{margin-top:12px}.cover-status-row,.command-history-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 12px;padding:10px 0;border-bottom:1px solid var(--divider-color,#e0e0e0)}.cover-status-row small,.command-history-row small{grid-column:1/-1;color:var(--secondary-text-color,#727272);overflow-wrap:anywhere}.cover-status-row span,.command-history-row span{font-size:13px}.command-history-row.failed span{color:var(--error-color,#db4437)}.command-history-row:last-child,.cover-status-row:last-child{border-bottom:0}
    .planned-heading{margin:10px 0 6px}.planned-heading h3{font-size:14px}.once-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px;padding:10px 0 14px;border-bottom:1px solid var(--divider-color,#e0e0e0)}.once-form .field{font-size:12px}.once-form input,.once-form select{font-size:13px}.planned-row{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:3px 10px;align-items:center;padding:9px 0}.planned-time{font-size:14px;font-variant-numeric:tabular-nums;line-height:1.4}.planned-cover{display:flex;flex-direction:column;gap:3px;min-width:0;overflow-wrap:anywhere}.planned-target{display:flex;align-items:baseline;gap:6px 14px;flex-wrap:wrap;min-width:0}.planned-reason{grid-column:2 / -1}.planned-reason,.planned-done{font-size:12px;color:var(--secondary-text-color,#727272);line-height:1.4}.planned-cover strong{font-size:13px;font-weight:500}.planned-position{font-size:12px;color:var(--secondary-text-color,#727272);font-variant-numeric:tabular-nums}.planned-action button{font-size:12px;padding:7px 10px;min-height:36px}.skipped .planned-cover{opacity:.6}.planned-time small{display:block;font-size:11px}.planned-action,.sensor-action{align-self:center}.planned-action button,.sensor-action button{font-size:13px}.plan-status{color:var(--primary-color,#03a9f4);font-size:12px}.skipped .ride-info{opacity:.6}.skipped strong{text-decoration:line-through}.sensor-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 10px;padding:9px 0}.sensor-summary{display:flex;flex-direction:column;gap:3px;min-width:0;overflow-wrap:anywhere}.sensor-summary strong{font-size:13px;font-weight:500}.sensor-summary small{font-size:12px;color:var(--secondary-text-color,#727272)}.sensor-paused .sensor-summary{opacity:.6}.empty{padding:24px 0;color:var(--secondary-text-color,#727272);line-height:1.6}.error,.error-text{color:var(--error-color,#db4437)}.error{padding:12px 16px;background:color-mix(in srgb,var(--error-color,#db4437) 8%,transparent)}
    .overlay{position:fixed;inset:0;background:#0006;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px}.modal{display:flex;flex-direction:column;width:800px;max-width:100%;max-height:90vh;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#212121);border-radius:var(--ha-dialog-border-radius,12px);box-shadow:0 8px 32px #0004}.modal-head,footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 24px;flex-shrink:0}.modal-head{border-bottom:1px solid var(--divider-color,#e0e0e0)}.modal-head h3{font-size:20px;font-weight:400}.modal-head button{font-size:22px;padding:4px 10px;color:var(--secondary-text-color,#727272)}.modal-body{padding:20px 24px;overflow-y:auto}footer{border-top:1px solid var(--divider-color,#e0e0e0)}footer>div{display:flex;gap:8px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.full{grid-column:1/-1}.field{display:flex;flex-direction:column;gap:6px;min-width:0;font-size:12px}.field>span,.field-label{color:var(--secondary-text-color,#727272)}input:not([type=checkbox]):not([type=range]),select{width:100%;min-width:0;border:1px solid var(--divider-color,#bdbdbd);border-radius:4px;padding:11px 10px;color:var(--primary-text-color,#212121);background:var(--input-fill-color,var(--secondary-background-color,#f5f5f5))}.check{display:flex;align-items:center;gap:8px;font-size:13px;min-height:32px}input[type=checkbox]{width:18px;height:18px;flex-shrink:0;margin:0;accent-color:var(--primary-color,#03a9f4)}.subpanel{border:1px solid var(--divider-color,#e0e0e0);border-radius:8px;padding:16px;margin:12px 0;background:transparent}.end{justify-content:flex-end}.days{display:flex;flex-wrap:wrap;gap:6px}.days label{position:relative;cursor:pointer}.days input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}.days span{pointer-events:none}.days span{display:block;padding:8px 11px;border:1px solid var(--divider-color,#e0e0e0);border-radius:16px;font-size:12px}.days input:checked+span{color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 12%,transparent);border-color:transparent}.days input:focus-visible+span{outline:2px solid var(--primary-color,#03a9f4)}
    .timing-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.timing-grid .field>span{white-space:nowrap}.timing-grid input,.timing-grid select{font-size:12px;padding:10px 7px}.season-box{padding:8px 0}.season-dates{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:360px;margin:10px 0}.position-control{min-width:0;padding:6px 0}.slider-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px;font-size:13px}.slider-head label{color:var(--secondary-text-color,#727272)}.slider-head output{font-size:14px;font-weight:500;font-variant-numeric:tabular-nums}.position-control input[type=range]{appearance:none;-webkit-appearance:none;width:100%;display:block;height:4px;border:0;padding:0;margin:16px 0;border-radius:2px;cursor:pointer;accent-color:var(--primary-color,#03a9f4);background:linear-gradient(to right,var(--primary-color,#03a9f4) 0,var(--primary-color,#03a9f4) var(--range-percent),var(--divider-color,#ddd) var(--range-percent),var(--divider-color,#ddd) 100%)}.position-control input[type=range]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--primary-color,#03a9f4)}.position-control input[type=range]::-moz-range-thumb{width:16px;height:16px;border:0;border-radius:50%;background:var(--primary-color,#03a9f4)}.slider-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--secondary-text-color,#727272);font-size:11px}.keep-value{font-size:11px;padding:4px 8px}.keep-value.selected{background:color-mix(in srgb,var(--primary-color,#03a9f4) 12%,transparent)}
    .howto{line-height:1.6;font-size:14px;padding:12px 0}.howto h2{font-size:20px;font-weight:400;margin:0 0 14px}.howto h3{font-size:16px;margin:24px 0 10px}.howto p{margin:10px 0}.howto ul,.howto ol{padding-left:22px;margin:10px 0}.howto li{margin:8px 0}.howto-table{overflow-x:auto;margin:12px 0}.howto table{width:100%;border-collapse:collapse;font-size:13px}.howto th,.howto td{padding:10px 8px;border-bottom:1px solid var(--divider-color,#e0e0e0);text-align:left;vertical-align:top}.howto th:first-child,.howto td:first-child{width:28%}
    .rides-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:20px}.rides-heading h4{margin:0}.rides-heading .toolbar{gap:0}.rides-heading button{font-size:12px;padding:8px 10px}.ride-editor-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.ride-fold{display:flex;align-items:center;gap:8px;flex:1;min-width:0;padding:4px 0;text-align:left;color:var(--primary-text-color,#212121);border-radius:4px}.ride-fold-text{display:flex;flex-direction:column;gap:5px;min-width:0;overflow-wrap:anywhere}.ride-fold-text strong{font-size:14px;font-weight:500}.ride-fold-text>span{font-size:12px;font-weight:400;line-height:1.5;color:var(--secondary-text-color,#727272)}.ride-editor-actions{flex-shrink:0;gap:8px}.ride-editor-actions button{font-size:12px;padding:8px 10px}.ride-editor-actions .ride-icon{display:inline-flex;align-items:center;justify-content:center;min-width:36px;min-height:36px;padding:8px}.ride-icon .status-icon{width:20px;height:20px}.ride-editor-body{margin-top:16px;padding-top:16px;border-top:1px solid var(--divider-color,#e0e0e0)}
    @media(max-width:600px){.ride-editor-head{align-items:flex-start;flex-wrap:wrap;gap:8px}.ride-fold{flex-basis:100%}.ride-editor-actions{margin-left:28px;justify-content:flex-end;flex:1}.rides-heading .toolbar{margin-left:auto}.rides-heading button{padding:8px}.ride-editor-body{margin-top:12px;padding-top:12px}}
    .edit-button{display:inline-flex;align-items:center;justify-content:center;min-width:40px;min-height:40px;padding:8px}.edit-button .status-icon{width:20px;height:20px}.transfer-modal{width:440px}.transfer-modal .modal-body{padding-top:20px;padding-bottom:24px}.transfer-notice{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:10px 0;color:var(--secondary-text-color,#727272);font-size:12px}.transfer-notice button{font-size:12px;padding:6px 8px}
    .modal footer{flex-wrap:wrap}.modal-save-error{flex-basis:100%;width:100%;color:var(--error-color,#db4437);font-size:13px;line-height:1.5;margin:0 0 4px}
    .overview-panel{border-bottom:1px solid var(--divider-color,#e0e0e0)}.overview-toggle{display:flex;align-items:center;gap:6px;padding:10px 16px;color:var(--secondary-text-color,#727272);font-size:12px;border-radius:0}.overview{padding:0 16px 14px}.sun-row{display:flex;align-items:center;gap:28px;padding:4px 0 12px}.sun-value{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-variant-numeric:tabular-nums}.status-icon{width:21px;height:21px;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.sun-value .status-icon{color:var(--primary-color,#03a9f4)}.overview-group+ .overview-group{margin-top:14px}.overview-group h4{font-size:11px;font-weight:500;color:var(--secondary-text-color,#727272);margin:0 0 8px}.sensor-grid{display:flex;flex-wrap:wrap;align-items:center;gap:9px 24px}.sensor-value{display:inline-flex;flex:0 1 auto;max-width:100%;align-items:center;justify-content:flex-start;gap:8px;min-width:0;font-size:13px;line-height:1.5}.sensor-label{min-width:0;overflow-wrap:anywhere}.sensor-state{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;font-variant-numeric:tabular-nums}.sensor-state .status-icon{width:18px;height:18px;color:var(--secondary-text-color,#727272)}.visually-hidden{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.sensor-name-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--divider-color,#e0e0e0);font-size:13px}.sensor-name-row:last-child{border-bottom:0}.sensor-name-row>span{min-width:0;overflow-wrap:anywhere}.sensor-name-row small{display:block;margin-top:4px}.sensor-name-row>span:last-child{flex-shrink:0}.sensor-name-field{margin-top:16px}
    .version-info{font-size:11px;color:var(--secondary-text-color,#727272);padding-top:16px;overflow-wrap:anywhere}
    .cover-option{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--divider-color,#e0e0e0);cursor:pointer}.cover-option>span{min-width:0;display:flex;flex-direction:column;gap:4px;overflow-wrap:anywhere}.cover-option strong{font-size:14px;font-weight:500}.cover-option:has(input:disabled){opacity:.6;cursor:default}.import-search{margin:16px 0 12px}.import-toolbar{margin:12px 0}.cover-list{margin-top:8px}[hidden]{display:none!important}
    @media(max-width:600px){.card-top{min-height:48px}nav{padding:0 4px}nav button{padding:14px 8px;font-size:13px}.settings-button{width:42px;padding:9px}main{padding:4px 12px 12px}.program-head{align-items:flex-start;flex-direction:column;gap:8px}.program-head>.toolbar{padding-left:28px;gap:16px}.program-title{font-size:15px}.window{flex-direction:column;gap:8px}.ride{gap:10px}.ride-actions .toggle{font-size:11px;gap:6px}.planned-row{grid-template-columns:40px minmax(0,1fr) auto;gap:3px 8px}.planned-target{flex-direction:column;align-items:flex-start;gap:2px}.planned-time{font-size:13px}.planned-action button{padding:7px 9px;max-width:100px}.sensor-row{grid-template-columns:minmax(0,1fr);gap:10px}.settings-row .toggle{flex-shrink:0}.overlay{padding:8px}.modal{max-height:96vh}.modal-head,footer{padding:12px 16px}.modal-head h3{font-size:18px}.modal-body{padding:16px}.grid{grid-template-columns:minmax(0,1fr)}.full{grid-column:auto}.timing-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.subpanel{padding:12px}.toprow{align-items:flex-start}.toprow button{white-space:nowrap}.days{gap:5px}.days span{padding:8px 10px}}
    @media(max-width:380px){.timing-grid{grid-template-columns:minmax(0,1fr)}}
  `; }
}
if(!customElements.get('shutter-manager-card')) customElements.define('shutter-manager-card', ShutterManagerCard);
if(!customElements.get('rollladenplaner-card')) customElements.define('rollladenplaner-card', class extends ShutterManagerCard {});
window.customCards = window.customCards || [];
if(!window.customCards.some(c=>c.type==='shutter-manager-card')) window.customCards.push({type:'shutter-manager-card', name:'Shutter Manager', description:'Schedules and sensor rules for shutters and blinds', preview:false});
if(!window.customCards.some(c=>c.type==='rollladenplaner-card')) window.customCards.push({type:'rollladenplaner-card', name:'Shutter Manager (legacy card type)', description:'Legacy card type retained for existing dashboards', preview:false});
