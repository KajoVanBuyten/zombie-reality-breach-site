import { useMemo, useState } from 'react';
import { Lock, ShoppingCart, Sparkles, Crosshair, Swords, Zap, Target, Flame, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { keyArtThemes } from '@/lib/site';
import SteelCard from '@/components/SteelCard';
import HazardDivider from '@/components/HazardDivider';
import KeyArt from '@/components/KeyArt';
import WeaponImage from '@/components/WeaponImage';
import { weapons, weaponClasses, weaponName, mods, supplies, armoryLadder, type WeaponClass } from '@/content/weapons';

const classIcon: Record<WeaponClass, LucideIcon> = {
  pistol: Crosshair,
  melee: Swords,
  smg: Zap,
  shotgun: Target,
  rifle: Crosshair,
  special: Flame,
};

function money(n: number): string {
  return `${n.toLocaleString('en-US')} $`;
}

export default function ArsenalPage() {
  const { t, lang } = useI18n();
  const de = lang === 'de';
  const [filter, setFilter] = useState<WeaponClass | 'all'>('all');

  const shown = useMemo(() => (filter === 'all' ? weapons : weapons.filter((w) => w.cls === filter)), [filter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: weapons.length };
    for (const w of weapons) c[w.cls] = (c[w.cls] ?? 0) + 1;
    return c;
  }, []);

  return (
    <div className="pt-16">
      {/* HEADER */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <KeyArt theme={keyArtThemes.game} kind="banner-clean" sizes="100vw" alt="" className="w-full h-full object-cover object-center opacity-40" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/70 to-bg" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 pt-16 pb-10 lg:pt-24 lg:pb-14">
          <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('arsenal.title')}</span>
          <h1 className="font-heading text-3xl lg:text-5xl uppercase text-bone mt-2 mb-4">{t('arsenal.title')}</h1>
          <p className="text-sm lg:text-base text-bone-muted font-body font-light leading-relaxed max-w-3xl">
            {de
              ? '24 Waffen, 17 Aufsätze, echte Handgriffe. Jede Waffe wird so geladen wie ihr Vorbild: Magazin, Schlitten, Pumpe, Knicklauf, Trommel oder Zuführdeckel. Zwei Startwaffen, 19 Freischaltungen im Arsenal, der Rest im Pausenshop.'
              : '24 weapons, 17 attachments, real handling. Every gun loads like the real thing: magazine, slide, pump, break action, cylinder or feed cover. Two starter weapons, 19 Armory unlocks, the rest from the break shop.'}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-[11px] font-heading uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-ember"><Sparkles className="w-3.5 h-3.5" /> {de ? 'Start: von Welle 1 an' : 'Starter: from wave 1'}</span>
            <span className="flex items-center gap-1.5 text-gold"><Lock className="w-3.5 h-3.5" /> {de ? 'Arsenal: Welle erreichen, einmal zahlen' : 'Armory: reach the wave, pay once'}</span>
            <span className="flex items-center gap-1.5 text-bone-muted"><ShoppingCart className="w-3.5 h-3.5" /> {de ? 'Shop: Preis je Lauf in der Pause' : 'Shop: price per run, in the break'}</span>
          </div>
        </div>
      </section>

      {/* WEAPONS */}
      <section id="weapons" className="py-12 lg:py-16 max-w-7xl mx-auto px-4 lg:px-8 scroll-mt-20">
        <div className="flex flex-wrap gap-2 mb-8">
          {weaponClasses.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-3 py-1.5 text-[11px] font-heading uppercase tracking-wider border transition-colors ${
                filter === c.id ? 'bg-blood border-blood text-bone' : 'border-bg-steel text-bone-muted hover:text-bone hover:border-bone-muted'
              }`}
            >
              {de ? c.de : c.en} <span className="opacity-60">{counts[c.id] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shown.map((w) => {
            const Icon = classIcon[w.cls];
            return (
              <SteelCard key={w.id} className="hover:border-blood/40 transition-colors group flex flex-col">
                <div className="relative aspect-video overflow-hidden weapon-stage">
                  {w.noImage ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="w-12 h-12 text-bone-muted/30" />
                    </div>
                  ) : (
                    <WeaponImage id={w.id} alt={w.name} className="absolute inset-0 w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-700" />
                  )}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
                    <span className="px-2 py-0.5 bg-bg/70 backdrop-blur-sm border border-bg-steel text-[10px] font-heading uppercase tracking-wider text-bone-muted flex items-center gap-1">
                      <Icon className="w-3 h-3 text-blood" /> {de ? w.typeDe : w.type}
                    </span>
                    {w.starter ? (
                      <span className="px-2 py-0.5 bg-ember text-bg text-[10px] font-heading uppercase tracking-wider clip-tag">{de ? 'Start' : 'Starter'}</span>
                    ) : w.armory ? (
                      <span className="px-2 py-0.5 bg-gold/90 text-bg text-[10px] font-heading uppercase tracking-wider clip-tag flex items-center gap-1">
                        <Lock className="w-3 h-3" /> {de ? 'Welle' : 'Wave'} {w.armory.wave}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-bg-steel text-bone-muted text-[10px] font-heading uppercase tracking-wider clip-tag">Shop</span>
                    )}
                  </div>
                </div>
                <div className="relative z-10 p-5 flex-1 flex flex-col">
                  <h3 className="font-heading text-lg uppercase text-bone leading-tight">{w.name}</h3>
                  <p className="text-xs text-bone-muted font-body font-light leading-relaxed mt-2">{de ? w.descDe : w.desc}</p>
                  <dl className="mt-4 space-y-1.5 text-xs font-body">
                    {w.mag && (
                      <div className="flex gap-3">
                        <dt className="w-24 flex-shrink-0 font-heading text-[10px] uppercase tracking-wider text-ember pt-0.5">{de ? 'Magazin' : 'Magazine'}</dt>
                        <dd className="text-bone-muted font-light">{de ? w.magDe : w.mag}</dd>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <dt className="w-24 flex-shrink-0 font-heading text-[10px] uppercase tracking-wider text-ember pt-0.5">{de ? 'Handhabung' : 'Handling'}</dt>
                      <dd className="text-bone-muted font-light">{de ? w.handlingDe : w.handling}</dd>
                    </div>
                    {w.freeAmmo && (
                      <div className="flex gap-3">
                        <dt className="w-24 flex-shrink-0 font-heading text-[10px] uppercase tracking-wider text-ember pt-0.5">{de ? 'Munition' : 'Ammo'}</dt>
                        <dd className="text-bone-muted font-light">{de ? 'Frei: unbegrenzt auf Easy, Reserve und Pickups auf Hard' : 'Free: unlimited on Easy, reserve and pickups on Hard'}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-auto pt-4 flex items-center justify-between gap-3 text-[11px] font-heading uppercase tracking-wider border-t border-bg-steel/60 mt-4">
                    {w.starter ? (
                      <span className="text-ember">{de ? 'Immer am Gürtel' : 'Always in the belt'}</span>
                    ) : (
                      <>
                        {w.armory && <span className="text-gold flex items-center gap-1"><Lock className="w-3 h-3" /> {money(w.armory.cost)}</span>}
                        {w.shop !== undefined && <span className="text-bone-muted flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> {money(w.shop)}</span>}
                      </>
                    )}
                  </div>
                </div>
              </SteelCard>
            );
          })}
        </div>
      </section>

      <HazardDivider />

      {/* ARMORY LADDER */}
      <section className="py-12 lg:py-16 max-w-7xl mx-auto px-4 lg:px-8">
        <h2 className="font-heading text-2xl uppercase text-bone mb-2">{de ? 'Die Arsenal-Leiter' : 'The Armory ladder'}</h2>
        <p className="text-sm text-bone-muted font-body font-light leading-relaxed max-w-3xl mb-6">
          {de
            ? 'Jede Freischaltung braucht eine beste erreichte Welle und wird einmal vom Geldkonto bezahlt, das über alle Läufe bleibt. Alle zwei bis drei Wellen gibt es etwas Neues. In OUTBREAK gilt dieselbe Leiter mit einem eigenen VR-Konto.'
            : 'Every unlock needs a best wave you have reached and is paid once from the money account that persists across runs. Something new every two or three waves. OUTBREAK uses the same ladder with its own VR account.'}
        </p>
        <div className="steel-card overflow-x-auto">
          <ol className="flex gap-0 min-w-max relative z-10 p-4">
            {armoryLadder.map((w, i) => (
              <li key={w.id} className="flex items-center">
                <button onClick={() => { setFilter(w.cls); document.getElementById('weapons')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="group text-left w-28" title={w.name}>
                  <div className="h-16 weapon-stage rounded-sm overflow-hidden flex items-center justify-center">
                    <WeaponImage id={w.id} alt="" sizes="112px" className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="mt-1.5 text-[10px] font-heading uppercase tracking-wider text-gold">{de ? 'Welle' : 'Wave'} {w.armory!.wave}</div>
                  <div className="text-xs font-heading uppercase text-bone leading-tight">{w.name}</div>
                  <div className="text-[10px] font-body text-bone-muted">{money(w.armory!.cost)}</div>
                </button>
                {i < armoryLadder.length - 1 && <div className="w-4 h-px bg-bg-steel mx-1 mb-10" />}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <HazardDivider />

      {/* MODS */}
      <section className="py-12 lg:py-16 max-w-7xl mx-auto px-4 lg:px-8">
        <h2 className="font-heading text-2xl uppercase text-bone mb-2">{de ? 'Aufsätze' : 'Mods'}</h2>
        <p className="text-sm text-bone-muted font-body font-light leading-relaxed max-w-3xl mb-6">
          {de
            ? 'Aufsätze sind greifbare Teile. Du kaufst sie im Pausenshop, hältst sie an die Waffe, und sie rasten ein. Angebaut bedient sie nur die freie Hand: Abzug schaltet, Griff nimmt ab. Je Anbauplatz passt ein Aufsatz; am Ende des Laufs sind sie weg.'
            : 'Mods are grabbable parts. Buy one in the break shop, hold it against the weapon and it clicks on. Once mounted only your free hand works it: trigger switches, grip removes. One mod per slot; they are gone when the run ends.'}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mods.map((m) => (
            <SteelCard key={m.id} className="p-4 hover:border-blood/40 transition-colors">
              <div className="relative z-10 flex gap-4">
                {m.image && (
                  <div className="w-24 h-16 flex-shrink-0 weapon-stage rounded-sm overflow-hidden">
                    <WeaponImage id={m.image} alt="" sizes="96px" className="w-full h-full object-contain p-1" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-base uppercase text-bone leading-tight">{de ? m.nameDe : m.name}</h3>
                    <span className="text-[11px] font-heading text-bone-muted whitespace-nowrap">{money(m.price)}</span>
                  </div>
                  <p className="text-xs text-bone-muted font-body font-light leading-relaxed mt-1">{de ? m.effectDe : m.effect}</p>
                  <p className="text-[10px] font-body text-bone-muted/70 mt-2 leading-relaxed">
                    <span className="font-heading uppercase tracking-wider text-ember/80">{de ? 'Passt an: ' : 'Fits: '}</span>
                    {m.fits === 'guns'
                      ? (de ? 'jede Schusswaffe' : 'every firearm')
                      : m.fits.map((id) => weaponName[id]).join(', ')}
                    {m.fitsAlso && `, ${m.fitsAlso.map((id) => weaponName[id]).join(', ')}`}
                  </p>
                </div>
              </div>
            </SteelCard>
          ))}
        </div>
      </section>

      <HazardDivider />

      {/* SUPPLIES */}
      <section className="py-12 lg:py-16 max-w-7xl mx-auto px-4 lg:px-8">
        <h2 className="font-heading text-2xl uppercase text-bone mb-2">{de ? 'Vorräte & Upgrades' : 'Supplies & upgrades'}</h2>
        <p className="text-sm text-bone-muted font-body font-light leading-relaxed max-w-3xl mb-6">
          {de
            ? 'Der Reiter SUPPLIES im Pausenshop: Heilung, Munition, größere Magazine, Sprit und Bretter. Upgrades sind keine Gegenstände, sondern gekaufte Stufen an der Waffe.'
            : 'The SUPPLIES tab of the break shop: healing, ammo, bigger magazines, fuel and boards. Upgrades are not items but purchased steps on the weapon itself.'}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplies.map((s) => (
            <SteelCard key={s.id} className="p-4 hover:border-blood/40 transition-colors">
              <div className="relative z-10 flex gap-4">
                <div className="w-20 h-16 flex-shrink-0 weapon-stage rounded-sm overflow-hidden flex items-center justify-center">
                  {s.image ? <WeaponImage id={s.image} alt="" sizes="80px" className="w-full h-full object-contain p-1" /> : <Package className="w-6 h-6 text-bone-muted/40" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-base uppercase text-bone leading-tight">{de ? s.nameDe : s.name}</h3>
                  <span className="text-[11px] font-heading text-bone-muted">{de ? s.priceDe : s.price}</span>
                  <p className="text-xs text-bone-muted font-body font-light leading-relaxed mt-1">{de ? s.descDe : s.desc}</p>
                </div>
              </div>
            </SteelCard>
          ))}
        </div>
      </section>

      <HazardDivider />

      {/* SHOP & ARMORY */}
      <section className="py-12 lg:py-16 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="font-heading text-2xl uppercase text-bone mb-6">{t('arsenal.economy')}</h2>
        <div className="space-y-3 text-sm text-bone-muted font-body font-light leading-relaxed">
          <p>
            {de
              ? 'In REALITY BREACH und OUTBREAK bringen Kills und abgeschlossene Wellen Spielgeld: 10 $ pro Zombie, 25 $ pro Welle, mehr für Brutes und Bosse. Damit kaufst du in der Pause Waffen, Munition, Aufsätze und Vorräte für diesen Lauf. Das Arsenal im Hauptmenü schaltet Waffen dauerhaft frei: beste erreichte Welle plus Einmalpreis. OUTBREAK führt ein eigenes VR-Konto mit denselben Preisen.'
              : 'In REALITY BREACH and OUTBREAK, kills and cleared waves earn in-game money: 10 $ per zombie, 25 $ per wave, more for brutes and bosses. You spend it in the break on weapons, ammo, mods and supplies for that run. The Armory in the main menu unlocks weapons for good: best wave reached plus a one-time price. OUTBREAK keeps its own VR account with the same prices.'}
          </p>
          <p>
            {de
              ? 'RIFT spielt sich anders: Du startest mit einer Pistole am Controller, bekommst die zweite nach dem ersten Boss und wählst nach jeder Welle ein Upgrade statt im Shop zu kaufen.'
              : 'RIFT works differently: you start with one pistol on the controller, earn the second after the first boss, and pick an upgrade after every wave instead of shopping.'}
          </p>
          <p className="text-xs text-bone-muted/70">
            {de
              ? 'Spielgeld und Coins werden nur im Spiel verdient und können nicht mit echtem Geld gekauft werden. Keine Lootboxen. Werte Stand Oktober 2026, Balancing in Arbeit.'
              : 'In-game money and coins are only earned by playing and cannot be bought with real money. No loot boxes. Values as of October 2026, balancing in progress.'}
          </p>
        </div>
      </section>
    </div>
  );
}
