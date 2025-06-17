<template>
   
   <main class="container"> 
    <div class="p-4 p-md-5 mb-4 rounded text-body-emphasis bg-body-secondary d-flex "> 
        <div class="col-md-6  "> 
            <h1 class="display-4 fst-italic">Mỗi người một câu chuyện, mỗi câu chuyện một hành trình</h1> 
            <p class="lead my-3">Chào mừng bạn đến với không gian blog cộng đồng. Nơi đây, ai cũng có thể viết – về cuộc sống, cảm xúc, trải nghiệm, hoặc những điều bình dị hàng ngày.</p> 
            <router-link 
            to="/bai-viet" 
            class="icon-link gap-1 icon-link-hover fw-bold text-dark text-decoration-none fst-italic">
            Khám phá blog cộng đồng
            </router-link>
          
        </div>
        <img src="../assets/images/logo1.png" alt="" class="w-50">
     </div> 
   <div class="row mb-2 g-4"> <!-- g-4 để tạo khoảng cách giữa 2 card -->

    <!-- Cột 1 -->
    <div class="col-md-6">
        <div class="row g-0 border rounded overflow-hidden flex-md-row mb-4 shadow-sm position-relative h-100">
            
            <!-- THAY ĐỔI Ở ĐÂY: từ .col thành .col-md-6 -->
            <div class="col-md-6 p-4 d-flex flex-column position-static">
                <h3 class="mb-0">DauBlog</h3>
                <p class="card-text mb-auto pt-4">Nền tảng giúp bạn biến ý tưởng thành bài viết và chia sẻ câu chuyện của mình với thế giới.</p>
                <router-link to="/bai-viet" class="icon-link gap-1 icon-link-hover ">Xem thêm</router-link>
            </div>
            
            <!-- THAY ĐỔI Ở ĐÂY: từ .col-auto thành .col-md-6 và bỏ style width -->
            <div class="col-md-6 d-none d-lg-block">
                <img src="../assets/images/Screenshot 2025-06-10 212828.png" alt="logo" class="w-100 h-100" style="object-fit: cover;">
            </div>

        </div>
    </div>

    <!-- Cột 2 -->
    <div class="col-md-6">
        <div class="row g-0 border rounded overflow-hidden flex-md-row mb-4 shadow-sm position-relative h-100">
            
            <!-- THAY ĐỔI Ở ĐÂY: từ .col thành .col-md-6 -->
            <div class="col-md-6 p-4 d-flex flex-column position-static">
                <h3 class="mb-0">Tạo blog của riêng bạn.</h3>
                <p class="mb-auto pt-4">Bạn không cần một kiệt tác, chỉ cần một bài viết là của bạn. Hãy ngừng do dự và bắt đầu chia sẻ ngay hôm nay.</p>
                <router-link to="/create-post" class="icon-link gap-1 icon-link-hover ">Xem thêm</router-link>
            </div>

            <!-- THAY ĐỔI Ở ĐÂY: từ .col-auto thành .col-md-6 và bỏ style width -->
            <div class="col-md-6 d-none d-lg-block">
                 <img src="../assets/images/remove the text from.png" alt="logo" class="w-100 h-100" style="object-fit: cover;">
            </div>

        </div>
    </div>
</div>

    </main>

</template>

<script setup>
    import {
  BNavbar,
  BNavbarBrand,
  BNavItem,
  BNavItemDropdown,
  BNavbarNav,
  BCarousel,
  BDropdownItem,
  BCarouselSlide,
  BButton,
} from 'bootstrap-vue-next'
import { vBColorMode } from 'bootstrap-vue-next'
</script>

<style scoped>


</style>