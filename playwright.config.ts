import { defineConfig } from '@playwright/test';

// Runs against the production build (vite preview), so what is tested is what Pages serves.
export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173/', browserName: 'chromium' },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
  },
});
