import { Crosshair, Swords, Zap, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import SteelCard from '@/components/SteelCard';
import HazardDivider from '@/components/HazardDivider';
import { weapons, mods, type WeaponClass } from '@/content/weapons';

const classIcon: Record<WeaponClass, LucideIcon> = {
  pistol: Crosshair,
  melee: Swords,
  smg: Zap,
  shotgun: Target,
  rifle: Crosshair,
};

export default function ArsenalPage() {
  const { t, lang } = useI18n();
  const de = lang === 'de';

  return (
    <div className="pt-20">
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('arsenal.title')}</span>
        <h1 className="font-heading text-3xl lg:text-4xl uppercase text-bone mt-2 mb-10">{t('arsenal.title')}</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {weapons.map((w) => {
            const Icon = classIcon[w.cls];
            return (
              <SteelCard key={w.id} className="p-5 hover:border-blood/40 transition-colors group">
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-blood/10 border border-blood/30 group-hover:bg-blood/20 transition-colors">
                      <Icon className="w-5 h-5 text-blood" />
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-heading uppercase tracking-wider clip-tag ${w.starter ? 'bg-ember text-bg' : 'bg-bg-steel text-bone-muted'}`}>
                      {w.starter ? (de ? 'Start' : 'Starter') : (de ? 'Arsenal' : 'Armory')}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg uppercase text-bone">{w.name}</h3>
                  <p className="text-[10px] font-heading uppercase tracking-wider text-blood mb-2">{de ? w.typeDe : w.type}</p>
                  <p className="text-xs text-bone-muted font-body font-light leading-relaxed">{de ? w.descDe : w.desc}</p>
                </div>
              </SteelCard>
            );
          })}
        </div>
      </section>

      <HazardDivider />

      {/* MODS */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="font-heading text-2xl uppercase text-bone mb-6">{t('arsenal.mods')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mods.map((m) => (
            <SteelCard key={m.en} className="p-4 hover:border-blood/40 transition-colors">
              <div className="relative z-10">
                <span className="text-sm text-bone-muted font-body font-light">{de ? m.de : m.en}</span>
              </div>
            </SteelCard>
          ))}
        </div>
      </section>

      <HazardDivider />

      {/* SHOP & ARMORY */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="font-heading text-2xl uppercase text-bone mb-6">{t('arsenal.economy')}</h2>
        <div className="space-y-3 text-sm text-bone-muted font-body font-light leading-relaxed">
          <p>
            {de
              ? 'In Reality Breach bringen Kills und abgeschlossene Wellen Spielgeld. Damit kaufst du zwischen den Wellen im Pausenshop Waffen, Munition und Ausrüstung. Das Arsenal im Hauptmenü schaltet Waffen dauerhaft frei.'
              : 'In Reality Breach, kills and cleared waves earn in-game money. Between waves you spend it in the break shop on weapons, ammo and gear. The Armory in the main menu unlocks weapons for good.'}
          </p>
          <p>
            {de
              ? 'In Rift wählst du stattdessen nach jeder Welle ein Upgrade.'
              : 'In Rift you pick an upgrade after every wave instead.'}
          </p>
          <p className="text-xs text-bone-muted/70">
            {de
              ? 'Spielgeld wird nur im Spiel verdient und kann nicht mit echtem Geld gekauft werden. Keine Lootboxen.'
              : 'In-game money is only earned by playing and cannot be bought with real money. No loot boxes.'}
          </p>
        </div>
      </section>
    </div>
  );
}
