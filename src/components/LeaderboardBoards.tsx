import { Trophy } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { leaderboardModes } from '@/content/modes';

/** "Global leaderboards open at launch" state: lists the boards that will exist. No scores, no names. */
export default function LeaderboardBoards({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const variants = [
    `${t('leaderboard.easy')} · ${t('leaderboard.solo')}`,
    `${t('leaderboard.easy')} · ${t('leaderboard.coop')}`,
    `${t('leaderboard.hard')} · ${t('leaderboard.solo')}`,
    `${t('leaderboard.hard')} · ${t('leaderboard.coop')}`,
  ];

  return (
    <div className="steel-card overflow-hidden">
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 flex items-center justify-center bg-gold/10 border border-gold/30 flex-shrink-0">
            <Trophy className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h3 className="font-heading text-lg md:text-xl uppercase text-bone">{t('leaderboard.closed.title')}</h3>
            <p className="text-sm text-bone-muted font-body font-light leading-relaxed mt-1 max-w-2xl">{t('leaderboard.closed.text')}</p>
          </div>
        </div>

        {!compact && (
          <p className="text-[10px] font-heading uppercase tracking-wider text-bone-muted mb-3">{t('leaderboard.boards')}</p>
        )}
        <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {leaderboardModes.map((m) => (
            <div key={m.key} className="p-4 bg-bg/60 border border-bg-steel">
              <p className="text-[10px] font-heading uppercase tracking-wider text-ember">{m.family}</p>
              <h4 className="font-heading text-base uppercase text-bone mb-2">{t(m.key)}</h4>
              {!compact && (
                <ul className="flex flex-wrap gap-1.5">
                  {variants.map((v) => (
                    <li key={v} className="px-2 py-0.5 bg-bg-steel/60 text-bone-muted text-[10px] font-heading uppercase tracking-wider">{v}</li>
                  ))}
                </ul>
              )}
              {compact && (
                <p className="text-[11px] text-bone-muted font-body font-light">
                  {t('leaderboard.easy')} / {t('leaderboard.hard')} {'·'} {t('leaderboard.solo')} / {t('leaderboard.coop')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
