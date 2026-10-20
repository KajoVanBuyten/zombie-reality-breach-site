// The two guns of the quest and the three golden parts.
// Model convention for both guns: grip point at the origin, +Y up, muzzle towards +Z (as exported by
// scripts/export_golden_deagle.py). The golden Desert Eagle is the game's model (public/breach/golden_deagle.glb) with
// gold PBR from the file plus an orange crack glow generated here; if it cannot be loaded, a stylized gold gun built
// from boxes stands in.

import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';
import type { Material, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const GOLD = 0xd4a73a;
const EMBER = 0xff6a1a;

export interface Gun {
  model: Group;
  /** Muzzle in model coordinates. */
  muzzle: Vector3;
}

export interface GoldenSet {
  /** Complete gun. */
  gun: Gun;
  /** The three parts, each centered on its own pivot, in the order barrel & frame, slide, grip magazine. */
  parts: Group[];
  /** Each part placed as in the complete gun (for partly assembled pieces). */
  assembledParts: Group[];
  labels: string[];
  materials: MeshStandardMaterial[];
}

export function buildStarterPistol(): Gun {
  const model = new Group();
  const steel = new MeshStandardMaterial({ color: 0x2b2d33, metalness: 0.6, roughness: 0.45 });
  const polymer = new MeshStandardMaterial({ color: 0x15161a, metalness: 0.1, roughness: 0.8 });
  const slide = new Mesh(new BoxGeometry(0.03, 0.034, 0.18), steel);
  slide.position.set(0, 0.058, 0.07);
  const frame = new Mesh(new BoxGeometry(0.028, 0.02, 0.15), polymer);
  frame.position.set(0, 0.033, 0.06);
  const grip = new Mesh(new BoxGeometry(0.03, 0.11, 0.045), polymer);
  grip.position.set(0, -0.02, 0);
  grip.rotation.x = -0.25;
  const guard = new Mesh(new BoxGeometry(0.006, 0.006, 0.05), polymer);
  guard.position.set(0, 0.006, 0.045);
  const sight = new Mesh(new BoxGeometry(0.006, 0.008, 0.008), new MeshBasicMaterial({ color: 0x7fffa0 }));
  sight.position.set(0, 0.079, 0.15);
  model.add(slide, frame, grip, guard, sight);
  return { model, muzzle: new Vector3(0, 0.058, 0.165) };
}

/** Thin glowing cracks for the emissive map: random jagged lines on black. */
function crackTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#ffffff';
  g.lineCap = 'round';
  for (let n = 0; n < 9; n++) {
    let x = Math.random() * 256;
    let y = Math.random() * 256;
    let a = Math.random() * Math.PI * 2;
    g.lineWidth = 1 + Math.random() * 1.5;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 14; k++) {
      a += (Math.random() - 0.5) * 1.2;
      x += Math.cos(a) * 9;
      y += Math.sin(a) * 9;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function goldMaterial(base?: MeshStandardMaterial, cracks?: CanvasTexture): MeshStandardMaterial {
  const m = base ?? new MeshStandardMaterial();
  m.color.set(GOLD);
  m.metalness = 1;
  m.roughness = 0.25;
  m.emissive = new Color(EMBER);
  m.emissiveMap = cracks ?? null;
  m.emissiveIntensity = 0.9;
  m.needsUpdate = true;
  return m;
}

/** Stylized stand-in with the same three parts, used when the GLB cannot be loaded. */
function primitiveDeagle(cracks: CanvasTexture): Object3D[] {
  const mat = goldMaterial(undefined, cracks);
  const body = new Group();
  body.name = 'Body';
  const barrel = new Mesh(new BoxGeometry(0.032, 0.03, 0.2), mat);
  barrel.position.set(0, 0.05, 0.1);
  const grip = new Mesh(new BoxGeometry(0.034, 0.12, 0.05), mat);
  grip.position.set(0, -0.02, -0.005);
  grip.rotation.x = -0.2;
  body.add(barrel, grip);
  const slide = new Mesh(new BoxGeometry(0.038, 0.034, 0.2), mat);
  slide.name = 'SlideVisual';
  slide.position.set(0, 0.078, 0.09);
  const mag = new Mesh(new BoxGeometry(0.024, 0.11, 0.04), mat);
  mag.name = 'MagazineVisual';
  mag.position.set(0, -0.025, 0.0);
  mag.rotation.x = -0.2;
  return [body, slide, mag];
}

const PART_ORDER = ['Body', 'SlideVisual', 'MagazineVisual'];
export const PART_LABELS = ['Barrel & frame', 'Slide', 'Grip magazine'];

export async function loadGoldenSet(url: string): Promise<GoldenSet> {
  const cracks = crackTexture();
  let nodes: Object3D[];
  let muzzle = new Vector3(0, 0.07, 0.21);
  try {
    const gltf = await new GLTFLoader().loadAsync(url);
    const found = PART_ORDER.map((name) => gltf.scene.getObjectByName(name));
    if (found.some((n) => !n)) throw new Error('parts missing');
    nodes = found as Object3D[];
    const m = gltf.scene.getObjectByName('Muzzle');
    if (m) muzzle = m.position.clone();
    for (const node of nodes) {
      node.traverse((o) => {
        if (o instanceof Mesh) o.material = goldMaterial(o.material as MeshStandardMaterial, cracks);
      });
    }
  } catch {
    nodes = primitiveDeagle(cracks);
  }
  const materials = new Set<MeshStandardMaterial>();
  for (const n of nodes) {
    n.traverse((o) => {
      if (o instanceof Mesh) materials.add(o.material as MeshStandardMaterial);
    });
  }

  const gun = new Group();
  const parts: Group[] = [];
  const assembledParts: Group[] = [];
  for (const node of nodes) {
    gun.add(node.clone());
    assembledParts.push(wrap(node.clone()));
    // Single part: recenter so it floats and spins around its own middle.
    const centered = node.clone();
    const box = boundsCenter(centered);
    centered.position.sub(box);
    parts.push(wrap(centered));
  }
  return { gun: { model: gun, muzzle }, parts, assembledParts, labels: PART_LABELS, materials: [...materials] };
}

function wrap(o: Object3D): Group {
  const g = new Group();
  g.add(o);
  return g;
}

function boundsCenter(o: Object3D): Vector3 {
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  o.updateMatrixWorld(true);
  o.traverse((c) => {
    if (c instanceof Mesh) {
      c.geometry.computeBoundingBox();
      const b = c.geometry.boundingBox!.clone().applyMatrix4(c.matrixWorld);
      min.min(b.min);
      max.max(b.max);
    }
  });
  return min.add(max).multiplyScalar(0.5);
}

/** Mounts a gun on a controller's target-ray space so the barrel lies on the pointing ray. */
export function mountGun(gun: Gun): Group {
  const mount = new Group();
  const holder = new Group();
  holder.rotation.y = Math.PI; // model +Z (muzzle) -> ray -Z
  holder.position.set(0, -gun.muzzle.y, gun.muzzle.z * 0.35);
  holder.add(gun.model);
  mount.add(holder);
  return mount;
}

/** Glowing aim line from the muzzle, 2.5 m long, fading out. */
export function makeLaser(color: number): Mesh {
  const geo = new CylinderGeometry(0.0012, 0.0005, 2.5, 5, 1, true);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0, -1.25);
  const mat = new MeshBasicMaterial({ color, transparent: true, opacity: 0.45, blending: AdditiveBlending, depthWrite: false });
  const m = new Mesh(geo, mat);
  m.renderOrder = 15;
  return m;
}

/** Additive muzzle-flash quad, shown for a few frames per shot. */
export function makeFlash(): Mesh {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,240,200,1)');
  grad.addColorStop(0.35, 'rgba(255,150,40,0.8)');
  grad.addColorStop(1, 'rgba(255,80,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const mat = new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, blending: AdditiveBlending, depthWrite: false });
  const m = new Mesh(new PlaneGeometry(0.12, 0.12), mat);
  m.visible = false;
  m.renderOrder = 16;
  return m;
}

export function disposeTree(o: Object3D): void {
  o.traverse((c) => {
    if (c instanceof Mesh) {
      c.geometry.dispose();
      const m = c.material as Material | Material[];
      (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
    }
  });
}
