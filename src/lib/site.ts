/** Central site constants. */

export const CONTACT_EMAIL = 'kontakt@kajo.tech';

/** Meta Quest link (currently the existing Meta share link; replace with the Coming Soon store URL when it is live). */
export const META_URL = 'https://www.meta.com/s/67bQkabjj';

/** Privacy policy of the game itself (not of this website). */
export const GAME_PRIVACY_URL = 'https://kajovanbuyten.github.io/kamastudios-legal/zombie-reality-breach/privacy.html';

/** Base-relative URL for files in /public, so the site works at the domain root and under a sub path. */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}

export const img = {
  keyArt: asset('assets/images/Reiseziel-Meta-Image.png'),
  logoCity: asset('assets/images/338b2348-16ab-410d-9e3e-dc5fc694f9ab.png'),
  ruins: asset('assets/images/07486ba7-ae5b-4fc0-a963-a926b00a1553.png'),
  sparks: asset('assets/images/b4139335-8c7e-4d24-bb23-35b84793b08e.png'),
  aerial: asset('assets/images/ca99e20b-79de-40b5-a10d-ea8cc8ae32ea.png'),
};
