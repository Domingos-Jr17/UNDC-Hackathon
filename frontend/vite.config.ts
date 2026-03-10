import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react/')) {
            return 'react-core'
          }

          if (id.includes('@radix-ui')) {
            return 'radix-ui'
          }

          if (id.includes('lucide-react') || id.includes('lucide')) {
            return 'icons'
          }

          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'forms'
          }

          if (id.includes('date-fns') || id.includes('react-day-picker')) {
            return 'dates'
          }

          if (id.includes('sonner') || id.includes('react-toastify')) {
            return 'feedback'
          }

          return 'vendor'
        },
      },
    },
  },
})
