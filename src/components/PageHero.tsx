import type { ReactNode } from 'react';
import KeyArt from '@/components/KeyArt';
import type { KeyArtTheme } from '@/lib/site';

interface Props {
  /** Key-art theme for the banner (banner-clean, 3:1, no lettering). */
  theme: KeyArtTheme;
  /** Small red line above the title, e.g. "// ARSENAL". */
  kicker: string;
  title: string;
  /** One or two sentences under the title. */
  intro?: ReactNode;
  /** Extra content under the intro (legends, links, status cards). */
  children?: ReactNode;
  /** Narrower text column for text-heavy pages. */
  narrow?: boolean;
}

/**
 * Page header in the look of the home hero: key art behind a dark gradient, drifting fog, a vignette and the hazard
 * stripe at the bottom. The page container above it uses `pt-16` so the picture runs under the transparent navbar.
 */
export default function PageHero({ theme, kicker, title, intro, children, narrow = false }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <KeyArt theme={theme} kind="banner-clean" sizes="100vw" alt="" loading="eager" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/55 via-bg/60 to-bg" />
        <div className="absolute inset-0 hero-vignette" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-moon/5 to-transparent animate-fog-drift opacity-40" />
        </div>
      </div>
      <div className={`relative z-10 mx-auto px-4 lg:px-8 pt-24 pb-12 lg:pt-32 lg:pb-16 ${narrow ? 'max-w-4xl' : 'max-w-7xl'}`}>
        <span className="kicker text-xs font-heading uppercase tracking-widest text-blood">{kicker}</span>
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl uppercase text-bone mt-3 mb-4 hero-text-shadow leading-none">{title}</h1>
        {intro && <p className="text-sm lg:text-base text-bone-muted font-body font-light leading-relaxed max-w-3xl hero-text-shadow">{intro}</p>}
        {children}
      </div>
      <div className="hazard-stripe w-full relative z-10" />
    </section>
  );
}
