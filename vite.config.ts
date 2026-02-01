import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  preview: {
    host: true,
    port: parseInt(process.env.PORT || '8080'),
    strictPort: true,
  }
});