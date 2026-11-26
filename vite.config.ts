import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'SkyForge Weather Intelligence',
        short_name: 'SkyForge',
        description: 'High-Fidelity Spatial Meteorological & Atmospheric Telemetry Platform',
        theme_color: '#030712',
        background_color: '#030712',
        display: 'standalone',
        scope: '/SkyForge/',
        start_url: '/SkyForge/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: command === 'build' ? '/SkyForge/' : '/',
  server: {
    port: 3000,
    open: true,
  },
}));