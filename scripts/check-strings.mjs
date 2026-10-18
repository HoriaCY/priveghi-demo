#!/usr/bin/env node
// Every Romanian string lives in src/strings.ts, marked [RO-draft], and comes from the demo addendum
// v3's §4 list (plus RULINGS R62's three), which is closed. Fails if src/strings.ts holds anything else, or if Romanian letters appear
// anywhere else the player could see them (src/, index.html, public/*.html, the engine).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DAYS = ['întâi', 'a doua', 'a treia', 'a patra', 'a cincea', 'a șasea', 'a șaptea', 'a opta', 'a noua'].map((d) => `Ziua ${d}`);
// The demo addendum v3 §4 list (it replaced the brief's §9), plus the three kept by RULINGS R62:
// the day ordinals, Sat (a name since DECISIONS 2026-10-12), Dezlegare (the fifth ending, chapter §15).
const ALLOWED = new Set([
  'Priveghi', 'Cel Nenuntit', 'Te-au adus acasă.', 'Semn', 'Nume', 'pomană de vis',
  'Dorul mamei', 'Dorul drăguței', 'Dorul fratelui', 'Dorul dușmanului', 'Dorul preotului',
  'neam', 'dragoste', 'frate', 'vrajbă', 'rugăciune', 'Cruce', 'prevestire',
  'Odihnește-te', 'Bântuie', 'Ascultă', 'Urnește', 'Șoptește', 'Arată-te', 'Stinge', 'Treci',
  'Fir de dor', 'Mama', 'Drăguță', 'Frate de cruce', 'Dușman', 'Preot', 'Rada',
  'Cană', 'Broboadă', 'Inel', 'Icoană', 'Oglindă', 'Cuțit', 'Fluier', 'Arc', 'Pomelnic',
  'Casă', 'Tindă', 'Curte', 'Sat', 'Biserică',
  'Amintire ștearsă', 'Amintire', 'Amintire vie', 'Minune', 'Frântură', 'Uitare', 'Spaimă', 'Putere', 'Pomenire',
  'Bocănit', 'Vis', 'Umbră', 'Sari peste', 'Pisica.', 'Slab', 'Bun', 'Minunat', 'Soroc',
  'Nimeni n-a făcut colivă.', 'S-a stins lumânarea.', 'Azi nu a aprins nimeni lumânarea.',
  'Nuntă', 'Rătăcire', 'Țăruș', 'Dezlegare', 'Vânătorul.', 'Preotul a venit cu apă sfințită.',
  ...DAYS,
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
  if (!ALLOWED.has(e.ro)) problems.push(`src/strings.ts: "${e.ro}" is not in the addendum's §4 list`);
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
console.log(`${entries.length} Romanian strings in src/strings.ts, all from the §4 list and marked [RO-draft]; ${files.length} other files hold none.`);
