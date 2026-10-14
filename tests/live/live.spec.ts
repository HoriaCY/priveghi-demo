import { expect, test } from '@playwright/test';

test('the deployed demo boots in the dark, asks nothing of any other host, and loads its own fonts', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const errors: string[] = [];
  const hosts = new Set<string>();
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => hosts.add(new URL(r.url()).origin));
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('./?reset');
  await expect(page.locator('body[data-ready="1"]')).toBeAttached();
  await expect(page.locator('body')).toHaveAttribute('data-phase', 'boot');
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === 'loaded').length;
  });
  expect(fonts).toBe(6);
  expect([...hosts]).toEqual([origin]);
  expect(errors).toEqual([]);
  for (const path of ['manifest.webmanifest', 'icon-180.png', 'credits.html', 'fonts/OFL-Alegreya.txt']) {
    const r = await page.request.get(path);
    expect(r.status(), path).toBe(200);
  }
});
