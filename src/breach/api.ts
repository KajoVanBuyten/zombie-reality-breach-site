// Browser side of the quest API (worker/quest.ts, worker/meta.ts). All calls answer JSON; errors carry a code.

export interface QuestRun {
  run: string;
  token: string;
}

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, readonly wait?: number) {
    super(code);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, 'offline');
  }
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || data.ok === false) {
    throw new ApiError(response.status, typeof data.error === 'string' ? data.error : 'server_error', typeof data.wait === 'number' ? data.wait : undefined);
  }
  return data as T;
}

export const questStart = () => post<QuestRun>('/api/quest/start', {});
export const questStep = (run: QuestRun, step: number) => post<{ ok: boolean }>('/api/quest/step', { ...run, step });
export const questFinish = (run: QuestRun) => post<{ ok: boolean }>('/api/quest/finish', run);
export const questCode = (run: QuestRun) => post<{ code: string }>('/api/quest/code', run);
export const metaClaim = (payload: string) => post<{ ok: boolean; already: boolean }>('/api/meta/claim', { payload });

export function metaLinkUrl(run: QuestRun): string {
  return `/api/meta/link?run=${encodeURIComponent(run.run)}&token=${encodeURIComponent(run.token)}`;
}

/**
 * Checks the link endpoint before the page navigates there: a redirect means Meta linking is ready (the response also
 * sets the run cookie), a JSON error is shown on the page instead of as raw JSON in the browser.
 */
export async function metaLinkReady(run: QuestRun): Promise<void> {
  let response: Response;
  try {
    response = await fetch(metaLinkUrl(run), { redirect: 'manual', credentials: 'same-origin', cache: 'no-store' });
  } catch {
    throw new ApiError(0, 'offline');
  }
  if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) return;
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  throw new ApiError(response.status, typeof data.error === 'string' ? data.error : 'server_error');
}

/** "ABCD2345" -> "ABCD-2345" */
export function formatCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

// The finished run is kept for this tab only, so /breach/linked can offer the code as a fallback.
const RUN_KEY = 'zrb.breach.run';

export function rememberRun(run: QuestRun): void {
  try {
    sessionStorage.setItem(RUN_KEY, JSON.stringify(run));
  } catch {
    /* storage blocked: the fallback is simply not offered */
  }
}

export function rememberedRun(): QuestRun | null {
  try {
    const raw = sessionStorage.getItem(RUN_KEY);
    const value = raw ? (JSON.parse(raw) as QuestRun) : null;
    return value && typeof value.run === 'string' && typeof value.token === 'string' ? value : null;
  } catch {
    return null;
  }
}

const BEST_KEY = 'zrb.breach.best';

/** Best completion time in ms on this device, or null. */
export function bestTime(): number | null {
  try {
    const value = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Stores `ms` when it beats the best time; returns true for a new record. */
export function recordTime(ms: number): boolean {
  const best = bestTime();
  if (best !== null && best <= ms) return false;
  try {
    localStorage.setItem(BEST_KEY, String(Math.round(ms)));
  } catch {
    /* storage blocked */
  }
  return true;
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Human texts for the error codes of the worker. */
export function errorText(code: string, de: boolean): string {
  const texts: Record<string, [string, string]> = {
    offline: ['No connection. Check your internet and try again.', 'Keine Verbindung. Prüfe dein Internet und versuche es erneut.'],
    not_configured: ['The reward service is not switched on yet. Please try again later.', 'Der Belohnungsdienst ist noch nicht eingeschaltet. Bitte versuche es später erneut.'],
    rate_limited: ['Too many runs from your network in the last hour. Please try again later.', 'Zu viele Läufe aus deinem Netz in der letzten Stunde. Bitte versuche es später erneut.'],
    not_finished: ['This run is not verified as finished yet.', 'Dieser Lauf ist noch nicht als abgeschlossen bestätigt.'],
    unknown_run: ['This run has expired. Play the quest again to earn the reward.', 'Dieser Lauf ist abgelaufen. Spiele die Quest erneut, um die Belohnung zu bekommen.'],
    expired: ['This run took too long. Play the quest again to earn the reward.', 'Dieser Lauf hat zu lange gedauert. Spiele die Quest erneut.'],
    no_run: ['The link to your quest run was lost (it is valid for 15 minutes). Show the code instead, or play again.', 'Die Verbindung zu deinem Quest-Lauf ist verloren (sie gilt 15 Minuten). Lass dir den Code anzeigen oder spiele erneut.'],
    invalid_payload: ['Meta sent an answer this page cannot read. Try linking again.', 'Meta hat eine Antwort geschickt, die diese Seite nicht lesen kann. Versuche es erneut.'],
    meta_rejected: ['Meta did not confirm the link. Try again.', 'Meta hat die Verknüpfung nicht bestätigt. Versuche es erneut.'],
    meta_failed: ['Meta could not be reached. Try again in a moment.', 'Meta war nicht erreichbar. Versuche es gleich noch einmal.'],
    mismatch: ['The Meta account could not be confirmed. Try again.', 'Das Meta-Konto konnte nicht bestätigt werden. Versuche es erneut.'],
  };
  const text = texts[code] ?? ['Something went wrong. Please try again.', 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'];
  return de ? text[1] : text[0];
}
