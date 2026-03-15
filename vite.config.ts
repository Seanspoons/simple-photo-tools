import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const base = '/';

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Photo Watermarker',
          short_name: 'Watermarker',
          description: 'Private, offline-capable watermarking for photos in your browser.',
          theme_color: '#f4efe6',
          background_color: '#f4efe6',
          display: 'standalone',
          start_url: base,
          icons: [
            {
              src: `${base}pwa-192.png`,
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: `${base}pwa-512.png`,
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: `${base}pwa-512-maskable.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          runtimeCaching: []
        }
      })
    ]
  };
});
