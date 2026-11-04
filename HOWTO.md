# Shutter Manager Guide / Anleitung 1.2.9

## Deutsch

Der Shutter Manager verbindet Zeitprogramme, Temperatur-/Helligkeitsbeschattung und Öffnungsprogramme mit Fensterkontakten. Einstellungen definieren Geräte und benannte Sensorregeln. Programme bestimmen, wann diese Regeln gelten und welche Fahrten sie auslösen. Eine Sensorregel allein fährt keinen Rollladen.

## Schnellstart

1. **Einstellungen ⚙ → Rollläden auswählen:** Vorhandene Rollläden und Jalousien übernehmen. Anzeigenamen und Gerätetyp lassen sich im Planer ändern.
2. **Gerät bearbeiten → Sensorregeln → + Sensorregel:** Einen Namen vergeben, beispielsweise „Sommer“ oder „Winter“. Temperatur, Helligkeit oder beide Sensoren auswählen, Schwellenwerte und Freigabeverzögerung festlegen. Mehrere Regeln am selben Fenster sind möglich.
3. **Programme → + Programm → Sensorprogramm:** Wochentage und Gültigkeitszeitraum einstellen. Eine Fahrt hinzufügen und Gerät sowie benannte Sensorregel auswählen. Es erscheinen nur Geräte mit hinterlegten Regeln.
4. **Fahrziel pflegen:** Für „Sensorbedingung erreicht“ Höhe und gegebenenfalls Lamellen einstellen. Bei Bedarf eine zweite Fahrt „Wieder freigegeben“ anlegen. Hier lässt sich eine feste Position oder „Aktuelle Zeitplanposition übernehmen“ wählen.
5. **Programm aktivieren:** „Bei bereits erfüllter Bedingung starten“ bestimmt, ob bereits hohe Messwerte bei Start oder Neustart auslösen dürfen. Ohne diese Option wird zunächst ein Ausgangszustand eingelesen.
6. **Zeitprogramm / Sensorprogramme:** Eine konkrete Fahrt einmalig auslassen oder ein Sensorprogramm bis zur nächsten Mitternacht pausieren.

## Oberfläche

| Bereich | Funktion |
|---|---|
| **Programme** | Zeit- und Sensorprogramme erstellen, bearbeiten, einzeln schalten, sortieren und zuklappen. Die beiden Programmgruppen sind unabhängig klappbar. Programme starten zugeklappt; Gruppen starten aufgeklappt. Einzelne Fahrten dauerhaft deaktivieren. |
| **Zeitprogramm** | Zukünftige Fahrten für heute und noch offene Aufträge anzeigen, ergänzt um wartende Sensorfahrten und ältere Nachholaufträge. Erledigte und verworfene Fahrten sind nicht enthalten. Eine konkrete Fahrt einmalig auslassen oder eine zukünftige Auslassung zurücknehmen. Ausgelöste Sensorfahrten erscheinen, solange sie offen sind. |
| **Sensorprogramme** | Heute freigegebene Programme anzeigen und bis Mitternacht aussetzen oder wieder aktivieren. |
| **Howto ?** | Diese Anleitung neben dem Zahnrad öffnen. |
| **Einstellungen ⚙** | Geräte, Öffnungskontakte und benannte Sensorregeln pflegen; Urlaubsmodus und Sicherung bedienen. Keine Fahrziele oder Gültigkeitszeiträume an der Sensorregel. |

Bearbeiten erfolgt über das Stift-Symbol mit Tooltip „Bearbeiten“. Programme lassen sich innerhalb ihrer Gruppe mit den Pfeilen sortieren; die Reihenfolge bleibt gespeichert. Es gibt keinen globalen Aktiv-Schalter. Programme und Fahrten werden einzeln geschaltet. Die sichtbaren Beschriftungen „Aktiv“ und „Fahrt aktiv“ neben den Schaltern entfallen; die Schalter bleiben über ihre Position und für Screenreader über ihre Namen zuordenbar.

## Kopfbereich und Sensoranzeigenamen

Der Messwertebereich steht nur im Reiter Programme. Über „Messwerte“ lässt er sich vollständig ein- und ausblenden; die Wahl bleibt pro Benutzer, Browser und Karte erhalten. In der ersten Reihe stehen Sonnenaufgang und Sonnenuntergang als Symbol und Uhrzeit des heutigen Tages am Home-Assistant-Standort in der HA-Zeitzone. Die Zeiten wechseln nach Mitternacht auf den neuen Tag. Ohne Sonnenereignis steht „—“.

Alle an den sichtbaren Rollläden zugeordneten Temperatur-, Helligkeits- und Öffnungssensoren erscheinen einmalig mit ihrem aktuellen Wert. Die Gruppen Öffnung, Temperatur und Helligkeit sind jeweils alphabetisch nach Anzeigename sortiert. Innerhalb jeder Gruppe stehen die Einträge nebeneinander und fließen bei Platzmangel in die nächste Zeile. Name und Zustand stehen nebeneinander. Öffnung zeigt ein offenes oder geschlossenes Schloss, Temperatur ein Thermometer und genau eine Nachkommastelle. Helligkeit wird ab 1.000 lx in Tausendern ohne Nachkommastelle gekürzt: 20.300 lx → 20k lx. Kleinere Werte bleiben in lx; klx wird vor der Formatierung umgerechnet. Auch Zuordnungen deaktivierter Programme zählen. Zahlen verwenden deutsche Formatierung und die gemeldete Einheit. „Nicht verfügbar“ und „Unbekannt“ sind keine Messwerte und werden nicht als 0 angezeigt. Die Kopfzeile aktualisiert sich auch bei geöffnetem Bearbeitungsdialog. Native Leserechte für die Sensorentität sind erforderlich.

Unter **Einstellungen → Sensoranzeigenamen → Bearbeiten** vergeben Administratoren eigene Namen. Ein leerer Eintrag verwendet wieder den Home-Assistant-Namen. Diese Namen gelten nur im Shutter Manager, bleiben nach Neustart erhalten und sind Teil der Konfigurationssicherung. Reine Anzeigenamenänderungen stoppen keine laufende Fahrt und lösen keine Fahrt aus.

## Öffnungsprogramme

1. In **Einstellungen → Gerät bearbeiten → Öffnungskontakte** den Kontakt und seinen Offen-Zustand zuweisen.
2. Über das **Stift-Symbol** ein Programm bearbeiten oder ein neues Programm anlegen. Programmtyp **Sensorprogramm**, Sensorprogramm-Art **Öffnungskontakt** wählen.
3. Wochentage sowie **Von/Bis** einstellen. Der vorhandene Gültigkeitszeitraum und die Urlaubsausnahme können zusätzlich genutzt werden.
4. Eine Fahrt hinzufügen. Es werden nur Geräte mit Öffnungskontakt angeboten. Zielhöhe einstellen; bei Jalousien zusätzlich die Lamellen. Die Höhe ist erforderlich, Lamellen können unverändert bleiben.
5. Speichern und aktivieren. Standardmäßig startet die Fahrt bei einer neu erkannten Öffnung innerhalb der Gültigkeit. **Bei bereits geöffnetem Fenster starten** erlaubt zusätzlich den Start bei einem schon offenen Kontakt, etwa nach Neustart oder beim Beginn des Zeitfensters.

Der Öffnungsvorrang bleibt bis zum bestätigten Schließen aller zugeordneten Kontakte bestehen, auch nach Ende des Zeitfensters, Tages-/Saisonwechsel und Neustart. Ein offener Kontakt genügt zum Halten; unbekannte oder nicht verfügbare Kontakte zählen nicht als geschlossen. Das Öffnungsprogramm darf trotz seines eigenen offenen Kontakts die eingestellte Position anfahren. Andere automatische Fahrten desselben Geräts im Shutter Manager warten.

Nach dem Schließen wird das Ziel neu bestimmt, in dieser Reihenfolge:

1. Die aktuell geltende aktive Temperatur-/Helligkeitsbeschattung.
2. Eine **während des offenen Kontakts fällige und noch wartende Zeitfahrt**.
3. Die **Position unmittelbar vor dem automatischen Öffnen**, einschließlich der Lamellen bei Jalousien.

Ein bereits vor dem Öffnen ausgeführtes Zeitplanziel gilt nicht als verpasst und wird nicht wiederholt. Dadurch bleibt eine zwischenzeitliche manuelle Position erhalten, sofern keine aktive Beschattung oder tatsächlich wartende Zeitfahrt Vorrang hat. Eine während des Öffnungsvorrangs neu aktive Beschattung merkt sich ebenfalls die darunterliegende Ausgangsposition, nicht die vorübergehende Lüftungsposition. Fehlende Messwerte können die Rückkehr verzögern. Ohne bekannte vorherige Position und ohne anderes Ziel wird keine Rückkehrposition erfunden; der Fehler erscheint im HA-Protokoll.

Ein Zeitfenster über Mitternacht ist möglich; für den Teil nach Mitternacht gelten Wochentag und Saison des vorherigen Starttags. Überlappende aktive Öffnungsprogramme für dasselbe Gerät werden beim Speichern abgewiesen. Unterschiedliche, nicht überlappende Zeitfenster sind möglich.

Im Reiter **Sensorprogramme** wird ein bestehender Öffnungsvorrang auch außerhalb seines Zeitfensters angezeigt. Die Tagespause unterbindet neue Auslösungen. Ein bereits gestarteter Öffnungszyklus behält seinen Schutz bis zum Schließen und kehrt danach zum passenden Ziel zurück. Manuelle Bedienung und andere Integrationen bleiben unabhängig; der Schutz sperrt ausschließlich niedrigere Fahrten dieses Shutter Managers.

## Benannte Sensorregeln

Jede Regel enthält ihren Namen, einen Temperatur- und/oder Helligkeitssensor, obere Aktivierungs- und niedrigere Freigabeschwellen sowie die Freigabeverzögerung. Die Vorschlagslisten enthalten passende Sensoren anhand der Geräteklasse oder Einheit. Über „Alle Sensoren anzeigen“ lassen sich auch Sensoren mit fehlenden oder abweichenden Metadaten auswählen; Sensortyp und Einheit vorher prüfen. Bereits zugewiesene Sensoren bleiben erhalten. Schwellen werden in °C und lx angegeben; °F, Kelvin und klx werden umgerechnet.

Bei zwei Sensoren gilt immer **und**: Beide oberen Schwellen müssen erreicht sein. Für die Freigabe genügt eine erreichte untere Schwelle. Bei nur einem Sensor entscheidet dessen Wert. Die Freigabebedingung muss über die gesamte Verzögerung bestehen bleiben. Steigt der Wert wieder aus dem Freigabebereich oder fehlt ein Messwert, beginnt die Wartezeit bei erneuter Freigabe von vorn.

Neue Regeln erhalten den Vorschlagswert **300 Sekunden = 5 Minuten**. Gespeicherte Verzögerungen bleiben erhalten. Ein Wert von 0 bedeutet Freigabe ohne zusätzliche Wartezeit.

Die Auswahl im Programm verweist auf die benannte Regel. Änderungen an deren Schwellen wirken daher in allen Programmen, die diese Regel nutzen. Für Aktivierung und Freigabe desselben Fensters wird innerhalb eines Programms dieselbe Regel verwendet. Widersprüchliche, gleichzeitig geltende Programme für denselben Rollladen werden abgewiesen; unterschiedliche Wochentage oder Gültigkeitszeiträume trennen sie.

## Gültigkeit und Fahrziele im Programm

**Gültigkeitszeitraum** wird nur im Sensorprogramm gepflegt. Start und Ende als TT.MM. wiederholen sich jährlich und zählen mit. Winterzeiträume über den Jahreswechsel sind möglich. Ohne Begrenzung gilt das Programm ganzjährig; zusätzlich gelten seine Wochentage, Aktivierung und eine mögliche Urlaubspause.

Jede Fahrt steuert genau einen Rollladen. Lamellenregler gibt es nur für Jalousien; die tatsächliche Integration muss die Funktion unterstützen. „Unverändert“ lässt eine Achse unangetastet.

Bei „Wieder freigegeben“ ist entweder ein eigenes Fahrziel oder die aktuelle Zeitplanposition möglich. Bei Rückkehr zum Zeitplan wird das inzwischen passende Ziel verwendet, beispielsweise die abends fällige Position. Ohne passenden Zeitplan gilt die vor der Sensorbeschattung gemeldete Position. Ohne Freigabefahrt gibt es keine automatische Rückfahrt.

## Fahrten im Programmeditor

Beim Öffnen eines Programms sind alle vorhandenen Fahrten standardmäßig zugeklappt. Über den Pfeil an jeder Fahrt lassen sich ihre Eingabefelder auf- und zuklappen. „Alle aufklappen“ und „Alle zuklappen“ bedienen sämtliche Fahrten des geöffneten Programms. Gerät, Auslöser, Zielposition und Aktivierung bleiben in der Kopfzeile sichtbar. Neue Fahrten öffnen sich direkt im sichtbaren Bereich und fokussieren die Rollladenauswahl. Beim Bearbeiten bleiben Scrollposition und Fokus erhalten. Eingaben und Fahrverhalten bleiben beim Zuklappen erhalten; die Klappzustände gelten für den geöffneten Dialog.

## Fahrten kopieren und verschieben

In der Kopfzeile jeder Fahrt stehen Papierkorb (Entfernen), Pfeil (Verschieben) und zwei Blätter (Kopieren). Die Symbole sind auch bei zugeklappten Fahrten erreichbar. Beim Kopieren oder Verschieben öffnet sich ein eigener Dialog, in dem ausschließlich das Zielprogramm gewählt wird. Die Fahrt im Quellprogramm wird nicht aufgeklappt oder bearbeitet. Abbrechen oder Escape schließt nur die Zielauswahl und erhält den Programmentwurf. Zum Kopieren werden Programme desselben Typs und derselben Sensorprogramm-Art einschließlich des aktuellen Programms angeboten. „Dieses Programm“ erzeugt eine unabhängige Kopie im geöffneten Entwurf. Diese anschließend aufklappen und beispielsweise ihre Uhrzeit ändern. Zum Verschieben stehen nur andere Programme desselben Typs zur Auswahl.

Ziel wählen und Kopieren oder Verschieben bestätigen. Die Übernahme ist zunächst vorgemerkt. Erst **Speichern** im Programmeditor übernimmt Quell- und Zielprogramm gemeinsam. **Abbrechen** verwirft alle Änderungen. **Letzte Übernahme rückgängig** nimmt die zuletzt vorgemerkte Kopie oder Verschiebung zurück.

Beim Kopieren bleibt die Quelle erhalten; die Kopie bekommt eine eigene Fahrt-ID. Gleiche aktivierte Fahrten zur selben Zeit müssen vor dem Speichern auf unterschiedliche Uhrzeiten geändert werden. Beim Verschieben bleibt die Fahrt-ID erhalten und die Quelle verliert die Fahrt. Rollladen, Auslöser, Zeiten, Versatz, Grenzen, Höhe, Lamellen, Aktivierung und gegebenenfalls Sensorregel werden übernommen. Es gelten anschließend die Wochentage, Urlaubs- und Gültigkeitseinstellungen des Zielprogramms. Ein ausgeschaltetes Zielprogramm bleibt ausgeschaltet. Konflikte oder ein volles Zielprogramm werden gemeldet; die Vorgaben lassen sich vor dem erneuten Speichern korrigieren oder rückgängig machen.

## Zeitprogramme

Programme lassen sich in der Übersicht innerhalb ihrer Gruppe manuell sortieren. Die Reihenfolge bleibt beim Speichern erhalten. Zeitprogramme und Sensorprogramme haben getrennte, unabhängig klappbare Gruppen.

Fahrten werden in der Anzeige nach ihrer wirksamen Uhrzeit für heute sortiert, einschließlich Sonnenversatz und frühestens/spätestens. Beim Öffnen und nach Speichern/Aktualisieren steht eine nachträglich angelegte Morgenfahrt vor einer Abendfahrt. Während der Eingabe wird nicht umsortiert. Gleiche Uhrzeiten behalten ihre Reihenfolge; fehlende Sonnenzeiten stehen am Ende. Sensorprogramme behalten ihre Reihenfolge.

Der Reiter Zeitprogramm zeigt ausschließlich zukünftige Fahrten des aktuellen Tages und tatsächlich offene Aufträge mit Uhrzeit, Rollladen/Jalousie, Zielposition und Auslassen. Bereits erledigte, verworfene sowie nicht erfasste vergangene Fahrten stehen dort nicht. Wochentage und Aktivierung der Programme, Fahrten und Rollläden gelten weiterhin. Bereits fällige Warteaufträge bleiben sichtbar, auch vom Vortag. Durch die Anzeige werden keine vergangenen Zeiten neu ausgelöst.

Wartegründe stehen direkt darunter. Bei offenen Kontakten mit „Fahrt nachholen“ zeigt die Karte „Ausgesetzt bis Tür geschlossen“ mit Sensoranzeigename. Vor Fälligkeit ist dies die aktuelle Sperrvorschau. Tatsächlich wartende Fahrten tragen zusätzlich „wird nachgeholt“. Schließen gibt sie zur erneuten Prüfung frei. Bleiben etwa ein anderer Kontakt oder aktive Sensorbeschattung als Sperre bestehen, wird noch nicht gefahren. „Nicht fahren“ verwirft die konkrete Fahrt bei offenem Kontakt; sie wird nicht nachgeholt und verschwindet aus der Liste. Nicht verfügbare Kontakte werden gesondert angezeigt.

Wird eine bereits verarbeitete Fahrt ausdrücklich auf eine neue zukünftige Uhrzeit desselben Tages geändert, wird sie für diese Fälligkeit neu eingeplant. Auslassen und Wieder einplanen stehen dann wieder zur Verfügung. Höhe, Lamellen, Öffnungskontakte und Programmgültigkeit gelten unverändert weiter. Entscheidend ist die wirksame Zeit einschließlich frühestens/spätestens. Reine Namens- oder Parameteränderungen erzeugen keine nachträgliche Ausführung. Beim Update werden veraltete Kennzeichnungen solcher zukünftigen Fahrten bereinigt; abgeschlossene vergangene Fahrten werden nicht wiederholt.

Wochentage sind einzeln auswählbar. Auslöser sind feste Uhrzeiten, Sonnenaufgang oder Sonnenuntergang. Sonnenzeiten können einen Versatz und Grenzen für frühestens/spätestens erhalten. Beispiel: Sonnenaufgang 05:20 Uhr mit −30 Minuten und frühestens 06:00 Uhr ergibt eine Fahrt um **06:00 Uhr**.

Der Urlaubsmodus pausiert nur entsprechend markierte Programme. Standort und Zeitzone werden aus Home Assistant übernommen.

## Vorrang und Nachholen

**Ein aktiver Öffnungsvorrang steht über Temperatur/Helligkeit und Zeitprogrammen.** Außerhalb dieses Vorrangs gelten die Kontakt-Sperrregeln für Sensor- und Zeitfahrten. Pro Kontakt ist einstellbar: trotzdem fahren, diese Fahrt verwerfen oder nach dem Schließen nachholen. Nicht verfügbare Kontakte werden bei einer Sperrregel nicht als geschlossen behandelt. Mit „Fahrt nachholen“ wird ein wartendes Ziel nach Freigabe beim nächsten Auswertungszyklus (innerhalb von etwa fünf Sekunden) erneut geprüft; erst wird die Höhe und danach gegebenenfalls die Lamellenposition angefahren. „Nicht fahren“ verwirft die konkrete Ausführung dauerhaft. Verhindern danach noch ein anderer Kontakt, aktive Sensorbeschattung oder fehlende Gerätewerte die Fahrt, zeigt das Zeitprogramm den verbleibenden Wartegrund.

Aktive Sensorbeschattung hat Vorrang vor Zeitfahrten. Eine fällige Zeitfahrt, die wegen eines offenen Kontakts mit „Fahrt nachholen“ noch wartet, wird beim Schließen ausgeführt; eine bereits erledigte Zeitfahrt wird nicht erneut abgespielt. Eine neuere fällige Zeitfahrt am selben Rollladen ersetzt eine ältere wartende Fahrt.

## Manuelle Fahrten und Aussetzen

Eine manuelle Fahrt deaktiviert keine Regel. Bleiben Sensorwerte hoch, wird die Beschattung nicht ständig erneut angefahren. Nach Freigabe und erneutem Erreichen der Schwellen kann sie wieder auslösen. Spätere Freigabe- oder Zeitfahrten können die manuelle Position verändern; es gibt keine automatische manuelle Sperre.

**Einmal auslassen** betrifft eine konkrete Fahrt. **Bis morgen aussetzen** pausiert das ausgewählte Sensorprogramm bis zur nächsten lokalen Mitternacht, auch nach Neustart. Offene Temperatur-/Helligkeitsaufträge dieses Programms werden aufgehoben. Ein bereits aktiver Öffnungszyklus hält den Vorrang bis zum Schließen und führt dann die Rückkehr aus. Bereits erreichte Positionen werden nicht pauschal zurückgefahren; Zeitprogramme bleiben aktiv. Bei Wiederaktivierung können weiterhin hohe Werte erneut auslösen, wenn das Programm heute gilt.

## Betrieb, Sicherung und Grenzen

Die Auswertung erfolgt alle fünf Sekunden. Bei Jalousien wird erst die Höhe bestätigt, dann die Lamellenposition gesetzt. Ohne Bestätigung wird nach 150 Sekunden je Bewegungsphase ein Fehler gemeldet und, sofern unterstützt, gestoppt.

Konfiguration, Urlaubsmodus und Vormerkungen werden gespeichert. Nach Neustart werden verpasste Zeitpunkte nicht pauschal nachgeholt; bereits wartende Ziele bleiben erhalten und werden mit neueren Zeitfahrten abgeglichen.

Administratoren konfigurieren; andere Benutzer benötigen Steuerrechte für die betroffenen Rollläden. Eine Sicherung enthält die Konfiguration. Nach Wiederherstellen sind die importierten Programme zunächst deaktiviert.

Feiertagsdaten sowie Wind-/Frostschutz sind nicht eingebaut. Der Urlaubsmodus kann durch HA-Automationen gesetzt werden. Andere Steuerungen wie free@home-Grundprofile arbeiten unabhängig weiter.

## Wenn Speichern nicht klappt

Die Fehlermeldung steht direkt über den Speicherknöpfen. Eingaben bleiben erhalten. Bei Sensorregeln muss die Freigabeschwelle unter der Aktivierungsschwelle liegen, beispielsweise aktiv ab 25 °C und Freigabe bei 23 °C. Mindestens einen Sensor auswählen. Unveränderte Programme anderer, momentan nicht verfügbarer Geräte blockieren das Speichern der Regelparameter nicht. Bei einem vorübergehenden Speicherfehler lässt sich Speichern erneut versuchen.

## Versionen prüfen

Im Howto und in den Einstellungen stehen Oberfläche und tatsächlich geladene Integration getrennt. Eine Versionsnummer im Titel der Anleitung allein bezeichnet nur die Kartenoberfläche. Fehlt die Meldung der Integration oder unterstützt diese die Sensorregeln noch nicht, bleiben Schreibzugriffe gesperrt. Nach einem Code-Update Home Assistant vollständig neu starten, beispielsweise mit `ha core restart` im Terminal, und danach Browser/App neu laden. Ein Neuladen nur der Integration ersetzt diesen Neustart nicht. Die Karte kontrolliert zusätzlich, ob die gespeicherten Sensorregeln in der Antwort der Integration enthalten sind.


## English

Choose the 🇬🇧 flag in **Settings** to switch the dashboard card and in-card guide to English. The 🇩🇪 flag returns the card to German. The selection is stored per Home Assistant user in this browser. The guide covers schedules, opening priority, sensor rules, validity periods, pending actions, and backup.
