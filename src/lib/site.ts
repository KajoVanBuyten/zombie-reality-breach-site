/** Central site constants. */

export const CONTACT_EMAIL = 'support@zombierealitybreach.com';

/** Meta Quest link (currently the existing Meta share link; replace with the Coming Soon store URL when it is live). */
export const META_URL = 'https://www.meta.com/s/67bQkabjj';

/** Privacy policy of the game itself (not of this website). */
export const GAME_PRIVACY_URL = 'https://kajovanbuyten.github.io/kamastudios-legal/zombie-reality-breach/privacy.html';

/** Base-relative URL for files in /public, so the site works at the domain root and under a sub path. */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

/* ------------------------------------------------------------------ */
/* Brand (public/assets/brand, see ASSETS.md)                          */
/* ------------------------------------------------------------------ */

/** Logo files for dark backgrounds. Never recolour, stretch or add glow; the light versions are separate files on purpose. */
export const brand = {
  logoOnDark: asset('assets/brand/zrb_logo_on_dark.svg'),
  logoOnLight: asset('assets/brand/zrb_logo_on_light.svg'),
  wordmarkOnDark: asset('assets/brand/zrb_wordmark_on_dark.svg'),
  wordmarkOnLight: asset('assets/brand/zrb_wordmark_on_light.svg'),
  skullOnDark: asset('assets/brand/zrb_skull_on_dark.svg'),
  skullOnLight: asset('assets/brand/zrb_skull_on_light.svg'),
  symbol: asset('assets/brand/zrb_symbol_512.png'),
};

/* ------------------------------------------------------------------ */
/* Key art (public/assets/keyart/<theme>/<kind>_<width>.webp|jpg)      */
/* ------------------------------------------------------------------ */

/** The five key-art themes from the store sets. */
export type KeyArtTheme = 'wall-breach' | 'daylight' | 'night-station' | 'dead-signal' | 'ash-city';

/** `clean` variants carry no logo and are meant for backgrounds with our own text on top. */
export type KeyArtKind =
  | 'hero'
  | 'cover'
  | 'banner'
  | 'banner-clean'
  | 'portrait'
  | 'portrait-clean'
  | 'square'
  | 'square-clean';

/** Available WebP widths per kind, largest first (matches scripts/Build-WebAssets.ps1). */
export const KEYART_WIDTHS: Record<KeyArtKind, readonly number[]> = {
  hero: [2560, 1920, 1280, 800],
  cover: [1920, 1280],
  banner: [2400, 1600],
  'banner-clean': [2100, 1400],
  portrait: [1008, 504],
  'portrait-clean': [1000, 500],
  square: [1080, 540],
  'square-clean': [1080, 540],
};

/** Width at which the JPG fallback exists per kind. */
export const KEYART_JPG_WIDTH: Record<KeyArtKind, number> = {
  hero: 1920,
  cover: 1920,
  banner: 1600,
  'banner-clean': 1400,
  portrait: 1008,
  'portrait-clean': 1000,
  square: 1080,
  'square-clean': 1080,
};

/** Aspect ratio (width / height) per kind, for `width`/`height` attributes. */
export const KEYART_RATIO: Record<KeyArtKind, number> = {
  hero: 16 / 9,
  cover: 16 / 9,
  banner: 10 / 3,
  'banner-clean': 3,
  portrait: 7 / 10,
  'portrait-clean': 7 / 10,
  square: 1,
  'square-clean': 1,
};

/** Which theme stands for which part of the site (see ASSETS.md). */
export const keyArtThemes = {
  realityBreach: 'wall-breach',
  rift: 'dead-signal',
  outbreak: 'night-station',
  game: 'ash-city',
  daylight: 'daylight',
} as const satisfies Record<string, KeyArtTheme>;

/** All five themes in store order, with the display name and the mode they stand for. */
export const keyArtGallery: { theme: KeyArtTheme; name: string; mode?: string }[] = [
  { theme: 'wall-breach', name: 'Wall Breach', mode: 'REALITY BREACH' },
  { theme: 'dead-signal', name: 'Dead Signal', mode: 'RIFT' },
  { theme: 'night-station', name: 'Night Station', mode: 'OUTBREAK' },
  { theme: 'ash-city', name: 'Ash City' },
  { theme: 'daylight', name: 'Daylight' },
];

export function keyArtWebp(theme: KeyArtTheme, kind: KeyArtKind, width: number): string {
  return asset(`assets/keyart/${theme}/${kind}_${width}.webp`);
}

export function keyArtJpg(theme: KeyArtTheme, kind: KeyArtKind): string {
  return asset(`assets/keyart/${theme}/${kind}_${KEYART_JPG_WIDTH[kind]}.jpg`);
}

/** `srcset` string over the given widths (default: every available width of that kind). */
export function keyArtSrcSet(theme: KeyArtTheme, kind: KeyArtKind, widths: readonly number[] = KEYART_WIDTHS[kind]): string {
  return widths.map((w) => `${keyArtWebp(theme, kind, w)} ${w}w`).join(', ');
}

/** Every variant of one theme, for places that want a plain URL. */
export function keyArtSet(theme: KeyArtTheme) {
  return {
    theme,
    hero: keyArtWebp(theme, 'hero', 1920),
    heroJpg: keyArtJpg(theme, 'hero'),
    cover: keyArtWebp(theme, 'cover', 1280),
    coverJpg: keyArtJpg(theme, 'cover'),
    banner: keyArtWebp(theme, 'banner', 1600),
    bannerJpg: keyArtJpg(theme, 'banner'),
    portrait: keyArtWebp(theme, 'portrait', 1008),
    portraitJpg: keyArtJpg(theme, 'portrait'),
    square: keyArtWebp(theme, 'square', 1080),
    squareJpg: keyArtJpg(theme, 'square'),
  };
}

/** Plain URLs (hero without lettering) for the places that used the old single images. */
export const img = {
  keyArt: keyArtWebp(keyArtThemes.game, 'hero', 1920),
  logoCity: keyArtWebp(keyArtThemes.daylight, 'hero', 1920),
  realityBreach: keyArtWebp(keyArtThemes.realityBreach, 'hero', 1280),
  rift: keyArtWebp(keyArtThemes.rift, 'hero', 1280),
  outbreak: keyArtWebp(keyArtThemes.outbreak, 'hero', 1280),
};
