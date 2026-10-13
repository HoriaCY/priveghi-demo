# Priveghi — demo

A nine-day wake kept at a card table, in the browser. The rules engine is Rust compiled to
WebAssembly (`crates/priveghi-engine`); the renderer is TypeScript built with Vite. Static files
only: no server.

**Status: step 1 of 6.** The rules engine runs the day clock, Fir de dor decaying to Jale,
Umblă and Bocește; a browser harness logs one state transition to the console. The table
itself arrives in step 2. Open design calls are listed in [RULINGS.md](RULINGS.md).

## Build and test

Needs Rust (stable) with the `wasm32-unknown-unknown` target, `wasm-pack`, and Node 22+.

```sh
cargo test                       # every rule of the wake
npm install
npm run build                    # wasm-pack + type-check + vite build into dist/
npx playwright test              # the browser checks, against the built site
npm run check:privacy            # the privacy checklist below
```

`?seed=N` changes the wake's draws; the same seed plays the same beats.

## Privacy

Static files only. No analytics, no cookies, no accounts, no requests to any other host; fonts
are served from this site. Saves stay in this device's localStorage. `npm run check:privacy`
checks the repository, the build and the commit history for all of it.
