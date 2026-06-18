import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['gymbuddy_hi.png', 'gymbuddy_sleep.png', 'wallpaper.png'],
      manifest: {
        name: 'FitNova AI',
        short_name: 'FitNova',
        description: 'Your AI Powered Virtual Gym Buddy',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'gymbuddy_hi.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'gymbuddy_hi.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})