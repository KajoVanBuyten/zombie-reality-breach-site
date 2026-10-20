// Stylized low-poly zombies built from primitives. Every body part type is one InstancedMesh, so the whole horde costs
// six draw calls: torso, head, arms, legs, glowing eyes and blob shadows. Zombies crawl out of a rift on all fours,
// rise, lurch towards the player, attack at arm's length and fall backwards when killed.

import {
  BoxGeometry,
  CanvasTexture,
  Color,
  DynamicDrawUsage,
  Euler,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three';
import type { BufferGeometry, Material, Scene } from 'three';
import type { Rift } from './rift';

const MAX_ZOMBIES = 10;
const MAX_HANDS = 6;
const CRAWL_PITCH = 1.15; // ~65 degrees forward while crawling out of the wall
const STAND_PITCH = 0.12;

type Phase = 'emerge' | 'rise' | 'walk' | 'attack' | 'stagger' | 'dying';

export interface Zombie {
  id: number;
  big: boolean;
  phase: Phase;
  t: number;
  pos: Vector3;
  yaw: number;
  pitch: number;
  scale: number;
  hp: number;
  speed: number;
  cycle: number;
  flash: number;
  groanIn: number;
  emergeDir: Vector3;
  emergeTo: number;
  emerged: number;
  skin: Color;
  shirt: Color;
  pants: Color;
  /** World centers for hit tests, refreshed every frame. */
  head: Vector3;
  chest: Vector3;
  hips: Vector3;
  base: Matrix4;
}

interface Hand {
  rift: Rift;
  x: number;
  y: number;
  t: number;
  life: number;
  roll: number;
}

export interface HordeEvents {
  groan(at: Vector3, big: boolean): void;
  attack(zombie: Zombie): void;
  died(zombie: Zombie): void;
}

export interface ZombieHit {
  zombie: Zombie;
  head: boolean;
  distance: number;
  point: Vector3;
}

const SKINS = [0x7d8f6a, 0x8a9a78, 0x6f7f63, 0x94a084, 0x7a8670];
const SHIRTS = [0x4a3b33, 0x3d4a5a, 0x5a2e2a, 0x6b6250, 0x2f3a33, 0x55505a];
const PANTS = [0x2b2d36, 0x3a3229, 0x2d3a4a, 0x262626];

const _m = new Matrix4();
const _part = new Matrix4();
const _q = new Quaternion();
const _e = new Euler();
const _v = new Vector3();
const _w = new Vector3();
const _s = new Vector3();
const _c = new Color();
const _skin = new Color();
const WHITE = new Color(0xffffff);

function blobTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

function instanced(geometry: BufferGeometry, material: Material, count: number, scene: Scene, colors: boolean): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  if (colors) mesh.setColorAt(0, WHITE);
  mesh.count = 0;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}

export class Horde {
  readonly zombies: Zombie[] = [];
  private hands: Hand[] = [];
  private nextId = 1;
  private torso: InstancedMesh;
  private headMesh: InstancedMesh;
  private arms: InstancedMesh;
  private legs: InstancedMesh;
  private eyes: InstancedMesh;
  private blobs: InstancedMesh;
  private target = new Vector3();
  floorY = 0;

  constructor(private scene: Scene, private events: HordeEvents) {
    const skinMat = new MeshLambertMaterial({ flatShading: true });
    this.torso = instanced(new BoxGeometry(0.4, 0.56, 0.24), skinMat, MAX_ZOMBIES, scene, true);
    this.headMesh = instanced(new IcosahedronGeometry(0.15, 0), skinMat, MAX_ZOMBIES, scene, true);
    const arm = new BoxGeometry(0.1, 0.62, 0.1);
    arm.translate(0, -0.31, 0);
    this.arms = instanced(arm, skinMat, MAX_ZOMBIES * 2 + MAX_HANDS, scene, true);
    const leg = new BoxGeometry(0.15, 0.84, 0.17);
    leg.translate(0, -0.42, 0);
    this.legs = instanced(leg, skinMat, MAX_ZOMBIES * 2, scene, true);
    this.eyes = instanced(new BoxGeometry(0.16, 0.035, 0.02), new MeshBasicMaterial({ color: 0xff5a1a, toneMapped: false }), MAX_ZOMBIES, scene, false);
    const blob = new PlaneGeometry(0.9, 0.9);
    blob.rotateX(-Math.PI / 2);
    this.blobs = instanced(blob, new MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false }), MAX_ZOMBIES, scene, false);
    this.blobs.renderOrder = 1;
  }

  get alive(): number {
    return this.zombies.filter((z) => z.phase !== 'dying').length;
  }

  get full(): boolean {
    return this.zombies.length >= MAX_ZOMBIES;
  }

  /** Spawns a zombie that crawls out of `rift` (x = sideways offset on the rift). */
  spawn(rift: Rift, options: { big?: boolean; x?: number } = {}): Zombie | null {
    if (this.full) return null;
    const big = Boolean(options.big);
    const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
    const start = rift.point(options.x ?? (Math.random() - 0.5) * rift.width * 0.3, 0, big ? -2.2 : -1.6);
    start.y = this.floorY;
    const z: Zombie = {
      id: this.nextId++,
      big,
      phase: 'emerge',
      t: 0,
      pos: start,
      yaw: Math.atan2(rift.normal.x, rift.normal.z),
      pitch: big ? 0.5 : CRAWL_PITCH,
      scale: big ? 1.45 : 0.92 + Math.random() * 0.14,
      hp: big ? 30 : 2,
      speed: big ? 0.38 : 0.42 + Math.random() * 0.22,
      cycle: Math.random() * 6,
      flash: 0,
      groanIn: 0.5 + Math.random() * 2,
      emergeDir: rift.normal.clone(),
      emergeTo: big ? 2.6 : 1.95,
      emerged: 0,
      skin: new Color(pick(SKINS)),
      shirt: new Color(pick(SHIRTS)),
      pants: new Color(pick(PANTS)),
      head: new Vector3(),
      chest: new Vector3(),
      hips: new Vector3(),
      base: new Matrix4(),
    };
    if (big) z.skin.set(0x6a7a58);
    this.zombies.push(z);
    return z;
  }

  /** Arms reaching through the crack (stage 1). */
  reach(rift: Rift, count: number): void {
    for (let i = 0; i < count && this.hands.length < MAX_HANDS; i++) {
      this.hands.push({
        rift,
        x: (Math.random() - 0.5) * rift.width * 0.35,
        y: (Math.random() - 0.3) * rift.height * 0.55,
        t: -i * 0.7,
        life: 3.5 + Math.random() * 2,
        roll: (Math.random() - 0.5) * 1.2,
      });
    }
  }

  get reaching(): boolean {
    return this.hands.length > 0;
  }

  /** Damage; returns true when the zombie dies. */
  damage(z: Zombie, amount: number): boolean {
    if (z.phase === 'dying') return false;
    z.hp -= amount;
    z.flash = 1;
    if (z.hp > 0) {
      // A hit makes a standing zombie flinch.
      if (z.phase === 'walk' && !z.big) z.cycle += 1.5;
      return false;
    }
    z.phase = 'dying';
    z.t = 0;
    this.events.died(z);
    return true;
  }

  /** Lets every zombie collapse (end of the hunt). */
  killAll(): void {
    for (const z of this.zombies) if (z.phase !== 'dying') this.damage(z, 999);
  }

  raycast(origin: Vector3, dir: Vector3, maxDistance: number): ZombieHit | null {
    let best: ZombieHit | null = null;
    for (const z of this.zombies) {
      if (z.phase === 'dying') continue;
      const s = z.scale;
      const tests: [Vector3, number, boolean][] = [
        [z.head, 0.16 * s, true],
        [z.chest, 0.26 * s, false],
        [z.hips, 0.22 * s, false],
      ];
      for (const [center, radius, head] of tests) {
        const d = raySphere(origin, dir, center, radius);
        if (d !== null && d <= maxDistance && (!best || d < best.distance)) {
          best = { zombie: z, head, distance: d, point: origin.clone().addScaledVector(dir, d) };
        }
      }
    }
    return best;
  }

  update(dt: number, player: Vector3): void {
    this.target.set(player.x, this.floorY, player.z);
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      z.t += dt;
      z.flash = Math.max(0, z.flash - dt * 6);
      if (this.step(z, dt)) this.zombies.splice(i, 1);
    }
    // Keep a little distance between zombies.
    for (const a of this.zombies) {
      for (const b of this.zombies) {
        if (a === b || a.phase === 'dying' || b.phase === 'dying' || a.phase === 'emerge' || b.phase === 'emerge') continue;
        _v.subVectors(a.pos, b.pos).setY(0);
        const d = _v.length();
        const min = 0.45 * (a.scale + b.scale) * 0.5;
        if (d > 0.001 && d < min) a.pos.addScaledVector(_v.divideScalar(d), (min - d) * 0.5);
      }
    }
    for (let i = this.hands.length - 1; i >= 0; i--) {
      const h = this.hands[i];
      h.t += dt;
      if (h.t > h.life) this.hands.splice(i, 1);
    }
    this.write();
  }

  /** Advances one zombie; returns true when it should be removed. */
  private step(z: Zombie, dt: number): boolean {
    switch (z.phase) {
      case 'emerge': {
        const move = z.speed * (z.big ? 1.1 : 1.3) * dt;
        z.pos.addScaledVector(z.emergeDir, move);
        z.emerged += move;
        z.cycle += dt * 6;
        if (z.emerged >= z.emergeTo) {
          z.phase = 'rise';
          z.t = 0;
          this.events.groan(z.pos, z.big);
        }
        break;
      }
      case 'rise':
        z.pitch += (STAND_PITCH - z.pitch) * Math.min(1, dt * 4);
        if (z.t > 0.8) {
          z.phase = 'walk';
          z.t = 0;
        }
        break;
      case 'walk': {
        _v.subVectors(this.target, z.pos).setY(0);
        const d = _v.length();
        const yaw = Math.atan2(_v.x, _v.z);
        z.yaw += wrapAngle(yaw - z.yaw) * Math.min(1, dt * 3);
        z.pitch = STAND_PITCH;
        const reach = 0.55 * z.scale;
        if (d < reach) {
          z.phase = 'attack';
          z.t = 0;
          break;
        }
        z.cycle += dt * (z.big ? 4 : 5.5);
        const lurch = 0.65 + 0.35 * Math.max(0, Math.sin(z.cycle));
        z.pos.addScaledVector(_v.divideScalar(d), Math.min(d - reach * 0.9, z.speed * lurch * dt));
        break;
      }
      case 'attack':
        z.cycle += dt * 10;
        if (z.t > 0.9) {
          this.events.attack(z);
          z.phase = 'stagger';
          z.t = 0;
        }
        break;
      case 'stagger': {
        // Pushed back after an attack so the player gets room again.
        _v.subVectors(z.pos, this.target).setY(0).normalize();
        z.pos.addScaledVector(_v, dt * (z.big ? 1.2 : 1.8) * Math.max(0, 1 - z.t / 0.6));
        if (z.t > 0.7) {
          z.phase = 'walk';
          z.t = 0;
        }
        break;
      }
      case 'dying':
        z.pitch = Math.max(-1.5, z.pitch - dt * 4);
        if (z.t > 1.4) return true;
        break;
    }
    if (z.phase !== 'dying' && z.phase !== 'emerge') {
      z.groanIn -= dt;
      if (z.groanIn <= 0) {
        z.groanIn = 3 + Math.random() * 4;
        this.events.groan(z.head, z.big);
      }
    }
    return false;
  }

  private write(): void {
    let nz = 0;
    let na = 0;
    let nl = 0;
    for (const z of this.zombies) {
      const sink = z.phase === 'dying' ? Math.max(0, z.t - 0.8) * 0.6 : 0;
      const pitch = z.pitch;
      // Crawling zombies lie forward from the feet; the pivot sits a little above the floor so knees stay above it.
      _q.setFromEuler(_e.set(pitch, z.yaw, 0, 'YXZ'));
      _s.setScalar(z.scale);
      const lift = z.phase === 'emerge' ? 0.12 : 0;
      _v.set(z.pos.x, z.pos.y + lift - sink, z.pos.z);
      z.base.compose(_v, _q, _s);

      const flash = z.flash;
      const skin = _skin.copy(z.skin).lerp(WHITE, flash * 0.8);
      const crawl = z.phase === 'emerge';
      const sw = Math.sin(z.cycle);

      // Torso and head.
      _part.makeTranslation(0, 1.15, 0);
      this.torso.setMatrixAt(nz, _m.multiplyMatrices(z.base, _part));
      this.torso.setColorAt(nz, _c.copy(z.shirt).lerp(WHITE, flash * 0.8));
      _part.makeRotationFromEuler(_e.set(0.25 + sw * 0.08, sw * 0.15, 0.2 * Math.sin(z.cycle * 0.5))).setPosition(0, 1.6, 0.02);
      this.headMesh.setMatrixAt(nz, _m.multiplyMatrices(z.base, _part));
      this.headMesh.setColorAt(nz, skin);
      _part.makeRotationFromEuler(_e.set(0.25 + sw * 0.08, sw * 0.15, 0.2 * Math.sin(z.cycle * 0.5)));
      _part.multiply(_m.makeTranslation(0, 0.03, 0.135));
      _part.premultiply(_m.makeTranslation(0, 1.6, 0.02));
      this.eyes.setMatrixAt(nz, _m.multiplyMatrices(z.base, _part));

      // Arms: forward and grasping while walking, clawing while crawling, swinging when attacking.
      for (const side of [-1, 1]) {
        let ax: number;
        if (crawl) ax = -1.9 - 0.6 * Math.sin(z.cycle + (side > 0 ? Math.PI : 0));
        else if (z.phase === 'attack') ax = -2.1 + 0.9 * Math.sin(z.cycle + side);
        else if (z.phase === 'dying') ax = -2.6;
        else ax = -1.35 + 0.12 * Math.sin(z.cycle * 0.7 + side);
        _part.makeRotationFromEuler(_e.set(ax, 0, side * 0.08)).setPosition(side * 0.26, 1.38, 0);
        this.arms.setMatrixAt(na, _m.multiplyMatrices(z.base, _part));
        this.arms.setColorAt(na, skin);
        na++;
      }
      // Legs.
      for (const side of [-1, 1]) {
        const swing = crawl ? 0.25 * Math.sin(z.cycle + (side > 0 ? 0 : Math.PI)) : z.phase === 'walk' ? 0.45 * Math.sin(z.cycle) * side : 0;
        _part.makeRotationFromEuler(_e.set(swing, 0, 0)).setPosition(side * 0.11, 0.86, 0);
        this.legs.setMatrixAt(nl, _m.multiplyMatrices(z.base, _part));
        this.legs.setColorAt(nl, _c.copy(z.pants).lerp(WHITE, flash * 0.8));
        nl++;
      }
      // Blob shadow on the floor under the chest.
      _w.set(0, 1.15, 0).applyMatrix4(z.base);
      _part.makeScale(z.scale, 1, z.scale).setPosition(_w.x, this.floorY + 0.004, _w.z);
      this.blobs.setMatrixAt(nz, _part);

      z.head.set(0, 1.6, 0.02).applyMatrix4(z.base);
      z.chest.set(0, 1.2, 0).applyMatrix4(z.base);
      z.hips.set(0, 0.8, 0).applyMatrix4(z.base);
      nz++;
    }
    // Reaching arms (stage 1): poke out of the crack and pull back.
    for (const h of this.hands) {
      if (h.t < 0) continue;
      const k = Math.sin(Math.min(1, h.t / h.life) * Math.PI);
      // The pivot is the shoulder: it stays behind the wall, so only the forearm pokes out of the crack.
      const out = -0.75 + k * 0.85;
      h.rift.point(h.x, h.y, out, _w);
      // Arm points out of the wall: local -Y along the normal (basis right, -normal, up), with a little roll and wave.
      _v.copy(h.rift.normal).negate();
      _m.makeBasis(h.rift.right, _v, h.rift.up);
      _part.makeRotationFromEuler(_e.set(0.25 * Math.sin(h.t * 5 + h.roll), h.roll + 0.3 * Math.sin(h.t * 7), 0));
      _m.multiply(_part).setPosition(_w);
      this.arms.setMatrixAt(na, _m);
      this.arms.setColorAt(na, _c.set(SKINS[0]));
      na++;
    }
    for (const [mesh, n] of [
      [this.torso, nz],
      [this.headMesh, nz],
      [this.eyes, nz],
      [this.blobs, nz],
      [this.arms, na],
      [this.legs, nl],
    ] as [InstancedMesh, number][]) {
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }

  clear(): void {
    this.zombies.length = 0;
    this.hands.length = 0;
    this.write();
  }

  dispose(): void {
    for (const mesh of [this.torso, this.headMesh, this.arms, this.legs, this.eyes, this.blobs]) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.dispose();
    }
  }
}

function wrapAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** Distance along the ray to the sphere, or null. `dir` must be normalized. */
function raySphere(origin: Vector3, dir: Vector3, center: Vector3, radius: number): number | null {
  const ox = origin.x - center.x;
  const oy = origin.y - center.y;
  const oz = origin.z - center.z;
  const b = ox * dir.x + oy * dir.y + oz * dir.z;
  const c = ox * ox + oy * oy + oz * oz - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t >= 0 ? t : null;
}

export { raySphere };
