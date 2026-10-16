import { Info, ExternalLink } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { GAME_PRIVACY_URL, keyArtThemes } from '@/lib/site';
import HazardDivider from '@/components/HazardDivider';
import LeaderboardBoards from '@/components/LeaderboardBoards';
import PageHero from '@/components/PageHero';

export default function LeaderboardPage() {
  const { t } = useI18n();

  return (
    <div className="pt-16">
      <PageHero
        theme={keyArtThemes.rift}
        kicker={`// ${t('leaderboard.title')}`}
        title={t('leaderboard.title')}
        intro={t('leaderboard.live.text')}
      />
      <section className="py-16 lg:py-24 max-w-5xl mx-auto px-4 lg:px-8">

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
