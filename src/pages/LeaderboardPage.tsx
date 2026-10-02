import { Info, ExternalLink } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { GAME_PRIVACY_URL } from '@/lib/site';
import HazardDivider from '@/components/HazardDivider';
import LeaderboardBoards from '@/components/LeaderboardBoards';

export default function LeaderboardPage() {
  const { t } = useI18n();

  return (
    <div className="pt-20">
      <section className="py-16 lg:py-24 max-w-5xl mx-auto px-4 lg:px-8">
        <span className="text-xs font-heading uppercase tracking-widest text-blood">// {t('leaderboard.title')}</span>
        <h1 className="font-heading text-3xl lg:text-4xl uppercase text-bone mt-2 mb-8">{t('leaderboard.title')}</h1>

        <LeaderboardBoards />

        <HazardDivider className="my-8" />

        <div className="steel-card p-6">
          <div className="relative z-10 flex items-start gap-3">
            <Info className="w-4 h-4 text-ember flex-shrink-0 mt-0.5" />
            <p className="text-xs text-bone-muted font-body font-light leading-relaxed">
              {t('leaderboard.privacy')}{' '}
              <a href={GAME_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blood hover:text-blood-hover">
                {t('leaderboard.privacyLink')} <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
