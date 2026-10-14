# Priveghi — demo

A nine-day wake kept at a card table, in the browser. The rules engine is Rust compiled to
WebAssembly (`crates/priveghi-engine`); the renderer is TypeScript built with Vite. Static files
only: no server.

**Status: step 5 of 6: the whole wake.** A cold start is a dark frame: touch it, a match is
struck, the troiță's flame catches, and the candle on its sill, carried into the troiță, becomes
the table's candle as the light opens. Then the full loop: wander, mourn, listen, speak at the
dark door, host the peddler, make colivă and lay it on Cel Nenuntit on days 3 and 9. Tap a card
for its strip; tap again or hold for the page (beside or below the table on an iPad or desktop,
over it on a phone). Day nine brings the ison: the Pomelnic if both marks were kept; otherwise
the Bride's wreath, and „Nu încă.” begins another wake with one less wax. The wake is saved on
this device; `?reset` clears it. Open design calls are listed in [RULINGS.md](RULINGS.md);
screenshots of each step are in [docs/shots](docs/shots).

`?fixture=wake` shows a table in the middle of the wake, `?fixture=frant` a broken watcher;
`?still` stops the clock; `?typetest` shows the diacritics test; `?sheet` shows every card face.

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

## Build and test

Needs Rust (stable) with the `wasm32-unknown-unknown` target, `wasm-pack`, and Node 22+.

```sh
cargo test                       # every rule of the wake
npm install
npm run build                    # wasm-pack + type-check + vite build into dist/
npx playwright test              # the browser checks, against the built site
npm run check                    # Romanian strings guard + the privacy checklist below
```

`?seed=N` changes the wake's draws; the same seed plays the same beats.

## Type

Three self-hosted OFL faces: Cormorant Unicase (titles, card names), Alegreya (body) and
Alegreya SC (labels), subset to the Romanian alphabet with the comma below. The test string,
which every face must render with Ș and Ț carrying a comma (never a cedilla) and no fallback face:

> „Osândă, șchiopătând prin țară: Ăă Ââ Îî Șș Țț”

## Privacy

Static files only. No analytics, no cookies, no accounts, no requests to any other host; fonts
are served from this site. Saves stay in this device's localStorage. `npm run check:privacy`
checks the repository, the build and the commit history for all of it.
