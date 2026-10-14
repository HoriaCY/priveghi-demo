import { defineConfig } from '@playwright/test';

// Checks the deployed site, not the local build: `npm run test:live` (LIVE_URL overrides the address).
export default defineConfig({
  testDir: 'tests/live',
  reporter: [['list']],
  use: { baseURL: process.env.LIVE_URL ?? 'https://horiacy.github.io/priveghi-demo/', browserName: 'chromium' },
});
