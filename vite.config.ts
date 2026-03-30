import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { resolve } from 'path';
import fs from 'fs';

/**
 * 自訂 Vite 插件：建構後將 index.html 複製到 Django templates 目錄，
 * 並注入 Django 模板語法 {% load static %}。
 */
function copyIndexHtmlPlugin() {
  return {
    name: 'copy-index-html',
    closeBundle() {
      const src = resolve(__dirname, '../static/spa/index.html');
      const dest = resolve(__dirname, '../templates/spa/index.html');
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      if (fs.existsSync(src)) {
        let html = fs.readFileSync(src, 'utf-8');
        html = html.replace('<head>', '<head>\n    {% load static %}');
        fs.writeFileSync(dest, html);
        fs.unlinkSync(src);
        console.log('index.html copied to templates/spa/index.html');
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    copyIndexHtmlPlugin(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // 靜態資源基礎路徑：對應 Django STATIC_URL + 'spa/'
  base: '/static/spa/',
  build: {
    outDir: resolve(__dirname, '../static/spa'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    // 開發模式代理：將 API 請求轉發到 Django 後端
    proxy: {
      '/api': 'http://localhost:8000',
      '/chatbot': 'http://localhost:8000',
    },
  },
});
