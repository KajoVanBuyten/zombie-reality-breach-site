import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface Stats {
  online: number;
  players: number;
  rounds: number;
  zombies: number;
}

const REFRESH_MS = 30_000;

/**
 * Live player numbers from the game (worker route /api/live/stats, owner 2026-11-16): playing now, players in all,
 * rounds played, zombies killed. Hidden until the first player was counted or while the numbers cannot be read.
 */
export default function LiveStats() {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch('/api/live/stats')
        .then((r) => (r.ok ? (r.json() as Promise<Stats>) : null))
        .then((s) => alive && s && typeof s.players === 'number' && setStats(s))
        .catch(() => undefined);
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  if (!stats || stats.players <= 0) return null;

  const number = (n: number) => n.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US');
  const tiles: { key: string; value: number; live?: boolean }[] = [
    { key: 'live.online', value: stats.online, live: true },
    { key: 'live.players', value: stats.players },
    { key: 'live.rounds', value: stats.rounds },
    { key: 'live.zombies', value: stats.zombies },
  ];

  return (
    <section aria-label={t('live.title')} className="py-10 lg:py-12 max-w-5xl mx-auto px-4 lg:px-8">
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-bone/10 border border-bone/10">
        {tiles.map((tile) => (
          <div key={tile.key} className="bg-bg px-4 py-5 text-center">
            <dd className="font-heading text-3xl lg:text-4xl text-bone tabular-nums">{number(tile.value)}</dd>
            <dt className="mt-1 text-xs font-heading uppercase tracking-wider text-bone-muted flex items-center justify-center gap-2">
              {tile.live && (
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blood opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blood" />
                </span>
              )}
              {t(tile.key)}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
