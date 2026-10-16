import { keyArtThemes, type KeyArtTheme } from '@/lib/site';

/**
 * Mode content. Source of truth: Docs/GAME_DESIGN.md, Docs/RIFT_DESIGN.md, Docs/VR_GAME_DESIGN.md and the code
 * (WaveScaling, Difficulty assets, RiftUpgrades.cs, ZombieKind.cs, LocalSession.cs) as of 16 October 2026.
 */

export type ModeStatus = 'playable' | 'inDev';

export interface SubMode {
  id: 'rooftop' | 'safe-zone' | 'gas-station';
  name: string;
  status: ModeStatus;
  players: string;
  playersDe: string;
  desc: string;
  descDe: string;
  points: { en: string; de: string }[];
}

export interface ModeFamily {
  id: 'reality-breach' | 'rift' | 'outbreak';
  name: string;
  kind: string;
  kindDe: string;
  /** Key-art theme (public/assets/keyart/<theme>) used as the header picture. */
  theme: KeyArtTheme;
  imageAlt: string;
  short: string;
  shortDe: string;
  desc: string;
  descDe: string;
  tags: string[];
  tagsDe: string[];
  points: { en: string; de: string }[];
  subModes?: SubMode[];
}

export const modeFamilies: ModeFamily[] = [
  {
    id: 'reality-breach',
    name: 'Reality Breach',
    kind: 'Mixed reality · room scan',
    kindDe: 'Mixed Reality · Raumscan',
    theme: keyArtThemes.realityBreach,
    imageAlt: 'A zombie tears through the wall of a living room',
    short: 'Zombies break through your real doors.',
    shortDe: 'Zombies brechen durch deine echten Türen.',
    desc: 'Your room, your doors, your fight. The game reads your room scan and turns your real doors into breach points. You hear the knocking, the door bends with every blow, and then it breaks out of its hinges. The waves never end; the run ends with you. Between waves you buy weapons, ammo, mods and supplies in the break shop; the Armory unlocks new weapons for good.',
    descDe: 'Dein Raum, deine Türen, dein Kampf. Das Spiel liest deinen Raumscan und macht deine echten Türen zu Durchbruchstellen. Du hörst das Klopfen, die Tür biegt sich mit jedem Schlag, und dann bricht sie aus den Angeln. Die Wellen enden nie; der Lauf endet mit dir. Zwischen den Wellen kaufst du im Pausenshop Waffen, Munition, Aufsätze und Vorräte; das Arsenal schaltet neue Waffen dauerhaft frei.',
    tags: ['Solo', 'Co-op up to 4, same room', 'Room scan', 'Easy / Hard'],
    tagsDe: ['Solo', 'Co-op bis 4, im selben Raum', 'Raumscan', 'Easy / Hard'],
    points: [
      { en: 'Detected doors come first; you can measure, move, add or remove them. No door detected? Place one by hand.', de: 'Erkannte Türen zuerst; du kannst sie vermessen, verschieben, hinzufügen oder entfernen. Keine Tür erkannt? Dann setzt du eine von Hand.' },
      { en: 'Wave 1 starts with nine zombies at the widest door in view; every wave adds one, from wave 3 more doors open. A boss comes every fifth wave.', de: 'Welle 1 beginnt mit neun Zombies an der breitesten Tür im Blick; jede Welle bringt einen mehr, ab Welle 3 öffnen weitere Türen. Jede fünfte Welle kommt ein Boss.' },
      { en: 'Break of 20 seconds between waves, shop included; press Ready to skip it.', de: 'Zwanzig Sekunden Pause zwischen den Wellen, Shop inklusive; mit Ready geht es früher weiter.' },
      { en: 'Co-op for up to four in the same room: a downed player gets back up when a teammate holds a hand on them for three seconds.', de: 'Co-op für bis zu vier im selben Raum: Wer am Boden liegt, steht wieder auf, wenn ein Mitspieler drei Sekunden die Hand auflegt.' },
      { en: 'Score = kills × 10 × current wave; separate boards for Easy, Hard, solo and co-op.', de: 'Punkte = Kills × 10 × aktuelle Welle; eigene Boards für Easy, Hard, Solo und Co-op.' },
    ],
  },
  {
    id: 'rift',
    name: 'Rift',
    kind: 'Mixed reality · no room scan · roguelite',
    kindDe: 'Mixed Reality · ohne Raumscan · Roguelite',
    theme: keyArtThemes.rift,
    imageAlt: 'Close-up of a red-haired zombie',
    short: 'Point at a wall and a portal tears it open.',
    shortDe: 'Zeig auf eine Wand und ein Portal reißt sie auf.',
    desc: 'No room scan needed. Point at a wall, a portal tears it open, and the dead march out of one of five worlds into your room. You start with one pistol fixed to your controller and three hearts that never refill. After every wave you pick one of two upgrades; every tenth wave brings a boss, and each boss you beat hands you a better pistol, the first one a second gun for your other hand. Every run is different. Alone, in the same room or online.',
    descDe: 'Kein Raumscan nötig. Zeig auf eine Wand, ein Portal reißt sie auf, und die Toten marschieren aus einer von fünf Welten in deinen Raum. Du startest mit einer Pistole fest am Controller und drei Herzen, die sich nie auffüllen. Nach jeder Welle wählst du eines von zwei Upgrades; jede zehnte Welle bringt einen Boss, und jeder besiegte Boss gibt dir eine bessere Pistole, der erste eine zweite für die andere Hand. Jeder Lauf ist anders. Allein, im selben Raum oder online.',
    tags: ['Solo', 'Co-op up to 4, same room or online', 'No scan', 'Easy / Hard'],
    tagsDe: ['Solo', 'Co-op bis 4, im selben Raum oder online', 'Ohne Scan', 'Easy / Hard'],
    points: [
      { en: 'Five worlds behind the portal: graveyard, dead highway, chapel ruin, fog swamp, pumpkin field.', de: 'Fünf Welten hinter dem Portal: Friedhof, toter Highway, Kapellenruine, Nebelsumpf, Kürbisfeld.' },
      { en: 'Pistol ladder: A3500X → Pistol 92 → Desert Eagle → Golden Pistol → Riftfire. Unlimited reserve, reload by button.', de: 'Pistolenleiter: A3500X → Pistol 92 → Desert Eagle → Golden Pistol → Riftfire. Unbegrenzte Reserve, Nachladen per Taste.' },
      { en: 'Every touch costs one heart, then 2.5 seconds of protection. At zero hearts you can continue for coins (250, then doubling) or let the run end.', de: 'Jede Berührung kostet ein Herz, dann 2,5 Sekunden Schutz. Bei null Herzen kannst du für Coins weitermachen (250, dann verdoppelt) oder den Lauf enden lassen.' },
      { en: 'Hard: 50 % more enemies, 40 % more health, 15 % faster, 50 % more coins.', de: 'Hard: 50 % mehr Gegner, 40 % mehr Leben, 15 % schneller, 50 % mehr Coins.' },
      { en: 'Co-op shares the three hearts; pistols, upgrades and coins stay personal. Gift up to 1,000 coins per wave.', de: 'Im Co-op teilt ihr euch die drei Herzen; Pistolen, Upgrades und Coins bleiben persönlich. Bis zu 1.000 Coins pro Welle lassen sich verschenken.' },
    ],
  },
  {
    id: 'outbreak',
    name: 'Outbreak',
    kind: 'Full VR · gas station in the woods at night',
    kindDe: 'Volles VR · Tankstelle im Wald bei Nacht',
    theme: keyArtThemes.outbreak,
    imageAlt: 'A gas station in the woods at night',
    short: 'Full VR at a gas station in the woods at night.',
    shortDe: 'Volles VR an einer Tankstelle im Wald bei Nacht.',
    desc: 'Outbreak leaves your room behind: Pine Creek Station, a gas station in the woods at night, with zombies coming from every side. Three modes on the same site, from one square metre on the roof of a car to the whole 60 by 45 metres. Endless waves, Easy and Hard, a boss every fifth wave, a headlamp on every forehead, and the same Armory ladder as Reality Breach with its own VR account.',
    descDe: 'Outbreak lässt deinen Raum hinter sich: Pine Creek Station, eine Tankstelle im Wald bei Nacht, und die Zombies kommen von allen Seiten. Drei Modi auf demselben Gelände, vom Quadratmeter auf dem Autodach bis zu den ganzen 60 mal 45 Metern. Endlose Wellen, Easy und Hard, jede fünfte Welle ein Boss, eine Stirnlampe an jedem Kopf, und dieselbe Arsenal-Leiter wie in Reality Breach mit eigenem VR-Konto.',
    tags: ['Full VR', 'Solo', 'Co-op local or online', 'Meta avatars'],
    tagsDe: ['Volles VR', 'Solo', 'Co-op lokal oder online', 'Meta-Avatare'],
    points: [
      { en: 'Optional power outages; the generator decides how far you see.', de: 'Optionale Stromausfälle; der Generator entscheidet, wie weit du siehst.' },
      { en: 'Online co-op over relay with a code, local co-op in the same Wi-Fi.', de: 'Online-Co-op über Relay mit Code, lokaler Co-op im selben WLAN.' },
    ],
    subModes: [
      {
        id: 'rooftop',
        name: 'Rooftop',
        status: 'playable',
        players: 'Up to 3, one car each',
        playersDe: 'Bis 3, jeder auf seinem Auto',
        desc: 'Stand on the roof of a sedan, one square metre, turn but never walk. The dead hammer the car and climb up at eight points; hit the hands at the edge and they drop.',
        descDe: 'Du stehst auf dem Dach einer Limousine, ein Quadratmeter, drehen ja, laufen nie. Die Toten hämmern ans Auto und klettern an acht Stellen hoch; Treffer auf die Hände an der Kante werfen sie ab.',
        points: [
          { en: 'Signal flares from wave 3; car alarm, blackout and horde events from wave 4.', de: 'Signalfackeln ab Welle 3; Autoalarm, Stromausfall und Horde ab Welle 4.' },
          { en: 'The brute rocks the car, the boss tries to tip it: ten blows cost half your health.', de: 'Der Brute rüttelt am Auto, der Boss will es kippen: zehn Schläge kosten die halbe Gesundheit.' },
          { en: 'Sedan, pickup and estate for the three players; same room allowed with two metres between you.', de: 'Limousine, Pickup und Kombi für die drei Spieler; im selben Raum erlaubt, mit zwei Metern Abstand.' },
        ],
      },
      {
        id: 'safe-zone',
        name: 'Safe Zone',
        status: 'playable',
        players: 'Up to 3, each in their own real room',
        playersDe: 'Bis 3, jeder in seinem eigenen Zimmer',
        desc: 'The gas station shop shrinks or grows to your play space, 1.5 to 5 metres a side. Real steps, no stick movement. One door and two to five windows: board them up from the till and hold the line.',
        descDe: 'Der Tankstellenshop passt sich deiner Spielfläche an, 1,5 bis 5 Meter Kantenlänge. Echte Schritte, keine Stick-Bewegung. Eine Tür und zwei bis fünf Fenster: von der Kasse aus vernageln und halten.',
        points: [
          { en: 'Blackouts and smoke bombs as events.', de: 'Stromausfall und Rauchbombe als Ereignisse.' },
          { en: 'Brute and boss rip a barricade off with one blow.', de: 'Brute und Boss reißen eine Barrikade mit einem Hieb ab.' },
          { en: 'In co-op the shop takes the size of the smallest play space.', de: 'Im Co-op hat der Shop die Größe der kleinsten Spielfläche.' },
        ],
      },
      {
        id: 'gas-station',
        name: 'Gas Station',
        status: 'playable',
        players: 'Up to 4',
        playersDe: 'Bis 4',
        desc: 'The whole site: stick movement, teleport, sprint with stamina, a ladder. Repair the generator (fill the canister, pull the cord) and you see the dead at 16 metres instead of 10. From wave 6 they go for the generator.',
        descDe: 'Das ganze Gelände: Stick-Bewegung, Teleport, Sprint mit Ausdauer, eine Leiter. Repariere den Generator (Kanister füllen, Seilzug ziehen), und du siehst die Toten auf 16 statt 10 Metern. Ab Welle 6 gehen sie auf den Generator los.',
        points: [
          { en: 'Loot two crates per break; the crowbar opens them.', de: 'Zwei Kisten pro Pause plündern; die Brechstange öffnet sie.' },
          { en: 'Traps: exploding barrels, a wall of burning petrol, a car alarm as bait. The chainsaw and loud guns draw the dead; the suppressor keeps it quiet.', de: 'Fallen: explodierende Fässer, eine Benzin-Feuerwand, ein Autoalarm als Köder. Kettensäge und laute Waffen locken die Toten an; der Schalldämpfer hält es leise.' },
          { en: 'Easy: 10 zombies, +4 per wave. Hard: 15 zombies, +6 per wave, tougher.', de: 'Easy: 10 Zombies, +4 pro Welle. Hard: 15 Zombies, +6 pro Welle, zäher.' },
          { en: 'The shop is at the till; you have to walk there.', de: 'Der Shop steht an der Kasse; du musst hinlaufen.' },
        ],
      },
    ],
  },
];

/** The seven Rift upgrades (RiftUpgrades.cs): after every wave two cards, one free and weaker, one for coins and stronger. */
export const riftUpgrades: { name: string; free: string; freeDe: string; paid: string; paidDe: string; price: number; cap?: string; capDe?: string }[] = [
  { name: 'DAMAGE', free: '+15 % damage', freeDe: '+15 % Schaden', paid: '+30 %', paidDe: '+30 %', price: 240 },
  { name: 'FAST HANDS', free: 'Reload 10 % faster', freeDe: 'Nachladen 10 % schneller', paid: '20 % faster', paidDe: '20 % schneller', price: 200, cap: 'up to 70 %', capDe: 'bis 70 %' },
  { name: 'FAST BULLETS', free: '+20 % bullet speed', freeDe: '+20 % Geschossgeschwindigkeit', paid: '+40 %', paidDe: '+40 %', price: 160 },
  { name: 'PIERCING', free: 'Pierces 1 more enemy', freeDe: 'Durchschlägt 1 Gegner mehr', paid: '2 more', paidDe: '2 mehr', price: 400, cap: 'max. 5', capDe: 'höchstens 5' },
  { name: 'MULTISHOT', free: '+1 bullet per shot', freeDe: '+1 Kugel pro Schuss', paid: '+2', paidDe: '+2', price: 500, cap: 'max. 4', capDe: 'höchstens 4' },
  { name: 'BIG MAGAZINE', free: '+2 rounds', freeDe: '+2 Schuss', paid: '+4', paidDe: '+4', price: 300 },
  { name: 'AUTO RELOAD', free: 'Empty magazines reload themselves', freeDe: 'Leere Magazine laden sich selbst', paid: 'same', paidDe: 'gleich', price: 600, cap: 'once per run, both pistols', capDe: 'einmal pro Lauf, beide Pistolen' },
];

/** Enemy types (ZombieKind.cs). No named bosses; the boss is a zombie of double size with a health bar. */
export const zombieKinds: { name: string; from: string; fromDe: string; desc: string; descDe: string }[] = [
  { name: 'Walker', from: 'Wave 1', fromDe: 'Welle 1', desc: 'The standard dead. Slow, relentless, in numbers.', descDe: 'Der Standard-Tote. Langsam, unerbittlich, in Masse.' },
  { name: 'Runner', from: 'Wave 2', fromDe: 'Welle 2', desc: 'Fast and fragile. Hear the steps, turn, shoot.', descDe: 'Schnell und zerbrechlich. Schritte hören, drehen, schießen.' },
  { name: 'Brute', from: 'Wave 3', fromDe: 'Welle 3', desc: 'Armoured body: only the head takes full damage. Rocks cars and rips barricades off.', descDe: 'Gepanzerter Körper: Nur der Kopf nimmt vollen Schaden. Rüttelt an Autos und reißt Barrikaden ab.' },
  { name: 'Boss', from: 'Every 5th wave (Rift: every 10th)', fromDe: 'Jede 5. Welle (Rift: jede 10.)', desc: 'Twice the size, a health bar, and headshots barely scratch it. Blades bounce off.', descDe: 'Doppelt so groß, mit Lebensbalken, und Kopfschüsse kratzen nur. Klingen prallen ab.' },
];

/** Boards that open at launch: each Easy/Hard and Solo/Co-op. */
export const leaderboardModes = [
  { key: 'leaderboard.realityBreach', board: 'room', family: 'Reality Breach' },
  { key: 'leaderboard.rift', board: 'rift', family: 'Rift' },
  { key: 'leaderboard.rooftop', board: 'rooftop', family: 'Outbreak' },
  { key: 'leaderboard.safeZone', board: 'safezone', family: 'Outbreak' },
  { key: 'leaderboard.gasStation', board: 'gasstation', family: 'Outbreak' },
] as const;
