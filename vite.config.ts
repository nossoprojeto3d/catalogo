/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { pluginCompartilhar } from './scripts/plugin-compartilhar.ts';
import { pluginFotos } from './scripts/plugin-fotos.ts';

// GitHub Pages publica em https://nossoprojeto3d.github.io/catalogo/
export default defineConfig({
  base: '/catalogo/',
  plugins: [react(), tailwindcss(), pluginFotos(), pluginCompartilhar('/catalogo/')],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    // O painel é uma página à parte: o cliente não baixa o código dele.
    rollupOptions: { input: { main: 'index.html', painel: 'painel/index.html' } },
  },
  // Libera links temporários do túnel do Cloudflare (cloudflared tunnel --url http://localhost:5181).
  preview: { allowedHosts: ['.trycloudflare.com'] },
  test: { environment: 'node' },
});
