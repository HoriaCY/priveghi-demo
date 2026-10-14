// The renderer's knobs: presentation timings and levels, never rules (the rules' numbers live in
// crates/priveghi-engine/src/config.rs). snake_case with units, as in the prototype.
export const TUNING = {
  tick_ms: 100, // how often the clock is asked whether the day has closed
  drag_slop_px: 6, // movement before a press becomes a drag (CSS px)
  toast_ms: 2800, // how long a refusal's paper strip stays
  ui_gain: 0.5, // UI sounds about 6 dB under the chime and the toaca (brief §4 Audio)
  chime_hz: 1046.5, // C6: the chime's identity pitch, a constant of the house, not a knob
  held_note_hz: 293.66, // D4: Rada's held note when Jale is mourned
  held_note_s: 1.6,
  ambience_gain: 0.012, // the wind in the spruce: barely there, so its removal is heard
  silence_s: 6, // the one great silence (brief §3.7)
  ison_hz: 73.42, // D2: the drone of day nine (brief §3.7)
  ison_gain: 0.07,
  ison_s: 12,
  ison_bend_cents: 40, // it bends once
  pool_open_ms: 1800, // the light pool opening after the boot (brief §3.1)
  not_yet_ms: 1600, // LINES.notYet stands this long before the next wake
  long_press_ms: 500,
  settle_ms: 360, // a moved card rests one pixel short this long, then takes the last pixel (brief §8)
} as const;
