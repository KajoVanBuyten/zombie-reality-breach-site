# Deployment mit Wrangler

Die Website läuft als Cloudflare Worker mit statischen Assets (Konfiguration in `wrangler.jsonc`): der Worker liefert den Vite-Build aus `dist/` und beantwortet `/api/*` selbst (`worker/index.ts`: Bestenlisten, Web-AR-Quest, Meta-Verknüpfung, Belohnungen für Cloud Code). Beide Domains `zombierealitybreach.com` und `www.zombierealitybreach.com` hängen als Custom Domains am Worker.

## Voraussetzungen

- Node.js 20 oder neuer, `npm install` im Repo.
- Zugriff auf das Cloudflare-Konto von KaMa Studios. Einmal anmelden (öffnet den Browser, speichert ein OAuth-Token lokal unter `~/.wrangler`):

```bash
npx wrangler login
```

- Prüfen, wer angemeldet ist:

```bash
npx wrangler whoami
```

Wrangler wird nicht global installiert; `npx wrangler` holt die Version aus dem Projekt (derzeit 4.x).

## Deploy in vier Schritten

1. Code prüfen:

```bash
npm run typecheck && npm run lint
```

2. Bauen (schreibt `dist/`, kopiert `index.html` nach `404.html` für die Routen der Single-Page-App). **Vorher die privaten Assets der Web-AR-Quest erzeugen** (Abschnitt „Private Assets der Web-AR-Quest“), sonst fehlt die A3500X; der Build warnt dann mit `public/breach/private/a3500x.glb FEHLT`:

```bash
npm run build
```

3. Deployen:

```bash
npx wrangler deploy
```

4. Prüfen: Wrangler gibt am Ende `Current Version ID` aus. Die Seite im Browser neu laden und kontrollieren, dass das neue Bundle (`dist/assets/index-<hash>.js`) ausgeliefert wird, zum Beispiel:

```bash
curl -s https://zombierealitybreach.com/ | grep -o "index-[A-Za-z0-9_-]*\.js"
```

Das Ganze in einem Rutsch:

```bash
npm run typecheck && npm run lint && npm run build && npx wrangler deploy
```

## Was `wrangler.jsonc` festlegt

| Einstellung | Bedeutung |
| --- | --- |
| `assets.directory = ./dist` | Nur der Build wird hochgeladen; `public/` landet über Vite in `dist/`. Unveränderte Dateien werden nicht erneut übertragen. |
| `not_found_handling = single-page-application` | Unbekannte Pfade liefern `index.html`, damit die React-Router-Seiten direkt aufrufbar sind. |
| `run_worker_first = ["/api/*"]` | API-Aufrufe gehen an den Worker, nicht an den SPA-Fallback. |
| `keep_vars = true` | Variablen und Secrets aus dem Cloudflare-Dashboard bleiben bei jedem Deploy erhalten. Ohne diese Zeile löscht ein Deploy sie. |
| `vars.UGS_ENVIRONMENT_ID` | Die Unity-Gaming-Services-Umgebung für die Bestenlisten (kein Geheimnis). |
| `vars.META_APP_ID`, `vars.META_ORG_ID` | Meta-App-ID und Team-ID (Organisations-ID) für die Kontoverknüpfung der Web-AR-Quest (keine Geheimnisse). `META_ORG_ID` ist leer, bis der Besitzer sie einträgt. |
| `d1_databases` (`DB`) | D1-Datenbank `zrb-web-quest` für Quest-Läufe, Belohnungen und Codes; Schema in `migrations/`. |

## Secrets

Die Bestenlisten lesen Punkte aus Unity Gaming Services mit einem Service-Account. Die Schlüssel liegen nur als Worker-Secrets in Cloudflare, nie im Repository, nie im Chat:

```bash
npx wrangler secret put UGS_KEY_ID
```

```bash
npx wrangler secret put UGS_SECRET
```

Beide Befehle fragen den Wert interaktiv ab. Nur der Besitzer setzt sie; ein normales Deploy fasst sie nicht an.

## Web-AR-Quest: einmalige Schritte (nur Besitzer)

Die Quest unter `/breach` und ihre API (`/api/quest/*`, `/api/meta/*`, `/api/rewards/*`, Vertrag in `Docs/WEB_AR_QUEST.md` des Spiel-Repos) brauchen einmalig eine Datenbank, drei Secrets und die Meta-Einstellungen. Bis dahin antworten die Endpunkte `503 { configured: false }`; die Quest ist spielbar, die Belohnung wird dann als „noch nicht eingeschaltet“ angezeigt.

1. D1-Datenbank anlegen und die ausgegebene `database_id` in `wrangler.jsonc` bei `d1_databases` eintragen (ersetzt den Platzhalter aus Nullen):

```bash
npx wrangler d1 create zrb-web-quest
```

2. Schema einspielen:

```bash
npx wrangler d1 migrations apply zrb-web-quest --remote
```

3. Secrets setzen (jeder Befehl fragt den Wert interaktiv ab):

```bash
npx wrangler secret put META_APP_SECRET
```

```bash
npx wrangler secret put QUEST_SECRET
```

```bash
npx wrangler secret put WEB_REWARDS_KEY
```

- `META_APP_SECRET`: App Secret aus dem Meta Developer Dashboard (Development > API > App Credentials, nur mit Admin-Konto sichtbar).
- `QUEST_SECRET`: eine lange Zufallszeichenkette, nur hier gebraucht (signiert die Lauf-Token und das tägliche Salz der IP-Hashes). Wechselt sie, werden laufende Quest-Läufe ungültig.
- `WEB_REWARDS_KEY`: eine lange Zufallszeichenkette, **derselbe Wert** wie `ZRB_WEB_REWARDS_KEY` im UGS Secret Manager (Cloud Code `claimWebRewards` schickt ihn als `Authorization: Bearer`).

4. Meta Developer Dashboard → Team → SSO: Login-URI `https://zombierealitybreach.com/breach/linked` eintragen und speichern.

5. Die Organisations-ID (Team-ID) des Meta-Teams in `wrangler.jsonc` unter `vars.META_ORG_ID` eintragen (kein Secret).

6. Bauen und deployen wie oben. Prüfen: `curl -s -X POST https://zombierealitybreach.com/api/quest/start -H "content-type: application/json" -d "{}"` liefert `{ run, token }`; `/api/meta/link` ohne Lauf antwortet `400 invalid_run` statt `503`.

Lokal testen ohne Cloudflare-Ressourcen: `npx wrangler d1 migrations apply zrb-web-quest --local`, dann `npx wrangler dev --var QUEST_SECRET:<test> --var WEB_REWARDS_KEY:<test>` (Testwerte, nie die echten).

## Versionen und Zurückrollen

Jedes Deploy ist eine Version. Liste und Rückkehr zu einer früheren Version:

```bash
npx wrangler versions list
```

```bash
npx wrangler rollback
```

`rollback` fragt nach der Ziel-Version und schaltet sie ohne neuen Build live. Die Logs eines laufenden Workers:

```bash
npx wrangler tail
```

## Lokal testen

Entwicklung mit Hot Reload (nur die Seite, ohne Worker-API):

```bash
npm run dev
```

Den fertigen Build samt Worker lokal wie in Produktion laufen lassen:

```bash
npm run build && npx wrangler dev
```

## Private Assets der Web-AR-Quest

Die Startpistole der Quest ist die A3500X des Spiels, ein Unity-Asset-Store-Modell (Standard-EULA): Sie darf im Produkt ausgeliefert, ihre Dateien dürfen aber nicht weitergegeben werden, und dieses Repository ist öffentlich. Deshalb liegt das GLB unter `public/breach/private/`, das in `.gitignore` steht, und wird **vor jedem `npm run build` bzw. Deploy lokal aus dem privaten Spiel-Repo erzeugt** (Blender 4.5, rund 10 s):

```bash
"C:/Program Files/Blender Foundation/Blender 4.5/blender.exe" -b --factory-startup --python scripts/export_a3500x.py -- "E:/source/Unity/zombie-reality-breach/Assets/_Project/Art/Weapons/A3500X" public/breach/private/a3500x.glb
```

Das Skript entfernt Herstellerschriftzüge, Modellnamen und Seriennummer aus den Texturen, reduziert auf 7600 Dreiecke und 1024er-Texturen (etwa 1 MB). Prüfen, dass die Datei nie im Repository landet:

```bash
git check-ignore -v public/breach/private/a3500x.glb   # muss die .gitignore-Zeile zeigen
git ls-files public/breach/private                     # muss leer sein
```

Fehlt die Datei, warnt `npm run build` laut (`public/breach/private/a3500x.glb FEHLT`), und die Quest nimmt mit einer Konsolenwarnung die alte Klotzpistole. Die Zombies (`public/breach/zombies/`, eigene Tripo-Modelle des Besitzers) und die goldene Desert Eagle (CC-BY 4.0, siehe `CREDITS.md`) sind dagegen im Repository.

## Größere Assets

Key Art, Logos, Waffen-Renders und das Pressepaket entstehen aus `scripts/Build-WebAssets.ps1` und `scripts/Build-WeaponImages.ps1` (siehe `ASSETS.md`) und werden mitgebaut. Grenzen von Cloudflare Workers Static Assets: 25 MiB je Datei, 20 000 Dateien je Version. Das Pressepaket `zrb-presskit.zip` liegt knapp unter der Dateigrenze; wird es größer, muss es geteilt werden.

## Deploy aus Bolt.new oder einer anderen Online-IDE?

Kurz: möglich, aber nicht empfohlen.

- Bolt.new (StackBlitz WebContainers) kann `npm run build` ausführen und hat einen eigenen Ein-Klick-Deploy, der auf Netlify zielt, nicht auf Cloudflare Workers.
- `npx wrangler deploy` braucht keinen nativen `workerd`-Prozess und könnte im WebContainer laufen, wenn ein API-Token als `CLOUDFLARE_API_TOKEN` gesetzt ist. Der Browser-Login (`wrangler login`) funktioniert dort nicht zuverlässig, und `wrangler dev` läuft in WebContainers nicht, weil `workerd` ein natives Binary ist. Cloudflare gibt für WebContainers keine Unterstützung an; ob es gerade funktioniert, hängt von der Wrangler-Version ab.
- Der eigentliche Haken: Ein Cloudflare-API-Token mit Deploy-Rechten in einen Drittanbieter-Dienst zu legen, gibt diesem Dienst die Kontrolle über die Live-Seite. Das widerspricht der Regel, Schlüssel nur lokal und bei Cloudflare zu halten.

Empfohlener Weg, wenn nicht von diesem PC deployt werden soll: eine GitHub Action im Repo, die bei einem Push auf `main` baut und `wrangler deploy` ausführt. Der Token liegt dann als GitHub-Repository-Secret, scoped auf dieses eine Worker-Projekt (Cloudflare-Token mit der Vorlage „Edit Cloudflare Workers“). Bolt.new oder jede andere IDE pusht dann nur Code; das Deploy macht GitHub.

```yaml
# .github/workflows/deploy.yml (Vorschlag, noch nicht eingerichtet)
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run typecheck && npm run lint && npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Häufige Fehler

| Meldung | Ursache und Abhilfe |
| --- | --- |
| `Not logged in` / `Authentication error` | `npx wrangler login` erneut ausführen oder `CLOUDFLARE_API_TOKEN` setzen. |
| Alte Seite nach dem Deploy | Browser-Cache; `index.html` wird kurz gecacht, die Bundles sind per Hash eindeutig. Hard Reload. |
| Bestenlisten leer nach dem Deploy | `keep_vars` fehlt oder die Secrets wurden entfernt; im Dashboard prüfen, Secrets neu setzen. |
| `Asset too large` | Einzeldatei über 25 MiB, meist ein ZIP im Pressepaket. Datei teilen oder aus `public/` nehmen. |
