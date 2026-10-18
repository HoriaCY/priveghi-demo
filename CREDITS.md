# Credits

All art is code-drawn SVG and CSS; all sound is synthesized in the browser. No purchased assets.
Every file added under an outside licence gets a row here.

| File | Source | Author | Licence |
|---|---|---|---|
| `src/fonts/Alegreya-Regular.woff2`, `src/fonts/Alegreya-SemiBold.woff2`, `src/fonts/Alegreya-Italic.woff2` | google/fonts, `ofl/alegreya` (variable font instanced at 400 and 600, subset) | The Alegreya Project Authors | SIL Open Font License 1.1, `public/fonts/OFL-Alegreya.txt` |
| `src/fonts/AlegreyaSC-Regular.woff2` | google/fonts, `ofl/alegreyasc` (subset) | The Alegreya Project Authors | SIL Open Font License 1.1, `public/fonts/OFL-Alegreya.txt` |
| `src/fonts/CormorantUnicase-Medium.woff2`, `src/fonts/CormorantUnicase-SemiBold.woff2` | google/fonts, `ofl/cormorantunicase` (subset) | The Cormorant Project Authors | SIL Open Font License 1.1, `public/fonts/OFL-Cormorant.txt` |
| `docs/shots/` | screenshots of this demo, taken by its browser tests | this repository | as this repository |
| `public/icon-180.png`, `public/icon-512.png` | the app's own troiță niche (`?icon`), photographed by `scripts/make-icons.mjs` | this repository, code-drawn | as this repository |
| `docs/shots/shell/` | screenshots of the native shell in the iOS Simulator (`xcrun simctl io booted screenshot`, turned upright) | this repository | as this repository |
| `src-tauri/icons/` | the same troiță niche at 1024 px (`app-icon.png`, `scripts/make-icons.mjs shell`), cut into the desktop sizes by `npx tauri icon` | this repository, code-drawn | as this repository |
| `src-tauri/gen/apple/Assets.xcassets/` | the iPhone and iPad app icons cut from `src-tauri/icons/app-icon.png` by `npx tauri icon` (on the page's dark, `#110e0b`) | this repository, code-drawn | as this repository |

The fonts are subset to Latin, Latin-1, Latin Extended-A, U+0218–021B (Ș ș Ț ț with the comma
below), dashes, quotes and the ellipsis. None of the three licences reserves a font name.
