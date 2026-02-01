import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8080
  },
  preview: {
    host: '0.0.0.0',
    // 优先使用环境变量 PORT，Zeabur 会注入此变量
    port: Number(process.env.PORT) || 8080,
    strictPort: true,
  }
});