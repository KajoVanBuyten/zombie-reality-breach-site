import { Link } from 'react-router-dom';
import { Eye, Crosshair, Swords, Target, ShoppingCart, Lock, Waves, Users, Trophy, Pill, Flame, Car, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import SteelCard from '@/components/SteelCard';
import HazardDivider from '@/components/HazardDivider';
import { modeFamilies } from '@/content/modes';

const features = [
  { icon: Eye, key: 'mr', en: 'True mixed reality in Reality Breach: uses your room scan. Zombies break in through your real doors. No door? They tear a hole in the wall.', de: 'Echte Mixed Reality in Reality Breach: nutzt deinen Raumscan. Zombies brechen durch deine echten Türen. Keine Tür? Dann reißen sie ein Loch in die Wand.' },
  { icon: Flame, key: 'rift', en: 'Rift: no room scan. Point at a wall and a portal tears it open. Two pistols, three hearts, an upgrade after every wave, bosses.', de: 'Rift: ohne Raumscan. Zeig auf eine Wand und ein Portal reißt sie auf. Zwei Pistolen, drei Herzen, ein Upgrade nach jeder Welle, Bosse.' },
  { icon: Car, key: 'outbreak', en: 'Outbreak: full VR at a gas station in the woods at night. Hold the roof of a car in Rooftop; Safe Zone and Gas Station are in development.', de: 'Outbreak: volles VR an einer Tankstelle im Wald bei Nacht. Halte in Rooftop das Autodach; Safe Zone und Gas Station sind in Entwicklung.' },
  { icon: Crosshair, key: 'weapon', en: 'Physical weapon handling: draw from holsters, eject and insert magazines by hand, rack the slide, pump the shotgun, break open the double barrel.', de: 'Physische Waffenbedienung: aus Holstern ziehen, Magazine per Hand wechseln, Schlitten durchladen, Schrotflinte pumpen, Doppellauf aufbrechen.' },
  { icon: Swords, key: 'melee', en: 'Melee: the aluminium bat rings with a metallic KLONG, the katana works best with both hands.', de: 'Nahkampf: Der Aluminiumschläger klingt mit metallischem KLONG, die Katana wirkt am besten mit beiden Händen.' },
  { icon: Target, key: 'hit', en: 'Hit zones: headshots count, and zombies that lose their legs keep crawling.', de: 'Trefferzonen: Kopfschüsse zählen, und Zombies ohne Beine kriechen weiter.' },
  { icon: ShoppingCart, key: 'shop', en: 'Break shop in Reality Breach: kills and cleared waves earn in-game money for weapons, ammo and gear between waves.', de: 'Pausenshop in Reality Breach: Kills und Wellen bringen Spielgeld für Waffen, Munition und Ausrüstung zwischen den Wellen.' },
  { icon: Lock, key: 'armory', en: 'Armory: unlock new weapons for good by reaching waves and saving up in-game money.', de: 'Arsenal: Schalte neue Waffen dauerhaft frei, indem du Wellen erreichst und Spielgeld sparst.' },
  { icon: Waves, key: 'waves', en: 'Waves that get harder: more zombies, faster, in groups. How long can you last?', de: 'Wellen, die härter werden: mehr Zombies, schneller, in Gruppen. Wie lange hältst du durch?' },
  { icon: Users, key: 'coop', en: 'Co-op: up to four in Reality Breach and Rift, up to three in Rooftop. Local or online with Meta friend invites.', de: 'Co-op: bis zu vier in Reality Breach und Rift, bis zu drei in Rooftop. Lokal oder online mit Meta-Freundeseinladungen.' },
  { icon: Trophy, key: 'lb', en: 'Leaderboards per mode, difficulty and solo or co-op. Global boards open at launch.', de: 'Bestenlisten pro Modus, Schwierigkeit und Solo/Co-op. Globale Boards starten zum Release.' },
  { icon: Pill, key: 'pills', en: 'Pain pills: hold them to your mouth to heal.', de: 'Schmerztabletten: zum Mund halten, um zu heilen.' },
];

const controls = [
  { button: 'Grip', en: 'Grab weapons, magazines, shells, mods, pills', de: 'Waffen, Magazine, Patronen, Aufsätze, Pillen greifen' },
  { button: 'Trigger', en: 'Fire', de: 'Schießen' },
  { button: 'Y / B (gun hand)', en: 'Release the magazine / break open the double barrel', de: 'Magazin lösen / Doppellauf aufbrechen' },
  { button: 'Hold left X', en: 'Show the HUD (wave, ammo, money, health)', de: 'HUD anzeigen (Welle, Munition, Geld, Leben)' },
  { button: 'Left menu button', en: 'Pause menu', de: 'Pausenmenü' },
  { button: 'Controller ray + trigger', en: 'Operate every menu, with either hand', de: 'Jedes Menü bedienen, mit beiden Händen' },
];

const gearPositions = [
  { pos: 'Right hip', posDe: 'Rechte Hüfte', item: 'Pistol', itemDe: 'Pistole' },
  { pos: 'Left hip', posDe: 'Linke Hüfte', item: 'Baseball bat + second pistol', itemDe: 'Baseballschläger + zweite Pistole' },
  { pos: 'Chest left', posDe: 'Brust links', item: 'Magazine pouch', itemDe: 'Magazintasche' },
  { pos: 'Chest right', posDe: 'Brust rechts', item: 'Pain pills', itemDe: 'Schmerztabletten' },
  { pos: 'Back', posDe: 'Rücken', item: 'Long guns and katana', itemDe: 'Langwaffen und Katana' },
];

export default function TheGamePage() {
  const { t, lang } = useI18n();
  const de = lang === 'de';

  return (
    <div className="pt-20">
      {/* ABOUT */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('game.about')}</span>
        <h1 className="font-heading text-3xl lg:text-4xl uppercase text-bone mt-2 mb-6">{t('game.title')}</h1>
        <div className="space-y-4 text-bone-muted font-body font-light leading-relaxed">
          {de ? (
            <>
              <p>Zombie Reality Breach macht dein Zuhause zur letzten Verteidigungslinie. Setz deine Meta Quest auf, schau dich in deinem Wohnzimmer um und höre das erste Klopfen an der Tür. Kurz darauf fliegt sie aus den Angeln und die Toten strömen herein.</p>
              <p>Greif die Pistole von der Hüfte, den Baseballschläger vom Gürtel und halte die Stellung. Drei Modusfamilien warten: REALITY BREACH in deinem gescannten Raum, RIFT mit einem Portal in deiner Wand und OUTBREAK in vollem VR an einer Tankstelle im Wald bei Nacht.</p>
              <p className="text-bone">Bald für Meta Quest 3 und 3S, Early Access geplant. Jede Modusfamilie kannst du 90 Minuten kostenlos spielen.</p>
            </>
          ) : (
            <>
              <p>Zombie Reality Breach turns your own home into the last line of defence. Put on your Meta Quest, look around your living room, and hear the first knock on the door. Moments later it bursts off its hinges and the dead pour in.</p>
              <p>Grab the pistol from your hip, the baseball bat from your belt, and hold the line. Three mode families are waiting: REALITY BREACH in your scanned room, RIFT with a portal in your wall, and OUTBREAK in full VR at a gas station in the woods at night.</p>
              <p className="text-bone">Coming soon to Meta Quest 3 and 3S, Early Access planned. Each mode family can be played for 90 minutes for free.</p>
            </>
          )}
        </div>
      </section>

      <HazardDivider />

      {/* MODE FAMILIES */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('game.modes')}</span>
        <h2 className="font-heading text-2xl lg:text-3xl uppercase text-bone mt-2 mb-8">{t('game.modes')}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {modeFamilies.map((m) => (
            <SteelCard key={m.id} className="p-5 hover:border-blood/40 transition-colors">
              <div className="relative z-10">
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
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('game.features')}</span>
        <h2 className="font-heading text-2xl lg:text-3xl uppercase text-bone mt-2 mb-8">Features</h2>
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

      <HazardDivider />

      {/* CONTROLS */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('game.controls')}</span>
        <h2 className="font-heading text-2xl lg:text-3xl uppercase text-bone mt-2 mb-8">{t('game.controls')}</h2>
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
        <h2 className="font-heading text-2xl uppercase text-bone mb-6">{t('game.gear')}</h2>
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

      <HazardDivider />

      {/* REQUIREMENTS */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="font-heading text-2xl uppercase text-bone mb-4">{t('game.req')}</h2>
        <ul className="space-y-2 text-sm text-bone-muted font-body font-light">
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-blood mt-2 flex-shrink-0" />{de ? 'Meta Quest 3 oder 3S' : 'Meta Quest 3 or 3S'}</li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-blood mt-2 flex-shrink-0" />{de ? 'Für Reality Breach: ein Raumscan (Einstellungen → Physischer Raum → Raum einrichten). Rift und Outbreak brauchen keinen Raumscan.' : 'For Reality Breach: a room scan (Settings → Physical Space → Space Setup). Rift and Outbreak need no room scan.'}</li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-blood mt-2 flex-shrink-0" />{de ? 'Spielfläche ca. 2 × 2 m oder mehr empfohlen' : 'A play area of about 2 × 2 m or more recommended'}</li>
          <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-blood mt-2 flex-shrink-0" />{de ? 'Internet für Online-Co-op und Bestenlisten' : 'Internet for online co-op and leaderboards'}</li>
        </ul>
        <p className="text-xs text-bone-muted/60 font-body font-light mt-6">
          {de ? 'Screenshots und Trailer folgen mit der Store-Seite.' : 'Screenshots and a trailer will follow with the store page.'}
        </p>
      </section>
    </div>
  );
}
