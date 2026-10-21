// The game's Tripo zombies, skinned and animated (public/breach/zombies/*.glb, made by scripts/export_zombies.py from the
// owner's Tripo models and Tripo takes; nothing from Mixamo or asset stores). Each file is one model with its own rig and
// the retargeted clips; the GLBs are loaded once per session and every zombie is a SkeletonUtils clone that shares the
// geometry, material and textures and has its own AnimationMixer. Model convention: feet at the origin, +Y up, facing +Z,
// about 1.75 m tall, clips in place (the horde moves the zombie).

import { AnimationMixer, FrontSide, LoopOnce, LoopRepeat, Mesh, MeshStandardMaterial, NoColorSpace, SRGBColorSpace, Sphere, SkinnedMesh, Vector3 } from 'three';
import type { AnimationAction, AnimationClip, Material, Object3D, Texture } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

export const ZOMBIE_FILES = ['f_zombie_01', 'f_zombie_06', 'f_zombie_10', 'f_zombie_16'];
export const WALKS = ['Walk_Hunched', 'Walk_Stagger'];
export const RUN = 'Run_Lope';
export const HEAVY_WALK = 'Walk_Heavy';
export const IDLE = 'Idle_Breathe';
/** Attack loops (Attack, Attack_Grab, Attack_Lunge, Attack_ClawRight, ...): each GLB carries two or three of them. */
export const ATTACK_PREFIX = 'Attack';
const ZOMBIE_ENV = 0.08;
const SKIN_TINT = 0xc8b4a8;

export interface ZombieModel {
  name: string;
  scene: Object3D;
  clips: Map<string, AnimationClip>;
  /** Ground speed of each walk/run loop in m/s at scale 1 and timeScale 1, measured from the planted feet. */
  speeds: Map<string, number>;
  /** The model's attack loops and, per clip, the time of the swing peak (hands or head furthest forward), in s. */
  attacks: string[];
  peaks: Map<string, number>;
  /** Standing height (soles to top of the head, m) and sole height above the origin, measured on the skinned mesh in
   * the first Idle_Breathe pose at scale 1: the horde scales every body from this to its target height. */
  height: number;
  footY: number;
  material: MeshStandardMaterial;
  /** Same look, bright and hot, swapped in for a few frames on a hit (shared by all clones of the model). */
  flash: MeshStandardMaterial;
}

const _v = new Vector3();
const _w = new Vector3();

/** Loads the given GLBs (failed files are logged and skipped). */
export async function loadZombieModels(urls: string[]): Promise<ZombieModel[]> {
  const loader = new GLTFLoader();
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const gltf = await loader.loadAsync(url);
        return prepare(url, gltf.scene, gltf.animations);
      } catch (error) {
        console.warn(`[breach] zombie model ${url} failed to load`, error);
        return null;
      }
    }),
  );
  return results.filter((m): m is ZombieModel => m !== null);
}

function prepare(url: string, scene: Object3D, animations: AnimationClip[]): ZombieModel {
  let mesh: SkinnedMesh | null = null;
  scene.traverse((o) => {
    if (o instanceof SkinnedMesh) mesh = o;
  });
  if (!mesh) throw new Error(`${url}: no skinned mesh`);
  const skinned = mesh as SkinnedMesh;
  const material = skinned.material as MeshStandardMaterial;
  material.side = FrontSide;
  // Lit by the key and hemisphere lights only; the room IBL (there for the gold) would wash the dark skin out.
  material.envMapIntensity = ZOMBIE_ENV;
  // Base color is sRGB, the normal map is data (GLTFLoader does this already; kept explicit so a re-export cannot break it).
  if (material.map) material.map.colorSpace = SRGBColorSpace;
  if (material.normalMap) material.normalMap.colorSpace = NoColorSpace;
  // The Tripo skin islands are a light pinkish beige; a dirty tint keeps them in the game's darker, muddier range.
  material.color.set(SKIN_TINT);
  material.emissive.set(0x000000);
  material.metalness = 0;
  material.roughness = 0.8;
  const flash = material.clone();
  flash.emissive.set(0xff6a3a);
  flash.emissiveIntensity = 0.9;

  const clips = new Map<string, AnimationClip>();
  for (const clip of animations) {
    // Only rotations and the hips translation drive the pose; the constant bone offsets and scales are dropped.
    clip.tracks = clip.tracks.filter((t) => t.name.endsWith('.quaternion') || t.name === 'Hips.position');
    const start = Math.min(...clip.tracks.map((t) => t.times[0]));
    if (start > 0) for (const t of clip.tracks) t.shift(-start);
    clip.resetDuration();
    clips.set(clip.name, clip);
  }
  const speeds = new Map<string, number>();
  for (const name of [...WALKS, RUN, HEAVY_WALK]) {
    const clip = clips.get(name);
    if (clip) speeds.set(name, measureSpeed(scene, clip));
  }
  const attacks = [...clips.keys()].filter((n) => n.startsWith(ATTACK_PREFIX));
  const peaks = new Map<string, number>();
  for (const name of attacks) peaks.set(name, measurePeak(scene, clips.get(name)!));
  const { height, footY } = measureHeight(skinned, scene, clips.get(IDLE) ?? null);
  return { name: url.split('/').pop()!.replace('.glb', ''), scene, clips, speeds, attacks, peaks, height, footY, material, flash };
}

/** Vertical extent of a skinned mesh in world space (every `step`-th vertex, with the current bone pose). */
export function skinnedExtent(mesh: SkinnedMesh, step = 3): { min: number; max: number } {
  const pos = mesh.geometry.attributes.position;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < pos.count; i += step) {
    mesh.getVertexPosition(i, _v).applyMatrix4(mesh.matrixWorld);
    if (_v.y < min) min = _v.y;
    if (_v.y > max) max = _v.y;
  }
  return { min, max };
}

function measureHeight(mesh: SkinnedMesh, scene: Object3D, idle: AnimationClip | null): { height: number; footY: number } {
  const mixer = new AnimationMixer(scene);
  if (idle) {
    mixer.clipAction(idle).play();
    mixer.setTime(0);
  }
  scene.updateMatrixWorld(true);
  const { min, max } = skinnedExtent(mesh, 2);
  mixer.stopAllAction();
  mixer.uncacheRoot(scene);
  const height = max - min;
  // A broken export (wrong unit, lying rest pose) must not produce a giant: fall back to the export convention.
  return height > 0.5 && height < 3 ? { height, footY: min } : { height: 1.7, footY: 0 };
}

/** Time in an attack loop where a hand (or the head, for a lunge with the teeth) reaches furthest forward (+Z). */
function measurePeak(scene: Object3D, clip: AnimationClip): number {
  const mixer = new AnimationMixer(scene);
  mixer.clipAction(clip).play();
  const parts = ['Left_Hand', 'Right_Hand', 'Head'].map((n) => scene.getObjectByName(n));
  const steps = 64;
  let best = -Infinity;
  let at = 0;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * clip.duration;
    mixer.setTime(t);
    scene.updateMatrixWorld(true);
    parts.forEach((p, k) => {
      if (!p) return;
      const z = p.getWorldPosition(_v).z - (k === 2 ? 0.25 : 0);
      if (z > best) {
        best = z;
        at = t;
      }
    });
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(scene);
  return at;
}

/** Average backward speed of a foot while it is planted (near its lowest point): the speed the loop walks at. */
function measureSpeed(scene: Object3D, clip: AnimationClip): number {
  const mixer = new AnimationMixer(scene);
  mixer.clipAction(clip).play();
  const feet = ['Left_Foot', 'Right_Foot'].map((n) => scene.getObjectByName(n)).filter((f): f is Object3D => Boolean(f));
  const steps = 96;
  const dt = clip.duration / steps;
  const samples = feet.map(() => [] as Vector3[]);
  for (let i = 0; i <= steps; i++) {
    mixer.setTime(i * dt);
    scene.updateMatrixWorld(true);
    feet.forEach((f, k) => samples[k].push(f.getWorldPosition(new Vector3())));
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(scene);
  let distance = 0;
  let time = 0;
  for (const s of samples) {
    const low = Math.min(...s.map((p) => p.y));
    for (let i = 1; i < s.length; i++) {
      const dz = s[i].z - s[i - 1].z;
      if (s[i].y < low + 0.04 && dz < 0) {
        distance -= dz;
        time += dt;
      }
    }
  }
  return time > 0 ? distance / time : 0.5;
}

/** One zombie: a clone of a model with its own mixer. */
export class ZombieBody {
  readonly root: Object3D;
  readonly mesh: SkinnedMesh;
  private mixer: AnimationMixer;
  private actions = new Map<string, AnimationAction>();
  private loopAction: AnimationAction | null = null;
  private shot: AnimationAction | null = null;
  private shotEnding = false;
  private dead = false;
  private fadeMaterial: MeshStandardMaterial | null = null;
  private head: Object3D;
  private eyes: Object3D[];
  private chest: Object3D;
  private hips: Object3D;

  constructor(readonly model: ZombieModel) {
    this.root = cloneSkinned(model.scene);
    let mesh: SkinnedMesh | null = null;
    this.root.traverse((o) => {
      if (o instanceof SkinnedMesh) mesh = o;
    });
    this.mesh = mesh!;
    this.mesh.frustumCulled = true;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    // Fixed bounds that hold every clip (lying after a death too); the default ones come from the first pose only.
    this.mesh.boundingSphere = new Sphere(new Vector3(0, 0.8, 0), 1.4);
    this.mixer = new AnimationMixer(this.root);
    const bone = (name: string) => this.root.getObjectByName(name) ?? this.root;
    this.head = bone('Head');
    this.eyes = [bone('Left_Eye'), bone('Right_Eye')];
    this.chest = bone('UpperChest');
    this.hips = bone('Hips');
  }

  has(name: string): boolean {
    return this.model.clips.has(name);
  }

  private action(name: string): AnimationAction {
    let a = this.actions.get(name);
    if (!a) {
      a = this.mixer.clipAction(this.model.clips.get(name)!);
      this.actions.set(name, a);
    }
    return a;
  }

  /** True while a hit reaction or death owns the pose. */
  get busy(): boolean {
    return this.dead || (this.shot !== null && !this.shotEnding);
  }

  /** Cross-fades to a looping clip (or only updates its speed when it already plays). */
  loop(name: string, timeScale: number, fade = 0.3): void {
    if (this.dead || !this.has(name)) return;
    const next = this.action(name);
    next.timeScale = timeScale;
    if (this.loopAction === next) return;
    const first = !this.loopAction && !this.shot;
    next.reset().setLoop(LoopRepeat, Infinity).play();
    if (first) next.time = Math.random() * next.getClip().duration;
    else next.fadeIn(fade);
    this.loopAction?.fadeOut(fade);
    this.loopAction = next;
  }

  /**
   * Cross-fades into an attack loop, started so that its swing peak comes `hitIn` seconds from now (the moment the
   * horde deals the damage). The loop keeps swinging until the horde asks for another clip.
   */
  swing(name: string, hitIn: number, fade = 0.2): void {
    if (this.dead || !this.has(name)) return;
    const next = this.action(name);
    const duration = next.getClip().duration;
    const peak = this.model.peaks.get(name) ?? 0;
    next.reset().setLoop(LoopRepeat, Infinity).play();
    next.timeScale = 1;
    next.time = (((peak - hitIn) % duration) + duration) % duration;
    if (this.loopAction !== next) {
      next.fadeIn(fade);
      this.loopAction?.fadeOut(fade);
    }
    this.loopAction = next;
  }

  /**
   * Plays a clip once. `blend` keeps the loop running underneath (a half-strength flinch while walking); otherwise the
   * loop fades out and comes back when the clip ends. `final` holds the last frame (deaths).
   */
  once(name: string, options: { blend?: boolean; final?: boolean; fade?: number } = {}): number {
    if (this.dead || !this.has(name)) return 0;
    const fade = options.fade ?? 0.1;
    const a = this.action(name);
    if (this.shot && this.shot !== a) this.shot.fadeOut(fade);
    a.reset().setLoop(LoopOnce, 1).fadeIn(fade).play();
    a.clampWhenFinished = Boolean(options.final);
    a.timeScale = 1;
    if (!options.blend && this.loopAction) {
      this.loopAction.fadeOut(fade);
      this.loopAction = null;
    }
    this.shot = a;
    this.shotEnding = false;
    this.dead = Boolean(options.final);
    return a.getClip().duration;
  }

  update(dt: number): void {
    const s = this.shot;
    if (s && !this.dead && !this.shotEnding && s.time > s.getClip().duration - 0.25) {
      // Hand the pose back to the loop the horde asks for next.
      s.fadeOut(0.25);
      this.shotEnding = true;
    }
    if (s && this.shotEnding && !s.isRunning()) this.shot = null;
    this.mixer.update(dt);
  }

  setFlash(on: boolean): void {
    if (this.fadeMaterial) return;
    this.mesh.material = on ? this.model.flash : this.model.material;
  }

  /** Fades the body out (own transparent copy of the material; the textures stay shared). */
  setFade(opacity: number): void {
    if (!this.fadeMaterial) {
      this.fadeMaterial = this.model.material.clone();
      this.fadeMaterial.transparent = true;
      this.fadeMaterial.depthWrite = false;
      this.mesh.material = this.fadeMaterial;
    }
    this.fadeMaterial.opacity = opacity;
  }

  /** World centers of head, chest and hips for the hit spheres (needs an updated matrixWorld). */
  centers(head: Vector3, chest: Vector3, hips: Vector3): void {
    this.eyes[0].getWorldPosition(_v);
    this.eyes[1].getWorldPosition(_w);
    _v.add(_w).multiplyScalar(0.5);
    this.head.getWorldPosition(head).lerp(_v, 0.65);
    this.chest.getWorldPosition(chest);
    this.hips.getWorldPosition(hips);
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
    this.root.removeFromParent();
    this.mesh.skeleton.dispose();
    this.fadeMaterial?.dispose();
  }
}

/** Frees what the clones share (call after the last body is gone). */
export function disposeZombieModels(models: ZombieModel[]): void {
  const textures = new Set<Texture>();
  const materials = new Set<Material>();
  for (const m of models) {
    materials.add(m.material);
    materials.add(m.flash);
    m.scene.traverse((o) => {
      if (o instanceof Mesh) o.geometry.dispose();
    });
  }
  for (const mat of materials) {
    for (const value of Object.values(mat)) if (value && (value as Texture).isTexture) textures.add(value as Texture);
    mat.dispose();
  }
  for (const t of textures) t.dispose();
}
