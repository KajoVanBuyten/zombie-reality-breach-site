import { keyArtThemes, type KeyArtTheme } from '@/lib/site';

export interface NewsPost {
  slug: string;
  title: string;
  titleDe: string;
  category: 'Update' | 'Devlog' | 'Alpha';
  date: string;
  /** Key-art theme (public/assets/keyart/<theme>) for the card and header picture. */
  theme: KeyArtTheme;
  excerpt: string;
  excerptDe: string;
  body: string;
  bodyDe: string;
}

export const newsPosts: NewsPost[] = [
  {
    slug: 'beta-open-wall-breach',
    title: 'The BETA is open: the wall gives way',
    titleDe: 'Die BETA ist offen: Die Wand gibt nach',
    category: 'Update',
    date: '2026-11-13',
    theme: keyArtThemes.realityBreach,
    excerpt: 'The BETA is open on Meta Quest. The new build brings zombies from every side of your room, a wall that breaks open, mixed co-op in Rift and new gun sounds.',
    excerptDe: 'Die BETA auf Meta Quest ist offen. Der neue Build bringt Zombies von allen Seiten deines Raums, eine Wand, die aufbricht, gemischten Co-op in Rift und neue Waffenklänge.',
    body: 'Zombie Reality Breach is now in BETA on Meta Quest: the Join BETA button on the home page takes you to the release channel. Here is what changed since our last post. In Reality Breach the dead no longer queue up at one door: they come from all around your room and take the nearest way in. Hold out long enough and the wall gives way: from wave 8 on Hard and wave 12 on Easy, zombies tear a door-sized hole into a wall away from your doors, once per run. Climbing onto the bed, the sofa or the table no longer keeps you safe; the dead climb up after you, attack from above and climb back down. The break between waves is now 90 seconds, and the shop opens before wave 1. In Rift, two players in the same room can now team up with a third player online. You can join a match that is already running while a seat is free, and the host has a player list with kick and ban. The zombies move with their feet now instead of sliding, and they look sharper up close and darker overall. Most guns got new sounds, from the A3500X to the LMG. Online features are now asked for when the menu starts; if you turn them off, the game uses a new random ID, and you can delete your online data in the game with a confirmation through your Meta account. And you can now follow the game on TikTok and Instagram (@zombierealitybreach) and on YouTube (@ZombieRealityBreach).',
    bodyDe: 'Zombie Reality Breach ist jetzt in der BETA auf Meta Quest: Der Button „BETA beitreten“ auf der Startseite führt dich zum Release-Kanal. Das hat sich seit unserem letzten Beitrag geändert. In Reality Breach stehen die Toten nicht mehr an einer Tür Schlange: Sie kommen von überall rund um deinen Raum und nehmen den nächsten Weg hinein. Hältst du lange genug durch, gibt die Wand nach: ab Welle 8 auf Hard und ab Welle 12 auf Easy reißen Zombies ein türgroßes Loch in eine Wand abseits deiner Türen, einmal pro Lauf. Auf Bett, Sofa oder Tisch bist du nicht mehr sicher; die Toten klettern dir nach, greifen von oben an und steigen wieder herunter. Die Pause zwischen den Wellen dauert jetzt 90 Sekunden, und der Shop öffnet schon vor Welle 1. In Rift können zwei Spieler im selben Raum jetzt mit einem dritten Spieler online zusammenspielen. Du kannst einem laufenden Match beitreten, solange ein Platz frei ist, und der Host hat eine Spielerliste mit Kick und Bann. Die Zombies bewegen sich jetzt mit ihren Füßen statt zu rutschen, sehen aus der Nähe schärfer und insgesamt dunkler aus. Die meisten Schusswaffen haben neue Klänge, von der A3500X bis zum LMG. Die Online-Funktionen fragt das Spiel jetzt beim Start des Menüs ab; schaltest du sie aus, nutzt das Spiel eine neue Zufalls-ID, und deine Online-Daten kannst du im Spiel löschen, bestätigt über dein Meta-Konto. Und du kannst dem Spiel jetzt auf TikTok und Instagram (@zombierealitybreach) und auf YouTube (@ZombieRealityBreach) folgen.',
  },
  {
    slug: 'three-mode-families',
    title: 'Reality Breach, Rift, Outbreak',
    titleDe: 'Reality Breach, Rift, Outbreak',
    category: 'Update',
    date: '2026-10-02',
    theme: keyArtThemes.realityBreach,
    excerpt: 'The game now has three mode families: two in mixed reality, one in full VR.',
    excerptDe: 'Das Spiel hat jetzt drei Modusfamilien: zwei in Mixed Reality, eine in vollem VR.',
    body: 'The game now has three mode families. REALITY BREACH uses your room scan: zombies break through your real doors and walls, you shop between waves and unlock weapons in the Armory. RIFT needs no room scan: point at a wall and a portal tears it open; you fight with two pistols and three hearts, pick an upgrade after every wave and face bosses in roguelite runs, alone or in online co-op. OUTBREAK is full VR at a gas station in the woods at night, with three modes: Rooftop, Safe Zone and Gas Station. Each family can be played for 90 minutes for free; after that you buy the modes you want or the complete pack. There are no loot boxes.',
    bodyDe: 'Das Spiel hat jetzt drei Modusfamilien. REALITY BREACH nutzt deinen Raumscan: Zombies brechen durch deine echten Türen und Wände, zwischen den Wellen kaufst du ein und schaltest im Arsenal Waffen frei. RIFT braucht keinen Raumscan: Zeig auf eine Wand und ein Portal reißt sie auf; du kämpfst mit zwei Pistolen und drei Herzen, wählst nach jeder Welle ein Upgrade und trittst in Roguelite-Läufen gegen Bosse an, allein oder im Online-Co-op. OUTBREAK ist volles VR an einer Tankstelle im Wald bei Nacht, mit drei Modi: Rooftop, Safe Zone und Gas Station. Jede Familie kannst du 90 Minuten kostenlos spielen; danach kaufst du die Modi, die du willst, oder das Komplettpaket. Es gibt keine Lootboxen.',
  },
  {
    slug: 'rooftop-co-op',
    title: 'Rooftop: co-op on the car roofs',
    titleDe: 'Rooftop: Co-op auf den Autodächern',
    category: 'Devlog',
    date: '2026-10-02',
    theme: keyArtThemes.outbreak,
    excerpt: 'Up to three players, one car each, and the other players appear as their Meta avatars.',
    excerptDe: 'Bis zu drei Spieler, jeder auf seinem Auto, und die anderen erscheinen als ihre Meta-Avatare.',
    body: 'Rooftop is the first Outbreak mode and is playable in our development builds. You hold the roof of a car at a gas station in the woods at night while the dead climb up. In co-op, up to three players each hold their own car, locally or online. The other players appear as their Meta avatars. Each player gets their own waves. Safe Zone and Gas Station are still in development.',
    bodyDe: 'Rooftop ist der erste Outbreak-Modus und in unseren Entwicklungsversionen spielbar. Du hältst das Dach eines Autos an einer Tankstelle im Wald bei Nacht, während die Toten hochklettern. Im Co-op hält jeder von bis zu drei Spielern sein eigenes Auto, lokal oder online. Die anderen Spieler erscheinen als ihre Meta-Avatare. Jeder Spieler bekommt seine eigenen Wellen. Safe Zone und Gas Station sind noch in Entwicklung.',
  },
  {
    slug: 'closed-alpha-live',
    title: 'Closed alpha has started',
    titleDe: 'Geschlossene Alpha hat begonnen',
    category: 'Alpha',
    date: '2026-09-30',
    theme: keyArtThemes.game,
    excerpt: 'Zombie Reality Breach 0.1.0 is in a closed alpha test on Meta Quest.',
    excerptDe: 'Zombie Reality Breach 0.1.0 ist in einem geschlossenen Alpha-Test auf Meta Quest.',
    body: 'Zombie Reality Breach 0.1.0 is in a closed alpha test on Meta Quest. Invited friends and testers can now defend their living rooms. Thanks to everyone who helps us find bugs. Please report issues by email.',
    bodyDe: 'Zombie Reality Breach 0.1.0 ist in einem geschlossenen Alpha-Test auf Meta Quest. Eingeladene Freunde und Tester können jetzt ihre Wohnzimmer verteidigen. Danke an alle, die uns beim Bugfinden helfen. Probleme bitte per E-Mail melden.',
  },
  {
    slug: 'playtest-11-graveyard-update',
    title: 'Playtest 11: The Graveyard Update',
    titleDe: 'Spieltest 11: Das Friedhof-Update',
    category: 'Update',
    date: '2026-09-30',
    theme: keyArtThemes.rift,
    excerpt: 'The Rift now opens onto a foggy graveyard.',
    excerptDe: 'Der Rift öffnet sich jetzt auf einen nebligen Friedhof.',
    body: 'The Rift now opens onto a foggy graveyard. Portal edge: a torn brick wall instead of a glowing frame. Enemies: zombies march side by side, and the Rift is much harder in co-op. Menus: a new main menu with a proper lobby, and a pause menu with settings. Sync: full weapon sync in multiplayer. Combat: better holsters, and the two-handed katana deals 1.5× damage.',
    bodyDe: 'Der Rift öffnet sich jetzt auf einen nebligen Friedhof. Portalrand: eine aufgerissene Backsteinmauer statt eines leuchtenden Rahmens. Gegner: Zombies marschieren Schulter an Schulter, und der Rift ist im Co-op deutlich schwerer. Menüs: ein neues Hauptmenü mit Lobby und ein Pausemenü mit Einstellungen. Sync: volle Waffen-Synchronisation im Multiplayer. Kampf: bessere Holster, und die zweihändige Katana macht 1,5× Schaden.',
  },
  {
    slug: 'playtest-12-klong',
    title: 'Playtest 12: KLONG!',
    titleDe: 'Spieltest 12: KLONG!',
    category: 'Update',
    date: '2026-09-30',
    theme: keyArtThemes.daylight,
    excerpt: 'The aluminium bat now rings with a metallic KLONG.',
    excerptDe: 'Der Aluminiumschläger klingt jetzt mit metallischem KLONG.',
    body: 'Melee: the aluminium bat rings with a metallic KLONG. Doors: they break out of their hinges. HUD: now on the left X button.',
    bodyDe: 'Nahkampf: Der Aluminiumschläger klingt mit metallischem KLONG. Türen: Sie brechen aus den Angeln. HUD: jetzt auf dem linken X-Button.',
  },
  {
    slug: 'online-leaderboards',
    title: 'Online Leaderboards',
    titleDe: 'Online-Bestenlisten',
    category: 'Update',
    date: '2026-09-30',
    theme: keyArtThemes.game,
    excerpt: 'Leaderboards in the game: per mode, difficulty and solo or co-op.',
    excerptDe: 'Bestenlisten im Spiel: pro Modus, Schwierigkeit und Solo/Co-op.',
    body: 'The game has online leaderboards per mode, difficulty and solo or co-op. You see your online rank on the game over screen, with team names for co-op. Nothing is sent without your consent. The global boards on this website open at launch.',
    bodyDe: 'Das Spiel hat Online-Bestenlisten pro Modus, Schwierigkeit und Solo/Co-op. Deinen Online-Rang siehst du auf dem Game-Over-Bildschirm, im Co-op mit Teamnamen. Nichts wird ohne deine Zustimmung gesendet. Die globalen Bestenlisten auf dieser Website starten zum Release.',
  },
  {
    slug: 'devlog-1-room-scan',
    title: 'Devlog #1: Turning your room into a battlefield',
    titleDe: 'Devlog #1: Dein Raum wird zum Schlachtfeld',
    category: 'Devlog',
    date: '2026-09-25',
    theme: keyArtThemes.realityBreach,
    excerpt: 'How we use the Quest 3 room scan to find doors and why physical reloading feels so good.',
    excerptDe: 'Wie wir den Raumscan der Quest 3 nutzen und warum physisches Nachladen so gut funktioniert.',
    body: 'How we use the Quest 3 room scan to find doors. Why zombies tear through walls when there is no door. Why physical reloading feels so good. The room scan gives us the geometry of your space – every wall, every door. We use these anchor points as breach points where zombies can enter. If there is no door, we pick a wall section and the zombies claw through it. Physical reloading means you grab a magazine from your chest, slot it into the gun, and rack the slide. It connects you to the action in a way that pressing a button never can.',
    bodyDe: 'Wie wir den Raumscan der Quest 3 nutzen, um Türen zu finden. Warum Zombies durch Wände brechen, wenn keine Tür da ist. Warum physisches Nachladen so gut funktioniert. Der Raumscan liefert uns die Geometrie deines Raums – jede Wand, jede Tür. Wir nutzen diese Ankerpunkte als Durchbruchstellen. Wenn keine Tür da ist, wählen wir eine Wandstelle und die Zombies kratzen sich hindurch. Physisches Nachladen bedeutet: Magazin von der Brust greifen, einsetzen, durchladen. Das verbindet dich mit der Aktion auf eine Art, die ein Knopfdruck nie kann.',
  },
];
