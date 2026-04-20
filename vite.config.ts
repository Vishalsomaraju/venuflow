import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase/')) return 'firebase'
          if (id.includes('@googlemaps/js-api-loader')) return 'maps'
          if (id.includes('node_modules/recharts/')) return 'charts'
          if (id.includes('@google/generative-ai')) return 'gemini'
          return undefined
        },
      },
    },
  },
})
