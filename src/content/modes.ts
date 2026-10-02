import { img } from '@/lib/site';

export type ModeStatus = 'playable' | 'inDev';

export interface SubMode {
  id: 'rooftop' | 'safe-zone' | 'gas-station';
  name: string;
  status: ModeStatus;
  desc: string;
  descDe: string;
}

export interface ModeFamily {
  id: 'reality-breach' | 'rift' | 'outbreak';
  name: string;
  kind: string;
  kindDe: string;
  image: string;
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
    image: img.ruins,
    imageAlt: 'Zombie Reality Breach artwork: ruined city street',
    short: 'Zombies break through your real doors and walls.',
    shortDe: 'Zombies brechen durch deine echten Türen und Wände.',
    desc: 'Your room, your doors, your fight. The game reads your room scan and turns your real doors into breach points. You hear the knocking, the door bends with every blow, and then it breaks out of its hinges. No door? The zombies tear through your wall instead. Between waves you buy weapons, ammo and gear in the shop; the Armory unlocks new weapons for good.',
    descDe: 'Dein Raum, deine Türen, dein Kampf. Das Spiel liest deinen Raumscan und macht deine echten Türen zu Durchbruchstellen. Du hörst das Klopfen, die Tür biegt sich mit jedem Schlag, und dann bricht sie aus den Angeln. Keine Tür? Dann reißen die Zombies deine Wand auf. Zwischen den Wellen kaufst du im Shop Waffen, Munition und Ausrüstung; das Arsenal schaltet neue Waffen dauerhaft frei.',
    tags: ['Solo', 'Co-op up to 4', 'Room scan needed'],
    tagsDe: ['Solo', 'Co-op bis 4', 'Raumscan nötig'],
    points: [
      { en: 'Detected doors are used first; otherwise the game suggests wall sections you can move, add or remove.', de: 'Erkannte Türen werden zuerst genutzt; sonst schlägt das Spiel Wandabschnitte vor, die du verschieben, hinzufügen oder entfernen kannst.' },
      { en: 'Shop between waves, Armory unlocks between runs.', de: 'Shop zwischen den Wellen, Arsenal-Freischaltungen zwischen den Runden.' },
      { en: 'Co-op in the same room (shared space) or online.', de: 'Co-op im selben Raum (geteilter Raum) oder online.' },
    ],
  },
  {
    id: 'rift',
    name: 'Rift',
    kind: 'Mixed reality · no room scan',
    kindDe: 'Mixed Reality · ohne Raumscan',
    image: img.sparks,
    imageAlt: 'Zombie Reality Breach artwork: sparks and smoke over ruins',
    short: 'Point at a wall and a portal tears it open.',
    shortDe: 'Zeig auf eine Wand und ein Portal reißt sie auf.',
    desc: 'No room scan needed. Point at a wall and a portal tears it open, and the dead march through into your room. You fight with two pistols and three hearts, pick an upgrade after every wave and face bosses. Every run is different: Rift is a roguelite. Play alone or in online co-op.',
    descDe: 'Kein Raumscan nötig. Zeig auf eine Wand, ein Portal reißt sie auf, und die Toten marschieren in deinen Raum. Du kämpfst mit zwei Pistolen und drei Herzen, wählst nach jeder Welle ein Upgrade und trittst gegen Bosse an. Jeder Lauf ist anders: Rift ist ein Roguelite. Allein oder im Online-Co-op.',
    tags: ['Solo', 'Online co-op up to 4', 'Roguelite'],
    tagsDe: ['Solo', 'Online-Co-op bis 4', 'Roguelite'],
    points: [
      { en: 'Two pistols, three hearts', de: 'Zwei Pistolen, drei Herzen' },
      { en: 'An upgrade after every wave', de: 'Ein Upgrade nach jeder Welle' },
      { en: 'Bosses and roguelite runs', de: 'Bosse und Roguelite-Läufe' },
    ],
  },
  {
    id: 'outbreak',
    name: 'Outbreak',
    kind: 'Full VR · gas station in the woods at night',
    kindDe: 'Volles VR · Tankstelle im Wald bei Nacht',
    image: img.aerial,
    imageAlt: 'Zombie Reality Breach artwork: aerial view of a ruined city',
    short: 'Full VR at a gas station in the woods at night.',
    shortDe: 'Volles VR an einer Tankstelle im Wald bei Nacht.',
    desc: 'Outbreak leaves your room behind: a gas station in the woods at night, with zombies coming from every side. Three modes, from holding the roof of a car to defending the whole site.',
    descDe: 'Outbreak lässt deinen Raum hinter sich: eine Tankstelle im Wald bei Nacht, und die Zombies kommen von allen Seiten. Drei Modi, vom Autodach bis zum ganzen Gelände.',
    tags: ['Full VR', 'Solo', 'Co-op'],
    tagsDe: ['Volles VR', 'Solo', 'Co-op'],
    points: [],
    subModes: [
      {
        id: 'rooftop',
        name: 'Rooftop',
        status: 'playable',
        desc: 'Hold the roof of a car while the dead climb up. Co-op for up to three players, one car each, with Meta avatars, local or online.',
        descDe: 'Halte das Dach eines Autos, während die Toten hochklettern. Co-op für bis zu drei Spieler, jeder auf seinem eigenen Auto, mit Meta-Avataren, lokal oder online.',
      },
      {
        id: 'safe-zone',
        name: 'Safe Zone',
        status: 'inDev',
        desc: 'Barricade the gas station shop and hold it.',
        descDe: 'Verbarrikadiere den Tankstellenshop und halte ihn.',
      },
      {
        id: 'gas-station',
        name: 'Gas Station',
        status: 'inDev',
        desc: 'Defend the whole site.',
        descDe: 'Verteidige das ganze Gelände.',
      },
    ],
  },
];

/** Boards that open at launch: each Easy/Hard and Solo/Co-op. */
export const leaderboardModes = [
  { key: 'leaderboard.realityBreach', family: 'Reality Breach' },
  { key: 'leaderboard.rift', family: 'Rift' },
  { key: 'leaderboard.rooftop', family: 'Outbreak' },
  { key: 'leaderboard.safeZone', family: 'Outbreak' },
  { key: 'leaderboard.gasStation', family: 'Outbreak' },
] as const;
