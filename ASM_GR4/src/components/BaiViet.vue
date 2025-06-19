<template>
  <main class="container">
    <BCarousel controls indicators ride="carousel" :ride-reverse="true">
      <BCarouselSlide class="carousel-item-height" :img-src="blogImage1" />
      <BCarouselSlide class="carousel-item-height" img-src="https://picsum.photos/1024/480/?image=23" />
      <BCarouselSlide class="carousel-item-height" img-src="https://picsum.photos/1024/480/?image=24" />
    </BCarousel>

    <div class="container marketing mt-3">
      <div class="row">
        <!-- Cột chính chứa bài viết -->
        <div class="col-md-8">
          <!-- KHỐI v-if: HIỂN THỊ KHI CÓ BÀI VIẾT -->
          <div v-if="paginatedPosts.length > 0">
            <!-- Vòng lặp bài viết -->
            <div
              v-for="post in paginatedPosts"
              :key="post.id"
              class="mb-4 p-3 border rounded-4 shadow-sm bg-white"
            >
              <!-- 1. HEADER CỦA BÀI VIẾT -->
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex align-items-center gap-3">
                  <BAvatar :src="post.avatar" variant="secondary" size="3rem" class="me-3" />
                  <div>
                    <div class="fw-bold">{{ post.authorName }}</div>
                    <div class="text-muted small">{{ post.createdAtFormatted }}</div>
                  </div>
                </div>
                
              </div>

              <!-- 2. NỘI DUNG BÀI VIẾT (✅ ĐÃ CẬP NHẬT LOGIC HIỂN THỊ) -->
              <div class="mb-3">
                <h5 class="fw-semibold">{{ post.title }}</h5>
                <!-- Hiển thị nội dung đầy đủ hoặc rút gọn dựa trên trạng thái 'isExpanded' -->
                <p v-if="!post.isExpanded" v-html="truncateContent(post.content)"></p>
                <p v-else v-html="post.content?.replace(/\n/g, '<br />')"></p>
                
                <!-- Nút "Xem thêm" / "Ẩn bớt" -->
                <BButton
                  v-if="post.content && post.content.length > TRUNCATE_LENGTH"
                  variant="link"
                  class="btn btn-link p-0 text-decoration-none text-dark fw-bold"
                  @click="toggleExpand(post)"
                >
                  {{ post.isExpanded ? 'Ẩn bớt' : 'Xem thêm...' }}
                </BButton>
              </div>

              <!-- 3. HÌNH ẢNH HOẶC VIDEO -->
              <div v-if="post.imageOrVideoUrl" class="text-center bg-light rounded-3 p-2">
                <video
                  v-if="post.imageOrVideoUrl.endsWith('.mp4')"
                  controls
                  class="w-100 rounded-3"
                  style="max-height: 450px; object-fit: contain;"
                >
                  <source :src="post.imageOrVideoUrl" type="video/mp4" />
                </video>
                <img
                  v-else
                  :src="post.imageOrVideoUrl"
                  class="img-fluid rounded-3"
                  style="max-height: 450px; object-fit: contain;"
                />
              </div>
              <div class=" pt-2 border-top mt-1">
              <div class="d-flex justify-content-evenly align-items-center ">
                  <BButton variant="outline-light"class="fs-5 border-0 text-secondary col-md-4">
                      <i class="bi bi-hand-thumbs-up-fill "></i> (số lượng)
                  </BButton>
                  <BButton variant="outline-light"class="fs-5 border-0 text-secondary col-md-4"> 
                      <i class="bi bi-hand-thumbs-down-fill"></i> (Số lượng)
                  </BButton> 
                  <BButton variant="outline-light"class="fs-5 border-0 text-secondary col-md-4" >
                      <i class="bi bi-chat-fill "></i> Bình luận
                  </BButton>
                </div>

               
            </div>
            </div>

            <!-- Phân trang -->
            <BPagination
              v-model="currentPage"
              :total-rows="rows"
              :per-page="perPage"
              first-number
              last-number
              class="d-flex justify-content-center mt-4"
            />
          </div>

          <!-- KHỐI v-else: HIỂN THỊ KHI KHÔNG CÓ BÀI VIẾT -->
          <div v-else class="text-center text-muted py-5">
            <h5>Chưa có bài viết nào.</h5>
          </div>
        </div>

        <!-- Sidebar bên phải -->
        <div class="col-md-4">
          <div class="position-sticky" style="top: 2rem;">
            <div>
              <BInputGroup class="mb-4">
                <BFormInput type="text" placeholder="Tìm kiếm bài viết..." class="shadow-none" />
                <BButton variant="secondary"><i class="bi bi-search"></i></BButton>
              </BInputGroup>
              
              <h4 class="fst-italic">Bài viết gần đây</h4>
              <ul class="list-unstyled">
                <li>
                  <a class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top" href="#">
                    <svg aria-hidden="true" class="bd-placeholder-img" height="96" preserveAspectRatio="xMidYMid slice" width="100%" xmlns="http://www.w3.org/2000/svg">
                      <rect width="100%" height="100%" fill="#777"></rect>
                    </svg>
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
    </div>
  </main>
</template>

<script setup lang="ts">

import { onMounted, ref, computed, watchEffect } from 'vue'

const posts = ref<any[]>([])
const users = ref<any[]>([])

const processedPosts = ref<any[]>([])

const currentPage = ref(1)
const perPage = 5
const blogImage1 = '/blog1.jpg'

const TRUNCATE_LENGTH = 250 

onMounted(() => {
  fetchData()
})

async function fetchData() {
  try {
    const [postsRes, usersRes] = await Promise.all([
      fetch('http://localhost:3000/posts'),
      fetch('http://localhost:3000/users')
    ])
    posts.value = await postsRes.json()
    users.value = await usersRes.json()
    currentPage.value = 1
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
}

// ✅ Sử dụng watchEffect để tự động xử lý lại dữ liệu khi `posts` hoặc `users` thay đổi
// Điều này cho phép chúng ta tạo ra một mảng `processedPosts` có thể thay đổi được (mutable).
watchEffect(() => {
  if (posts.value.length > 0 && users.value.length > 0) {
    processedPosts.value = posts.value
      .map(post => {
        const author = users.value.find(u => u.id === post.userId)
        return {
          ...post,
          authorName: author?.displayName || 'Không rõ',
          avatar: author?.avatarUrl || '',
          createdAtFormatted: new Date(post.createdAt).toLocaleString(),
          // Thêm trạng thái `isExpanded` cho mỗi bài viết
          isExpanded: false
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
})

// ✅ Hàm để chuyển đổi trạng thái mở rộng/thu gọn của một bài viết
const toggleExpand = (post: any) => {
  post.isExpanded = !post.isExpanded
}

// ✅ Hàm để rút gọn nội dung và thêm dấu "..."
const truncateContent = (content: string | null | undefined) => {
  if (!content) return ''
  if (content.length <= TRUNCATE_LENGTH) {
    return content.replace(/\n/g, '<br />')
  }
  return content.substring(0, TRUNCATE_LENGTH).replace(/\n/g, '<br />') + '...'
}

// ✅ Cập nhật computed properties để sử dụng `processedPosts`
const rows = computed(() => processedPosts.value.length)

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * perPage
  const end = start + perPage
  return processedPosts.value.slice(start, end)
})

import {
  BAvatar,
  BPagination,
  BCarousel,
  BCarouselSlide,
  BButton,
  BInputGroup,
  BFormInput,
} from 'bootstrap-vue-next'
</script>

<style scoped>
.carousel-item-height :deep(img) {
  height: 450px;
  object-fit: cover;
  width: 100%;
}
</style>