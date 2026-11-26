import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['skyforge_icon.jpg', 'skyforge_icon.jpg', 'skyforge_icon.jpg'],
      manifest: {
        name: 'SkyForge Weather Intelligence',
        short_name: 'SkyForge',
        description: 'High-Fidelity Spatial Meteorological & Atmospheric Telemetry Platform',
        theme_color: '#030712',
        background_color: '#030712',
        display: 'standalone',
        scope: '/SkyForge_UI/',
        start_url: '/SkyForge_UI/',
        icons: [
          {
            src: 'skyforge_icon.jpg',
            sizes: '192x192',
            type: 'image/jpg'
          },
          {
            src: 'skyforge_icon.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: command === 'build' ? '/SkyForge_UI/' : '/',
  server: {
    port: 3000,
    open: true,
  },
}));