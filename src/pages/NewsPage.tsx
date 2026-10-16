import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Wrench, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import SteelCard from '@/components/SteelCard';
import HazardDivider from '@/components/HazardDivider';
import { newsPosts, type NewsPost } from '@/content/news';
import KeyArt from '@/components/KeyArt';
import PageHero from '@/components/PageHero';
import { keyArtThemes } from '@/lib/site';

type Category = 'All' | NewsPost['category'];
const categories: Category[] = ['All', 'Update', 'Devlog', 'Alpha'];

const roadmap = [
  { done: true, en: 'Reality Breach: mixed reality with room scan', de: 'Reality Breach: Mixed Reality mit Raumscan' },
  { done: true, en: 'Rift: portal in your wall, no room scan, five worlds', de: 'Rift: Portal in deiner Wand, ohne Raumscan, fünf Welten' },
  { done: true, en: 'Local and online co-op', de: 'Lokaler und Online-Co-op' },
  { done: true, en: 'Outbreak: Rooftop, Safe Zone and Gas Station playable', de: 'Outbreak: Rooftop, Safe Zone und Gas Station spielbar' },
  { done: true, en: 'Global leaderboards in the game and on this website', de: 'Globale Bestenlisten im Spiel und auf dieser Website' },
  { done: true, en: 'Closed ALPHA on Meta Quest', de: 'Geschlossene ALPHA auf Meta Quest' },
  { done: 'wip', en: 'Balancing and polish from the playtests', de: 'Balancing und Feinschliff aus den Playtests' },
  { done: 'wip', en: 'Store products and the free trial', de: 'Store-Produkte und die kostenlose Testzeit' },
  { done: false, en: 'BETA channel', de: 'BETA-Kanal' },
  { done: false, en: 'Release on Meta Quest 3 and 3S (Early Access planned)', de: 'Release für Meta Quest 3 und 3S (Early Access geplant)' },
];

export function NewsListPage() {
  const { t, lang } = useI18n();
  const de = lang === 'de';
  const [cat, setCat] = useState<Category>('All');

  const filtered = cat === 'All' ? newsPosts : newsPosts.filter((p) => p.category === cat);

  return (
    <div className="pt-16">
      <PageHero
        theme={keyArtThemes.daylight}
        kicker={`// ${t('news.title')}`}
        title={t('news.title')}
        intro={de ? 'Updates, Devlogs und Playtest-Berichte aus der Entwicklung, dazu die Roadmap.' : 'Updates, devlogs and playtest reports from development, plus the roadmap.'}
      />
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-1.5 text-xs font-heading uppercase tracking-wider transition-all ${
                cat === c ? 'bg-blood text-bone' : 'bg-bg-surface text-bone-muted border border-bg-steel hover:border-blood/40'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filtered.map((post) => (
            <Link to={`/news/${post.slug}`} key={post.slug}>
              <SteelCard className="group overflow-hidden hover:border-blood/40 transition-colors h-full">
                <div className="relative h-44 overflow-hidden">
                  <KeyArt theme={post.theme} widths={[1280, 800]} sizes="(min-width: 768px) 33vw, 100vw" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-surface to-transparent" />
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-blood text-bone text-[10px] font-heading uppercase tracking-wider clip-tag">
                    {post.category}
                  </div>
                </div>
                <div className="relative z-10 p-5">
                  <time className="text-[10px] font-heading text-bone-muted uppercase tracking-wider">{post.date}</time>
                  <h3 className="font-heading text-base uppercase text-bone mt-1 mb-2 leading-tight">{de ? post.titleDe : post.title}</h3>
                  <p className="text-xs text-bone-muted font-body font-light line-clamp-2">{de ? post.excerptDe : post.excerpt}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-heading text-blood uppercase tracking-wider group-hover:gap-2 transition-all">
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </SteelCard>
            </Link>
          ))}
        </div>

        <HazardDivider className="mb-10" />

        {/* ROADMAP */}
        <div className="max-w-2xl mx-auto">
          <h2 className="section-title font-heading text-2xl uppercase text-bone mb-6 text-center">{t('news.roadmap')}</h2>
          <div className="space-y-3">
            {roadmap.map((item) => (
              <div key={item.en} className="flex items-center gap-3 p-3 bg-bg-surface border border-bg-steel">
                {item.done === true ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> :
                 item.done === 'wip' ? <Wrench className="w-5 h-5 text-ember flex-shrink-0" /> :
                 <Clock className="w-5 h-5 text-bone-muted/40 flex-shrink-0" />}
                <span className={`text-sm font-body ${item.done === true ? 'text-bone-muted' : item.done === 'wip' ? 'text-ember' : 'text-bone-muted/50'}`}>
                  {de ? item.de : item.en}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useI18n();
  const de = lang === 'de';
  const post = newsPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="pt-28 text-center text-bone-muted font-body">
        <p>Post not found.</p>
        <Link to="/news" className="text-blood mt-4 inline-block font-heading text-sm uppercase">Back to News</Link>
      </div>
    );
  }

  return (
    <div className="pt-16">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <KeyArt theme={post.theme} widths={[2560, 1920, 1280, 800]} sizes="100vw" loading="eager" alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-bg/50 via-bg/60 to-bg" />
          <div className="absolute inset-0 hero-vignette" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 lg:px-8 pt-24 pb-10 lg:pt-32 lg:pb-14">
          <Link to="/news" className="inline-flex items-center gap-1 text-xs font-heading text-blood uppercase tracking-wider hover:text-blood-hover mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> {de ? 'Alle News' : 'All News'}
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2 py-0.5 bg-blood text-bone text-[10px] font-heading uppercase tracking-wider clip-tag">{post.category}</span>
            <time className="text-xs font-heading text-bone-muted uppercase tracking-wider">{post.date}</time>
          </div>
          <h1 className="font-heading text-3xl lg:text-5xl uppercase text-bone hero-text-shadow leading-none">{de ? post.titleDe : post.title}</h1>
        </div>
        <div className="hazard-stripe w-full relative z-10" />
      </section>
      <section className="py-12 lg:py-16 max-w-3xl mx-auto px-4 lg:px-8">
        <div className="text-bone-muted font-body font-light leading-relaxed space-y-4 text-sm">
          {(de ? post.bodyDe : post.body).split('. ').reduce((acc: string[][], sentence, i) => {
            const group = Math.floor(i / 3);
            if (!acc[group]) acc[group] = [];
            acc[group].push(sentence);
            return acc;
          }, []).map((group, i) => (
            <p key={i}>{group.join('. ')}{group[group.length - 1].endsWith('.') ? '' : '.'}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
