import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 关键配置：使用相对路径，确保静态文件在任何路径下（如 /sub-path/）都能正确加载资源
  base: './',
  server: {
    host: '0.0.0.0',
    port: 8080
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 8080,
    strictPort: true,
  }
});