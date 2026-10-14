#!/usr/bin/env node
// Photographs the app's own ?icon view into the home-screen icons (public/icon-180.png, icon-512.png).
// Run with the built site served: `npx vite preview --port 4173 --strictPort` in another shell.
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
for (const size of [512, 180]) {
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: size / 512 });
  await page.goto('http://localhost:4173/?icon');
  await page.waitForSelector('body[data-ready="1"]', { state: 'attached' });
  await page.screenshot({ path: `public/icon-${size}.png`, clip: { x: 0, y: 0, width: 512, height: 512 } });
  await page.close();
}
await browser.close();
console.log('public/icon-180.png and public/icon-512.png written');
