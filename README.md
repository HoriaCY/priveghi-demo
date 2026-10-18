# Priveghi — demo

A card table kept at a wake. For nine days you keep vigil beside one who died unwed, mourning
threads of longing (*dor*) before they turn to grief (*jale*). A small game for the browser:
landscape, phone first, also on tablets and desktops. Rules in Rust compiled to WebAssembly
(`crates/priveghi-engine`); the table drawn in SVG by code (`src/`). Static files only.

**Play: https://horiacy.github.io/priveghi-demo/**

## On a phone

1. Open the link in Safari, and turn the phone sideways.
2. Touch the dark. A match is struck and the shrine's flame catches; carry the candle lying on
   its sill into the shrine. The table opens.
3. For full screen: Share → Add to Home Screen, then open Priveghi from its icon.

The wake is saved in this browser only; add `?reset` to the link to begin again. `?seed=N`
deals a different wake; the same seed plays the same beats.

## How it plays (the game itself has no instructions)

Drag cards into the niches; everything happens when the day closes, after 60 seconds or when
you tap the candle's flame. Wander Codrii Vlăsiei (UMBLĂ) for threads of longing; each loses a
grain a day and turns to grief, so give them to Rada (BOCEȘTE) in threes. Listen to the lullaby
(ASCULTĂ) for a name and speak it at the dark door (DESCÂNTĂ) for a blessing. The peddler comes
with the fourth wander; host him (GĂZDUIEȘTE) for wheat, and with no guest the hearth turns
wheat into colivă. Lay colivă on Cel Nenuntit on days 3 and 9. Feed the candle; rest with the
flask at the shrine (ÎNCHINĂ-TE); tie threads on its sill to keep them. Tap a card to read it;
tap again for the page.

## A winning wake

The game has no instructions; this route keeps both marks (the browser check `loop.spec.ts` plays
exactly it). Tap the flame to end a day early.

1. Day 1: Grâu into GĂZDUIEȘTE (makes colivă), Codrii Vlăsiei into UMBLĂ.
2. Day 2: wander.
3. Day 3: Colivă onto Cel Nenuntit (the plank, far left); wander.
4. Day 4: wander; the fourth wander brings the peddler.
5. Day 5: Negustor and Fier de baltă into GĂZDUIEȘTE.
6. Day 6: Grâu into GĂZDUIEȘTE (the colivă for day 9). Days 7 and 8: end the day.
7. Day 9: Colivă onto Cel Nenuntit, end the day: the Pomelnic.

Tap the flame nine times with nothing placed and the Bride comes instead.

## Checked, and not

Checked: the rules (`cargo test`), the browser flows at 844×390, 1024×768 and 1280×720 with a
mouse (`npx playwright test`), and the deployed site (`npm run test:live`). Not checked: any real
phone or touch screen. On a phone, look for: dragging moves cards and not the page; sound starts
after the first touch; the home-screen copy opens full screen; nothing sits under the notch or the
home bar; leaving and returning resumes the wake.

## What is on the table

The numbers match [docs/shots/step-2/annotated-1280x720.png](docs/shots/step-2/annotated-1280x720.png)
(`?fixture=wake&annotate`).

1. **The far seat**: another player's face-down cards and their unlit candle. On day nine the
   Bride's wreath lands here.
2. **ÎNCHINĂ-TE**, the troiță niche, the only roofed one: an icon on gold and a flame that never
   goes out. The flask here closes the day; a Fir de dor here is tied and stops decaying.
3. **The verb niches**: UMBLĂ (wander), ASCULTĂ (listen), DESCÂNTĂ (speak a charm), BOCEȘTE
   (mourn), GĂZDUIEȘTE (host). Cards dropped in act when the day closes.
4. **A working niche**: Bocește holding Rada and three Fir de dor. The taper beside it burns down
   one step a day; the thin gold rim shows while it works.
5. **The dark door**: Descântă's answer comes through it. Nothing is dropped on it.
6. **The plank** with Cel Nenuntit, the one who died unwed. Colivă laid on him on days 3 and 9
   keeps his marks.
7. **The kit and the road**: Codrii Vlăsiei (the place you wander), the flask, candles, wheat,
   bog iron, salt.
8. **The cloth**: Rada, the peddler, Fir de dor (three grains, one falls each day; at none it
   turns to Jale), the lullaby, names, laments, colivă.
9. **LUMÂNARE**, the table candle: its height is the wax left; a candle card goes in its dish.
   Tap its flame to close the day. The three wax drops under it are Vigoare.
10. **Bread and salt.**
11. **Jale's corner**: grief from threads nobody mourned. Three Jale break the watcher (Frânt)
    and the niches lock until it is mourned.

## Type

Three self-hosted OFL faces: Cormorant Unicase (titles, card names), Alegreya (body) and
Alegreya SC (labels), subset to the Romanian alphabet with the comma below. The test string,
which every face must render with Ș and Ț carrying a comma (never a cedilla) and no fallback face:

> „Osândă, șchiopătând prin țară: Ăă Ââ Îî Șș Țț”

## Privacy

Static files only, on GitHub Pages: no server, no accounts, no analytics, no cookies, and no
requests to any other site (the fonts are served from here). The wake is saved only in this
device's localStorage. `npm run check` verifies all of it on every build, along with the commit
history. Credits and the font licences: [credits](https://horiacy.github.io/priveghi-demo/credits.html)
and [CREDITS.md](CREDITS.md).

## Build and test

Needs Rust (stable) with the `wasm32-unknown-unknown` target, `wasm-pack`, and Node 24.

```sh
cargo test                       # every rule of the wake
npm install
npm run build                    # wasm-pack + type-check + vite build into dist/
npx playwright test              # the browser checks, against the built site
npm run check                    # Romanian strings, the palette law, the privacy checklist
```

Every push to `main` runs all of it in GitHub Actions and deploys `dist/` to Pages.
Review views: `?fixture=start|wake|frant|broken`, `?still` (the clock stops), `?annotate`,
`?typetest`, `?sheet` (every card face), `?icon`.

## Turning over to the dead's wake

The fiction turned over on 2026-10-13: the player is the dead, Cel Nenuntit at his own wake
(`SYSTEMS_v3_MORTUL.md` and its addendum, in the loki repository). The turnover is built one
step at a time; the site above still plays the watcher's wake until the renderer follows.

- **Step 1 (done):** the dead's engine, `crates/priveghi-engine/src/v3/` — Dor by sender and kind,
  the house's things with their affinities and owners, the living who come to the table, Uitare,
  Spaimă, Putere, the plays' grades, the close in the chapter's order, the soroace, the burial, the
  priest, the Hunter, the five endings. Its integration test plays the chapter's considered dead for
  nine days and must print, byte for byte, what the chapter's simulator printed
  (`tests/fixtures/v3_chibzuit_9.txt`). Rulings R48–R56.
- Steps 2–6: the table, the plays, the dream and the priest, the page, polish — each its own branch.

## Design

The rules and their numbers come from the demo brief and the systems chapter; every judgment
call made while building is in [RULINGS.md](RULINGS.md), each with its source. Every Romanian
string is a draft for review and lives in `src/strings.ts`. The card pictures are code-drawn
stand-ins; each kind has one image slot, so painted art can replace them without touching the
rules.
