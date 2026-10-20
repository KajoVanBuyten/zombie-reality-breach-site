import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { I18nProvider } from '@/lib/i18n';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import AsciiSmoke from '@/components/AsciiSmoke';
import HomePage from '@/pages/HomePage';
import TheGamePage from '@/pages/TheGamePage';
import GameModesPage from '@/pages/GameModesPage';
import ArsenalPage from '@/pages/ArsenalPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import { NewsListPage, NewsDetailPage } from '@/pages/NewsPage';
import PressPage from '@/pages/PressPage';
import FAQPage from '@/pages/FAQPage';
import { ImpressumPage, DatenschutzPage } from '@/pages/LegalPages';

// The web AR quest (three.js) loads as its own chunk, so the landing page bundle does not grow.
const BreachPage = lazy(() => import('@/pages/BreachPage'));
const BreachLinkedPage = lazy(() => import('@/pages/BreachLinkedPage'));

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <I18nProvider>
        <div className="min-h-screen bg-bg text-bone flex flex-col">
          <Navbar />
          <ScrollToTop />
          <div className="page-atmosphere" aria-hidden="true" />
          <AsciiSmoke />
          <main className="flex-1 relative z-[1]">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/game" element={<TheGamePage />} />
              <Route path="/modes" element={<GameModesPage />} />
              <Route path="/arsenal" element={<ArsenalPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/news" element={<NewsListPage />} />
              <Route path="/news/:slug" element={<NewsDetailPage />} />
              <Route path="/press" element={<PressPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/impressum" element={<ImpressumPage />} />
              <Route path="/datenschutz" element={<DatenschutzPage />} />
              <Route path="/breach" element={<Suspense fallback={<Loading />}><BreachPage /></Suspense>} />
              <Route path="/breach/linked" element={<Suspense fallback={<Loading />}><BreachLinkedPage /></Suspense>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </I18nProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="pt-28 pb-24 text-center text-bone-muted font-body px-4">
      <p className="font-heading text-3xl uppercase text-bone mb-3">404</p>
      <p>Page not found. / Seite nicht gefunden.</p>
      <Link to="/" className="text-blood mt-4 inline-block font-heading text-sm uppercase">Home</Link>
    </div>
  );
}

function Loading() {
  return <div className="pt-40 pb-24 text-center text-bone-muted font-heading uppercase tracking-wider text-sm">Loading…</div>;
}
