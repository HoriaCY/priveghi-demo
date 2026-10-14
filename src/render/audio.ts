// Material sounds synthesized from the prototype's recipes (its make_sfx.py lineage): a knuckle on
// hardwood, a thread pulled taut, a page, a wax seal, a match, the toaca, the chime at C6 over a wooden
// tick. Nothing beeps. The context opens on the first touch (iOS needs a gesture).
import { TUNING } from '../tuning';

let ctx: AudioContext | null = null;

export function unlockAudio(): void {
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

function noise(c: AudioContext, dur: number, type: BiquadFilterType, f: number, q: number, gain: number, t0: number, attack = 0.003): BiquadFilterNode {
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const flt = c.createBiquadFilter();
  flt.type = type;
  flt.frequency.value = f;
  flt.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(flt).connect(g).connect(c.destination);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
  return flt;
}

function tone(c: AudioContext, f0: number, f1: number, dur: number, tau: number, gain: number, t0: number): void {
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.setTargetAtTime(0.0001, t0, tau);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + tau * 6);
}

const ui = TUNING.ui_gain;

/** The one great silence: no sound of any kind until this moment (AudioContext time). */
let mutedUntil = 0;
const muted = () => !ctx || ctx.currentTime < mutedUntil;

let wind: { gain: GainNode } | null = null;

/** The room: wind in the spruce, barely there, so that its removal can be heard. */
export function startAmbience(): void {
  const c = ctx;
  if (!c || wind) return;
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown noise
    d[i] = last * 3.5;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.07;
  const depth = c.createGain();
  depth.gain.value = 140;
  lfo.connect(depth).connect(lp.frequency);
  const gain = c.createGain();
  gain.gain.value = 0.0001;
  gain.gain.exponentialRampToValueAtTime(TUNING.ambience_gain, c.currentTime + 3);
  src.connect(lp).connect(gain).connect(c.destination);
  src.start();
  lfo.start();
  wind = { gain };
}

/** The one great silence (LINES.sabbathWater): the room goes away and nothing sounds, for six seconds, once. */
export function silence(seconds: number): void {
  const c = ctx;
  if (!c) return;
  const t = c.currentTime;
  mutedUntil = t + seconds;
  if (wind) {
    wind.gain.gain.cancelScheduledValues(t);
    wind.gain.gain.setValueAtTime(Math.max(0.0001, wind.gain.gain.value), t);
    wind.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    wind.gain.gain.setValueAtTime(0.0001, t + seconds);
    wind.gain.gain.exponentialRampToValueAtTime(TUNING.ambience_gain, t + seconds + 2);
  }
}

export const SOUND = {
  /** Knuckle on hardwood: picking a card up, the flame's dry pre-cue, a refusal (lower). */
  tick(pitch = 1, gain: number = ui): void {
    const c = ctx;
    if (!c || muted()) return;
    const t = c.currentTime;
    tone(c, 280 * pitch, 170 * pitch, 0.05, 0.018, 0.5 * gain, t);
    noise(c, 0.035, 'lowpass', 1800 * pitch, 1, 0.35 * gain, t);
  },
  /** The chime: an inharmonic bell at C6 under a wooden tick. Stands in for the tallow hiss at the close. */
  chime(): void {
    const c = ctx;
    if (!c || muted()) return;
    SOUND.tick(1, 1);
    const t = c.currentTime;
    for (const [m, g] of [[1, 1], [2, 0.55], [2.76, 0.35], [4.07, 0.18]]) tone(c, TUNING.chime_hz * m, TUNING.chime_hz * m, 0.6, 0.16, 0.22 * g, t);
  },
  /** A thread pulled taut: a card placed. */
  thread(): void {
    const c = ctx;
    if (!c || muted()) return;
    const t = c.currentTime;
    noise(c, 0.09, 'bandpass', 500, 9, 0.5 * ui, t, 0.01).frequency.exponentialRampToValueAtTime(1400, t + 0.09);
  },
  /** A page: soft paper noise with a slow envelope. The door's answer. */
  page(): void {
    const c = ctx;
    if (!c || muted()) return;
    noise(c, 0.16, 'lowpass', 2600, 0.7, 0.25 * ui, c.currentTime, 0.05);
  },
  /** A wax seal pressed: wax fed to the candle, coliva laid on the plank. */
  seal(): void {
    const c = ctx;
    if (!c || muted()) return;
    SOUND.tick(0.7);
    tone(c, 95, 70, 0.12, 0.05, 0.5 * ui, c.currentTime + 0.01);
  },
  /** The toaca: uneven strikes quickening, the "you are safe" signature of rest. */
  toaca(): void {
    if (muted()) return;
    let t = 0;
    [0, 0.42, 0.36, 0.3, 0.26, 0.22, 0.2].forEach((gap, i) => {
      t += gap;
      setTimeout(() => SOUND.tick(i % 3 === 0 ? 0.85 : 1.05, 1), t * 1000);
    });
  },
  /** A match struck: a scrape, then a small bloom. The boot's first sound. */
  match(): void {
    const c = ctx;
    if (!c || muted()) return;
    const t = c.currentTime;
    noise(c, 0.12, 'highpass', 1800, 0.8, 0.4, t, 0.02);
    noise(c, 0.25, 'lowpass', 900, 0.7, 0.2, t + 0.1, 0.06);
  },
  /** The ison on day nine: a held D under everything, that bends once. */
  ison(): void {
    const c = ctx;
    if (!c || muted()) return;
    const t = c.currentTime;
    const hold = TUNING.ison_s;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(TUNING.ison_gain, t + 2.5);
    g.gain.setValueAtTime(TUNING.ison_gain, t + hold - 3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + hold);
    g.connect(c.destination);
    for (const [f, type, level] of [[TUNING.ison_hz, 'triangle', 1], [TUNING.ison_hz * 2, 'sine', 0.45]] as const) {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      // the one bend: a breath flat, and back
      const bend = f * Math.pow(2, -TUNING.ison_bend_cents / 1200);
      o.frequency.setValueAtTime(f, t + hold * 0.45);
      o.frequency.linearRampToValueAtTime(bend, t + hold * 0.45 + 1.2);
      o.frequency.linearRampToValueAtTime(f, t + hold * 0.45 + 2.4);
      const lv = c.createGain();
      lv.gain.value = level;
      o.connect(lv).connect(g);
      o.start(t);
      o.stop(t + hold + 0.1);
    }
  },
  /** Rada's held note: grief mourned, nothing gained. */
  heldNote(): void {
    const c = ctx;
    if (!c || muted()) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = TUNING.held_note_hz;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.35);
    g.gain.setValueAtTime(0.12, t + TUNING.held_note_s - 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + TUNING.held_note_s);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + TUNING.held_note_s + 0.05);
  },
};
