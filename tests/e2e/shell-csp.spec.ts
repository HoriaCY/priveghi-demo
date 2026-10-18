import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// The native shell serves this same build under its own CSP (src-tauri/tauri.conf.json). Served here
// with that policy, the page must load and play without breaking a directive, so a renderer change the
// shell would block fails here, not on the phone. The engine, the fonts, the dynamic imports and the
// flames' inline style attributes are all on these pages.
const CSP: string = JSON.parse(readFileSync('src-tauri/tauri.conf.json', 'utf8')).app.security.csp;
const PAGES = ['reset', 'fixture=wake&still', 'fixture=night', 'sheet', 'icon'];

for (const query of PAGES) {
  test(`the shell's CSP lets the page run: ?${query}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() !== 'document') return route.continue();
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': CSP } });
    });
    await page.addInitScript(() => {
      const w = window as unknown as { csp: string[] };
      w.csp = [];
      document.addEventListener('securitypolicyviolation', (e) => w.csp.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto(`./?${query}`);
    await expect(page.locator('body[data-ready="1"]')).toBeAttached();
    if (query === 'reset') {
      // the boot: the match, then they bring you home (the audio starts on this touch)
      await page.mouse.click(422, 195);
      await expect(page.locator('#stage')).not.toHaveClass(/dark0/);
      await page.mouse.click(422, 195);
      await expect(page.locator('body')).toHaveAttribute('data-phase', 'wake');
    }
    await page.waitForTimeout(500);
    const violations = await page.evaluate(() => (window as unknown as { csp: string[] }).csp);
    expect(violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}
