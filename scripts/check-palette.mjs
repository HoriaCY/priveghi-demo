#!/usr/bin/env node
// The brief's §8 palette law, checked: only the nine anchors and the prototype's derived neutrals,
// never #000; Voronet blue only on the Bride's wreath (the Cununie card); gold never in a gradient.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANCHORS = ['#171310', '#E9DCB5', '#F2EDE2', '#2E5E7E', '#B5342C', '#6E2320', '#C39A3B', '#4F7A66', '#4A3B2C'];
const NEUTRALS = ['#6b5a44', '#8f7d60', '#d8ccab', '#e4d7b2', '#BAB091', '#b9ad8c', '#110e0b', '#0c0a08', '#a3814f', '#3b3027'];
const ALLOWED = new Set([...ANCHORS, ...NEUTRALS].map((h) => h.toLowerCase()));
// rgba forms of soot, the room and wax (shadows, darkness, the light pool)
const RGB_ALLOWED = new Set(['23,19,16', '17,14,11', '233,220,181', '0,0,0,0']);

const walk = (dir) =>
  readdirSync(path.join(root, dir)).flatMap((f) => {
    const rel = path.join(dir, f);
    return statSync(path.join(root, rel)).isDirectory() ? walk(rel) : [rel];
  });
const files = [...walk('src').filter((f) => /\.(ts|css)$/.test(f)), 'index.html'];
const problems = [];
for (const f of files) {
  const lines = readFileSync(path.join(root, f), 'utf8').split('\n');
  lines.forEach((raw, i) => {
    const at = `${f}:${i + 1}`;
    // code, not comments: a comment may name a colour it forbids
    const line = /^\s*(\*|\/\*)/.test(raw) ? '' : raw.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    for (const m of line.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)) {
      if (/^#0{3}(0{3})?$/i.test(m[0])) problems.push(`${at}: pure black ${m[0]}`);
      else if (!ALLOWED.has(m[0].toLowerCase())) problems.push(`${at}: ${m[0]} is not in the palette`);
    }
    for (const m of line.matchAll(/rgba?\(([^)]*)\)/g)) {
      const rgb = m[1].split(',').slice(0, 3).map((v) => v.trim()).join(',');
      const full = m[1].split(',').map((v) => v.trim()).join(',');
      if (!RGB_ALLOWED.has(rgb) && !RGB_ALLOWED.has(full)) problems.push(`${at}: ${m[0]} is not in the palette`);
    }
    // iOS's status-bar keyword "black-translucent" names a setting, not a paint
    if (/\bblack\b/.test(line) && !/apple-mobile-web-app-status-bar-style/.test(line)) problems.push(`${at}: the word black as a colour`);
    if (/gradient\(/.test(line) && /C39A3B|C\.gold|--gold/i.test(line)) problems.push(`${at}: gold in a gradient`);
    if (/C\.voronet|--voronet\)/.test(line) && f !== path.join('src', 'render', 'art.ts')) problems.push(`${at}: Voronet blue outside the Bride's wreath`);
  });
}
// in the art, blue belongs to the cununie alone
const art = readFileSync(path.join(root, 'src/render/art.ts'), 'utf8').split('\n');
art.forEach((line, i) => {
  if (/C\.voronet/.test(line) && !/^\s*cununie:/.test(line)) problems.push(`src/render/art.ts:${i + 1}: Voronet blue outside the cununie`);
});
if (problems.length) {
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log(`palette: ${files.length} files hold only the nine anchors and their neutrals; blue on the wreath alone; no gold gradient.`);
