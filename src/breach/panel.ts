// Text panels inside the headset, drawn on a canvas texture (site colors and fonts). A panel can carry buttons that
// controllers or hands click with their pointing ray.

import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster, SRGBColorSpace, Vector3 } from 'three';
import type { Intersection } from 'three';

export interface PanelButton {
  id: string;
  label: string;
}

export interface PanelContent {
  title: string;
  lines: string[];
  /** Small line top right (timer). */
  corner?: string;
  accent?: 'blood' | 'gold' | 'ember';
  buttons?: PanelButton[];
}

const W = 1024;
const H = 512;
const COLORS = { blood: '#e0242e', gold: '#e8b33a', ember: '#ff6a1a' };

interface ButtonRect extends PanelButton {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Panel {
  readonly mesh: Mesh;
  private canvas = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  private texture: CanvasTexture;
  private key = '';
  private rects: ButtonRect[] = [];
  hovered: string | null = null;

  constructor(widthMeters = 0.62) {
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new CanvasTexture(this.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    const material = new MeshBasicMaterial({ map: this.texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    this.mesh = new Mesh(new PlaneGeometry(widthMeters, widthMeters * (H / W)), material);
    this.mesh.renderOrder = 30;
    this.mesh.visible = false;
  }

  /** Redraws only when the content (or hover state) changed. */
  show(content: PanelContent): void {
    this.mesh.visible = true;
    const key = JSON.stringify(content) + this.hovered;
    if (key === this.key) return;
    this.key = key;
    this.draw(content);
  }

  hide(): void {
    this.mesh.visible = false;
  }

  private draw(c: PanelContent): void {
    const g = this.ctx;
    const accent = COLORS[c.accent ?? 'blood'];
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(11, 11, 13, 0.86)';
    roundRect(g, 8, 8, W - 16, H - 16, 18);
    g.fill();
    g.strokeStyle = accent;
    g.lineWidth = 4;
    g.stroke();
    // Hazard stripe at the top, as on the site.
    g.save();
    g.beginPath();
    g.rect(8, 8, W - 16, 14);
    g.clip();
    for (let x = -40; x < W; x += 40) {
      g.fillStyle = accent;
      g.beginPath();
      g.moveTo(x, 8);
      g.lineTo(x + 20, 8);
      g.lineTo(x + 34, 22);
      g.lineTo(x + 14, 22);
      g.fill();
    }
    g.restore();

    g.fillStyle = accent;
    g.font = '64px "Black Ops One", system-ui, sans-serif';
    g.textBaseline = 'top';
    g.fillText(c.title.toUpperCase(), 44, 50, W - 260);
    if (c.corner) {
      g.fillStyle = '#eee6d8';
      g.font = '44px "Black Ops One", system-ui, sans-serif';
      g.textAlign = 'right';
      g.fillText(c.corner, W - 44, 60);
      g.textAlign = 'left';
    }
    g.fillStyle = '#eee6d8';
    // Smaller text when buttons take the bottom of the panel.
    const hasButtons = Boolean(c.buttons?.length);
    const size = hasButtons ? 32 : 38;
    g.font = `${size}px Oswald, system-ui, sans-serif`;
    let y = 140;
    for (const line of c.lines) {
      for (const wrapped of wrap(g, line, W - 88)) {
        g.fillText(wrapped, 44, y);
        y += size * 1.3;
      }
      y += size * 0.3;
    }

    this.rects = [];
    const buttons = c.buttons ?? [];
    if (buttons.length) {
      const bw = (W - 88 - (buttons.length - 1) * 24) / buttons.length;
      const bh = 88;
      const by = H - bh - 40;
      buttons.forEach((b, i) => {
        const bx = 44 + i * (bw + 24);
        const hover = this.hovered === b.id;
        g.fillStyle = hover ? '#eee6d8' : accent;
        roundRect(g, bx, by, bw, bh, 10);
        g.fill();
        g.fillStyle = '#0b0b0d';
        g.font = '40px "Black Ops One", system-ui, sans-serif';
        g.textAlign = 'center';
        g.fillText(b.label.toUpperCase(), bx + bw / 2, by + 24, bw - 24);
        g.textAlign = 'left';
        this.rects.push({ ...b, x: bx, y: by, w: bw, h: bh });
      });
    }
    this.texture.needsUpdate = true;
  }

  /** The button under a ray, if any. */
  pick(raycaster: Raycaster): string | null {
    if (!this.mesh.visible || !this.rects.length) return null;
    const hits: Intersection[] = raycaster.intersectObject(this.mesh, false);
    const uv = hits[0]?.uv;
    if (!uv) return null;
    const x = uv.x * W;
    const y = (1 - uv.y) * H;
    return this.rects.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)?.id ?? null;
  }

  /** Places the panel `distance` in front of the head, slightly below eye level, facing the viewer. */
  placeInFront(head: Vector3, forward: Vector3, distance: number, drop: number, smooth = 1): void {
    const target = _t.copy(forward).setY(0);
    if (target.lengthSq() < 1e-4) target.set(0, 0, -1);
    target.normalize().multiplyScalar(distance).add(head);
    target.y -= drop;
    this.mesh.position.lerp(target, smooth);
    this.mesh.lookAt(head);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as MeshBasicMaterial).dispose();
    this.texture.dispose();
  }
}

const _t = new Vector3();

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function wrap(g: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(' ');
  const out: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > max && line) {
      out.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out;
}
