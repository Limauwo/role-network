import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative base path for maximum compatibility with both GitHub Pages and Vercel
  base: './',
  plugins: [react()],
});
