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
} as const;
