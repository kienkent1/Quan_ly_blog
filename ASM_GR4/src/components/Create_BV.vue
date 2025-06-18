<template>
  <div class="row g-5 d-flex justify-content-between ">
    <!-- CỘT TRÁI: FORM TẠO BÀI VIẾT -->
    <div class="col-md-7">
      <BForm @submit.prevent="dangBai">
        <BFormFile
          v-model="file"
          placeholder="Chọn ảnh hoặc video của bạn..."
          drop-placeholder="Kéo và thả file vào đây..."
          label="Chọn ảnh hoặc video"
          class="mb-3"
          accept="image/*, video/*"
        />
        <BFormInput
          v-model="text"
          placeholder="Tiêu đề bài viết"
          class="mb-3"
        />
        <BFormTextarea
          id="blog-content"
          v-model="content"
          placeholder="Nhập nội dung của bạn ở đây"
          autosize
          rows="8"
        
        />
        <BButton
          @click="dangBai"
          v-if="text.trim() !== '' || content.trim() !== '' || file"
          class="mx-1 mt-5"
          variant="secondary"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          {{ isLoading ? 'Đang đăng...' : 'Tạo bài blog' }}
        </BButton>
      </BForm>
    </div>

    <!-- CỘT PHẢI: DANH SÁCH BÀI VIẾT GẦN ĐÂY -->
    <div class="col-md-5">
      <div class="position-sticky" style="top: 2rem;">
        <div>
          <h4 class="fst-italic">Bài viết gần đây</h4>
          
          <!-- Trạng thái đang tải -->
          <div v-if="isRecentPostsLoading" class="d-flex justify-content-center my-3">
            <div class="spinner-border text-secondary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>

          <!-- Trạng thái lỗi -->
          <div v-else-if="recentPostsError" class="alert alert-warning small p-2">
            {{ recentPostsError }}
          </div>
          
          <!-- Danh sách bài viết -->
          <ul v-else class="list-unstyled">
             <li v-if="recentPosts.length === 0" class="text-muted border-top pt-3">
               Chưa có bài viết nào.
             </li>
            <li v-for="post in recentPosts" :key="post.id">
              <div class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top">
                
                <!-- START: THAY ĐỔI LOGIC HIỂN THỊ MEDIA -->
                
                <!-- 1. Hiển thị video nếu là file video -->
                <video
                  v-if="post.imageOrVideoUrl && isVideoUrl(post.imageOrVideoUrl)"
                  :src="`http://localhost:3000${post.imageOrVideoUrl}`"
                  class="bd-placeholder-img"
                  width="100"
                  height="96"
                  autoplay
                  muted
                  loop
                  playsinline
                  alt="Post video preview"
                ></video>

                <!-- 2. Hiển thị ảnh nếu là file ảnh -->
                <img
                  v-else-if="post.imageOrVideoUrl"
                  :src="`http://localhost:3000${post.imageOrVideoUrl}`"
                  class="bd-placeholder-img"
                  width="100"
                  height="96"
                  alt="Post image"
                />

                <!-- 3. Nếu không có cả hai, không hiển thị gì cả (không có v-else) -->

                <!-- END: THAY ĐỔI LOGIC HIỂN THỊ MEDIA -->

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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  BButton,
  BForm,
  BFormFile,
  BFormTextarea,
  BFormInput,
} from 'bootstrap-vue-next';

// --- STATE CHO FORM TẠO BÀI VIẾT ---
const file = ref<File | null>(null);
const content = ref('');
const text = ref('');
const isLoading = ref(false);

// --- STATE CHO DANH SÁCH BÀI VIẾT GẦN ĐÂY ---
interface Author {
  displayName: string;
  avatarUrl: string | null;
}
interface Post {
  id: string;
  title: string | null;
  imageOrVideoUrl: string | null;
  createdAt: string;
  author: Author;
}
const recentPosts = ref<Post[]>([]);
const isRecentPostsLoading = ref(true);
const recentPostsError = ref<string | null>(null);

// --- CÁC HÀM TIỆN ÍCH ---

/**
 * Hàm mới: Kiểm tra xem URL có phải là của video hay không.
 * @param url - Đường dẫn đến file
 * @returns {boolean} - True nếu là video, ngược lại là false
 */
const isVideoUrl = (url: string | null): boolean => {
  if (!url) return false;
  // Kiểm tra đuôi file, không phân biệt chữ hoa chữ thường
  return /\.(mp4|webm|mov|ogg)$/i.test(url);
};

const formatDateTime = (isoString: string) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substr(0, maxLength) + "...";
};

// --- HÀM LOGIC ---

// 1. Hàm lấy danh sách bài viết gần đây
async function fetchRecentPosts() {
  isRecentPostsLoading.value = true;
  recentPostsError.value = null;
  try {
    const response = await fetch('http://localhost:3000/api/posts/recent');
    if (!response.ok) throw new Error('Không thể tải bài viết.');
    recentPosts.value = await response.json();
  } catch (err: any) {
    recentPostsError.value = err.message || 'Lỗi tải bài viết.';
  } finally {
    isRecentPostsLoading.value = false;
  }
}

// 2. Hàm đăng bài
async function dangBai() {
  const userString = localStorage.getItem('loggedInUser');
  if (!userString) {
    alert('Bạn cần đăng nhập để thực hiện chức năng này.');
    return;
  }
  const user = JSON.parse(userString);
  const userId = user.id;
  if (!userId) {
    alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
    return;
  }

  isLoading.value = true;
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('title', text.value);
  formData.append('content', content.value);
  if (file.value) {
    formData.append('imageOrVideo', file.value);
  }
  try {
    const response = await fetch('http://localhost:3000/api/posts', {
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      alert('Đăng bài thành công!');
      // Reset form
      text.value = '';
      content.value = '';
      file.value = null;

      // Cập nhật lại danh sách bài viết gần đây
      await fetchRecentPosts();
      
    } else {
      const errorData = await response.json();
      alert(`Đã xảy ra lỗi: ${errorData.message || 'Không thể đăng bài.'}`);
    }
  } catch (error) {
    console.error('Lỗi kết nối hoặc lỗi mạng:', error);
    alert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  } finally {
    isLoading.value = false;
  }
}

// 3. Tự động gọi fetchRecentPosts khi component được tải lần đầu
onMounted(() => {
  fetchRecentPosts();
});
</script>

<style scoped>
/* Áp dụng style cho cả ảnh và video để đảm bảo đồng nhất */
.bd-placeholder-img {
  object-fit: cover;
}
#blog-content {
  overflow-wrap: break-word;
  word-wrap: break-word;
}
</style>