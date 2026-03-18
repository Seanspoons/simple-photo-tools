import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const base = '/';

  return {
    base,
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          watermarker: resolve(__dirname, 'watermarker/index.html'),
          collage: resolve(__dirname, 'collage/index.html'),
          convert: resolve(__dirname, 'convert/index.html'),
          convertHeicToJpg: resolve(__dirname, 'convert-heic-to-jpg/index.html'),
          addWatermarkToPhoto: resolve(__dirname, 'add-watermark-to-photo/index.html'),
          makePhotoCollageOnline: resolve(__dirname, 'make-photo-collage-online/index.html')
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Simple Photo Tools',
          short_name: 'Photo Tools',
          description: 'Free browser-based photo tools for watermarking, collages, and more.',
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
