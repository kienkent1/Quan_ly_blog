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
                <BButton
        v-if="loggedInUser.id === post.userId"
        variant="link"
        size="sm"
        class="text-danger p-0 shadow-none"
        title="Xóa bài viết"
        @click="handleDeletePost(post.id)"
      >
        <i class="bi bi-trash fs-5"></i>
      </BButton>
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
// 1. IMPORT composable useAuth của bạn
import { useAuth } from '../composables/useAuth' // <-- Điều chỉnh đường dẫn nếu cần

// 2. SỬ DỤNG useAuth để lấy thông tin người dùng
// Chúng ta đổi tên `user` thành `loggedInUser` để khớp với code hiện có
const { user: loggedInUser } = useAuth()

// Các state khác của component vẫn giữ nguyên
const posts = ref<any[]>([])
const processedPosts = ref<any[]>([])
const currentPage = ref(1)
const perPage = 5
const blogImage1 = '/blog1.jpg'
const TRUNCATE_LENGTH = 250

// onMounted bây giờ không cần làm gì cả, vì logic fetch sẽ được xử lý trong watchEffect
onMounted(() => {
  // Không cần đọc localStorage ở đây nữa, useAuth đã lo việc đó!
})

// 3. THAY ĐỔI LOGIC FETCH DATA
// Hàm fetchData vẫn giữ nguyên, nó sẽ được gọi bởi watchEffect bên dưới
async function fetchData() {
  if (!loggedInUser.value?.id) return

  try {
    const postsRes = await fetch(`http://localhost:3000/posts?userId=${loggedInUser.value.id}`)
    posts.value = await postsRes.json()
    currentPage.value = 1
  } catch (error) {
    console.error("Failed to fetch data:", error)
  }
}

// 4. SỬ DỤNG watchEffect ĐỂ TỰ ĐỘNG FETCH DATA KHI USER THAY ĐỔI
// watchEffect này sẽ chạy khi component được mount và mỗi khi `loggedInUser` thay đổi
watchEffect(() => {
  if (loggedInUser.value?.id) {
    // Nếu có người dùng đăng nhập, gọi fetchData
    fetchData()
  } else {
    // Nếu không có người dùng (đã logout hoặc chưa đăng nhập), xóa danh sách bài viết
    posts.value = []
  }
})

// watchEffect này để xử lý và sắp xếp các bài viết sau khi fetch.
// Nó sẽ chạy mỗi khi `posts.value` hoặc `loggedInUser.value` thay đổi.
watchEffect(() => {
  if (posts.value.length > 0 && loggedInUser.value) {
    processedPosts.value = posts.value
      .map(post => ({
        ...post,
        authorName: loggedInUser.value.displayName || 'Không rõ',
        avatar: loggedInUser.value.avatarUrl || '',
        createdAtFormatted: new Date(post.createdAt).toLocaleString(),
        isExpanded: false
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else {
    processedPosts.value = []
  }
})

// HÀM XÓA BÀI VIẾT (VỊ TRÍ ĐÃ ĐÚNG)
async function handleDeletePost(postId: string) {
  if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.')) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: loggedInUser.value.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Xóa bài viết thất bại!');
    }

    posts.value = posts.value.filter(p => p.id !== postId);

    alert('Đã xóa bài viết thành công!');

  } catch (error: any) {
    console.error("Lỗi khi xóa bài viết:", error);
    alert(`Đã xảy ra lỗi: ${error.message}`);
  }
}

// ✅ ĐÃ SỬA LỖI: CHỈ GIỮ LẠI MỘT HÀM toggleExpand
const toggleExpand = (post: any) => {
  post.isExpanded = !post.isExpanded
}

const truncateContent = (content: string | null | undefined) => {
  if (!content) return ''
  if (content.length <= TRUNCATE_LENGTH) {
    return content.replace(/\n/g, '<br />')
  }
  return content.substring(0, TRUNCATE_LENGTH).replace(/\n/g, '<br />') + '...'
}

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