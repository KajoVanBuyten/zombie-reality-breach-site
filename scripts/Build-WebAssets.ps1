<#
.SYNOPSIS
  Baut das Web-Asset-Set der Website aus dem Media-Ordner des Spiels.

.DESCRIPTION
  Quelle sind die fertigen Store-Sätze (Media/Store/Meta/Final_5_Themen), die logofreien
  Ausgangsbilder (Media/Brand/Source/Final_5_Themen), die Logo-Fassungen (Media/Brand/Logo)

  Erzeugt unter public/:
    favicon.ico, favicon-*.png, apple-touch-icon.png, icon-*.png, site.webmanifest
    assets/brand/        Logo, Wortmarke, Totenkopf als SVG und PNG
    assets/keyart/<slug> Key Art je Thema in Web-Größen (WebP + JPG-Fallback)
    assets/og/           Social-Media-Vorschaubilder 1200x630
    assets/press/        Pressepaket als ZIP-Dateien
    src/content/asset-manifest.json Liste aller erzeugten Dateien mit Maßen und Größe (Import der Presseseite)

  Benötigt ImageMagick 7 (magick) im PATH. Bestehende Dateien werden überschrieben.
  Die Quellbilder in Media werden nicht verändert.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/Build-WebAssets.ps1
  powershell -ExecutionPolicy Bypass -File scripts/Build-WebAssets.ps1 -SkipPress
#>
[CmdletBinding()]
param(
  [string]$MediaRoot = 'E:\source\Unity\zombie-reality-breach\Media',
  [string]$SiteRoot = '',
  [switch]$SkipPress
)

$ErrorActionPreference = 'Stop'
# $PSScriptRoot ist in PowerShell 5.1 während der Parameter-Auswertung noch leer.
if (-not $SiteRoot) { $SiteRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path) }
$null = Get-Command magick -ErrorAction Stop

$PublicDir = Join-Path $SiteRoot 'public'
$AssetsDir = Join-Path $PublicDir 'assets'
$StoreDir  = Join-Path $MediaRoot 'Store\Meta\Final_5_Themen'
$SourceDir = Join-Path $MediaRoot 'Brand\Source\Final_5_Themen'
$LogoDir   = Join-Path $MediaRoot 'Brand\Logo'

foreach ($p in @($StoreDir, $SourceDir, $LogoDir)) {
  if (-not (Test-Path $p)) { throw "Quellordner fehlt: $p" }
}

$Themes = @(
  @{ Key = '01_Wanddurchbruch'; Slug = 'wall-breach';   Name = 'Wanddurchbruch'; Logo = 'dark' },
  @{ Key = '02_Daylight';       Slug = 'daylight';      Name = 'Daylight';       Logo = 'light' },
  @{ Key = '03_NightStation';   Slug = 'night-station'; Name = 'Night Station';  Logo = 'dark' },
  @{ Key = '04_DeadSignal';     Slug = 'dead-signal';   Name = 'Dead Signal';    Logo = 'dark' },
  @{ Key = '05_AshCity';        Slug = 'ash-city';      Name = 'Ash City';       Logo = 'dark' }
)

$WebpQuality = '82'
$JpgQuality  = '86'
$script:Written = New-Object System.Collections.Generic.List[string]

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path $Path)) { New-Item -ItemType Directory -Path $Path -Force | Out-Null }
}

function Invoke-Magick([string[]]$MagickArgs) {
  & magick @MagickArgs
  if ($LASTEXITCODE -ne 0) { throw "magick fehlgeschlagen: $($MagickArgs -join ' ')" }
  $script:Written.Add($MagickArgs[-1])
}

# Skaliert ein Bild auf mehrere Breiten. WebP für jede Breite, JPG nur für die in -JpgWidths.
function Export-Variants {
  param(
    [string]$Source,
    [string]$DestBase,
    [int[]]$Widths,
    [int[]]$JpgWidths = @(),
    [string]$Crop = ''
  )
  foreach ($w in $Widths) {
    $common = @($Source, '-strip', '-colorspace', 'sRGB')
    if ($Crop) { $common += @('-gravity', 'center', '-crop', $Crop, '+repage') }
    $common += @('-filter', 'Lanczos', '-resize', "${w}x>")
    Invoke-Magick ($common + @('-quality', $WebpQuality, '-define', 'webp:method=6', "${DestBase}_${w}.webp"))
    if ($JpgWidths -contains $w) {
      Invoke-Magick ($common + @('-quality', $JpgQuality, '-sampling-factor', '4:2:0', '-interlace', 'JPEG', "${DestBase}_${w}.jpg"))
    }
  }
}

Write-Host "Media:   $MediaRoot"
Write-Host "Website: $SiteRoot"

# ---------------------------------------------------------------------------
# 1. Favicons und App-Icons: der Marken-Totenkopf auf Ink (#180C14), quadratisch.
# ---------------------------------------------------------------------------
Write-Host '== Favicons'
$Symbol = Join-Path $StoreDir '01_Wanddurchbruch\symbol_512x512.png'
$SkullDark = Join-Path $LogoDir 'zrb_skull_on_dark.png'
$Ink = '#180C14'

Invoke-Magick @($Symbol, '-strip', '-define', 'icon:auto-resize=48,32,16', (Join-Path $PublicDir 'favicon.ico'))
foreach ($s in 16, 32, 48) {
  Invoke-Magick @($Symbol, '-strip', '-filter', 'Lanczos', '-resize', "${s}x${s}", (Join-Path $PublicDir "favicon-${s}x${s}.png"))
}
Invoke-Magick @($Symbol, '-strip', '-filter', 'Lanczos', '-resize', '180x180', (Join-Path $PublicDir 'apple-touch-icon.png'))
Invoke-Magick @($Symbol, '-strip', '-filter', 'Lanczos', '-resize', '192x192', (Join-Path $PublicDir 'icon-192.png'))
Invoke-Magick @($Symbol, '-strip', (Join-Path $PublicDir 'icon-512.png'))
# Maskable: Totenkopf in der sicheren Zone (innere 80 %) auf Ink.
Invoke-Magick @('-size', '512x512', "xc:$Ink", '(', $SkullDark, '-trim', '+repage', '-filter', 'Lanczos', '-resize', '300x300', ')', '-gravity', 'center', '-composite', '-strip', (Join-Path $PublicDir 'icon-maskable-512.png'))

$manifest = [ordered]@{
  name             = 'Zombie Reality Breach'
  short_name       = 'ZRB'
  description      = 'Zombie survival in mixed reality and VR for Meta Quest 3 and 3S.'
  start_url        = '/'
  display          = 'standalone'
  background_color = '#0b0b0d'
  theme_color      = '#0b0b0d'
  icons            = @(
    [ordered]@{ src = '/icon-192.png'; sizes = '192x192'; type = 'image/png' },
    [ordered]@{ src = '/icon-512.png'; sizes = '512x512'; type = 'image/png' },
    [ordered]@{ src = '/icon-maskable-512.png'; sizes = '512x512'; type = 'image/png'; purpose = 'maskable' }
  )
}
$manifestPath = Join-Path $PublicDir 'site.webmanifest'
[System.IO.File]::WriteAllText($manifestPath, (($manifest | ConvertTo-Json -Depth 4) + "`n"), (New-Object System.Text.UTF8Encoding($false)))
$script:Written.Add($manifestPath)

# ---------------------------------------------------------------------------
# 2. Marke: Logo, Wortmarke, Totenkopf (SVG unverändert kopiert, PNG in Web-Größen)
# ---------------------------------------------------------------------------
Write-Host '== Brand'
$BrandOut = Join-Path $AssetsDir 'brand'
Ensure-Dir $BrandOut
foreach ($n in 'zrb_logo_on_dark', 'zrb_logo_on_light', 'zrb_wordmark_on_dark', 'zrb_wordmark_on_light', 'zrb_skull_on_dark', 'zrb_skull_on_light', 'zrb_logo_mono_white', 'zrb_logo_mono_black') {
  $dest = Join-Path $BrandOut "$n.svg"
  Copy-Item (Join-Path $LogoDir "$n.svg") $dest -Force
  $script:Written.Add($dest)
}
foreach ($n in 'zrb_logo_on_dark', 'zrb_logo_on_light', 'zrb_wordmark_on_dark', 'zrb_wordmark_on_light') {
  $src = Join-Path $LogoDir "${n}_2048.png"
  foreach ($w in 2048, 1024, 512) {
    Invoke-Magick @($src, '-strip', '-filter', 'Lanczos', '-resize', "${w}x>", '-define', 'png:compression-level=9', (Join-Path $BrandOut "${n}_${w}.png"))
  }
}
foreach ($n in 'zrb_skull_on_dark', 'zrb_skull_on_light') {
  $src = Join-Path $LogoDir "$n.png"
  foreach ($h in 512, 256) {
    Invoke-Magick @($src, '-strip', '-filter', 'Lanczos', '-resize', "x${h}", '-define', 'png:compression-level=9', (Join-Path $BrandOut "${n}_${h}.png"))
  }
}
# Totenkopf auf Ink als quadratisches Signet (Avatar, Store-Symbol)
Invoke-Magick @($Symbol, '-strip', (Join-Path $BrandOut 'zrb_symbol_512.png'))

# ---------------------------------------------------------------------------
# 3. Key Art je Thema
# ---------------------------------------------------------------------------
Write-Host '== Key Art'
foreach ($t in $Themes) {
  $src = Join-Path $StoreDir $t.Key
  $raw = Join-Path $SourceDir $t.Key
  $out = Join-Path $AssetsDir ("keyart\" + $t.Slug)
  Ensure-Dir $out
  Write-Host ("   " + $t.Name)

  # hero: Reiseziel ohne Schrift, 16:9 (Hintergrund für Hero, Karten, Abschnitte)
  Export-Variants -Source (Join-Path $src 'destination_2560x1440_24bit.png') -DestBase (Join-Path $out 'hero') -Widths 2560, 1920, 1280, 800 -JpgWidths 1920
  # cover: Titelgrafik 16:9 mit Logo
  Export-Variants -Source (Join-Path $src 'cover_landscape_2560x1440.png') -DestBase (Join-Path $out 'cover') -Widths 1920, 1280 -JpgWidths 1920
  # banner: Hero 10:3 mit Logo (breite Streifen, Header)
  Export-Variants -Source (Join-Path $src 'hero_cover_3000x900.png') -DestBase (Join-Path $out 'banner') -Widths 2400, 1600 -JpgWidths 1600
  # portrait: 7:10 mit Logo (Mobil-Hero, Hochkant-Karten)
  Export-Variants -Source (Join-Path $src 'cover_portrait_1008x1440.png') -DestBase (Join-Path $out 'portrait') -Widths 1008, 504 -JpgWidths 1008
  # square: 1:1 mit Logo (Social, Kacheln)
  Export-Variants -Source (Join-Path $src 'cover_square_1440x1440.png') -DestBase (Join-Path $out 'square') -Widths 1080, 540 -JpgWidths 1080
  # clean: dieselben Motive ohne Logo, für Text-Overlays der Website
  Export-Variants -Source (Join-Path $raw 'portrait_master.png') -DestBase (Join-Path $out 'portrait-clean') -Widths 1000, 500 -JpgWidths 1000
  Export-Variants -Source (Join-Path $raw 'square_master.png') -DestBase (Join-Path $out 'square-clean') -Widths 1080, 540 -JpgWidths 1080
  Export-Variants -Source (Join-Path $raw 'hero_master.png') -DestBase (Join-Path $out 'banner-clean') -Widths 2100, 1400 -JpgWidths 1400
}

# ---------------------------------------------------------------------------
# 4. Open-Graph-Bilder 1200x630 (aus der Titelgrafik mit Logo, mittig auf 1.91:1 beschnitten)
# ---------------------------------------------------------------------------
Write-Host '== Open Graph'
$OgOut = Join-Path $AssetsDir 'og'
Ensure-Dir $OgOut
foreach ($t in $Themes) {
  $src = Join-Path $StoreDir ($t.Key + '\cover_landscape_2560x1440.png')
  Invoke-Magick @($src, '-strip', '-colorspace', 'sRGB', '-gravity', 'center', '-crop', '2560x1340+0+0', '+repage', '-filter', 'Lanczos', '-resize', '1200x630!', '-quality', '86', '-sampling-factor', '4:2:0', (Join-Path $OgOut ("og_" + $t.Slug + "_1200x630.jpg")))
}

# ---------------------------------------------------------------------------
# 5. Pressepaket (ZIP): volle Auflösung als JPG hoher Qualität, Logos als SVG und PNG
# ---------------------------------------------------------------------------
if (-not $SkipPress) {
  Write-Host '== Press kit'
  $PressOut = Join-Path $AssetsDir 'press'
  Ensure-Dir $PressOut
  $Stage = Join-Path ([System.IO.Path]::GetTempPath()) ('zrb-press-' + [guid]::NewGuid().ToString('N'))
  $Kit = Join-Path $Stage 'ZRB_Presskit'
  Ensure-Dir (Join-Path $Kit 'Logo')
  Ensure-Dir (Join-Path $Kit 'KeyArt')

  foreach ($n in 'zrb_logo_on_dark', 'zrb_logo_on_light', 'zrb_wordmark_on_dark', 'zrb_wordmark_on_light', 'zrb_skull_on_dark', 'zrb_skull_on_light') {
    Copy-Item (Join-Path $LogoDir "$n.svg") (Join-Path $Kit "Logo\$n.svg") -Force
  }
  foreach ($n in 'zrb_logo_on_dark', 'zrb_logo_on_light', 'zrb_wordmark_on_dark', 'zrb_wordmark_on_light') {
    Copy-Item (Join-Path $LogoDir "${n}_2048.png") (Join-Path $Kit "Logo\${n}_2048.png") -Force
  }
  foreach ($n in 'zrb_skull_on_dark', 'zrb_skull_on_light') {
    Copy-Item (Join-Path $LogoDir "$n.png") (Join-Path $Kit "Logo\$n.png") -Force
  }
  Copy-Item $Symbol (Join-Path $Kit 'Logo\zrb_app_icon_512.png') -Force
  Copy-Item $Symbol (Join-Path $PressOut 'zrb_app_icon_512.png') -Force
  $script:Written.Add((Join-Path $PressOut 'zrb_app_icon_512.png'))

  foreach ($t in $Themes) {
    $src = Join-Path $StoreDir $t.Key
    $dst = Join-Path $Kit ("KeyArt\" + $t.Key)
    Ensure-Dir $dst
    $pairs = @(
      @('cover_landscape_2560x1440.png',   'cover_landscape_2560x1440.jpg'),
      @('destination_2560x1440_24bit.png', 'keyart_no_logo_2560x1440.jpg'),
      @('cover_portrait_1008x1440.png',    'cover_portrait_1008x1440.jpg'),
      @('cover_square_1440x1440.png',      'cover_square_1440x1440.jpg'),
      @('hero_cover_3000x900.png',         'hero_3000x900.jpg')
    )
    foreach ($p in $pairs) {
      & magick (Join-Path $src $p[0]) -strip -colorspace sRGB -quality 92 -sampling-factor 4:4:4 (Join-Path $dst $p[1])
      if ($LASTEXITCODE -ne 0) { throw "magick fehlgeschlagen: $($p[0])" }
    }
  }

  $readme = @"
ZOMBIE REALITY BREACH - PRESS KIT
KaMa Studios - https://zombierealitybreach.com - support@zombierealitybreach.com

Logo/        Logo (ZOMBIE lettering + REALITY BREACH), wordmark, skull signet, app icon.
             *_on_dark for dark backgrounds, *_on_light for light backgrounds. SVG scales freely.
             Do not stretch, rotate, recolour or add effects. Keep clear space around it.
KeyArt/      Five key art themes: 16:9 with and without logo, 7:10 portrait, 1:1 square, 10:3 hero.

Press and content creators may use this material for reporting, videos and streams.
Monetised let's plays are welcome. Please credit "Zombie Reality Breach by KaMa Studios".
"@
  [System.IO.File]::WriteAllText((Join-Path $Kit 'README.txt'), $readme, (New-Object System.Text.UTF8Encoding($false)))

  foreach ($zip in 'zrb-presskit.zip', 'zrb-logo.zip', 'zrb-keyart.zip') {
    $zp = Join-Path $PressOut $zip
    if (Test-Path $zp) { Remove-Item $zp -Force }
  }
  Compress-Archive -Path $Kit -DestinationPath (Join-Path $PressOut 'zrb-presskit.zip') -CompressionLevel Optimal
  Compress-Archive -Path (Join-Path $Kit 'Logo'), (Join-Path $Kit 'README.txt') -DestinationPath (Join-Path $PressOut 'zrb-logo.zip') -CompressionLevel Optimal
  Compress-Archive -Path (Join-Path $Kit 'KeyArt'), (Join-Path $Kit 'README.txt') -DestinationPath (Join-Path $PressOut 'zrb-keyart.zip') -CompressionLevel Optimal
  foreach ($zip in 'zrb-presskit.zip', 'zrb-logo.zip', 'zrb-keyart.zip') { $script:Written.Add((Join-Path $PressOut $zip)) }
  Remove-Item $Stage -Recurse -Force
}

# ---------------------------------------------------------------------------
# 6. Manifest aller erzeugten Dateien
# ---------------------------------------------------------------------------
Write-Host '== Manifest'
$entries = @()
foreach ($f in ($script:Written | Sort-Object -Unique)) {
  $fi = Get-Item $f
  $rel = $fi.FullName.Substring($PublicDir.Length + 1) -replace '\\', '/'
  $entry = [ordered]@{ path = "/$rel"; bytes = $fi.Length }
  if ($fi.Extension -match '^\.(png|jpg|webp|ico)$') {
    $dim = (& magick identify -format '%w %h' ($fi.FullName + '[0]')) -split ' '
    $entry.width = [int]$dim[0]
    $entry.height = [int]$dim[1]
  }
  $entries += [pscustomobject]$entry
}
$total = ($entries | Measure-Object -Property bytes -Sum).Sum
$doc = [ordered]@{
  generated = (Get-Date).ToString('yyyy-MM-dd')
  source    = 'E:/source/Unity/zombie-reality-breach/Media (Store/Meta/Final_5_Themen, Brand/Source/Final_5_Themen, Brand/Logo)'
  script    = 'scripts/Build-WebAssets.ps1'
  themes    = @($Themes | ForEach-Object { [ordered]@{ slug = $_.Slug; name = $_.Name; source = $_.Key; logo = $_.Logo } })
  totalBytes = $total
  files     = $entries
}
# Unter src, nicht public: Vite erlaubt keine Importe aus public, die Presseseite liest die Dateigrößen daraus.
$mp = Join-Path $SiteRoot 'src\content\asset-manifest.json'
[System.IO.File]::WriteAllText($mp, (($doc | ConvertTo-Json -Depth 5) + "`n"), (New-Object System.Text.UTF8Encoding($false)))

Write-Host ("Fertig: {0} Dateien, {1:N1} MB unter {2}" -f $entries.Count, ($total / 1MB), $PublicDir)
