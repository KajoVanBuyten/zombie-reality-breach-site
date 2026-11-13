# Entwurf: News-Beitrag ALPHA-Update November 2026

Status: **Veröffentlicht am 13.11.2026** als `beta-open-wall-breach` in `src/content/news.ts`, auf Kajos Anweisung als BETA-Beitrag umgeschrieben (Titel „The BETA is open: the wall gives way“, Kategorie Update, ALPHA-Hinweis durch BETA-Button ersetzt). Maßgeblich ist der Text in news.ts; dieser Entwurf bleibt nur wegen der Belegtabelle.

Geplante Felder für `news.ts`:

| Feld | Wert |
|---|---|
| slug | `alpha-update-november` |
| category | `Alpha` |
| date | Tag der Veröffentlichung (Vorschlag: 2026-11-14) |
| theme | `keyArtThemes.realityBreach` (Wall Breach) |

Keine Screenshots (Regel: keine Rohaufnahmen auf der Website), kein OUTBREAK (Besitzerentscheidung 21.10.2026).

---

## English

**Title:** ALPHA update: the wall gives way

**Excerpt:** A new ALPHA build is out: zombies from every side of your room, a wall that breaks open, mixed co-op in Rift and new gun sounds.

**Body:**

A new build is live in the closed ALPHA on Meta Quest. Here is what changed since our last post. In Reality Breach the dead no longer queue up at one door: they come from all around your room and take the nearest way in. Hold out long enough and the wall gives way: from wave 8 on Hard and wave 12 on Easy, zombies tear a door-sized hole into a wall away from your doors, once per run. Climbing onto the bed, the sofa or the table no longer keeps you safe; the dead climb up after you, attack from above and climb back down. The break between waves is now 90 seconds, and the shop opens before wave 1. In Rift, two players in the same room can now team up with a third player online. You can join a match that is already running while a seat is free, and the host has a player list with kick and ban. The zombies move with their feet now instead of sliding, and they look sharper up close and darker overall. Most guns got new sounds, from the A3500X to the LMG. Online features are now asked for when the menu starts; if you turn them off, the game uses a new random ID, and you can delete your online data in the game with a confirmation through your Meta account. Want in? The Join ALPHA button on the home page takes you to the release channel. And you can now follow the game on TikTok and Instagram (@zombierealitybreach) and on YouTube (@ZombieRealityBreach).

## Deutsch

**Titel:** ALPHA-Update: Die Wand gibt nach

**Auszug:** Ein neuer ALPHA-Build ist da: Zombies von allen Seiten deines Raums, eine Wand, die aufbricht, gemischter Co-op in Rift und neue Waffenklänge.

**Text:**

In der geschlossenen ALPHA auf Meta Quest läuft ein neuer Build. Das hat sich seit unserem letzten Beitrag geändert. In Reality Breach stehen die Toten nicht mehr an einer Tür Schlange: Sie kommen von überall rund um deinen Raum und nehmen den nächsten Weg hinein. Hältst du lange genug durch, gibt die Wand nach: ab Welle 8 auf Hard und ab Welle 12 auf Easy reißen Zombies ein türgroßes Loch in eine Wand abseits deiner Türen, einmal pro Lauf. Auf Bett, Sofa oder Tisch bist du nicht mehr sicher; die Toten klettern dir nach, greifen von oben an und steigen wieder herunter. Die Pause zwischen den Wellen dauert jetzt 90 Sekunden, und der Shop öffnet schon vor Welle 1. In Rift können zwei Spieler im selben Raum jetzt mit einem dritten Spieler online zusammenspielen. Du kannst einem laufenden Match beitreten, solange ein Platz frei ist, und der Host hat eine Spielerliste mit Kick und Bann. Die Zombies bewegen sich jetzt mit ihren Füßen statt zu rutschen, sehen aus der Nähe schärfer und insgesamt dunkler aus. Die meisten Schusswaffen haben neue Klänge, von der A3500X bis zum LMG. Die Online-Funktionen fragt das Spiel jetzt beim Start des Menüs ab; schaltest du sie aus, nutzt das Spiel eine neue Zufalls-ID, und deine Online-Daten kannst du im Spiel löschen, bestätigt über dein Meta-Konto. Lust mitzuspielen? Der Button „ALPHA beitreten“ auf der Startseite führt dich zum Release-Kanal. Und du kannst dem Spiel jetzt auf TikTok und Instagram (@zombierealitybreach) und auf YouTube (@ZombieRealityBreach) folgen.

---

## Belege (Spiel-Repo, alle im ALPHA-Build 26111318, Commit 62392671)

| Aussage | Commit |
|---|---|
| Zombies rund um den Raum, nächster Zugang (Tür, bodentiefes Fenster, Durchbruch) | 784461f8 |
| Wanddurchbruch Hard ab Welle 8, Easy ab Welle 12, einmal pro Lauf | 9abdd93b (`WallBreachPlacement.IsDue`) |
| Klettern auf Bett, Sofa, Tisch | efff9cb7 |
| Pause 90 s | f2e7bba4 (`WaveScaling.asset breakDuration: 90`) |
| Shop vor Welle 1 | eba86b33 |
| Rift: zwei im Raum plus einer online | b21e897a |
| Späteinstieg bei freiem Platz | fddf735a |
| Spielerliste mit Kick und Bann | b9303887 |
| Zombies laufen mit den Füßen | c4d8643d |
| Schärfere Texturen, dunkler ohne Glanz | Build-Notiz Delivery-2026-11-13-ALPHA.json |
| Neue Waffenklänge (A3500X, AK47, Benelli, BoltRifle, DesertEagle, DoubleBarrel, LMG, LeverAction, Pistol92, Remington, Revolver, SawedOff, Uzi) | `ReviewedAudio/ApprovedFamilies` in 62392671 |
| Online-Abfrage beim Menüstart, Zufalls-ID, Löschen mit Meta-Nachweis | 9ea44854, 728ff88f |

## Offen für Kajo

- **BETA:** Der Build liegt laut Delivery-2026-11-13-BETA.json auch im BETA-Kanal. Die Website sagt noch „BETA folgt“, und der BETA-Button ist deaktiviert. Soll der Beitrag die BETA erwähnen und der Button freigeschaltet werden?
- **Veröffentlichungsdatum:** Vorschlag 14.11.2026.
