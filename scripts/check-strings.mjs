#!/usr/bin/env node
// Every Romanian string lives in src/strings.ts, marked [RO-draft], and comes from the demo brief's
// §9 list, which is closed. Fails if src/strings.ts holds anything else, or if Romanian letters appear
// anywhere else the player could see them (src/, index.html, public/*.html, the engine).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DAYS = ['întâi', 'a doua', 'a treia', 'a patra', 'a cincea', 'a șasea', 'a șaptea', 'a opta', 'a noua'].map((d) => `Ziua ${d}`);
const ALLOWED = new Set([
  'Priveghi', 'Închină-te', 'Umblă', 'Ascultă', 'Descântă', 'Bocește', 'Găzduiește', 'Lumânare', 'Troiță',
  'Codrii Vlăsiei', 'Rada', 'bocitoare', 'Negustor', 'Cel Nenuntit', 'Ploscă cu apă vie', 'Lumânare de ceară',
  'Fir de dor', 'Cântec de leagăn', 'Nume', 'Bocet', 'Grâu', 'Colivă', 'Fier de baltă', 'Sare', 'Jale', 'Frânt',
  'Binecuvântare', 'Pomelnic', 'Cununie', ...DAYS,
  'Se spune că morții nu lasă bani. Lasă ce n-au apucat să ducă.', 'Aici nu minte nimic.', 'Dorul nebocit se face jale.',
  'Numără din nou.', 'S-a ținut priveghiul.', 'Vine la cel ce priveghează.', 'Nu încă.', 'S-a dus pe Apa Sâmbetei.',
  'Nu se potrivește aici.',
]);
const TYPE_TEST = '„Osândă, șchiopătând prin țară: Ăă Ââ Îî Șș Țț”';
const RO = /[ăâîșțşţĂÂÎȘȚŞŢ]/;
const problems = [];

// 1. the strings file: every entry from the list, every entry a draft
const strings = await import(pathToFileURL(path.join(root, 'src/strings.ts')).href);
const entries = [];
const collect = (v) => {
  if (Array.isArray(v)) v.forEach(collect);
  else if (v && typeof v === 'object' && typeof v.ro === 'string') entries.push(v);
  else if (v && typeof v === 'object') Object.values(v).forEach(collect);
};
Object.entries(strings).forEach(([name, v]) => name !== 'TYPE_TEST' && collect(v));
for (const e of entries) {
  if (!ALLOWED.has(e.ro)) problems.push(`src/strings.ts: "${e.ro}" is not in the brief's §9 list`);
  if (e.draft !== '[RO-draft]') problems.push(`src/strings.ts: "${e.ro}" is not marked [RO-draft]`);
}
if (strings.TYPE_TEST !== TYPE_TEST) problems.push('src/strings.ts: TYPE_TEST differs from the ASSET_GUIDE §1.3 test string');

// 2. no Romanian anywhere else
const walk = (dir) =>
  readdirSync(path.join(root, dir)).flatMap((f) => {
    const rel = path.join(dir, f);
    return statSync(path.join(root, rel)).isDirectory() ? walk(rel) : [rel];
  });
const files = [...walk('src'), ...walk('crates'), 'index.html', ...walk('public')].filter(
  (f) => /\.(ts|css|rs|html)$/.test(f) && f !== path.join('src', 'strings.ts'),
);
for (const f of files) {
  readFileSync(path.join(root, f), 'utf8')
    .split('\n')
    .forEach((line, i) => RO.test(line) && problems.push(`${f}:${i + 1}: Romanian outside src/strings.ts`));
}

if (problems.length) {
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log(`${entries.length} Romanian strings in src/strings.ts, all from the §9 list and marked [RO-draft]; ${files.length} other files hold none.`);
