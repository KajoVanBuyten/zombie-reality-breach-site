// Spatial sound for the quest. Zombie voices and gun shots are the game's recordings (public/breach/audio/, see
// CREDITS.md), decoded into AudioBuffers right when the session starts, so a shot plays without latency; the rift rumble,
// pickups and UI clicks stay synthesized. Positional sounds go through an HRTF panner; a zombie's voice follows its head
// while it plays, and at most MAX_VOICES zombie voices run at once. The listener follows the headset camera every frame.
// Master bus: gain -> compressor, so stacked shots and voices never clip.

import type { Object3D, Vector3 } from 'three';
import { Matrix4, Quaternion, Vector3 as V3 } from 'three';
import { asset } from '@/lib/site';

/** Sample banks: file stems under public/breach/audio/ (Zombie_Voice_XX and the shots of the game, Opus mono). */
const BANKS = {
  groan: ['zombie_groan_16', 'zombie_groan_17', 'zombie_groan_18', 'zombie_groan_21', 'zombie_groan_19', 'zombie_groan_20', 'zombie_groan_15', 'zombie_groan_09'],
  attack: ['zombie_attack_01', 'zombie_attack_12', 'zombie_attack_08', 'zombie_attack_04', 'zombie_attack_23', 'zombie_attack_02'],
  hit: ['zombie_hit_03', 'zombie_hit_05', 'zombie_hit_06', 'zombie_hit_07', 'zombie_hit_11', 'zombie_hit_13', 'zombie_hit_24'],
  death: ['zombie_death_10', 'zombie_death_14', 'zombie_death_22'],
  pistol: ['pistol_shot_1', 'pistol_shot_2', 'pistol_shot_3', 'pistol_shot_4'],
  deagle: ['deagle_shot_1', 'deagle_shot_2', 'deagle_shot_3'],
  pistolSlide: ['pistol_slide'],
  deagleSlide: ['deagle_slide'],
} as const;
type Bank = keyof typeof BANKS;

/** At most this many zombie voices at once; groans also keep a short gap between each other. */
const MAX_VOICES = 3;
const GROAN_GAP = 0.7;

interface Voice {
  src: AudioBufferSourceNode;
  panner: PannerNode | null;
  follow: Vector3 | null;
  priority: number;
  ended: boolean;
}

interface PlayOptions {
  /** Random pitch spread around `rate` (0.08 = 0.92..1.08). */
  pitch?: number;
  rate?: number;
  /** Panner follows the given vector while the sample plays (a zombie's head). */
  follow?: boolean;
  /** Zombie voice with this priority (limited to MAX_VOICES; a higher one replaces the weakest). */
  voice?: number;
}

const _pos = new V3();
const _fwd = new V3();
const _up = new V3();
const _q = new Quaternion();
const _m = new Matrix4();

export class QuestAudio {
  readonly ctx: AudioContext;
  private master: GainNode;
  private noise: AudioBuffer;
  private ambience: { stop(): void } | null = null;
  private buffers = new Map<Bank, AudioBuffer[]>();
  private next = new Map<Bank, number>();
  private voices: Voice[] = [];
  private lastGroan = -Infinity;
  /** Resolves when every sample is decoded (failed files are logged and skipped). */
  readonly ready: Promise<void>;

  /** Must be created inside a user gesture (the Enter button): the context starts (or is resumed) there. */
  constructor() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.resume();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 6;
    comp.ratio.value = 6;
    comp.attack.value = 0.002;
    comp.release.value = 0.15;
    this.master.connect(comp).connect(this.ctx.destination);
    this.ready = this.load();
    // Two seconds of white noise, reused by every noisy sound.
    const length = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }

  private async load(): Promise<void> {
    const jobs: Promise<void>[] = [];
    for (const bank of Object.keys(BANKS) as Bank[]) {
      const list: AudioBuffer[] = [];
      this.buffers.set(bank, list);
      for (const stem of BANKS[bank]) {
        jobs.push(
          fetch(asset(`breach/audio/${stem}.ogg`))
            .then((r) => {
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              return r.arrayBuffer();
            })
            .then((data) => this.ctx.decodeAudioData(data))
            .then((buffer) => {
              list.push(buffer);
            })
            .catch((error) => console.warn(`[breach] sound ${stem} not loaded`, error)),
        );
      }
    }
    await Promise.all(jobs);
  }

  /** Plays a sample of a bank (round robin, pitch varied), positional when `at` is given. False when skipped. */
  private play(bank: Bank, at: Vector3 | undefined, gain: number, options: PlayOptions = {}): boolean {
    const list = this.buffers.get(bank);
    if (!list || !list.length || this.ctx.state === 'closed') return false;
    if (options.voice !== undefined) {
      this.voices = this.voices.filter((v) => !v.ended);
      if (this.voices.length >= MAX_VOICES) {
        // A louder event (attack, death) takes the place of the weakest running voice; groans just wait their turn.
        const weakest = this.voices.reduce((a, b) => (a.priority <= b.priority ? a : b));
        if (weakest.priority >= options.voice) return false;
        weakest.ended = true;
        try {
          weakest.src.stop();
        } catch {
          /* already stopped */
        }
        this.voices = this.voices.filter((v) => v !== weakest);
      }
    }
    // Round robin from a random start, sometimes skipping one, so the same take never comes twice in a row.
    const i = this.next.get(bank) ?? Math.floor(Math.random() * list.length);
    const buffer = list[i % list.length];
    this.next.set(bank, (i + 1 + (list.length > 2 && Math.random() < 0.4 ? 1 : 0)) % list.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const spread = options.pitch ?? 0.08;
    src.playbackRate.value = (options.rate ?? 1) * (1 - spread + Math.random() * spread * 2);
    const { node, panner } = this.chain(at, gain);
    src.connect(node);
    src.start();
    if (options.voice !== undefined) {
      const v: Voice = { src, panner, follow: options.follow && at ? at : null, priority: options.voice, ended: false };
      src.onended = () => {
        v.ended = true;
      };
      this.voices.push(v);
    }
    return true;
  }

  resume(): void {
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined);
  }

  close(): void {
    this.ambience?.stop();
    this.ctx.close().catch(() => undefined);
  }

  /** Moves the listener to the camera and the running zombie voices to their heads (call once per frame). */
  updateListener(camera: Object3D): void {
    for (const v of this.voices) if (v.follow && v.panner && !v.ended) setPannerPosition(v.panner, v.follow);
    _m.copy(camera.matrixWorld);
    _m.decompose(_pos, _q, _up);
    _fwd.set(0, 0, -1).applyQuaternion(_q);
    _up.set(0, 1, 0).applyQuaternion(_q);
    const l = this.ctx.listener;
    const t = this.ctx.currentTime;
    if (l.positionX) {
      l.positionX.setValueAtTime(_pos.x, t);
      l.positionY.setValueAtTime(_pos.y, t);
      l.positionZ.setValueAtTime(_pos.z, t);
      l.forwardX.setValueAtTime(_fwd.x, t);
      l.forwardY.setValueAtTime(_fwd.y, t);
      l.forwardZ.setValueAtTime(_fwd.z, t);
      l.upX.setValueAtTime(_up.x, t);
      l.upY.setValueAtTime(_up.y, t);
      l.upZ.setValueAtTime(_up.z, t);
    } else {
      l.setPosition(_pos.x, _pos.y, _pos.z);
      l.setOrientation(_fwd.x, _fwd.y, _fwd.z, _up.x, _up.y, _up.z);
    }
  }

  /** Output node at a world position (or the plain master bus without one). */
  private out(at?: Vector3, gain = 1): AudioNode {
    return this.chain(at, gain).node;
  }

  private chain(at: Vector3 | undefined, gain: number): { node: AudioNode; panner: PannerNode | null } {
    const g = this.ctx.createGain();
    g.gain.value = gain;
    if (!at) {
      g.connect(this.master);
      return { node: g, panner: null };
    }
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = 0.8;
    p.rolloffFactor = 1.2;
    setPannerPosition(p, at);
    g.connect(p).connect(this.master);
    return { node: g, panner: p };
  }

  private noiseBurst(dest: AudioNode, start: number, duration: number, filter: BiquadFilterType, freq: number, q = 1, peak = 1): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.value = freq;
    f.Q.value = q;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(peak, start + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    src.connect(f).connect(env).connect(dest);
    src.start(start, Math.random());
    src.stop(start + duration + 0.05);
  }

  private tone(dest: AudioNode, type: OscillatorType, from: number, to: number, start: number, duration: number, peak: number): void {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, start);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(peak, start + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    o.connect(env).connect(dest);
    o.start(start);
    o.stop(start + duration + 0.05);
  }

  /** Gun shot at the muzzle: the A3500X (Michel Baradari, CC-BY 3.0) or the golden Desert Eagle (CC0). */
  shot(at: Vector3, gold: boolean): void {
    this.play(gold ? 'deagle' : 'pistol', at, gold ? 0.75 : 0.6, { pitch: 0.04 });
  }

  /** Slide racked: the pistol appears in the hand, or Breach Gold is assembled. */
  slide(at: Vector3 | undefined, gold: boolean): void {
    this.play(gold ? 'deagleSlide' : 'pistolSlide', at, 0.6, { pitch: 0.03 });
  }

  /** A zombie is hit: short pained grunt from its head. */
  hit(at: Vector3, head: boolean): void {
    this.play('hit', at, head ? 0.9 : 0.75, { follow: true, voice: 2 });
  }

  /** Zombie groan from its head; `big` is the finale zombie (louder, lower). Skipped while too many voices run. */
  groan(at: Vector3, big = false): void {
    const t = this.ctx.currentTime;
    if (!big && t - this.lastGroan < GROAN_GAP) return;
    const played = this.play('groan', at, big ? 1.2 : 0.6, { follow: true, voice: big ? 3 : 1, pitch: big ? 0.04 : 0.08, rate: big ? 0.8 : 1 });
    if (played) this.lastGroan = t;
  }

  /** Zombie attack shout, louder than a groan. */
  attack(at: Vector3, big = false): void {
    this.play('attack', at, big ? 1.3 : 1.0, { follow: true, voice: 3, rate: big ? 0.82 : 1 });
  }

  /** Zombie death cry. */
  death(at: Vector3, big = false): void {
    this.play('death', at.clone(), big ? 1.3 : 0.95, { voice: 4, pitch: big ? 0.03 : 0.08, rate: big ? 0.8 : 1 });
  }

  /** Low rumble with a crack, used when a rift tears open, widens or the wall breaks. */
  rumble(at: Vector3, duration: number, loud = 1): void {
    const t = this.ctx.currentTime;
    const out = this.out(at, loud);
    this.noiseBurst(out, t, duration, 'lowpass', 140, 0.8, 1);
    this.noiseBurst(out, t + 0.05, 0.35, 'highpass', 2200, 0.5, 0.35);
    this.tone(out, 'sine', 48, 32, t, duration, 0.6);
  }

  pickup(at?: Vector3): void {
    const t = this.ctx.currentTime;
    const out = this.out(at, 0.5);
    [660, 880, 1320].forEach((f, i) => this.tone(out, 'sine', f, f, t + i * 0.07, 0.35, 0.5));
  }

  snap(at?: Vector3, final = false): void {
    const t = this.ctx.currentTime;
    const out = this.out(at, 0.8);
    this.noiseBurst(out, t, 0.06, 'highpass', 3000, 0.7, 0.8);
    this.tone(out, 'triangle', 1400, 1200, t, 0.4, 0.25);
    if (final) [523, 659, 784, 1047].forEach((f, i) => this.tone(out, 'sine', f, f, t + 0.1 + i * 0.09, 0.9, 0.35));
  }

  hurt(): void {
    const t = this.ctx.currentTime;
    const out = this.out(undefined, 0.6);
    this.noiseBurst(out, t, 0.25, 'lowpass', 400, 1, 1);
    this.tone(out, 'sine', 110, 50, t, 0.3, 0.6);
  }

  /** Implosion when a rift closes. */
  implode(at: Vector3): void {
    const t = this.ctx.currentTime;
    const out = this.out(at, 1.2);
    this.tone(out, 'sawtooth', 600, 30, t, 1.4, 0.35);
    this.noiseBurst(out, t, 1.2, 'lowpass', 900, 1, 0.8);
  }

  /** Quiet looping drone at the main rift while it is open. */
  startAmbience(at: Vector3): void {
    this.ambience?.stop();
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 180;
    const out = this.out(at, 0.35);
    const o = this.ctx.createOscillator();
    o.frequency.value = 41;
    const og = this.ctx.createGain();
    og.gain.value = 0.25;
    src.connect(f).connect(out);
    o.connect(og).connect(out);
    src.start();
    o.start();
    this.ambience = {
      stop: () => {
        try {
          src.stop();
          o.stop();
        } catch {
          /* already stopped */
        }
      },
    };
  }

  stopAmbience(): void {
    this.ambience?.stop();
    this.ambience = null;
  }
}

function setPannerPosition(p: PannerNode, at: Vector3): void {
  if (p.positionX) {
    p.positionX.value = at.x;
    p.positionY.value = at.y;
    p.positionZ.value = at.z;
  } else {
    p.setPosition(at.x, at.y, at.z);
  }
}
