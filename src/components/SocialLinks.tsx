import { Instagram, Youtube } from 'lucide-react';
import { SOCIAL_LINKS } from '@/lib/site';

// lucide has no TikTok mark; this is the plain note glyph in the same 24 px box, drawn with currentColor.
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1 0-5.18c.27 0 .53.04.77.12V9.68a5.7 5.7 0 0 0-.77-.05 5.68 5.68 0 1 0 5.68 5.68V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

const icons = { tiktok: TikTokIcon, instagram: Instagram, youtube: Youtube };

/** The social media profiles as icon links with their names (footer and press page). */
export default function SocialLinks({ className = '' }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-2 ${className}`}>
      {SOCIAL_LINKS.map((s) => {
        const Icon = icons[s.id];
        return (
          <li key={s.id}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-bone-muted hover:text-blood transition-colors font-body"
            >
              <Icon className="w-4 h-4" />
              {s.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
