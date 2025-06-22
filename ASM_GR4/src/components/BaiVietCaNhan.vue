<template>
  <main class="container">
    <div class="container marketing mt-3">
      <div class="row">
        <!-- Cột chính chứa bài viết -->
        <div class="col-md-8">
          <!-- DROPDOWN LỌC -->
          <BDropdown
            class="mb-2"
            variant="link"
            no-caret
            toggle-class="text-decoration-none p-0 text-secondary"
          >
            <template #button-content>
              <i class="bi bi-funnel-fill"></i>
              <span class="ms-2">Lọc</span>
            </template>
            <BDropdownItemButton :active="activeSort === 'newest'" @click="setSort('newest')">
              Bài viết mới
            </BDropdownItemButton>
            <BDropdownText style="width: 200px" class="small text-muted px-3">
              Hiển thị bài viết theo thời gian tạo
            </BDropdownText>
            <BDropdownDivider />
            <BDropdownItemButton :active="activeSort === 'top'" @click="setSort('top')">
              Top bài viết
            </BDropdownItemButton>
            <BDropdownText style="width: 200px" class="small text-muted px-3">
              Hiển thị bài viết theo lượt yêu thích
            </BDropdownText>
          </BDropdown>

          <!-- HIỂN THỊ KHI CÓ BÀI VIẾT -->
          <div v-if="paginatedPosts.length > 0">
            <!-- Vòng lặp bài viết -->
            <div
              v-for="post in paginatedPosts"
              :key="post.id"
              class="mb-4 p-3 border rounded-4 shadow-sm bg-white"
            >
              <!-- Header bài viết -->
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
                    <div class="text-muted small">
                      {{ post.createdAtFormatted }}
                      <BBadge :variant="post.statusVariant" pill class="ms-2">
                        {{ post.statusText }}
                      </BBadge>
                    </div>
                  </div>
                </div>
                <!-- Nút xóa luôn hiển thị vì đây là trang của người dùng -->
                <BButton
                  variant="link"
                  size="sm"
                  class="text-danger p-0 shadow-none"
                  title="Xóa bài viết"
                  @click="handleDeletePost(post.id)"
                >
                  <i class="bi bi-trash fs-5"></i>
                </BButton>
              </div>

              <!-- Nội dung bài viết -->
              <div class="mb-3">
                <router-link
                  :to="{ name: 'PostDetail', params: { id: post.id } }"
                  class="post-title-link"
                >
                  <h5 class="fw-semibold">{{ post.title }}</h5>
                </router-link>
                <div v-if="!post.isExpanded" v-html="truncateContent(post.content)"></div>
                <div v-else v-html="post.content?.replace(/\n/g, '<br />')"></div>
                <BButton
                  v-if="post.content && post.content.length > TRUNCATE_LENGTH"
                  variant="link"
                  class="btn btn-link p-0 text-decoration-none text-dark fw-bold"
                  @click="toggleExpand(post)"
                >
                  {{ post.isExpanded ? 'Ẩn bớt' : 'Xem thêm...' }}
                </BButton>
              </div>

              <!-- Media -->
              <div v-if="post.imageOrVideoUrl" class="text-center bg-light rounded-3 p-2">
                <video
                  v-if="isVideoUrl(post.imageOrVideoUrl)"
                  controls
                  class="w-100 rounded-3"
                  style="max-height: 450px; object-fit: contain"
                >
                  <source :src="post.imageOrVideoUrl" type="video/mp4" />
                </video>
                <img
                  v-else
                  :src="post.imageOrVideoUrl"
                  class="img-fluid rounded-3"
                  style="max-height: 450px; object-fit: contain"
                  alt="Post content"
                />
              </div>

              <!-- Tương tác -->
              <div class="pt-2 border-top mt-1">
                <div class="d-flex justify-content-evenly align-items-center">
                  <BButton
                    variant="outline-light"
                    class="fs-5 border-0 col-md-4"
                    :class="{ 'text-primary': post.likes?.includes(loggedInUser?.id), 'text-secondary': !post.likes?.includes(loggedInUser?.id) }"
                    @click="handleInteraction(post, 'like')"
                  >
                    <i class="bi bi-hand-thumbs-up-fill"></i> ({{ post.likes?.length || 0 }})
                  </BButton>
                  <BButton
                    variant="outline-light"
                    class="fs-5 border-0 col-md-4"
                    :class="{ 'text-primary': post.dislikes?.includes(loggedInUser?.id), 'text-secondary': !post.dislikes?.includes(loggedInUser?.id) }"
                    @click="handleInteraction(post, 'dislike')"
                  >
                    <i class="bi bi-hand-thumbs-down-fill"></i> ({{ post.dislikes?.length || 0 }})
                  </BButton>
                  <BButton
                    variant="outline-light"
                    class="fs-5 border-0 text-secondary col-md-4"
                    @click="toggleComments(post)"
                  >
                    <i class="bi bi-chat-fill"></i> Bình luận
                  </BButton>
                </div>
              </div>
              
              <!-- Khu vực bình luận -->
              <CommentSection
                v-if="post.showComments"
                :post-id="post.id"
                :comments="commentsByPost[post.id] || []"
                :current-user-id="loggedInUser?.id"
                @add-comment="(content) => handleAddComment(post.id, content)"
                @add-reply="(payload) => handleAddReply(post.id, payload)"
                @delete-comment="handleDeleteComment"
                @toggle-like="handleToggleLike"
              />
            </div>

            <!-- Phân trang -->
            <BPagination v-model="currentPage" :total-rows="rows" :per-page="perPage" first-number last-number class="d-flex justify-content-center mt-4" />
          </div>

          <!-- Khi không có bài viết nào -->
          <div v-else class="text-center text-muted py-5">
            <h5>Bạn chưa có bài viết nào.</h5>
          </div>
        </div>

        <!-- Sidebar bên phải -->
        <div class="col-md-4">
          <div class="position-sticky" style="top: 2rem">
            <!-- Ô tìm kiếm -->
            <div class="search-input-container mb-4">
              <BFormInput
                v-model="searchQuery"
                type="text"
                placeholder="Tìm trong bài viết của bạn..."
                class="shadow-none search-input"
              />
              <i class="bi bi-search search-icon"></i>
            </div>

            <!-- HIỂN THỊ KẾT QUẢ TÌM KIẾM -->
            <div v-if="searchQuery.trim()">
              <h4 class="fst-italic">Kết quả tìm kiếm</h4>
              <ul v-if="searchResults.length > 0" class="list-unstyled">
                <li v-for="post in searchResults" :key="`search-${post.id}`">
                  <router-link :to="{ name: 'PostDetail', params: { id: post.id } }" class="post-title-link">
                    <div class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top">
                      <video
                        v-if="post.imageOrVideoUrl && isVideoUrl(post.imageOrVideoUrl)"
                        :src="post.imageOrVideoUrl"
                        style="width: 96px; height: 96px; object-fit: cover; border-radius: 0.25rem"
                        autoplay muted loop playsinline alt="Post video preview"
                      ></video>
                      <img
                        v-else :src="post.imageOrVideoUrl || post.avatar || 'https://via.placeholder.com/96x96'"
                        style="width: 96px; height: 96px; object-fit: cover; border-radius: 0.25rem"
                        alt="thumbnail"
                      />
                      <div class="col-lg-8">
                        <h6 class="mb-0">{{ post.title || 'Bài viết không có tiêu đề' }}</h6>
                        <small class="text-body-secondary">{{ new Date(post.createdAt).toLocaleDateString('vi-VN') }}</small>
                      </div>
                    </div>
                  </router-link>
                </li>
              </ul>
              <p v-else class="text-muted border-top pt-3">Không tìm thấy bài viết nào.</p>
            </div>

            <!-- HIỂN THỊ WIDGET MẶC ĐỊNH KHI KHÔNG TÌM KIẾM -->
            <div v-if="!searchQuery.trim()">
              <!-- TOP BÀI VIẾT NỔI BẬT CỦA TOÀN TRANG -->
              <div class="border rounded-2 p-2 mb-4">
                <h4 class="fst-italic mb-3 border-bottom pb-2">Top bài viết nổi bật</h4>
                <ul v-if="topPosts.length > 0" class="list-unstyled mb-0">
                  <li v-for="post in topPosts" :key="`top-${post.id}`">
                    <router-link :to="{ name: 'PostDetail', params: { id: post.id } }" class="post-title-link">
                      <div class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top">
                        <video
                          v-if="post.imageOrVideoUrl && isVideoUrl(post.imageOrVideoUrl)"
                          :src="post.imageOrVideoUrl"
                          style="width: 96px; height: 96px; object-fit: cover; border-radius: 0.25rem;"
                          autoplay muted loop playsinline alt="Post video preview"
                        ></video>
                        <img
                          v-else :src="post.imageOrVideoUrl || post.avatar || 'https://via.placeholder.com/96x96'"
                          style="width: 96px; height: 96px; object-fit: cover; border-radius: 0.25rem;"
                          alt="thumbnail"
                        />
                        <div class="col-lg-8">
                          <h6 class="mb-0">{{ post.title || 'Bài viết không có tiêu đề' }}</h6>
                          <small class="text-body-secondary d-flex justify-content-between w-100 mt-1">
                            <span>bởi {{ post.authorName }}</span>
                            <span class="fw-bold text-primary">
                              <i class="bi bi-hand-thumbs-up-fill"></i>
                              {{ post.likes?.length || 0 }}
                            </span>
                          </small>
                        </div>
                      </div>
                    </router-link>
                  </li>
                </ul>
                <p v-else class="text-muted border-top pt-3">Chưa có bài viết nổi bật.</p>
              </div>

              <!-- TOP TÁC GIẢ -->
              <div class="border rounded-2 p-2">
                <h4 class="fst-italic mb-3 border-bottom pb-2">Top tác giả</h4>
                <ul v-if="topAuthors.length > 0" class="list-unstyled mb-0">
                  <li v-for="author in topAuthors" :key="author.id" class="d-flex align-items-center mb-3">
                    <router-link :to="{ name: 'user-profile', params: { userId: author.id } }" class="d-flex align-items-center text-decoration-none text-dark flex-grow-1">
                      <BAvatar :src="author.avatarUrl" variant="secondary" class="me-3" />
                      <div class="flex-grow-1">
                        <div class="fw-bold">{{ author.displayName }}</div>
                      </div>
                    </router-link>
                    <BBadge pill variant="light" text-variant="dark" class="ms-auto">
                      {{ author.postCount }} bài viết
                    </BBadge>
                  </li>
                </ul>
                <p v-else class="text-muted">Không có thông tin tác giả.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watchEffect, watch } from 'vue';
import { useAuth } from '../composables/useAuth';
import CommentSection from './CommentSection.vue';
import {
  BAvatar, BPagination, BButton, BFormInput, BDropdown, BDropdownText, BDropdownDivider, BDropdownItemButton, BBadge
} from 'bootstrap-vue-next';

const API_BASE_URL = 'http://localhost:3000';

const { user: loggedInUser } = useAuth();
const allPosts = ref<any[]>([]);
const allUsers = ref<any[]>([]);
const allComments = ref<any[]>([]);
const processedPosts = ref<any[]>([]);
const commentsByPost = ref<{ [key: string]: any[] }>({});
const searchQuery = ref('');
const currentPage = ref(1);
const perPage = 5;
const TRUNCATE_LENGTH = 250;
const activeSort = ref<'newest' | 'top'>('newest');

async function fetchData() {
  try {
    const [postsRes, usersRes, commentsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/posts`),
      fetch(`${API_BASE_URL}/users`),
      fetch(`${API_BASE_URL}/comments`)
    ]);
    allPosts.value = await postsRes.json();
    allUsers.value = await usersRes.json();
    allComments.value = await commentsRes.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

onMounted(fetchData);

const getFullUrl = (path: string | null) => path && !path.startsWith('http') ? `${API_BASE_URL}${path}` : path;

watchEffect(() => {
  if (allPosts.value.length > 0 && allUsers.value.length > 0) {
    const stateMap = new Map(processedPosts.value.map(p => [p.id, { isExpanded: p.isExpanded, showComments: p.showComments }]));
    processedPosts.value = allPosts.value.map(post => {
      const author = allUsers.value.find(u => u.id === post.userId);
      const state = stateMap.get(post.id) || { isExpanded: false, showComments: false };
      const statusMap = {
        pass: { text: 'Đã duyệt', variant: 'success' },
        fail: { text: 'Bị từ chối', variant: 'danger' }
      };
      const postStatus = statusMap[post.state] || { text: 'Đang chờ duyệt', variant: 'info' };

      return {
        ...post,
        authorName: author?.displayName || 'Không rõ',
        avatar: getFullUrl(author?.avatarUrl),
        imageOrVideoUrl: getFullUrl(post.imageOrVideoUrl),
        createdAtFormatted: new Date(post.createdAt).toLocaleString('vi-VN'),
        isExpanded: state.isExpanded,
        showComments: state.showComments,
        statusText: postStatus.text,
        statusVariant: postStatus.variant
      };
    });
  }
});

watch(allComments, (newComments) => {
  if (!newComments || !allUsers.value.length) {
    commentsByPost.value = {};
    return;
  }
  const userMap = new Map(allUsers.value.map(u => [u.id, u]));
  const grouped = {};
  newComments.forEach(comment => {
    const author = userMap.get(comment.userId);
    const processed = {
      ...comment,
      author: {
        displayName: author?.displayName || 'Người dùng ẩn',
        avatarUrl: getFullUrl(author?.avatarUrl),
      },
      createdAtFormatted: new Date(comment.createdAt).toLocaleString('vi-VN', { timeStyle: 'short', dateStyle: 'short' })
    };
    if (!grouped[comment.postId]) grouped[comment.postId] = [];
    grouped[comment.postId].push(processed);
  });
  commentsByPost.value = grouped;
}, { deep: true });

watch([activeSort, searchQuery, loggedInUser], () => {
  currentPage.value = 1;
});

const currentUserPosts = computed(() => loggedInUser.value ? processedPosts.value.filter(p => p.userId === loggedInUser.value.id) : []);

const sortedCurrentUserPosts = computed(() => {
  const postsToSort = searchQuery.value.trim() 
    ? currentUserPosts.value.filter(p => p.title?.toLowerCase().includes(searchQuery.value.toLowerCase()) || p.content?.toLowerCase().includes(searchQuery.value.toLowerCase()))
    : [...currentUserPosts.value];

  return postsToSort.sort((a, b) => {
    if (activeSort.value === 'top') return (b.likes?.length || 0) - (a.likes?.length || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

const searchResults = computed(() => searchQuery.value.trim() ? sortedCurrentUserPosts.value : []);

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  const end = start + perPage;
  return sortedCurrentUserPosts.value.slice(start, end);
});

const rows = computed(() => sortedCurrentUserPosts.value.length);

const topPosts = computed(() => {
  return processedPosts.value
    .filter(p => p.state === 'pass')
    .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
    .slice(0, 5);
});

const topAuthors = computed(() => {
  const postCounts = allPosts.value.reduce((acc, post) => {
    if (post.state === 'pass') acc[post.userId] = (acc[post.userId] || 0) + 1;
    return acc;
  }, {});
  return allUsers.value
    .map(user => ({ ...user, avatarUrl: getFullUrl(user.avatarUrl), postCount: postCounts[user.id] || 0 }))
    .filter(user => user.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 5);
});

const isVideoUrl = (url) => url && /\.(mp4|webm|mov|ogg)$/i.test(url);
const setSort = (type) => { activeSort.value = type; };
const toggleExpand = (post) => { post.isExpanded = !post.isExpanded; };
const toggleComments = (post) => { if (loggedInUser.value) post.showComments = !post.showComments; else alert('Bạn cần đăng nhập để xem bình luận.'); };
const truncateContent = (content) => !content ? '' : content.length <= TRUNCATE_LENGTH ? content.replace(/\n/g, '<br />') : `${content.substring(0, TRUNCATE_LENGTH).replace(/\n/g, '<br />')}...`;

async function callApi(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'API call failed' }));
      throw new Error(errorData.message);
    }
    return response.status !== 204 ? await response.json() : null;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    alert((error as Error).message || 'An unexpected error occurred.');
    throw error;
  }
}

async function handleDeletePost(postId) {
  if (confirm('Bạn chắc chắn muốn xóa bài viết này và tất cả bình luận liên quan?')) {
    await callApi(`/posts/${postId}/cascade`, { method: 'DELETE' });
    await fetchData();
  }
}

async function handleInteraction(post, interactionType) {
  if (!loggedInUser.value) return alert('Bạn cần đăng nhập.');
  await callApi(`/api/posts/${post.id}/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: loggedInUser.value.id, interactionType })
  });
  await fetchData();
}

async function handleCommentAction(endpoint, payload) {
  if (!loggedInUser.value) return alert('Vui lòng đăng nhập.');
  await callApi(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await fetchData();
}

const handleAddComment = (postId, content) => handleCommentAction('/api/comments', { postId, userId: loggedInUser.value.id, content, parentId: null });
const handleAddReply = (postId, { content, parentId }) => handleCommentAction('/api/comments', { postId, userId: loggedInUser.value.id, content, parentId });

async function handleDeleteComment(commentId) {
  if (confirm('Bạn chắc chắn muốn xóa bình luận này?')) {
    const replies = allComments.value.filter(c => c.parentId === commentId);
    await Promise.all(replies.map(r => callApi(`/comments/${r.id}`, { method: 'DELETE' })));
    await callApi(`/comments/${commentId}`, { method: 'DELETE' });
    await fetchData();
  }
}

async function handleToggleLike(comment) {
  if (!loggedInUser.value) return;
  const likedBy = [...(comment.likedBy || [])];
  const userIndex = likedBy.indexOf(loggedInUser.value.id);
  userIndex > -1 ? likedBy.splice(userIndex, 1) : likedBy.push(loggedInUser.value.id);
  await callApi(`/comments/${comment.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ likedBy })
  });
  await fetchData();
}
</script>

<style scoped>
.search-input-container { position: relative; }
.search-icon { position: absolute; top: 50%; transform: translateY(-50%); left: 1rem; color: #6c757d; pointer-events: none; }
.search-input { padding-left: 2.5rem; }
.post-title-link { text-decoration: none; color: inherit; }
.post-title-link:hover .fw-semibold { text-decoration: underline; color: var(--bs-primary); }
</style>