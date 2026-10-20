// Reads the room planes of the WebXR plane-detection feature (Quest: the walls, floor and furniture of the room setup)
// into simple surfaces. Nothing of this leaves the browser: the planes are only used to place the rifts and parts.

import { Matrix4, Quaternion, Vector3 } from 'three';

export type SurfaceKind = 'wall' | 'floor' | 'table' | 'ceiling';

export interface Surface {
  kind: SurfaceKind;
  label: string;
  /** World pose of the plane; plane-local +Y is the normal, the polygon lies in local X/Z. */
  matrix: Matrix4;
  /** Center of the polygon's bounding rectangle in world space. */
  center: Vector3;
  normal: Vector3;
  /** Half extents of the polygon along local X and Z. */
  halfX: number;
  halfZ: number;
  area: number;
}

const _p = new Vector3();
const _q = new Quaternion();
const _s = new Vector3();

export class Room {
  surfaces: Surface[] = [];
  /** True once the browser delivered at least one plane in this session. */
  hasPlanes = false;
  /** False when frame.detectedPlanes is not available at all. */
  supported = true;
  private seen = new Map<XRPlane, number>();

  update(frame: XRFrame, refSpace: XRReferenceSpace): void {
    let planes: XRPlaneSet | undefined;
    try {
      planes = frame.detectedPlanes;
    } catch {
      planes = undefined;
    }
    if (!planes) {
      this.supported = false;
      return;
    }
    // Rebuild only when the set or a plane changed (planes are re-reported every frame).
    let changed = planes.size !== this.seen.size;
    planes.forEach((plane) => {
      if (this.seen.get(plane) !== plane.lastChangedTime) changed = true;
    });
    if (!changed) return;
    this.seen.clear();
    const out: Surface[] = [];
    planes.forEach((plane) => {
      this.seen.set(plane, plane.lastChangedTime);
      const pose = frame.getPose(plane.planeSpace, refSpace);
      const surface = pose ? toSurface(plane, pose) : null;
      if (surface) out.push(surface);
    });
    this.surfaces = classify(out);
    if (out.length) this.hasPlanes = true;
  }

  /** Real walls; windows, doors and wall art are only used when nothing else is there (their plane is too small to hide the rift's insides). */
  get walls(): Surface[] {
    const all = this.surfaces.filter((s) => s.kind === 'wall');
    const plain = all.filter((s) => !s.label || s.label === 'wall');
    return plain.length ? plain : all;
  }

  /** Height of the floor: the lowest floor plane, else `fallback`. */
  floorY(fallback: number): number {
    let y = Infinity;
    for (const s of this.surfaces) if (s.kind === 'floor') y = Math.min(y, s.center.y);
    return Number.isFinite(y) ? y : fallback;
  }
}

/** Unlabeled horizontal planes: near the floor = floor, far above it = ceiling, in between = furniture. */
function classify(surfaces: Surface[]): Surface[] {
  const labeledFloor = surfaces.filter((s) => s.kind === 'floor').map((s) => s.center.y);
  const horizontal = surfaces.filter((s) => s.kind !== 'wall').map((s) => s.center.y);
  const floor = labeledFloor.length ? Math.min(...labeledFloor) : horizontal.length ? Math.min(...horizontal, 0) : 0;
  for (const s of surfaces) {
    if (s.kind !== 'table' || s.label) {
      if (s.kind === 'table' && s.center.y - floor > 1.9) s.kind = 'ceiling';
      continue;
    }
    const h = s.center.y - floor;
    if (h < 0.15) s.kind = 'floor';
    else if (h > 1.9) s.kind = 'ceiling';
  }
  return surfaces;
}

function toSurface(plane: XRPlane, pose: XRPose): Surface | null {
  const poly = plane.polygon;
  if (!poly || poly.length < 3) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const pt of poly) {
    minX = Math.min(minX, pt.x);
    maxX = Math.max(maxX, pt.x);
    minZ = Math.min(minZ, pt.z);
    maxZ = Math.max(maxZ, pt.z);
  }
  const matrix = new Matrix4().fromArray(pose.transform.matrix);
  matrix.decompose(_p, _q, _s);
  const normal = new Vector3(0, 1, 0).applyQuaternion(_q);
  const center = new Vector3((minX + maxX) / 2, 0, (minZ + maxZ) / 2).applyMatrix4(matrix);
  const halfX = Math.max(0.01, (maxX - minX) / 2);
  const halfZ = Math.max(0.01, (maxZ - minZ) / 2);
  const label = (plane.semanticLabel ?? '').toLowerCase();
  // The direction of a horizontal plane's normal is not reliable across runtimes: classify by label, else by height
  // (refined against the floor in Room.classify()).
  let kind: SurfaceKind;
  if (Math.abs(normal.y) < 0.3) kind = 'wall';
  else if (label === 'ceiling') kind = 'ceiling';
  else if (label === 'floor') kind = 'floor';
  else kind = 'table';
  return { kind, label, matrix, center, normal, halfX, halfZ, area: halfX * halfZ * 4 };
}
