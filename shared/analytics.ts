/** The only values admitted to analytics. Never send full URLs, free text, account IDs or form contents. */
export const EVENTS = ['page_view', 'navigation', 'beta_click', 'outbound_click', 'download', 'contact_click', 'scroll', 'engaged', 'trailer_start', 'trailer_progress', 'trailer_complete', 'language_change', 'client_error'] as const;
export type EventName = typeof EVENTS[number];
export const CONSENT_VERSION = '2026-11-19-v1';
export const RETENTION_DAYS = 90;
export function pagePath(value: unknown): string {
  if (typeof value !== 'string') return '/other';
  const path = value.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  if (/^\/(?:|game|modes|arsenal|leaderboard|news|press|faq|impressum|datenschutz|privacy|terms|breach)$/.test(path)) return path;
  if (/^\/news\/[a-z0-9-]{1,80}$/.test(path)) return path;
  return '/other';
}
export function campaignSlug(value: unknown): string {
  return typeof value === 'string' && /^[a-z][a-z0-9_-]{0,63}$/i.test(value) ? value.toLowerCase() : '';
}
export interface Attribution { source: string; medium: string; campaign: string; content: string; }
export interface AnalyticsEvent { id: string; name: EventName; path: string; target: string; value: number; language: string; }
export function sourceFromReferrer(value: string): string {
  try {
    const host = new URL(value).hostname.toLowerCase();
    if (/(^|\.)(instagram\.com|l\.instagram\.com)$/.test(host)) return 'instagram';
    if (/(^|\.)(tiktok\.com)$/.test(host)) return 'tiktok';
    if (/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) return 'youtube';
    if (/(^|\.)(reddit\.com|redd\.it)$/.test(host)) return 'reddit';
    if (/(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com)$/.test(host)) return 'search';
    if (/(^|\.)zombierealitybreach\.com$/.test(host)) return 'direct';
    return 'referral';
  } catch { return 'direct'; }
}
