# Website- und Kampagnenauswertung

Die sechs-stündliche Social-Media-Automation wurde auf Besitzerwunsch beendet. Dieses System ist Website-Tracking, kein Ersatz für plattformeigene Aufruf-, Kommentar- oder Like-Statistiken.

## Benutzung

`https://zombierealitybreach.com/tracking` öffnen, privaten Zugriffsschlüssel eingeben, Zeitraum wählen und **Auswertung laden**. Der Schlüssel bleibt im Arbeitsspeicher des Tabs; **Abmelden** entfernt Schlüssel und Bericht. Kein Schlüssel im Repository, JavaScript-Bundle, URL oder Browser-Speicher. CSV-Export und Kampagnenlink-Generator stehen bereit.

Erfasst werden ausschließlich eingewilligte Sitzungen: Seitenaufrufe, interne Navigation, externe Links, Kontakt-/Download-Klicks, Beta-Klicks nach Position, aktive Zeit nach 15/60 sichtbaren Sekunden, Scrolltiefe 25/50/75/90 %, Trailerstart/-Position 25/50/75 %/-Ende, Sprachwechsel und generische Laufzeitfehler ohne Nachricht/Stack. Trailerposition kann durch Vorspulen erreicht werden. Eine Sitzung endet nach 30 Minuten ohne erfasste Aktivität oder spätestens nach 24 Stunden. Sitzungen sind keine eindeutigen Personen.

Quellen werden aus erlaubten UTM-Kennungen oder einer groben Referrer-Kategorie gewonnen. Die erste Quelle einer Sitzung bleibt erhalten. Keine vollständigen Referrer-URLs, Querystrings, IP-Adressen, Formulardaten, E-Mail-Adressen oder Spielkonten werden in der Analysedatenbank gespeichert. Kampagnenkennungen dürfen keine personenbezogenen Daten enthalten. Sprach-/Gerätekategorien können innerhalb einer Sitzung wechseln; entsprechende Teilmengen sind deshalb nicht immer addierbar.

**Beta-Klicks sind keine bestätigten Beta-Beitritte.** Der fremde Meta-Kanal meldet Beitritte nicht an diese Website zurück. Spielaktivität kommt separat und nur aggregiert aus dem bestehenden Spiel-Telemetriesystem: meldende Installationen, erste Meldung/aktive Installation im Zeitraum und online in den letzten 150 Sekunden. Auch das sind keine eindeutigen Personen. Kein Abgleich mit Website-Sitzungen.

## Kampagnenlinks ab jetzt verwenden

Im Generator einen eigenen `content`-Wert pro Beitrag setzen. Ohne markierte Links ist häufig nur eine grobe Quelle oder direkt/referral messbar. Bestehende Veröffentlichungen werden hierdurch nicht automatisch nachträglich zugeordnet.

| Kanal | source | medium | campaign | Beispiel content |
| --- | --- | --- | --- | --- |
| YouTube | youtube | organic-social | open-beta | bat-short-01 |
| TikTok | tiktok | organic-social | open-beta | bat-short-01 |
| Instagram | instagram | organic-social | open-beta | reel-01 |
| Reddit | reddit | community | open-beta | quest-post-01 |
| Discord | discord | community | open-beta | vr-server-01 |
| Creator-Einladung | creator-01 | creator | open-beta | invitation-01 |

Beispiel: `https://zombierealitybreach.com/?utm_source=youtube&utm_medium=organic-social&utm_campaign=open-beta&utm_content=bat-short-01`

## Datenschutz und Grenzen

Standard ist aus. Gleichwertige Zustimmung/Ablehnung, jederzeit widerrufbar über **Datenschutz-Einstellungen**. Entscheidung 180 Tage lokal; Sitzungskennung nur im Sitzungsspeicher. DNT/GPC schaltet Erfassung aus, bekannte Bots werden ignoriert. Keine Werbepixel, kein Fingerprinting und keine Cross-Site-IDs. Widerruf stoppt zukünftige Erfassung und verwirft ausstehende Ereignisse; zuvor gespeicherte Daten unterliegen weiter der 90-Tage-Löschung. Datenschutzerklärung auf `/datenschutz` aktualisiert.

Separate D1-Datenbank `zrb-site-analytics`, EU-Jurisdiktion, Binding `ANALYTICS_DB`. Tägliche Bereinigung um 03:17 UTC. Aufbewahrung 90 Tage. Signierte kurzlebige Sitzungstoken, Same-Origin-Prüfung, vorbereitete SQL-Anweisungen, Ereignis-/Pfad-Allowlist, Rate Limit 60 Anfragen/IP/Minute und Bereich, maximal 500 Ereignisse/Sitzung sowie atomarer Tagesdeckel von 10.000 Ereignissen. IP wird ausschließlich transient für Cloudflares Rate Limiting verwendet. Nach Tagesdeckel fehlen weitere Ereignisse; Budget ist im Bericht sichtbar. Cloudflare-Hosting-/Verbindungslogs sind eine separate bestehende Verarbeitung.

## Entwicklung und Betrieb

```powershell
npm run typecheck
npm run lint
npm run build
npx wrangler d1 migrations apply zrb-site-analytics --local
npx wrangler dev --ip 127.0.0.1 --port 8793 --var ANALYTICS_SECRET:local-analytics-signing-test-value --var ANALYTICS_ADMIN_KEY:local-analytics-admin-test-value
# In einem zweiten Terminal: ausschließlich gegen localhost, nie Produktionsdaten
node scripts/test-analytics.mjs
```

Neue Umgebung: ANALYTICS_SECRET und ANALYTICS_ADMIN_KEY jeweils kryptografisch zufällig erzeugen und über Wrangler-Secret-Eingabe setzen; niemals die obigen öffentlichen Lokaltestwerte produktiv verwenden. Beide Secrets sind unabhängig. Migration nur für `zrb-site-analytics` anwenden, dann `npx wrangler deploy --dry-run` und `npx wrangler deploy`. Die bestehende Spiel-Datenbank bleibt unverändert. `keep_vars` erhält bestehende Variablen. Vor Deployment muss die vorhandene private A3500X-GLB entsprechend DEPLOY.md vorhanden sein.

Schlüsselverlust: Admin-Schlüssel mit `wrangler secret put ANALYTICS_ADMIN_KEY` rotieren, Besitzerablage aktualisieren. Bei Sitzungsschlüssel-Rotation verfallen vorhandene Tokens, Clients fordern neue an. Rollback auf eine frühere Worker-Version benötigt keine Datenbanklöschung; Zustimmung bleibt für alte Versionen bedeutungslos. Bei dauerhafter Abschaltung Erfassung und Aufbewahrung gemeinsam planen.

Messdaten beginnen erst mit Inbetriebnahme. Frühere Website-Besuche lassen sich nicht rekonstruieren.
