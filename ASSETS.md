# Web-Asset-Set

Stand: 16.10.2026. Alle Dateien unter `public/` werden von `scripts/Build-WebAssets.ps1` aus dem Media-Ordner des Spiels erzeugt (`E:\source\Unity\zombie-reality-breach\Media`). Nichts davon ist von Hand bearbeitet: Änderungen an den Quellen, dann das Skript erneut laufen lassen.

```bash
powershell -ExecutionPolicy Bypass -File scripts/Build-WebAssets.ps1
```

Benötigt ImageMagick 7 (`magick`) im PATH. `-SkipPress` lässt die ZIP-Dateien weg. `public/assets/manifest.json` listet jede erzeugte Datei mit Maßen und Bytes.

## Quellen

| Quelle in Media | Was | Herkunft |
| --- | --- | --- |
| `Store/Meta/Final_5_Themen/<Thema>/` | fertige Store-Sätze: Titelgrafik 16:9, 7:10, 1:1, Hero 10:3, Reiseziel ohne Schrift, Symbol | Key Art aus ChatGPT Astra, Logo aufgesetzt (`Brand/Build/build_final_5_themes.ps1`) |
| `Brand/Source/Final_5_Themen/<Thema>/*_master.png` | dieselben Motive ohne Logo (Hochkant, Quadrat, Hero) | Ausgangsbilder der Sätze |
| `Brand/Logo/` | Logo, Wortmarke, Totenkopf als SVG und PNG | Markenleitfaden `Docs/Marketing/BRAND_GUIDE.md` |

Nicht übernommen: Screenshots (auf Wunsch von Kajo am 16.10.2026 aus dem Set genommen; weder die drei kuratierten in `Media/Store/Meta/Screenshots/` noch die zwölf rohen Headset-Aufnahmen in `Media/Screenshots/`, letztere zeigen privates Zimmer, Raumanker-QR-Codes, Fernseher mit Filmbild und freizügige Zombie-Outfits), die alten Logo-Entwürfe im Media-Wurzelordner (durch das aktuelle Logo ersetzt), die Spatial-Tiles und Unity-Ladebilder (Store- bzw. Spielformate).

## Themen

| Slug | Thema | Motiv | Logo-Fassung | Vorschlag für die Website |
| --- | --- | --- | --- | --- |
| `wall-breach` | 01 Wanddurchbruch | Zombie greift durch die aufgebrochene Wohnzimmerwand | hell auf dunkel | REALITY BREACH, Startseite, Open Graph |
| `daylight` | 02 Daylight | Rudel im Nebel bei Tag | dunkel auf hell | helle Abschnitte, News |
| `night-station` | 03 Night Station | Tankstelle im Wald bei Nacht | hell auf dunkel | OUTBREAK |
| `dead-signal` | 04 Dead Signal | Nahaufnahme, rote Locken | hell auf dunkel | RIFT |
| `ash-city` | 05 Ash City | zerstörte Stadt aus einer verwüsteten Wohnung | hell auf dunkel | THE GAME, Call-to-Action, Presse |

## Ordner

### `public/` (Favicons und App-Icons)

Der Marken-Totenkopf auf Ink `#180C14`, quadratisch. Ersetzt das bisherige `favicon.png` (1140×1640, nicht quadratisch, noch vorhanden und noch in `index.html` verlinkt).

| Datei | Maße | Einsatz |
| --- | --- | --- |
| `favicon.ico` | 48, 32, 16 | `<link rel="icon" href="/favicon.ico" sizes="any">` |
| `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png` | | `<link rel="icon" type="image/png" sizes="32x32" …>` |
| `apple-touch-icon.png` | 180×180 | iOS-Homescreen |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | | `site.webmanifest`, Android/PWA |
| `site.webmanifest` | | `<link rel="manifest" href="/site.webmanifest">` |

### `public/assets/brand/`

| Datei | Einsatz |
| --- | --- |
| `zrb_logo_on_dark.svg` / `_512.png` / `_1024.png` / `_2048.png` | Hauptlogo auf dunklem Grund (Navbar, Footer, Hero) |
| `zrb_logo_on_light.svg` / PNG | Logo auf hellem Grund (helle Abschnitte, Druck) |
| `zrb_wordmark_on_dark.svg`, `zrb_wordmark_on_light.svg` / PNG | nur ZOMBIE, für Breiten unter 240 px |
| `zrb_skull_on_dark.svg` / `_256.png` / `_512.png`, `zrb_skull_on_light.*` | Signet (Navbar statt Lucide-Skull, Listenpunkte, Ladeanimation) |
| `zrb_logo_mono_white.svg`, `zrb_logo_mono_black.svg` | einfarbig, Wasserzeichen |
| `zrb_symbol_512.png` | Totenkopf auf Ink, quadratisch (Avatar, Store-Symbol) |

Regeln aus dem Markenleitfaden: nicht stauchen, drehen oder umfärben; auf Hell die helle, auf Dunkel die dunkle Fassung (sie haben bewusst verschiedene Totenköpfe); ruhiger Hintergrund; mindestens die Höhe der Unterzeile als Abstand; keine Schatten oder Glüh-Effekte; mit Unterzeile mindestens 240 px breit.

### `public/assets/keyart/<slug>/`

WebP in allen Breiten, JPG als Fallback in der Hauptbreite. Namensschema `<art>_<breite>.<ext>`.

| Art | Breiten | Seitenverhältnis | Logo | Einsatz |
| --- | --- | --- | --- | --- |
| `hero` | 2560, 1920, 1280, 800 | 16:9 | ohne | Hero-Hintergrund mit eigenem Text, Modus-Karten, Abschnittshintergründe (`srcset`) |
| `cover` | 1920, 1280 | 16:9 | mit | Titelbild, Presse, Teaser |
| `banner` | 2400, 1600 | 10:3 | mit | breite Kopfstreifen, Seitenköpfe |
| `banner-clean` | 2100, 1400 | 3:1 | ohne | Kopfstreifen mit eigenem Text |
| `portrait` | 1008, 504 | 7:10 | mit | Mobil-Hero, Hochkant-Karten |
| `portrait-clean` | 1000, 500 | 7:10 | ohne | Mobil-Hero mit eigenem Text |
| `square` | 1080, 540 | 1:1 | mit | Social, Kacheln |
| `square-clean` | 1080, 540 | 1:1 | ohne | Kacheln mit eigenem Text, News-Vorschau |

### `public/assets/og/`

`og_<slug>_1200x630.jpg`, aus der Titelgrafik mit Logo mittig auf 1,91:1 beschnitten (Logo bleibt vollständig). Für `og:image` und `twitter:image`; Empfehlung `og_wall-breach_1200x630.jpg`, passend zum vorhandenen `og:image:alt`. Pro Seite kann ein anderes Thema stehen (Modi-Seite: das Thema des Modus).

### `public/assets/press/`

| Datei | Inhalt | Größe |
| --- | --- | --- |
| `zrb-presskit.zip` | alles: Logo, Key Art, README mit Nutzungsbedingungen | 23,0 MB |
| `zrb-logo.zip` | Logo-Fassungen SVG + PNG, App-Icon | 2,9 MB |
| `zrb-keyart.zip` | fünf Themen in voller Auflösung als JPG (Qualität 92) | 20,0 MB |
| `zrb_app_icon_512.png` | App-Icon einzeln | 74 KB |

Für die Download-Liste der Presseseite (dort stehen noch „Coming soon“). Offen bleiben Screenshots, Fact Sheet (PDF) und Trailer. Die drei ZIPs enthalten dasselbe Material doppelt; wer Platz im Repository sparen will, behält nur `zrb-presskit.zip`.

## Noch nicht verdrahtet

Das Set liegt neben den bisherigen Bildern in `public/assets/images/` (die `img`-Konstanten in `src/lib/site.ts` zeigen weiter dorthin). Umstellung der Website, Favicon-Links in `index.html`, Open-Graph-Bilder pro Seite und die Presse-Downloads sind der nächste Schritt.
