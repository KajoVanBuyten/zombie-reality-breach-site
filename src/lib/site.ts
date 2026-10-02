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

export const img = {
  // Key art from the store sets (Media/Store/Meta/Final_5_Themen), the versions without lettering.
  keyArt: asset('assets/images/hero_ashcity.jpg'),
  logoCity: asset('assets/images/bg_daylight.jpg'),
  realityBreach: asset('assets/images/mode_reality_breach.jpg'),
  rift: asset('assets/images/mode_rift.jpg'),
  outbreak: asset('assets/images/mode_outbreak.jpg'),
};
