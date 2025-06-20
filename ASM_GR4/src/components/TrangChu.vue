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
    
    <!-- PHẦN BÀI ĐĂNG CẬP NHẬT -->
    <div class="mt-5 border-top pt-5 col-md-11 ">
      <h3 class="text-center mb-4">Bài đăng nổi bật</h3>

      <div v-if="loading" class="text-center mt-5">
        <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
        <p class="mt-2">Đang tải bài viết...</p>
      </div>

      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

      <div v-else-if="processedPosts.length > 0" class="d-flex justify-content-between gap-3">
        <!-- Cột bài viết chính -->
        <div class="col-md-7">
          <div v-for="post in processedPosts" :key="post.id" class="border rounded-2 pt-3 mb-4 shadow ">
            <!-- Header bài viết -->
            <div class="d-flex align-items-center mb-3 ps-3">
              <BAvatar :src="post.author.avatarUrl" :text="post.author.displayName?.charAt(0).toUpperCase()" variant="secondary" size="3rem" class="me-3" />
              <div>
                <p class="fs-5 fw-bold mb-0">{{ post.author.displayName }}</p>
                <small class="text-muted">{{ formatDateTime(post.createdAt) }}</small>
              </div>
            </div>

            <!-- Nội dung bài viết -->
            <div class="ps-3 pe-3">
              <h5 v-if="post.title" class="fw-bold">{{ post.title }}</h5>
              <p v-if="post.content" class="post-content" v-html="formatContent(getDisplayedContent(post))"></p>
              <button v-if="shouldShowToggle(post)" @click="toggleContent(post.id)" class="btn btn-link p-0 text-decoration-none text-dark fw-bold">
                {{ expandedPosts[post.id] ? 'Ẩn bớt' : 'Xem thêm...' }}
              </button>
              
              <div v-if="post.imageOrVideoUrl" class="mt-3 text-center bg-light">
                <video v-if="isVideoUrl(post.imageOrVideoUrl)" :src="getFullUrl(post.imageOrVideoUrl)" controls class="img-fluid rounded" style="max-height: 500px;"></video>
                <img v-else :src="getFullUrl(post.imageOrVideoUrl)" alt="Nội dung bài viết" class="img-fluid rounded" style="max-height: 500px;">
              </div>

              <!-- ✅ THANH TƯƠNG TÁC ĐÃ SỬA -->
              <div class="pt-2 border-top mt-1 mb-2">
                <div class="d-flex justify-content-evenly align-items-center ">
                    <BButton variant="outline-light"class="fs-5 border-0 text-secondary col-md-4">
                        <i class="bi bi-hand-thumbs-up-fill "></i> (Số lượng)
                    </BButton>
                    <BButton variant="outline-light"class="fs-5 border-0 text-secondary col-md-4"> 
                        <i class="bi bi-hand-thumbs-down-fill"></i> (số lượng)
                    </BButton> 
                    <BButton variant="outline-light" class="fs-5 border-0 text-secondary col-md-4" @click="toggleComments(post)">
                        <i class="bi bi-chat-fill "></i> Bình luận
                    </BButton> 
                </div>
              </div>

              <!-- ✅ KHU VỰC BÌNH LUẬN ĐÃ THÊM -->
              <CommentSection
                v-if="post.showComments"
                :post-id="post.id"
                :comments="commentsByPost[post.id] || []"
                :current-user-id="loggedInUser?.id" 
                @comment-submitted="fetchAllData"
                @comment-updated="fetchAllData"  
              />
            </div>
          </div>
        </div>
      
        <!-- Cột bài viết gần đây -->
        <div class="col-md-4">
          <div class="position-sticky" style="top: 2rem;">
            <div>
              <h4 class="fst-italic">Bài viết gần đây</h4>
              <div v-if="isRecentPostsLoading" class="d-flex justify-content-center my-3">
                <div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Loading...</span></div>
              </div>
              <div v-else-if="recentPostsError" class="alert alert-warning small p-2">{{ recentPostsError }}</div>
              <ul v-else class="list-unstyled">
                <li v-if="recentPosts.length === 0" class="text-muted border-top pt-3">Chưa có bài viết nào.</li>
                <li v-for="post in recentPosts" :key="post.id">
                  <div class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top">
                    <video v-if="post.imageOrVideoUrl && isVideoUrl(post.imageOrVideoUrl)" :src="getFullUrl(post.imageOrVideoUrl)" class="bd-placeholder-img" width="100" height="96" autoplay muted loop playsinline></video>
                    <img v-else-if="post.imageOrVideoUrl" :src="getFullUrl(post.imageOrVideoUrl)" class="bd-placeholder-img" width="100" height="96" />
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
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useAuth } from '../composables/useAuth'; // ✅ THÊM: Để lấy người dùng đăng nhập
import CommentSection from '../components/CommentSection.vue'; // ✅ THÊM: Import component bình luận

// --- Cấu hình ---
const API_BASE_URL = "http://localhost:3000";
const TARGET_USER_ID = "64560f4c-f7db-4838-aa9f-a82d79388b08"; 
const CONTENT_TRUNCATE_LENGTH = 300; 

// --- Quản lý State ---
const { user: loggedInUser } = useAuth(); // ✅ THÊM
const users = ref<any[]>([]); // ✅ THÊM
const posts = ref<any[]>([]); 
const comments = ref<any[]>([]); // ✅ THÊM
const processedPosts = ref<any[]>([]); // ✅ THÊM: State mới để chứa bài viết đã xử lý
const commentsByPost = ref<{ [key: string]: any[] }>({}); // ✅ THÊM

const loading = ref(true);
const error = ref<string | null>(null);
const expandedPosts = ref<{ [key: string]: boolean }>({}); 

const recentPosts = ref<any[]>([]);
const isRecentPostsLoading = ref(true);
const recentPostsError = ref<string | null>(null);

let pollingInterval: number | undefined;

// --- Vòng đời Component ---
onMounted(() => {
  fetchAllData();
  pollingInterval = window.setInterval(fetchAllData, 10000); // Polling mỗi 10s
});
onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});

// ✅ THAY ĐỔI: Gộp các hàm fetch vào một hàm duy nhất
async function fetchAllData() {
  try {
    const [postsRes, recentPostsRes, usersRes, commentsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/posts?userId=${TARGET_USER_ID}&_expand=user&_sort=createdAt&_order=desc`),
      fetch(`${API_BASE_URL}/posts?_sort=createdAt&_order=desc&_limit=7`),
      fetch(`${API_BASE_URL}/users`),
      fetch(`${API_BASE_URL}/comments`),
    ]);

    if (!postsRes.ok || !recentPostsRes.ok || !usersRes.ok || !commentsRes.ok) {
      throw new Error('Không thể tải dữ liệu từ server.');
    }
    
    posts.value = await postsRes.json();
    recentPosts.value = await recentPostsRes.json();
    users.value = await usersRes.json();
    comments.value = await commentsRes.json();
    
    error.value = null;

  } catch (err: any) {
    error.value = err.message;
    console.error("Lỗi khi fetch data:", err);
  } finally {
    loading.value = false;
    isRecentPostsLoading.value = false;
  }
}

// ✅ THÊM: watch để xử lý dữ liệu khi có thay đổi
watch([posts, users, comments], () => {
  // Xử lý bài viết chính
  const stateMap = processedPosts.value.reduce((acc, post) => {
    acc[post.id] = { showComments: post.showComments, isExpanded: post.isExpanded };
    return acc;
  }, {} as {[key: string]: any});

  processedPosts.value = posts.value.map(post => ({
    ...post,
    author: {
        ...post.user,
        avatarUrl: getFullUrl(post.user?.avatarUrl),
    },
    showComments: stateMap[post.id]?.showComments || false,
    isExpanded: stateMap[post.id]?.isExpanded || false,
  }));

  // Xử lý bình luận
  if (comments.value.length > 0 && users.value.length > 0) {
    const userMap = new Map(users.value.map(user => [user.id, user]));
    const groupedComments: { [key: string]: any[] } = {};

    comments.value.forEach(comment => {
      const author = userMap.get(comment.userId);
      const processedComment = {
        ...comment,
        author: {
          id: author?.id || null,
          displayName: author?.displayName || 'Người dùng ẩn',
          avatarUrl: getFullUrl(author?.avatarUrl)
        },
        createdAtFormatted: formatDateTime(comment.createdAt),
      };
      if (!groupedComments[comment.postId]) {
        groupedComments[comment.postId] = [];
      }
      groupedComments[comment.postId].push(processedComment);
    });
    commentsByPost.value = groupedComments;
  }
}, { deep: true });


// ✅ THÊM: Hàm để bật/tắt khu vực bình luận
const toggleComments = (post: any) => {
    if(!loggedInUser.value) {
        alert("Bạn cần đăng nhập để xem và viết bình luận.");
        return;
    }
    post.showComments = !post.showComments;
};

// --- Các hàm tiện ích (Giữ nguyên và cải tiến) ---
const getFullUrl = (path: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};
const formatDateTime = (isoString: string | null): string => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('vi-VN');
};
const isVideoUrl = (url: string | null): boolean => !!url && /\.(mp4|webm|mov|ogg)$/i.test(url);
const formatContent = (text: string | null): string => text?.replace(/\r\n|\n/g, '<br>') || '';
const truncateText = (text: string | null, maxLength: number): string => (!text || text.length <= maxLength) ? text || '' : text.substr(0, maxLength) + "...";
const toggleContent = (postId: string) => expandedPosts.value[postId] = !expandedPosts.value[postId];
const getDisplayedContent = (post: any) => post.content && (post.content.length <= CONTENT_TRUNCATE_LENGTH || expandedPosts.value[post.id]) ? post.content : (post.content?.substring(0, CONTENT_TRUNCATE_LENGTH) || '') + '...';
const shouldShowToggle = (post: any) => post.content && post.content.length > CONTENT_TRUNCATE_LENGTH;
</script>

<style scoped>
.img-fluid { max-width: 100%; height: auto; }
.post-content { white-space: pre-wrap; line-height: 1.6; }
</style>