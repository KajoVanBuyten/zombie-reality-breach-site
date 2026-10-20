import { useEffect, useState } from 'react';

/**
 * True once the browser reports immersive AR support (the Meta Quest browser), false everywhere else and while the
 * check is running. Kept free of three.js so the landing page can use it without loading the quest chunk.
 */
export function useImmersiveArSupported(): boolean {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    let alive = true;
    const xr = typeof navigator !== 'undefined' ? navigator.xr : undefined;
    xr?.isSessionSupported('immersive-ar')
      .then((ok) => {
        if (alive) setSupported(ok);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return supported;
}
