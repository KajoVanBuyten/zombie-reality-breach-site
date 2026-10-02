import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

type Lang = 'en' | 'de';

interface I18nCtx {
  lang: Lang;
  t: (key: string) => string;
  toggle: () => void;
}

const translations: Record<string, Record<Lang, string>> = {
  'nav.home': { en: 'Home', de: 'Startseite' },
  'nav.game': { en: 'The Game', de: 'Das Spiel' },
  'nav.modes': { en: 'Game Modes', de: 'Spielmodi' },
  'nav.arsenal': { en: 'Arsenal', de: 'Arsenal' },
  'nav.leaderboard': { en: 'Leaderboard', de: 'Bestenliste' },
  'nav.news': { en: 'News', de: 'News' },
  'nav.press': { en: 'Press', de: 'Presse' },
  'nav.faq': { en: 'FAQ', de: 'FAQ' },
  'nav.join': { en: 'Meta Quest', de: 'Meta Quest' },
  'hero.tagline': { en: 'Your room. Their breach.', de: 'Dein Raum. Ihr Durchbruch.' },
  'hero.sub': { en: 'Mixed Reality & VR · Meta Quest 3 / 3S · Solo & Co-op', de: 'Mixed Reality & VR · Meta Quest 3 / 3S · Solo & Co-op' },
  'hero.coming': { en: 'Coming soon to Meta Quest 3 and 3S', de: 'Bald für Meta Quest 3 und 3S' },
  'hero.ea': { en: 'Early Access planned', de: 'Early Access geplant' },
  'hero.cta': { en: 'View on Meta Quest', de: 'Auf Meta Quest ansehen' },
  'hero.trailer': { en: 'Trailer coming soon', de: 'Trailer folgt' },
  'pitch.1.title': { en: 'Your room is the level.', de: 'Dein Raum ist das Level.' },
  'pitch.1.text': { en: 'In Reality Breach the game reads your room scan. Zombies smash through your real doors and walls.', de: 'In Reality Breach liest das Spiel deinen Raumscan. Zombies brechen durch deine echten Türen und Wände.' },
  'pitch.2.title': { en: 'Real weapons, real hands.', de: 'Echte Waffen, echte Hände.' },
  'pitch.2.text': { en: 'Draw from your belt, rack the slide, swap magazines by hand, swing a bat. No button reloads.', de: 'Zieh vom Gürtel, lade durch, wechsle Magazine per Hand, schwing den Schläger. Kein Nachladen per Knopfdruck.' },
  'pitch.3.title': { en: 'Survive together.', de: 'Gemeinsam überleben.' },
  'pitch.3.text': { en: 'Co-op for up to four players in Reality Breach and Rift, up to three on the car roofs in Rooftop. Local or online.', de: 'Co-op für bis zu vier Spieler in Reality Breach und Rift, bis zu drei auf den Autodächern in Rooftop. Lokal oder online.' },
  'home.modes': { en: 'Three ways to survive', de: 'Drei Arten zu überleben' },
  'home.top5': { en: 'Global Leaderboards', de: 'Globale Bestenlisten' },
  'home.viewAll': { en: 'All boards', de: 'Alle Bestenlisten' },
  'home.latestNews': { en: 'Latest Transmissions', de: 'Letzte Übertragungen' },
  'home.allNews': { en: 'All News', de: 'Alle News' },
  'home.free.title': { en: 'Free to start', de: 'Kostenlos anfangen' },
  'home.free.text': { en: 'Play each of the three mode families for 90 minutes for free. Then buy the modes you want, or the complete pack. No loot boxes.', de: 'Spiele jede der drei Modusfamilien 90 Minuten kostenlos. Danach kaufst du die Modi, die du willst, oder das Komplettpaket. Keine Lootboxen.' },
  'home.cta.title': { en: 'Coming soon to Meta Quest 3 and 3S.', de: 'Bald für Meta Quest 3 und 3S.' },
  'loop.scan': { en: 'Scan room', de: 'Raum scannen' },
  'loop.confirm': { en: 'Confirm breach points', de: 'Durchbrüche bestätigen' },
  'loop.wave': { en: 'Wave', de: 'Welle' },
  'loop.break': { en: 'Break & Shop', de: 'Pause & Shop' },
  'loop.next': { en: 'Next wave', de: 'Nächste Welle' },
  'loop.death': { en: 'Death', de: 'Tod' },
  'loop.score': { en: 'Score', de: 'Punkte' },
  'leaderboard.title': { en: 'Leaderboard', de: 'Bestenliste' },
  'leaderboard.easy': { en: 'Easy', de: 'Leicht' },
  'leaderboard.hard': { en: 'Hard', de: 'Schwer' },
  'leaderboard.solo': { en: 'Solo', de: 'Solo' },
  'leaderboard.coop': { en: 'Co-op', de: 'Co-op' },
  'leaderboard.realityBreach': { en: 'Reality Breach', de: 'Reality Breach' },
  'leaderboard.rift': { en: 'Rift', de: 'Rift' },
  'leaderboard.rooftop': { en: 'Rooftop', de: 'Rooftop' },
  'leaderboard.safeZone': { en: 'Safe Zone', de: 'Safe Zone' },
  'leaderboard.gasStation': { en: 'Gas Station', de: 'Gas Station' },
  'leaderboard.closed.title': { en: 'Global leaderboards open at launch', de: 'Globale Bestenlisten starten zum Release' },
  'leaderboard.closed.text': { en: 'There are no public scores yet. When the game launches, these boards open here, each split by difficulty and by solo or co-op.', de: 'Es gibt noch keine öffentlichen Punktestände. Zum Release des Spiels öffnen hier diese Bestenlisten, jeweils getrennt nach Schwierigkeit und nach Solo oder Co-op.' },
  'leaderboard.boards': { en: 'Boards at launch', de: 'Bestenlisten zum Release' },
  'leaderboard.privacy': { en: 'Which data the game uses for leaderboards is described in the game’s privacy policy.', de: 'Welche Daten das Spiel für Bestenlisten verwendet, steht in der Datenschutzerklärung des Spiels.' },
  'leaderboard.privacyLink': { en: 'Game privacy policy', de: 'Datenschutzerklärung des Spiels' },
  'news.title': { en: 'News & Updates', de: 'Neuigkeiten' },
  'news.roadmap': { en: 'Roadmap', de: 'Roadmap' },
  'press.title': { en: 'Press / Media Kit', de: 'Presse / Media Kit' },
  'press.factsheet': { en: 'Fact Sheet', de: 'Faktenblatt' },
  'press.downloads': { en: 'Downloads', de: 'Downloads' },
  'press.descriptions': { en: 'Descriptions', de: 'Beschreibungen' },
  'press.studio': { en: 'About the Studio', de: 'Über das Studio' },
  'press.terms': { en: 'Terms of Use', de: 'Nutzungsbedingungen' },
  'press.contact': { en: 'Press Contact', de: 'Pressekontakt' },
  'press.copied': { en: 'Copied!', de: 'Kopiert!' },
  'press.copy': { en: 'Copy', de: 'Kopieren' },
  'faq.title': { en: 'Frequently Asked Questions', de: 'Häufige Fragen' },
  'faq.statusTitle': { en: 'Release status', de: 'Release-Status' },
  'game.title': { en: 'The Game', de: 'Das Spiel' },
  'game.about': { en: 'About', de: 'Über das Spiel' },
  'game.features': { en: 'Features', de: 'Features' },
  'game.controls': { en: 'Controls', de: 'Steuerung' },
  'game.gear': { en: 'Gear on your body', de: 'Ausrüstung am Körper' },
  'game.req': { en: 'Requirements', de: 'Voraussetzungen' },
  'game.modes': { en: 'Mode families', de: 'Modusfamilien' },
  'arsenal.title': { en: 'Arsenal', de: 'Arsenal' },
  'arsenal.mods': { en: 'Mods & items', de: 'Aufsätze & Gegenstände' },
  'arsenal.economy': { en: 'Shop & Armory', de: 'Shop & Arsenal' },
  'footer.trademark': { en: 'Meta Quest is a trademark of Meta Platforms, Inc.', de: 'Meta Quest ist eine Marke der Meta Platforms, Inc.' },
  'footer.impressum': { en: 'Legal Notice', de: 'Impressum' },
  'footer.privacy': { en: 'Privacy Policy', de: 'Datenschutz' },
  'footer.press': { en: 'Press', de: 'Presse' },
  'footer.contact': { en: 'Contact', de: 'Kontakt' },
  'footer.about': { en: 'Zombie Reality Breach by KaMa Studios. Zombie survival in mixed reality and VR for Meta Quest 3 and 3S. Coming soon.', de: 'Zombie Reality Breach von KaMa Studios. Zombie-Survival in Mixed Reality und VR für Meta Quest 3 und 3S. Bald verfügbar.' },
  'modes.title': { en: 'Game Modes', de: 'Spielmodi' },
  'modes.diff': { en: 'Difficulty in Reality Breach', de: 'Schwierigkeit in Reality Breach' },
  'modes.playable': { en: 'Playable in development', de: 'In Entwicklung spielbar' },
  'modes.inDev': { en: 'In development', de: 'In Entwicklung' },
  'modes.learnMore': { en: 'Learn more', de: 'Mehr erfahren' },
};

const I18nContext = createContext<I18nCtx>({
  lang: 'en',
  t: (k) => k,
  toggle: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const toggle = useCallback(() => setLang((l) => (l === 'en' ? 'de' : 'en')), []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const t = useCallback((key: string) => translations[key]?.[lang] ?? key, [lang]);
  return <I18nContext.Provider value={{ lang, t, toggle }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
