import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Client bundle only; prerender.mjs writes the HTML pages around it.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/client',
    manifest: true,
    rollupOptions: { input: 'src/entry-client.jsx' }
  }
});
