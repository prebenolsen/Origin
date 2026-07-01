import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Generates the PWA icon set (favicon, PWA 64/192/512, maskable, apple-touch)
// from public/icon.svg. Regenerate with: npx pwa-assets-generator
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/icon.svg'],
});
