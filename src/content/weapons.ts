/**
 * Arsenal content. Source of truth is the game: ArmoryCatalog.cs (wave gates and unlock prices), BreakPanel.cs and
 * ShopSetup.cs (shop prices, mods, supplies), WeaponMods.cs (which mod fits which gun), AmmoInventory.cs (ammo and
 * magazine upgrades), Docs/WEAPONS_PLAN.md (magazines, handling). Pictures are renders of the game's own models
 * (scripts/Build-WeaponImages.ps1 -> public/assets/weapons/<id>_{600,1200}.webp).
 */

export type WeaponClass = 'pistol' | 'melee' | 'smg' | 'shotgun' | 'rifle' | 'special';

export interface Weapon {
  /** Also the file name of the render in public/assets/weapons. */
  id: string;
  name: string;
  cls: WeaponClass;
  type: string;
  typeDe: string;
  desc: string;
  descDe: string;
  /** In the belt from the first wave on. */
  starter?: boolean;
  /** Armory unlock: best wave ever reached and the one-time price from the money account. */
  armory?: { wave: number; cost: number };
  /** Price in the break shop once unlocked (undefined for starter weapons). */
  shop?: number;
  /** Magazine, cylinder, tube or tank. */
  mag?: string;
  magDe?: string;
  /** How it is handled in VR. */
  handling: string;
  handlingDe: string;
  /** Pistols and the revolver: ammo is free (unlimited on Easy, reserve and pickups on Hard). */
  freeAmmo?: boolean;
  /** No render yet. */
  noImage?: boolean;
}

export const weapons: Weapon[] = [
  // ---- Starters -----------------------------------------------------------------------------------------------
  {
    id: 'a3500x', name: 'A3500X', cls: 'pistol', type: 'Pistol', typeDe: 'Pistole', starter: true, freeAmmo: true,
    desc: 'Reliable sidearm, the starter pistol. Free ammo on every difficulty.',
    descDe: 'Zuverlässige Seitenwaffe, die Startpistole. Freie Munition auf jeder Schwierigkeit.',
    mag: '12 rounds (Mag+ 16, 20)', magDe: '12 Schuss (Mag+ 16, 20)',
    handling: 'Drop the magazine, grab a fresh one from your chest, seat it, rack the slide.',
    handlingDe: 'Magazin raus, neues von der Brust greifen, einsetzen, Schlitten durchladen.',
  },
  {
    id: 'bat', name: 'Baseball Bat', cls: 'melee', type: 'Melee · swing', typeDe: 'Nahkampf · Schwung', starter: true,
    desc: 'Wooden bat, always in the belt. Damage follows the speed of your swing.',
    descDe: 'Holzschläger, immer am Gürtel. Der Schaden folgt dem Tempo deines Schwungs.',
    handling: 'One or two hands. Swing hard: a lazy swing barely tickles.',
    handlingDe: 'Ein- oder zweihändig. Richtig ausholen: ein lascher Schlag kitzelt nur.',
  },
  // ---- Armory, cheapest first ------------------------------------------------------------------------------
  {
    id: 'crowbar', name: 'Crowbar', cls: 'melee', type: 'Melee · swing', typeDe: 'Nahkampf · Schwung',
    armory: { wave: 3, cost: 1000 }, shop: 80,
    desc: 'Fast, hard, and it opens the loot crates at the gas station.',
    descDe: 'Schnell, hart, und sie öffnet die Beutekisten an der Tankstelle.',
    handling: 'Quick swings, never gets stuck.', handlingDe: 'Schnelle Schläge, bleibt nie stecken.',
  },
  {
    id: 'machete', name: 'Machete', cls: 'melee', type: 'Melee · cut', typeDe: 'Nahkampf · Schnitt',
    armory: { wave: 5, cost: 1500 }, shop: 120,
    desc: 'Quick cuts that take hands and feet. Too weak a chop and the blade sticks in the bone.',
    descDe: 'Schnelle Schnitte, die Hände und Füße nehmen. Zu schwach gehauen, bleibt die Klinge im Knochen stecken.',
    handling: 'One-handed blade. Full swings cut through; weak ones get stuck and must be torn free.',
    handlingDe: 'Einhändige Klinge. Volle Hiebe trennen ab, schwache bleiben stecken und müssen herausgerissen werden.',
  },
  {
    id: 'pistol-92', name: 'Pistol 92', cls: 'pistol', type: 'Pistol', typeDe: 'Pistole', freeAmmo: true,
    armory: { wave: 5, cost: 2500 }, shop: 150,
    desc: 'Second pistol with 24-round magazines. Free ammo, like every pistol.',
    descDe: 'Zweite Pistole mit 24-Schuss-Magazinen. Freie Munition, wie jede Pistole.',
    mag: '24 rounds (Mag+ 30, 36)', magDe: '24 Schuss (Mag+ 30, 36)',
    handling: 'Same drill as the A3500X: magazine, seat, rack.', handlingDe: 'Wie die A3500X: Magazin, einsetzen, durchladen.',
  },
  {
    id: 'katana', name: 'Katana', cls: 'melee', type: 'Melee · cut (two-handed)', typeDe: 'Nahkampf · Schnitt (zweihändig)',
    armory: { wave: 10, cost: 3500 }, shop: 200,
    desc: 'Takes off limbs; legless zombies keep crawling. Two hands on the grip deal 1.5× damage.',
    descDe: 'Trennt Gliedmaßen ab; beinlose Zombies kriechen weiter. Zwei Hände am Griff machen 1,5× Schaden.',
    handling: 'Sharp blade that glides through; sticks only on half-hearted chops.',
    handlingDe: 'Scharfe Klinge, die durchgleitet; bleibt nur bei halbherzigen Hieben stecken.',
  },
  {
    id: 'revolver', name: 'Revolver .357', cls: 'pistol', type: 'Revolver', typeDe: 'Revolver', freeAmmo: true,
    armory: { wave: 10, cost: 4000 }, shop: 220,
    desc: 'Six heavy rounds. Swing the cylinder out and load them one by one, or all at once with the speedloader.',
    descDe: 'Sechs schwere Patronen. Trommel ausschwenken und einzeln laden, oder alle auf einmal mit dem Speedloader.',
    mag: '6 rounds, no Mag+', magDe: '6 Patronen, kein Mag+',
    handling: 'Precision instead of volume: high damage, slow rate, small cylinder.',
    handlingDe: 'Präzision statt Masse: hoher Schaden, langsamer Takt, kleine Trommel.',
  },
  {
    id: 'fire-axe', name: 'Fire Axe', cls: 'melee', type: 'Melee · swing + cut', typeDe: 'Nahkampf · Schwung + Schnitt',
    armory: { wave: 12, cost: 4500 }, shop: 180,
    desc: 'Cuts and crushes. Slow, and it sticks in bone more often than any other blade.',
    descDe: 'Schneidet und zertrümmert. Langsam, und sie bleibt öfter im Knochen stecken als jede andere Klinge.',
    handling: 'Heavy two-handed swings; with the Head Weight mod every hit staggers.',
    handlingDe: 'Schwere zweihändige Hiebe; mit dem Kopfgewicht bringt jeder Treffer aus dem Gleichgewicht.',
  },
  {
    id: 'uzi', name: 'Uzi', cls: 'smg', type: 'SMG', typeDe: 'Maschinenpistole',
    armory: { wave: 15, cost: 5000 }, shop: 250,
    desc: 'Full auto, 32 rounds, fine in one hand.',
    descDe: 'Vollautomatisch, 32 Schuss, auch einhändig gut.',
    mag: '32 rounds (Mag+ 40, 50)', magDe: '32 Schuss (Mag+ 40, 50)',
    handling: 'Pistol drill with full auto; the SMG stock tightens the spread in two hands.',
    handlingDe: 'Pistolenablauf mit Dauerfeuer; die Schulterstütze verengt die Streuung zweihändig.',
  },
  {
    id: 'desert-eagle', name: 'Desert Eagle .50', cls: 'pistol', type: 'Pistol', typeDe: 'Pistole', freeAmmo: true,
    armory: { wave: 16, cost: 5500 }, shop: 320,
    desc: 'Seven .50 rounds. The one handgun that opens skulls.',
    descDe: 'Sieben .50-Patronen. Die einzige Faustfeuerwaffe, die Schädel öffnet.',
    mag: '7 rounds (Mag+ 11, 14)', magDe: '7 Schuss (Mag+ 11, 14)',
    handling: 'Slow, heavy pistol; every hit counts.', handlingDe: 'Langsame, schwere Pistole; jeder Treffer zählt.',
  },
  {
    id: 'sawed-off', name: 'Sawed-off', cls: 'shotgun', type: 'Shotgun · break action', typeDe: 'Schrotflinte · Knicklauf',
    armory: { wave: 18, cost: 6000 }, shop: 280,
    desc: 'Two barrels in one hand. Brutal up close.',
    descDe: 'Zwei Läufe in einer Hand. Brutal auf kurze Distanz.',
    mag: '2 shells', magDe: '2 Patronen',
    handling: 'Flick it open, drop two shells in by hand, snap it shut.',
    handlingDe: 'Aufknicken, zwei Patronen per Hand einlegen, zuschnappen.',
  },
  {
    id: 'mp5', name: 'MP5', cls: 'smg', type: 'SMG', typeDe: 'Maschinenpistole',
    armory: { wave: 20, cost: 7500 }, shop: 300,
    desc: 'Full auto, 30 rounds, steady and accurate.',
    descDe: 'Vollautomatisch, 30 Schuss, ruhig und präzise.',
    mag: '30 rounds (Mag+ 40, 50)', magDe: '30 Schuss (Mag+ 40, 50)',
    handling: 'Magazine and charging handle are separate parts; takes foregrip, stock, suppressor and bayonet.',
    handlingDe: 'Magazin und Spannhebel sind eigene Teile; nimmt Vordergriff, Stütze, Schalldämpfer und Bajonett.',
  },
  {
    id: 'sledgehammer', name: 'Sledgehammer', cls: 'melee', type: 'Melee · swing', typeDe: 'Nahkampf · Schwung',
    armory: { wave: 22, cost: 8000 }, shop: 220,
    desc: 'Very slow. Knocks even a brute over.',
    descDe: 'Sehr langsam. Wirft sogar einen Brute um.',
    handling: 'Two hands, long wind-up, biggest single hit of all melee weapons.',
    handlingDe: 'Zwei Hände, langes Ausholen, der härteste Einzeltreffer aller Nahkampfwaffen.',
  },
  {
    id: 'double-barrel', name: 'Double Barrel', cls: 'shotgun', type: 'Shotgun · break action', typeDe: 'Schrotflinte · Knicklauf',
    armory: { wave: 25, cost: 10000 }, shop: 350,
    desc: 'Wide spread, massive damage, two shots.',
    descDe: 'Breite Streuung, massiver Schaden, zwei Schuss.',
    mag: '2 shells', magDe: '2 Patronen',
    handling: 'Break it open, load the shells by hand, close it with a flick.',
    handlingDe: 'Aufbrechen, Patronen per Hand laden, mit einem Ruck schließen.',
  },
  {
    id: 'lever-action', name: 'Lever-Action', cls: 'rifle', type: 'Rifle · lever', typeDe: 'Gewehr · Unterhebel',
    armory: { wave: 28, cost: 12000 }, shop: 420,
    desc: 'Eight heavy rifle rounds, loaded one by one. Takes the 2× scope.',
    descDe: 'Acht schwere Gewehrpatronen, einzeln geladen. Nimmt das Zielfernrohr 2×.',
    mag: '8 rounds (Mag+ 10, 12)', magDe: '8 Patronen (Mag+ 10, 12)',
    handling: 'Feed the tube round by round; the lever swings on its own after every shot.',
    handlingDe: 'Röhrenmagazin Patrone für Patrone füllen; der Hebel schwingt nach jedem Schuss von selbst.',
  },
  {
    id: 'pump-shotgun', name: 'Pump Shotgun', cls: 'shotgun', type: 'Shotgun · pump', typeDe: 'Schrotflinte · Pumpe',
    armory: { wave: 30, cost: 14000 }, shop: 400,
    desc: 'Six shells, pump after every shot.',
    descDe: 'Sechs Patronen, nach jedem Schuss pumpen.',
    mag: '6 shells (Mag+ 8, 10)', magDe: '6 Patronen (Mag+ 8, 10)',
    handling: 'Shells go into the tube one at a time; the pump is a real pull.',
    handlingDe: 'Patronen einzeln in den Röhrenlader; die Pumpe ist ein echter Zug.',
  },
  {
    id: 'bolt-rifle', name: 'Bolt Rifle', cls: 'rifle', type: 'Rifle · bolt action', typeDe: 'Gewehr · Repetierer',
    armory: { wave: 32, cost: 16000 }, shop: 500,
    desc: 'Five rounds. A headshot drops walkers and runners on the spot. Built for the distances at the gas station.',
    descDe: 'Fünf Patronen. Ein Kopfschuss legt Walker und Runner sofort um. Gebaut für die Distanzen an der Tankstelle.',
    mag: '5 rounds (Mag+ 8)', magDe: '5 Patronen (Mag+ 8)',
    handling: 'Work the bolt between shots; takes the 2× scope and a suppressor.',
    handlingDe: 'Zwischen den Schüssen repetieren; nimmt Zielfernrohr 2× und Schalldämpfer.',
  },
  {
    id: 'ak-47', name: 'AK-47', cls: 'rifle', type: 'Assault rifle', typeDe: 'Sturmgewehr',
    armory: { wave: 35, cost: 20000 }, shop: 450,
    desc: 'Assault rifle, 30 rounds, full auto.',
    descDe: 'Sturmgewehr, 30 Schuss, Vollautomatik.',
    mag: '30 rounds (Mag+ 40, 45)', magDe: '30 Schuss (Mag+ 40, 45)',
    handling: 'Two hands for accuracy; one-handed the spread opens up.',
    handlingDe: 'Zwei Hände für Präzision; einhändig geht die Streuung auf.',
  },
  {
    id: 'chainsaw', name: 'Chainsaw', cls: 'special', type: 'Melee · running chain', typeDe: 'Nahkampf · laufende Kette',
    armory: { wave: 38, cost: 25000 }, shop: 600,
    desc: 'The chain cuts through anything. Loud: at the gas station the noise draws the dead.',
    descDe: 'Die Kette geht durch alles. Laut: an der Tankstelle lockt der Lärm die Toten an.',
    mag: 'Tank: 60 s at full revs, fuel in the shop', magDe: 'Tank: 60 s bei Vollgas, Sprit im Shop',
    handling: 'Trigger starts the motor. Hold the blade against them; the flashlight clips on too.',
    handlingDe: 'Der Abzug startet den Motor. Das Schwert dranhalten; die Taschenlampe passt auch dran.',
  },
  {
    id: 'auto-shotgun', name: 'Auto Shotgun', cls: 'shotgun', type: 'Shotgun · full auto', typeDe: 'Schrotflinte · Vollautomatik',
    armory: { wave: 40, cost: 30000 }, shop: 700,
    desc: 'Full auto, 12 shells in the tube. The top of the shotgun ladder.',
    descDe: 'Vollautomatisch, 12 Patronen im Rohr. Die Spitze der Schrotflinten-Leiter.',
    mag: '12 shells (Mag+ 16, 20)', magDe: '12 Patronen (Mag+ 16, 20)',
    handling: 'Fill the tube shell by shell, then hold the trigger.',
    handlingDe: 'Rohr Patrone für Patrone füllen, dann den Abzug halten.',
  },
  {
    id: 'lmg', name: 'LMG M249', cls: 'rifle', type: 'Light machine gun', typeDe: 'Leichtes Maschinengewehr',
    armory: { wave: 45, cost: 40000 }, shop: 900,
    desc: '100-round box, full auto. Two hands only; the last unlock of the Armory.',
    descDe: '100er-Kasten, Dauerfeuer. Nur zweihändig; die letzte Freischaltung des Arsenals.',
    mag: '100-round box (Mag+ 150, 200)', magDe: '100er-Kasten (Mag+ 150, 200)',
    handling: 'Lift the feed cover with your free hand, seat a new box, snap the cover shut. One-handed the spread is five times wider.',
    handlingDe: 'Zuführdeckel mit der freien Hand anheben, neuen Kasten ansetzen, Deckel zuschnappen. Einhändig streut es fünfmal so breit.',
  },
  // ---- Shop only (no Armory unlock) ---------------------------------------------------------------------------
  {
    id: 'flare-gun', name: 'Flare Gun', cls: 'special', type: 'Signal pistol · break action', typeDe: 'Signalpistole · Knicklauf', shop: 100,
    desc: 'One chamber. Little damage, but the burning flare pulls the dead away from you.',
    descDe: 'Eine Kammer. Wenig Schaden, aber die brennende Fackel zieht die Toten von dir weg.',
    mag: '1 flare, no pouch', magDe: '1 Leuchtpatrone, keine Tasche',
    handling: 'Break open, drop the flare in, close.', handlingDe: 'Aufknicken, Leuchtpatrone einlegen, schließen.',
  },
  {
    id: 'molotov', name: 'Molotov', cls: 'special', type: 'Throwable', typeDe: 'Wurfwaffe', shop: 60,
    desc: 'Throw it: the ground burns for ten seconds.',
    descDe: 'Werfen: Der Boden brennt zehn Sekunden lang.',
    mag: 'Hip pouch: 1 (Pouch+ 2, 3)', magDe: 'Hüfttasche: 1 (Tasche+ 2, 3)',
    handling: 'Grab from the hip pouch and throw.', handlingDe: 'Aus der Hüfttasche greifen und werfen.',
  },
  {
    id: 'pipe-bomb', name: 'Pipe Bomb', cls: 'special', type: 'Throwable', typeDe: 'Wurfwaffe', shop: 90,
    desc: 'Throw it: it goes off 2.5 seconds later and takes everything within four and a half metres.',
    descDe: 'Werfen: Sie geht nach 2,5 Sekunden hoch und nimmt alles im Umkreis von viereinhalb Metern mit.',
    mag: 'Hip pouch: 1 (Pouch+ 2, 3)', magDe: 'Hüfttasche: 1 (Tasche+ 2, 3)',
    handling: 'Grab from the hip pouch and throw.', handlingDe: 'Aus der Hüfttasche greifen und werfen.',
  },
];

export const weaponClasses: { id: WeaponClass | 'all'; en: string; de: string }[] = [
  { id: 'all', en: 'All', de: 'Alle' },
  { id: 'pistol', en: 'Pistols', de: 'Pistolen' },
  { id: 'smg', en: 'SMGs', de: 'Maschinenpistolen' },
  { id: 'shotgun', en: 'Shotguns', de: 'Schrotflinten' },
  { id: 'rifle', en: 'Rifles', de: 'Gewehre' },
  { id: 'melee', en: 'Melee', de: 'Nahkampf' },
  { id: 'special', en: 'Special', de: 'Spezial' },
];

/** Weapon names by id, for the mod fit lists. */
export const weaponName = Object.fromEntries(weapons.map((w) => [w.id, w.name])) as Record<string, string>;

export interface Mod {
  id: string;
  name: string;
  nameDe: string;
  price: number;
  effect: string;
  effectDe: string;
  /** Weapon ids, or 'guns' for every firearm. */
  fits: string[] | 'guns';
  /** Extra non-gun it clips on. */
  fitsAlso?: string[];
  /** Render in public/assets/weapons, when the mod has a model of its own. */
  image?: string;
}

const GUNS_ALL = 'guns' as const;

/** Grabbable attachments. Bought in the break shop, held against the weapon, removed again with the free hand. */
export const mods: Mod[] = [
  { id: 'laser-red', name: 'Red Laser', nameDe: 'Roter Laser', price: 100, fits: GUNS_ALL, image: 'laser',
    effect: 'Dot shows the hit; spread −30 % while switched on.', effectDe: 'Der Punkt zeigt den Treffer; Streuung −30 %, solange er an ist.' },
  { id: 'laser-green', name: 'Green Laser', nameDe: 'Grüner Laser', price: 150, fits: GUNS_ALL, image: 'laser',
    effect: 'Same as red, brighter beam, visible in daylight.', effectDe: 'Wie rot, hellerer Strahl, auch bei Tag sichtbar.' },
  { id: 'flashlight', name: 'Flashlight', nameDe: 'Waffenlicht', price: 120, fits: GUNS_ALL, fitsAlso: ['chainsaw'],
    effect: 'Clips on any gun or the chainsaw. Free hand: trigger switches, grip removes.', effectDe: 'Passt an jede Schusswaffe und die Kettensäge. Freie Hand: Abzug schaltet, Griff nimmt ab.' },
  { id: 'bayonet', name: 'Bayonet', nameDe: 'Bajonett', price: 160, image: 'bayonet',
    fits: ['uzi', 'mp5', 'double-barrel', 'pump-shotgun', 'lever-action', 'ak-47', 'bolt-rifle', 'auto-shotgun', 'lmg'],
    effect: 'Knife under the muzzle; thrust to stab. A weak stab into ribs sticks, gun and all.', effectDe: 'Messer unter der Mündung; stoßen statt schlagen. Ein schwacher Stich in Rippen bleibt stecken, samt Waffe.' },
  { id: 'red-dot', name: 'Red Dot', nameDe: 'Rotpunkt', price: 180,
    fits: ['a3500x', 'pistol-92', 'revolver', 'desert-eagle', 'uzi', 'mp5', 'pump-shotgun', 'lever-action', 'ak-47', 'bolt-rifle', 'auto-shotgun', 'lmg'],
    effect: 'Sight on top; spread −30 %, no laser needed.', effectDe: 'Visier oben; Streuung −30 %, kein Laser nötig.' },
  { id: 'foregrip', name: 'Foregrip', nameDe: 'Vordergriff', price: 150,
    fits: ['uzi', 'mp5', 'pump-shotgun', 'ak-47', 'auto-shotgun', 'lmg'],
    effect: 'No one-handed spread penalty, 20 % less kick.', effectDe: 'Keine Streustrafe einhändig, 20 % weniger Rückstoß.' },
  { id: 'stock', name: 'SMG Stock', nameDe: 'Schulterstütze', price: 130, fits: ['uzi', 'mp5'],
    effect: 'Spread −25 % in two hands.', effectDe: 'Streuung −25 % zweihändig.' },
  { id: 'suppressor', name: 'Suppressor', nameDe: 'Schalldämpfer', price: 220,
    fits: ['a3500x', 'pistol-92', 'uzi', 'mp5', 'ak-47', 'bolt-rifle'],
    effect: 'Noise radius −70 %: at the gas station far fewer dead come running. Damage −5 %.', effectDe: 'Lärmradius −70 %: an der Tankstelle kommen viel weniger Tote gelaufen. Schaden −5 %.' },
  { id: 'choke', name: 'Choke', nameDe: 'Choke', price: 170,
    fits: ['sawed-off', 'double-barrel', 'pump-shotgun', 'auto-shotgun'],
    effect: 'Tighter pattern (−35 %), 15 % more reach.', effectDe: 'Engere Streuung (−35 %), 15 % mehr Reichweite.' },
  { id: 'muzzle-brake', name: 'Muzzle Brake', nameDe: 'Mündungsbremse', price: 200, fits: ['ak-47', 'bolt-rifle', 'lmg'],
    effect: 'Fires 10 % faster.', effectDe: 'Schießt 10 % schneller.' },
  { id: 'long-barrel', name: 'Long Barrel', nameDe: 'Verlängerter Lauf', price: 190,
    fits: ['a3500x', 'pistol-92', 'revolver', 'lever-action', 'ak-47', 'bolt-rifle'],
    effect: 'Range +30 %, damage +8 %.', effectDe: 'Reichweite +30 %, Schaden +8 %.' },
  { id: 'scope', name: 'Scope 2×', nameDe: 'Zielfernrohr 2×', price: 250, fits: ['lever-action', 'bolt-rifle'], image: 'scope',
    effect: 'Magnification for the gas station; spread −30 %. The glass only renders while an eye is at the eyepiece.', effectDe: 'Vergrößerung für die Tankstelle; Streuung −30 %. Das Glas rechnet nur, solange ein Auge am Okular ist.' },
  { id: 'speedloader', name: 'Speedloader', nameDe: 'Speedloader', price: 120, fits: ['revolver'], image: 'speedloader',
    effect: 'The ammo pouch hands you six rounds at once; hold them to the open cylinder.', effectDe: 'Die Patronentasche gibt sechs Patronen auf einmal; an die offene Trommel halten.' },
  { id: 'nails', name: 'Nails', nameDe: 'Nägel', price: 110, fits: ['bat', 'crowbar'],
    effect: 'Nails or barbed wire: wounds bleed on.', effectDe: 'Nägel oder Stacheldraht: Wunden bluten nach.' },
  { id: 'grip-tape', name: 'Grip Tape', nameDe: 'Griffband', price: 90,
    fits: ['bat', 'crowbar', 'machete', 'katana', 'fire-axe', 'sledgehammer'],
    effect: 'Swings 15 % faster.', effectDe: 'Schwingt 15 % schneller.' },
  { id: 'serrated', name: 'Saw Teeth', nameDe: 'Gezahnte Klinge', price: 140, fits: ['machete', 'katana', 'fire-axe'],
    effect: 'Limbs come off 15 % easier.', effectDe: 'Gliedmaßen gehen 15 % leichter ab.' },
  { id: 'head-weight', name: 'Head Weight', nameDe: 'Kopfgewicht', price: 160, fits: ['fire-axe', 'sledgehammer'],
    effect: 'Every hit knocks them off balance, bloaters included.', effectDe: 'Jeder Schlag bringt sie aus dem Gleichgewicht, auch Bloater.' },
];

export interface Supply {
  id: string;
  name: string;
  nameDe: string;
  price: string;
  priceDe: string;
  desc: string;
  descDe: string;
  image?: string;
}

/** Consumables and gear from the SUPPLIES tab of the break shop. */
export const supplies: Supply[] = [
  { id: 'pain-pills', name: 'Pain Pills', nameDe: 'Schmerztabletten', price: '90 $', priceDe: '90 $', image: 'pain-pills',
    desc: 'One pill for the bottle on your chest. Hold it to your mouth to heal half your health.', descDe: 'Eine Pille für das Fläschchen an der Brust. Zum Mund halten heilt die halbe Gesundheit.' },
  { id: 'ammo', name: 'Ammo', nameDe: 'Munition', price: '≈ 12 % of the gun, min. 15 $', priceDe: '≈ 12 % des Waffenpreises, mind. 15 $',
    desc: 'One full magazine or one fill of shells per purchase, up to three spares per gun. Break-action guns pay 5 %. Pistols and the revolver never pay: unlimited on Easy, reserve plus pickups on Hard.',
    descDe: 'Ein volles Magazin oder eine Füllung Patronen je Kauf, höchstens drei Reserven pro Waffe. Knicklaufwaffen zahlen 5 %. Pistolen und Revolver zahlen nie: unbegrenzt auf Easy, Reserve plus Pickups auf Hard.' },
  { id: 'mag-plus', name: 'Mag+ I / II', nameDe: 'Mag+ I / II', price: '60 to 600 $', priceDe: '60 bis 600 $',
    desc: 'Bigger magazines, two steps per gun (see the magazine line of each weapon). Never more damage, only more time between reloads.',
    descDe: 'Größere Magazine, zwei Stufen je Waffe (siehe Magazinzeile der Waffe). Nie mehr Schaden, nur mehr Zeit zwischen dem Nachladen.' },
  { id: 'fuel', name: 'Chainsaw Fuel', nameDe: 'Kettensägen-Sprit', price: '40 $', priceDe: '40 $',
    desc: 'A full tank: 60 seconds at full revs.', descDe: 'Ein voller Tank: 60 Sekunden bei Vollgas.' },
  { id: 'pouch', name: 'Molotov / Pipe Bomb Pouch+', nameDe: 'Molotow- / Rohrbomben-Tasche+', price: '50 $ per step', priceDe: '50 $ je Stufe',
    desc: 'Room for one more in the hip pouch, two steps: 1 → 2 → 3.', descDe: 'Platz für eine mehr in der Hüfttasche, zwei Stufen: 1 → 2 → 3.' },
  { id: 'boards', name: 'Boards', nameDe: 'Bretter', price: '40 $ for 2', priceDe: '40 $ für 2',
    desc: 'Nail them across a real doorway (Reality Breach) or the windows of the shop (Safe Zone, Gas Station).', descDe: 'Über eine echte Tür nageln (Reality Breach) oder vor die Fenster des Shops (Safe Zone, Gas Station).' },
  { id: 'headlamp', name: 'Headlamp', nameDe: 'Stirnlampe', price: '150 $ (Armory: 500 $ or wave 30)', priceDe: '150 $ (Arsenal: 500 $ oder Welle 30)',
    desc: 'A lamp on your forehead that recharges in the breaks. Grip it with a free hand to switch. Starting gear in OUTBREAK.', descDe: 'Eine Lampe an der Stirn, lädt in den Pausen nach. Mit der freien Hand greifen schaltet sie. In OUTBREAK Startausrüstung.' },
];

/** The Armory ladder: wave gate and one-time price, cheapest first (ArmoryCatalog.cs). */
export const armoryLadder = weapons
  .filter((w) => w.armory)
  .sort((a, b) => a.armory!.wave - b.armory!.wave || a.armory!.cost - b.armory!.cost);
