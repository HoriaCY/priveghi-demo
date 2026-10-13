import { expect, test } from '@playwright/test';

// The brief's three checkpoint sizes (§5): iPhone landscape, iPad, desktop.
const SIZES = [
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
];

for (const size of SIZES) {
  test(`the engine logs a state transition (${size.width}x${size.height})`, async ({ page }) => {
    const logs: string[] = [];
    const errors: string[] = [];
    const origins = new Set<string>();
    page.on('console', (m) => (m.type() === 'error' ? errors : logs).push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('request', (r) => origins.add(new URL(r.url()).origin));

    await page.setViewportSize(size);
    await page.goto('./?seed=1');
    await expect.poll(() => logs.find((l) => l.startsWith('[priveghi] state transition'))).toBeTruthy();

    const line = logs.find((l) => l.startsWith('[priveghi] state transition'))!;
    expect(line).toContain('day 1 -> day 2');
    expect(line).toContain('arrived: fir_de_dor, fir_de_dor');
    expect(errors).toEqual([]);
    expect([...origins]).toEqual(['http://localhost:4173']);

    await page.screenshot({ path: `shots/step-1/${size.width}x${size.height}.png` });
  });
}
