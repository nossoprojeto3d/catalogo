/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { pluginFotos } from './scripts/plugin-fotos';

// GitHub Pages publica em https://nossoprojeto3d.github.io/catalogo/
export default defineConfig({
  base: '/catalogo/',
  plugins: [react(), tailwindcss(), pluginFotos()],
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
  // Libera links temporários do túnel do Cloudflare (cloudflared tunnel --url http://localhost:5181).
  preview: { allowedHosts: ['.trycloudflare.com'] },
  test: { environment: 'node' },
});
