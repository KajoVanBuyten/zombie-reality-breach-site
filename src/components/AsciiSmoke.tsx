import { useEffect, useRef } from 'react';

/**
 * Full-page background layer: a grid of faint code characters whose brightness follows a slowly
 * drifting noise field, like smoke or water. A click on an empty part of the page (not on text,
 * images, cards, buttons or other UI) drops red "ink" into it: a soft, wobbling round or heart-shaped
 * blot whose contours spread outwards like a drop of paint in water.
 * Purely local rendering: no network requests, nothing stored.
 */

const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CELL_W = 9;
const CELL_H = 15;
const FONT = '12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const FRAME_MS = 1000 / 30;

const SMOKE_RGB = '154, 148, 138'; // bone-muted
const SMOKE_MAX_ALPHA = 0.32;
const RIPPLE_RGB = '230, 36, 46';

const RIPPLE_REACH = 360; // px the ink front travels in the end (it slows down like ink in water)
const RIPPLE_TAU = 1.8; // seconds; time constant of that slowing
const RIPPLE_LIFE = 6.5; // seconds
const RIPPLE_EDGE = 18; // px, soft edge of the front at the start; it widens as the blot spreads
const MAX_RIPPLES = 24;

// Performance guard: if the effect costs too much on this device, it switches itself off and the
// page falls back to the plain black background. Nothing is stored; every visit measures anew.
const PERF_WARMUP_FRAMES = 15; // first frames (glyph setup, JIT) are not judged
const PERF_MAX_DRAW_MS = 9; // average cost of one effect frame; above this the device is struggling
const PERF_MAX_FRAME_MS = 70; // average time between frames while visible (~14 fps) ...
const PERF_SLOW_FRAME_DRAW_MS = 4; // ... counts only if the effect itself takes a noticeable share
const HEADER_FADE = 36; // px below the navigation bar over which the characters fade in

interface Ripple {
  x: number;
  y: number;
  start: number;
  heart: boolean;
  seed: number;
}

// ---- smooth value noise ---------------------------------------------------------------------

const PERM = new Uint8Array(512);
{
  const p = Array.from({ length: 256 }, (_, i) => i);
  let seed = 1337;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}

function hash(ix: number, iy: number): number {
  return PERM[(PERM[ix & 255] + iy) & 511] / 255;
}

function noise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

/** Domain-warped two-octave noise in 0..1, drifting with time. */
function smoke(x: number, y: number, t: number): number {
  const wx = noise(x * 0.6 + t * 0.05, y * 0.6 - t * 0.03) * 2.2;
  const wy = noise(x * 0.6 - t * 0.04 + 7.3, y * 0.6 + t * 0.06 + 2.1) * 2.2;
  const n = noise(x + wx + t * 0.08, y + wy - t * 0.05) * 0.7 + noise(x * 2.1 - wy, y * 2.1 + wx + t * 0.1) * 0.3;
  return n;
}

// ---- heart outline as radius per angle around its visual centre ------------------------------

const HEART_BINS = 360;
const HEART_RADIUS = (() => {
  const r = new Float32Array(HEART_BINS);
  const cy = -2.5; // visual centre of the classic parametric heart (y up)
  for (let i = 0; i < 4000; i++) {
    const t = (i / 4000) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) - cy;
    const a = Math.atan2(y, x);
    const bin = Math.floor(((a + Math.PI) / (Math.PI * 2)) * HEART_BINS) % HEART_BINS;
    r[bin] = Math.max(r[bin], Math.hypot(x, y));
  }
  let mean = 0;
  for (let i = 0; i < HEART_BINS; i++) mean += r[i];
  mean /= HEART_BINS;
  for (let i = 0; i < HEART_BINS; i++) r[i] /= mean;
  return r;
})();

/** Distance from the ripple origin, scaled so that a heart-shaped ring reads like a circle of that radius. */
function heartDistance(dx: number, dy: number): number {
  const a = Math.atan2(-dy, dx); // screen y points down, the heart is defined y up
  const bin = Math.floor(((a + Math.PI) / (Math.PI * 2)) * HEART_BINS) % HEART_BINS;
  return Math.hypot(dx, dy) / HEART_RADIUS[bin];
}

// ---- what counts as "empty background" -------------------------------------------------------

const UI_SELECTOR =
  'a, button, input, select, textarea, label, summary, details, img, picture, video, svg, canvas, iframe, header, nav, [role], [tabindex], [contenteditable]';

function hasOwnText(el: Element): boolean {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim()) return true;
  }
  return false;
}

function hasSurface(el: Element): boolean {
  const s = getComputedStyle(el);
  if (s.backgroundImage !== 'none') return true;
  const bg = s.backgroundColor;
  if (bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg)) return true;
  if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none' && el.tagName !== 'FOOTER') return true;
  return false;
}

/** True when the click landed on the page background rather than on content or UI. */
function isBackgroundClick(target: EventTarget | null, root: Element): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest(UI_SELECTOR)) return false;
  if (hasOwnText(target)) return false;
  for (let el: Element | null = target; el && el !== root && el !== document.body; el = el.parentElement) {
    if (el.tagName === 'FOOTER') continue; // the footer itself is page background with a top border
    if (hasSurface(el)) return false;
  }
  // A sibling picture behind the click (e.g. a key-art backdrop) also counts as content.
  const stack = document.elementsFromPoint(lastClick.x, lastClick.y);
  for (const el of stack) {
    if (el === root || el === document.body) break;
    if (el.tagName === 'IMG' || el.tagName === 'PICTURE' || el.tagName === 'VIDEO') return false;
  }
  return true;
}

const lastClick = { x: 0, y: 0 };

// ---- component -------------------------------------------------------------------------------

export default function AsciiSmoke() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const root = canvas.parentElement ?? document.body;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let dpr = 1;
    let cols = 0;
    let rows = 0;
    let glyphs = new Uint8Array(0);
    const atlas = document.createElement('canvas');
    // Full-resolution layers with every character drawn once (grey and red); only changed cells are redrawn.
    const greyLayer = document.createElement('canvas');
    const redLayer = document.createElement('canvas');
    const scratch = document.createElement('canvas');
    // One pixel per cell: alpha = brightness of that cell. Scaled up with smoothing as a mask.
    const smokeMask = document.createElement('canvas');
    const rippleMask = document.createElement('canvas');
    let smokeData: ImageData | null = null;
    let rippleData: ImageData | null = null;

    const buildAtlas = () => {
      atlas.width = Math.ceil(CHARS.length * CELL_W * dpr);
      atlas.height = Math.ceil(CELL_H * 2 * dpr);
      const a = atlas.getContext('2d');
      if (!a) return;
      a.setTransform(dpr, 0, 0, dpr, 0, 0);
      a.clearRect(0, 0, atlas.width, atlas.height);
      a.font = FONT;
      a.textAlign = 'center';
      a.textBaseline = 'middle';
      for (let i = 0; i < CHARS.length; i++) {
        a.fillStyle = `rgb(${SMOKE_RGB})`;
        a.fillText(CHARS[i], i * CELL_W + CELL_W / 2, CELL_H / 2);
        a.fillStyle = `rgb(${RIPPLE_RGB})`;
        a.fillText(CHARS[i], i * CELL_W + CELL_W / 2, CELL_H * 1.5);
      }
    };

    const drawCell = (idx: number) => {
      const gw = CELL_W * dpr;
      const gh = CELL_H * dpr;
      const x = (idx % cols) * gw;
      const y = Math.floor(idx / cols) * gh;
      const sx = glyphs[idx] * gw;
      const g = greyLayer.getContext('2d');
      const r = redLayer.getContext('2d');
      if (!g || !r) return;
      g.clearRect(x, y, gw, gh);
      g.drawImage(atlas, sx, 0, gw, gh, x, y, gw, gh);
      r.clearRect(x, y, gw, gh);
      r.drawImage(atlas, sx, gh, gw, gh, x, y, gw, gh);
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.ceil(w * dpr);
      canvas.height = Math.ceil(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      cols = Math.ceil(w / CELL_W);
      rows = Math.ceil(h / CELL_H);
      for (const layer of [greyLayer, redLayer, scratch]) {
        layer.width = Math.ceil(cols * CELL_W * dpr);
        layer.height = Math.ceil(rows * CELL_H * dpr);
      }
      smokeMask.width = rippleMask.width = cols;
      smokeMask.height = rippleMask.height = rows;
      smokeData = smokeMask.getContext('2d')?.createImageData(cols, rows) ?? null;
      rippleData = rippleMask.getContext('2d')?.createImageData(cols, rows) ?? null;
      glyphs = new Uint8Array(cols * rows);
      for (let i = 0; i < glyphs.length; i++) glyphs[i] = Math.floor(Math.random() * CHARS.length);
      buildAtlas();
      for (let i = 0; i < glyphs.length; i++) drawCell(i);
    };

    const ripples: Ripple[] = [];
    let heartNext = Math.random() < 0.5;

    // Only a drag (text selection) cancels a drop; quick repeated clicks each drop new ink.
    const down = { x: 0, y: 0 };
    const onMouseDown = (e: MouseEvent) => {
      down.x = e.clientX;
      down.y = e.clientY;
      lastClick.x = e.clientX;
      lastClick.y = e.clientY;
      // Double and triple clicks on the background must not select nearby text.
      if (e.detail > 1 && isBackgroundClick(e.target, root)) e.preventDefault();
    };

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      lastClick.x = e.clientX;
      lastClick.y = e.clientY;
      if (!isBackgroundClick(e.target, root)) return;
      ripples.push({ x: e.clientX, y: e.clientY, start: performance.now() / 1000, heart: heartNext, seed: Math.random() * 100 });
      heartNext = Math.random() < 0.5;
      if (ripples.length > MAX_RIPPLES) ripples.shift();
    };

    /** Composite a glyph layer through a per-cell mask onto the visible canvas. */
    const composite = (layer: HTMLCanvasElement, mask: HTMLCanvasElement) => {
      const s = scratch.getContext('2d');
      if (!s) return;
      s.globalCompositeOperation = 'copy';
      s.drawImage(layer, 0, 0);
      s.globalCompositeOperation = 'destination-in';
      s.imageSmoothingEnabled = true;
      s.drawImage(mask, 0, 0, scratch.width, scratch.height);
      s.globalCompositeOperation = 'source-over';
      ctx.drawImage(scratch, 0, 0);
    };

    const draw = (nowMs: number) => {
      if (!smokeData || !rippleData) return;
      const now = nowMs / 1000;
      const t = reduceMotion.matches ? 0 : now;
      while (ripples.length && now - ripples[0].start > RIPPLE_LIFE) ripples.shift();

      // A few characters change every frame, like the terminal effect.
      if (!reduceMotion.matches) {
        const changes = Math.ceil(glyphs.length * 0.006);
        for (let i = 0; i < changes; i++) {
          const idx = Math.floor(Math.random() * glyphs.length);
          glyphs[idx] = Math.floor(Math.random() * CHARS.length);
          drawCell(idx);
        }
      }

      const active = ripples.map((r) => {
        const age = now - r.start;
        const life = age / RIPPLE_LIFE;
        return {
          r,
          age,
          radius: RIPPLE_REACH * (1 - Math.exp(-age / RIPPLE_TAU)) + 6,
          edge: RIPPLE_EDGE + age * 14,
          wobble: 0.12 + 0.09 * Math.min(age, 3), // the outline gets more ragged as the ink spreads
          fade: Math.pow(1 - life, 1.4) * Math.min(1, age * 5),
        };
      });

      const sd = smokeData.data;
      const rd = rippleData.data;
      for (let row = 0; row < rows; row++) {
        const py = row * CELL_H + CELL_H / 2;
        const ny = py / 260;
        for (let col = 0; col < cols; col++) {
          const px = col * CELL_W + CELL_W / 2;
          const o = (row * cols + col) * 4 + 3;

          let wave = 0;
          for (const a of active) {
            const dx = px - a.r.x;
            const dy = py - a.r.y;
            if (Math.abs(dx) > a.radius * 1.8 + 120 || Math.abs(dy) > a.radius * 1.8 + 120) continue;
            const ang = Math.atan2(dy, dx);
            const ca = Math.cos(ang);
            const sa = Math.sin(ang);
            const base = a.r.heart ? heartDistance(dx, dy) : Math.hypot(dx, dy);
            // Ragged outline: coarse lobes plus finer tendrils that drift outwards with the distance.
            const n =
              (noise(ca * 1.4 + a.r.seed, sa * 1.4 + a.age * 0.35) - 0.5) * 0.75 +
              (noise(ca * 4 + a.r.seed * 2, sa * 4 + base / 90 - a.age * 0.4) - 0.5) * 0.35;
            const d = base * (1 + n * a.wobble * 2);
            const u = d / a.radius;
            const f = (d - a.radius) / a.edge;
            let ink = Math.exp(-f * f) * 0.95; // blurred front
            if (u < 1) {
              // A few broad contour bands travelling outwards, wider apart towards the edge.
              const band = Math.pow(0.5 + 0.5 * Math.cos((Math.sqrt(u) * 3.2 - a.age * 0.55) * Math.PI * 2), 2.5);
              ink = Math.max(ink, (0.1 + 0.5 * band) * (0.4 + 0.6 * u));
            }
            wave += ink * a.fade;
          }
          rd[o] = Math.min(1, wave) * 0.9 * 255;

          const s = smoke(px / 260, ny, t);
          // Shape the field into soft bands: mostly dark, brighter ridges drifting through.
          const v = Math.max(0, (s - 0.36) / 0.64);
          sd[o] = (0.035 + Math.pow(v, 1.6) * SMOKE_MAX_ALPHA) * (1 - Math.min(1, wave) * 0.6) * 255;
        }
      }
      smokeMask.getContext('2d')?.putImageData(smokeData, 0, 0);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      composite(greyLayer, smokeMask);
      if (active.length) {
        rippleMask.getContext('2d')?.putImageData(rippleData, 0, 0);
        composite(redLayer, rippleMask);
      }

      // Keep the navigation bar clean: no characters behind it, a soft fade below it.
      const header = document.querySelector('header');
      const hb = header ? header.getBoundingClientRect().bottom : 0;
      if (hb > 0) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, hb * dpr);
        const fade = ctx.createLinearGradient(0, hb * dpr, 0, (hb + HEADER_FADE) * dpr);
        fade.addColorStop(0, 'rgba(0,0,0,1)');
        fade.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fade;
        ctx.fillRect(0, hb * dpr, canvas.width, HEADER_FADE * dpr);
        ctx.globalCompositeOperation = 'source-over';
      }
    };

    let raf = 0;
    let last = 0;
    let needsStill = false; // one more still frame after the last ripple when motion is reduced
    let stopped = false;
    let frames = 0;
    let drawAvg = 0;
    let frameAvg = FRAME_MS;
    let prevFrame = 0;

    const stop = () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
      canvas.dataset.fallback = 'performance';
    };

    /** Judge the device on a smoothed draw cost and frame interval; switch off when it struggles. */
    const measure = (nowMs: number, drawMs: number) => {
      const interval = prevFrame ? nowMs - prevFrame : FRAME_MS;
      prevFrame = nowMs;
      frames++;
      if (frames <= PERF_WARMUP_FRAMES) return;
      drawAvg += (drawMs - drawAvg) * 0.1;
      // Gaps over 200 ms come from throttling (hidden or covered window, debugger), not from this effect.
      if (interval < 200) frameAvg += (interval - frameAvg) * 0.1;
      if (frames < PERF_WARMUP_FRAMES + 20) return;
      if (drawAvg > PERF_MAX_DRAW_MS || (frameAvg > PERF_MAX_FRAME_MS && drawAvg > PERF_SLOW_FRAME_DRAW_MS)) stop();
    };

    // Hidden tabs get no frames; restart the interval measurement when the page comes back.
    const onVisibility = () => {
      prevFrame = 0;
    };

    const loop = (nowMs: number) => {
      if (stopped) return;
      raf = requestAnimationFrame(loop);
      if (nowMs - last < FRAME_MS) return;
      last = nowMs;
      if (reduceMotion.matches && ripples.length === 0 && !needsStill) return;
      needsStill = ripples.length > 0;
      const t0 = performance.now();
      draw(nowMs);
      if (!reduceMotion.matches) measure(nowMs, performance.now() - t0);
    };

    function onResize() {
      resize();
      draw(performance.now());
    }

    // Very weak devices or an explicit data-saver setting never start the effect.
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || nav.connection?.saveData) {
      stop();
      return;
    }

    resize();
    draw(performance.now());
    raf = requestAnimationFrame(loop);
    window.addEventListener('resize', onResize);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return <canvas ref={canvasRef} className="ascii-smoke" aria-hidden="true" />;
}
