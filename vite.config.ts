import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/SkyForge_UI/' : '/',
  server: {
    port: 3000,
    open: true,
  },
}));