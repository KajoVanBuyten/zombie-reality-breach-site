// The web AR quest "Breach in your home" (Docs/WEB_AR_QUEST.md in the game repo), rendered with three.js in an
// immersive-ar session on Meta Quest. Five stages:
//   1 rift      a glowing crack tears open on a real wall, zombies lurk in the dark behind it, the starter pistol appears
//   2 hunt      three golden parts lie on detected surfaces (table/couch, floor, second wall); zombies walk or run out
//               of the wall rifts; shoot them and grab the parts
//   3 assemble  the parts float in front of the player; take them in both hands and bring the hands together
//   4 finale    a big zombie breaks through the main rift; kill it with the golden Desert Eagle, then shoot the three
//               seal points to close the rift
//   5 reward    "Weapon secured"; the page takes over with account linking or a code
// Room planes are only read here and never leave the browser.
//
// Performance (Quest 2, 72 fps): no shadow maps (blob shadows only), at most 10 skinned zombies (~7.5k triangles each,
// shared geometry, materials and textures), one particle draw call, canvas panels redrawn only on change, no
// post-processing.

import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Raycaster,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { Object3D, XRGripSpace, XRTargetRaySpace } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { QuestAudio } from './audio';
import { Panel } from './panel';
import type { PanelButton, PanelContent } from './panel';
import { Particles } from './particles';
import { Rift } from './rift';
import { Room } from './room';
import type { Surface } from './room';
import { Horde, raySphere } from './zombies';
import { ZOMBIE_FILES } from './zombieModels';
import type { Zombie } from './zombies';
import { GOLD, alignGrip, buildStarterPistol, disposeTree, loadGoldenSet, loadStarterPistol, makeFlash, makeLaser, mountGun, setMountedGun } from './weapons';
import type { GoldenSet, Gun, GunMount } from './weapons';
import { formatTime } from './api';
import { asset } from '@/lib/site';

export type Lang = 'en' | 'de';

export interface GameCallbacks {
  /** A stage was completed (1..5). */
  onStep(step: number): void;
  /** The reward stage was reached; `ms` is the quest time from the rift to the reward. */
  onComplete(ms: number): void;
  /** The session ended (by the player, the system or the reward button). */
  onEnd(completed: boolean): void;
  /** Best time so far (ms) for the reward panel. */
  bestTime(): number | null;
}

type Stage = 'scan' | 'rift' | 'hunt' | 'assemble' | 'finale' | 'reward';

interface Slot {
  index: number;
  ray: XRTargetRaySpace;
  grip: XRGripSpace;
  source: XRInputSource | null;
  handedness: XRHandedness | 'none';
  laser: Mesh;
  held: number[];
  heldGroup: Group;
}

interface Part {
  index: number;
  node: Group;
  home: Vector3;
  collected: boolean;
  free: boolean;
  spin: number;
}

const SCAN_TIMEOUT = 3;
// Player health: a normal hit takes 1/PLAYER_HITS, the finale zombie's twice that. It refills after REGEN_DELAY s without
// damage. At zero the player goes down for DOWN_TIME s: nearby zombies are pushed back, health refills and the quest
// goes on at the same stage (no restart; the server's step and run times only get longer).
const PLAYER_HITS = 10;
const REGEN_DELAY = 4;
const REGEN_PER_S = 0.25;
const DOWN_TIME = 2.5;
const DOWN_CLEAR_RADIUS = 3;
// Dim-room lighting (see the constructor).
const EXPOSURE = 0.7;
const AMBIENT = 0.25;
const KEY_LIGHT = 1.3;
const PISTOL_COOLDOWN = 0.2;
const DEAGLE_COOLDOWN = 0.32;
const HUNT_MAX_ALIVE = 4;
const HUNT_SPAWN_EVERY = 3.2;
const NEAR_GRAB = 0.22;
const RAY_GRAB_RADIUS = 0.13;
// Pointing grabs only nearby parts: the player still has to cross the room, but need not bend down to the floor.
const RAY_GRAB_DISTANCE = 2.2;
const MERGE_DISTANCE = 0.2;

const _v = new Vector3();
const _w = new Vector3();
const _dir = new Vector3();
const _head = new Vector3();
const _fwd = new Vector3();
const _m = new Matrix4();

const TEXT = {
  en: {
    scanTitle: 'Reading your room',
    scanWait: 'Look around your room for a moment.',
    setupTitle: 'Room setup needed',
    setupText: 'The breach needs your real walls and furniture. Set up your room once.',
    setupManual: 'Not available from here: run Settings > Physical space > Space setup, then start again.',
    setupWaiting: 'Waiting for your room data…',
    setupButton: 'Set up room',
    anyway: 'Play anyway',
    exit: 'Exit',
    riftTitle: 'The breach',
    riftText: 'Something is tearing through your wall…',
    riftPistol: 'Take the pistol in your right hand. Trigger (or pinch) to shoot.',
    huntTitle: 'The hunt',
    huntText: 'Three golden parts are hidden in your room. Hold the zombies off and grab the parts: grip, or point with your left hand and pull the trigger (pinch).',
    parts: 'Golden parts',
    kills: 'Kills',
    assembleTitle: 'Assemble',
    assembleText: 'Take the parts in your hands and bring your hands together.',
    assembled: 'Breach Gold assembled.',
    finaleTitle: 'Finale',
    finaleText: 'Something big is coming through the wall…',
    finaleBig: 'Bring it down with the golden Desert Eagle!',
    sealText: 'Shoot the three seal points to close the rift!',
    downTitle: 'You went down',
    downText: 'Catch your breath. The rift pushes them back…',
    rewardTitle: 'Weapon secured',
    rewardText: 'Breach Gold is yours. Take off the headset view to link your Meta account or show your code.',
    time: 'Time',
    best: 'Best',
    claim: 'Claim reward',
  },
  de: {
    scanTitle: 'Dein Raum wird gelesen',
    scanWait: 'Sieh dich kurz in deinem Raum um.',
    setupTitle: 'Raumeinrichtung nötig',
    setupText: 'Der Riss braucht deine echten Wände und Möbel. Richte deinen Raum einmal ein.',
    setupManual: 'Von hier nicht verfügbar: Einstellungen > Physischer Raum > Raumeinrichtung, dann neu starten.',
    setupWaiting: 'Warte auf deine Raumdaten…',
    setupButton: 'Raum einrichten',
    anyway: 'Trotzdem spielen',
    exit: 'Beenden',
    riftTitle: 'Der Riss',
    riftText: 'Etwas reißt durch deine Wand…',
    riftPistol: 'Nimm die Pistole in die rechte Hand. Abzug (oder Pinch) zum Schießen.',
    huntTitle: 'Die Jagd',
    huntText: 'Drei goldene Teile liegen in deinem Raum. Halte die Zombies auf und greif dir die Teile: Griff, oder mit der linken Hand zeigen und Abzug (Pinch).',
    parts: 'Goldene Teile',
    kills: 'Kills',
    assembleTitle: 'Zusammenbau',
    assembleText: 'Nimm die Teile in die Hände und führe die Hände zusammen.',
    assembled: 'Breach Gold zusammengesetzt.',
    finaleTitle: 'Finale',
    finaleText: 'Etwas Großes kommt durch die Wand…',
    finaleBig: 'Leg es mit der goldenen Desert Eagle um!',
    sealText: 'Schieß auf die drei Siegelpunkte, um den Riss zu schließen!',
    downTitle: 'Du bist zu Boden gegangen',
    downText: 'Kurz durchatmen. Der Riss drängt sie zurück…',
    rewardTitle: 'Waffe gesichert',
    rewardText: 'Breach Gold gehört dir. Verlasse die Brillenansicht, um dein Meta-Konto zu verknüpfen oder deinen Code anzuzeigen.',
    time: 'Zeit',
    best: 'Bestzeit',
    claim: 'Belohnung holen',
  },
};

export class BreachGame {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(70, 1, 0.05, 50);
  private room = new Room();
  private particles: Particles;
  private horde: Horde;
  private panel = new Panel();
  private raycaster = new Raycaster();
  private slots: Slot[] = [];
  private stage: Stage = 'scan';
  private stageTime = 0;
  private time = 0;
  private lastFrame = -1;
  private questStart = 0;
  private completed = false;
  private ended = false;
  private localFloor = true;
  private floorY = 0;
  private captureUsed = false;
  private captureWaiting = false;

  private mainRift: Rift | null = null;
  private sideRift: Rift | null = null;
  private parts: Part[] = [];
  private golden: GoldenSet | null = null;
  private goldenLoad: Promise<GoldenSet>;
  private pistol: Gun = buildStarterPistol();
  private pistolMount: GunMount;
  private goldMount: GunMount | null = null;
  private gunSlot: Slot | null = null;
  private gunMode: 'none' | 'pistol' | 'gold' = 'none';
  private cooldown = 0;
  private recoil = 0;
  private flash = makeFlash();
  private tracer: Line;
  private tracerTime = 0;
  private hurtMat: ShaderMaterial;
  private hurt = 0;
  /** 1 = full, 0 = down. */
  private health = 1;
  private sinceHit = Infinity;
  /** Seconds since going down, -1 while standing. */
  private downT = -1;
  private kills = 0;
  private spawnTimer = 0;
  private spawnSide = 0;
  private big: Zombie | null = null;
  private seals: Mesh[] = [];
  private sealPhase = false;
  private closing = -1;
  private beat = 0;
  private goldPulse = 0;
  private t: (typeof TEXT)['en'];

  constructor(private session: XRSession, private audio: QuestAudio, private cb: GameCallbacks, lang: Lang) {
    this.t = TEXT[lang];
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.xr.enabled = true;
    const features = session.enabledFeatures;
    this.localFloor = !features || features.includes('local-floor');
    this.renderer.xr.setReferenceSpaceType(this.localFloor ? 'local-floor' : 'local');
    this.renderer.xr.setFramebufferScaleFactor(1);

    // Lighting for passthrough: the scene has to sit in a dim real room. ACES tone mapping with explicit sRGB output, a
    // moderate warm key light from above, little ambient. The RoomEnvironment IBL is there for the reflections of the
    // gold and the pistol; on the zombies it is turned almost off (zombieModels.ts), because its bright diffuse light
    // washed the dark Tripo skin out to pale pink (with hemisphere 1.1 + key 1.4 and no tone mapping). Unlit UI and
    // effect materials are not tone mapped (toneMapped: false), the gold keeps its untonemapped look.
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = EXPOSURE;
    const pmrem = new PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.add(new HemisphereLight(0xffeedd, 0x2a2224, AMBIENT));
    const key = new DirectionalLight(0xffe2c0, KEY_LIGHT);
    key.position.set(1, 3, 1.5);
    this.scene.add(key, this.camera);

    this.particles = new Particles(this.scene);
    this.horde = new Horde(
      this.scene,
      {
        groan: (at, big) => this.audio.groan(at, big),
        lunge: (z) => this.audio.attack(z.head, z.big),
        attack: (z) => this.playerHit(z),
        died: (z) => this.zombieDied(z),
      },
      ZOMBIE_FILES.map((f) => asset(`breach/zombies/${f}.glb`)),
    );
    this.scene.add(this.panel.mesh);

    // The block pistol until the A3500X is loaded (it stays if public/breach/private/a3500x.glb is missing).
    this.pistolMount = mountGun(this.pistol, 0xff5040);
    this.pistolMount.root.visible = false;
    loadStarterPistol(asset('breach/private/a3500x.glb')).then((gun) => {
      if (gun.model === this.pistol.model) return;
      disposeTree(this.pistol.model);
      this.pistol = gun;
      setMountedGun(this.pistolMount, gun);
    });

    const tracerGeo = new BufferGeometry();
    tracerGeo.setAttribute('position', new BufferAttribute(new Float32Array(6), 3));
    this.tracer = new Line(tracerGeo, new LineBasicMaterial({ color: 0xffc070, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.tracer.frustumCulled = false;
    this.tracer.visible = false;
    this.scene.add(this.tracer, this.flash);

    // Red vignette when a zombie hits the player (clip-space quad, works for both eyes).
    this.hurtMat = new ShaderMaterial({
      uniforms: { uAmount: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader:
        'uniform float uAmount; varying vec2 vUv; void main() { float e = smoothstep(0.35, 1.25, length(vUv)); gl_FragColor = vec4(0.75, 0.02, 0.0, e * uAmount); }',
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const hurtQuad = new Mesh(new PlaneGeometry(2, 2), this.hurtMat);
    hurtQuad.frustumCulled = false;
    hurtQuad.renderOrder = 100;
    this.scene.add(hurtQuad);

    for (let i = 0; i < 2; i++) this.slots.push(this.makeSlot(i));
    this.goldenLoad = loadGoldenSet(asset('breach/golden_deagle.glb'));
    this.goldenLoad.then((g) => (this.golden = g)).catch(() => undefined);
  }

  async start(): Promise<void> {
    this.session.addEventListener('end', () => this.onSessionEnd());
    await this.renderer.xr.setSession(this.session);
    this.renderer.xr.setFoveation(1);
    const rates = this.session.supportedFrameRates;
    if (rates && typeof this.session.updateTargetFrameRate === 'function' && Array.from(rates).includes(72)) {
      this.session.updateTargetFrameRate(72).catch(() => undefined);
    }
    this.renderer.setAnimationLoop((time, frame) => this.frame(time, frame));
  }

  /** Ends the immersive session (the page then shows the reward or the intro again). */
  exit(): void {
    this.session.end().catch(() => undefined);
  }

  // ------------------------------------------------------------------ input

  private makeSlot(index: number): Slot {
    const ray = this.renderer.xr.getController(index);
    const grip = this.renderer.xr.getControllerGrip(index);
    const laser = makeLaser(0x46f2ff);
    laser.visible = false;
    ray.add(laser);
    const heldGroup = new Group();
    grip.add(heldGroup);
    this.scene.add(ray, grip);
    const slot: Slot = { index, ray, grip, source: null, handedness: 'none', laser, held: [], heldGroup };
    ray.addEventListener('connected', (e) => {
      const source = (e as unknown as { data: XRInputSource }).data;
      slot.source = source;
      slot.handedness = source.handedness;
      this.pickGunSlot();
    });
    ray.addEventListener('disconnected', () => {
      slot.source = null;
      slot.handedness = 'none';
      this.pickGunSlot();
    });
    ray.addEventListener('selectstart', () => this.onPress(slot, 'select'));
    ray.addEventListener('squeezestart', () => this.onPress(slot, 'squeeze'));
    return slot;
  }

  /** The gun goes to the right hand, or to the only connected one. */
  private pickGunSlot(): void {
    const right = this.slots.find((s) => s.source && s.handedness === 'right');
    const any = this.slots.find((s) => s.source);
    const next = right ?? any ?? null;
    if (next === this.gunSlot) return;
    this.gunSlot = next;
    if (next) {
      next.ray.add(this.pistolMount.root);
      if (this.goldMount) next.ray.add(this.goldMount.root);
    }
  }

  private onPress(slot: Slot, kind: 'select' | 'squeeze'): void {
    this.audio.resume();
    if (this.ended) return;
    // Panel buttons first.
    if (this.panel.mesh.visible && kind === 'select') {
      this.aim(slot);
      const id = this.panel.pick(this.raycaster);
      if (id) {
        this.onButton(id);
        return;
      }
    }
    const isGunHand = slot === this.gunSlot;
    switch (this.stage) {
      case 'rift':
      case 'finale':
        if (isGunHand && kind === 'select') this.shoot();
        break;
      case 'hunt':
        if (isGunHand && kind === 'select') this.shoot();
        else this.tryCollect(slot);
        break;
      case 'assemble':
        this.tryHold(slot);
        break;
      default:
        break;
    }
  }

  private onButton(id: string): void {
    this.audio.snap();
    if (id === 'setup' && !this.captureUsed && typeof this.session.initiateRoomCapture === 'function') {
      this.captureUsed = true;
      this.captureWaiting = true;
      this.session.initiateRoomCapture().catch(() => (this.captureWaiting = false));
    } else if (id === 'anyway') {
      this.setupWorld();
    } else if (id === 'exit' || id === 'claim') {
      this.exit();
    }
  }

  /** Points the shared raycaster along a slot's ray. */
  private aim(slot: Slot): void {
    slot.ray.updateMatrixWorld(true);
    slot.ray.getWorldPosition(_v);
    _dir.set(0, 0, -1).transformDirection(slot.ray.matrixWorld);
    this.raycaster.set(_v, _dir);
  }

  private handPosition(slot: Slot, out: Vector3): Vector3 {
    const space: Object3D = slot.grip.visible ? slot.grip : slot.ray;
    space.updateMatrixWorld(true);
    return space.getWorldPosition(out);
  }

  private pulse(slot: Slot | null, intensity: number, ms: number): void {
    const actuator = slot?.source?.gamepad?.hapticActuators?.[0] as { pulse?: (v: number, d: number) => Promise<boolean> } | undefined;
    actuator?.pulse?.(intensity, ms)?.catch?.(() => undefined);
  }

  // ------------------------------------------------------------------ loop

  private frame(timeMs: number, frame?: XRFrame): void {
    // Clamped both ways: long hitches must not teleport zombies, and timestamps must never run backwards.
    const dt = this.lastFrame < 0 ? 0 : Math.max(0, Math.min(0.05, (timeMs - this.lastFrame) / 1000));
    this.lastFrame = timeMs;
    this.time += dt;
    this.stageTime += dt;
    const refSpace = this.renderer.xr.getReferenceSpace();
    if (frame && refSpace && (this.stage === 'scan' || this.stageTime < 1)) this.room.update(frame, refSpace);

    const cam = this.renderer.xr.getCamera();
    cam.updateMatrixWorld(true);
    cam.getWorldPosition(_head);
    _fwd.set(0, 0, -1).transformDirection(cam.matrixWorld);
    this.audio.updateListener(cam);

    if (this.downT >= 0) this.stageTime -= dt;
    else switch (this.stage) {
      case 'scan':
        this.updateScan();
        break;
      case 'rift':
        this.updateRift();
        break;
      case 'hunt':
        this.updateHunt(dt);
        break;
      case 'assemble':
        this.updateAssemble();
        break;
      case 'finale':
        this.updateFinale(dt);
        break;
      case 'reward':
        this.updateReward();
        break;
    }

    this.horde.floorY = this.floorY;
    this.horde.update(dt, _head);
    this.mainRift?.update(dt, this.time);
    this.sideRift?.update(dt, this.time);
    this.updateRiftEmbers(dt);
    this.updateParts(dt);
    this.updateGun(dt);
    this.updateHover();
    this.particles.update(dt);
    this.updateHealth(dt);
    this.goldPulse += dt;
    if (this.golden) for (const m of this.golden.materials) m.emissiveIntensity = 0.55 + 0.45 * Math.sin(this.goldPulse * 3);

    this.renderer.render(this.scene, this.camera);
  }

  private setStage(stage: Stage): void {
    this.stage = stage;
    this.stageTime = 0;
    this.beat = 0;
  }

  /** Runs `fn` once when the stage clock passes `at` seconds (simple timeline). */
  private at(seconds: number, fn: () => void): void {
    if (this.stageTime >= seconds && this.beat < seconds + 0.0001) {
      this.beat = seconds + 0.001;
      fn();
    }
  }

  private hud(content: Omit<PanelContent, 'corner'>, smooth = 0.06, force = false): void {
    if (this.downT >= 0 && !force) return;
    const corner = this.questStart ? formatTime((this.time - this.questStart) * 1000) : undefined;
    this.panel.show({ ...content, corner });
    this.panel.placeInFront(_head, _fwd, this.stage === 'scan' || this.stage === 'reward' ? 0.9 : 1.15, this.stage === 'scan' || this.stage === 'reward' ? 0.1 : 0.42, smooth);
  }

  // ------------------------------------------------------------------ stage: room scan

  private updateScan(): void {
    const walls = this.room.walls;
    if (this.stageTime > 1 && walls.length) {
      this.setupWorld();
      return;
    }
    // Planes but no wall: play on a virtual wall in front of the player.
    if (this.stageTime > SCAN_TIMEOUT && this.room.hasPlanes && !walls.length && !this.captureWaiting) {
      this.setupWorld();
      return;
    }
    if (this.stageTime < SCAN_TIMEOUT) {
      this.hud({ title: this.t.scanTitle, lines: [this.t.scanWait], accent: 'ember' }, 1);
      return;
    }
    const canCapture = typeof this.session.initiateRoomCapture === 'function' && !this.captureUsed;
    const buttons: PanelButton[] = [];
    if (canCapture) buttons.push({ id: 'setup', label: this.t.setupButton });
    buttons.push({ id: 'anyway', label: this.t.anyway }, { id: 'exit', label: this.t.exit });
    const lines = this.captureWaiting ? [this.t.setupWaiting] : canCapture ? [this.t.setupText] : [this.t.setupText, this.t.setupManual];
    this.hud({ title: this.t.setupTitle, lines, accent: 'ember', buttons }, 0.15);
  }

  /** Places rifts and parts from the detected planes (or a virtual wall), then starts stage 1. */
  private setupWorld(): void {
    if (this.stage !== 'scan') return;
    const fallback = this.localFloor ? 0 : _head.y - 1.6;
    const planeFloor = this.room.floorY(fallback);
    // In local-floor space y = 0 is the real floor (the headset's own floor); a "floor" plane far from it is a
    // mislabeled surface (a rug, a bed) and would make the zombies float.
    this.floorY = this.localFloor && Math.abs(planeFloor) > 0.25 ? 0 : planeFloor;
    console.info(
      `[breach] floor y ${this.floorY.toFixed(3)} (floor plane ${planeFloor.toFixed(3)}, ${this.localFloor ? 'local-floor' : 'local'}), head ${(_head.y - this.floorY).toFixed(2)} m above it`,
    );
    const head = _head.clone();
    const forward = _fwd.clone().setY(0);
    if (forward.lengthSq() < 1e-4) forward.set(0, 0, -1);
    forward.normalize();

    const walls = this.room.walls;
    const main = pickMainWall(walls, head, forward);
    let mainCenter: Vector3;
    let mainNormal: Vector3;
    if (main) {
      ({ center: mainCenter, normal: mainNormal } = riftSpot(main, head, forward, this.floorY, 0));
    } else {
      mainCenter = head.clone().addScaledVector(forward, 2.4);
      mainCenter.y = this.floorY + 1;
      mainNormal = forward.clone().negate();
    }
    this.mainRift = new Rift(this.scene, mainCenter, mainNormal, main, { width: 1.0, height: 1.9, seed: 1.7 });

    // Second rift: another wall facing a different way, else the side of the main wall when it is wide enough.
    const second = walls
      .filter((w) => w !== main && orientedNormal(w, head).dot(mainNormal) < 0.5 && w.area > 0.8)
      .sort((a, b) => b.area - a.area)[0];
    if (second) {
      const spot = riftSpot(second, head, forward, this.floorY, 0);
      this.sideRift = new Rift(this.scene, spot.center, spot.normal, second, { width: 0.7, height: 1.5, seed: 4.2 });
    } else if (main && wallFrame(main).halfWidth > 1.7) {
      const frame = wallFrame(main);
      const side = mainCenter.clone().addScaledVector(frame.horizontal, mainCenter.clone().sub(main.center).dot(frame.horizontal) > 0 ? -1.4 : 1.4);
      this.sideRift = new Rift(this.scene, side, mainNormal, main, { width: 0.7, height: 1.5, seed: 4.2 });
    }

    this.placeParts(head, forward);
    this.panel.hide();
    this.questStart = this.time;
    this.setStage('rift');
  }

  private placeParts(head: Vector3, forward: Vector3): void {
    const spots: Vector3[] = [];
    // A table, couch or shelf within reach of the room.
    const table = this.room.surfaces
      .filter((s) => s.kind === 'table' && s.center.y - this.floorY > 0.25 && s.center.y - this.floorY < 1.4 && s.area > 0.08 && s.center.distanceTo(head) < 6)
      .sort((a, b) => b.area - a.area)[0];
    if (table) spots.push(table.center.clone().setY(table.center.y + 0.07));
    // The floor, a bit to the side and behind.
    spots.push(this.floorSpot(head, forward, 2.2, 1.5));
    // The second wall next to its rift.
    if (this.sideRift) spots.push(this.sideRift.point(this.sideRift.width * 0.85, 0.15, 0.07));
    if (spots.length < 3) spots.push(this.floorSpot(head, forward, -2.2, 1.4));
    if (spots.length < 3) spots.push(this.floorSpot(head, forward, Math.PI, 1.3));

    this.parts = spots.slice(0, 3).map((home, index) => {
      const node = new Group();
      node.position.copy(home);
      this.scene.add(node);
      node.add(makeHalo(), makeBeacon());
      return { index, node, home, collected: false, free: false, spin: Math.random() * 6 };
    });
    // The part models arrive with the GLB; attach as soon as they are there.
    this.goldenLoad
      .then((g) => {
        this.parts.forEach((p) => {
          const model = g.parts[p.index];
          model.scale.setScalar(1.3);
          p.node.add(model);
        });
      })
      .catch(() => undefined);
    this.parts.forEach((p) => (p.node.visible = false));
  }

  /** A floor point `distance` m from the player, rotated `angle` from the view direction, kept on the floor plane. */
  private floorSpot(head: Vector3, forward: Vector3, angle: number, distance: number): Vector3 {
    const dir = forward.clone().applyAxisAngle(new Vector3(0, 1, 0), angle);
    const floor = this.room.surfaces.filter((s) => s.kind === 'floor').sort((a, b) => b.area - a.area)[0];
    for (let d = distance; d > 0.5; d -= 0.25) {
      const p = head.clone().addScaledVector(dir, d);
      p.y = this.floorY + 0.06;
      if (!floor || insideSurface(floor, p, 0.25)) return p;
    }
    const p = head.clone().addScaledVector(dir, 0.7);
    p.y = this.floorY + 0.06;
    return p;
  }

  // ------------------------------------------------------------------ stage 1: the rift

  private updateRift(): void {
    const rift = this.mainRift!;
    this.at(0, () => {
      rift.targetOpen = 0.32;
      rift.openSpeed = 0.12;
      this.audio.rumble(rift.center, 2.5);
    });
    this.at(2.6, () => {
      rift.targetOpen = 0.62;
      rift.openSpeed = 0.2;
      this.audio.rumble(rift.center, 1.6, 0.8);
      this.audio.startAmbience(rift.center);
      this.horde.reach(rift, 3);
    });
    this.at(5.5, () => {
      this.horde.reach(rift, 3);
      this.audio.groan(rift.center);
    });
    this.at(7, () => {
      this.gunMode = 'pistol';
      this.audio.slide(_head, false);
      this.pulse(this.gunSlot, 0.5, 60);
    });
    this.at(11.5, () => {
      this.cb.onStep(1);
      this.setStage('hunt');
    });
    this.hud({ title: this.t.riftTitle, lines: [this.stageTime < 7 ? this.t.riftText : this.t.riftPistol], accent: 'blood' });
  }

  // ------------------------------------------------------------------ stage 2: the hunt

  private updateHunt(dt: number): void {
    this.at(0, () => {
      if (this.sideRift) {
        this.sideRift.targetOpen = 0.55;
        this.sideRift.openSpeed = 0.25;
        this.audio.rumble(this.sideRift.center, 1.8, 0.8);
      }
      this.parts.forEach((p) => {
        p.node.visible = true;
        this.particles.emit(p.node.position, { count: 30, color: GOLD, speed: 0.8, size: 0.02, life: 0.8 });
      });
      this.spawnTimer = 1;
    });
    const collected = this.parts.filter((p) => p.collected).length;
    if (collected < 3) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.horde.alive < HUNT_MAX_ALIVE) {
        this.spawnTimer = HUNT_SPAWN_EVERY;
        const rift = this.sideRift && this.spawnSide++ % 2 === 1 ? this.sideRift : this.mainRift!;
        this.horde.spawn(rift);
      }
    }
    this.hud({
      title: this.t.huntTitle,
      lines: [this.t.huntText, `${this.t.parts}: ${collected}/3   ${this.t.kills}: ${this.kills}`],
      accent: 'gold',
    });
    if (collected === 3 && !this.huntDone) {
      this.huntDone = this.stageTime;
      this.horde.killAll();
      if (this.sideRift) {
        this.sideRift.targetOpen = 0;
        this.sideRift.openSpeed = 0.6;
        this.audio.implode(this.sideRift.center);
      }
      this.mainRift!.targetOpen = 0.4;
    }
    if (this.huntDone && this.stageTime - this.huntDone > 2) {
      this.cb.onStep(2);
      this.startAssemble();
    }
  }

  private huntDone = 0;

  private tryCollect(slot: Slot): void {
    const target = this.partUnder(slot, (p) => !p.collected && p.node.visible);
    if (!target) return;
    target.collected = true;
    target.node.visible = false;
    this.audio.pickup(target.node.position);
    this.particles.emit(target.node.position, { count: 40, color: GOLD, speed: 1.2, size: 0.02, life: 0.7 });
    this.pulse(slot, 0.7, 80);
  }

  /** The part near the hand, or the one the hand's ray points at. */
  private partUnder(slot: Slot, filter: (p: Part) => boolean): Part | null {
    this.handPosition(slot, _w);
    let best: Part | null = null;
    let bestD = NEAR_GRAB;
    for (const p of this.parts) {
      if (!filter(p)) continue;
      p.node.getWorldPosition(_v);
      const d = _v.distanceTo(_w);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    }
    if (best) return best;
    this.aim(slot);
    let bestRay = RAY_GRAB_DISTANCE;
    for (const p of this.parts) {
      if (!filter(p)) continue;
      p.node.getWorldPosition(_v);
      const d = raySphere(this.raycaster.ray.origin, this.raycaster.ray.direction, _v, RAY_GRAB_RADIUS);
      if (d !== null && d < bestRay) {
        best = p;
        bestRay = d;
      }
    }
    return best;
  }

  private updateParts(dt: number): void {
    for (const p of this.parts) {
      if (!p.node.visible) continue;
      p.spin += dt;
      const model = p.node.children[2];
      if (model) model.rotation.y = p.spin * 0.9;
      if (p.free) {
        // Assembly: floating in front of the player.
        p.node.position.lerp(p.home, Math.min(1, dt * 4));
        p.node.position.y = p.home.y + Math.sin(p.spin * 2) * 0.015;
      } else {
        p.node.position.y = p.home.y + 0.03 + Math.sin(p.spin * 2) * 0.02;
      }
    }
  }

  // ------------------------------------------------------------------ stage 3: assembly

  private startAssemble(): void {
    this.setStage('assemble');
    this.gunMode = 'none';
    const right = _v.crossVectors(_fwd, new Vector3(0, 1, 0)).normalize().clone();
    const forward = _fwd.clone().setY(0).normalize();
    this.goldenLoad
      .then(() => {
        this.parts.forEach((p, i) => {
          p.free = true;
          p.collected = false;
          p.home = _head.clone().addScaledVector(forward, 0.45).addScaledVector(right, (i - 1) * 0.2);
          p.home.y = _head.y - 0.25;
          p.node.position.copy(p.home);
          p.node.visible = true;
          const beacon = p.node.children[1];
          if (beacon) beacon.visible = false;
          this.particles.emit(p.home, { count: 25, color: GOLD, speed: 0.6, size: 0.015, life: 0.6 });
        });
      })
      .catch(() => undefined);
  }

  private tryHold(slot: Slot): void {
    if (!this.golden) return;
    const target = this.partUnder(slot, (p) => p.free && p.node.visible);
    if (!target) return;
    target.node.visible = false;
    target.free = false;
    slot.held.push(target.index);
    this.rebuildHeld(slot);
    this.audio.pickup();
    this.pulse(slot, 0.6, 60);
  }

  /** Shows a hand's parts as they sit in the complete gun, held at the grip. */
  private rebuildHeld(slot: Slot): void {
    const g = this.golden!;
    slot.heldGroup.clear();
    slot.heldGroup.rotation.set(-0.6, Math.PI, 0);
    for (const i of slot.held) slot.heldGroup.add(g.assembledParts[i]);
  }

  private updateAssemble(): void {
    const holders = this.slots.filter((s) => s.held.length);
    if (holders.length === 2) {
      const [a, b] = holders;
      if (this.handPosition(a, _v).distanceTo(this.handPosition(b, _w)) < MERGE_DISTANCE) {
        const into = a === this.gunSlot ? a : b === this.gunSlot ? b : a;
        const from = into === a ? b : a;
        into.held.push(...from.held);
        from.held = [];
        this.rebuildHeld(from);
        this.rebuildHeld(into);
        this.audio.snap(_v);
        this.particles.emit(_v.lerp(_w, 0.5), { count: 40, color: 0xffb040, speed: 1, size: 0.015, life: 0.5 });
        this.pulse(a, 0.9, 90);
        this.pulse(b, 0.9, 90);
      }
    }
    const done = this.slots.find((s) => s.held.length === 3);
    if (done && !this.assembledAt) {
      this.assembledAt = this.stageTime;
      done.held = [];
      this.rebuildHeld(done);
      this.mountGolden();
      this.audio.snap(this.handPosition(done, _v), true);
      this.audio.slide(_v, true);
      this.particles.emit(_v, { count: 90, color: GOLD, speed: 1.6, size: 0.02, life: 0.9 });
      this.pulse(done, 1, 200);
    }
    this.hud({ title: this.t.assembleTitle, lines: [this.assembledAt ? this.t.assembled : this.t.assembleText], accent: 'gold' });
    if (this.assembledAt && this.stageTime - this.assembledAt > 2.5) {
      this.cb.onStep(3);
      this.setStage('finale');
    }
  }

  private assembledAt = 0;

  private mountGolden(): void {
    if (!this.golden || this.goldMount) return;
    this.goldMount = mountGun(this.golden.gun, 0xffc040);
    this.gunSlot?.ray.add(this.goldMount.root);
    this.gunMode = 'gold';
  }

  // ------------------------------------------------------------------ stage 4: finale

  private updateFinale(dt: number): void {
    const rift = this.mainRift!;
    this.at(0.5, () => {
      rift.targetOpen = 1.0;
      rift.openSpeed = 0.35;
      rift.heat = 1.5;
      this.audio.rumble(rift.center, 3, 1.4);
      this.particles.emit(rift.point(0, 0, 0.1), { count: 120, color: 0xff5a1a, speed: 2, size: 0.03, life: 1.2, dir: rift.normal, spread: 0.8, gravity: 2 });
    });
    this.at(3, () => {
      rift.targetOpen = 1.3;
      this.big = this.horde.spawn(rift, { big: true, x: 0 });
      this.audio.groan(rift.center, true);
      this.audio.rumble(rift.center, 2, 1.6);
      this.particles.emit(rift.point(0, -0.2, 0.1), { count: 160, color: 0xff7a2a, speed: 2.6, size: 0.035, life: 1.4, dir: rift.normal, spread: 0.9, gravity: 3 });
    });
    if (this.big && this.big.phase === 'dying' && !this.sealPhase) {
      this.sealPhase = true;
      this.big = null;
      rift.targetOpen = 1;
      this.makeSeals(rift);
    }
    if (this.closing >= 0) {
      this.closing += dt;
      if (this.closing > 1.8) {
        this.closing = -2;
        this.cb.onStep(4);
        this.startReward();
        return;
      }
    }
    const lines = this.sealPhase ? [this.t.sealText] : this.stageTime > 3 ? [this.t.finaleBig] : [this.t.finaleText];
    this.hud({ title: this.t.finaleTitle, lines, accent: 'blood' });
    for (const s of this.seals) {
      const k = 1 + 0.25 * Math.sin(this.time * 6 + s.id);
      s.scale.setScalar(k);
    }
  }

  private makeSeals(rift: Rift): void {
    const geo = new SphereGeometry(0.07, 12, 8);
    for (const y of [0.55, 0, -0.5]) {
      const mat = new MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
      const seal = new Mesh(geo, mat);
      rift.point(0.04 * Math.sin(y * 9), y * rift.height * 0.5, 0.12, seal.position);
      seal.renderOrder = 12;
      this.scene.add(seal);
      this.seals.push(seal);
      this.particles.emit(seal.position, { count: 20, color: 0xffd060, speed: 0.6, size: 0.02, life: 0.5 });
    }
  }

  private hitSeal(origin: Vector3, dir: Vector3): { distance: number; seal: Mesh } | null {
    let best: { distance: number; seal: Mesh } | null = null;
    for (const seal of this.seals) {
      const d = raySphere(origin, dir, seal.position, 0.11);
      if (d !== null && (!best || d < best.distance)) best = { distance: d, seal };
    }
    return best;
  }

  private sealHit(seal: Mesh): void {
    const rift = this.mainRift!;
    this.scene.remove(seal);
    (seal.material as MeshBasicMaterial).dispose();
    this.seals = this.seals.filter((s) => s !== seal);
    this.particles.emit(seal.position, { count: 60, color: 0xffd060, speed: 1.5, size: 0.025, life: 0.8 });
    this.audio.snap(seal.position);
    rift.targetOpen = Math.max(0.15, rift.targetOpen - 0.3);
    if (!this.seals.length) {
      rift.targetOpen = 0;
      rift.openSpeed = 0.8;
      rift.heat = 2;
      this.closing = 0;
      this.audio.stopAmbience();
      this.audio.implode(rift.center);
      this.particles.emit(rift.point(0, 0, 0.05), { count: 200, color: 0xffa040, speed: 2.2, size: 0.03, life: 1.2 });
    }
  }

  // ------------------------------------------------------------------ stage 5: reward

  private startReward(): void {
    this.setStage('reward');
    const ms = (this.time - this.questStart) * 1000;
    this.rewardMs = ms;
    this.completed = true;
    this.cb.onStep(5);
    this.cb.onComplete(ms);
    this.particles.emit(_head.clone().addScaledVector(_fwd, 1), { count: 120, color: GOLD, speed: 1.4, size: 0.02, life: 1.2 });
  }

  private rewardMs = 0;

  private updateReward(): void {
    const best = this.cb.bestTime();
    this.panel.show({
      title: this.t.rewardTitle,
      lines: [this.t.rewardText, `${this.t.time}: ${formatTime(this.rewardMs)}${best ? `   ${this.t.best}: ${formatTime(best)}` : ''}`],
      accent: 'gold',
      buttons: [{ id: 'claim', label: this.t.claim }],
    });
    this.panel.placeInFront(_head, _fwd, 0.9, 0.1, 0.05);
    if (this.stageTime > 30) this.exit();
  }

  // ------------------------------------------------------------------ guns

  private updateGun(dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.recoil = Math.max(0, this.recoil - dt * 6);
    this.pistolMount.root.visible = this.gunMode === 'pistol';
    if (this.goldMount) this.goldMount.root.visible = this.gunMode === 'gold';
    const mount = this.gunMode === 'gold' ? this.goldMount : this.pistolMount;
    if (mount) {
      mount.root.rotation.x = this.recoil * 0.35;
      // Grip in the hand (controller or tracked hand), barrel along the ray.
      if (this.gunSlot) alignGrip(mount, this.gunSlot.ray, this.gunSlot.grip);
    }
    // The free hand shows a pointer while it can grab at a distance.
    for (const s of this.slots) s.laser.visible = Boolean(s.source) && s !== this.gunSlot && (this.stage === 'hunt' || this.stage === 'assemble' || this.panel.mesh.visible);
    if (this.gunSlot && this.panel.mesh.visible && (this.stage === 'scan' || this.stage === 'reward')) this.gunSlot.laser.visible = true;
    this.tracerTime -= dt;
    this.tracer.visible = this.tracerTime > 0;
    this.flash.visible = this.tracerTime > 0.03;
  }

  private updateHover(): void {
    if (!this.panel.mesh.visible) return;
    let hovered: string | null = null;
    for (const s of this.slots) {
      if (!s.source) continue;
      this.aim(s);
      hovered = this.panel.pick(this.raycaster) ?? hovered;
    }
    this.panel.hovered = hovered;
  }

  private shoot(): void {
    if (this.gunMode === 'none' || !this.gunSlot || this.cooldown > 0) return;
    const gold = this.gunMode === 'gold';
    const gun = gold ? this.golden!.gun : this.pistol;
    this.cooldown = gold ? DEAGLE_COOLDOWN : PISTOL_COOLDOWN;
    this.recoil = 1;
    const ray = this.gunSlot.ray;
    ray.updateMatrixWorld(true);
    gun.model.updateMatrixWorld(true);
    const origin = gun.model.localToWorld(gun.muzzle.clone());
    const dir = new Vector3(0, 0, -1).transformDirection(ray.matrixWorld);

    let end = origin.clone().addScaledVector(dir, 12);
    const seal = this.hitSeal(origin, dir);
    const hit = this.horde.raycast(origin, dir, 15);
    if (seal && (!hit || seal.distance < hit.distance)) {
      end = origin.clone().addScaledVector(dir, seal.distance);
      this.sealHit(seal.seal);
    } else if (hit) {
      end = hit.point;
      const damage = (gold ? 3 : 1) * (hit.head ? 2 : 1);
      // A kill plays the death cry (zombieDied), any other hit a grunt from the zombie's head.
      if (!this.horde.damage(hit.zombie, damage, hit.head)) this.audio.hit(hit.zombie.head, hit.head);
      this.particles.emit(hit.point, { count: hit.head ? 24 : 14, color: 0xff7a30, speed: 1.4, size: 0.018, life: 0.4, dir: dir.clone().negate(), spread: 0.9, gravity: 4 });
      this.particles.emit(hit.point, { count: 10, color: 0x6a0c08, speed: 0.8, size: 0.03, life: 0.6, gravity: 5 });
    }
    this.audio.shot(origin, gold);
    this.pulse(this.gunSlot, gold ? 1 : 0.7, gold ? 90 : 50);
    const pos = (this.tracer.geometry.attributes.position as BufferAttribute).array as Float32Array;
    pos.set([origin.x, origin.y, origin.z, end.x, end.y, end.z]);
    (this.tracer.geometry.attributes.position as BufferAttribute).needsUpdate = true;
    this.tracerTime = 0.06;
    this.flash.position.copy(origin);
    this.flash.lookAt(_head);
    this.particles.emit(origin, { count: gold ? 14 : 8, color: gold ? 0xffc050 : 0xffa040, speed: 1.2, size: 0.012, life: 0.18, dir, spread: 0.35 });
  }

  // ------------------------------------------------------------------ events

  private zombieDied(z: Zombie): void {
    this.kills++;
    this.audio.death(z.head, z.big);
    this.particles.emit(z.chest, { count: z.big ? 140 : 40, color: 0xff6a1a, speed: z.big ? 2 : 1.3, size: z.big ? 0.035 : 0.022, life: 0.9, gravity: 2 });
    if (z.big) this.audio.rumble(z.chest, 1.5, 1.2);
  }

  private playerHit(z: Zombie): void {
    if (this.downT >= 0 || this.stage === 'reward') return;
    this.health = Math.max(0, this.health - (z.big ? 2 : 1) / PLAYER_HITS);
    this.sinceHit = 0;
    this.hurt = Math.min(1, this.hurt + 0.45);
    this.audio.hurt();
    for (const s of this.slots) this.pulse(s, 1, 150);
    if (this.health <= 0) {
      // Down, not out: clear the space around the player and carry on with everything kept.
      this.downT = 0;
      this.horde.repel(_head, DOWN_CLEAR_RADIUS);
      this.audio.rumble(_head, 1.2, 0.7);
      for (const s of this.slots) this.pulse(s, 1, 400);
    }
  }

  /** Regeneration, the down moment and the red vignette (stronger the lower the health). */
  private updateHealth(dt: number): void {
    this.hurt = Math.max(0, this.hurt - dt * 1.6);
    if (this.downT >= 0) {
      this.downT += dt;
      this.horde.repel(_head, DOWN_CLEAR_RADIUS);
      this.hud({ title: this.t.downTitle, lines: [this.t.downText], accent: 'blood' }, 0.3, true);
      if (this.downT >= DOWN_TIME) {
        this.downT = -1;
        this.health = 1;
        this.sinceHit = Infinity;
      }
    } else {
      this.sinceHit += dt;
      if (this.sinceHit > REGEN_DELAY) this.health = Math.min(1, this.health + REGEN_PER_S * dt);
    }
    const low = this.downT >= 0 ? 1 : (1 - this.health) * 0.85;
    this.hurtMat.uniforms.uAmount.value = Math.min(1, Math.max(this.hurt, low));
  }

  private updateRiftEmbers(dt: number): void {
    for (const rift of [this.mainRift, this.sideRift]) {
      if (!rift || rift.open < 0.05) continue;
      if (Math.random() < dt * 30 * rift.open) {
        const y = (Math.random() - 0.5) * rift.height * 0.8 * Math.min(1, rift.open);
        rift.point((Math.random() - 0.5) * 0.12, y, 0.03, _v);
        this.particles.emit(_v, { count: 1, color: Math.random() < 0.3 ? 0xffd080 : 0xff5a1a, speed: 0.35, size: 0.016, life: 1.6, dir: rift.normal, spread: 0.6, gravity: -0.15 });
      }
    }
  }

  // ------------------------------------------------------------------ teardown

  private onSessionEnd(): void {
    if (this.ended) return;
    this.ended = true;
    this.renderer.setAnimationLoop(null);
    this.audio.stopAmbience();
    this.horde.dispose();
    this.mainRift?.dispose(this.scene);
    this.sideRift?.dispose(this.scene);
    disposeTree(this.scene);
    this.panel.dispose();
    this.renderer.dispose();
    this.cb.onEnd(this.completed);
  }
}

// ------------------------------------------------------------------ room helpers

/** A wall's horizontal axis and half extents along it and vertically. */
function wallFrame(wall: Surface): { horizontal: Vector3; halfWidth: number; halfHeight: number } {
  const ax = new Vector3().setFromMatrixColumn(wall.matrix, 0).normalize();
  const az = new Vector3().setFromMatrixColumn(wall.matrix, 2).normalize();
  if (Math.abs(ax.y) < Math.abs(az.y)) return { horizontal: ax.setY(0).normalize(), halfWidth: wall.halfX, halfHeight: wall.halfZ };
  return { horizontal: az.setY(0).normalize(), halfWidth: wall.halfZ, halfHeight: wall.halfX };
}

function orientedNormal(wall: Surface, head: Vector3): Vector3 {
  const n = wall.normal.clone().setY(0).normalize();
  if (n.dot(_w.subVectors(head, wall.center)) < 0) n.negate();
  return n;
}

/** The wall the player looks at, preferring big walls 1..5 m away. */
function pickMainWall(walls: Surface[], head: Vector3, forward: Vector3): Surface | null {
  let best: Surface | null = null;
  let bestScore = -Infinity;
  for (const w of walls) {
    const to = w.center.clone().sub(head).setY(0);
    const dist = to.length();
    const facing = dist > 0.01 ? to.divideScalar(dist).dot(forward) : 0;
    const width = wallFrame(w).halfWidth * 2;
    const score = (0.6 + 0.4 * facing) * Math.min(width, 4) - Math.abs(dist - 2.5) * 0.4 + (width < 1.1 ? -3 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = w;
    }
  }
  return best;
}

/** Rift center on a wall: where the view ray meets it (else the wall center), kept inside the wall, at door height. */
function riftSpot(wall: Surface, head: Vector3, forward: Vector3, floorY: number, offset: number): { center: Vector3; normal: Vector3 } {
  const normal = orientedNormal(wall, head);
  const frame = wallFrame(wall);
  let along = 0;
  const denom = forward.dot(normal);
  if (denom < -0.2) {
    const t = _v.subVectors(wall.center, head).dot(normal) / denom;
    const hit = head.clone().addScaledVector(forward, t);
    along = hit.sub(wall.center).dot(frame.horizontal);
  }
  const limit = Math.max(0, frame.halfWidth - 0.65);
  along = Math.max(-limit, Math.min(limit, along + offset));
  const center = wall.center.clone().addScaledVector(frame.horizontal, along);
  // Stay on the wall plane, just in front of it.
  center.addScaledVector(normal, -_v.subVectors(center, wall.center).dot(normal) + 0.005);
  center.y = floorY + 1.0;
  return { center, normal };
}

function insideSurface(s: Surface, p: Vector3, margin: number): boolean {
  _m.copy(s.matrix).invert();
  const local = p.clone().applyMatrix4(_m);
  const c = s.center.clone().applyMatrix4(_m);
  return Math.abs(local.x - c.x) < s.halfX - margin && Math.abs(local.z - c.z) < s.halfZ - margin;
}

function makeHalo(): Sprite {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,215,110,0.9)');
  grad.addColorStop(0.4, 'rgba(232,179,58,0.35)');
  grad.addColorStop(1, 'rgba(232,179,58,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const sprite = new Sprite(new SpriteMaterial({ map: new CanvasTexture(c), blending: AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
  sprite.scale.setScalar(0.42);
  sprite.renderOrder = 11;
  return sprite;
}

/** Light column above a part so it can be found across the room. */
function makeBeacon(): Mesh {
  const geo = new CylinderGeometry(0.035, 0.08, 1.2, 10, 1, true);
  geo.translate(0, 0.6, 0);
  const mat = new ShaderMaterial({
    uniforms: { uColor: { value: new Color(GOLD) } },
    vertexShader: 'varying float vY; void main() { vY = position.y / 1.2; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uColor; varying float vY; void main() { float a = (1.0 - vY) * 0.35; gl_FragColor = vec4(uColor * a, a); }',
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const beacon = new Mesh(geo, mat);
  beacon.renderOrder = 11;
  return beacon;
}

