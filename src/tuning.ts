// The renderer's knobs: presentation timings and levels, never rules (the rules' numbers live in
// crates/priveghi-engine/src/v3/config.rs). snake_case with units, as in the prototype.
export const TUNING = {
  tick_ms: 100, // how often the clock is asked whether dusk has fallen or the day has closed
  drag_slop_px: 6, // movement before a press stops being a tap (CSS px)
  toast_ms: 2800, // how long a tapped card's paper strip stays
  ui_gain: 0.5, // UI sounds about 6 dB under the chime and the toaca (brief §4 Audio)
  chime_hz: 1046.5, // C6: the chime's identity pitch, a constant of the house, not a knob
  ambience_gain: 0.012, // the wind in the spruce: barely there, so its removal is heard
  silence_s: 6, // the one great silence: the Uitare ending (charter section 6)
  ison_hz: 73.42, // D2: the drone when the Bride stands (brief §3.7)
  ison_gain: 0.07,
  ison_s: 12,
  ison_bend_cents: 40, // it bends once
  pool_open_ms: 1800, // the light pool opening after the boot (brief §3.1)
  long_press_ms: 500, // a hold this long opens the page
  settle_ms: 360, // a moved card rests one pixel short this long, then takes the last pixel (brief §8)
  dusk_fade_ms: 800, // the table darkens at dusk over this long (RULINGS R67)
  gone_ms: 900, // a guttered Dor fades this long before the stacks re-flow (step 3)
  // the plays (charter section 7, RULINGS R70)
  knock_tol_ms: 140, // mean error under this: Minunat
  knock_good_ms: 280, // under this: Bun; above: Slab
  knock_gaps_ms: [0, 520, 380, 640], // the rhythm the flame gives
  knock_hit_ms: 600, // the cat's victim stays knocked this long
  knock_lead_ms: 500, // the pause between the last lit dot and the tap zone opening (v5's lead)
  play_open_ms: 300, // the pause after the paper lands before the flame's first dot (the paper has no entrance)
  cat_ms: 1800, // the cat's crossing
  mask_ms: 1600, // the masked figure rising, bowing, sinking
  draft_ms: 1400, // the flame guttering under a hand
  // Spaima's tells (chapter section 8, RULINGS R69): drawn by the renderer from these thresholds, unsimulated; the engine never reads them
  tell_dog_spaima: 3, // the dog tied at the gate: on Curte
  tell_lintel_spaima: 4, // garlic on ARATA-TE's lintel, before any commit
  tell_garlic_spaima: 5, // garlic on Casa's window
  tell_horse_spaima: 7, // the Hunter's horse: on Sat (the well is not in the demo)
} as const;
