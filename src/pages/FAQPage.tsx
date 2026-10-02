import { useState } from 'react';
import { ChevronDown, ExternalLink, Skull } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { META_URL } from '@/lib/site';
import { faqItems } from '@/content/faq';
import HazardDivider from '@/components/HazardDivider';
import SteelCard from '@/components/SteelCard';

export default function FAQPage() {
  const { t, lang } = useI18n();
  const de = lang === 'de';
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="pt-20">
      {/* RELEASE STATUS */}
      <section className="py-16 lg:py-24 max-w-3xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('faq.statusTitle')}</span>
        <h1 className="font-heading text-3xl lg:text-4xl uppercase text-bone mt-2 mb-8">{t('hero.coming')}</h1>

        <SteelCard className="p-6 hover:border-blood/40 transition-colors">
          <div className="relative z-10 space-y-4">
            <p className="text-sm text-bone font-body font-light leading-relaxed">
              {de
                ? 'Zombie Reality Breach erscheint bald für Meta Quest 3 und 3S. Ein Early-Access-Release ist geplant.'
                : 'Zombie Reality Breach is coming soon to Meta Quest 3 and 3S. An Early Access release is planned.'}
            </p>
            <a href={META_URL} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1 text-sm text-blood hover:text-blood-hover font-body font-medium">
              {t('hero.cta')} <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            </a>
          </div>
        </SteelCard>
      </section>

      <HazardDivider />

      {/* FAQ */}
      <section className="py-16 lg:py-24 max-w-3xl mx-auto px-4 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Skull className="w-6 h-6 text-blood" />
          <h2 className="font-heading text-2xl lg:text-3xl uppercase text-bone">{t('faq.title')}</h2>
        </div>

        <div className="space-y-2">
          {faqItems.map((item, i) => (
            <div key={i} className="steel-card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="relative z-10 w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm text-bone font-body font-medium">{de ? item.qDe : item.q}</span>
                <ChevronDown className={`w-4 h-4 text-bone-muted flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className="relative z-10 px-5 pb-4">
                  <p className="text-sm text-bone-muted font-body font-light leading-relaxed">{de ? item.aDe : item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
