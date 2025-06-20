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
          <div v-if="paginatedPosts.length > 0">
            <div v-for="post in paginatedPosts" :key="post.id" class="mb-4 p-3 border rounded-4 shadow-sm bg-white">
              <!-- 1. HEADER CỦA BÀI VIẾT -->
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex align-items-center gap-3">
                  <BAvatar 
                    :src="post.avatar"
                    :text="post.authorName?.charAt(0).toUpperCase()"
                    variant="secondary" 
                    size="3rem" 
                    class="me-3" 
                  />
                  <div>
                    <div class="fw-bold">{{ post.authorName }}</div>
                    <div class="text-muted small">{{ post.createdAtFormatted }}</div>
                  </div>
                </div>
                <!-- NÚT XÓA BÀI VIẾT -->
                <BButton
                  v-if="loggedInUser && loggedInUser.id === post.userId"
                  variant="link"
                  size="sm"
                  class="text-danger p-0 shadow-none"
                  title="Xóa bài viết"
                  @click="handleDeletePost(post.id)"
                >
                  <i class="bi bi-trash fs-5"></i>
                </BButton>
              </div>

              <!-- 2. NỘI DUNG BÀI VIẾT -->
              <div class="mb-3">
                <h5 class="fw-semibold">{{ post.title }}</h5>
                <p v-if="!post.isExpanded" v-html="truncateContent(post.content)"></p>
                <p v-else v-html="post.content?.replace(/\r\n/g, '<br />').replace(/\n/g, '<br />')"></p>
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
                <video v-if="post.imageOrVideoUrl.endsWith('.mp4')" controls class="w-100 rounded-3" style="max-height: 450px; object-fit: contain;">
                  <source :src="API_BASE_URL + post.imageOrVideoUrl" type="video/mp4" />
                </video>
                <img v-else :src="post.imageOrVideoUrl" class="img-fluid rounded-3" style="max-height: 450px; object-fit: contain;" />
              </div>

              <!-- 4. THANH TƯƠNG TÁC -->
              <div class="pt-2 border-top mt-1">
                <div class="d-flex justify-content-evenly align-items-center">
                  <BButton variant="outline-light" class="fs-5 border-0 text-secondary col-md-4">
                    <i class="bi bi-hand-thumbs-up-fill"></i> (số lượng)
                  </BButton>
                  <BButton variant="outline-light" class="fs-5 border-0 text-secondary col-md-4"> 
                    <i class="bi bi-hand-thumbs-down-fill"></i> (Số lượng)
                  </BButton> 
                  <BButton variant="outline-light" class="fs-5 border-0 text-secondary col-md-4" @click="toggleComments(post)">
                    <i class="bi bi-chat-fill"></i> Bình luận
                  </BButton>
                </div>
              </div>

              <!-- 5. KHU VỰC BÌNH LUẬN -->
              <CommentSection
                v-if="post.showComments"
                :post-id="post.id"
                :comments="commentsByPost[post.id] || []"
                :current-user-id="loggedInUser?.id" 
                @comment-submitted="fetchData"
                @comment-updated="fetchData"  
              />
            </div>
            <BPagination v-model="currentPage" :total-rows="rows" :per-page="perPage" first-number last-number class="d-flex justify-content-center mt-4" />
          </div>
          <div v-else class="text-center text-muted py-5">
            <h5>Chưa có bài viết nào.</h5>
          </div>
        </div>
        <div class="col-md-4">
          <!-- Sidebar -->
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth';
import { API_BASE_URL } from '../config.js'; 
import CommentSection from './CommentSection.vue';
import { BAvatar, BPagination, BCarousel, BCarouselSlide, BButton } from 'bootstrap-vue-next';

const { user: loggedInUser } = useAuth();
const posts = ref<any[]>([]);
const users = ref<any[]>([]);
const comments = ref<any[]>([]);
const processedPosts = ref<any[]>([]);
const commentsByPost = ref<{ [key: string]: any[] }>({});

const currentPage = ref(1);
const perPage = 5;
const blogImage1 = '/blog1.jpg';
const TRUNCATE_LENGTH = 250;

async function fetchData() {
  try {
    const [postsRes, usersRes, commentsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/posts`),
      fetch(`${API_BASE_URL}/users`),
      fetch(`${API_BASE_URL}/comments`),
    ]);
    posts.value = await postsRes.json();
    users.value = await usersRes.json();
    comments.value = await commentsRes.json();
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
}

onMounted(fetchData);

watch([posts, users, comments], () => {
    if (posts.value.length > 0 && users.value.length > 0) {
        const userMap = new Map(users.value.map(user => [user.id, user]));
        const stateMap = processedPosts.value.reduce((acc, post) => {
            acc[post.id] = { showComments: post.showComments, isExpanded: post.isExpanded };
            return acc;
        }, {} as {[key: string]: any});

        processedPosts.value = posts.value.map(post => {
            const author = userMap.get(post.userId);
            let avatarSrc;
            if (author?.avatarUrl) {
                // Kiểm tra xem URL là link tuyệt đối (Google) hay link tương đối (upload)
                avatarSrc = author.avatarUrl.startsWith('http') ? author.avatarUrl : `${API_BASE_URL}${author.avatarUrl}`;
            }

            return {
                ...post,
                authorName: author?.displayName || 'Người dùng ẩn',
                avatar: avatarSrc,
                createdAtFormatted: new Date(post.createdAt).toLocaleString('vi-VN'),
                isExpanded: stateMap[post.id]?.isExpanded || false,
                showComments: stateMap[post.id]?.showComments || false,
            };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (comments.value.length > 0 && users.value.length > 0) {
        const userMap = new Map(users.value.map(user => [user.id, user]));
        const groupedComments: { [key: string]: any[] } = {};

        comments.value.forEach(comment => {
            const author = userMap.get(comment.userId);
            let authorAvatar;
            if (author?.avatarUrl) {
                authorAvatar = author.avatarUrl.startsWith('http') ? author.avatarUrl : `${API_BASE_URL}${author.avatarUrl}`;
            }

            const processedComment = {
                ...comment,
                author: {
                    id: author?.id || null,
                    displayName: author?.displayName || 'Người dùng ẩn',
                    avatarUrl: authorAvatar
                },
                createdAtFormatted: new Date(comment.createdAt).toLocaleString('vi-VN', { timeStyle: 'short', dateStyle: 'short' }),
            };
            
            if (!groupedComments[comment.postId]) {
                groupedComments[comment.postId] = [];
            }
            groupedComments[comment.postId].push(processedComment);
        });
        commentsByPost.value = groupedComments;
    }
}, { deep: true });


async function handleDeletePost(postId: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
        // Xóa các bình luận liên quan trước
        const commentsToDelete = comments.value.filter(c => c.postId === postId);
        await Promise.all(
            commentsToDelete.map(c => fetch(`${API_BASE_URL}/comments/${c.id}`, { method: 'DELETE' }))
        );

        // Xóa bài viết
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Xóa bài viết thất bại!');
        
        fetchData(); // Tải lại toàn bộ dữ liệu sau khi xóa
        alert('Đã xóa bài viết thành công!');
    } catch (error: any) {
        console.error("Lỗi khi xóa bài viết:", error);
        alert(`Đã xảy ra lỗi: ${error.message}`);
    }
}

const toggleExpand = (post: any) => post.isExpanded = !post.isExpanded;
const toggleComments = (post: any) => {
    if(!loggedInUser.value) {
        alert("Bạn cần đăng nhập để xem và viết bình luận.");
        return;
    }
    post.showComments = !post.showComments;
};

const truncateContent = (content: string | null | undefined) => {
    if (!content) return '';
    const normalizedContent = content.replace(/\r\n/g, '\n');
    if (normalizedContent.length <= TRUNCATE_LENGTH) return normalizedContent.replace(/\n/g, '<br />');
    return normalizedContent.substring(0, TRUNCATE_LENGTH).replace(/\n/g, '<br />') + '...';
};

const rows = computed(() => processedPosts.value.length);
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  const end = start + perPage;
  return processedPosts.value.slice(start, end);
});
</script>

<style scoped>
.carousel-item-height :deep(img) {
  height: 450px;
  object-fit: cover;
  width: 100%;
}
</style>