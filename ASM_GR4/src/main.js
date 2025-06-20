// src/main.js

import { createApp } from 'vue'
import App from './App.vue'

// ---------- CÁC PLUGIN VÀ ROUTER ----------
import router from './router'
import vue3GoogleLogin from 'vue3-google-login'

// ---------- CÁC FILE CSS TOÀN CỤC ----------
// CSS tùy chỉnh của bạn
import './style.css' 
// CSS cho Bootstrap Icons
import 'bootstrap-icons/font/bootstrap-icons.css'
// CSS cho Bootstrap & Bootstrap-Vue-Next (thứ tự này rất quan trọng)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

// ---------- CÀI ĐẶT PLUGIN CHO VUE ----------
// Import hàm createBootstrap để đăng ký toàn cục
import { createBootstrap } from 'bootstrap-vue-next'

// Khởi tạo ứng dụng Vue
const app = createApp(App)

// Sử dụng các plugin
// 1. Đăng ký BootstrapVueNext trên toàn bộ ứng dụng
// Dòng này sẽ làm cho TẤT CẢ các component (như BDropdown, BButton) 
// và các directive (như v-b-toggle) hoạt động ở mọi nơi.
// Đây chính là "chìa khóa" để sửa lỗi menu của bạn.
app.use(createBootstrap())

// 2. Kích hoạt Vue Router
app.use(router)

// 3. Kích hoạt Google Login
app.use(vue3GoogleLogin, {
  // Client ID của bạn
  clientId: '288601118768-tn5r7emmf8g9p3nnhu1u3n9bo0m07fg2.apps.googleusercontent.com' 
})

// Gắn ứng dụng vào DOM
app.mount('#app')