import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite' // Essa linha

export default defineConfig({
  plugins: [
    tailwindcss(), // Essa linha
  ],
})