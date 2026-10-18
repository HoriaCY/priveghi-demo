# Priveghi demo — the QA script

A practical script for one person with a phone: every run below is a sequence of touches, with what
the table should show after each. Use it to judge two things the code cannot: whether the wake
**feels** like something worth tending, and whether the rules **read** from the table alone (the game
has no instructions, by ruling). Nothing here teaches the player; it only tells the tester where to
look.

Every "expect" line was checked against the engine (`cargo test`, 2026-10-18), not against the
design documents. Nothing has run on a phone yet: the first time any of this is seen on glass is
yours, and that is the point of the script.

## 0. Before you start

**Device.** Phone first (Safari, landscape; optionally Share → Add to Home Screen for full screen).
A desktop browser is fine for the fast failure runs; the page then lies open beside the table. The
layout at three sizes is in `docs/shots/v3-final/`.

**Starting over.** Three ways:

- `https://horiacy.github.io/priveghi-demo/?reset` wipes the saved wake and lands in the dark.
- After any ending, a tap on the paper page begins another wake in the dark.
- Closing the tab does **not** reset: the wake is saved at every dawn and resumes.

**Fast-forwarding.** Two gestures move time, and you will use them constantly:

- **Tap the flame** (the table candle, right side of the cloth; STINGE): the night begins now.
  Costs Spaimă +1. Refused in silence if it is already night.
- **Tap the troiță** (the roofed niche, far left; ODIHNEȘTE-TE): the flame gutters once and the day
  closes at once (dawn). Refills Putere, Spaimă −1. Refused with a low tick if you already acted this
  night, or while a play is open.

So a day you want to skip is one tap on the troiță; the full nine days of doing nothing take about
a minute. A day you want to play is: look at the cloth, maybe act by day, tap the flame, act at
night, then tap the troiță or wait out the night.

**The clock.** A day is 60 s. The candle burns down over the first 40 s (day), dusk darkens the
table, the last 20 s are night; the day closes at 60 s on its own. The tab losing focus pauses
the clock.

**Review shortcuts** (`?fixture=` jumps straight to a state; it never touches your saved wake):
`start`, `night`, `played`, `wake` (day 5), `soroc` (day 4), `dark` (a day without a candle),
`preot`, `tarus`, `door` (the Bride stands), `ninth` (the door stays dark), `uitare`. Add `&still`
to stop the clock. Use these to check a screen; use the runs below to check the game.

**How to take notes.** One line per observation, in two bins: a **number** ("the knock is too fast",
"a day is too long", "the hems are too small") moves a knob without a ruling; a **rule** ("a Dor on
a person by day should be refused", "the Bride should not be offered on day 9") needs your word.
Section 10 lists the questions the build cannot answer.

## 1. What is on the table (orientation, two minutes)

Run this once on a fresh wake, before any mechanic. The numbers match the annotated shot
`docs/shots/v3-step-2/annotated-1280x720.png` and the README's list.

- [ ] Open `?reset`. Expect: a dark frame, no text, no sound.
- [ ] Touch anywhere. Expect: a match sound; a small pool of light opens on the troiță.
- [ ] Touch again (or wait ~1 s). Expect: the table lights; the candle appears at your head on the
  plank; the thread, the toaca and the chime sound; after ~2 s the strip says „Te-au adus acasă."
  Day tag reads „Ziua întâi".
- [ ] Rotate to portrait. Expect: a quiet rotate card. Rotate back.
- [ ] Find, without being told: the plank with **your card** (Cel Nenuntit, far left) and the
  **forecast** tag under it (`prevestire 0 · 0 · 0 · 3`); the five **tally bands** under your card;
  the **cloth row** (Dor cards, then Mama, Frate de cruce, Rada); the **kit row** (Cană, Broboadă,
  Inel, Icoană, Oglindă) and the **road** (Casă, Tindă, Curte); the **candle** (STINGE) with four
  **Putere** drops; the **far seat** with four face-down backs and two dark **soroc** dishes; the
  **screen of verbs** (ODIHNEȘTE-TE, BÂNTUIE, ASCULTĂ, URNEȘTE, ȘOPTEȘTE, ARATĂ-TE) and the **dark
  door** at the right.
- [ ] Tap the day tag. Expect: on the phone the paper **page** folds over the right side (Uitare,
  prevestire, Spaimă, Putere, Soroc dishes, the five people's bands); a tap on the page folds it
  away. On a tablet or desktop the page is always open beside or below.
- [ ] Tap any card. Expect: the **strip** names it, its kind labels (hem), its owner. Tap a Dor,
  then tap Broboadă: the strip ends with what the two would make („Amintire vie" for Dorul mamei on
  Broboadă). Tap a second time or hold: the page opens on that card.
- [ ] Watch for 40 s doing nothing. Expect: the candle's height falls visibly; at 40 s a dry tick,
  the table darkens (dusk), the living's cards dim (asleep) except Rada's; the candle stands out.
  At 60 s: a 0.4 s gutter, the chime, „Ziua a doua", the candle whole again.

Write down: did the table read as a wake? Did anything look still or dead for a whole minute? Were
the hems, the count tags and the forecast numerals legible at arm's length?

## 2. Run A — the winning wake (Nuntă), about 10 minutes

This is the route the engine's `door` fixture plays. It reaches the Bride on the ninth close with
Uitare 0. You will do more than the fixture (plays, listening, the sill) so the mechanics get seen.

**The rule you are testing.** A Dor (a thread of longing) lies on the cloth with three grains on its
edge; one falls at each dawn; at none it gutters and Uitare +1 on your card. Dragging a Dor onto a
thing of the house is URNEȘTE (the knock, a play); onto a sleeper at night is ȘOPTEȘTE (the dream,
a play); onto a person by day or onto a place is ARATĂ-TE (the apparition, no play, frightening).
The match is two points: the thing is of the Dor's **kind** (hem), and the thing is **theirs**
(owner chip). The best matches on day one: Dorul mamei → Broboadă or Icoană (2), Dorul drăguței →
Inel (2), Dorul dușmanului → Oglindă (1; the knife is on the porch).

### Day 1 („Ziua întâi")

- [ ] Cloth: three Dor (Dorul mamei, Dorul dușmanului, Dorul drăguței), Mama, Frate de cruce, Rada.
  Forecast `0 · 0 · 0 · 3`. Putere 4. Spaimă 0.
- [ ] **BÂNTUIE the porch**: drag Tindă into the BÂNTUIE niche. Expect: a thread sound; Cuțit and
  Fluier appear in the kit row; Putere 3. (Dragging Tindă there a second time costs another Putere
  and brings nothing: note whether that reads as a mistake the table should refuse.)
- [ ] **Tap the flame.** Expect: a blow; „S-a stins lumânarea." on the strip; the table darkens;
  Mama and Frate de cruce dim as sleepers. Spaimă 1. The page shows Spaimă 1 (no tell yet).
- [ ] **The knock**: drag Dorul mamei onto Broboadă. Expect: the Dor seats in URNEȘTE's heart, the
  kerchief at its side; the **Bocănit** paper rises: four dots light to the flame's rhythm (ticks),
  then the wolf-tooth tap zone opens. Tap it four times on that beat. Expect: Minunat (mean error
  under 140 ms) → the strip says „Minune · Mama · Pomenire" and a **Semn** card appears on the cloth;
  Bun (under 280 ms) → „Amintire vie · Mama · Pomenire"; worse → the cat crosses without knocking
  anything over and the act still counts as Bun. Putere 2. On the vigil nights (days 1–2) a night
  act costs no Spaimă: Spaimă stays 1.
- [ ] Check the tally: the Mama band under your card gained a mark (tall stroke for a living memory,
  a small cross for a Minune). The kerchief moved to the **resting pile** at the kit row's end,
  dimmed, with a count tag; its strip lists it with three strokes (three closes).
- [ ] **The dream**: drag Dorul drăguței onto Frate de cruce (asleep). Expect: the **Vis** paper, six
  small Dor faces (neam, dragoste, frate, vrajbă, rugăciune, then the Dor's kind again). The right
  ones are the Dor's kind (dragoste) and the sleeper's affinities (frate, dragoste). Pick three.
  3 right → Minunat; 2 → Bun; fewer → the mask bows (vigil nights) and it still resolves as Bun.
  Putere 1. The Drăguță band gains a mark.
- [ ] Try a second dream tonight: drag Dorul dușmanului onto Mama. Expect: refused (low tick, the
  card glides back). One dream a night.
- [ ] Try to rest now: tap the troiță. Expect: refused (low tick): a night act cords the troiță.
- [ ] Wait for the close (or do nothing). Expect: the gutter, the chime, „Ziua a doua". Putere 3
  (+2, capped at 4). Dorul dușmanului now shows two grains. New Dor arrive: Dorul fratelui, Dorul
  preotului (strongest longing first, at most three a day).

### Day 2 („Ziua a doua")

- [ ] Drăguță has come to the table (from day 2). Frate de cruce is still here (vigil night).
- [ ] **The sill**: drag Dorul dușmanului onto the troiță niche. Expect: it ties on the sill (thread
  sound); its grains stop falling at every dawn (the sill slows it: one grain every third dawn after
  tying). Drag it back to the bare cloth to untie. The sill holds three.
- [ ] **Listen**: drag Mama into the ASCULTĂ niche. Expect: a page sound; a **Frântură** card on the
  cloth; Putere unchanged (listening is free). A second Frântură is allowed; a third is refused.
  A Dor dragged onto a Frântură is a knock worth one point whatever the hems.
- [ ] Tap the flame; dream Drăguță with her own longing if one is on the cloth (2 points, the full
  „Amintire vie"), or knock Dorul fratelui on Cană (2). Note the skip: press **Sari peste** on a play.
  Expect: a masked player rises over the far side and bows (days 1–2); the act resolves as Bun.
- [ ] Close the day (wait, or tap the troiță if you did not act tonight).

### Day 3 („Ziua a treia") — the burial and the first memorial

- [ ] Rada is here (days 1–3), Frate de cruce too. Keep matching: oldest Dor first (fewest grains).
  Things used on day 1 are still resting (three closes).
- [ ] At the close, expect in this order: any guttered Dor fades where it lay; the **soroc** is held
  if Uitare < 6 (toaca sound; the third-day dish on the far side becomes colivă with a cross; the
  page's Soroc row shows it held); **the burial**: your card leaves the plank and a **Cruce** stands
  in its place, Uitare now drawn on the cross; **Sat** and **Biserică** appear on the road.

### Days 4–8

- [ ] The held memorial's afterglow: one extra Dor a day for five days, above the usual cap — the
  cloth gets busier. Watch the forecast; it reads Uitare now and at the next three dawns if you do
  nothing.
- [ ] **The village at night**: after the flame is out, drag Sat into BÂNTUIE. Expect: Dușman comes
  to the cloth as a sleeper tonight; a dream with Dorul dușmanului on him is the full two points and
  a *vrajbă* memory calms the house (Spaimă −1). Drag Biserică into BÂNTUIE: Preot comes, and stays
  known from then on. By day the village is refused (low tick).
- [ ] **Day acts and fright**: on one calm day knock by day (Spaimă +2). Expect the **dog** tied on
  Curte at Spaimă 3, **garlic on ARATĂ-TE's lintel** from 4, **garlic on Casă's window** at 5. Spaimă
  falls one at every dawn (two if you rest). Stay under 6 or the priest comes (Run D).
- [ ] **A Minunat dream** leaves a **pomană de vis** in the kit row at dawn (owner the sleeper,
  affinity the Dor's kind), usable for three days, then it leaves.
- [ ] **The same sleeper two nights running**: the dream is capped at one point and Spaimă +1. Note
  whether anything on the table tells you why.
- [ ] Rest on a loud night: tap the troiță at dusk without acting. Expect: the flame gutters, dawn,
  Putere 4, Spaimă −2 in all.

### Day 9 („Ziua a noua") — the door

- [ ] Frate de cruce and Rada are back (a soroc day). By day, read the **first forecast number**:
  it is Uitare at tonight's close before anything else happens. **≤ 3: the Bride will stand.**
  4–5: the door stays dark and the ninth memorial is held (Run C). ≥ 6: the memorial is skipped
  and the wake ends in Uitare (Run F). Acts tonight pull the number down.
- [ ] At the close, expect: an ison drone bends once; the **Bride** stands in the dark door, her
  wreath the one blue on the table; **TRECI** is written under the door; every gold but the troiță's
  dims; nothing else can be carried. On the phone the page does not open on its own (it would cover
  the door): the day tag opens it, and shows her figure with no title.
- [ ] **TRECI**: drag your card (the cross on the plank) onto the door. Expect: the door takes it;
  the page opens with the dishes, then the title „Nuntă" and her figure; your card is gone from the
  plank.
- [ ] Tap the page. Expect: the dark; a new wake waits for a touch.

## 3. Run B — refuse the Bride (Rătăcire), one extra minute

- [ ] Reach the door (Run A, or `?fixture=door`). Open the page (day tag on the phone). Tap the
  **Bride's figure** on the page (not the paper around her). Expect: the ending page „Rătăcire"; the
  wreath leaves the door. A tap on the paper around her must do nothing.
- [ ] Tap the page: another wake in the dark.

## 4. Run C — the ninth close with the door dark, Rătăcire with the meal held

Reachable only with Uitare **4 or 5** at the ninth close. The `ninth` fixture is the considered
hand one knock short on the last night. By hand: play Run A through day 6, then stop acting and
rest at dusk; from day 8 watch the forecast's third number and act once if it reads 9; on day 9 the
first number must read 4 or 5.

- [ ] Expect at the close: no Bride; the ninth dish becomes colivă (held: Uitare under 6, −3); the
  page shows the dishes row, then „Rătăcire".
- [ ] Note: the page where the ninth meal is **missed** and you still remain cannot be reached in the
  nine-day demo: a skipped memorial adds 3, and from 6 that is the Uitare ending (Run F).

## 5. Run D — the priest (Spaimă 6), two minutes

Fright is counted by act: URNEȘTE 2 by day / 1 by night, ARATĂ-TE 3 / 2, STINGE 1, ȘOPTEȘTE 0; on
days 1–2 night acts are free. At a close with Spaimă ≥ 6 the priest comes.

- [ ] Fresh wake. By day, drag Dorul mamei onto **Mama** (a person by day = an apparition, 2 Putere,
  Spaimă 3). Expect: no play; a transition (the cat knocks the cup over, or the mask) and „Amintire
  vie · Mama · Pomenire" counted double (by day). The dog appears on Curte.
- [ ] Drag Dorul drăguței onto Mama again. Expect: Spaimă 6, Putere 0; garlic on the lintel and on
  Casă's window; the page reads Spaimă 6. (Leave Dorul dușmanului alone: a *vrajbă* memory would
  calm the house by one.)
- [ ] Close the day (the troiță, or wait). Expect: „Preotul a venit cu apă sfințită." on the strip and
  the page; hemp **cords** cross URNEȘTE and ARATĂ-TE; Spaimă reads 2 (reset to 3, then the dawn's
  decay); the tells are gone.
- [ ] Days 2–4 under the cord: a Dor on any thing or place or on a person by day is refused (low
  tick, the card returns, nothing spent). A dream at night still works. Each dawn the priest names
  you: the page's Uitare drops one if it had any.
- [ ] Day 5: the cords are gone. Note whether three locked days read as a punishment or as a pause.
- [ ] **Dezlegare** (the priest's third service) cannot be reached in the nine-day demo: the only
  schedule that fits (services at the closes of days 1, 5 and 9) meets the Bride first at the ninth
  close. The page title exists for M1.

## 6. Run E — the Hunter (Țăruș), two days

- [ ] Fresh wake. Day 1 by day: Dorul mamei onto Mama (apparition, Spaimă 3); Dorul drăguței onto
  Inel (knock by day, Spaimă 5; play or skip it). Putere 1. Close the day. Expect: Spaimă 4 at dawn
  (no priest: he comes at 6).
- [ ] Day 2 (Putere 3; the cloth holds Dorul dușmanului, Dorul fratelui, Dorul preotului): Dorul
  fratelui onto Mama (Spaimă 7), Dorul preotului onto any ready thing (Spaimă 9, Putere 0), tap the
  flame. Expect the tells build: dog, lintel garlic, window garlic. **The horse does not appear**:
  it stands on Sat, which is not on the road before the burial (day 3).
- [ ] Close the day. Expect: „Vânătorul." on the strip; the stake's shadow falls across your card over
  0.6 s and nothing moves after; the page: dishes, the line, „Țăruș". No sound but one dry tick.
- [ ] Optional, to see the horse: on day 3 or later with Spaimă 0, two apparitions by day and the
  flame bring Spaimă to 7 before the close; the horse stands on Sat until the dawn, when the priest
  comes.

## 7. Run F — the Uitare ending (gone), one minute

The idle dead. Tapping the troiță every day is identical to doing nothing (rest refills Putere and
calms the house; Uitare only counts the Dor you left).

- [ ] Fresh wake. Tap the troiță once per day and read the forecast each dawn. Expect:

| Dawn of | Uitare | Forecast | What happened at the close before |
|---|---|---|---|
| day 2 | 0 | 0 · 3 · 5 | nothing; Dorul fratelui and Dorul preotului arrived |
| day 3 | 0 | 3 · 5 · 6 | nothing |
| day 4 | 0 | 2 · 3 · 5 | day one's three Dor guttered (+3); the memorial held (−3); the burial |
| day 5 | 2 | 3 · 5 · 8 | two guttered |
| day 6 | 3 | 5 · 8 · 9 | one guttered |
| day 7 | 5 | 8 · 9 · 9 | two guttered; **the candle is not lit**: „Azi nu a aprins nimeni lumânarea." — the day begins as night |
| close of day 7 | 9 | — | three guttered (8), the dark dawn (+1): **Uitare** |

- [ ] Watch your card's hem as Uitare rises: the colour thins at 2, the knot breaks at 4, an eye opens
  at 6, the cord frays at 8 (on the cross after day 3). No numeral on the table; the page has it.
- [ ] At the end: the table fades to limewash over 6 s; the wind stops (the one great silence); the
  page shows only „Ziua a șaptea". Tap it: the dark.
- [ ] Note: a wake that ends this way never shows a missed memorial. „Nimeni n-a făcut colivă." can
  only be heard at the ninth close with Uitare 6–8, and the Uitare ending follows in the same
  breath (Run C's note).

## 8. Run G — saves, pause, resume

- [ ] Mid-day, lock the phone or switch tabs. Return. Expect: the candle resumes where it was (the
  clock paused); nothing was lost.
- [ ] Reload the page mid-wake. Expect: the same day, the last line the table spoke on the strip
  and the page, no sound replayed.
- [ ] Reload while a Bocănit paper is open. Expect: the paper comes back (the rhythm restarts).
- [ ] Reload on an ended page. Expect: the same ended page (the ending is saved). Tap it, then
  reload: the dark (the save moved to the new wake).
- [ ] `?reset` at any time. Expect: the dark; a new day one.
- [ ] An old save, from before the version, resumes. A phone that played the demo before this
  build reached the site already holds one: open the link. To plant one on a desktop browser: play
  to day 2, then open `credits.html` on the same site (a page with no table, so nothing saves over
  what you plant), and in the devtools console run
  `const w = JSON.parse(localStorage.getItem('priveghi.v3')); localStorage.setItem('priveghi.v3', JSON.stringify({ state: w.state }))`;
  then open the game. Expect: the same day, no dark, no new wake; after the next dawn, devtools →
  Application → Local Storage shows `priveghi.v3` beginning `{"version":1,` again.
- [ ] A save from a newer build is kept aside and the line is said. Plant it the same way, from
  `credits.html`:
  `const w = JSON.parse(localStorage.getItem('priveghi.v3')); localStorage.setItem('priveghi.v3', JSON.stringify({ ...w, version: 99 }))`;
  then open the game. Expect: the dark, no text. Touch twice: „Te-au adus acasă.", and once the strip
  clears, „Priveghiul acela e din altă vreme." on the strip, once. Local Storage shows
  `priveghi.v3.refused` holding the version-99 save and `priveghi.v3` the new wake; `?reset` removes
  both. Note whether the line reads as the house's own voice or as an error message.

## 9. Run H — the plays and the skip, in detail

Do these inside any run; they are the "fun" the design rests on.

- [ ] **Bocănit**: play it ten times. Is the rhythm readable from the dots? Is the tap zone where a
  thumb lands? Does Minunat happen when you feel you were on the beat? Knobs: `knock_tol_ms` 140,
  `knock_good_ms` 280, `knock_gaps_ms` [0, 520, 380, 640], `knock_lead_ms` 500.
- [ ] **Vis**: do you learn, without words, that the right tiles are the Dor's kind and the sleeper's
  hems? Is a tile big enough under a thumb (48×68 CSS px on the phone)?
- [ ] **The skip**: days 1–2 the mask (then the cat, alternating); from day 3 the cycle cat → draft →
  mask. The cat knocks the cup over („Pisica." on the strip); the draft cups the flame; the mask bows.
  Does the cover story read as the house's own, or as a cutscene?
- [ ] **A fumble**: a bad knock shows the cat with nothing knocked over; a bad dream shows the next
  transition. Does trying ever feel punished? (It should not: Slab counts as Bun.)
- [ ] **A Minune**: a two-point match played Minunat (Dorul mamei on Broboadă, perfect knock). Expect:
  „Minune" on the strip, Uitare −3 more, a small cross on Mama's band, a **Semn** card on the cloth.
  Drag a Dor onto the Semn: refused. Its one use is not in the demo (M0b T5); note whether an inert
  card on the cloth confuses.
- [ ] **ARATĂ-TE** has no play (Umbră is not shipped): it resolves at once through a transition.

## 10. Odd corners to try on purpose

- [ ] Drop a Dor on a resting thing (the pile). Expect: refused, low tick.
- [ ] Drop a Dor on Rada by day. Expect: it is taken as an apparition (0 points, 2 Putere, Spaimă 3).
  Rule question: should she take a Dor at all?
- [ ] Drop a Dor on a person by day when you meant a dream. Expect: an apparition, with its fright.
  Rule question: is this a trap or a discovery?
- [ ] Tap the flame at night. Expect: nothing, no tick.
- [ ] Let a play sit open through the close. Expect: it resolves as the skip at dawn.
- [ ] Carry a card and drop it on nothing. Expect: it glides back in silence.
- [ ] Haunt the same place twice. Expect: a Putere spent for nothing.
- [ ] With Putere 0, tap a Dor and then a thing: the strip names the thing but no longer says what
  the two would make (the engine would refuse); a drop is refused (low tick). Do the empty drops by
  the candle say why?
- [ ] Keyboard (desktop): Tab to a card, Enter picks it up, Enter on a target puts it down, Escape
  drops it, Space taps.

## 11. What only you can judge (the questions for the notes)

1. **Time.** Is 60 s a day right? Is the 40/20 split right? Did you ever wait for the clock?
2. **Legibility.** Did the hems, the owner chips and the count tags read on the phone? Did the
   forecast make the loss feel like your own lapse?
3. **The gestures.** Did dragging move cards and not the page? Did anything sit under the notch or
   the home bar? Did a refused drop (the glide back, the low tick) read as "no", or as a bug?
4. **The plays.** Fun, skippable, funny when skipped? Does the cat, the draft, the mask read as the
   house covering for you?
5. **The fright.** Did the dog, the garlic, the cords tell you what was coming before it came?
6. **The endings.** Did the Bride read as earned? Did Uitare's silence land? Did the stake?
7. **Discovery.** Without a word of instruction, what did you understand after one wake, and what
   never clicked? (List the mechanics by name: the sill, listening, the village at night, the pomană,
   the Semn, the repeat-sleeper price, the afterglow.)
8. **Sound.** Did sound start after the first touch? Was anything too loud, or missed when absent?

## 12. Reporting

Paste your notes into the T4 message in the loki repository's `docs/priveghi/PROMPT_FRESH_AGENT.md`
("After my phone sit"). Numbers move in `src/tuning.ts` (the renderer's) and
`crates/priveghi-engine/src/v3/config.rs` (the rules'); rules wait for your word.

## Appendix — the knobs that shape these runs

| Knob | Default | Where |
|---|---|---|
| `zi_ms` / `zi_noapte_ms` | 60 000 / 20 000 | `config.rs` |
| `dor_zile` (grains) | 3 | `config.rs` |
| `dor_max_day` | 3 | `config.rs` |
| `putere` / `putere_regen` | 4 / 2 | `config.rs` |
| `uitare_cap` / `candle_uitare` / `nunta_uitare` / `soroc_uitare_max` | 9 / 4 / 3 / 6 | `config.rs` |
| `spaima_preot` / `spaima_vanator` / `preot_zile` | 6 / 9 / 3 | `config.rs` |
| `masti_zile` (vigil nights) | 2 | `config.rs` |
| `knock_tol_ms` / `knock_good_ms` | 140 / 280 | `src/tuning.ts` |
| `toast_ms` (the strip) | 2800 | `src/tuning.ts` |
| `fade_s` (Uitare), `stake_ms` | 6 / 600 | `src/tuning.ts` |
