import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { analyticsChoice, analyticsEnabled, clearAnalyticsState, flush, privacySignal, setAnalyticsChoice, track } from '@/lib/analytics';
import { META_BETA_URL } from '@/lib/site';

export default function Analytics() {
  const { pathname } = useLocation();
  const { lang } = useI18n();
  const [revision, revise] = useState(0);
  const [settings, open] = useState(false);
  const lastPage = useRef('');
  const previousLanguage = useRef(lang);
  const de = lang === 'de';
  useEffect(() => {
    const changed = () => revise(n => n + 1);
    const settings = () => open(true);
    const storage = (e: StorageEvent) => { if (e.key === 'zrb.analytics.choice') { clearAnalyticsState(); changed(); } };
    window.addEventListener('zrb:consent', changed); window.addEventListener('zrb:privacy', settings); window.addEventListener('storage', storage);
    return () => { window.removeEventListener('zrb:consent', changed); window.removeEventListener('zrb:privacy', settings); window.removeEventListener('storage', storage); };
  }, []);
  useEffect(() => {
    if (pathname.startsWith('/tracking') || !analyticsEnabled()) return;
    const pageKey = pathname + ':' + revision;
    if (lastPage.current !== pageKey) { lastPage.current = pageKey; track('page_view'); }
    const milestones = new Set<number>();
    let active = 0;
    const scroll = () => {
      const distance = document.documentElement.scrollHeight - innerHeight;
      if (distance < 100) return;
      const depth = Math.round(scrollY / distance * 100);
      for (const value of [25, 50, 75, 90]) if (depth >= value && !milestones.has(value)) { milestones.add(value); track('scroll', '', value); }
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') { active += 1; if (active === 15 || active === 60) track('engaged', '', active); }
      void flush();
    }, 1000);
    window.addEventListener('scroll', scroll, { passive: true });
    return () => { clearInterval(timer); window.removeEventListener('scroll', scroll); };
  }, [pathname, revision]);
  useEffect(() => { if (previousLanguage.current !== lang) track('language_change', lang); previousLanguage.current = lang; }, [lang]);
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target.closest('a,button') : null;
      if (!element) return;
      const placement = element.getAttribute('data-track') || (element.closest('footer') ? 'footer' : element.closest('nav,header') ? 'navigation' : 'content');
      if (!(element instanceof HTMLAnchorElement)) return;
      const url = new URL(element.href);
      if (element.href === META_BETA_URL) track('beta_click', placement);
      else if (url.protocol === 'mailto:') track('contact_click', placement);
      else if (element.hasAttribute('download') || /\.(zip|pdf|png|jpg|webp|svg)$/i.test(url.pathname)) track('download', placement);
      else if (url.origin !== location.origin && /^https?:$/.test(url.protocol)) track('outbound_click', placement);
      else if (url.origin === location.origin) track('navigation', placement);
    };
    const mediaProgress = new WeakMap<HTMLVideoElement, Set<number>>();
    const media = (event: Event) => {
      const video = event.target;
      if (!(video instanceof HTMLVideoElement) || !/zrb_trailer_(en|de)_1080\.mp4(?:$|\?)/.test(video.currentSrc)) return;
      const target = video.currentSrc.includes('_de_') ? 'trailer_de' : 'trailer_en';
      const seen = mediaProgress.get(video) ?? new Set<number>(); mediaProgress.set(video, seen);
      if (event.type === 'play' && !seen.has(0)) { seen.add(0); track('trailer_start', target); }
      if (event.type === 'timeupdate' && Number.isFinite(video.duration) && video.duration > 0) for (const value of [25,50,75]) {
        if (video.currentTime / video.duration * 100 >= value && !seen.has(value)) { seen.add(value); track('trailer_progress', target, value); }
      }
      if (event.type === 'ended' && !seen.has(100)) { seen.add(100); track('trailer_complete', target, 100); }
    };
    const hide = () => { void flush(true); };
    const error = () => track('client_error', 'runtime_error');
    document.addEventListener('click', click, true);
    for (const name of ['play', 'timeupdate', 'ended']) document.addEventListener(name, media, true);
    window.addEventListener('pagehide', hide); window.addEventListener('error', error); window.addEventListener('unhandledrejection', error);
    return () => {
      document.removeEventListener('click', click, true); for (const name of ['play', 'timeupdate', 'ended']) document.removeEventListener(name, media, true);
      window.removeEventListener('pagehide', hide); window.removeEventListener('error', error); window.removeEventListener('unhandledrejection', error);
    };
  }, []);
  if (pathname.startsWith('/tracking')) return null;
  const visible = settings || (analyticsChoice() === 'unset' && !privacySignal());
  return <>
    <button type="button" onClick={() => open(true)} className="fixed bottom-3 left-3 z-40 rounded border border-bone/30 bg-bg px-3 py-2 text-xs text-bone">{de ? 'Datenschutz-Einstellungen' : 'Privacy settings'}</button>
    {visible && <section aria-label={de ? 'Optionale Website-Analyse' : 'Optional website analytics'} className="fixed bottom-0 inset-x-0 z-50 border-t border-bone/30 bg-bg p-5 text-bone shadow-2xl">
      <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 text-sm"><h2 className="font-heading text-lg mb-2">{de ? 'Hilfst du uns, die Beta zu verbessern?' : 'Help us improve the beta?'}</h2>
          <p>{de ? 'Mit deiner Zustimmung messen wir Besuche, Kampagnenquellen, Trailer-Nutzung und Klicks zum Beta-Zugang. Keine Werbepixel und kein Fingerprinting. Ohne Zustimmung bleibt die Website vollständig nutzbar.' : 'With your consent we measure visits, campaign sources, trailer engagement and clicks to beta access. No advertising pixels or fingerprinting. The website works fully without consent.'}</p>
          <Link className="underline inline-block mt-2" to="/datenschutz">{de ? 'Details und Speicherdauer' : 'Details and retention'}</Link>
          {privacySignal() && <p className="mt-2">{de ? 'Dein Browser widerspricht dem Tracking (DNT/GPC). Die Analyse bleibt aus.' : 'Your browser opts out (DNT/GPC). Analytics stays disabled.'}</p>}
        </div>
        <div className="flex flex-wrap gap-3"><button className="border border-bone px-4 py-3 text-sm" onClick={() => { setAnalyticsChoice('declined'); open(false); }}>{de ? 'Ohne Analyse' : 'Without analytics'}</button>
          {!privacySignal() && <button className="border border-bone px-4 py-3 text-sm" onClick={() => { setAnalyticsChoice('accepted'); open(false); }}>{de ? 'Analyse erlauben' : 'Allow analytics'}</button>}
          {settings && <button className="underline px-3" onClick={() => open(false)}>{de ? 'Schließen' : 'Close'}</button>}</div>
      </div>
    </section>}
  </>;
}
