import { useI18n } from '@/lib/i18n';
import SteelCard from '@/components/SteelCard';
import HazardDivider from '@/components/HazardDivider';
import { modeFamilies } from '@/content/modes';
import { Gift } from 'lucide-react';

export default function GameModesPage() {
  const { t, lang } = useI18n();
  const de = lang === 'de';

  return (
    <div className="pt-20">
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('modes.title')}</span>
        <h1 className="font-heading text-3xl lg:text-4xl uppercase text-bone mt-2 mb-4">{t('modes.title')}</h1>
        <p className="text-sm text-bone-muted font-body font-light leading-relaxed mb-10 max-w-3xl">
          {de
            ? 'Drei Modusfamilien: REALITY BREACH und RIFT in Mixed Reality in deinem eigenen Raum, OUTBREAK in vollem VR an einer Tankstelle im Wald bei Nacht. Das Spiel erscheint bald für Meta Quest 3 und 3S (Early Access geplant).'
            : 'Three mode families: REALITY BREACH and RIFT in mixed reality in your own room, OUTBREAK in full VR at a gas station in the woods at night. The game is coming soon to Meta Quest 3 and 3S (Early Access planned).'}
        </p>

        <div className="space-y-8">
          {modeFamilies.map((m) => (
            <SteelCard key={m.id} className="overflow-hidden hover:border-blood/40 transition-colors">
              <div className="md:flex">
                <div className="relative md:w-2/5 h-56 md:h-auto overflow-hidden flex-shrink-0">
                  <img src={m.image} alt={m.imageAlt} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg-surface md:block hidden" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-surface to-transparent md:hidden" />
                </div>
                <div className="relative z-10 p-6 md:p-8 flex-1">
                  <h2 className="font-heading text-2xl uppercase text-bone mb-1">{m.name}</h2>
                  <p className="text-xs font-heading text-ember uppercase tracking-wider mb-4">{de ? m.kindDe : m.kind}</p>
                  <p className="text-sm text-bone-muted font-body font-light leading-relaxed mb-4">{de ? m.descDe : m.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(de ? m.tagsDe : m.tags).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-bg-steel/60 text-bone-muted text-[10px] font-heading uppercase tracking-wider">{tag}</span>
                    ))}
                  </div>
                  {m.points.length > 0 && (
                    <ul className="space-y-1 text-xs text-bone-muted/80 font-body font-light list-disc pl-4">
                      {m.points.map((p) => <li key={p.en}>{de ? p.de : p.en}</li>)}
                    </ul>
                  )}
                  {m.subModes && (
                    <div className="grid sm:grid-cols-3 gap-3 mt-2">
                      {m.subModes.map((s) => (
                        <div key={s.id} className="p-4 bg-bg/60 border border-bg-steel">
                          <span className={`text-[10px] font-heading uppercase tracking-wider px-2 py-0.5 border ${
                            s.status === 'playable' ? 'text-gold border-gold/40 bg-gold/10' : 'text-bone-muted border-bg-steel'
                          }`}>
                            {t(s.status === 'playable' ? 'modes.playable' : 'modes.inDev')}
                          </span>
                          <h3 className="font-heading text-base uppercase text-bone mt-3 mb-1">{s.name}</h3>
                          <p className="text-xs text-bone-muted font-body font-light leading-relaxed">{de ? s.descDe : s.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SteelCard>
          ))}

          {/* MULTIPLAYER */}
          <SteelCard className="overflow-hidden hover:border-blood/40 transition-colors">
            <div className="relative z-10 p-6 md:p-8">
              <h2 className="font-heading text-2xl uppercase text-bone mb-1">{de ? 'Mehrspieler (Co-op)' : 'Multiplayer (Co-op)'}</h2>
              <p className="text-xs font-heading text-ember uppercase tracking-wider mb-4">
                {de ? 'Bis zu 4 in Reality Breach und Rift · bis zu 3 in Rooftop' : 'Up to 4 in Reality Breach and Rift · up to 3 in Rooftop'}
              </p>
              <p className="text-sm text-bone-muted font-body font-light leading-relaxed mb-5">
                {de
                  ? 'Erstelle eine Lobby, teile den Code, wähle Modus und Schwierigkeit. Nur der Host startet; alle anderen sehen die Auswahl des Hosts.'
                  : 'Host a lobby, share the code, pick the mode and difficulty. Only the host starts; everyone else sees what the host chose while they wait.'}
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mb-5">
                <div className="p-4 bg-bg/60 border border-bg-steel">
                  <h3 className="font-heading text-sm uppercase text-ember mb-2">Reality Breach</h3>
                  <p className="text-xs text-bone-muted font-body font-light">{de ? 'Bis zu vier Spieler, im selben Raum (geteilter Raum) oder online.' : 'Up to four players, in the same room (shared space) or online.'}</p>
                </div>
                <div className="p-4 bg-bg/60 border border-bg-steel">
                  <h3 className="font-heading text-sm uppercase text-ember mb-2">Rift</h3>
                  <p className="text-xs text-bone-muted font-body font-light">{de ? 'Bis zu vier Spieler im Online-Co-op.' : 'Up to four players in online co-op.'}</p>
                </div>
                <div className="p-4 bg-bg/60 border border-bg-steel">
                  <h3 className="font-heading text-sm uppercase text-ember mb-2">Rooftop</h3>
                  <p className="text-xs text-bone-muted font-body font-light">{de ? 'Bis zu drei Spieler, jeder auf seinem Auto, mit Meta-Avataren, lokal oder online.' : 'Up to three players, one car each, with Meta avatars, local or online.'}</p>
                </div>
              </div>
              <p className="text-xs text-bone-muted/60 font-body font-light">
                {de ? 'Online: Freunde per Meta einladen oder mit Code beitreten.' : 'Online: invite friends through Meta or join with a code.'}
              </p>
            </div>
          </SteelCard>

          {/* FREE TO START */}
          <SteelCard className="p-6 md:p-8 border-gold/30">
            <div className="relative z-10 flex items-start gap-4">
              <Gift className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
              <div>
                <h2 className="font-heading text-xl uppercase text-bone mb-2">{t('home.free.title')}</h2>
                <p className="text-sm text-bone-muted font-body font-light leading-relaxed">{t('home.free.text')}</p>
              </div>
            </div>
          </SteelCard>
        </div>
      </section>

      <HazardDivider />

      {/* DIFFICULTY TABLE */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="font-heading text-2xl uppercase text-bone mb-6">{t('modes.diff')}</h2>
        <div className="steel-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-steel text-left">
                <th className="px-4 py-3 font-heading text-[10px] uppercase tracking-wider text-bone-muted"></th>
                <th className="px-4 py-3 font-heading text-[10px] uppercase tracking-wider text-bone-muted">{t('leaderboard.easy')}</th>
                <th className="px-4 py-3 font-heading text-[10px] uppercase tracking-wider text-bone-muted">{t('leaderboard.hard')}</th>
              </tr>
            </thead>
            <tbody className="font-body font-light text-bone-muted">
              <tr className="border-b border-bg-steel/40">
                <td className="px-4 py-3 font-heading text-xs text-ember uppercase">{de ? 'Pistolenmunition' : 'Pistol ammo'}</td>
                <td className="px-4 py-3">{de ? 'Unbegrenzt' : 'Unlimited'}</td>
                <td className="px-4 py-3">{de ? 'Begrenzt, Munition in der Pause im Raum aufsammeln' : 'Limited, pick up ammo in the room during the break'}</td>
              </tr>
              <tr className="border-b border-bg-steel/40">
                <td className="px-4 py-3 font-heading text-xs text-ember uppercase">{de ? 'Pillen zu Beginn' : 'Pain pills at start'}</td>
                <td className="px-4 py-3">1</td>
                <td className="px-4 py-3">0</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-heading text-xs text-ember uppercase">{de ? 'Bestenliste' : 'Leaderboard'}</td>
                <td className="px-4 py-3">{de ? 'Eigenes Board' : 'Own board'}</td>
                <td className="px-4 py-3">{de ? 'Eigenes Board' : 'Own board'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
