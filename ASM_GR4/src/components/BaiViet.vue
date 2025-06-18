<template>
  <main class="container ">
    <BCarousel controls indicators ride="carousel" :ride-reverse="true">
      <BCarouselSlide class="carousel-item-height" :img-src="blogImage1" />
      <BCarouselSlide class="carousel-item-height" img-src="https://picsum.photos/1024/480/?image=23" />
      <BCarouselSlide class="carousel-item-height" img-src="https://picsum.photos/1024/480/?image=24" />
    </BCarousel>

    <div class="container marketing mt-3 d-flex justify-content-between">
      <div class="col-md-8 d-flex flex-column">
        <!-- Danh sách bài viết -->
<div v-if="paginatedPosts.length > 0">
  <div
    v-for="post in paginatedPosts"
    :key="post.id"
    class="mb-4 p-3 border rounded-4 shadow-sm bg-white"
  >
    <!-- Avatar + Tên + Ngày đăng -->
    <div class="d-flex align-items-start gap-2 mb-2">
      <BAvatar :src="post.avatar" variant="secondary" />
      <div>
        <div class="fw-bold">{{ post.authorName }}</div>
        <div class="text-muted small">{{ post.createdAtFormatted }}</div>
      </div>
    </div>

    <!-- Tiêu đề + Nội dung -->
    <div class="mb-3">
      <h5 class="fw-semibold">{{ post.title }}</h5>
      <p>{{ post.content }}</p>
    </div>

    <!-- Hình ảnh hoặc video -->
    <div v-if="post.imageOrVideoUrl">
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
        class="w-100 rounded-3"
        style="max-height: 450px; object-fit: contain;"
      />
    </div>
  </div>

  <!-- Phân trang -->
  <BPagination
    v-model="currentPage"
    :total-rows="rows"
    :per-page="perPage"
    first-number
    last-number
    class="d-flex justify-content-center"
  />
</div>
        <!-- Nếu không có bài -->
        <div v-else class="text-center text-muted py-5">
          <h5>Chưa có bài viết nào.</h5>
        </div>
      </div>

      <!-- Sidebar bên phải -->
      <div class="col-md-3">
        <div class="position-sticky" style="top: 2rem;">
          <div>
            <div class="container mt-4" style="max-width: 500px;">
              <BInputGroup class="mt-2 mb-3">
                <BFormInput type="text" class="shadow-none border-2" />
                <BButton variant="secondary"><i class="bi bi-search"></i></BButton>
              </BInputGroup>
            </div>
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
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
const posts = ref<any[]>([])
const users = ref<any[]>([])
const lastUpdate = ref(0)

const currentPage = ref(1)
const perPage = 5
const blogImage1 = '/blog1.jpg'
onMounted(() => {
  fetchData()
})

async function fetchData() {
  const [postsRes, usersRes] = await Promise.all([
    fetch('http://localhost:3000/posts'),
    fetch('http://localhost:3000/users')
  ])
  posts.value = await postsRes.json()
  users.value = await usersRes.json()
  currentPage.value = 1
}


const enrichedPosts = computed(() =>
  posts.value
    .map(post => {
      const author = users.value.find(u => u.id === post.userId)
      return {
        ...post,
        authorName: author?.displayName || 'Không rõ',
        avatar: author?.avatarUrl || '',
        createdAtFormatted: new Date(post.createdAt).toLocaleString()
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
)

const rows = computed(() => enrichedPosts.value.length)

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * perPage
  const end = start + perPage
  return enrichedPosts.value.slice(start, end)
})
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
</script>

<style scoped>
.carousel-item-height :deep(img) {
  height: 450px;
  object-fit: cover;
  width: 100%;
}
</style>
