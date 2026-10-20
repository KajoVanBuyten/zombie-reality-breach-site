import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, KeyRound, RotateCcw, ShieldAlert } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { keyArtThemes } from '@/lib/site';
import PageHero from '@/components/PageHero';
import SteelCard from '@/components/SteelCard';
import { ApiError, errorText, formatCode, metaClaim, questCode, rememberedRun } from '@/breach/api';

type State = 'claiming' | 'done' | 'error';

const COPY = {
  en: {
    kicker: '// Meta account',
    title: 'Linking your account',
    claiming: 'Confirming your Meta account…',
    done: 'Breach Gold is waiting in your armory — start the game.',
    already: 'This Meta account already has Breach Gold; nothing else to do.',
    gameHint: 'In the game: armory, Breach Gold, CLAIM WEB REWARD (or it appears by itself when online features are on).',
    missing: 'Meta did not send a link answer to this page. Start the link from the quest reward screen again.',
    retry: 'Try again',
    code: 'Show code instead',
    codeHint: 'Enter this code in the game armory under ENTER CODE. It works once.',
    again: 'Back to the quest',
  },
  de: {
    kicker: '// Meta-Konto',
    title: 'Konto wird verknüpft',
    claiming: 'Dein Meta-Konto wird bestätigt…',
    done: 'Breach Gold wartet in deiner Waffenkammer — starte das Spiel.',
    already: 'Dieses Meta-Konto hat Breach Gold schon; es ist nichts weiter zu tun.',
    gameHint: 'Im Spiel: Waffenkammer, Breach Gold, CLAIM WEB REWARD (oder es erscheint von selbst, wenn die Online-Funktionen an sind).',
    missing: 'Meta hat keine Antwort an diese Seite geschickt. Starte die Verknüpfung erneut auf dem Belohnungsbildschirm der Quest.',
    retry: 'Erneut versuchen',
    code: 'Stattdessen Code anzeigen',
    codeHint: 'Gib diesen Code im Spiel in der Waffenkammer unter ENTER CODE ein. Er gilt einmal.',
    again: 'Zurück zur Quest',
  },
};

export default function BreachLinkedPage() {
  const { lang } = useI18n();
  const de = lang === 'de';
  const c = COPY[lang];
  // The fragment carries Meta's one-time code: read it once, then remove it from the address bar.
  const payload = useRef<string>(window.location.hash.replace(/^#/, ''));
  const [state, setState] = useState<State>('claiming');
  const [already, setAlready] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const claim = useCallback(async () => {
    if (!payload.current) {
      setState('error');
      setError(c.missing);
      return;
    }
    setState('claiming');
    setError(null);
    try {
      const result = await metaClaim(payload.current);
      setAlready(result.already);
      setState('done');
    } catch (e) {
      setState('error');
      setError(errorText(e instanceof ApiError ? e.code : 'server_error', de));
    }
  }, [c, de]);

  useEffect(() => {
    if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
    // StrictMode runs effects twice in development; the code may only be used once.
    if (started.current) return;
    started.current = true;
    claim();
  }, [claim]);

  const fallbackRun = rememberedRun();
  const showCode = useCallback(async () => {
    if (!fallbackRun) return;
    setBusy(true);
    try {
      setCode((await questCode(fallbackRun)).code);
    } catch (e) {
      setError(errorText(e instanceof ApiError ? e.code : 'server_error', de));
    } finally {
      setBusy(false);
    }
  }, [fallbackRun, de]);

  return (
    <div className="pt-16">
      <PageHero theme={keyArtThemes.realityBreach} kicker={c.kicker} title={c.title} narrow />
      <section className="py-12 lg:py-16 max-w-3xl mx-auto px-4 lg:px-8">
        <SteelCard className="p-6 sm:p-8 relative">
          <div className="relative z-10">
            {state === 'claiming' && <p className="text-sm text-bone-muted font-body animate-glow-pulse">{c.claiming}</p>}
            {state === 'done' && (
              <>
                <p className="flex items-start gap-3 font-heading text-xl sm:text-2xl uppercase text-gold leading-snug">
                  <CheckCircle2 className="w-7 h-7 flex-shrink-0" /> {already ? c.already : c.done}
                </p>
                <p className="text-sm text-bone-muted font-body font-light mt-4 leading-relaxed">{c.gameHint}</p>
              </>
            )}
            {state === 'error' && (
              <>
                <p className="flex items-start gap-2 text-sm text-ember font-body">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  {payload.current && (
                    <button type="button" onClick={claim} className="px-6 py-3 bg-gold hover:bg-ember text-bg font-heading uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-colors">
                      <RotateCcw className="w-4 h-4" /> {c.retry}
                    </button>
                  )}
                  {fallbackRun && (
                    <button type="button" onClick={showCode} disabled={busy} className="px-6 py-3 border border-gold text-gold hover:bg-gold hover:text-bg disabled:opacity-50 font-heading uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-colors">
                      <KeyRound className="w-4 h-4" /> {c.code}
                    </button>
                  )}
                </div>
                {code && (
                  <>
                    <p className="mt-8 text-center font-heading text-5xl sm:text-7xl tracking-[0.2em] text-gold select-all" aria-live="polite">{formatCode(code)}</p>
                    <p className="text-xs text-bone-muted font-body font-light mt-3 text-center">{c.codeHint}</p>
                  </>
                )}
              </>
            )}
            <Link to="/breach" className="mt-8 inline-flex items-center gap-2 text-xs font-heading uppercase tracking-wider text-blood hover:text-blood-hover">
              {c.again}
            </Link>
          </div>
        </SteelCard>
      </section>
    </div>
  );
}
