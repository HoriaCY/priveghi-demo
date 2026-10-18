#!/usr/bin/env node
// Photographs the app's own ?icon view into the home-screen icons (public/icon-180.png, icon-512.png);
// with `shell`, only into the native shell's 1024 px source (src-tauri/icons/app-icon.png), which
// `npx tauri icon` cuts into every size the shell needs. `shell` leaves public/ (the web build) alone.
// Run with the built site served: `npx vite preview --port 4173 --strictPort` in another shell.
import { chromium } from '@playwright/test';

const shell = process.argv.includes('shell');
const targets = shell
  ? [[1024, 'src-tauri/icons/app-icon.png']]
  : [
      [512, 'public/icon-512.png'],
      [180, 'public/icon-180.png'],
    ];
const browser = await chromium.launch();
for (const [size, file] of targets) {
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: size / 512 });
  await page.goto('http://localhost:4173/?icon');
  await page.waitForSelector('body[data-ready="1"]', { state: 'attached' });
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 512, height: 512 } });
  await page.close();
}
await browser.close();
console.log(`${targets.map(([, f]) => f).join(' and ')} written`);
