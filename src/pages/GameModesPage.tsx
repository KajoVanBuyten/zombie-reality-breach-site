import { useI18n } from '@/lib/i18n';
import SteelCard from '@/components/SteelCard';
import HazardDivider from '@/components/HazardDivider';
import { modeFamilies, riftUpgrades, zombieKinds } from '@/content/modes';
import KeyArt from '@/components/KeyArt';
import { Gift } from 'lucide-react';
import PageHero from '@/components/PageHero';
import Backdrop from '@/components/Backdrop';
import { keyArtThemes } from '@/lib/site';

export default function GameModesPage() {
  const { t, lang } = useI18n();
  const de = lang === 'de';

  return (
    <div className="pt-16">
      <PageHero
        theme={keyArtThemes.outbreak}
        kicker={`// ${t('modes.title')}`}
        title={t('modes.title')}
        intro={de
          ? 'Drei Modusfamilien: REALITY BREACH und RIFT in Mixed Reality in deinem eigenen Raum, OUTBREAK in vollem VR an einer Tankstelle im Wald bei Nacht. Das Spiel erscheint bald für Meta Quest 3 und 3S (Early Access geplant).'
          : 'Three mode families: REALITY BREACH and RIFT in mixed reality in your own room, OUTBREAK in full VR at a gas station in the woods at night. The game is coming soon to Meta Quest 3 and 3S (Early Access planned).'}
      />

      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">

        <div className="space-y-8">
          {modeFamilies.map((m) => (
            <SteelCard key={m.id} className="overflow-hidden hover:border-blood/40 transition-colors">
              <div className="md:flex">
                <div className="relative md:w-2/5 h-56 md:h-auto overflow-hidden flex-shrink-0">
                  <KeyArt theme={m.theme} widths={[1280, 800]} sizes="(min-width: 768px) 40vw, 100vw" alt={m.imageAlt} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg-surface md:block hidden" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-surface to-transparent md:hidden" />
                </div>
                <div className="relative z-10 p-6 md:p-8 flex-1">
                  <h2 className="section-title font-heading text-2xl uppercase text-bone mb-1">{m.name}</h2>
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
                          <h3 className="font-heading text-base uppercase text-bone mt-3 mb-0.5">{s.name}</h3>
                          <p className="text-[10px] font-heading uppercase tracking-wider text-ember mb-2">{de ? s.playersDe : s.players}</p>
                          <p className="text-xs text-bone-muted font-body font-light leading-relaxed">{de ? s.descDe : s.desc}</p>
                          {s.points.length > 0 && (
                            <ul className="mt-3 space-y-1 text-[11px] text-bone-muted/80 font-body font-light list-disc pl-4">
                              {s.points.map((p) => <li key={p.en}>{de ? p.de : p.en}</li>)}
                            </ul>
                          )}
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
              <h2 className="section-title font-heading text-2xl uppercase text-bone mb-1">{de ? 'Mehrspieler (Co-op)' : 'Multiplayer (Co-op)'}</h2>
              <p className="text-xs font-heading text-ember uppercase tracking-wider mb-4">
                {de ? 'Bis zu 4 in Reality Breach, Rift und Gas Station · bis zu 3 in Rooftop und Safe Zone' : 'Up to 4 in Reality Breach, Rift and Gas Station · up to 3 in Rooftop and Safe Zone'}
              </p>
              <p className="text-sm text-bone-muted font-body font-light leading-relaxed mb-5">
                {de
                  ? 'Erstelle eine Lobby, teile den Code, wähle Modus und Schwierigkeit. Nur der Host startet; alle anderen sehen die Auswahl des Hosts. Lokal im selben WLAN, online über Relay mit Code. Kein Sprachchat im Spiel.'
                  : 'Host a lobby, share the code, pick the mode and difficulty. Only the host starts; everyone else sees what the host chose while they wait. Local in the same Wi-Fi, online over relay with a code. No voice chat in the game.'}
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mb-5">
                <div className="p-4 bg-bg/60 border border-bg-steel">
                  <h3 className="font-heading text-sm uppercase text-ember mb-2">Reality Breach</h3>
                  <p className="text-xs text-bone-muted font-body font-light">{de ? 'Bis zu vier Spieler, nur im selben Raum (geteilter Raumscan). Online schaltet die Lobby auf Rift um.' : 'Up to four players, same room only (shared room scan). Going online switches the lobby to Rift.'}</p>
                </div>
                <div className="p-4 bg-bg/60 border border-bg-steel">
                  <h3 className="font-heading text-sm uppercase text-ember mb-2">Rift</h3>
                  <p className="text-xs text-bone-muted font-body font-light">{de ? 'Bis zu vier Spieler, im selben Raum oder online. Drei gemeinsame Herzen, eigene Pistolen und Coins.' : 'Up to four players, same room or online. Three shared hearts, personal pistols and coins.'}</p>
                </div>
                <div className="p-4 bg-bg/60 border border-bg-steel">
                  <h3 className="font-heading text-sm uppercase text-ember mb-2">Outbreak</h3>
                  <p className="text-xs text-bone-muted font-body font-light">{de ? 'Rooftop bis drei (jeder auf seinem Auto, auch im selben Raum), Safe Zone bis drei (jeder in seinem Zimmer), Gas Station bis vier. Mit Meta-Avataren, lokal oder online.' : 'Rooftop up to three (one car each, same room allowed), Safe Zone up to three (each in their own room), Gas Station up to four. With Meta avatars, local or online.'}</p>
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
                <h2 className="section-title font-heading text-xl uppercase text-bone mb-2">{t('home.free.title')}</h2>
                <p className="text-sm text-bone-muted font-body font-light leading-relaxed">{t('home.free.text')}</p>
              </div>
            </div>
          </SteelCard>
        </div>
      </section>

      <HazardDivider />

      {/* ENEMIES */}
      <Backdrop theme={keyArtThemes.rift} opacity={0.16}>
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">
        <h2 className="section-title font-heading text-2xl uppercase text-bone mb-2">{de ? 'Die Toten' : 'The dead'}</h2>
        <p className="text-sm text-bone-muted font-body font-light leading-relaxed max-w-3xl mb-6">
          {de
            ? 'Vier Typen, in allen Modi dieselben. Leben und Tempo wachsen mit jeder Welle. Kopfschüsse zählen; Klingen nehmen Gliedmaßen, und beinlose Zombies kriechen weiter.'
            : 'Four kinds, the same in every mode. Health and speed grow with every wave. Headshots count; blades take limbs, and legless zombies keep crawling.'}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zombieKinds.map((z) => (
            <SteelCard key={z.name} className="p-5 hover:border-blood/40 transition-colors">
              <div className="relative z-10">
                <span className="text-[10px] font-heading uppercase tracking-wider text-ember">{de ? z.fromDe : z.from}</span>
                <h3 className="font-heading text-lg uppercase text-bone mt-1 mb-2">{z.name}</h3>
                <p className="text-xs text-bone-muted font-body font-light leading-relaxed">{de ? z.descDe : z.desc}</p>
              </div>
            </SteelCard>
          ))}
        </div>
      </section>
      </Backdrop>

      <HazardDivider />

      {/* RIFT UPGRADES */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="section-title font-heading text-2xl uppercase text-bone mb-2">{de ? 'Rift: die Upgrades' : 'Rift: the upgrades'}</h2>
        <p className="text-sm text-bone-muted font-body font-light leading-relaxed mb-6">
          {de
            ? 'Nach jeder Welle zwei Karten: eine gratis und schwächer, eine für Coins und stärker. Du nimmst eine; sie geht an die Pistole der Hand, die geklickt hat. Coins gibt es nur im Spiel, neue Spieler starten mit 500.'
            : 'After every wave two cards: one free and weaker, one for coins and stronger. You take one; it goes to the pistol of the hand that clicked. Coins are earned in play only; new players start with 500.'}
        </p>
        <div className="steel-card overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-steel text-left">
                <th className="px-4 py-3 font-heading text-[10px] uppercase tracking-wider text-bone-muted">Upgrade</th>
                <th className="px-4 py-3 font-heading text-[10px] uppercase tracking-wider text-bone-muted">{de ? 'Gratis' : 'Free'}</th>
                <th className="px-4 py-3 font-heading text-[10px] uppercase tracking-wider text-bone-muted">{de ? 'Für Coins' : 'For coins'}</th>
                <th className="px-4 py-3 font-heading text-[10px] uppercase tracking-wider text-bone-muted">{de ? 'Preis' : 'Price'}</th>
              </tr>
            </thead>
            <tbody className="font-body font-light text-bone-muted">
              {riftUpgrades.map((u) => (
                <tr key={u.name} className="border-b border-bg-steel/40 last:border-0">
                  <td className="px-4 py-3 font-heading text-xs text-ember uppercase whitespace-nowrap">{u.name}</td>
                  <td className="px-4 py-3">{de ? u.freeDe : u.free}</td>
                  <td className="px-4 py-3">{de ? u.paidDe : u.paid}{u.cap && <span className="block text-[10px] text-bone-muted/60">{de ? u.capDe : u.cap}</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{u.price} Coins</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-bone-muted/60 font-body font-light mt-3">
          {de ? 'Ab dem zweiten besiegten Boss bietet der Upgrade-Bildschirm zusätzlich einen grünen Laser für 250 Coins an.' : 'From the second boss you beat, the upgrade screen also offers a green laser for 250 coins.'}
        </p>
      </section>

      <HazardDivider />

      {/* DIFFICULTY TABLE */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="section-title font-heading text-2xl uppercase text-bone mb-6">{t('modes.diff')}</h2>
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
              <tr className="border-b border-bg-steel/40">
                <td className="px-4 py-3 font-heading text-xs text-ember uppercase">{de ? 'Zombieschaden' : 'Zombie damage'}</td>
                <td className="px-4 py-3">× 0.7</td>
                <td className="px-4 py-3">× 1.3</td>
              </tr>
              <tr className="border-b border-bg-steel/40">
                <td className="px-4 py-3 font-heading text-xs text-ember uppercase">{de ? 'Heilung in der Pause' : 'Healing in the break'}</td>
                <td className="px-4 py-3">{de ? 'Voll' : 'Full'}</td>
                <td className="px-4 py-3">35 %</td>
              </tr>
              <tr className="border-b border-bg-steel/40">
                <td className="px-4 py-3 font-heading text-xs text-ember uppercase">{de ? 'Zombies pro Welle' : 'Zombies per wave'}</td>
                <td className="px-4 py-3" colSpan={2}>{de ? 'Gleich: 9 in Welle 1, dann +1 je Welle, höchstens 6 gleichzeitig (3 in kleinen Räumen)' : 'The same: 9 in wave 1, then +1 per wave, at most 6 at once (3 in small rooms)'}</td>
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
