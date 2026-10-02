export type WeaponClass = 'pistol' | 'melee' | 'smg' | 'shotgun' | 'rifle';

export interface Weapon {
  id: string;
  name: string;
  cls: WeaponClass;
  type: string;
  typeDe: string;
  desc: string;
  descDe: string;
  starter: boolean;
}

export const weapons: Weapon[] = [
  { id: 'a3500x', name: 'A3500X', cls: 'pistol', type: 'Pistol', typeDe: 'Pistole', desc: 'Reliable sidearm, the starter pistol.', descDe: 'Zuverlässige Seitenwaffe, die Startpistole.', starter: true },
  { id: 'baseball-bat', name: 'Baseball Bat', cls: 'melee', type: 'Melee', typeDe: 'Nahkampf', desc: '85 cm of aluminium and a metallic KLONG on every hit.', descDe: '85 cm Aluminium und ein metallisches KLONG bei jedem Treffer.', starter: true },
  { id: 'pistol-92', name: 'Pistol 92', cls: 'pistol', type: 'Pistol', typeDe: 'Pistole', desc: 'Second pistol, 24-round magazines.', descDe: 'Zweite Pistole, 24-Schuss-Magazine.', starter: false },
  { id: 'katana', name: 'Katana', cls: 'melee', type: 'Melee (two-handed)', typeDe: 'Nahkampf (zweihändig)', desc: 'Two-handed grip deals 1.5× damage.', descDe: 'Zweihändig geführt 1,5× Schaden.', starter: false },
  { id: 'uzi', name: 'Uzi', cls: 'smg', type: 'SMG', typeDe: 'MP', desc: 'Full auto, 32 rounds.', descDe: 'Vollautomatisch, 32 Schuss.', starter: false },
  { id: 'tommy-gun', name: 'Tommy Gun', cls: 'smg', type: 'SMG', typeDe: 'MP', desc: 'Full auto, 30 rounds.', descDe: 'Vollautomatisch, 30 Schuss.', starter: false },
  { id: 'double-barrel', name: 'Double Barrel', cls: 'shotgun', type: 'Shotgun', typeDe: 'Schrotflinte', desc: 'Wide spread; break it open and load the shells by hand.', descDe: 'Breite Streuung; aufbrechen und die Patronen per Hand laden.', starter: false },
  { id: 'pump-shotgun', name: 'Pump Shotgun', cls: 'shotgun', type: 'Shotgun', typeDe: 'Schrotflinte', desc: '6 shells, pump after every shot.', descDe: '6 Patronen, nach jedem Schuss pumpen.', starter: false },
  { id: 'ak-47', name: 'AK-47', cls: 'rifle', type: 'Assault Rifle', typeDe: 'Sturmgewehr', desc: '30 rounds, full auto.', descDe: '30 Schuss, Vollautomatik.', starter: false },
  { id: 'auto-shotgun', name: 'Auto Shotgun', cls: 'shotgun', type: 'Shotgun', typeDe: 'Schrotflinte', desc: 'Full auto, 12 shells in the tube.', descDe: 'Vollautomatisch, 12 Patronen im Rohr.', starter: false },
];

export const mods: { en: string; de: string }[] = [
  { en: 'Red or green laser sight', de: 'Roter oder grüner Laser' },
  { en: 'Flashlight', de: 'Taschenlampe' },
  { en: 'Bayonet', de: 'Bajonett' },
  { en: 'Bigger magazines', de: 'Größere Magazine' },
  { en: 'Pain pills (heal by holding them to your mouth)', de: 'Schmerztabletten (zum Mund halten, um zu heilen)' },
];
