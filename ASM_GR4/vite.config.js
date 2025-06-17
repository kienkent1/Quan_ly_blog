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

  // --- THÊM KHỐI CẤU HÌNH SERVER NÀY VÀO ---
  server: {
    // Chạy server trên 0.0.0.0 để có thể chia sẻ ra bên ngoài
    host: '0.0.0.0', 
    
    proxy: {
      // --- Rule 1: Cho tất cả các API bắt đầu bằng /api ---
      // Ví dụ: /api/login sẽ được chuyển đến http://localhost:3000/api/login
      '/api': {
        target: 'http://localhost:3000', // Địa chỉ server backend của bạn
        changeOrigin: true, // Cần thiết cho các virtual host
      },

      // --- Rule 2: Cho các API tùy chỉnh không có /api ---
      // Ví dụ: /upload-avatar/... sẽ được chuyển đến http://localhost:3000/upload-avatar/...
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
      
      // --- Rule 3: Cho các API mặc định của JSON Server (nếu có) ---
      // Ví dụ: /users, /posts, /comments...
      // Đây là một ví dụ, bạn có thể thêm các tài nguyên khác trong db.json vào đây
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/products': { // Ví dụ nếu bạn có resource 'products'
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Thêm các tài nguyên khác của json-server vào đây nếu cần
    }
  }
})