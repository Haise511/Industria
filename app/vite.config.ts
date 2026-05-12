import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the «Индустрия» Telegram Mini App.
// `base: ''` produces relative asset URLs so the bundle works under any
// hosting subpath (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.).
export default defineConfig({
  base: '',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
