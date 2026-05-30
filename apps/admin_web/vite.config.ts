import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  build: {
    // HOTFIX: Disable minification to prevent 't' variable collision
    // This resolves ReferenceError: t is not defined in production
    // TODO: Re-enable in future with proper minification config
    minify: false,
  }
})