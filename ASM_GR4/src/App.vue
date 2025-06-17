<script setup>
import TrangChu from './components/TrangChu.vue'
import BaiViet from  './components/BaiViet.vue'
import BaiVietCaNhan from './components/BaiVietCaNhan.vue'
import TheNavbar from './components/TheNavbar.vue'

</script>

<template>
  
  <header >
    <TheNavbar></TheNavbar>
  </header>

  <!-- Đừng quên đặt <router-view /> ở đâu đó trong layout của bạn (thường là App.vue) -->
  <!-- để nội dung các trang có thể hiển thị -->
  <main class="container mt-4">
    <router-view></router-view>
    
  </main>
  <footer class=" text-body-secondary bg-body-tertiary col-xl-12 mt-5 "> 
    <div class="d-flex justify-center d-grid gap-3 p-5 ">
    <div class="col-md-7 ">
    <h3>Về BlogShare</h3>   
    <p>BlogShare là nơi mọi người có thể tự do chia sẻ những câu chuyện, trải nghiệm và cảm xúc thông qua các bài blog cá nhân. Dự án được xây dựng với mong muốn tạo ra một không gian kết nối, lắng nghe và lan tỏa cảm hứng sống tích cực.</p>
    <h4>Thông tin liên hệ</h4>
    <ul >
      <li>Email: DauBlog@gmail.com</li>
      <li>Hotline: 0325861787</li>
      <li>Địa chỉ: Làng thông bình nguyên vô vọng</li>
      <img src="../src/assets/images/FPT_Polytechnic.png" width="200px" height="80px"alt="" class="mt-3">
    </ul>
  </div>
  
  <div class="col-md-5">
    <h4>Thông điệp liên kết</h4>
    <p>Made with ❤️ by Nhóm Dâu – Nơi câu chuyện được lắng nghe và lan tỏa.</p>
    <h4>Phát triển bởi</h4>
    <h5 class="text-danger">Nhóm Dâu</h5>
    <img src="../src/assets/images/logo1.png" alt="" class="w-50">
    
  </div>
</div>
<div class="text-center col-md-12 mb-3">
<p class="p-5">© 2025 Nhóm Dâu. Mọi quyền được bảo lưu.</p>
</div>
    </footer>
</template>

<style scoped>

</style>
