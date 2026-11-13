import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AnnexEvoice',
        short_name: 'AnnexEvoice',
        description: 'WhatsApp-first e-invoicing for Nigerian SMEs',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#059669',
        icons: [],
      },
    }),
  ],
  server: { port: 5173 },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: { manualChunks: { react: ['react', 'react-dom'] } },
    },
  },
});
