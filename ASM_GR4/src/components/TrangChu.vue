<template>
  <main class="container d-flex flex-column justify-content-center align-items-center ">
    <!-- Phần đầu giữ nguyên -->
    <div class="p-4 p-md-5 mb-4 rounded text-body-emphasis bg-body-secondary d-flex mb-5">
      <div class="col-md-6">
        <h6 class="display-6 fst-italic">Mỗi người một câu chuyện, mỗi câu chuyện một hành trình</h6>
        <p class="lead my-3 fs-4">Chào mừng bạn đến với không gian blog cộng đồng. Nơi đây, ai cũng có thể viết – về cuộc sống, cảm xúc, trải nghiệm, hoặc những điều bình dị hàng ngày.</p>
        <router-link to="/bai-viet" class="icon-link gap-1 icon-link-hover fw-bold text-dark text-decoration-none fst-italic fs-5">
          Khám phá blog cộng đồng
        </router-link>
      </div>
      <img src="../assets/images/logo1.png" alt="" class="w-50 d-none d-md-block">
    </div>
    <div class="row mb-2 g-4">
      <div class="col-md-6">
        <div class="row g-0 border rounded overflow-hidden flex-md-row mb-4 shadow-sm position-relative h-100">
          <div class="col-md-6 p-4 d-flex flex-column position-static">
            <h3 class="mb-0">DauBlog</h3>
            <p class="card-text mb-auto pt-4 fs-5">Nền tảng giúp bạn biến ý tưởng thành bài viết và chia sẻ câu chuyện của mình với thế giới.</p>
            <router-link to="/bai-viet" class="icon-link gap-1 icon-link-hover ">Xem thêm</router-link>
          </div>
          <div class="col-md-6 d-none d-lg-block">
            <img src="../assets/images/Screenshot 2025-06-10 212828.png" alt="logo" class="w-100 h-100" style="object-fit: cover;">
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="row g-0 border rounded overflow-hidden flex-md-row mb-4 shadow-sm position-relative h-100">
          <div class="col-md-6 p-4 d-flex flex-column position-static">
            <h3 class="mb-0">Tạo blog của riêng bạn.</h3>
            <p class="mb-auto pt-4 fs-5">Bạn không cần một kiệt tác, chỉ cần một bài viết là của bạn. Hãy ngừng do dự và bắt đầu chia sẻ ngay hôm nay.</p>
            <router-link to="/create-post" class="icon-link gap-1 icon-link-hover ">Xem thêm</router-link>
          </div>
          <div class="col-md-6 d-none d-lg-block">
            <img src="../assets/images/remove the text from.png" alt="logo" class="w-100 h-100" style="object-fit: cover;">
          </div>
        </div>
      </div>
    </div>
    <!-- ========================================================== -->
    <!-- PHẦN BÀI ĐĂNG CẬP NHẬT -->
    <!-- ========================================================== -->
    <div class="mt-5 border-top pt-5 col-md-11 ">
      <h3 class="text-center mb-4">
        Bài đăng nổi bật
      </h3>

      <div v-if="loading" class="text-center mt-5">
        <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
        <p class="mt-2">Đang tải bài viết...</p>
      </div>

      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

      <div v-else-if="userPosts.length > 0" class="d-flex justify-content-between gap-3">
        <div class="col-md-7">
        <div v-for="post in userPosts" :key="post.id" class="border rounded-2 pt-3 mb-4 shadow ">
          
          <div class="d-flex align-items-center mb-3 ps-3">
            <BAvatar :src="getFullUrl(post.user.avatarUrl)" variant="secondary" size="3rem" class="me-3" />
            <div>
              <p class="fs-5 fw-bold mb-0">{{ post.user.displayName }}</p>
              <small class="text-muted">{{ formatDateTime(post.createdAt) }}</small>
            </div>
          </div>

          <div class="ps-3 pe-3">
            <h5 v-if="post.title" class="fw-bold">{{ post.title }}</h5>

            <p v-if="post.content" class="post-content" v-html="formatContent(getDisplayedContent(post))"></p>
            
            <button
              v-if="shouldShowToggle(post)"
              @click="toggleContent(post.id)"
              class="btn btn-link p-0 text-decoration-none text-dark fw-bold"
            >
              {{ expandedPosts[post.id] ? 'Ẩn bớt' : 'Xem thêm...' }}
            </button>
            
            <div v-if="post.imageOrVideoUrl" class="mt-3 text-center">
              <!-- === SỬA LỖI TẠI ĐÂY === -->
              <video v-if="isVideoUrl(post.imageOrVideoUrl)" :src="getFullUrl(post.imageOrVideoUrl)" controls class="img-fluid rounded" style="max-height: 500px;"></video>
              <img v-else :src="getFullUrl(post.imageOrVideoUrl)" alt="Nội dung bài viết" class="img-fluid rounded" style="max-height: 500px;">
            </div>

            <div class="d-flex justify-content-between align-items-center gap-3 p-2 pe-3 pt-3 pb-3 border-top mt-1">
              <div class="d-flex align-items-center gap-2">
                  <BAvatar variant="secondary" />
                  <p class="mb-0 text-muted fs-5">Tên tác giả</p>
              </div>

              <div class="d-flex align-items-center gap-3">
                  <BButton variant="link" class="text-secondary">
                      <i class="bi bi-hand-thumbs-up-fill fs-5"></i>
                  </BButton>
                  <BButton variant="link" class="text-secondary">
                      <i class="bi bi-chat-fill fs-5"></i>
                  </BButton>
                  <p class="mb-0 text-muted fs-5">Thời gian đăng</p>
              </div>   
            </div>
          </div>
        </div>
      </div>
      
    
    <!-- PHẦN BÀI VIẾT GẦN ĐÂY BỊ THIẾU TRONG FILE GỐC, MÌNH THÊM LẠI CHO ĐÚNG CẤU TRÚC -->
    <div class="col-md-4">
      <div class="position-sticky" style="top: 2rem;">
        <div>
          <h4 class="fst-italic">Bài viết gần đây</h4>
          
          <div v-if="isRecentPostsLoading" class="d-flex justify-content-center my-3">
            <div class="spinner-border text-secondary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>

          <div v-else-if="recentPostsError" class="alert alert-warning small p-2">
            {{ recentPostsError }}
          </div>
          
          <ul v-else class="list-unstyled">
             <li v-if="recentPosts.length === 0" class="text-muted border-top pt-3">
               Chưa có bài viết nào.
             </li>
            <li v-for="post in recentPosts" :key="post.id">
              <div class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top">
                
                <video
                  v-if="post.imageOrVideoUrl && isVideoUrl(post.imageOrVideoUrl)"
                  :src="getFullUrl(post.imageOrVideoUrl)"
                  class="bd-placeholder-img"
                  width="100"
                  height="96"
                  autoplay
                  muted
                  loop
                  playsinline
                  alt="Post video preview"
                ></video>
                <img
                  v-else-if="post.imageOrVideoUrl"
                  :src="getFullUrl(post.imageOrVideoUrl)"
                  class="bd-placeholder-img"
                  width="100"
                  height="96"
                  alt="Post image"
                />

                <div class="col-lg-8">
                  <h6 class="mb-0">{{ truncateText(post.title || "Bài viết không có tiêu đề", 50) }}</h6>
                  <small class="text-body-secondary">{{ formatDateTime(post.createdAt) }}</small>
                </div>
              </div>
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
import { BAvatar, BButton } from 'bootstrap-vue-next';
import { ref, onMounted, onUnmounted } from 'vue';

// --- Cấu hình chung ---
const API_BASE_URL = "http://localhost:3000";
// --- ĐÃ THÊM LẠI ---
// ID của người dùng cụ thể mà bạn muốn hiển thị ở cột trái
const TARGET_USER_ID = "64560f4c-f7db-4838-aa9f-a82d79388b08"; 
const CONTENT_TRUNCATE_LENGTH = 300; 

// --- Quản lý State cho Bài đăng chính (Cột trái) ---
const userPosts = ref<any[]>([]); 
const loading = ref(true);
const error = ref<string | null>(null);
const expandedPosts = ref<{ [key: string]: boolean }>({}); 

// --- Quản lý State cho Bài viết gần đây (Cột phải) ---
interface Post {
  id: string;
  title: string | null;
  imageOrVideoUrl: string | null;
  createdAt: string;
}
const recentPosts = ref<Post[]>([]);
const isRecentPostsLoading = ref(true);
const recentPostsError = ref<string | null>(null);

// Biến để lưu interval ID cho việc polling
let pollingInterval: number | undefined;

// --- Vòng đời Component ---
onMounted(() => {
  // Tải dữ liệu lần đầu tiên
  fetchUserPosts();
  fetchRecentPosts();

  // Bắt đầu polling để tự động cập nhật cả 2 danh sách
  pollingInterval = window.setInterval(() => {
    console.log('Kiểm tra bài viết mới...');
    // Cập nhật cả 2 danh sách trong nền
    silentFetchUserPosts();
    silentFetchRecentPosts();
  }, 10000); // Kiểm tra mỗi 10 giây
});

onUnmounted(() => {
  // Dọn dẹp interval khi component bị hủy
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
});

// --- Các hàm tiện ích (Giữ nguyên) ---
const getFullUrl = (path: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};
const formatDateTime = (isoString: string | null): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};
const isVideoUrl = (url: string | null): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|mov|ogg)$/i.test(url);
};
const formatContent = (text: string | null): string => {
  if (!text) return '';
  return text.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
};
const truncateText = (text: string | null, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substr(0, maxLength) + "...";
};

// --- Logic cho luồng Bài đăng chính (Cột trái - CỦA 1 USER) ---

// URL để lấy bài viết của user cụ thể
const specificUserPostsUrl = `${API_BASE_URL}/posts?userId=${TARGET_USER_ID}&_expand=user&_sort=createdAt&_order=desc`;

// Hàm fetch ban đầu, có spinner
async function fetchUserPosts() {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(specificUserPostsUrl);
    if (!response.ok) throw new Error('Không thể tải bài viết.');
    userPosts.value = await response.json();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// Hàm fetch "thầm lặng" cho polling, không có spinner
async function silentFetchUserPosts() {
  try {
    const response = await fetch(specificUserPostsUrl);
    if (!response.ok) {
        console.error('Lỗi khi polling bài đăng chính.');
        return;
    }
    const newPosts = await response.json();
    if (JSON.stringify(newPosts) !== JSON.stringify(userPosts.value)) {
        userPosts.value = newPosts;
    }
  } catch (err: any) {
    console.error('Lỗi khi polling:', err.message);
  }
}

const toggleContent = (postId: string) => {
  expandedPosts.value[postId] = !expandedPosts.value[postId];
};
const getDisplayedContent = (post: any) => {
  if (!post.content) return '';
  if (post.content.length <= CONTENT_TRUNCATE_LENGTH || expandedPosts.value[post.id]) {
    return post.content;
  }
  return post.content.substring(0, CONTENT_TRUNCATE_LENGTH) + '...';
};
const shouldShowToggle = (post: any) => {
  return post.content && post.content.length > CONTENT_TRUNCATE_LENGTH;
};


// --- Logic cho danh sách Bài viết gần đây (Cột phải - CỦA TẤT CẢ USER) ---

// URL để lấy bài viết gần đây của tất cả user
const allRecentPostsUrl = `${API_BASE_URL}/posts?_sort=createdAt&_order=desc&_limit=7`;

// Hàm fetch ban đầu, có spinner
async function fetchRecentPosts() {
  isRecentPostsLoading.value = true;
  recentPostsError.value = null;
  try {
    const response = await fetch(allRecentPostsUrl); 
    if (!response.ok) throw new Error('Không thể tải các bài viết gần đây.');
    recentPosts.value = await response.json();
  } catch (err: any) {
    recentPostsError.value = err.message || 'Lỗi tải bài viết.';
  } finally {
    isRecentPostsLoading.value = false;
  }
}

// Hàm fetch "thầm lặng", không có spinner
async function silentFetchRecentPosts() {
  try {
    const response = await fetch(allRecentPostsUrl); 
    if (!response.ok) {
        console.error('Lỗi khi polling bài viết gần đây.');
        return;
    }
    const newPosts = await response.json();
    if (JSON.stringify(newPosts) !== JSON.stringify(recentPosts.value)) {
        recentPosts.value = newPosts;
    }
  } catch (err: any) {
    console.error('Lỗi khi polling:', err.message);
  }
}
</script>

<style scoped>
.img-fluid {
  max-width: 100%;
  height: auto;
}
.post-content {
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>