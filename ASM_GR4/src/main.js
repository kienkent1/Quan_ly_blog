// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import vue3GoogleLogin from 'vue3-google-login'

// 1. Bạn đã import router chính xác
import router from './router'

// CSS files
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Import the function to create the plugin
import { createBootstrap } from 'bootstrap-vue-next'

const app = createApp(App)

// Use the function to register all components and directives globally
app.use(createBootstrap())

// 2. THÊM DÒNG NÀY ĐỂ KÍCH HOẠT ROUTER

app.use(router)
app.use(vue3GoogleLogin, {
  // DÁN CLIENT ID CỦA BẠN VÀO ĐÂY
  clientId: '288601118768-tn5r7emmf8g9p3nnhu1u3n9bo0m07fg2.apps.googleusercontent.com' 
})
app.mount('#app')