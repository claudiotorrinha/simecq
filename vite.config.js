import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        // All JS chunks flat at dist root
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        // All CSS and other assets flat at dist root
        assetFileNames: '[name]-[hash][extname]',
      },
    },
  },
})
