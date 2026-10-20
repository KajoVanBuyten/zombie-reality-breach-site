// Procedural spatial sound for the quest: everything is synthesized with WebAudio (no sound files). Positional sounds
// go through an HRTF panner placed at the world position; the listener follows the headset camera every frame.

import type { Object3D, Vector3 } from 'three';
import { Matrix4, Quaternion, Vector3 as V3 } from 'three';

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

  /** Must be created inside a user gesture (the Enter button). */
  constructor() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    // Two seconds of white noise, reused by every noisy sound.
    const length = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }

  resume(): void {
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined);
  }

  close(): void {
    this.ambience?.stop();
    this.ctx.close().catch(() => undefined);
  }

  /** Moves the listener to the camera (call once per frame). */
  updateListener(camera: Object3D): void {
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
    const g = this.ctx.createGain();
    g.gain.value = gain;
    if (!at) {
      g.connect(this.master);
      return g;
    }
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = 0.8;
    p.rolloffFactor = 1.2;
    if (p.positionX) {
      p.positionX.value = at.x;
      p.positionY.value = at.y;
      p.positionZ.value = at.z;
    } else {
      p.setPosition(at.x, at.y, at.z);
    }
    g.connect(p).connect(this.master);
    return g;
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

  shot(at: Vector3, gold: boolean): void {
    const t = this.ctx.currentTime;
    const out = this.out(at, gold ? 1.1 : 0.8);
    this.noiseBurst(out, t, gold ? 0.32 : 0.18, 'bandpass', gold ? 900 : 1600, 0.7, 1);
    this.tone(out, 'sine', gold ? 140 : 190, 40, t, gold ? 0.3 : 0.16, 0.9);
    if (gold) this.tone(out, 'triangle', 2400, 1800, t, 0.25, 0.08); // metallic ring of the golden gun
  }

  hit(at: Vector3, head: boolean): void {
    const t = this.ctx.currentTime;
    const out = this.out(at, 0.8);
    this.noiseBurst(out, t, 0.12, 'lowpass', head ? 1800 : 700, 1, 0.9);
    if (head) this.tone(out, 'square', 320, 90, t, 0.1, 0.12);
  }

  /** Zombie moan; `big` is the finale zombie. */
  groan(at: Vector3, big = false): void {
    const t = this.ctx.currentTime;
    const out = this.out(at, big ? 1.4 : 0.55);
    const duration = big ? 2.2 : 0.9 + Math.random() * 0.6;
    const base = big ? 55 : 95 + Math.random() * 45;
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(base, t);
    o.frequency.linearRampToValueAtTime(base * (0.75 + Math.random() * 0.2), t + duration);
    const wobble = this.ctx.createOscillator();
    wobble.frequency.value = 5 + Math.random() * 3;
    const wobbleGain = this.ctx.createGain();
    wobbleGain.gain.value = base * 0.06;
    wobble.connect(wobbleGain).connect(o.frequency);
    const formant = this.ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.value = big ? 380 : 600 + Math.random() * 200;
    formant.Q.value = 2.5;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(1, t + 0.15);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(formant).connect(env).connect(out);
    o.start(t);
    wobble.start(t);
    o.stop(t + duration + 0.1);
    wobble.stop(t + duration + 0.1);
    if (big) this.noiseBurst(out, t, duration, 'lowpass', 220, 1, 0.5);
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
