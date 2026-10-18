#!/usr/bin/env node
// Defines, in this clone's git config, the xcodeteam filter .gitattributes gives the Xcode project:
// git stores project.pbxproj and project.yml without the lines that name a signing team, so the team
// picked in Xcode stays on this machine. A clone does not carry its config, so every route that opens
// Xcode runs this first (R167). `required` makes a failing filter stop the commit instead of passing
// the file through; it lives in the same config, so a checkout without the filter (CI) is untouched.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
try {
  git('rev-parse', '--git-dir');
} catch {
  console.log('shell:setup: not a git clone, nothing is committed from here');
  process.exit(0);
}
// one sed program for BSD and GNU sed: a line that starts with a team key (an optional build-setting
// qualifier, then = or :) is deleted
const clean = `sed -E '/^[[:space:]]*(-[[:space:]]+)?"?(DEVELOPMENT_TEAM|[Dd]evelopment[-_]?[Tt]eam)[^=:]*[=:]/d'`;
git('config', 'filter.xcodeteam.clean', clean);
git('config', 'filter.xcodeteam.smudge', 'cat');
git('config', 'filter.xcodeteam.required', 'true');
console.log('shell:setup: the team filter is set in this clone');
