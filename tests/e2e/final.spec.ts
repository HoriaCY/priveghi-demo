import { expect, test } from '@playwright/test';

// The release's pictures: the lit boot, a table in the middle of the wake, the Bride; three sizes.
const SIZES = [
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
];

for (const size of SIZES) {
  test(`final pictures at ${size.width}x${size.height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.setViewportSize(size);
    const name = `${size.width}x${size.height}`;

    await page.goto('./?seed=1&reset');
    await expect(page.locator('body[data-ready="1"]')).toBeAttached();
    await page.mouse.click(size.width / 2, size.height / 2);
    await expect(page.locator('#stage')).not.toHaveClass(/dark0/);
    await page.screenshot({ path: `docs/shots/final/1-boot-${name}.png` });

    await page.goto('./?seed=1&fixture=wake&still');
    await expect(page.locator('body[data-ready="1"]')).toBeAttached();
    await page.locator('.stack[data-kind="negustor"]').click();
    if (size.width < 1024) await page.locator('.stack[data-kind="negustor"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `docs/shots/final/2-wake-${name}.png` });

    await page.clock.install({ time: new Date('2026-10-14T09:00:00Z') });
    await page.goto('./?seed=1&fixture=start');
    await expect(page.locator('body[data-ready="1"]')).toBeAttached();
    await page.clock.runFor(9 * 60_000 + 4_000);
    await expect(page.locator('body')).toHaveAttribute('data-ending', 'cununie');
    await page.screenshot({ path: `docs/shots/final/3-bride-${name}.png` });
    expect(errors).toEqual([]);
  });
}
