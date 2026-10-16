import type { ReactNode } from 'react';
import KeyArt from '@/components/KeyArt';
import type { KeyArtTheme } from '@/lib/site';

interface Props {
  /** Key-art theme shown faintly behind the section. */
  theme: KeyArtTheme;
  children: ReactNode;
  className?: string;
  /** Opacity of the picture, default 0.14. */
  opacity?: number;
}

/** A section with a faint key-art picture behind it, faded to the page background on every edge. */
export default function Backdrop({ theme, children, className = '', opacity = 0.14 }: Props) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <KeyArt theme={theme} widths={[1920, 1280, 800]} alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: `rgba(11, 11, 13, ${1 - opacity})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/80 via-transparent to-bg/80" />
      </div>
      <div className="relative z-10">{children}</div>
    </section>
  );
}
