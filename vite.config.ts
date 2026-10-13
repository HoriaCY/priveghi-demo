import { defineConfig } from 'vite';

// Relative base: the same build serves from a GitHub Pages project path or from a local preview.
export default defineConfig({
  base: './',
  build: { target: 'es2022', assetsInlineLimit: 0 },
  server: { port: 5173, strictPort: true },
});
