import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, Link2, KeyRound, RotateCcw, ShieldAlert, Trophy, Timer } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { GAME_PRIVACY_URL, keyArtThemes } from '@/lib/site';
import PageHero from '@/components/PageHero';
import SteelCard from '@/components/SteelCard';
import { BreachGame } from '@/breach/game';
import { QuestAudio } from '@/breach/audio';
import { QuestReporter } from '@/breach/reporter';
import type { ReportState } from '@/breach/reporter';
import { ApiError, bestTime, errorText, formatCode, formatTime, metaLinkReady, metaLinkUrl, questCode, recordTime, rememberRun } from '@/breach/api';

type Phase = 'intro' | 'starting' | 'playing' | 'reward';
type Support = 'checking' | 'ar' | 'no-ar';

const SESSION_INIT: XRSessionInit = {
  requiredFeatures: ['plane-detection'],
  optionalFeatures: ['local-floor', 'hand-tracking', 'anchors', 'mesh-detection'],
};

const COPY = {
  en: {
    kicker: '// Web AR quest',
    title: 'Breach in your home',
    intro: 'A rift tears open in your real wall. Hold off the zombies, find the three golden parts in your room, assemble Breach Gold and close the rift. 2 to 5 minutes, replay as often as you like.',
    stages: ['The rift opens on your wall', 'The hunt for three golden parts', 'Assemble them with both hands', 'Finale: a big one breaks through', 'Weapon secured: claim it in the game'],
    safety: 'Clear some space around you. The quest uses the room setup of your Quest (walls and furniture); it stays in your browser and is never sent anywhere.',
    enter: 'Enter the breach',
    starting: 'Opening the breach…',
    best: 'Best time on this headset',
    noAr: 'Open this page in the browser of your Meta Quest 3 or 3S to play the AR quest.',
    noPlanes: 'Your browser can start mixed reality but does not offer room plane detection, which the quest needs. Update the Quest browser, and make sure the room setup is done in Settings > Physical space.',
    failed: 'The mixed reality session could not be started.',
    ended: 'The session ended before the breach was closed. Enter again to restart.',
    rewardTitle: 'Weapon secured',
    rewardText: 'Breach Gold is yours: the golden Desert Eagle for every mode with a weapon shop, Reality Breach and VR included.',
    time: 'Your time',
    newBest: 'New best time!',
    verifying: 'Verifying your run… (a run needs at least 90 seconds)',
    verified: 'Run verified. Choose how to get Breach Gold into the game:',
    link: 'Link Meta account',
    linkHint: 'Recommended: once linked, the game finds the reward by itself (armory, CLAIM WEB REWARD).',
    code: 'Show code',
    codeHint: 'Enter this code in the game armory under ENTER CODE. It works once.',
    again: 'Play again',
    privacy: 'Privacy policy',
  },
  de: {
    kicker: '// Web-AR-Quest',
    title: 'Breach in deinem Zuhause',
    intro: 'In deiner echten Wand reißt ein Riss auf. Halte die Zombies auf, finde die drei goldenen Teile in deinem Raum, setze Breach Gold zusammen und schließe den Riss. 2 bis 5 Minuten, beliebig oft wiederholbar.',
    stages: ['Der Riss öffnet sich an deiner Wand', 'Die Jagd nach drei goldenen Teilen', 'Zusammenbau mit beiden Händen', 'Finale: ein Großer bricht durch', 'Waffe gesichert: im Spiel abholen'],
    safety: 'Schaffe etwas Platz um dich. Die Quest nutzt die Raumeinrichtung deiner Quest (Wände und Möbel); sie bleibt in deinem Browser und wird nirgendwohin gesendet.',
    enter: 'Betritt den Riss',
    starting: 'Der Riss öffnet sich…',
    best: 'Bestzeit auf dieser Brille',
    noAr: 'Öffne diese Seite im Browser deiner Meta Quest 3 oder 3S, um die AR-Quest zu spielen.',
    noPlanes: 'Dein Browser kann Mixed Reality starten, bietet aber keine Erkennung der Raumflächen, die die Quest braucht. Aktualisiere den Quest-Browser und richte den Raum unter Einstellungen > Physischer Raum ein.',
    failed: 'Die Mixed-Reality-Sitzung konnte nicht gestartet werden.',
    ended: 'Die Sitzung wurde beendet, bevor der Riss geschlossen war. Betritt ihn erneut, um neu zu starten.',
    rewardTitle: 'Waffe gesichert',
    rewardText: 'Breach Gold gehört dir: die goldene Desert Eagle für jeden Modus mit Waffenshop, auch Reality Breach und VR.',
    time: 'Deine Zeit',
    newBest: 'Neue Bestzeit!',
    verifying: 'Dein Lauf wird bestätigt… (ein Lauf dauert mindestens 90 Sekunden)',
    verified: 'Lauf bestätigt. Wähle, wie Breach Gold ins Spiel kommt:',
    link: 'Mit Meta-Konto verknüpfen',
    linkHint: 'Empfohlen: Nach der Verknüpfung findet das Spiel die Belohnung selbst (Waffenkammer, CLAIM WEB REWARD).',
    code: 'Code anzeigen',
    codeHint: 'Gib diesen Code im Spiel in der Waffenkammer unter ENTER CODE ein. Er gilt einmal.',
    again: 'Nochmal spielen',
    privacy: 'Datenschutzerklärung',
  },
};

export default function BreachPage() {
  const { lang } = useI18n();
  const de = lang === 'de';
  const c = COPY[lang];
  const [support, setSupport] = useState<Support>('checking');
  const [phase, setPhase] = useState<Phase>('intro');
  const [message, setMessage] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [best, setBest] = useState<number | null>(() => bestTime());
  const [report, setReport] = useState<ReportState>('starting');
  const [reportError, setReportError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const reporter = useRef<QuestReporter | null>(null);
  const game = useRef<BreachGame | null>(null);

  useEffect(() => {
    let alive = true;
    const xr = navigator.xr;
    if (!xr) {
      setSupport('no-ar');
      return;
    }
    xr.isSessionSupported('immersive-ar')
      .then((ok) => alive && setSupport(ok ? 'ar' : 'no-ar'))
      .catch(() => alive && setSupport('no-ar'));
    return () => {
      alive = false;
    };
  }, []);

  // Leaving the page ends a running session and stops pending reports of an unfinished run.
  useEffect(
    () => () => {
      game.current?.exit();
      if (reporter.current && reporter.current.state !== 'finishing') reporter.current.stop();
    },
    [],
  );

  const enter = useCallback(async () => {
    const xr = navigator.xr;
    if (!xr || phase === 'starting') return;
    setMessage(null);
    setCode(null);
    setActionError(null);
    setPhase('starting');
    // Audio and the session request must start inside the click (user activation).
    const audio = new QuestAudio();
    const sessionRequest = xr.requestSession('immersive-ar', SESSION_INIT);
    reporter.current?.stop();
    const rep = new QuestReporter();
    reporter.current = rep;
    rep.onChange(() => {
      setReport(rep.state);
      setReportError(rep.error);
    });
    setReport(rep.state);
    let session: XRSession;
    try {
      session = await sessionRequest;
    } catch (e) {
      rep.stop();
      audio.close();
      setPhase('intro');
      setMessage(e instanceof DOMException && e.name === 'NotSupportedError' ? c.noPlanes : c.failed);
      return;
    }
    let done = false;
    const g = new BreachGame(
      session,
      audio,
      {
        onStep: (n) => rep.step(n),
        onComplete: (ms) => {
          done = true;
          setTime(ms);
          setNewBest(recordTime(ms));
          setBest(bestTime());
          rep.finish();
        },
        onEnd: (completed) => {
          audio.close();
          game.current = null;
          if (completed || done) {
            setPhase('reward');
          } else {
            rep.stop();
            setPhase('intro');
            setMessage(c.ended);
          }
        },
        bestTime: () => bestTime(),
      },
      lang,
    );
    game.current = g;
    try {
      await g.start();
      setPhase('playing');
    } catch {
      rep.stop();
      session.end().catch(() => undefined);
      setPhase('intro');
      setMessage(c.failed);
    }
  }, [c, lang, phase]);

  const linkMeta = useCallback(async () => {
    const run = reporter.current?.run;
    if (!run) return;
    setBusy(true);
    setActionError(null);
    try {
      rememberRun(run);
      await metaLinkReady(run);
      window.location.assign(metaLinkUrl(run));
    } catch (e) {
      setActionError(errorText(e instanceof ApiError ? e.code : 'server_error', de));
      setBusy(false);
    }
  }, [de]);

  const showCode = useCallback(async () => {
    const run = reporter.current?.run;
    if (!run) return;
    setBusy(true);
    setActionError(null);
    try {
      const result = await questCode(run);
      setCode(result.code);
    } catch (e) {
      setActionError(errorText(e instanceof ApiError ? e.code : 'server_error', de));
    } finally {
      setBusy(false);
    }
  }, [de]);

  const again = useCallback(() => {
    setPhase('intro');
    setCode(null);
    setTime(null);
    setActionError(null);
  }, []);

  return (
    <div className="pt-16">
      <PageHero theme={keyArtThemes.realityBreach} kicker={c.kicker} title={phase === 'reward' ? c.rewardTitle : c.title} intro={phase === 'reward' ? c.rewardText : c.intro} narrow />
      <section className="py-12 lg:py-16 max-w-4xl mx-auto px-4 lg:px-8">
        {phase !== 'reward' ? (
          <SteelCard className="p-6 sm:p-8 relative">
            <div className="relative z-10">
              <ol className="grid sm:grid-cols-5 gap-3 mb-6">
                {c.stages.map((s, i) => (
                  <li key={s} className="border border-bg-steel bg-bg/60 p-3">
                    <span className="block font-heading text-gold text-lg">{i + 1}</span>
                    <span className="block text-xs text-bone-muted font-body leading-snug">{s}</span>
                  </li>
                ))}
              </ol>
              <p className="text-sm text-bone-muted font-body font-light leading-relaxed mb-6">{c.safety}</p>
              {message && (
                <p className="flex items-start gap-2 text-sm text-ember font-body mb-6">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" /> {message}
                </p>
              )}
              {support === 'no-ar' ? (
                <p className="flex items-start gap-2 text-sm text-bone font-body">
                  <ShieldAlert className="w-4 h-4 text-ember flex-shrink-0 mt-0.5" /> {c.noAr}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={enter}
                  disabled={support !== 'ar' || phase === 'starting' || phase === 'playing'}
                  className="w-full sm:w-auto px-10 py-4 bg-gold hover:bg-ember disabled:opacity-50 disabled:cursor-wait text-bg font-heading uppercase tracking-wider text-lg transition-all hover:scale-105 flex items-center justify-center gap-3 shadow-[0_0_32px_rgba(232,179,58,0.45)]"
                >
                  <ScanLine className="w-5 h-5" />
                  {phase === 'starting' || phase === 'playing' ? c.starting : c.enter}
                </button>
              )}
              {best !== null && (
                <p className="mt-5 flex items-center gap-2 text-xs font-heading uppercase tracking-wider text-bone-muted">
                  <Trophy className="w-4 h-4 text-gold" /> {c.best}: <span className="text-bone">{formatTime(best)}</span>
                </p>
              )}
            </div>
          </SteelCard>
        ) : (
          <SteelCard className="p-6 sm:p-8 relative border-gold/40">
            <div className="relative z-10">
              {time !== null && (
                <p className="flex flex-wrap items-center gap-3 font-heading uppercase tracking-wider text-bone mb-6">
                  <Timer className="w-5 h-5 text-gold" /> {c.time}: <span className="text-gold text-2xl">{formatTime(time)}</span>
                  {newBest && <span className="text-xs text-ember">{c.newBest}</span>}
                  {!newBest && best !== null && <span className="text-xs text-bone-muted">({c.best}: {formatTime(best)})</span>}
                </p>
              )}

              {(report === 'starting' || report === 'running' || report === 'finishing') && <p className="text-sm text-bone-muted font-body animate-glow-pulse mb-6">{c.verifying}</p>}
              {report === 'failed' && (
                <p className="flex items-start gap-2 text-sm text-ember font-body mb-6">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" /> {errorText(reportError ?? 'server_error', de)}
                </p>
              )}

              {report === 'verified' && (
                <>
                  <p className="text-sm text-bone font-body mb-5">{c.verified}</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <button
                        type="button"
                        onClick={linkMeta}
                        disabled={busy}
                        className="w-full px-6 py-4 bg-gold hover:bg-ember disabled:opacity-50 text-bg font-heading uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <Link2 className="w-5 h-5" /> {c.link}
                      </button>
                      <p className="text-xs text-bone-muted font-body font-light mt-2 leading-relaxed">{c.linkHint}</p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={showCode}
                        disabled={busy}
                        className="w-full px-6 py-4 border border-gold text-gold hover:bg-gold hover:text-bg disabled:opacity-50 font-heading uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <KeyRound className="w-5 h-5" /> {c.code}
                      </button>
                      <p className="text-xs text-bone-muted font-body font-light mt-2 leading-relaxed">{c.codeHint}</p>
                    </div>
                  </div>
                  {code && (
                    <p className="mt-8 text-center font-heading text-5xl sm:text-7xl tracking-[0.2em] text-gold glow-blood select-all" aria-live="polite">
                      {formatCode(code)}
                    </p>
                  )}
                </>
              )}
              {actionError && (
                <p className="flex items-start gap-2 text-sm text-ember font-body mt-5">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" /> {actionError}
                </p>
              )}

              <button type="button" onClick={again} className="mt-8 px-6 py-3 border border-bg-steel text-bone-muted hover:text-bone hover:border-bone-muted font-heading uppercase tracking-wider text-sm flex items-center gap-2 transition-colors">
                <RotateCcw className="w-4 h-4" /> {c.again}
              </button>
            </div>
          </SteelCard>
        )}
        <p className="mt-6 text-xs text-bone-muted font-body font-light">
          <a href={GAME_PRIVACY_URL} className="text-blood hover:text-blood-hover">{c.privacy}</a>
          {' · '}
          <Link to="/" className="text-blood hover:text-blood-hover">zombierealitybreach.com</Link>
        </p>
        {/* Required by CC-BY 4.0 for public/breach/golden_deagle.glb (see CREDITS.md). */}
        <p className="mt-2 text-[11px] text-bone-muted font-body font-light leading-relaxed">
          Breach Gold: This work is based on "
          <a href="https://sketchfab.com/3d-models/desert-eagle-cabde59f5cf24effaf80536e35d04e95" className="underline hover:text-bone" rel="noopener noreferrer">Desert Eagle</a>
          " by{' '}
          <a href="https://sketchfab.com/ELIZION" className="underline hover:text-bone" rel="noopener noreferrer">ELIZION</a>
          {' '}licensed under{' '}
          <a href="http://creativecommons.org/licenses/by/4.0/" className="underline hover:text-bone" rel="noopener noreferrer">CC-BY-4.0</a>.
          {' '}Pistol sound: "
          <a href="https://opengameart.org/content/chaingun-pistol-rifle-shotgun-shots" className="underline hover:text-bone" rel="noopener noreferrer">Chaingun, pistol, rifle, shotgun shots</a>
          " by Michel Baradari, licensed under{' '}
          <a href="https://creativecommons.org/licenses/by/3.0/" className="underline hover:text-bone" rel="noopener noreferrer">CC-BY 3.0</a>.
        </p>
      </section>
    </div>
  );
}
