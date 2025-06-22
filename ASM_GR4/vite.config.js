// vite.config.js

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  // --- THAY THẾ TOÀN BỘ KHỐI SERVER BẰNG KHỐI NÀY ---
  server: {
    host: '0.0.0.0', 
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    
    // Cấu hình proxy được tinh chỉnh, bao quát và dễ quản lý hơn
    proxy: {
      // ✅ Proxy cho tất cả các API tùy chỉnh bắt đầu bằng /api
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // ✅ Proxy cho việc upload file (nếu có route riêng không nằm trong /api)
      '/upload-avatar': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/verify-password': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
       '/update-password': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // ✅ Proxy cho tất cả các tài nguyên mặc định của json-server
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/posts': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/products': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/comments': { // <-- BỔ SUNG QUAN TRỌNG
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/reports': { // <-- BỔ SUNG QUAN TRỌNG
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
       '/notifications': { // <-- BỔ SUNG QUAN TRỌNG
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // ✅ Proxy cho thư mục chứa file tĩnh (ảnh, video)
      '/uploads': { // <-- BỔ SUNG CỰC KỲ QUAN TRỌNG
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})