# Priveghi — demo

A nine-day wake kept at a card table, in the browser. The rules engine is Rust compiled to
WebAssembly (`crates/priveghi-engine`); the renderer is TypeScript built with Vite. Static files
only: no server.

**Status: step 2 of 6.** The rules engine runs the day clock, Fir de dor decaying to Jale,
Umblă and Bocește. The table is drawn from the engine's state with the prototype's components;
it takes no input yet. Open design calls are listed in [RULINGS.md](RULINGS.md); screenshots of
each step are in [docs/shots](docs/shots).

`?fixture=wake` shows a table in the middle of the wake; `?typetest` shows the diacritics test.

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
