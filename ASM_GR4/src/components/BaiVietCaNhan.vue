<template>
  
<div class="row g-5"> 
    <div class="col-md-8"> 
      <h3 class="pb-4 mb-4 fst-italic ">
          Tiêu đề bài viết
</h3> 
<article class="blog-post"> 
    
        
        <p>Nội dung bài viết. </p> 
    </article> 
    
     
    </div> 
    <div class="col-md-4"> 
        <div class="position-sticky" style="top: 2rem;"> 
         <div class="container mt-4" style="max-width: 500px;">
  
<BInputGroup class="mt-2 mb-3">
  <BFormInput
    type="text"
   class="shadow-none border-2"
  />
  <BButton variant="secondary"><i class="bi bi-search"></i></BButton>
</BInputGroup>
</div>
        <div> 
            <ul class="list-unstyled"> 
                <li> 
                    <a class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top" href="#"> 
                        <svg aria-hidden="true" class="bd-placeholder-img " height="96" preserveAspectRatio="xMidYMid slice" width="100%" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#777"></rect></svg> 
                    <div class="col-lg-8"> <h6 class="mb-0">Example blog post title</h6> 
                        <small class="text-body-secondary">January 15, 2024</small> 
                    </div> 
                </a> 
            </li> 
          
            </ul> 
        </div>      
        </div> 
        </div> 
        </div> 
</template>
<script setup>
import {
  BFormInput,
  BButton,
  BInputGroup,
} from 'bootstrap-vue-next'
import { vBColorMode } from 'bootstrap-vue-next'
</script>
<style scoped></style>