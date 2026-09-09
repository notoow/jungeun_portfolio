import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  base: '/jungeun_portfolio/',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  server: { host: '127.0.0.1', port: 3000, strictPort: true },
});
