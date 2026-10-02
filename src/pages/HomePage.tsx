import { Link } from 'react-router-dom';
import { Play, Crosshair, Hand, Users, ArrowRight, Skull, Gift } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { META_URL, img } from '@/lib/site';
import SteelCard from '@/components/SteelCard';
import HazardDivider from '@/components/HazardDivider';
import { newsPosts } from '@/content/news';
import { modeFamilies } from '@/content/modes';
import HomeLeaderboardPreview from '@/components/HomeLeaderboardPreview';

const pitchIcons = [Crosshair, Hand, Users];

export default function HomePage() {
  const { t, lang } = useI18n();
  const de = lang === 'de';

  const latestNews = newsPosts.slice(0, 3);

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={img.keyArt}
            alt="Zombie Reality Breach logo over a ruined city"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-bg/70" />
          <div className="absolute inset-0 hero-vignette" />
        </div>

        {/* Fog layer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-moon/5 to-transparent animate-fog-drift opacity-30" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto pt-24 pb-16">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
            <span className="px-3 py-1 bg-blood text-bone text-[10px] sm:text-xs font-heading uppercase tracking-wider clip-tag">{t('hero.coming')}</span>
            <span className="px-3 py-1 border border-ember/50 text-ember text-[10px] sm:text-xs font-heading uppercase tracking-wider">{t('hero.ea')}</span>
          </div>

          <h1 className="font-horror text-3xl sm:text-5xl lg:text-6xl text-blood animate-glitch leading-tight mb-4 glow-blood">
            ZOMBIE REALITY BREACH
          </h1>

          <p className="font-heading text-lg sm:text-2xl text-bone uppercase tracking-wider mb-3">
            {t('hero.tagline')}
          </p>

          <p className="text-sm text-bone-muted font-body tracking-wider mb-8">
            {t('hero.sub')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={META_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3 bg-blood hover:bg-blood-hover text-bone font-heading uppercase tracking-wider text-sm transition-all hover:scale-105 glow-blood flex items-center justify-center gap-2"
            >
              <Skull className="w-4 h-4" />
              {t('hero.cta')}
            </a>
            <button
              className="px-7 py-3 border border-bg-steel text-bone-muted font-heading uppercase tracking-wider text-sm flex items-center justify-center gap-2 cursor-not-allowed"
              disabled
            >
              <Play className="w-4 h-4" />
              {t('hero.trailer')}
            </button>
          </div>
        </div>
      </section>

      <HazardDivider />

      {/* PITCH 3 CARDS */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n, i) => {
            const Icon = pitchIcons[i];
            return (
              <SteelCard key={n} className="p-6 hover:border-blood/40 transition-colors group">
                <div className="relative z-10">
                  <div className="w-12 h-12 flex items-center justify-center bg-blood/10 border border-blood/30 mb-4 group-hover:bg-blood/20 transition-colors">
                    <Icon className="w-6 h-6 text-blood" />
                  </div>
                  <h3 className="font-heading text-lg uppercase text-bone mb-2">{t(`pitch.${n}.title`)}</h3>
                  <p className="text-sm text-bone-muted font-body leading-relaxed font-light">{t(`pitch.${n}.text`)}</p>
                </div>
              </SteelCard>
            );
          })}
        </div>
      </section>

      <HazardDivider />

      {/* GAME MODES TEASER */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 lg:px-8">
        <h2 className="font-heading text-2xl lg:text-3xl uppercase text-bone mb-8 text-center">{t('home.modes')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {modeFamilies.map((m) => (
            <Link to="/modes" key={m.id}>
              <SteelCard className="group overflow-hidden hover:border-blood/40 transition-colors h-full">
                <div className="relative h-52 overflow-hidden">
                  <img src={m.image} alt={m.imageAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/30 to-transparent" />
                </div>
                <div className="relative z-10 p-5">
                  <h3 className="font-heading text-xl uppercase text-bone mb-1">{m.name}</h3>
                  <p className="text-[10px] font-heading text-ember uppercase tracking-wider mb-2">{de ? m.kindDe : m.kind}</p>
                  <p className="text-sm text-bone-muted font-body font-light">{de ? m.shortDe : m.short}</p>
                  {m.subModes && (
                    <ul className="mt-3 space-y-1">
                      {m.subModes.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2 text-xs font-body">
                          <span className="font-heading uppercase text-bone">{s.name}</span>
                          <span className={`text-[10px] font-heading uppercase tracking-wider ${s.status === 'playable' ? 'text-gold' : 'text-bone-muted'}`}>
                            {t(s.status === 'playable' ? 'modes.playable' : 'modes.inDev')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-heading text-blood uppercase tracking-wider group-hover:gap-2 transition-all">
                    {t('modes.learnMore')} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </SteelCard>
            </Link>
          ))}
        </div>

        {/* FREE TO START */}
        <SteelCard className="mt-8 p-6 border-gold/30">
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-gold/10 border border-gold/30 flex-shrink-0">
              <Gift className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h3 className="font-heading text-lg uppercase text-bone mb-1">{t('home.free.title')}</h3>
              <p className="text-sm text-bone-muted font-body font-light leading-relaxed">{t('home.free.text')}</p>
            </div>
          </div>
        </SteelCard>
      </section>

      <HazardDivider />

      {/* LEADERBOARD PREVIEW */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-8 gap-4">
          <h2 className="font-heading text-2xl lg:text-3xl uppercase text-bone">{t('home.top5')}</h2>
          <Link to="/leaderboard" className="text-xs font-heading text-blood uppercase tracking-wider hover:text-blood-hover transition-colors flex items-center gap-1">
            {t('home.viewAll')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <HomeLeaderboardPreview />
      </section>

      <HazardDivider />

      {/* LATEST NEWS */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-8 gap-4">
          <h2 className="font-heading text-2xl lg:text-3xl uppercase text-bone">{t('home.latestNews')}</h2>
          <Link to="/news" className="text-xs font-heading text-blood uppercase tracking-wider hover:text-blood-hover transition-colors flex items-center gap-1">
            {t('home.allNews')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {latestNews.map((post) => (
            <Link to={`/news/${post.slug}`} key={post.slug}>
              <SteelCard className="group overflow-hidden hover:border-blood/40 transition-colors h-full">
                <div className="relative h-44 overflow-hidden">
                  <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-surface to-transparent" />
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-blood text-bone text-[10px] font-heading uppercase tracking-wider clip-tag">
                    {post.category}
                  </div>
                </div>
                <div className="relative z-10 p-5">
                  <time className="text-[10px] font-heading text-bone-muted uppercase tracking-wider">{post.date}</time>
                  <h3 className="font-heading text-base uppercase text-bone mt-1 mb-2 leading-tight">
                    {de ? post.titleDe : post.title}
                  </h3>
                  <p className="text-xs text-bone-muted font-body font-light line-clamp-2">
                    {de ? post.excerptDe : post.excerpt}
                  </p>
                </div>
              </SteelCard>
            </Link>
          ))}
        </div>
      </section>

      <HazardDivider />

      {/* CTA */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={img.logoCity} alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/50" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <h2 className="font-heading text-2xl lg:text-4xl uppercase text-bone mb-3">{t('home.cta.title')}</h2>
          <p className="text-sm text-bone-muted font-body mb-6">{t('hero.ea')}</p>
          <a
            href={META_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blood hover:bg-blood-hover text-bone font-heading uppercase tracking-wider text-sm transition-all hover:scale-105 glow-blood"
          >
            <Skull className="w-5 h-5" />
            {t('hero.cta')}
          </a>
        </div>
      </section>
    </>
  );
}
