import { useEffect, useState, type ReactNode } from 'react';
import { Trophy } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { leaderboardModes } from '@/content/modes';

interface Row {
  rank: number;
  name: string;
  score: number;
  wave?: number;
  kills?: number;
  team?: string;
}

interface Data {
  configured: boolean;
  error?: boolean;
  updated?: string;
  boards?: Record<string, Row[]>;
}

type Difficulty = 'easy' | 'hard';
type Team = 'solo' | 'coop';

/** Real scores from the game (worker route /api/leaderboards). Falls back to the "open at launch" card while the
 *  worker has no UGS access or the request fails. */
export default function LeaderboardBoards({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const [data, setData] = useState<Data | null>(null);
  const [mode, setMode] = useState<string>(leaderboardModes[0].board);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [team, setTeam] = useState<Team>('solo');

  useEffect(() => {
    let alive = true;
    fetch('/api/leaderboards')
      .then((r) => r.json() as Promise<Data>)
      .then((d) => {
        if (!alive) return;
        setData(d);
        // Open on the first board that has scores instead of an empty one.
        const first = Object.entries(d.boards ?? {}).find(([, rows]) => rows.length > 0)?.[0];
        if (first) {
          const [m, diff, tm] = first.split('_');
          setMode(m);
          setDifficulty(diff as Difficulty);
          setTeam(tm as Team);
        }
      })
      .catch(() => alive && setData({ configured: false }));
    return () => {
      alive = false;
    };
  }, []);

  const live = !!data?.configured && !data.error && !!data.boards;

  if (!data) {
    return (
      <Card title={t('leaderboard.title')} text={t('leaderboard.loading')}>
        <div className="h-24" />
      </Card>
    );
  }

  if (!live) {
    return <Placeholder compact={compact} />;
  }

  const boards = data.boards!;

  if (compact) {
    // Home page: the best entry of each mode, over all of its four boards.
    return (
      <Card title={t('leaderboard.live.title')} text={t('leaderboard.live.text')}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {leaderboardModes.map((m) => {
            const best = (['easy', 'hard'] as const)
              .flatMap((d) => (['solo', 'coop'] as const).map((tm) => ({ id: `${m.board}_${d}_${tm}`, d, tm })))
              .map((b) => ({ ...b, row: boards[b.id]?.[0] }))
              .filter((b) => b.row)
              .sort((a, b) => b.row!.score - a.row!.score)[0];
            return (
              <div key={m.key} className="p-4 bg-bg/60 border border-bg-steel">
                <p className="text-[10px] font-heading uppercase tracking-wider text-ember">{m.family}</p>
                <h4 className="font-heading text-base uppercase text-bone mb-2">{t(m.key)}</h4>
                {best ? (
                  <>
                    <p className="font-heading text-gold text-xl">{best.row!.score.toLocaleString()}</p>
                    <p className="text-xs text-bone truncate">{best.row!.team ?? best.row!.name}</p>
                    <p className="text-[10px] text-bone-muted uppercase tracking-wider font-heading mt-1">
                      {t(`leaderboard.${best.d}`)} {'·'} {t(`leaderboard.${best.tm}`)}
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-bone-muted font-body font-light">{t('leaderboard.empty')}</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  const rows = boards[`${mode}_${difficulty}_${team}`] ?? [];

  return (
    <Card title={t('leaderboard.live.title')} text={t('leaderboard.live.text')}>
      <div className="flex flex-wrap gap-2 mb-4">
        {leaderboardModes.map((m) => (
          <Pill key={m.board} active={mode === m.board} onClick={() => setMode(m.board)}>
            {t(m.key)}
          </Pill>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {(['easy', 'hard'] as const).map((d) => (
          <Pill key={d} small active={difficulty === d} onClick={() => setDifficulty(d)}>
            {t(`leaderboard.${d}`)}
          </Pill>
        ))}
        <span className="w-px bg-bg-steel mx-1" />
        {(['solo', 'coop'] as const).map((tm) => (
          <Pill key={tm} small active={team === tm} onClick={() => setTeam(tm)}>
            {t(`leaderboard.${tm}`)}
          </Pill>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-bone-muted font-body font-light border border-bg-steel bg-bg/60">
          {t('leaderboard.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-[10px] font-heading uppercase tracking-wider text-bone-muted text-left">
                <th className="py-2 pr-3 w-10">{t('leaderboard.rank')}</th>
                <th className="py-2 pr-3">{t('leaderboard.player')}</th>
                <th className="py-2 pr-3 text-right">{t('leaderboard.score')}</th>
                <th className="py-2 pr-3 text-right hidden sm:table-cell">{t('leaderboard.wave')}</th>
                <th className="py-2 text-right hidden sm:table-cell">{t('leaderboard.kills')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.rank} className="border-t border-bg-steel">
                  <td className={`py-2 pr-3 font-heading ${r.rank <= 3 ? 'text-gold' : 'text-bone-muted'}`}>{r.rank}</td>
                  <td className="py-2 pr-3 text-bone break-words">{r.team ?? r.name}</td>
                  <td className="py-2 pr-3 text-right font-heading text-bone">{r.score.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right text-bone-muted hidden sm:table-cell">{r.wave ?? '–'}</td>
                  <td className="py-2 text-right text-bone-muted hidden sm:table-cell">{r.kills ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Card({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="steel-card overflow-hidden">
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 flex items-center justify-center bg-gold/10 border border-gold/30 flex-shrink-0">
            <Trophy className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h3 className="font-heading text-lg md:text-xl uppercase text-bone">{title}</h3>
            <p className="text-sm text-bone-muted font-body font-light leading-relaxed mt-1 max-w-2xl">{text}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Pill({ active, small, onClick, children }: { active: boolean; small?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${small ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'} font-heading uppercase tracking-wider border transition-colors ${
        active ? 'bg-blood/20 border-blood text-bone' : 'bg-bg/60 border-bg-steel text-bone-muted hover:text-bone'
      }`}
    >
      {children}
    </button>
  );
}

/** "Global leaderboards open at launch": lists the boards that will exist. No scores, no names. */
function Placeholder({ compact }: { compact: boolean }) {
  const { t } = useI18n();
  const variants = [
    `${t('leaderboard.easy')} · ${t('leaderboard.solo')}`,
    `${t('leaderboard.easy')} · ${t('leaderboard.coop')}`,
    `${t('leaderboard.hard')} · ${t('leaderboard.solo')}`,
    `${t('leaderboard.hard')} · ${t('leaderboard.coop')}`,
  ];

  return (
    <Card title={t('leaderboard.closed.title')} text={t('leaderboard.closed.text')}>
      {!compact && <p className="text-[10px] font-heading uppercase tracking-wider text-bone-muted mb-3">{t('leaderboard.boards')}</p>}
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
    </Card>
  );
}
