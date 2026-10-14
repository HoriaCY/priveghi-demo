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

export const SOUND = {
  /** Knuckle on hardwood: picking a card up, the flame's dry pre-cue, a refusal (lower). */
  tick(pitch = 1, gain: number = ui): void {
    const c = ctx;
    if (!c) return;
    const t = c.currentTime;
    tone(c, 280 * pitch, 170 * pitch, 0.05, 0.018, 0.5 * gain, t);
    noise(c, 0.035, 'lowpass', 1800 * pitch, 1, 0.35 * gain, t);
  },
  /** The chime: an inharmonic bell at C6 under a wooden tick. Stands in for the tallow hiss at the close. */
  chime(): void {
    const c = ctx;
    if (!c) return;
    SOUND.tick(1, 1);
    const t = c.currentTime;
    for (const [m, g] of [[1, 1], [2, 0.55], [2.76, 0.35], [4.07, 0.18]]) tone(c, TUNING.chime_hz * m, TUNING.chime_hz * m, 0.6, 0.16, 0.22 * g, t);
  },
  /** A thread pulled taut: a card placed. */
  thread(): void {
    const c = ctx;
    if (!c) return;
    const t = c.currentTime;
    noise(c, 0.09, 'bandpass', 500, 9, 0.5 * ui, t, 0.01).frequency.exponentialRampToValueAtTime(1400, t + 0.09);
  },
  /** A wax seal pressed: wax fed to the candle. */
  seal(): void {
    const c = ctx;
    if (!c) return;
    SOUND.tick(0.7);
    tone(c, 95, 70, 0.12, 0.05, 0.5 * ui, c.currentTime + 0.01);
  },
  /** The toaca: uneven strikes quickening, the "you are safe" signature of rest. */
  toaca(): void {
    if (!ctx) return;
    let t = 0;
    [0, 0.42, 0.36, 0.3, 0.26, 0.22, 0.2].forEach((gap, i) => {
      t += gap;
      setTimeout(() => SOUND.tick(i % 3 === 0 ? 0.85 : 1.05, 1), t * 1000);
    });
  },
  /** Rada's held note: grief mourned, nothing gained. */
  heldNote(): void {
    const c = ctx;
    if (!c) return;
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
