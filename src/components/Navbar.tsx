import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Skull } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { META_URL } from '@/lib/site';

const navLinks = [
  { to: '/', key: 'nav.home' },
  { to: '/game', key: 'nav.game' },
  { to: '/modes', key: 'nav.modes' },
  { to: '/arsenal', key: 'nav.arsenal' },
  { to: '/leaderboard', key: 'nav.leaderboard' },
  { to: '/news', key: 'nav.news' },
  { to: '/press', key: 'nav.press' },
  { to: '/faq', key: 'nav.faq' },
];

export default function Navbar() {
  const { t, lang, toggle } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-bg/95 backdrop-blur-md border-b border-bg-steel/60' : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Skull className="w-7 h-7 text-blood group-hover:text-blood-hover transition-colors" strokeWidth={2.2} />
          <span className="font-horror text-sm sm:text-base text-blood tracking-wider leading-none">ZRB</span>
        </Link>

        <ul className="hidden xl:flex items-center gap-5">
          {navLinks.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={`text-sm font-heading uppercase tracking-wider transition-colors relative group ${
                  location.pathname === l.to ? 'text-blood' : 'text-bone-muted hover:text-bone'
                }`}
              >
                {t(l.key)}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-blood transition-all duration-300 ${
                  location.pathname === l.to ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="text-xs font-heading uppercase tracking-wider text-bone-muted hover:text-ember transition-colors px-2 py-1 border border-bg-steel hover:border-ember/50"
          >
            {lang === 'en' ? 'DE' : 'EN'}
          </button>

          <a
            href={META_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center px-4 py-2 bg-blood hover:bg-blood-hover text-bone text-xs font-heading uppercase tracking-wider transition-all hover:scale-105 glow-blood"
          >
            {t('nav.join')}
          </a>

          <button className="xl:hidden text-bone p-1" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="xl:hidden bg-bg/95 backdrop-blur-md border-t border-bg-steel/60 animate-fade-in-up">
          <ul className="px-4 py-4 space-y-2">
            {navLinks.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`block text-sm font-heading uppercase tracking-wider py-2 transition-colors ${
                    location.pathname === l.to ? 'text-blood' : 'text-bone-muted hover:text-bone'
                  }`}
                >
                  {t(l.key)}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={META_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-2 px-4 py-2 bg-blood hover:bg-blood-hover text-bone text-xs font-heading uppercase tracking-wider"
              >
                {t('nav.join')}
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
