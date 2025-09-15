import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: 'buffer',
      stream: 'stream-browserify',
      assert: 'assert',
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps for production
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          plotly: ['plotly.js', 'react-plotly.js'],
          leaflet: ['leaflet', 'react-leaflet', 'leaflet.markercluster'],
          ui: ['lucide-react', '@headlessui/react']
        }
      }
    },
    // Optimize for production
    minify: 'esbuild',
    target: 'es2020',
    cssCodeSplit: true
  },
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'plotly.js']
  }
})
