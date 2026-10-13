# Rulings — provisional, awaiting the director

Judgment calls made while building, each with its source and the alternative. Every one is a
one-line change. Sources: the demo brief (`PRIVEGHI_DEMO_BRIEF.md`), the systems chapter
(`SYSTEMS_v2_1.md`), and the build rule that the chapter's numbers win where the two overlap.

| # | Ruling | Source | Alternative |
|---|---|---|---|
| R1 | A day lasts 60 s (`zi_ms`). | Chapter §3 `zi_s` 60, over the brief's 45 (numbers come from the chapter). Nine untouched days take 9 min; the 6–8 min run relies on tapping the flame. | 45 s: one line in `config.rs`. |
| R2 | The close resolves in the brief's order: commits, then decays, then verbs in slot order. A Fir de dor that rots at the close a Jale sitting resolves is mourned with the rest. | Brief §3.6 (the demo's published order); the chapter's order runs mourning before rot. | The chapter's order: that Jale stays. |
| R3 | Cards placed during a day can be taken back until the close; at the close a niche that cannot start gives its cards back, and they decay like any loose card. | Chapter §3, "commits are sealed until the close". | Start a verb the moment its slots fill. |
| R4 | A candle burnt in Umblă "adds a draw" = one more Fir de dor. | Brief §3.5 reads Binecuvântare's extra draw as "+1 Fir de dor". | Draw the next entry of the pool. |
| R5 | One pip and one Bocet card per three Fir de dor sung, counted across sittings (a sitting of four lights one pip and banks one). | Brief §3.3 and its test "boci consumes three and lights a pip"; the chapter's per-stat levels need stat names outside the brief's §9 strings. | One pip per sitting. |
| R6 | Bocește takes its cards in any order: Rada, then three to six Fir de dor or one Jale; one Jale card stands for all Jale. Dropping a stack places as many as fit. | Brief §3.3 ("Rada → Fir de dor ×3 (up to 6), or Jale"). | Strict order: Rada first. |
| R7 | The wake starts with Rada, Codrii Vlăsiei, Ploscă cu apă vie, Lumânare de ceară ×5, Grâu, Sare, and Cel Nenuntit on the plank; no Fir de dor. | Brief §3.4 (the kit's five candles); chapter §6.5 (one Grâu) and its simulation (one Sare, no Dor). | Start with a Fir de dor, as the prototype shows. |
| R8 | A long gap between clock ticks with no pause closes one day, and the next day starts at that close. | Brief §2.1, "no wall-clock decay". | — |
