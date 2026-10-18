#!/usr/bin/env node
// The demo brief's §7 privacy checklist, run against the tracked files, the built dist/ and the
// commit history. Personal identifiers are read from the machine at run time (home path, account
// name, git e-mail, full name), so this public file holds none of them. Exit 1 on any failure.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
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
// into this item, the shell is read by allowlist (R165): the crates, the npm tools, the config keys,
// the capabilities and the linked frameworks each name what may be there, and a ruling adds an entry.
// Whatever the check cannot read fails it.
{
  const item = 'nothing phones home (the native shell)';
  const shellDir = 'src-tauri';
  if (!existsSync(path.join(root, shellDir))) {
    check(item, true, 'no native shell in the repo');
  } else {
    const bad = [];
    const NEW = 'not in the allowlist (a ruling adds one)';
    const readJson = (rel) => {
      try {
        return JSON.parse(text(rel));
      } catch {
        bad.push(`${rel}: not valid JSON`);
        return {};
      }
    };
    const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
    const shellFiles = tracked.filter((f) => f.startsWith(shellDir + '/') && existsSync(path.join(root, f)));
    const realRoot = realpathSync(root);

    // the crates, as Cargo itself reads the manifest: every kind and target table, renames resolved (`name`
    // is the real crate). `cargo metadata` does not show [patch] or [replace], so the manifests may not
    // name them at all, nor hold a \u escape that could spell them; nor may a Cargo config patch them.
    const CRATES = ['tauri', 'tauri-build'];
    const CRATE_FEATURES = [];
    const CRATES_IO = 'registry+https://github.com/rust-lang/crates.io-index';
    const crates = [];
    let meta = null;
    try {
      const args = ['metadata', '--no-deps', '--offline', '--format-version', '1', '--manifest-path', `${shellDir}/Cargo.toml`];
      meta = JSON.parse(execFileSync('cargo', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 }));
    } catch (e) {
      const why = e.code === 'ENOENT' ? 'cargo is not installed' : (String(e.stderr ?? '').split('\n').find((l) => l.trim()) ?? 'it failed');
      bad.push(`cargo metadata cannot read ${shellDir}/Cargo.toml (${why.replace(/\/\S*\//g, '…/')}): what it cannot read is not vouched for`);
    }
    if (meta) {
      const manifests = new Set([path.join(meta.workspace_root, 'Cargo.toml')]);
      for (const p of meta.packages) {
        manifests.add(p.manifest_path);
        for (const k of Object.keys(p.features ?? {})) bad.push(`${p.name}: [features] ${k}: ${NEW}`);
        for (const d of p.dependencies) {
          const as = `crate ${d.name}${d.rename ? ` (as ${d.rename})` : ''}${d.kind ? ` [${d.kind}]` : ''}${d.target ? ` for ${d.target}` : ''}`;
          crates.push(d.name);
          if (!CRATES.includes(d.name)) bad.push(`${as}: ${NEW}`);
          if (d.path || d.source !== CRATES_IO) bad.push(`${as}: ${d.path ? 'a path dependency' : `from ${String(d.source).split('+')[0]}`}, not crates.io`);
          for (const f of d.features.filter((f) => !CRATE_FEATURES.includes(f))) bad.push(`${as}: feature ${f}: ${NEW}`);
        }
      }
      for (const m of manifests) {
        const hit = readFileSync(m, 'utf8').match(/\b(patch|replace)\b|\\u/i);
        if (hit) bad.push(`${path.relative(realRoot, realpathSync(m))}: "${hit[0]}" (a [patch] or [replace] swaps a crate where cargo metadata cannot see)`);
      }
    }
    const cargoConfigs = ['.cargo/config', '.cargo/config.toml', `${shellDir}/.cargo/config`, `${shellDir}/.cargo/config.toml`];
    for (const f of new Set([...tracked, ...cargoConfigs])) {
      if (/(^|\/)\.cargo\/config(\.toml)?$/.test(f) && existsSync(path.join(root, f))) bad.push(`${f}: a Cargo config can patch or replace crates: ${NEW}`);
    }

    // the npm tools: no runtime dependency (item 1), and only these build and test tools, each at a registry
    // version (an `npm:` alias is another package under an allowed name). A devDependency can still be
    // bundled into dist/ by Vite.
    const NPM_TOOLS = ['@playwright/test', 'typescript', 'vite', '@tauri-apps/cli'];
    const pkg = JSON.parse(text('package.json'));
    const names = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.keys(v) : v ? [String(v)] : []);
    for (const list of ['optionalDependencies', 'peerDependencies', 'bundleDependencies', 'bundledDependencies', 'overrides']) {
      for (const n of names(pkg[list])) bad.push(`npm ${list} ${n}: ${NEW}`);
    }
    const tools = Object.entries(obj(pkg.devDependencies));
    for (const [n, v] of tools) {
      if (!NPM_TOOLS.includes(n)) bad.push(`npm ${n}: ${NEW}`);
      else if (!/^[\^~]?\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(String(v))) bad.push(`npm ${n} ${JSON.stringify(v)}: only a registry version`);
    }

    // --config: a script as sh splits it (quotes and backslashes resolved), one word list per command. In a
    // command that names tauri, every --config or -c names one of the shell's config files, never inline JSON.
    const commands = (s) => {
      const out = [[]];
      let word = null;
      let quote = null;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (quote) {
          if (ch === quote) quote = null;
          else word += quote === '"' && ch === '\\' && i + 1 < s.length ? s[++i] : ch;
        } else if (ch === '"' || ch === "'") {
          quote = ch;
          word ??= '';
        } else if (ch === '\\' && i + 1 < s.length) word = (word ?? '') + s[++i];
        else if (/[\s;&|]/.test(ch)) {
          if (word !== null) out.at(-1).push(word);
          word = null;
          if (/[;&|]/.test(ch) && out.at(-1).length) out.push([]);
        } else word = (word ?? '') + ch;
      }
      if (word !== null) out.at(-1).push(word);
      return out;
    };
    const named = new Set();
    for (const [name, script] of Object.entries(obj(pkg.scripts))) {
      if (/TAURI_CONFIG/.test(script)) bad.push(`package.json ${name}: TAURI_CONFIG merges a config this check cannot read`);
      for (const cmd of commands(String(script)).filter((c) => c.some((w) => /tauri/i.test(w)))) {
        for (let i = 0; i < cmd.length; i++) {
          const w = cmd[i];
          let v = null;
          if (w === '--config' || w === '-c') v = cmd[++i] ?? '';
          else if (w.startsWith('--config=')) v = w.slice('--config='.length);
          else if (/^-[^-]*c/.test(w)) v = w.slice(w.indexOf('c') + 1).replace(/^=/, '') || (cmd[++i] ?? '');
          if (v === null) continue;
          if (/^src-tauri\/tauri\.[a-z0-9-]+\.conf\.json$/.test(v) && existsSync(path.join(root, v))) named.add(v);
          else bad.push(`package.json ${name}: --config ${JSON.stringify(v.slice(0, 48))}: only an existing ${shellDir}/tauri.*.conf.json`);
        }
      }
    }

    // the configs: every tauri* config Tauri would merge and every file a script passes, each read by key
    // allowlist (Tauri's kebab-case aliases are not on it). The page is the bundled dist/: no dev mode, no
    // outside page, a CSP of local sources only.
    const KEYS = {
      '': ['$schema', 'productName', 'version', 'identifier', 'build', 'app', 'bundle'],
      build: ['frontendDist', 'beforeBuildCommand'],
      app: ['withGlobalTauri', 'windows', 'security'],
      'app.windows': ['label', 'title', 'url', 'width', 'height', 'resizable', 'fullscreen', 'center', 'backgroundColor'],
      'app.security': ['csp', 'dangerousDisableAssetCspModification'],
      bundle: ['active', 'targets', 'createUpdaterArtifacts', 'icon', 'iOS', 'macOS'],
      'bundle.iOS': ['minimumSystemVersion'],
      'bundle.macOS': ['minimumSystemVersion'],
    };
    const DEV = 'the shell has no dev mode (R153)';
    const WHY = { devUrl: DEV, 'dev-url': DEV, beforeDevCommand: DEV, 'before-dev-command': DEV, plugins: 'no plugin (R150)' };
    // a local relative path: no scheme (no ':' at all), not absolute or protocol-relative, nothing a URL
    // parser trims (Tauri opens " https://…" as an outside page)
    const local = (v) => typeof v === 'string' && v !== '' && !/[:\x00-\x1f\x7f]/.test(v) && !/^[\s/\\]|\s$/.test(v);
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
    const base = `${shellDir}/tauri.conf.json`;
    const onDisk = readdirSync(path.join(root, shellDir)).filter((n) => /^tauri(\.[\w-]+)*\.(conf\.json5?|toml)$/i.test(n));
    const configs = [...new Set([...onDisk.map((n) => `${shellDir}/${n}`), ...named])];
    if (!configs.includes(base)) bad.push(`${base} missing`);
    for (const f of configs) {
      if (!f.endsWith('.json')) {
        bad.push(`${f}: this check reads JSON configs only`);
        continue;
      }
      const conf = readJson(f);
      const at = (p) => (p ? p.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), conf) : conf);
      for (const [p, allowed] of Object.entries(KEYS)) {
        const v = at(p);
        if (v === undefined) continue;
        for (const one of p === 'app.windows' && Array.isArray(v) ? v : [v]) {
          if (!one || typeof one !== 'object' || Array.isArray(one)) bad.push(`${f}: ${p || 'the file'} is not an object`);
          else for (const k of Object.keys(one).filter((k) => !allowed.includes(k))) bad.push(`${f}: ${p ? p + '.' : ''}${k}: ${WHY[k] ?? NEW}`);
        }
      }
      const build = obj(at('build'));
      if ('frontendDist' in build) {
        for (const d of [build.frontendDist].flat()) {
          if (!local(d)) bad.push(`${f}: build.frontendDist ${JSON.stringify(d)?.slice(0, 60)}: only a local relative path (a URL is loaded as the app)`);
        }
      }
      if ('beforeBuildCommand' in build && build.beforeBuildCommand !== 'npm run build') bad.push(`${f}: build.beforeBuildCommand: ${NEW}`);
      for (const w of [at('app.windows') ?? []].flat()) {
        if (w && typeof w === 'object' && 'url' in w && !local(w.url)) bad.push(`${f}: a window opens ${JSON.stringify(w.url)?.slice(0, 60)}: only a local relative path`);
      }
      const bundle = obj(at('bundle'));
      if ('createUpdaterArtifacts' in bundle && bundle.createUpdaterArtifacts !== false) bad.push(`${f}: bundle.createUpdaterArtifacts`);
      const security = obj(at('app.security'));
      if (f === base && !security.csp) bad.push(`${f}: no CSP`);
      if (f !== base && 'csp' in security && !security.csp) bad.push(`${f}: takes the CSP away`);
      if (security.csp) cspSources(security.csp, `${f} csp`);
    }

    // the capabilities: the page calls no Tauri API (R150), so none grants a permission (an allowlist, empty
    // today) or opens the IPC to a remote origin
    const PERMISSIONS = [];
    let caps = 0;
    for (const f of walk(path.join(root, shellDir, 'capabilities')).map((p) => path.relative(root, p))) {
      if (path.basename(f) === '.DS_Store') continue;
      if (!f.endsWith('.json')) {
        bad.push(`${f}: this check reads JSON capabilities only`);
        continue;
      }
      const file = readJson(f);
      for (const cap of Array.isArray(file) ? file : [file.capabilities ?? file].flat()) {
        caps++;
        if (cap && typeof cap === 'object' && 'remote' in cap) bad.push(`${f}: remote (the IPC opened to an outside origin)`);
        for (const p of [obj(cap).permissions ?? []].flat()) {
          const id = typeof p === 'string' ? p : JSON.stringify(p?.identifier ?? p);
          if (!PERMISSIONS.includes(id)) bad.push(`${f}: grants ${id}: ${NEW}`);
        }
      }
    }

    // the shell's own code: no socket, no URL session, no outside page, no process, no URL but Tauri's IPC
    const NET =
      /\bstd::net\b|\b(TcpStream|TcpListener|UdpSocket)\b|WebviewUrl::(External|CustomProtocol)|\bUrl::parse\b|\b(NS)?URLSession\b|\bNSURLConnection\b|\bCFNetwork\b|<Network\/|\bnw_(connection|endpoint|browser)\w*|\bstd::process\b|\bCommand::new\b/g;
    const code = shellFiles.filter((f) => /\.(rs|swift|mm?|h|c|cc|cpp|kt|java)$/.test(f));
    for (const f of code) {
      const body = text(f);
      for (const m of body.matchAll(NET)) bad.push(`${f}: ${m[0]}`);
      for (const m of body.matchAll(/https?:\/\/[^\s"'`)<>]*/g)) if (!/^http:\/\/ipc\.localhost(\/|$)/.test(m[0])) bad.push(`${f}: ${m[0].slice(0, 60)}`);
    }

    // the Xcode project links the system frameworks the web view needs and the shell's own library; no pod,
    // no Swift package (an SDK or a Tauri plugin's iOS half arrives as one or the other)
    const LINKED = ['CoreGraphics', 'Metal', 'MetalKit', 'QuartzCore', 'Security', 'UIKit', 'WebKit'].map((n) => `${n}.framework`).concat('libapp.a');
    for (const f of shellFiles.filter((f) => /(^|\/)(project\.pbxproj|project\.yml|Podfile)$/.test(f))) {
      const body = text(f);
      const linked = body.match(/(?<![\w.+-])(?<!FileType = "?)([\w+-]+\.(xcframework|framework|dylib|tbd)|lib[\w+-]*\.a)\b/g) ?? [];
      for (const m of new Set(linked)) if (!LINKED.includes(m)) bad.push(`${f}: links ${m}: ${NEW}`);
      const packages = body.match(/XC(Remote|Local)SwiftPackageReference|XCSwiftPackageProductDependency|^[ \t]*(-[ \t]*)?packages?[ \t]*:|^[ \t]*pod[ \t]+\S+/gm) ?? [];
      for (const m of new Set(packages)) bad.push(`${f}: ${m.trim()} (a package manager's dependency): ${NEW}`);
    }

    // the signing team: whatever Xcode writes stays out of what is committed. The index is what a commit
    // carries; on this machine the working tree may hold a team only in a file .gitattributes gives the
    // xcodeteam filter, while this clone has it set (`npm run shell:setup`) and it takes the team out (R167)
    const TEAM = /DEVELOPMENT_TEAM(\[[^\]]*\])?"?\s*[=:]\s*"?[A-Za-z0-9]|[Dd]evelopment[-_]?[Tt]eam"?\s*[=:]\s*"?[A-Za-z0-9]|<key>\s*teamID\s*<\/key>/;
    let index = [];
    try {
      index = execFileSync('git', ['ls-files', '--cached', '-s', '-z'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        .split('\0')
        .map((l) => l.match(/^(\d+) ([0-9a-f]+) \d\t(.+)$/s))
        .filter((m) => m && m[1] !== '160000' && !BINARY.test(m[3]) && m[3] !== self)
        .map((m) => ({ sha: m[2], file: m[3] }));
      const blobs = execFileSync('git', ['cat-file', '--batch'], { cwd: root, input: index.map((e) => e.sha).join('\n') + '\n', maxBuffer: 1 << 28 });
      let pos = 0;
      for (const e of index) {
        const nl = blobs.indexOf(10, pos);
        const size = Number(blobs.subarray(pos, nl).toString().split(' ')[2]);
        if (!Number.isInteger(size)) throw new Error('cat-file');
        if (TEAM.test(blobs.subarray(nl + 1, nl + 1 + size).toString('latin1'))) bad.push(`${e.file} (staged): a signing team id`);
        pos = nl + 1 + size + 1;
      }
    } catch {
      bad.push('git could not read the index: the staged files are not vouched for');
    }
    const filter = onRunner ? '' : sh('git', ['config', '--get', 'filter.xcodeteam.clean']);
    if (!onRunner) {
      for (const f of textFiles(tracked)) {
        const body = readFileSync(path.join(root, f));
        if (!TEAM.test(body.toString('latin1'))) continue;
        const filtered = sh('git', ['check-attr', 'filter', '--', f]).endsWith(': xcodeteam');
        let cleaned = null;
        try {
          if (filtered && filter) cleaned = execFileSync('sh', ['-c', filter], { cwd: root, input: body, stdio: ['pipe', 'pipe', 'ignore'] }).toString('latin1');
        } catch {}
        if (!filtered) bad.push(`${f}: a signing team id`);
        else if (!filter) bad.push(`${f}: a signing team id, and this clone has no team filter (npm run shell:setup, before any commit)`);
        else if (cleaned === null || TEAM.test(cleaned)) bad.push(`${f}: a signing team id the team filter does not take out`);
      }
    }

    const filterNote = onRunner ? '' : filter ? '; the team filter is set' : '; the team filter is not set in this clone (npm run shell:setup)';
    check(
      item,
      bad.length === 0,
      bad.join('; ') ||
        `${crates.length} crates (${[...new Set(crates)].join(', ')}) from crates.io, no feature; ${tools.length} npm tools; ${configs.length} configs, the bundled files only, a CSP of local sources only; ${caps} capabilities, nothing granted; ${code.length} code files, no network call; system frameworks only; no signing team in ${index.length} staged files${filterNote}`,
    );
  }
}

const width = Math.max(...rows.map((r) => r.item.length));
console.log(`Priveghi privacy checklist (demo brief §7) — ${new Date().toISOString().slice(0, 10)}`);
rows.forEach((r, i) => console.log(`${String(i + 1).padStart(2)}. ${r.item.padEnd(width)}  ${r.ok ? 'PASS' : 'FAIL'}  ${r.detail}`));
const failed = rows.filter((r) => !r.ok).length;
console.log(failed ? `${failed} item(s) failed.` : 'All items pass.');
process.exit(failed ? 1 : 0);
