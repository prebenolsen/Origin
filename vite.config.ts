import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project pages are served from a sub-path
  // (https://<user>.github.io/Origin/). The deploy workflow sets GITHUB_PAGES;
  // local dev and preview stay at '/'. Use '/' here for a user/org page or a
  // custom domain. See docs/deployment.md.
  base: process.env.GITHUB_PAGES ? '/Origin/' : '/',
  plugins: [react(), tailwindcss()],
});
