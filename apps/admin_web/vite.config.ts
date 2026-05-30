import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  esbuild: {
    keepNames: true, // Prevent mangling of 't' from useTranslation()
  }
})