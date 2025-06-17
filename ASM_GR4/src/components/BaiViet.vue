<template>
    
<main class="container ">
    
 <BCarousel
  controls
  indicators
  ride="carousel"
  :ride-reverse="true"
  
>
  <BCarouselSlide class="carousel-item-height"  :img-src="blogImage1" />
  <BCarouselSlide class="carousel-item-height" img-src="https://picsum.photos/1024/480/?image=23" />
  <BCarouselSlide class="carousel-item-height" img-src="https://picsum.photos/1024/480/?image=24" />
</BCarousel>
<div class="container marketing mt-3 d-flex justify-content-between"> <!-- Three columns of text below the carousel --> 
            
                     
  <div class=" col-md-8 d-flex  flex-column ">                            
   <div class="col-md-12  mb-3 border rounded-3 "> 
     <div class="border border-bottom">
      <svg aria-label="Placeholder: 500x500" class="bd-placeholder-img bd-placeholder-img-lg featurette-image img-fluid mx-auto" height="500" preserveAspectRatio="xMidYMid slice" role="img" width="500" xmlns="http://www.w3.org/2000/svg">
       <title>Placeholder</title>
       <rect width="100%" height="100%" fill="var(--bs-secondary-bg)"></rect>
       <text x="50%" y="50%" fill="var(--bs-secondary-color)" dy=".3em">500x500</text>
       </svg> 
     </div >
   <div class="d-flex justify-content-between align-items-center gap-3 p-2">
  
    <!-- Nhóm bên trái: Thêm "align-items-center" và "gap-2" -->
    <div class="d-flex align-items-center gap-2">
        <BAvatar variant="secondary" />
        <p class="mb-0 text-muted fs-5">Tên tác giả</p>
    </div>

    <!-- Nhóm bên phải: Thêm "align-items-center" -->
    <div class="d-flex align-items-center gap-3">
        <BButton variant="link" class="text-secondary">
            <i class="bi bi-hand-thumbs-up-fill fs-5"></i>
        </BButton>
        <BButton variant="link" class="text-secondary">
            <i class="bi bi-chat-fill fs-5"></i>
        </BButton>
        <p class="mb-0 text-muted fs-5">Thời gian đăng</p>
    </div>h


    

</div>
                        </div> 
                          <BPagination
                          v-model="currentPage"
                          :total-rows="rows"
                          :per-page="perPage"
                          first-number
                          last-number
                          class=" d-flex justify-content-center"
                          />
                    </div> 
                    
                    
                    <div class="col-md-3"> 
        <div class="position-sticky" style="top: 2rem;"> 
           
        <div> 
            <div class="container mt-4" style="max-width: 500px;">
  
<BInputGroup class="mt-2 mb-3">
  <BFormInput
    type="text"
   class="shadow-none border-2"
  />
  <BButton variant="secondary"><i class="bi bi-search"></i></BButton>
</BInputGroup>
</div>
            <ul class="list-unstyled"> 
                <li> 
                    <a class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top" href="#"> 
                        <svg aria-hidden="true" class="bd-placeholder-img " height="96" preserveAspectRatio="xMidYMid slice" width="100%" xmlns="http://www.w3.org/2000/svg">
                            <rect width="100%" height="100%" fill="#777"></rect></svg> 
                    <div class="col-lg-8"> 
                        <h6 class="mb-0">Example blog post title</h6> 
                        <small class="text-body-secondary">January 15, 2024</small> 
                    </div> 
                </a> 
            </li> 
            
            </ul> 
        </div>      
        </div> 
        </div> 
                </div>
              
</main>

</template>
<script setup lang="ts">
const blogImage1='/public/blog1.jpg';
import {
  BNavbar,
  BAvatar,
  BNavItem,
  BNavItemDropdown,
  BPagination,
  BCarousel,
  BDropdownItem,
  BCarouselSlide,
  BButton,
  BInputGroup,
  BFormInput,
} from 'bootstrap-vue-next'
import { vBColorMode } from 'bootstrap-vue-next'
import {ref} from 'vue'

const currentPage = ref(5)
const perPage = ref(1)
const rows = ref(100)
</script>
<style scoped>
.carousel-item-height :deep(img) {
  height: 450px; /* Chiều cao mong muốn */
  object-fit: cover;
  width: 100%;
}
</style>