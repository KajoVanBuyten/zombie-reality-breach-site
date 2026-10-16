import { Link } from 'react-router-dom';
import { Eye, Crosshair, Swords, Target, ShoppingCart, Lock, Waves, Users, Trophy, Pill, Flame, Car, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import SteelCard from '@/components/SteelCard';
import HazardDivider from '@/components/HazardDivider';
import { modeFamilies } from '@/content/modes';
import KeyArt from '@/components/KeyArt';
import PageHero from '@/components/PageHero';
import Backdrop from '@/components/Backdrop';
import { keyArtThemes } from '@/lib/site';

const features = [
  { icon: Eye, key: 'mr', en: 'True mixed reality in Reality Breach: the game reads your room scan and turns your real doors into breach points. No door detected? Mark one on any wall by hand.', de: 'Echte Mixed Reality in Reality Breach: Das Spiel liest deinen Raumscan und macht deine echten Türen zu Durchbruchstellen. Keine Tür erkannt? Dann markierst du eine von Hand an einer Wand.' },
  { icon: Flame, key: 'rift', en: 'Rift: no room scan. Point at a wall and a portal tears it open onto one of five worlds. One pistol to start, a second from the first boss, three hearts, an upgrade after every wave, a boss every tenth wave.', de: 'Rift: ohne Raumscan. Zeig auf eine Wand, und ein Portal reißt sie zu einer von fünf Welten auf. Eine Pistole zum Start, die zweite ab dem ersten Boss, drei Herzen, ein Upgrade nach jeder Welle, jede zehnte Welle ein Boss.' },
  { icon: Car, key: 'outbreak', en: 'Outbreak: full VR at Pine Creek Station, a gas station in the woods at night. Rooftop, Safe Zone and Gas Station are all playable, with a headlamp on your forehead from the start.', de: 'Outbreak: volles VR an der Pine Creek Station, einer Tankstelle im Wald bei Nacht. Rooftop, Safe Zone und Gas Station sind alle spielbar, mit Stirnlampe von Anfang an.' },
  { icon: Crosshair, key: 'weapon', en: 'Physical weapon handling: draw from holsters, eject and insert magazines by hand, rack the slide, pump the shotgun, break open the double barrel, load the revolver round by round.', de: 'Physische Waffenbedienung: aus Holstern ziehen, Magazine per Hand wechseln, Schlitten durchladen, Schrotflinte pumpen, Doppellauf aufbrechen, den Revolver Patrone für Patrone laden.' },
  { icon: Swords, key: 'melee', en: 'Melee: the wooden bat lands with a KLONG, blades cut through or get stuck in bone when the swing is too weak. The katana works best with both hands.', de: 'Nahkampf: Der Holzschläger landet mit einem KLONG, Klingen schneiden durch oder bleiben im Knochen stecken, wenn der Hieb zu schwach war. Die Katana wirkt am besten mit beiden Händen.' },
  { icon: Target, key: 'hit', en: 'Hit zones: headshots count, limbs come off, and zombies that lose their legs keep crawling.', de: 'Trefferzonen: Kopfschüsse zählen, Gliedmaßen fliegen ab, und Zombies ohne Beine kriechen weiter.' },
  { icon: ShoppingCart, key: 'shop', en: 'Break shop: every kill pays 10 $, every cleared wave 25 $, into one account you keep for good. Spend it on weapons, ammo, mods and supplies between waves.', de: 'Pausenshop: Jeder Kill bringt 10 $, jede geschaffte Welle 25 $, auf ein Konto, das du dauerhaft behältst. Gib es zwischen den Wellen für Waffen, Munition, Aufsätze und Vorräte aus.' },
  { icon: Lock, key: 'armory', en: 'Armory: unlock new weapons for good by reaching waves and paying once. Reality Breach and Outbreak keep separate accounts; Rift runs on coins instead.', de: 'Arsenal: Schalte neue Waffen dauerhaft frei, indem du Wellen erreichst und einmal zahlst. Reality Breach und Outbreak haben getrennte Konten; Rift läuft stattdessen auf Coins.' },
  { icon: Waves, key: 'waves', en: 'Endless waves that get harder: more zombies, faster, in groups, with runners from wave 2, brutes from wave 3 and a boss every fifth wave. How long can you last?', de: 'Endlose Wellen, die härter werden: mehr Zombies, schneller, in Gruppen, mit Runnern ab Welle 2, Brutes ab Welle 3 und jede fünfte Welle einem Boss. Wie lange hältst du durch?' },
  { icon: Users, key: 'coop', en: 'Co-op for up to four: Reality Breach in the same room, Rift in the same room or online, Outbreak local or online (three in Rooftop and Safe Zone, four in Gas Station). A teammate\u2019s hand on you for three seconds gets you back up.', de: 'Co-op für bis zu vier: Reality Breach im selben Raum, Rift im selben Raum oder online, Outbreak lokal oder online (drei in Rooftop und Safe Zone, vier in Gas Station). Drei Sekunden Hand auflegen, und ein Mitspieler steht wieder auf.' },
  { icon: Trophy, key: 'lb', en: 'Leaderboards per mode, difficulty and solo or co-op, in the game and live on this website. Scores are sent only with your consent.', de: 'Bestenlisten pro Modus, Schwierigkeit und Solo/Co-op, im Spiel und live auf dieser Website. Punkte werden nur mit deiner Zustimmung gesendet.' },
  { icon: Pill, key: 'pills', en: 'Pain pills: hold them to your mouth to heal half your health. Easy starts you with one, Hard with none.', de: 'Schmerztabletten: zum Mund halten, und die Hälfte deiner Gesundheit ist zurück. Easy startet mit einer, Hard mit keiner.' },
];

const controls = [
  { button: 'Grip', en: 'Grab weapons, magazines, shells, mods, pills. Holstered items are grabbed at their slot.', de: 'Waffen, Magazine, Patronen, Aufsätze, Pillen greifen. Geholsterte Gegenstände greifst du an ihrem Platz.' },
  { button: 'Trigger', en: 'Fire the held gun', de: 'Mit der gehaltenen Waffe schießen' },
  { button: 'Left X / right B', en: 'The gun button of that hand: release the magazine, or break the action open and shut (double barrel, sawed-off, revolver, flare gun)', de: 'Die Waffentaste der Hand: Magazin lösen oder die Waffe aufbrechen und schließen (Doppellauf, Sawed-off, Revolver, Leuchtpistole)' },
  { button: 'Hold left Y', en: 'Show the HUD (wave, ammo, money, health). In Rift the HUD hangs on the wall beside the portal instead.', de: 'HUD anzeigen (Welle, Munition, Geld, Leben). In Rift hängt das HUD stattdessen an der Wand neben dem Portal.' },
  { button: 'Right A / left X', en: 'Skip the break, restart after game over, confirm. In Rift: reload that hand\u2019s pistol.', de: 'Pause überspringen, nach Game Over neu starten, bestätigen. In Rift: die Pistole dieser Hand nachladen.' },
  { button: 'Thumbsticks', en: 'Door setup: fine-tune the measured door frame. Gas Station: walk or teleport, snap or smooth turn.', de: 'Türeinrichtung: den vermessenen Türrahmen feinjustieren. Gas Station: laufen oder teleportieren, Snap- oder Smooth-Turn.' },
  { button: 'Left menu button', en: 'Pause menu', de: 'Pausenmenü' },
  { button: 'Controller ray + trigger', en: 'Operate every menu, with either hand', de: 'Jedes Menü bedienen, mit beiden Händen' },
];

const gearPositions = [
  { pos: 'Right hip', posDe: 'Rechte Hüfte', item: 'A3500X pistol', itemDe: 'A3500X-Pistole' },
  { pos: 'Left hip', posDe: 'Linke Hüfte', item: 'Pistol 92 (once bought)', itemDe: 'Pistol 92 (nach dem Kauf)' },
  { pos: 'Chest left', posDe: 'Brust links', item: 'Magazine pouch (shells for a shotgun in the other hand)', itemDe: 'Magazintasche (Patronen für eine Schrotflinte in der anderen Hand)' },
  { pos: 'Chest right', posDe: 'Brust rechts', item: 'Pain pills, up to three', itemDe: 'Schmerztabletten, bis zu drei' },
  { pos: 'Front left / right', posDe: 'Vorne links / rechts', item: 'Desert Eagle and Revolver .357, cross-draw (once unlocked)', itemDe: 'Desert Eagle und Revolver .357, überkreuz gezogen (nach der Freischaltung)' },
  { pos: 'Back of the belt', posDe: 'Gürtel hinten', item: 'Flare gun', itemDe: 'Leuchtpistole' },
  { pos: 'Back, over the shoulders', posDe: 'Rücken, über die Schultern', item: 'Two crossed slots, one long item each: long gun, katana or the wooden bat', itemDe: 'Zwei gekreuzte Halterungen, je ein langer Gegenstand: Langwaffe, Katana oder der Holzschläger' },
  { pos: 'Hip pouch', posDe: 'Hüfttasche', item: 'Molotov or pipe bomb', itemDe: 'Molotow oder Rohrbombe' },
  { pos: 'Forehead', posDe: 'Stirn', item: 'Headlamp: on and off with a grab at your forehead, 120 s of battery, recharges in the break. Standard gear in Outbreak.', itemDe: 'Stirnlampe: an und aus mit einem Griff an die Stirn, 120 s Akku, lädt in der Pause. In Outbreak Standardausrüstung.' },
];

export default function TheGamePage() {
  const { t, lang } = useI18n();
  const de = lang === 'de';

  return (
    <div className="pt-16">
      <PageHero
        theme={keyArtThemes.realityBreach}
        kicker={`// ${t('game.title')}`}
        title={t('game.title')}
        intro={de
          ? 'Dein Zuhause als letzte Verteidigungslinie: Mixed Reality mit Raumscan, ein Portal in deiner Wand, oder volles VR an einer Tankstelle bei Nacht. Echte Handgriffe an jeder Waffe.'
          : 'Your home as the last line of defence: mixed reality with your room scan, a portal in your wall, or full VR at a gas station at night. Real hands-on handling for every weapon.'}
      />

      {/* ABOUT */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="section-title font-heading text-2xl lg:text-3xl uppercase text-bone mb-6">{t('game.about')}</h2>
        <div className="space-y-4 text-bone-muted font-body font-light leading-relaxed">
          {de ? (
            <>
              <p>Zombie Reality Breach macht dein Zuhause zur letzten Verteidigungslinie. Setz deine Meta Quest auf, schau dich in deinem Wohnzimmer um und höre das erste Klopfen an der Tür. Kurz darauf fliegt sie aus den Angeln und die Toten strömen herein.</p>
              <p>Greif die Pistole von der Hüfte, den Baseballschläger über die Schulter und halte die Stellung. Drei Modusfamilien warten: REALITY BREACH in deinem gescannten Raum, RIFT mit einem Portal in deiner Wand und OUTBREAK in vollem VR an einer Tankstelle im Wald bei Nacht.</p>
              <p className="text-bone">Bald für Meta Quest 3 und 3S, Early Access geplant. Jede Modusfamilie kannst du 90 Minuten kostenlos spielen.</p>
            </>
          ) : (
            <>
              <p>Zombie Reality Breach turns your own home into the last line of defence. Put on your Meta Quest, look around your living room, and hear the first knock on the door. Moments later it bursts off its hinges and the dead pour in.</p>
              <p>Grab the pistol from your hip, the baseball bat from over your shoulder, and hold the line. Three mode families are waiting: REALITY BREACH in your scanned room, RIFT with a portal in your wall, and OUTBREAK in full VR at a gas station in the woods at night.</p>
              <p className="text-bone">Coming soon to Meta Quest 3 and 3S, Early Access planned. Each mode family can be played for 90 minutes for free.</p>
            </>
          )}
        </div>
      </section>

      <HazardDivider />

      {/* MODE FAMILIES */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('game.modes')}</span>
        <h2 className="section-title font-heading text-2xl lg:text-3xl uppercase text-bone mt-2 mb-8">{t('game.modes')}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {modeFamilies.map((m) => (
            <SteelCard key={m.id} className="overflow-hidden hover:border-blood/40 transition-colors">
              <div className="relative h-40 overflow-hidden">
                <KeyArt theme={m.theme} widths={[1280, 800]} sizes="(min-width: 768px) 33vw, 100vw" alt={m.imageAlt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/30 to-transparent" />
              </div>
              <div className="relative z-10 p-5">
                <h3 className="font-heading text-lg uppercase text-bone">{m.name}</h3>
                <p className="text-[10px] font-heading uppercase tracking-wider text-ember mb-2">{de ? m.kindDe : m.kind}</p>
                <p className="text-sm text-bone-muted font-body font-light leading-relaxed">{de ? m.shortDe : m.short}</p>
                {m.subModes && (
                  <p className="text-xs text-bone-muted/80 font-body font-light mt-2">
                    {m.subModes.map((s) => `${s.name} (${t(s.status === 'playable' ? 'modes.playable' : 'modes.inDev')})`).join(' · ')}
                  </p>
                )}
              </div>
            </SteelCard>
          ))}
        </div>
        <Link to="/modes" className="inline-flex items-center gap-1 mt-6 text-xs font-heading text-blood uppercase tracking-wider hover:gap-2 transition-all">
          {t('modes.learnMore')} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      <HazardDivider />

      {/* FEATURES */}
      <Backdrop theme={keyArtThemes.game}>
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('game.features')}</span>
        <h2 className="section-title font-heading text-2xl lg:text-3xl uppercase text-bone mt-2 mb-8">Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <SteelCard key={f.key} className="p-5 hover:border-blood/40 transition-colors group">
              <div className="relative z-10">
                <f.icon className="w-5 h-5 text-blood mb-3" />
                <p className="text-sm text-bone-muted font-body font-light leading-relaxed">{de ? f.de : f.en}</p>
              </div>
            </SteelCard>
          ))}
        </div>
      </section>
      </Backdrop>

      <HazardDivider />

      {/* CONTROLS */}
      <Backdrop theme={keyArtThemes.outbreak} opacity={0.1}>
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('game.controls')}</span>
        <h2 className="section-title font-heading text-2xl lg:text-3xl uppercase text-bone mt-2 mb-8">{t('game.controls')}</h2>
        <div className="steel-card overflow-hidden">
          <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[180px_1fr] gap-3 px-4 py-3 border-b border-bg-steel text-[10px] font-heading uppercase tracking-wider text-bone-muted">
            <span>{de ? 'Taste' : 'Button'}</span>
            <span>{de ? 'Aktion' : 'Action'}</span>
          </div>
          {controls.map((c) => (
            <div key={c.button} className="grid grid-cols-[120px_1fr] sm:grid-cols-[180px_1fr] gap-3 px-4 py-3 border-b border-bg-steel/40">
              <span className="text-sm font-heading text-ember">{c.button}</span>
              <span className="text-sm text-bone-muted font-body font-light">{de ? c.de : c.en}</span>
            </div>
          ))}
        </div>
      </section>

      <HazardDivider />

      {/* GEAR */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="section-title font-heading text-2xl uppercase text-bone mb-6">{t('game.gear')}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {gearPositions.map((g) => (
            <SteelCard key={g.pos} className="p-4 flex items-center gap-4 hover:border-blood/40 transition-colors">
              <div className="relative z-10 flex items-center gap-4">
                <span className="text-xs font-heading uppercase text-ember w-20 flex-shrink-0">{de ? g.posDe : g.pos}</span>
                <span className="text-sm text-bone-muted font-body font-light">{de ? g.itemDe : g.item}</span>
              </div>
            </SteelCard>
          ))}
        </div>
      </section>
      </Backdrop>

      <HazardDivider />

      {/* REQUIREMENTS */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="section-title font-heading text-2xl uppercase text-bone mb-4">{t('game.req')}</h2>
        <ul className="space-y-2 text-sm text-bone-muted font-body font-light">
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-blood mt-2 flex-shrink-0" />{de ? 'Meta Quest 3 oder 3S' : 'Meta Quest 3 or 3S'}</li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-blood mt-2 flex-shrink-0" />{de ? 'Für Reality Breach: ein Raumscan (Einstellungen → Physischer Raum → Raum einrichten). Rift und Outbreak brauchen keinen Raumscan.' : 'For Reality Breach: a room scan (Settings → Physical Space → Space Setup). Rift and Outbreak need no room scan.'}</li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-blood mt-2 flex-shrink-0" />{de ? 'Reality Breach und Rift: Spielfläche ca. 2 × 2 m oder mehr empfohlen. Rooftop braucht einen Quadratmeter, Safe Zone 1,5 bis 5 m Kantenlänge, Gas Station den Guardian plus Stick-Bewegung.' : 'Reality Breach and Rift: a play area of about 2 × 2 m or more recommended. Rooftop needs one square metre, Safe Zone 1.5 to 5 m a side, Gas Station your guardian plus stick movement.'}</li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-blood mt-2 flex-shrink-0" />{de ? 'Internet für Online-Co-op, Bestenlisten und den Online-Fortschritt' : 'Internet for online co-op, leaderboards and online progress'}</li>
        </ul>
        <p className="text-xs text-bone-muted/60 font-body font-light mt-6">
          {de ? 'Screenshots und Trailer folgen mit der Store-Seite.' : 'Screenshots and a trailer will follow with the store page.'}
        </p>
      </section>
    </div>
  );
}
