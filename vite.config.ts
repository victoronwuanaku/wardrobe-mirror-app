import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// The React and Tailwind plugins are both required for the app to build and style correctly.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
