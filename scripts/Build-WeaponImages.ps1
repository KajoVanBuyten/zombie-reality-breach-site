<#
.SYNOPSIS
  Rendert die Waffen- und Mod-Modelle des Spiels mit Blender und legt sie als Web-Bilder unter public/assets/weapons ab.

.DESCRIPTION
  Schritt 1: scripts/render_weapons.py (Blender headless) rendert jedes Modell aus scripts/weapon_renders.json als
  PNG mit Alphakanal (1600x900) in einen Zwischenordner.
  Schritt 2: ImageMagick schneidet den transparenten Rand weg, passt das Motiv in 88 % x 80 % eines 16:9-Felds ein
  (gleiche Luft bei jedem Modell, nichts abgeschnitten) und schreibt WebP mit Alphakanal in zwei Breiten
  (<slug>_1200.webp, <slug>_600.webp).

  Benötigt Blender 4.5 und ImageMagick 7 (magick) im PATH.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/Build-WeaponImages.ps1
  powershell -ExecutionPolicy Bypass -File scripts/Build-WeaponImages.ps1 -SkipRender   # nur neu exportieren
#>
[CmdletBinding()]
param(
  [string]$Blender = 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe',
  [string]$SiteRoot = '',
  [string]$RenderDir = '',
  [switch]$SkipRender
)

$ErrorActionPreference = 'Stop'
if (-not $SiteRoot) { $SiteRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path) }
if (-not $RenderDir) { $RenderDir = Join-Path $SiteRoot 'build\weapon-renders' }
$null = Get-Command magick -ErrorAction Stop
$Config = Join-Path $SiteRoot 'scripts\weapon_renders.json'
$Script = Join-Path $SiteRoot 'scripts\render_weapons.py'
$OutDir = Join-Path $SiteRoot 'public\assets\weapons'
if (-not (Test-Path $RenderDir)) { New-Item -ItemType Directory -Path $RenderDir -Force | Out-Null }
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

if (-not $SkipRender) {
  if (-not (Test-Path $Blender)) { throw "Blender nicht gefunden: $Blender" }
  Write-Host "== Blender rendert nach $RenderDir"
  & $Blender -b --factory-startup --python $Script -- $Config $RenderDir
  if ($LASTEXITCODE -ne 0) { throw "Blender-Render fehlgeschlagen (Exit $LASTEXITCODE)" }
}

Write-Host "== Export nach $OutDir"
$items = (Get-Content $Config -Raw -Encoding UTF8 | ConvertFrom-Json).items
$count = 0
foreach ($prop in $items.PSObject.Properties) {
  $slug = $prop.Name
  $png = Join-Path $RenderDir "$slug.png"
  if (-not (Test-Path $png)) { throw "Render fehlt: $png" }
  foreach ($w in 1200, 600) {
    $h = [int][math]::Round($w * 9 / 16)
    $boxW = [int][math]::Round($w * 0.88)
    $boxH = [int][math]::Round($h * 0.80)
    $dest = Join-Path $OutDir ("{0}_{1}.webp" -f $slug, $w)
    # Rand wegschneiden, in das Feld einpassen (nur verkleinern), mittig in 16:9 setzen.
    & magick $png -trim +repage -filter Lanczos -resize "${boxW}x${boxH}>" -background none -gravity center -extent "${w}x${h}" -define webp:method=6 -define webp:alpha-quality=90 -quality 85 $dest
    if ($LASTEXITCODE -ne 0) { throw "magick fehlgeschlagen: $slug" }
    $count++
  }
}
Write-Host ("Fertig: {0} Dateien unter {1}" -f $count, $OutDir)
