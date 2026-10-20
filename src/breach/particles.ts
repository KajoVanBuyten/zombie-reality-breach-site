// One pooled, additive point-sprite system for every spark, ember and burst of the quest: a single draw call.

import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial, Vector3 } from 'three';
import type { Scene } from 'three';

const MAX = 900;

const VERT = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vAlpha = aAlpha;
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * 900.0 / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c) * 4.0;
  if (d > 1.0) discard;
  float a = (1.0 - d) * vAlpha;
  gl_FragColor = vec4(vColor * a, a);
}`;

export interface BurstOptions {
  count: number;
  color: Color | number;
  speed: number;
  size: number;
  life: number;
  /** Main direction; without it the burst is spherical. */
  dir?: Vector3;
  spread?: number;
  gravity?: number;
}

const _c = new Color();
const _v = new Vector3();

export class Particles {
  private pos = new Float32Array(MAX * 3);
  private vel = new Float32Array(MAX * 3);
  private col = new Float32Array(MAX * 3);
  private size = new Float32Array(MAX);
  private alpha = new Float32Array(MAX);
  private life = new Float32Array(MAX);
  private maxLife = new Float32Array(MAX);
  private grav = new Float32Array(MAX);
  private baseSize = new Float32Array(MAX);
  private next = 0;
  private geometry = new BufferGeometry();
  readonly points: Points;

  constructor(scene: Scene) {
    this.geometry.setAttribute('position', new BufferAttribute(this.pos, 3));
    this.geometry.setAttribute('aColor', new BufferAttribute(this.col, 3));
    this.geometry.setAttribute('aSize', new BufferAttribute(this.size, 1));
    this.geometry.setAttribute('aAlpha', new BufferAttribute(this.alpha, 1));
    const material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.points = new Points(this.geometry, material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 20;
    scene.add(this.points);
  }

  emit(at: Vector3, o: BurstOptions): void {
    _c.set(o.color);
    for (let n = 0; n < o.count; n++) {
      const i = this.next;
      this.next = (this.next + 1) % MAX;
      if (o.dir) {
        const s = o.spread ?? 0.5;
        _v.set(o.dir.x + (Math.random() - 0.5) * s * 2, o.dir.y + (Math.random() - 0.5) * s * 2, o.dir.z + (Math.random() - 0.5) * s * 2).normalize();
      } else {
        _v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      }
      const speed = o.speed * (0.4 + Math.random() * 0.8);
      this.pos.set([at.x, at.y, at.z], i * 3);
      this.vel.set([_v.x * speed, _v.y * speed, _v.z * speed], i * 3);
      this.col.set([_c.r, _c.g, _c.b], i * 3);
      const life = o.life * (0.6 + Math.random() * 0.6);
      this.life[i] = life;
      this.maxLife[i] = life;
      this.grav[i] = o.gravity ?? 0;
      this.baseSize[i] = o.size * (0.6 + Math.random() * 0.8);
    }
  }

  update(dt: number): void {
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) {
        if (this.alpha[i] !== 0) {
          this.alpha[i] = 0;
          this.size[i] = 0;
        }
        continue;
      }
      this.life[i] -= dt;
      const k = i * 3;
      this.vel[k + 1] -= this.grav[i] * dt;
      this.vel[k] *= 0.985;
      this.vel[k + 2] *= 0.985;
      this.pos[k] += this.vel[k] * dt;
      this.pos[k + 1] += this.vel[k + 1] * dt;
      this.pos[k + 2] += this.vel[k + 2] * dt;
      const t = Math.max(0, this.life[i] / this.maxLife[i]);
      this.alpha[i] = t;
      this.size[i] = this.baseSize[i] * (0.5 + t * 0.5);
    }
    (this.geometry.attributes.position as BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.aColor as BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.aSize as BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.aAlpha as BufferAttribute).needsUpdate = true;
  }
}
