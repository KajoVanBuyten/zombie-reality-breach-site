import { useState } from 'react';
import { Copy, Check, Download, FileText, Image, Film, FileArchive, Skull } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { CONTACT_EMAIL, asset, keyArtGallery, keyArtJpg, keyArtSrcSet, keyArtThemes } from '@/lib/site';
import manifest from '@/content/asset-manifest.json';
import SteelCard from '@/components/SteelCard';
import HazardDivider from '@/components/HazardDivider';
import PageHero from '@/components/PageHero';
import SocialLinks from '@/components/SocialLinks';

const facts = [
  { label: 'Developer', value: 'KaMa Studios' },
  { label: 'Based in', value: 'Cologne, Germany' },
  { label: 'Release', value: 'Coming soon to Meta Quest 3 and 3S · Early Access planned' },
  { label: 'Platforms', value: 'Meta Quest 3, Meta Quest 3S' },
  { label: 'Genre', value: 'Zombie survival shooter, mixed reality and VR' },
  { label: 'Modes', value: 'Reality Breach (MR, room scan) · Rift (MR, no room scan, roguelite) · Outbreak (full VR: Rooftop, Safe Zone, Gas Station)' },
  { label: 'Players', value: '1–4 in Reality Breach (same room), Rift (same room or online) and Gas Station; 1–3 in Rooftop and Safe Zone. Outbreak local or online.' },
  { label: 'Business model', value: 'Free to start: 90 minutes per mode family, then buy single modes, bundles or the complete pack, plus an optional Armory add-on. No loot boxes, no purchasable currency.' },
  { label: 'Engine', value: 'Unity 6, Meta XR SDK' },
  { label: 'Website', value: 'zombierealitybreach.com' },
  { label: 'Press contact', value: CONTACT_EMAIL },
  { label: 'Social', value: 'TikTok and Instagram @zombierealitybreach · YouTube @ZombieRealityBreach' },
];

const descriptions: { label: string; en: string }[] = [
  { label: 'Short', en: 'Zombie Reality Breach is a zombie survival shooter for Meta Quest 3 and 3S: zombies smash through the real doors of your home in mixed reality, or you hold out at a gas station in the woods at night in full VR.' },
  { label: 'Medium', en: 'Zombie Reality Breach comes with three mode families. In REALITY BREACH the game reads your room scan and zombies break through your real doors; between waves you restock in the shop and unlock weapons in the Armory. In RIFT a portal tears open your wall onto one of five worlds: pistols fixed to your hands, three hearts, an upgrade after every wave, a boss every tenth wave and roguelite runs. OUTBREAK is full VR at a gas station in the woods at night: hold the roof of a car in ROOFTOP, board up the shop in SAFE ZONE, or defend the whole site in GAS STATION. Play alone or in co-op for up to four. Coming soon to Meta Quest 3 and 3S.' },
];

/** File size from src/content/asset-manifest.json (written by scripts/Build-WebAssets.ps1), e.g. "23.0 MB". */
function fileSize(path: string): string {
  const entry = manifest.files.find((f) => f.path === path);
  if (!entry) return '';
  const b = entry.bytes;
  if (b >= 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(b / 1000)} KB`;
}

interface DownloadItem {
  icon: typeof FileArchive;
  label: string;
  /** Path under /public; omitted while the file does not exist yet. */
  file?: string;
  note?: string;
}

const downloads: DownloadItem[] = [
  { icon: FileArchive, label: 'Press kit complete (ZIP)', file: '/assets/press/zrb-presskit.zip', note: 'Logo, key art, README with terms of use' },
  { icon: Image, label: 'Logo (SVG + PNG, ZIP)', file: '/assets/press/zrb-logo.zip', note: 'Dark and light versions, wordmark, skull, app icon' },
  { icon: Image, label: 'Key art: five themes (JPG, ZIP)', file: '/assets/press/zrb-keyart.zip', note: 'Full resolution, with and without logo' },
  { icon: Image, label: 'App icon (512\u00d7512, PNG)', file: '/assets/press/zrb_app_icon_512.png' },
  { icon: Image, label: 'Screenshots (ZIP)' },
  { icon: Film, label: 'Trailer' },
  { icon: FileText, label: 'Fact sheet (PDF)' },
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
    <div className="pt-16">
      <PageHero
        theme={keyArtThemes.game}
        kicker={`// ${t('press.title')}`}
        title={t('press.title')}
        intro={de
          ? 'Fakten, Beschreibungen, Logo und Key Art zum Herunterladen. Presse und Content-Creator dürfen das Material für Berichte, Videos und Streams verwenden.'
          : 'Facts, descriptions, logo and key art to download. Press and content creators may use the material for reporting, videos and streams.'}
      />
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">

        <div className="grid lg:grid-cols-2 gap-8">
          {/* FACT SHEET */}
          <div>
            <h2 className="section-title font-heading text-xl uppercase text-bone mb-5">{t('press.factsheet')}</h2>
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
            <h2 className="section-title font-heading text-xl uppercase text-bone mb-5">{t('press.downloads')}</h2>
            <div className="space-y-3">
              {downloads.map((d) => {
                const inner = (
                  <div className="relative z-10 flex items-center gap-4 w-full">
                    <div className="w-10 h-10 flex items-center justify-center bg-blood/10 border border-blood/30 flex-shrink-0 group-hover:bg-blood/20 transition-colors">
                      <d.icon className="w-4 h-4 text-blood" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-bone font-body font-medium">{d.label}</div>
                      <div className="text-[10px] text-bone-muted/50 font-body">
                        {d.file ? [fileSize(d.file), d.note].filter(Boolean).join(' \u00b7 ') : t('press.soon')}
                      </div>
                    </div>
                    <Download className={`w-4 h-4 flex-shrink-0 ${d.file ? 'text-blood group-hover:text-blood-hover' : 'text-bone-muted/30'}`} />
                  </div>
                );
                return d.file ? (
                  <a key={d.label} href={asset(d.file)} download className="block">
                    <SteelCard className="p-4 flex items-center gap-4 hover:border-blood/40 transition-colors group">{inner}</SteelCard>
                  </a>
                ) : (
                  <SteelCard key={d.label} className="p-4 flex items-center gap-4 opacity-70">{inner}</SteelCard>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <HazardDivider />

      {/* KEY ART */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">
        <h2 className="section-title font-heading text-xl uppercase text-bone mb-2">{t('press.keyart')}</h2>
        <p className="text-sm text-bone-muted font-body font-light mb-6">{t('press.keyartNote')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {keyArtGallery.map((k) => (
            <a
              key={k.theme}
              href={keyArtJpg(k.theme, 'cover')}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <SteelCard className="overflow-hidden hover:border-blood/40 transition-colors">
                <div className="relative aspect-video overflow-hidden">
                  <picture>
                    <source type="image/webp" srcSet={keyArtSrcSet(k.theme, 'cover')} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                    <img
                      src={keyArtJpg(k.theme, 'cover')}
                      width={1920}
                      height={1080}
                      alt={`Zombie Reality Breach key art: ${k.name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                </div>
                <div className="relative z-10 px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-bone font-body font-medium">{k.name}</div>
                    {k.mode && <div className="text-[10px] font-heading text-ember uppercase tracking-wider">{k.mode}</div>}
                  </div>
                  <span className="text-[10px] font-heading uppercase tracking-wider text-blood">1920\u00d71080 JPG</span>
                </div>
              </SteelCard>
            </a>
          ))}
        </div>
      </section>

      <HazardDivider />

      {/* DESCRIPTIONS */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 lg:px-8">
        <h2 className="section-title font-heading text-xl uppercase text-bone mb-6">{t('press.descriptions')}</h2>
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
        <h2 className="section-title font-heading text-xl uppercase text-bone mb-5">{t('press.studio')}</h2>
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
          <SocialLinks className="justify-center mt-4" />
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
