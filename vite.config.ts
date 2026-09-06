import { defineConfig } from 'vite';

// base './' = build przenośny: działa i lokalnie, i pod
// https://ExatronOmega.github.io/1600/ (GitHub Pages).
// Ścieżki assetów w kodzie też idą przez BASE_URL (AssetManager).
export default defineConfig({
  base: './',
});
