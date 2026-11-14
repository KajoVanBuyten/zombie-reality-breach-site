import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { keyArtJpg, keyArtThemes, trailerVideo } from '@/lib/site';

export interface TrailerHandle {
  /** Scrolls the player into view and starts playback (call from a click, so sound is allowed). */
  play: () => void;
}

/**
 * The game trailer in the site language: one file per language with the same cut and timing (public/assets/video).
 * Switching the language swaps the file and keeps the position and the playing state.
 * Nothing is downloaded before the visitor presses play (`preload="none"`, key art as poster).
 */
const Trailer = forwardRef<TrailerHandle, { className?: string }>(function Trailer({ className = '' }, ref) {
  const { lang, t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  // Position and playing state to restore once the other language's file has loaded its metadata.
  const resume = useRef<{ time: number; playing: boolean } | null>(null);
  const [started, setStarted] = useState(false);

  // The `src` is set here instead of in JSX, so the position can be read before the element resets.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const url = trailerVideo[lang];
    if (video.getAttribute('src') === url) return;
    const time = resume.current?.time ?? video.currentTime;
    const playing = resume.current?.playing ?? (!video.paused && !video.ended);
    resume.current = time > 0 ? { time, playing } : null;
    video.src = url;
    // With `preload="none"` a paused player stays idle until the next play; a playing one has to load now.
    if (resume.current?.playing) video.load();
  }, [lang]);

  const onLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    const wanted = resume.current;
    if (!video || !wanted) return;
    resume.current = null;
    video.currentTime = Math.min(wanted.time, Math.max(0, video.duration - 0.1));
    if (wanted.playing) void video.play().catch(() => {});
  }, []);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setStarted(true);
    video.scrollIntoView({ behavior: 'smooth', block: 'center' });
    void video.play().catch(() => {});
  }, []);

  useImperativeHandle(ref, () => ({ play }), [play]);

  return (
    <div className={`relative aspect-video bg-black border border-bg-steel overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full"
        poster={keyArtJpg(keyArtThemes.realityBreach, 'cover')}
        preload="none"
        playsInline
        controls={started}
        onPlay={() => setStarted(true)}
        onLoadedMetadata={onLoadedMetadata}
        aria-label={t('trailer.label')}
      />
      {!started && (
        <button
          type="button"
          onClick={play}
          aria-label={t('trailer.play')}
          className="group absolute inset-0 flex items-center justify-center bg-bg/20 hover:bg-bg/5 transition-colors"
        >
          <span className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-full bg-blood group-hover:bg-blood-hover group-hover:scale-110 transition-all glow-blood">
            <Play className="w-9 h-9 sm:w-11 sm:h-11 text-bone translate-x-0.5" fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
});

export default Trailer;
