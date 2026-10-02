import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Wrench, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import SteelCard from '@/components/SteelCard';
import HazardDivider from '@/components/HazardDivider';
import { newsPosts, type NewsPost } from '@/content/news';

type Category = 'All' | NewsPost['category'];
const categories: Category[] = ['All', 'Update', 'Devlog', 'Alpha'];

const roadmap = [
  { done: true, en: 'Reality Breach: mixed reality with room scan', de: 'Reality Breach: Mixed Reality mit Raumscan' },
  { done: true, en: 'Rift: portal in your wall, no room scan', de: 'Rift: Portal in deiner Wand, ohne Raumscan' },
  { done: true, en: 'Local and online co-op', de: 'Lokaler und Online-Co-op' },
  { done: 'wip', en: 'Outbreak · Rooftop (playable in development, co-op up to 3)', de: 'Outbreak · Rooftop (in Entwicklung spielbar, Co-op bis 3)' },
  { done: 'wip', en: 'Outbreak · Safe Zone', de: 'Outbreak · Safe Zone' },
  { done: 'wip', en: 'Outbreak · Gas Station', de: 'Outbreak · Gas Station' },
  { done: false, en: 'Global leaderboards on this website', de: 'Globale Bestenlisten auf dieser Website' },
  { done: false, en: 'Release on Meta Quest 3 and 3S (Early Access planned)', de: 'Release für Meta Quest 3 und 3S (Early Access geplant)' },
];

export function NewsListPage() {
  const { t, lang } = useI18n();
  const de = lang === 'de';
  const [cat, setCat] = useState<Category>('All');

  const filtered = cat === 'All' ? newsPosts : newsPosts.filter((p) => p.category === cat);

  return (
    <div className="pt-20">
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('news.title')}</span>
        <h1 className="font-heading text-3xl lg:text-4xl uppercase text-bone mt-2 mb-8">{t('news.title')}</h1>

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
                  <img src={post.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
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
          <h2 className="font-heading text-2xl uppercase text-bone mb-6 text-center">{t('news.roadmap')}</h2>
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
    <div className="pt-20">
      <section className="py-16 lg:py-24 max-w-3xl mx-auto px-4 lg:px-8">
        <Link to="/news" className="inline-flex items-center gap-1 text-xs font-heading text-blood uppercase tracking-wider hover:text-blood-hover mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> {de ? 'Alle News' : 'All News'}
        </Link>
        <div className="relative h-64 overflow-hidden mb-8 border border-bg-steel">
          <img src={post.image} alt={de ? post.titleDe : post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
          <div className="absolute top-4 left-4 px-2 py-0.5 bg-blood text-bone text-[10px] font-heading uppercase tracking-wider clip-tag">
            {post.category}
          </div>
        </div>
        <time className="text-xs font-heading text-bone-muted uppercase tracking-wider">{post.date}</time>
        <h1 className="font-heading text-2xl lg:text-3xl uppercase text-bone mt-2 mb-6">{de ? post.titleDe : post.title}</h1>
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
