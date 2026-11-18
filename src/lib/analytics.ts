import { CONSENT_VERSION, campaignSlug, pagePath, sourceFromReferrer, type AnalyticsEvent, type Attribution, type EventName } from '../../shared/analytics';

const CHOICE = 'zrb.analytics.choice';
const SESSION = 'zrb.analytics.session';
const AGE = 180 * 86400_000;
const IDLE = 30 * 60_000;
type Choice = 'accepted' | 'declined' | 'unset';
interface Session { token: string; touched: number; born: number; attribution: Attribution; }
const initial = new URLSearchParams(location.search);
const entry: Attribution = { source: campaignSlug(initial.get('utm_source')) || sourceFromReferrer(document.referrer), medium: campaignSlug(initial.get('utm_medium')) || 'none', campaign: campaignSlug(initial.get('utm_campaign')), content: campaignSlug(initial.get('utm_content')) };
let queue: AnalyticsEvent[] = [];
let session: Session | null = null;
let creating: Promise<Session | null> | null = null;
let sending = false;
let generation = 0;
export function privacySignal() { return navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true; }
export function analyticsChoice(): Choice {
  try {
    const stored = JSON.parse(localStorage.getItem(CHOICE) || 'null');
    if (stored?.version === CONSENT_VERSION && Date.now() - stored.at < AGE && ['accepted', 'declined'].includes(stored.choice)) return stored.choice;
  } catch { /* Storage may be blocked; the site remains usable. */ }
  return 'unset';
}
export function analyticsEnabled() { return !privacySignal() && analyticsChoice() === 'accepted' && !location.pathname.startsWith('/tracking'); }
export function clearAnalyticsState() {
  generation++;
  queue = []; session = null; creating = null;
  try { sessionStorage.removeItem(SESSION); } catch { /* Blocked storage. */ }
}
export function setAnalyticsChoice(choice: Exclude<Choice, 'unset'>) {
  clearAnalyticsState();
  try { localStorage.setItem(CHOICE, JSON.stringify({ version: CONSENT_VERSION, at: Date.now(), choice })); } catch { /* No consent persistence: no analytics. */ }
  window.dispatchEvent(new Event('zrb:consent'));
}
function uuid() { return crypto.randomUUID().replace(/-/g, ''); }
async function getSession(): Promise<Session | null> {
  if (!analyticsEnabled()) return null;
  if (!session) { try { session = JSON.parse(sessionStorage.getItem(SESSION) || 'null'); } catch { session = null; } }
  if (session && (!Number.isFinite(session.touched) || Date.now() - session.touched >= IDLE || Date.now() - session.born >= 23 * 3600_000)) session = null;
  if (session) return session;
  if (creating) return creating;
  const version = generation;
  creating = fetch('/api/analytics/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ consent: CONSENT_VERSION }) })
    .then(async r => {
      if (!r.ok) return null;
      const result = await r.json();
      if (version !== generation || !analyticsEnabled() || typeof result.token !== 'string') return null;
      session = { token: result.token, born: Date.now(), touched: Date.now(), attribution: entry };
      try { sessionStorage.setItem(SESSION, JSON.stringify(session)); } catch { /* Memory-only session. */ }
      return session;
    }).catch(() => null).finally(() => { if (version === generation) creating = null; });
  return creating;
}
export function track(name: EventName, target = '', value = 0) {
  if (!analyticsEnabled() || document.visibilityState !== 'visible') return;
  if (queue.length >= 30) return;
  queue.push({ id: uuid(), name, path: pagePath(location.pathname), target: campaignSlug(target), value, language: document.documentElement.lang === 'de' ? 'de' : 'en' });
  void flush();
}
export async function flush(beacon = false) {
  if (!analyticsEnabled() || !queue.length || sending) return;
  sending = true;
  const version = generation;
  try {
    const current = await getSession();
    if (!current || version !== generation || !analyticsEnabled()) return;
    const batch = queue.slice(0, 10);
    current.touched = Date.now();
    try { sessionStorage.setItem(SESSION, JSON.stringify(current)); } catch { /* Memory-only session. */ }
    const body = JSON.stringify({ consent: CONSENT_VERSION, token: current.token, attribution: current.attribution, events: batch });
    if (beacon) {
      if (navigator.sendBeacon('/api/analytics/events', new Blob([body], { type: 'application/json' }))) queue = queue.filter(e => !batch.includes(e));
      return;
    }
    const response = await fetch('/api/analytics/events', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body });
    if (version !== generation) return;
    if (response.ok) queue = queue.filter(e => !batch.includes(e));
    else if (response.status === 401) { session = null; try { sessionStorage.removeItem(SESSION); } catch { /* Blocked storage. */ } }
    else if (response.status >= 400 && response.status < 500) queue = queue.filter(e => !batch.includes(e));
  } catch { /* Retry transient errors with the same IDs; INSERT OR IGNORE prevents double counting. */ }
  finally { sending = false; }
}
