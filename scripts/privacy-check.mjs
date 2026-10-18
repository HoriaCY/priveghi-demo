#!/usr/bin/env node
// The demo brief's §7 privacy checklist, run against the tracked files, the built dist/ and the
// commit history. Personal identifiers are read from the machine at run time (home path, account
// name, git e-mail, full name), so this public file holds none of them. Exit 1 on any failure.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const self = 'scripts/privacy-check.mjs';
const sh = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

const BINARY = /\.(png|jpe?g|gif|webp|ico|icns|woff2?|ttf|otf|wav|mp3|ogg|flac|m4a|mp4|webm|wasm|psd|ai|blend|zip)$/i;
const ASSET = /\.(png|jpe?g|gif|webp|svg|ico|icns|woff2?|ttf|otf|wav|mp3|ogg|flac|m4a|mp4|webm|psd|ai|blend)$/i;
const STATIC = /\.(html|js|css|wasm|woff2|svg|png|ico|webmanifest|txt|json)$/i;
// the account's noreply, Claude's co-author trailer, and GitHub's own committer on merges made there
const NOREPLY = /^(\d+\+)?[A-Za-z0-9-]+@users\.noreply\.github\.com$|^noreply@anthropic\.com$|^noreply@github\.com$/i;

const tracked = sh('git', ['ls-files', '--cached', '--others', '--exclude-standard']).split('\n').filter(Boolean);
const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((f) => {
        const p = path.join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : [p];
      })
    : [];
const dist = walk(path.join(root, 'dist')).map((p) => path.relative(root, p));
const text = (rel) => readFileSync(path.join(root, rel), 'latin1');
const textFiles = (files) => files.filter((f) => !BINARY.test(f) && f !== self && existsSync(path.join(root, f)));
const scan = (files, re) => {
  const hits = [];
  for (const f of files) {
    const body = BINARY.test(f) ? readFileSync(path.join(root, f), 'latin1') : text(f);
    const m = body.match(re);
    if (m) hits.push(`${f}: ${m[0].slice(0, 60)}`);
  }
  return hits;
};
const appCode = tracked.filter((f) => /^(src\/|index\.html$|public\/)/.test(f));
const shipped = [...appCode, ...dist];

// Personal identifiers of whoever runs this, gathered at run time and never written down. On a CI
// runner the machine's account (`runner`) belongs to no person, so only the generic checks run there.
const onRunner = Boolean(process.env.GITHUB_ACTIONS);
const personal = new Set();
const add = (v) => !onRunner && v && v.length >= 4 && personal.add(v.toLowerCase());
add(os.homedir());
add(os.userInfo().username);
const gitMail = sh('git', ['config', '--global', 'user.email']);
if (gitMail && !NOREPLY.test(gitMail)) {
  add(gitMail);
  add(gitMail.split('@')[1]);
}
const fullName = sh('id', ['-F']) || (sh('getent', ['passwd', os.userInfo().username]).split(':')[4] ?? '').split(',')[0];
if (fullName && fullName.includes(' ')) {
  add(fullName);
  add(fullName.split(/\s+/).at(-1));
}
for (const extra of (process.env.PRIVACY_EXTRA ?? '').split(',')) add(extra.trim());
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const personalRe = personal.size ? new RegExp([...personal].map(escapeRe).join('|'), 'i') : null;

const rows = [];
const check = (item, ok, detail) => rows.push({ item, ok, detail });

// 1. static files only, no server
{
  const pkg = JSON.parse(text('package.json'));
  const runtime = Object.keys(pkg.dependencies ?? {});
  const server = tracked.filter((f) => /(^|\/)(server|api|functions)\/|\.php$|Dockerfile|Procfile/i.test(f));
  const odd = dist.filter((f) => !STATIC.test(f));
  check(
    'static files only, no server',
    runtime.length === 0 && server.length === 0 && odd.length === 0,
    `${runtime.length} runtime dependencies, ${server.length} server files; dist: ${dist.length ? dist.length + ' static files' : 'not built'}${odd.length ? ', unexpected: ' + odd.join(' ') : ''}`,
  );
}

// 2. no analytics
{
  const re = /googletagmanager|google-analytics|gtag\(|plausible\.io|umami\.|matomo|segment\.(com|io)|mixpanel|posthog|hotjar|sentry\.io|clarity\.ms|fbq\(|connect\.facebook|doubleclick|amplitude\.com|newrelic|datadoghq/i;
  const hits = scan([...textFiles(tracked), ...dist], re);
  check('no analytics', hits.length === 0, hits.join('; ') || 'no tracker script, domain or call in the repo or the build');
}

// 3. no cookies
{
  const hits = scan(shipped, /document\.cookie|cookieStore|set-cookie/i);
  check('no cookies', hits.length === 0, hits.join('; ') || 'no cookie read or write in app code or the build');
}

// 4. no third-party requests (static scan; the browser test records every live request)
{
  const urls = [];
  // files a browser acts on; licence texts carry their authors' URLs and request nothing
  for (const f of shipped.filter((x) => /\.(html|js|css|svg|webmanifest|json|wasm)$/i.test(x))) {
    const body = text(f);
    for (const m of body.matchAll(/https?:\/\/[^\s"'`)<>]+/g)) {
      if (!/^http:\/\/www\.w3\.org\//.test(m[0])) urls.push(`${f}: ${m[0]}`);
    }
  }
  check('no third-party requests', urls.length === 0, urls.join('; ') || 'no absolute URL in app code or the build except XML namespaces');
}

// 5. fonts self-hosted
{
  const cdn = scan(shipped, /fonts\.googleapis|fonts\.gstatic|use\.typekit|fonts\.bunny|cdnjs|jsdelivr|unpkg\.com/i);
  const fonts = tracked.filter((f) => /\.(woff2?|ttf|otf)$/i.test(f));
  check('fonts self-hosted', cdn.length === 0, cdn.join('; ') || `no font CDN referenced; ${fonts.length} font files in the repo${fonts.length ? '' : ' (fonts arrive in step 2)'}`);
}

// 6. saves only in this device's localStorage
{
  const hits = scan(textFiles(appCode), /indexedDB|sessionStorage|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/);
  const uses = scan(textFiles(appCode), /localStorage/).length;
  check('saves only in localStorage', hits.length === 0, hits.join('; ') || `no network or other storage API in app code; localStorage used in ${uses} files`);
}

// 7. no secrets or .env
{
  const files = tracked.filter((f) => /(^|\/)\.env(\.|$)|\.(pem|key|p12|pfx)$|id_rsa|id_ed25519/i.test(f));
  const re = /AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35}/;
  const hits = scan(textFiles(tracked), re);
  check('no secrets or .env', files.length === 0 && hits.length === 0, [...files, ...hits].join('; ') || 'no key files, no token patterns');
}

// 8. no personal data
{
  const generic = /\/Users\/[A-Za-z]|\/home\/(?!runner\b)[a-z]/;
  const pathHits = scan([...textFiles(tracked), ...dist], generic);
  const personHits = personalRe ? scan([...textFiles(tracked), ...dist], personalRe) : [];
  const mails = [];
  // an icon's scale suffix (`128x128@2x.png`, Apple's naming) reads like an address and is not one
  const scaleSuffix = /@\d+(\.\d+)?x(-\d+)?\.(png|jpe?g|gif|webp|svg|ico|icns)$/i;
  for (const f of textFiles(tracked)) {
    for (const m of text(f).matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) {
      if (!NOREPLY.test(m[0]) && !scaleSuffix.test(m[0])) mails.push(`${f}: ${m[0]}`);
    }
  }
  // Name the files only: this output can land in a public CI log.
  const where = (list, what) => [...new Set(list.map((h) => h.split(':')[0]))].map((f) => `${f} (${what})`);
  const hits = [...where(pathHits, 'local path'), ...where(personHits, 'identifier'), ...where(mails, 'e-mail')];
  const scope = onRunner ? 'on a CI runner: the machine has no personal identifiers' : `this machine's identifiers (${personal.size} checked)`;
  check('no personal data', hits.length === 0, hits.join('; ') || `no local paths or e-mail addresses; ${scope}`);
}

// 9. commits authored under the GitHub noreply address
{
  const log = sh('git', ['log', '--format=%ae%n%ce']);
  const bodies = sh('git', ['log', '--format=%B']);
  const addrs = [...new Set([...log.split('\n'), ...(bodies.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [])].filter(Boolean))];
  const bad = addrs.filter((a) => !NOREPLY.test(a));
  const commits = sh('git', ['rev-list', '--count', 'HEAD']) || '0';
  check('commits under the noreply address', bad.length === 0, bad.length ? 'not noreply: [personal]' : `${commits} commits; addresses: ${addrs.join(', ') || 'none yet'}`);
}

// 10. no purchased assets, a credits row for every asset
{
  const credits = existsSync(path.join(root, 'CREDITS.md')) ? text('CREDITS.md') : '';
  const assets = tracked.filter((f) => ASSET.test(f));
  // a row may name a file, or a folder ending in "/" that covers everything under it
  const missing = assets.filter((f) => !credits.includes(f) && !f.split('/').slice(0, -1).some((_, i, parts) => credits.includes(parts.slice(0, i + 1).join('/') + '/')));
  check(
    'no purchased assets; every asset credited',
    credits.length > 0 && missing.length === 0,
    !credits ? 'CREDITS.md missing' : missing.length ? 'no credits row: ' + missing.join(' ') : `${assets.length} asset files, each with a CREDITS.md row; card art is code-drawn`,
  );
}

// 11. nothing phones home (the native shell). The law (Horia, 2026-10-18): a native build reports
// nothing unless the player opts in. Until a crash reporter is ruled in, with its consent gate written
// into this item, the shell may carry no network plugin, network crate, updater or outside origin.
{
  const item = 'nothing phones home (the native shell)';
  const shellDir = 'src-tauri';
  if (!existsSync(path.join(root, shellDir))) {
    check(item, true, 'no native shell in the repo');
  } else {
    const bad = [];
    const caps = [];
    const readJson = (rel) => {
      try {
        return JSON.parse(text(rel));
      } catch {
        bad.push(`${rel}: not valid JSON`);
        return {};
      }
    };
    const shellFiles = tracked.filter((f) => f.startsWith(shellDir + '/') && existsSync(path.join(root, f)));

    // the crates: every dependency table of the shell's Cargo.toml, renamed packages included
    const CRATE =
      /^(tauri-plugin-(updater|http|websocket|upload|sentry|aptabase)|sentry|sentry-.*|bugsnag.*|reqwest|ureq|isahc|surf|attohttpc|curl|hyper|tungstenite|tokio-tungstenite|rumqttc|firebase.*|crashlytics.*|appcenter.*|aptabase.*|opentelemetry-otlp)$/i;
    const uncomment = (line) => {
      let quote = null;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (quote) quote = ch === quote ? null : quote;
        else if (ch === '"' || ch === "'") quote = ch;
        else if (ch === '#') return line.slice(0, i);
      }
      return line;
    };
    const crates = [];
    const cargoToml = `${shellDir}/Cargo.toml`;
    if (!existsSync(path.join(root, cargoToml))) bad.push(`${cargoToml} missing`);
    else {
      let inDeps = false;
      let inOne = false;
      for (const raw of text(cargoToml).split('\n')) {
        const line = uncomment(raw).trim();
        if (!line) continue;
        const header = line.match(/^\[([^[\]]+)\]$/);
        if (header) {
          const m = header[1].trim().match(/(?:^|\.)(?:dev-|build-)?dependencies(?:\.(.+))?$/);
          inDeps = Boolean(m) && !m[1];
          inOne = Boolean(m?.[1]);
          if (m?.[1]) crates.push(m[1].replace(/["']/g, ''));
          continue;
        }
        const key = line.match(/^["']?([A-Za-z0-9_-]+)["']?\s*[=.]/);
        if (inDeps && key) crates.push(key[1]);
        if (inDeps || inOne) for (const p of line.matchAll(/\bpackage\s*=\s*["']([^"']+)["']/g)) crates.push(p[1]);
      }
    }
    for (const c of crates.filter((c) => CRATE.test(c))) bad.push(`crate ${c}`);

    // the npm side: a phone-home package in any dependency list of package.json
    const NPM = /^(@tauri-apps\/plugin-(updater|http|websocket|upload)|@sentry\/.*|@bugsnag\/.*|firebase|@firebase\/.*|@aptabase\/.*)$/i;
    const pkg = JSON.parse(text('package.json'));
    for (const list of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
      for (const name of Object.keys(pkg[list] ?? {}).filter((n) => NPM.test(n))) bad.push(`npm ${name}`);
    }

    // the configs: the base file carries a CSP of local sources only; no file adds an updater, a remote
    // page or an outside origin, or takes the CSP away
    const LOCAL_SOURCE =
      /^('[^']+'|data:|blob:|ipc:|tauri:|asset:|http:\/\/ipc\.localhost|ipc:\/\/localhost|tauri:\/\/localhost|asset:\/\/localhost)$/i;
    const cspSources = (csp, where) => {
      const directives =
        typeof csp === 'string'
          ? csp
              .split(';')
              .map((d) => d.trim().split(/\s+/))
              .filter((d) => d[0])
          : Object.entries(csp).map(([k, v]) => [k, ...(Array.isArray(v) ? v : String(v).split(/\s+/))]);
      if (!directives.some((d) => d[0] === 'default-src')) bad.push(`${where}: no default-src (the page could reach any host)`);
      for (const [name, ...sources] of directives) {
        for (const s of sources.filter((s) => s && !LOCAL_SOURCE.test(s))) bad.push(`${where}: ${name} ${s}`);
      }
    };
    const configs = shellFiles.filter((f) => /(^|\/)(tauri|Tauri)(\.[a-z0-9-]+)*\.(conf\.json5?|conf\.toml|toml)$/.test(f));
    if (!configs.includes(`${shellDir}/tauri.conf.json`)) bad.push(`${shellDir}/tauri.conf.json missing`);
    for (const f of configs) {
      if (!f.endsWith('.json')) {
        bad.push(`${f}: this check reads JSON configs only`);
        continue;
      }
      const conf = readJson(f);
      const security = conf.app?.security ?? {};
      if (conf.plugins?.updater !== undefined) bad.push(`${f}: plugins.updater`);
      if (conf.bundle?.createUpdaterArtifacts && conf.bundle.createUpdaterArtifacts !== false) bad.push(`${f}: bundle.createUpdaterArtifacts`);
      for (const w of conf.app?.windows ?? []) if (/^[a-z][a-z0-9+.-]*:/i.test(w.url ?? '')) bad.push(`${f}: a window opens ${w.url}`);
      const base = f === `${shellDir}/tauri.conf.json`;
      if (base && !security.csp) bad.push(`${f}: no CSP`);
      if (!base && 'csp' in security && !security.csp) bad.push(`${f}: takes the CSP away`);
      if (security.csp) cspSources(security.csp, `${f} csp`);
      if (security.devCsp) cspSources(security.devCsp, `${f} devCsp`);
      for (const cap of security.capabilities ?? []) if (typeof cap === 'object') caps.push([`${f} (inline capability)`, cap]);
    }

    // the capabilities: no network, updater or upload permission, and no remote origin given the IPC
    for (const f of shellFiles.filter((f) => /\/capabilities\/.+\.(json5?|toml)$/i.test(f))) {
      if (!f.endsWith('.json')) bad.push(`${f}: this check reads JSON capabilities only`);
      else caps.push([f, readJson(f)]);
    }
    for (const [where, cap] of caps) {
      for (const one of cap.capabilities ?? [cap]) {
        if (one.remote) bad.push(`${where}: grants a remote origin`);
        for (const p of one.permissions ?? []) {
          const id = typeof p === 'string' ? p : (p?.identifier ?? '');
          if (/^(http|websocket|updater|upload|sentry|aptabase):/i.test(id)) bad.push(`${where}: ${id}`);
        }
      }
    }

    // the signing team: picked in Xcode on Horia's machine, never written into a tracked file
    const TEAM = /DEVELOPMENT_TEAM(\[[^\]]*\])?"?\s*[=:]\s*"?[A-Z0-9]{10}\b|"?developmentTeam"?\s*[=:]\s*"[^"]+"/;
    for (const hit of scan(textFiles(tracked), TEAM)) bad.push(`${hit.split(':')[0]}: a signing team id`);

    const plugins = crates.filter((c) => /^tauri-plugin-/.test(c));
    check(
      item,
      bad.length === 0,
      bad.join('; ') ||
        `${crates.length} crates named (${crates.join(', ')}), ${plugins.length} plugins; a CSP of local sources only; ${caps.length} capabilities, none networked; no signing team in the repo`,
    );
  }
}

const width = Math.max(...rows.map((r) => r.item.length));
console.log(`Priveghi privacy checklist (demo brief §7) — ${new Date().toISOString().slice(0, 10)}`);
rows.forEach((r, i) => console.log(`${String(i + 1).padStart(2)}. ${r.item.padEnd(width)}  ${r.ok ? 'PASS' : 'FAIL'}  ${r.detail}`));
const failed = rows.filter((r) => !r.ok).length;
console.log(failed ? `${failed} item(s) failed.` : 'All items pass.');
process.exit(failed ? 1 : 0);
