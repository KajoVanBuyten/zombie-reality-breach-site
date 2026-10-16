# Web-Asset-Set

Stand: 16.10.2026. Alle Dateien unter `public/` werden von `scripts/Build-WebAssets.ps1` aus dem Media-Ordner des Spiels erzeugt (`E:\source\Unity\zombie-reality-breach\Media`). Nichts davon ist von Hand bearbeitet: Änderungen an den Quellen, dann das Skript erneut laufen lassen.

```bash
powershell -ExecutionPolicy Bypass -File scripts/Build-WebAssets.ps1
```

Benötigt ImageMagick 7 (`magick`) im PATH. `-SkipPress` lässt die ZIP-Dateien weg. `src/content/asset-manifest.json` listet jede erzeugte Datei mit Maßen und Bytes (liegt unter `src`, weil Vite keine Importe aus `public` erlaubt; die Presseseite liest die Dateigrößen daraus).

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

## Verdrahtung auf der Website

Stand 16.10.2026, Umstellung von `public/assets/images/` (gelöscht) und `favicon.png` (gelöscht):

- `index.html`: `favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`, `site.webmanifest`; `og:image`/`twitter:image` auf `og_wall-breach_1200x630.jpg` (1200×630).
- `src/lib/site.ts`: `brand` (SVG-Pfade), `keyArtThemes` (Modus → Thema), `keyArtWebp`/`keyArtJpg`/`keyArtSrcSet`/`keyArtSet` und die `img`-Konstanten (Hero ohne Schrift).
- `src/components/KeyArt.tsx`: `<picture>` mit WebP-`srcset` und JPG-Fallback; `portraitBelow` liefert auf schmalen Viewports `portrait-clean`.
- `src/components/BrandMark.tsx`: Signet (Totenkopf) auf schmalen Viewports, ab `sm` die Wortmarke; Navbar und Footer.
- Startseite: Hero `ash-city` (2560/1920/1280/800, mobil Hochkant), Modus- und News-Karten `hero_1280/800`, Call-to-Action `daylight`.
- Das Spiel / Spielmodi: Kopfbild pro Modus (`wall-breach`, `dead-signal`, `night-station`), keine Screenshots.
- Presse: Downloads aus `public/assets/press/` mit Größen aus `src/content/asset-manifest.json` (JSON-Import), Key-Art-Galerie `cover_1280.webp` → `cover_1920.jpg`.

## Waffenbilder (`public/assets/weapons/`)

Renders der echten Spielmodelle aus `Assets/_Project/Art/Weapons` und `Art/Mods` des Unity-Projekts, ohne Unity: `scripts/Build-WeaponImages.ps1` lässt Blender 4.5 headless `scripts/render_weapons.py` mit `scripts/weapon_renders.json` laufen (FBX laden, Texturen nach dem Namensschema oder aus der Konfiguration, Modell auf 1 m normieren, Kamera schräg von der Seite mit Mündung nach rechts, Dreipunktlicht, transparenter Hintergrund) und exportiert mit ImageMagick `<id>_1200.webp` und `<id>_600.webp` (16:9, Alphakanal). Die Zwischen-PNGs liegen in `build/weapon-renders/` (nicht im Repository).

Die `<id>` sind die Waffen-IDs aus `src/content/weapons.ts` (23 Waffen, davon `pipe-bomb` ohne Modell) plus die Aufsätze und Vorräte mit eigenem Modell: `bayonet`, `laser`, `scope`, `speedloader`, `pain-pills`. Das Katana liegt als FBX 6100 vor, das Blenders Importer ablehnt; das Skript liest es über Blenders Low-Level-Parser. Die Taschenlampe hat im Projekt nur ein Unity-Mesh-Asset und deshalb kein Bild.

Aufsätze und Vorräte ohne eigenes Modell werden so gebaut, wie das Spiel sie baut: `ModModels.cs` setzt Rotpunkt, Vordergriff, Schulterstütze, Schalldämpfer, Choke, Mündungsbremse, Lauf, Nägel, Griffband, Sägezähne und Kopfgewicht aus Unity-Primitiven in festen Farben zusammen, `ThrowableItem.cs` die Rohrbombe; `weapon_renders.json` enthält dieselben Maße und Farben (`"builder": "primitives"`). Die Taschenlampe wird aus ihrem Unity-Mesh-Asset gelesen (`"builder": "unity_mesh"`), Munition aus dem Munitionshaufen in `Resources/Ammo`, Mag+ aus dem AK-Magazin, Bretter wie die Barrikadenbretter des Spiels, Sprit als der Kanister der Tankstelle (`Art/Vr/Props/metal_jerrycan_green`). Zwei Bilder sind reine Darstellungen ohne Vorbild im Spiel: die Stirnlampe (im Spiel nur eine Lichtquelle, `HeadLamp.cs`) und die Hüfttasche (im Spiel unsichtbar, `Throwables.cs`); beide in den Farben der Mod-Teile.

Asset-Store-Modelle (A3500X, Pistol 92, Katana) dürfen als Render der Spielszene gezeigt, aber nicht als Rohdateien weitergegeben werden; die Renders sind davon nicht betroffen.
