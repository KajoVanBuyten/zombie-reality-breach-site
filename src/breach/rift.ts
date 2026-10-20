// A glowing rift torn into a real wall. Three parts share one crack shape (GLSL function crack()):
// - an occluder over the whole wall that writes depth only and leaves the crack open, so virtual things behind the wall
//   (the rift's void, zombies crawling out) are only visible through the crack, as if the wall were really torn;
// - the void: a dark, swirling box behind the wall;
// - the glow: an additive plane on the wall with the hot crack edge and thin cracks radiating outwards.

import { AdditiveBlending, BackSide, BoxGeometry, Group, Matrix4, Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector3 } from 'three';
import type { Scene } from 'three';
import type { Surface } from './room';

const CRACK = /* glsl */ `
uniform float uOpen;
uniform float uSeed;
uniform vec2 uSize;
float hash(float n) { return fract(sin(n) * 43758.5453); }
float noise(float x) { float i = floor(x); float f = fract(x); return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f)); }
// > 0 inside the opening (metres to the edge), < 0 outside.
float crack(vec2 p) {
  float h = uSize.y * 0.5;
  float ny = clamp(p.y / h, -1.0, 1.0);
  float profile = sqrt(max(0.0, 1.0 - pow(abs(ny), 2.6)));
  float x0 = 0.07 * sin(p.y * 6.0 + uSeed) + 0.035 * sin(p.y * 17.0 + uSeed * 2.0);
  float jag = 0.7 + 0.3 * noise(p.y * 13.0 + uSeed * 5.0) + 0.12 * noise(p.y * 41.0 + uSeed);
  float w = uSize.x * 0.5 * profile * jag * uOpen;
  float inside = w - abs(p.x - x0);
  if (abs(p.y) > h * min(1.0, uOpen * 1.6 + 0.05)) inside = min(inside, -0.01);
  return inside;
}`;

const LOCAL_VERT = /* glsl */ `
varying vec2 vLocal;
void main() {
  vLocal = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const OCCLUDER_FRAG = /* glsl */ `
${CRACK}
varying vec2 vLocal;
void main() {
  if (crack(vLocal) > 0.0) discard;
  gl_FragColor = vec4(0.0);
}`;

const GLOW_FRAG = /* glsl */ `
${CRACK}
uniform float uTime;
uniform float uHeat;
varying vec2 vLocal;
void main() {
  float d = crack(vLocal);
  float flicker = 0.8 + 0.2 * sin(uTime * 9.0 + vLocal.y * 12.0) * noise(uTime * 3.0 + vLocal.y * 5.0);
  // Hot rim at the edge of the opening.
  float rim = exp(-abs(d) * 38.0) * step(-0.12, d);
  float glow = exp(-max(0.0, -d) * 9.0) * step(d, 0.0) * 0.35;
  // Thin cracks radiating outwards, growing with the opening.
  float veins = 0.0;
  vec2 p = vLocal;
  float r = length(p);
  for (int k = 0; k < 7; k++) {
    float fk = float(k);
    float a = fk * 0.9 + uSeed + 0.3 * sin(r * 7.0 + fk);
    vec2 dir = vec2(cos(a), sin(a));
    float along = dot(p, dir);
    float across = abs(dot(p, vec2(-dir.y, dir.x)) + 0.03 * sin(along * 23.0 + fk));
    float len = (0.35 + 0.5 * hash(fk + uSeed)) * uOpen * (uSize.y * 0.6);
    float fade = smoothstep(len, 0.0, along) * step(0.0, along);
    veins += exp(-across * 260.0) * fade;
  }
  veins *= step(d, 0.0);
  vec3 hot = vec3(1.0, 0.85, 0.55);
  vec3 ember = vec3(1.0, 0.32, 0.05);
  vec3 col = mix(ember, hot, rim) * (rim * 2.2 + glow + veins * 0.9) * flicker * uHeat;
  float a = clamp(rim + glow + veins, 0.0, 1.0);
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}`;

const VOID_VERT = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const VOID_FRAG = /* glsl */ `
uniform float uTime;
uniform float uDepth;
uniform float uHeat;
varying vec3 vPos;
float h2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float n2(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  float depth = clamp(-vPos.z / uDepth, 0.0, 1.0);
  vec2 q = vPos.xy * 3.0 + vec2(uTime * 0.15, -uTime * 0.35);
  float swirl = n2(q) * 0.6 + n2(q * 2.3 + uTime * 0.2) * 0.4;
  vec3 deep = vec3(0.02, 0.0, 0.01);
  vec3 lava = vec3(0.55, 0.06, 0.02);
  vec3 col = mix(lava * (0.4 + swirl), deep, depth) * uHeat;
  gl_FragColor = vec4(col, 1.0);
}`;

export interface RiftOptions {
  width: number;
  height: number;
  seed: number;
}

const _m = new Matrix4();
const _v = new Vector3();

export class Rift {
  readonly group = new Group();
  readonly right = new Vector3();
  readonly up = new Vector3();
  readonly normal = new Vector3();
  readonly center = new Vector3();
  open = 0;
  targetOpen = 0;
  openSpeed = 0.25;
  heat = 1;
  readonly width: number;
  readonly height: number;
  private glowMat: ShaderMaterial;
  private occMat: ShaderMaterial;
  private voidMat: ShaderMaterial;
  private shared: Record<string, { value: unknown }>;

  /**
   * @param center  rift center on the wall (world)
   * @param normal  wall normal pointing into the room
   * @param wall    the real wall (for the occluder extents); null for a virtual fallback wall
   */
  constructor(scene: Scene, center: Vector3, normal: Vector3, wall: Surface | null, options: RiftOptions) {
    this.width = options.width;
    this.height = options.height;
    this.center.copy(center);
    this.normal.copy(normal).setY(0).normalize();
    this.up.set(0, 1, 0);
    this.right.crossVectors(this.up, this.normal).normalize();
    _m.makeBasis(this.right, this.up, this.normal).setPosition(center);
    this.group.matrixAutoUpdate = false;
    this.group.matrix.copy(_m);
    this.group.matrixWorldNeedsUpdate = true;

    this.shared = {
      uOpen: { value: 0 },
      uSeed: { value: options.seed },
      uSize: { value: new Vector2(options.width, options.height) },
    };

    // Occluder: the wall's extent in rift coordinates (or 4 x 3 m for a virtual wall).
    let minX = -2;
    let maxX = 2;
    let minY = -1.5;
    let maxY = 1.5;
    if (wall) {
      const ax = new Vector3().setFromMatrixColumn(wall.matrix, 0).normalize();
      const az = new Vector3().setFromMatrixColumn(wall.matrix, 2).normalize();
      minX = minY = Infinity;
      maxX = maxY = -Infinity;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          _v.copy(wall.center).addScaledVector(ax, sx * wall.halfX).addScaledVector(az, sz * wall.halfZ).sub(center);
          const x = _v.dot(this.right);
          const y = _v.dot(this.up);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
      minX -= 0.05;
      maxX += 0.05;
      minY -= 0.05;
      maxY += 0.05;
    }
    // The occluder always covers at least the rift and its cracks.
    minX = Math.min(minX, -options.width);
    maxX = Math.max(maxX, options.width);
    minY = Math.min(minY, -options.height * 0.6);
    maxY = Math.max(maxY, options.height * 0.6);
    const occGeo = new PlaneGeometry(maxX - minX, maxY - minY, 1, 1);
    occGeo.translate((minX + maxX) / 2, (minY + maxY) / 2, 0);
    this.occMat = new ShaderMaterial({ uniforms: { ...this.shared }, vertexShader: LOCAL_VERT, fragmentShader: OCCLUDER_FRAG, colorWrite: false });
    const occluder = new Mesh(occGeo, this.occMat);
    occluder.renderOrder = -10;
    occluder.frustumCulled = false;

    const depth = 1.4;
    const voidGeo = new BoxGeometry(options.width * 1.6, options.height * 1.15, depth);
    voidGeo.translate(0, 0, -depth / 2 - 0.01);
    this.voidMat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uDepth: { value: depth }, uHeat: { value: 1 } },
      vertexShader: VOID_VERT,
      fragmentShader: VOID_FRAG,
      side: BackSide,
    });
    const voidBox = new Mesh(voidGeo, this.voidMat);

    const glowGeo = new PlaneGeometry(options.width * 2.6, options.height * 1.5, 1, 1);
    glowGeo.translate(0, 0, 0.006);
    this.glowMat = new ShaderMaterial({
      uniforms: { ...this.shared, uTime: { value: 0 }, uHeat: { value: 1 } },
      vertexShader: LOCAL_VERT,
      fragmentShader: GLOW_FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const glow = new Mesh(glowGeo, this.glowMat);
    glow.renderOrder = 10;

    this.group.add(occluder, voidBox, glow);
    this.group.visible = false;
    scene.add(this.group);
  }

  /** World point at rift-local (x, y, z): x right, y up from the center, z out of the wall. */
  point(x: number, y: number, z: number, out = new Vector3()): Vector3 {
    return out.copy(this.center).addScaledVector(this.right, x).addScaledVector(this.up, y).addScaledVector(this.normal, z);
  }

  update(dt: number, time: number): void {
    const step = this.openSpeed * dt;
    this.open += Math.max(-step, Math.min(step, this.targetOpen - this.open));
    this.group.visible = this.open > 0.002;
    this.shared.uOpen.value = this.open;
    this.glowMat.uniforms.uTime.value = time;
    this.glowMat.uniforms.uHeat.value = this.heat;
    this.voidMat.uniforms.uTime.value = time;
    this.voidMat.uniforms.uHeat.value = Math.min(1.5, this.heat);
  }

  dispose(scene: Scene): void {
    scene.remove(this.group);
    this.group.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose();
        (o.material as ShaderMaterial).dispose();
      }
    });
  }
}
