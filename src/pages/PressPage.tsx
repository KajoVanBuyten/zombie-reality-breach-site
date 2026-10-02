import { useState } from 'react';
import { Copy, Check, Download, FileText, Image, Film, FileArchive, Skull } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { CONTACT_EMAIL } from '@/lib/site';
import SteelCard from '@/components/SteelCard';
import HazardDivider from '@/components/HazardDivider';

const facts = [
  { label: 'Developer', value: 'KaMa Studios' },
  { label: 'Based in', value: 'Cologne, Germany' },
  { label: 'Release', value: 'Coming soon to Meta Quest 3 and 3S · Early Access planned' },
  { label: 'Platforms', value: 'Meta Quest 3, Meta Quest 3S' },
  { label: 'Genre', value: 'Zombie survival shooter, mixed reality and VR' },
  { label: 'Modes', value: 'Reality Breach (MR, room scan) · Rift (MR, no room scan, roguelite) · Outbreak (full VR: Rooftop, Safe Zone, Gas Station)' },
  { label: 'Players', value: '1–4 in Reality Breach and Rift, 1–3 in Rooftop (local and online co-op)' },
  { label: 'Business model', value: 'Free to start: 90 minutes per mode family, then buy single modes or the complete pack. No loot boxes.' },
  { label: 'Engine', value: 'Unity 6, Meta XR SDK' },
  { label: 'Website', value: 'zombierealitybreach.com' },
  { label: 'Press contact', value: CONTACT_EMAIL },
];

const descriptions: { label: string; en: string }[] = [
  { label: 'Short', en: 'Zombie Reality Breach is a zombie survival shooter for Meta Quest 3 and 3S: zombies smash through the real doors and walls of your home in mixed reality, or you hold out at a gas station in the woods at night in full VR.' },
  { label: 'Medium', en: 'Zombie Reality Breach comes with three mode families. In REALITY BREACH the game reads your room scan and zombies break through your real doors and walls; between waves you restock in the shop. In RIFT a portal tears open your wall: two pistols, three hearts, an upgrade after every wave, bosses and roguelite runs. OUTBREAK is full VR at a gas station in the woods at night, starting with ROOFTOP, where up to three players each hold the roof of a car while the dead climb up. Play alone or in co-op. Coming soon to Meta Quest 3 and 3S.' },
];

const downloads = [
  { icon: FileArchive, label: 'Press kit complete (ZIP)', note: 'Coming soon' },
  { icon: Image, label: 'Logo (PNG transparent)', note: 'Coming soon' },
  { icon: Image, label: 'App icon (512\u00d7512)', note: 'Coming soon' },
  { icon: Image, label: 'Key art: hero, portrait, square', note: 'Coming soon' },
  { icon: Image, label: 'Screenshots (ZIP)', note: 'Coming soon' },
  { icon: Film, label: 'Trailer', note: 'Coming soon' },
  { icon: FileText, label: 'Fact sheet (PDF)', note: 'Coming soon' },
];

function CopyButton({ text }: { text: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard not available */ }
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1 text-[10px] font-heading uppercase tracking-wider text-blood hover:text-blood-hover transition-colors mt-2">
      {copied ? <><Check className="w-3 h-3" /> {t('press.copied')}</> : <><Copy className="w-3 h-3" /> {t('press.copy')}</>}
    </button>
  );
}

export default function PressPage() {
  const { t, lang } = useI18n();
  const de = lang === 'de';

  return (
    <div className="pt-20">
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('press.title')}</span>
        <h1 className="font-heading text-3xl lg:text-4xl uppercase text-bone mt-2 mb-10">{t('press.title')}</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* FACT SHEET */}
          <div>
            <h2 className="font-heading text-xl uppercase text-bone mb-5">{t('press.factsheet')}</h2>
            <div className="steel-card overflow-hidden divide-y divide-bg-steel/40">
              {facts.map((f) => (
                <div key={f.label} className="grid grid-cols-[130px_1fr] gap-3 px-5 py-3 relative z-10">
                  <span className="text-[10px] font-heading uppercase tracking-wider text-bone-muted self-center">{f.label}</span>
                  <span className="text-sm text-bone font-body font-light self-center">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DOWNLOADS */}
          <div>
            <h2 className="font-heading text-xl uppercase text-bone mb-5">{t('press.downloads')}</h2>
            <div className="space-y-3">
              {downloads.map((d) => (
                <SteelCard key={d.label} className="p-4 flex items-center gap-4 hover:border-blood/40 transition-colors group">
                  <div className="relative z-10 flex items-center gap-4 w-full">
                    <div className="w-10 h-10 flex items-center justify-center bg-blood/10 border border-blood/30 flex-shrink-0 group-hover:bg-blood/20 transition-colors">
                      <d.icon className="w-4 h-4 text-blood" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-bone font-body font-medium">{d.label}</div>
                      <div className="text-[10px] text-bone-muted/50 font-body">{d.note}</div>
                    </div>
                    <Download className="w-4 h-4 text-bone-muted/30 flex-shrink-0" />
                  </div>
                </SteelCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      <HazardDivider />

      {/* DESCRIPTIONS */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="font-heading text-xl uppercase text-bone mb-6">{t('press.descriptions')}</h2>
        <div className="space-y-5">
          {descriptions.map((d) => (
            <SteelCard key={d.label} className="p-5">
              <div className="relative z-10">
                <span className="text-[10px] font-heading uppercase tracking-wider text-ember">{d.label}</span>
                <p className="text-sm text-bone-muted font-body font-light leading-relaxed mt-2">{d.en}</p>
                <CopyButton text={d.en} />
              </div>
            </SteelCard>
          ))}
        </div>
      </section>

      <HazardDivider />

      {/* ABOUT STUDIO */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="font-heading text-xl uppercase text-bone mb-5">{t('press.studio')}</h2>
        <SteelCard className="p-6">
          <div className="relative z-10 flex items-start gap-4">
            <Skull className="w-8 h-8 text-blood flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm text-bone-muted font-body font-light leading-relaxed">
                {de
                  ? 'KaMa Studios ist ein kleines unabh\u00e4ngiges Studio, gegr\u00fcndet von Kajo und Martin. Wir machen VR- und Mixed-Reality-Spiele, die den Raum nutzen, in dem du stehst.'
                  : 'KaMa Studios is a small independent studio founded by Kajo and Martin. We make VR and mixed reality games that use the space you are standing in.'}
              </p>
            </div>
          </div>
        </SteelCard>

        <div className="mt-6 p-5 border border-dashed border-bg-steel text-center">
          <p className="text-[10px] font-heading uppercase tracking-wider text-bone-muted mb-1">{t('press.contact')}</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-blood hover:text-blood-hover font-body">{CONTACT_EMAIL}</a>
        </div>

        <div className="mt-6 steel-card p-5">
          <div className="relative z-10">
            <h3 className="text-[10px] font-heading uppercase tracking-wider text-ember mb-2">{t('press.terms')}</h3>
            <p className="text-xs text-bone-muted/70 font-body font-light leading-relaxed">
              {de
                ? 'Presse und Content-Creator d\u00fcrfen das Material f\u00fcr Berichterstattung, Videos und Streams verwenden. Monetarisierte Let\u2019s Plays sind willkommen.'
                : 'Press and content creators may use the material for reporting, videos and streams. Monetised let\u2019s plays are welcome.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
