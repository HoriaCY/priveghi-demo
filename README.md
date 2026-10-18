# Priveghi — demo

A card table kept at a wake, where the dead is you. For nine days you lie on the plank at your own
wake as Cel Nenuntit, the one who died unwed; the living send threads of longing (*dor*), and what
you make of them before they gutter is what they will remember of you. A small game for the browser:
landscape, phone first, also on tablets and desktops. Rules in Rust compiled to WebAssembly
(`crates/priveghi-engine`); the table drawn in SVG by code (`src/`). Static files only.

**Play: https://horiacy.github.io/priveghi-demo/**

## On a phone

1. Open the link in Safari, and turn the phone sideways.
2. Touch the dark: a match is struck at the troiță. Touch again, and they bring you home: the candle
   is lit at your head, the table opens, one line is said.
3. For full screen: Share → Add to Home Screen, then open Priveghi from its icon.

The wake is saved in this browser only; add `?reset` to the link to begin again. The dead's wake
has no dice (`?seed` is gone): who sends Dor, and when, follows the living's standing and the days,
so every wake deals the same first table and differs only by what is done at it.

## How it plays (the game itself has no instructions)

- **A day is 60 seconds.** The candle at the cloth's edge burns down in real time; at the fortieth
  second dusk falls, the table darkens and the living at the table fall asleep; the day closes at
  the sixtieth. Tap the flame (STINGE) and the night begins now, and the village notices. Tap the
  troiță (ODIHNEȘTE-TE) to rest: the flame gutters once and the dawn comes with your strength back.
- **Dor.** The living send longing of five kinds, each a bond with one of them: *neam* (kin, the
  mother), *dragoste* (love, the betrothed), *frate* (the sworn brother), *vrajbă* (enmity, the
  enemy), *rugăciune* (prayer, the priest). A Dor lies on the cloth with three grains on its edge;
  one falls at each close, and at none it gutters into Uitare (oblivion), written on your card
  without a numeral: the colour thins at 2, the knot on its hem breaks at 4, an eye opens at 6,
  the cord frays at 8. At 9 you are gone. The forecast under your card reads Uitare now and at the
  next three dawns if nothing is done.
- **Acts.** Drag a Dor onto a thing of the house (URNEȘTE, the knock), onto someone asleep at night
  (ȘOPTEȘTE, the dream), onto a person by day or a place (ARATĂ-TE, the apparition). The hem of the
  thing and its owner's chip say how well it matches: the mother's longing in the mother's kerchief
  is the full two, a living memory. Tap any card and the strip names it, its kind, its owner; with a
  Dor in hand it names what the two would make. A thing used rests for three days in the pile at
  the kit row's end. Every act spends Putere (the drops by the candle); rest refills them.
- **The plays.** The knock: a paper rises, the flame gives a rhythm on four dots, you tap it four
  times on that beat. The dream: six small Dor faces, pick three for the sleeper (their affinities
  and the Dor's kind). On the beat, Minunat; near it, Bun; off it, the house's cat takes the blame.
  `Sari peste` skips any play at Bun: the cat crosses and knocks the cup over, a draft bends the
  flame under a cupped hand, or on the vigil nights a masked player of the wake games bows.
- **Pomenire.** Every act makes the living name you, which takes Uitare off; a wonder (two points
  on the beat) leaves its Semn on the cloth and holds the next memorial. The living hold your
  memorial meals on the third and the ninth day if the house still remembers (the dishes on the
  far side); if not, nobody makes colivă. On the third day you are buried: the cross stands on the
  plank in your place.
- **Spaimă.** Acts by day frighten the village: the dog is tied in the yard, garlic goes up on the
  house and on the ARATĂ-TE lintel, the Hunter's horse stands in the village. At six the priest
  comes with holy water and cords two verbs for three days; at nine the Hunter.
- **BÂNTUIE and ASCULTĂ.** Drag a place into BÂNTUIE and you are there at once; what it holds comes
  to the kit (the porch gives the knife and the flute). Drag a person into ASCULTĂ for a fragment of
  what they say of you. Drag a Dor onto the troiță to tie it on the sill, which slows its guttering.
- **The ninth close.** If little enough was forgotten the Bride stands in the dark door, her wreath
  the one blue on the table: your card dragged onto the door is TRECI, the wedding. A tap on her
  figure on the page is the refusal, and you remain (Rătăcire). Above the threshold the door stays
  dark and the page shows the last memorial and Rătăcire. Uitare's page says nothing; the Hunter's
  says „Vânătorul.". A tap on any ended page begins another wake, in the dark.

## A winning wake

The game has no instructions; this is the route the review fixture `door` plays (the considered
hand of the chapter's simulator), which reaches the Bride on the ninth day.

1. Each day, let the candle burn down (or tap the flame at once): the acts are cheaper at night,
   and on the first two nights the masked players take the blame.
2. At night, drag the oldest Dor onto the thing of the house that matches it: the mother's longing
   on her kerchief or her icon, the betrothed's on the ring, the brother's on the cup or the flute,
   the enemy's on the knife or the mirror, the priest's on the icon. Two knocks a night; play them or
   skip them.
3. When the village is loud (the dog tied in the yard), do nothing that night: tap the troiță and
   rest, and the house calms.
4. Haunt the porch once (drag Tindă into BÂNTUIE) for the knife and the flute.
5. On the ninth day, if little enough was forgotten, the Bride stands in the door: drag your card
   onto it.

Let every Dor gutter instead and you are gone, in Uitare, on the seventh day.

## What is on the table

The numbers match [docs/shots/v3-step-2/annotated-1280x720.png](docs/shots/v3-step-2/annotated-1280x720.png)
(`?fixture=wake&annotate`: the fifth day of a considered hand).

1. **The far seat**: the other side of the table, face-down backs, an unlit candle, and the memorial
   dishes the living set on their side: waiting, held (colivă with a cross) or missed (dark).
2. **ODIHNEȘTE-TE**, the troiță niche, the only roofed one: an icon on gold, a flame that never goes
   out, and on its ledge the sill where three Dor can be tied. A tap on it rests the dead.
3. **The screen of verbs**: BÂNTUIE, ASCULTĂ, URNEȘTE, ȘOPTEȘTE, ARATĂ-TE, each lintel with its
   mark. A verb at work seats the Dor in its heart and the target at its side, under a thin gold rim;
   the priest's cords cross URNEȘTE and ARATĂ-TE while his service runs.
4. **The dark door**: on the ninth day, if little enough was forgotten, the Bride stands in it and
   TRECI is written under it.
5. **The plank** with your card: your body under the sheet, a candle at the head, the red-and-white
   thread; Uitare written on it in the corruption grammar. After the burial, the cross.
6. **The tally**: five bands, one per person who sends Dor, each in their motif, its ink deeper the
   more they hold you; a mark per memory kept: a dot for a faded one, a short stroke, a tall stroke
   for a living one, a small cross for a wonder.
7. **The forecast** (*prevestire*): Uitare now, then at the next three dawns if nothing is done.
8. **The cloth row**: the Dor by sender and days left (a count tag when stacked), the fragments and
   the Semn, and at the right end the living present today (dimmed, asleep, at night).
9. **The kit and the road**: the house's things with their owner's chip, the pile of things that
   rest, then the places; a spread hand when more arrive than fit, every card's left edge its own.
10. **STINGE**, the table candle: its height is the time left to dusk; out through the night; whole
    again at a lit dawn; unlit all day once the house stops lighting it.
11. **Putere**: four drops, the dead's one stat; a knock, a dream or a haunt spends one, an
    apparition two, listening none; rest refills them.
12. **Bread and salt.**

## Type

Three self-hosted OFL faces: Cormorant Unicase (titles, card names), Alegreya (body) and
Alegreya SC (labels), subset to the Romanian alphabet with the comma below. The test string,
which every face must render with Ș and Ț carrying a comma (never a cedilla) and no fallback face:

> „Osândă, șchiopătând prin țară: Ăă Ââ Îî Șș Țț”

## Saves

The wake is saved in this browser's localStorage (`priveghi.v3`) at the boot, every close, every
ending, when the tab is hidden, and at another wake. A save carries a version (1) and a journal:
every move that changed this wake since it began (its seat, its time, its action), from a full copy
of the state it began in, so the wake replays exactly (the replay a phone's bug report needs; one
day a server's input). A journal is only replayed by the rules that wrote it: a save whose journal
a later build no longer replays keeps its state, and its journal begins again at that load. A save
from before the version (`{"state": …}`) goes on where it was, its journal beginning at that load. A save this build cannot read (a newer build's, or a damaged one) is never
thrown away: it is kept aside under `priveghi.v3.refused` (one slot, the latest), a new wake begins
in the dark, and after „Te-au adus acasă." the strip says, once, „Priveghiul acela e din altă
vreme." (in the sitting that found it, and never over a strip a tap called up: it waits until the
strip is clear; a tab closed in the dark before the boot loses the line, never the save). `?reset` wipes both keys; a review fixture reads and writes neither. The format and the policy are in
[docs/ENGINE_API.md](docs/ENGINE_API.md).

## Privacy

Static files only, on GitHub Pages: no server, no accounts, no analytics, no cookies, and no
requests to any other site (the fonts are served from here). The wake is saved only in this
device's localStorage. `npm run check` verifies all of it on every build, along with the commit
history. Credits and the font licences: [credits](https://horiacy.github.io/priveghi-demo/credits.html)
and [CREDITS.md](CREDITS.md).

A native build never phones home unless the player opts in. Anything that would (a crash report,
say) ships off, asks once, and stays off when the player says no, with the features that depend on
it disabled. Today nothing phones home: the privacy check fails on any network plugin, network
crate, updater or outside origin in the native shell's CSP, and on a signing team in any tracked
file. A crash reporter, when one is ruled in, amends that check with its consent gate (Horia,
2026-10-18).

## QA

[docs/QA_SCRIPT.md](docs/QA_SCRIPT.md) is the tester's script: an end-to-end winning wake, the five
endings and how to reach each by hand, the saves, the plays, the odd corners, and the questions
only a sit on a phone can answer. Every expected state in it was checked against the engine.

## Build and test

Needs Rust 1.92.0 with the `wasm32-unknown-unknown` and `wasm32-wasip1` targets (pinned in
`rust-toolchain.toml`; on a toolchain installed before the second was pinned, `rustup target add
wasm32-wasip1`), `wasm-pack`, Node 24, and [wasmtime](https://wasmtime.dev) for the rules on wasm32. The engine's contract (the entry
points, the move and its seat, the actions, the refusals, the View, the save) is
[docs/ENGINE_API.md](docs/ENGINE_API.md); changes to it are rulings.

```sh
cargo test                       # every rule of the wake; the reference run byte for byte; the save and its replay
CARGO_TARGET_WASM32_WASIP1_RUNNER=wasmtime cargo test -p priveghi-engine --target wasm32-wasip1   # the same, on wasm32
cargo build -p priveghi-engine --target wasm32-unknown-unknown --release   # the rules for the browser, outside Vite
npm install
npm run build                    # wasm-pack + type-check + vite build into dist/
npx playwright test              # the browser checks, against the built site
npm run check                    # Romanian strings, the palette law, the privacy checklist
npm run test:live                # the deployed site: boots in the dark, asks nothing of any other host
```

Every push to `main` runs all of it in GitHub Actions and deploys `dist/` to Pages.
Review views: `?fixture=start|night|played|wake|soroc|dark|preot|tarus|door|ninth|uitare` (a
fixture is a list of actions the engine plays; it never touches the saved wake), `?still` (the
clock stops), `?annotate`, `?typetest`, `?sheet` (every card face), `?icon`, `?reset`.

## On your own phone (the native shell)

`src-tauri/` is a Tauri 2 app that packs this same web build (`dist/`: the page, the scripts, the
WebAssembly engine, the fonts) into an iPhone app: one full-screen web view on the bundled files,
holding no rule and drawing nothing of its own. It exists so the sits can be made in the container
a store build would be, before style-lock (Horia, 2026-10-18).

**What changes against the website:** the app holds landscape itself (no rotate card); it is
offline by construction (every file is inside the app, nothing is fetched); the wake is saved in
the app's own storage, apart from Safari's (deleting the app is the reset, since there is no address
bar for `?reset`); there is no browser around the table (no address bar, no browser gestures, no
scroll bounce). **What does not change:** the same web build and renderer; sound is the same Web
Audio as on the web, starting on the first touch; no Android yet (there is no Android SDK on this
Mac); and this is not a store build (a debug build signed with your Apple ID, Safari's Web
Inspector can attach to it). CI does not build the shell, and `cargo test` at the root never
compiles it (the workspace excludes `src-tauri`, which keeps its own `Cargo.lock`).

**You need:** a Mac with Xcode (26.4 here) and its iOS simulators; Rust's simulator target
(`rustup target add aarch64-apple-ios-sim`; the phone's target is added by the first phone build);
your Apple ID signed into Xcode (Settings → Accounts); the iPhone and its cable, with Developer
Mode on (Settings → Privacy & Security → Developer Mode, offered after the first install attempt).

```sh
npm ci
# in the simulator
xcrun simctl boot "iPhone 17 Pro" && open -a Simulator
npm run shell:ios:sim       # builds the web and the app for the simulator, installs it, launches it
npm run shell:ios:review    # the same app opened on ?fixture=wake&still (the fifth day, the clock still)
# on your iPhone
npm run shell:ios           # builds the web, opens Xcode, and waits: keep this terminal open
```

In Xcode, once: the `priveghi-shell_iOS` target → Signing & Capabilities → Team: your personal
team. Pick your iPhone as the run destination and press Run. The first launch asks you to trust
the developer on the phone (Settings → General → VPN & Device Management). **Never commit the
team:** Xcode (or `APPLE_DEVELOPMENT_TEAM` set in your shell) writes `DEVELOPMENT_TEAM` into
`src-tauri/gen/apple/priveghi-shell.xcodeproj/project.pbxproj`; `npm run check` fails while it is
there, and `git restore` of that one file before a commit puts it back. With a free Apple ID the
install expires after 7 days (run it from Xcode again); a paid developer account gives a year and
TestFlight. `npm run shell:mac` builds and opens the same app as a Mac window (1280×720); it has
not been run yet.

**What only the phone can judge:** the touch under a thumb (cards drag, the view does not move);
the home indicator (a swipe up from the bottom edge leaves the app, and the cloth's lowest row
lies near it); the silent switch and Web Audio (whether the chime is heard with the switch on);
the safe areas around the Dynamic Island and the home bar. In the simulator (the device held
upright, the app turned to landscape) the web view gave the page the upright insets (62 px top,
34 bottom, none at the sides), so the table drew at 0.425 of its reference size, where the
landscape insets (62 at each side, 21 below) would give 0.53: compare the table with the
home-screen copy in Safari, and if the shell's is smaller on the phone too, that is its next fix.

The generated Xcode project (`src-tauri/gen/apple/`) is committed without its build outputs;
`npm run tauri -- ios init` was run once, and re-running it checks for CocoaPods and
libimobiledevice, which this project never calls (it has no pods, and the Xcode route streams no
device log). The icons are cut from the app's own `?icon` view: `npm run shell:icons`, with
`npx vite preview --port 4173 --strictPort` running.

## The turnover to the dead's wake

The fiction turned over on 2026-10-13: the player is the dead, Cel Nenuntit at his own wake
(`SYSTEMS_v3_MORTUL.md` and its addendum, in the loki repository). The watcher's demo (steps 1–6 of
the first brief, rulings R1–R47) was rebuilt in six steps, each on its own branch:

1. **The engine** (2026-10-14, R48–R59): Dor by sender and kind, the house's things with their
   affinities and owners, the living who come to the table, Uitare, Spaimă, Putere, the plays'
   grades, the close in the chapter's order, the soroace, the burial, the priest, the Hunter, the
   five endings. Its integration test plays the chapter's considered dead for nine days and prints,
   byte for byte, what the chapter's simulator printed (`tests/fixtures/v3_chibzuit_9.txt`).
2. **The table** (2026-10-16, R60–R95): drawn from the engine at three sizes; the candle in time, the
   dusk, the strip with the Dor in hand.
3. **The gestures and the knock** (2026-10-17, R96–R114): the drags that commit, Bocănit, the skip's
   cat and draft, STINGE and rest by touch, the close's visible beats.
4. **The night and the endings** (2026-10-17, R115–R132): Vis, the mask, the priest and the tells,
   the dishes, the burial, her door.
5. **The boot and the page** (2026-10-17, R133–R138): the dark, the match, the fade and the stake,
   the saves, the three compositions.
6. **The watcher leaves** (2026-10-17, R139 on): the first engine, its tests and its screenshots are
   gone; the final pictures are in `docs/shots/v3-final/`.

## What has and has not been checked

Everything above runs in Chromium under Playwright at 844×390, 1024×768 and 1280×720: zero console
errors, no element outside the viewport, no request to any other origin, the six fonts loaded, every
gesture and every ending reached from the engine's own state; the same build, served under the
native shell's CSP, breaks no directive. The shell has run only in the iOS Simulator (iPhone 17 Pro,
iOS 26.4): the review build draws the fifth day in WKWebView
([docs/shots/shell/wake-iphone-17-pro-simulator.png](docs/shots/shell/wake-iphone-17-pro-simulator.png)),
and a scratch build with a diagnostic script counted no CSP violation and no error, with the six
fonts loaded. Nothing here has run on a phone. On a
phone, look for: dragging moves cards and not the page; sound starts after the first touch; the
home-screen copy opens full screen; nothing sits under the notch or the home bar; leaving and
returning resumes the wake. What
only a phone can judge: the sizes (the hems, the count tags, the forecast's numerals, the dream's
tiles under a thumb), the dusk and the fade, whether the cat and the mask read as the house's cover
story, whether the rules read without a word of instruction. Every number that governs feel is a
knob in `src/tuning.ts` (the renderer's) or `crates/priveghi-engine/src/v3/config.rs` (the rules').

## Design

The rules and their numbers come from the demo brief, its v3 addendum and the systems chapter;
every judgment call made while building is in [RULINGS.md](RULINGS.md), each with its source and
the alternative. Every Romanian string is a draft for review and lives in `src/strings.ts`. The card
pictures are code-drawn stand-ins; each kind has one image slot, so painted art can replace them
without touching the rules.
