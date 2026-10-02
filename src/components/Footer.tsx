import { Link } from 'react-router-dom';
import { Skull, Mail } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { CONTACT_EMAIL } from '@/lib/site';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="relative bg-bg border-t border-bg-steel/40">
      <div className="hazard-stripe w-full" />
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Skull className="w-6 h-6 text-blood" strokeWidth={2.2} />
              <span className="font-horror text-sm text-blood tracking-wider">ZRB</span>
            </div>
            <p className="text-sm text-bone-muted font-body leading-relaxed max-w-xs">{t('footer.about')}</p>
          </div>

          <div>
            <h4 className="text-xs font-heading uppercase tracking-widest text-bone-muted mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/game', label: t('nav.game') },
                { to: '/modes', label: t('nav.modes') },
                { to: '/arsenal', label: t('nav.arsenal') },
                { to: '/leaderboard', label: t('nav.leaderboard') },
                { to: '/news', label: t('nav.news') },
                { to: '/press', label: t('nav.press') },
                { to: '/faq', label: t('nav.faq') },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-bone-muted hover:text-blood transition-colors font-body">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-heading uppercase tracking-widest text-bone-muted mb-4">{t('footer.contact')}</h4>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-bone-muted hover:text-blood transition-colors font-body"
            >
              <Mail className="w-4 h-4" />
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-bg-steel/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-bone-muted/50 font-body">&copy; {new Date().getFullYear()} KaMa Studios. All rights reserved.</p>
          <div className="flex gap-5 text-xs">
            <Link to="/impressum" className="text-bone-muted/50 hover:text-bone-muted transition-colors font-body">{t('footer.impressum')}</Link>
            <Link to="/datenschutz" className="text-bone-muted/50 hover:text-bone-muted transition-colors font-body">{t('footer.privacy')}</Link>
            <Link to="/press" className="text-bone-muted/50 hover:text-bone-muted transition-colors font-body">{t('footer.press')}</Link>
          </div>
        </div>

        <p className="text-[10px] text-bone-muted/30 text-center mt-4 font-body">{t('footer.trademark')}</p>
      </div>
    </footer>
  );
}
