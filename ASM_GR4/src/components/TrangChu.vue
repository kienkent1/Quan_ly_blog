<template>
  <main class="container d-flex flex-column justify-content-center align-items-center ">
    <!-- Phần giới thiệu đầu trang -->
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
      <h3 class="text-center mb-4">Bài viết nổi bật</h3>

      <div v-if="loading" class="text-center mt-5">
        <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
        <p class="mt-2">Đang tải bài viết...</p>
      </div>

      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

      <div v-else-if="mainPosts.length > 0" class="d-flex justify-content-between gap-3 flex-column flex-lg-row">
        <!-- Cột bài viết chính (bên trái) -->
        <div class="col-lg-7">
          <div v-for="post in mainPosts" :key="post.id" class="border rounded-2 pt-3 mb-4 shadow ">
            <!-- Header bài viết -->
            <div class="d-flex justify-content-between align-items-start mb-3 ps-3 pe-3">
              <div class="d-flex align-items-center">
                <router-link :to="{ name: 'user-profile', params: { userId: post.userId } }" class="d-flex align-items-center text-decoration-none text-dark">
                  <BAvatar :src="getFullUrl(post.user?.avatarUrl)" variant="secondary" size="3rem" class="me-3" />
                  <div>
                    <p class="fs-5 fw-bold mb-0">{{ post.user?.displayName || 'Người dùng ẩn danh' }}</p>
                    <small class="text-muted">{{ formatDateTime(post.createdAt) }}</small>
                  </div>
                </router-link>
              </div>
              <!-- Dropdown Menu -->
              <BDropdown variant="link" no-caret toggle-class="text-decoration-none p-0 text-secondary" placement="bottom-end">
                <template #button-content><i class="bi bi-three-dots-vertical"></i></template>
                
                <BDropdownItemButton v-if="loggedInUser" @click="togglePin(post)" :disabled="!isPinned(post.id) && pinnedPostIds.length >= PIN_LIMIT">
                  <i class="bi me-2" :class="isPinned(post.id) ? 'bi-pin-angle-fill text-primary' : 'bi-pin-angle'"></i>
                  {{ isPinned(post.id) ? 'Bỏ ghim' : 'Ghim bài viết' }}
                </BDropdownItemButton>
                
                <span v-if="loggedInUser && !isPinned(post.id) && pinnedPostIds.length >= PIN_LIMIT" :id="`tooltip-target-${post.id}`"></span>
                <BTooltip v-if="loggedInUser && !isPinned(post.id) && pinnedPostIds.length >= PIN_LIMIT" :target="`tooltip-target-${post.id}`" placement="left">
                  Bạn chỉ có thể ghim tối đa {{ PIN_LIMIT }} bài viết.
                </BTooltip>

                <BDropdownDivider v-if="loggedInUser" />

                <BDropdownForm v-if="loggedInUser" class="p-0">
                  <div v-if="post.isReporting" class="px-3 py-2" style="width: 250px;">
                    <BForm @submit.prevent="submitReport(post)">
                      <BFormInput v-model="reportReasons[post.id]" size="sm" placeholder="Nội dung không phù hợp..." autofocus class="mb-2" />
                      <div class="d-flex justify-content-end gap-2">
                        <BButton size="sm" variant="secondary" @click="post.isReporting = false">Hủy</BButton>
                        <BButton size="sm" variant="primary" type="submit">Gửi</BButton>
                      </div>
                    </BForm>
                  </div>
                  <template v-else>
                    <BDropdownItemButton v-if="loggedInUser?.id !== post.userId && (userReportCounts[post.id] ?? 0) < 3" @click.stop="post.isReporting = true">
                      <i class="bi bi-flag-fill me-2 text-danger"></i> Tố cáo bài viết
                    </BDropdownItemButton>
                    <BDropdownText v-if="loggedInUser?.id === post.userId" class="small text-muted px-3">
                      <i class="bi bi-info-circle-fill me-2"></i> Đây là bài viết của bạn.
                    </BDropdownText>
                    <BDropdownText v-if="(userReportCounts[post.id] ?? 0) >= 3" class="small text-muted px-3">
                      <i class="bi bi-check-circle-fill me-2 text-success"></i> Bạn đã báo cáo bài viết này.
                    </BDropdownText>
                  </template>
                </BDropdownForm>
              </BDropdown>
            </div>

            <!-- Nội dung bài viết -->
            <div class="ps-3 pe-3">
              <router-link :to="{ name: 'PostDetail', params: { id: post.id } }" class="post-title-link">
                <h5 v-if="post.title" class="fw-bold">{{ post.title }}</h5>
              </router-link>
              <p v-if="post.content" class="post-content" v-html="getDisplayedContent(post)"></p>
              <button v-if="shouldShowToggle(post)" @click="toggleContent(post.id)" class="btn btn-link p-0 text-decoration-none text-dark fw-bold">
                {{ expandedPosts[post.id] ? 'Ẩn bớt' : 'Xem thêm...' }}
              </button>
              <div v-if="post.imageOrVideoUrl" class="mt-3 text-center bg-light">
                <video v-if="isVideoUrl(post.imageOrVideoUrl)" :src="getFullUrl(post.imageOrVideoUrl)" controls class="img-fluid rounded" style="max-height: 500px;"></video>
                <img v-else :src="getFullUrl(post.imageOrVideoUrl)" alt="Nội dung bài viết" class="img-fluid rounded" style="max-height: 500px;">
              </div>
              <div class=" pt-2 border-top mt-1 mb-2">
                <div class="d-flex justify-content-evenly align-items-center ">
                  <BButton variant="outline-light" class="fs-5 border-0 col-md-4" :class="{ 'text-primary': post.likes?.includes(loggedInUser?.id), 'text-secondary': !post.likes?.includes(loggedInUser?.id) }" @click="handleInteraction(post, 'like')">
                    <i class="bi bi-hand-thumbs-up-fill"></i> ({{ post.likes?.length || 0 }})
                  </BButton>
                  <BButton variant="outline-light" class="fs-5 border-0 col-md-4" :class="{ 'text-primary': post.dislikes?.includes(loggedInUser?.id), 'text-secondary': !post.dislikes?.includes(loggedInUser?.id) }" @click="handleInteraction(post, 'dislike')">
                    <i class="bi bi-hand-thumbs-down-fill"></i> ({{ post.dislikes?.length || 0 }})
                  </BButton>
                  <BButton variant="outline-light" class="fs-5 border-0 text-secondary col-md-4" @click="toggleComments(post)">
                    <i class="bi bi-chat-fill "></i> Bình luận
                  </BButton> 
                </div>
              </div>
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
          </div>
        </div>
      
        <!-- Cột bài viết gần đây (bên phải) -->
        <div class="col-lg-4">
          <div class="position-sticky" style="top: 2rem;">
            <div>
              <h4 class="fst-italic">Bài viết gần đây</h4>
              <div v-if="isRecentPostsLoading" class="d-flex justify-content-center my-3"><div class="spinner-border text-secondary" role="status"><span class="visually-hidden">Loading...</span></div></div>
              <div v-else-if="recentPostsError" class="alert alert-warning small p-2">{{ recentPostsError }}</div>
              <ul v-else class="list-unstyled">
                <li v-if="recentPosts.length === 0" class="text-muted border-top pt-3">Chưa có bài viết nào.</li>
                <li v-for="post in recentPosts" :key="post.id">
                  <router-link :to="{ name: 'PostDetail', params: { id: post.id } }" class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top">
                    <video v-if="post.imageOrVideoUrl && isVideoUrl(post.imageOrVideoUrl)" :src="getFullUrl(post.imageOrVideoUrl)" class="bd-placeholder-img" width="100" height="96" autoplay muted loop playsinline></video>
                    <img v-else-if="post.imageOrVideoUrl" :src="getFullUrl(post.imageOrVideoUrl)" class="bd-placeholder-img" width="100" height="96" alt="Post image"/>
                    <div class="col-lg-8">
                      <h6 class="mb-0">{{ truncateText(post.title || "Bài viết không có tiêu đề", 50) }}</h6>
                      <small class="text-body-secondary">{{ formatDateTime(post.createdAt) }}</small>
                      <div class="mt-1 small">
                         bởi 
                         <router-link :to="{ name: 'user-profile', params: { userId: post.userId } }" class="fw-bold text-decoration-none">{{ post.user?.displayName || 'Người dùng' }}</router-link>
                       </div>
                    </div>
                  </router-link>
                </li>
              </ul>
            </div>
            <div class="mb-4">
              <h4 class="fst-italic">Top tác giả</h4>
              <ul v-if="topAuthors.length > 0" class="list-unstyled">
                <li v-for="author in topAuthors" :key="author.id">
                  <router-link :to="{ name: 'user-profile', params: { userId: author.id } }" class="d-flex align-items-center gap-3 py-2 link-body-emphasis text-decoration-none border-top">
                    <BAvatar 
                      :src="getFullUrl(author.avatarUrl)"
                      :text="author.displayName?.charAt(0).toUpperCase()"
                      size="2.5rem"
                    />
                    <div class="flex-grow-1">
                      <h6 class="mb-0 fw-bold">{{ author.displayName }}</h6>
                      <small class="text-body-secondary">{{ author.postCount }} bài viết</small>
                    </div>
                  </router-link>
                </li>
              </ul>
              <div v-else class="text-muted border-top pt-2 small">
                Chưa có dữ liệu tác giả.
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <div v-else class="text-center text-muted p-4">
        <p>Chưa có bài viết nào được đăng.</p>
      </div>
    </div>

    <!-- Bong bóng chat hiển thị bài viết đã ghim -->
    <div v-if="loggedInUser" class="pinned-posts-container">
      <BButton pill variant="primary" class="shadow-lg" @click="isPinnedListVisible = !isPinnedListVisible">
        <i class="bi bi-pin-angle-fill fs-5"></i>
        <BBadge v-if="pinnedPostIds.length > 0" variant="danger" pill class="position-absolute top-0 start-100 translate-middle">
          {{ pinnedPostIds.length }}
        </BBadge>
      </BButton>
      <div v-if="isPinnedListVisible" class="pinned-posts-list card shadow-lg rounded-3">
        <div class="card-header d-flex justify-content-between align-items-center bg-light">
          <h6 class="mb-0 fw-bold"><i class="bi bi-pin-angle-fill me-2"></i>Bài viết đã ghim</h6>
          <BButton close @click="isPinnedListVisible = false"></BButton>
        </div>
        <div class="card-body p-2">
          <ul v-if="pinnedPosts.length > 0" class="list-group list-group-flush">
            <li v-for="post in pinnedPosts" :key="`pinned-${post.id}`" class="list-group-item d-flex justify-content-between align-items-center py-2 px-2">
              <router-link :to="{ name: 'PostDetail', params: { id: post.id } }" class="text-decoration-none text-dark flex-grow-1 me-2 pinned-post-link d-flex align-items-center gap-3" @click="isPinnedListVisible = false">
                <BAvatar :src="getFullUrl(post.user?.avatarUrl)" :text="post.user?.displayName?.charAt(0).toUpperCase()" size="2.25rem" rounded="circle" variant="secondary" />
                <div class="flex-grow-1 overflow-hidden">
                  <div class="fw-semibold small text-truncate">{{ post.title || 'Bài viết không tiêu đề' }}</div>
                  <div class="text-muted small">bởi {{ post.user?.displayName }}</div>
                </div>
              </router-link>
              <BButton variant="link" class="p-0 text-danger" @click="togglePin(post)"><i class="bi bi-x-circle-fill"></i></BButton>
            </li>
          </ul>
          <div v-else class="text-center text-muted p-3 small">Bạn chưa ghim bài viết nào.<br>(Tối đa {{ PIN_LIMIT }} bài)</div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { BAvatar, BButton, BDropdown, BDropdownText, BDropdownDivider, BDropdownItemButton, BBadge, BDropdownForm, BTooltip, BForm, BFormInput } from 'bootstrap-vue-next';
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import CommentSection from './CommentSection.vue';
import { useAuth } from '../composables/useAuth';

// --- Cấu hình ---
const API_BASE_URL = "http://localhost:3000";
const CONTENT_TRUNCATE_LENGTH = 300; 
const PIN_LIMIT = 5;

// --- State cho Component ---
const { user: loggedInUser } = useAuth();
const mainPosts = ref<any[]>([]); // Bài viết nổi bật ở cột chính
const recentPosts = ref<any[]>([]); // Bài viết gần đây ở sidebar
const allUsers = ref<any[]>([]);
const allComments = ref<any[]>([]);
const reports = ref<any[]>([]);

const loading = ref(true);
const error = ref<string | null>(null);
const isRecentPostsLoading = ref(true);
const recentPostsError = ref<string | null>(null);

const expandedPosts = ref<{ [key: string]: boolean }>({});
const commentsByPost = ref<{ [key: string]: any[] }>({});
const reportReasons = ref<{ [key: string]: string }>({});
const pinnedPostIds = ref<string[]>([]);
const isPinnedListVisible = ref(false);

// --- API Endpoints ---
const mainPostsUrl = `${API_BASE_URL}/posts?state=pass&_expand=user&_sort=createdAt&_order=desc&_limit=10`;
const recentPostsUrl = `${API_BASE_URL}/posts?state=pass&_expand=user&_sort=createdAt&_order=desc&_limit=7`;

// --- Vòng đời & Polling ---
let pollingInterval: number | undefined;

onMounted(() => {
  fetchAllData();
  loadPinnedPosts();
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  pollingInterval = window.setInterval(silentFetchAllData, 60000); // 1 phút
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

// --- Watchers ---
watch(pinnedPostIds, (newIds) => { savePinnedPosts(newIds); }, { deep: true });
watch(loggedInUser, (newUser) => {
  if (newUser) loadPinnedPosts();
  else {
    pinnedPostIds.value = [];
    isPinnedListVisible.value = false;
  }
});
watch([allComments, allUsers], ([newComments, usersList]) => {
    if (!newComments || !usersList) return;
    const userMap = new Map(usersList.map(user => [user.id, user]));
    const groupedComments: { [key: string]: any[] } = {};
    newComments.forEach(comment => {
      const author = userMap.get(comment.userId);
      const processedComment = {
        ...comment,
        author: { 
          displayName: author?.displayName || `Người dùng ẩn`,
          avatarUrl: author ? getFullUrl(author.avatarUrl) : ''
        },
        createdAtFormatted: formatDateTime(comment.createdAt),
      };
      if (!groupedComments[comment.postId]) groupedComments[comment.postId] = [];
      groupedComments[comment.postId].push(processedComment);
    });
    commentsByPost.value = groupedComments;
}, { deep: true, immediate: true });


// --- Computed Properties ---
const pinnedPosts = computed(() => {
  if (!pinnedPostIds.value.length) return [];
  const allAvailablePosts = [...mainPosts.value, ...recentPosts.value];
  const uniquePosts = new Map(allAvailablePosts.map(p => [p.id, p]));
  return pinnedPostIds.value.map(id => uniquePosts.get(id)).filter(Boolean);
});
const userReportCounts = computed(() => {
  if (!loggedInUser.value || !reports.value.length) return {};
  const counts: { [postId: string]: number } = {};
  for (const report of reports.value) {
    if (report.reporterId === loggedInUser.value.id) {
      counts[report.postId] = (counts[report.postId] || 0) + 1;
    }
  }
  return counts;
});

// --- Hàm Fetch Data ---
async function fetchAllData() {
  loading.value = true;
  error.value = null;
  try {
    await Promise.all([
      fetchMainPosts(),
      fetchRecentPosts(),
      fetchAllUsers(),
      fetchAllComments(),
      fetchReports()
    ]);
  } catch (err: any) {
    error.value = "Không thể tải dữ liệu trang chủ. Vui lòng thử lại.";
  } finally {
    loading.value = false;
  }
}
async function silentFetchAllData() {
  await Promise.all([
    silentFetchMainPosts(),
    silentFetchRecentPosts(),
    fetchAllComments(),
    fetchReports()
  ]);
}
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') silentFetchAllData();
}

async function fetchMainPosts() {
  try {
    const response = await fetch(mainPostsUrl);
    if (!response.ok) throw new Error('Không thể tải bài viết nổi bật.');
    const postsData = await response.json();
    mainPosts.value = postsData.map(post => ({ ...post, showComments: false, isReporting: false }));
  } catch (err) {
    console.error("Lỗi fetchMainPosts:", err);
    throw err; // Ném lỗi để Promise.all bắt
  }
}
async function silentFetchMainPosts() {
  try {
    const response = await fetch(mainPostsUrl);
    if (!response.ok) return;
    const newPostsData = await response.json();
    // Giữ lại state (showComments, isReporting) của các bài viết cũ
    const newPostsWithState = newPostsData.map(post => ({
      ...post,
      showComments: mainPosts.value.find(p => p.id === post.id)?.showComments || false,
      isReporting: mainPosts.value.find(p => p.id === post.id)?.isReporting || false,
    }));
    if (JSON.stringify(newPostsWithState) !== JSON.stringify(mainPosts.value)) {
      mainPosts.value = newPostsWithState;
    }
  } catch (err) { console.error('Lỗi silentFetchMainPosts:', err); }
}

async function fetchRecentPosts() {
  isRecentPostsLoading.value = true;
  try {
    const response = await fetch(recentPostsUrl);
    if (!response.ok) throw new Error('Không thể tải các bài viết gần đây.');
    recentPosts.value = await response.json();
  } catch (err: any) {
    recentPostsError.value = err.message || 'Lỗi tải bài viết.';
    throw err; // Ném lỗi để Promise.all bắt
  } finally {
    isRecentPostsLoading.value = false;
  }
}
async function silentFetchRecentPosts() {
    // Tương tự silentFetchMainPosts, có thể implement nếu cần cập nhật sidebar real-time
}
async function fetchAllUsers() { try { const res = await fetch(`${API_BASE_URL}/users`); if (res.ok) allUsers.value = await res.json(); } catch (e) { console.error("Lỗi tải users:", e); throw e; } }
async function fetchAllComments() { try { const res = await fetch(`${API_BASE_URL}/comments`); if (res.ok) allComments.value = await res.json(); } catch (e) { console.error("Lỗi tải comments:", e); throw e; } }
async function fetchReports() { try { const res = await fetch(`${API_BASE_URL}/reports`); if (res.ok) reports.value = await res.json(); } catch (e) { console.error("Lỗi tải reports:", e); throw e; } }

// --- Hàm xử lý sự kiện và tiện ích ---
const getFullUrl = (path: string | null): string => !path ? '' : path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
const formatDateTime = (isoString: string | null): string => !isoString ? '' : new Date(isoString).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const isVideoUrl = (url: string | null): boolean => !url ? false : /\.(mp4|webm|mov|ogg)$/i.test(url);
const truncateText = (text: string | null, maxLength: number): string => (!text || text.length <= maxLength) ? text || '' : text.substr(0, maxLength) + "...";
const toggleContent = (postId: string) => { const post = mainPosts.value.find(p => p.id === postId); if (post) post.isExpanded = !post.isExpanded; };
const toggleComments = (post: any) => { post.showComments = !post.showComments; };
const getDisplayedContent = (post: any) => post.isExpanded ? post.content.replace(/\n/g, '<br />') : (post.content?.substring(0, CONTENT_TRUNCATE_LENGTH) || '').replace(/\n/g, '<br />') + (post.content?.length > CONTENT_TRUNCATE_LENGTH ? '...' : '');
const shouldShowToggle = (post: any) => post.content && post.content.length > CONTENT_TRUNCATE_LENGTH;
const loadPinnedPosts = () => { const key = `pinned_posts_${loggedInUser.value?.id}`; if (key) pinnedPostIds.value = JSON.parse(localStorage.getItem(key) || '[]'); };
const savePinnedPosts = (ids: string[]) => { const key = `pinned_posts_${loggedInUser.value?.id}`; if (key) localStorage.setItem(key, JSON.stringify(ids)); };
const isPinned = (postId: string) => pinnedPostIds.value.includes(postId);
const togglePin = (post: any) => {
  if (!loggedInUser.value) return alert('Vui lòng đăng nhập để ghim bài viết.');
  const index = pinnedPostIds.value.indexOf(post.id);
  if (index > -1) pinnedPostIds.value.splice(index, 1);
  else if (pinnedPostIds.value.length < PIN_LIMIT) pinnedPostIds.value.push(post.id);
  else alert(`Bạn chỉ có thể ghim tối đa ${PIN_LIMIT} bài viết.`);
};
async function submitReport(post: any) { 
  if (!loggedInUser.value) return;
  const reason = reportReasons.value[post.id];
  if (!reason?.trim()) return alert('Vui lòng nhập lý do tố cáo.');
  try {
    const res = await fetch(`${API_BASE_URL}/api/reports`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ postId: post.id, reporterId: loggedInUser.value.id, reason }) });
    if (!res.ok) throw new Error('Không thể gửi báo cáo.');
    alert(`Cảm ơn bạn đã báo cáo bài viết.`);
    post.isReporting = false;
    reportReasons.value[post.id] = '';
    await fetchReports();
  } catch (err) { alert('Đã có lỗi xảy ra khi gửi báo cáo.'); }
}
async function handleInteraction(post: any, interactionType: 'like' | 'dislike') {
  if (!loggedInUser.value) return alert("Bạn cần đăng nhập để thực hiện thao tác này.");
  try {
    const res = await fetch(`${API_BASE_URL}/api/posts/${post.id}/interact`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ userId: loggedInUser.value.id, interactionType }) });

    if (!res.ok) throw new Error('Tương tác không thành công.');
    const updatedPost = await res.json();
    const postIndex = mainPosts.value.findIndex(p => p.id === updatedPost.id);

    if (postIndex !== -1) {
      mainPosts.value[postIndex].likes = updatedPost.likes;
      mainPosts.value[postIndex].dislikes = updatedPost.dislikes;
    }
  } catch (err) { console.error(`Lỗi khi ${interactionType} bài viết:`, err); }
}
async function handleAddComment(postId: string, content: string) { 
  if (!loggedInUser.value) 
  return 
alert('Vui lòng đăng nhập.'); 
try { const res = await fetch(`${API_BASE_URL}/api/comments`, { 
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' }, 
  body: JSON.stringify({ postId, userId: loggedInUser.value.id, content, parentId: null }) }); 
  if (!res.ok) 
  throw new Error('Không thể gửi bình luận.'); 
await fetchAllComments(); 
} catch (err) { 
  alert('Lỗi khi gửi bình luận.'); 
} }
async function handleAddReply(
  postId: string, 
  { content, parentId }: { content: string, parentId: string }) 
  { if (!loggedInUser.value) 
    return 
    alert('Vui lòng đăng nhập.'); 
    try { const res = await fetch(`${API_BASE_URL}/api/comments`, 
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ postId, userId: loggedInUser.value.id, content, parentId }) 
    }); 
    if (!res.ok) 
    throw new Error('Không thể gửi trả lời.'); 
  await fetchAllComments(); 
} catch (err) 
{ alert('Lỗi khi gửi trả lời.'); 

} }
async function handleDeleteComment(commentId: string) { 
  if (!confirm('Bạn chắc chắn muốn xóa?')) 
  return; 
try { const replies = allComments.value.filter(c => c.parentId === commentId); 
  await Promise.all(replies.map(reply => fetch(`${API_BASE_URL}/comments/${reply.id}`, 
  { method: 'DELETE' }))); 
  const res = await fetch(`${API_BASE_URL}/comments/${commentId}`, { 
    method: 'DELETE' 
  }); 
  if (res.ok) 
  await fetchAllComments(); 
} catch (err) { 
  alert('Lỗi khi xóa bình luận.'); 
} }
async function handleToggleLike(comment: any) { 
  if (!loggedInUser.value) return; 
  const userId = loggedInUser.value.id; 
  const likedBy = [...(comment.likedBy || [])]; 
  const userIndex = likedBy.indexOf(userId); 
  if (userIndex > -1) likedBy.splice(userIndex, 1); 
  else likedBy.push(userId); 
  try { const res = await fetch(`${API_BASE_URL}/comments/${comment.id}`, 
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ likedBy }) }); 
    if (res.ok) await fetchAllComments(); 
  } catch (err) { 
    alert('Lỗi khi thích bình luận.'); 
  } }
const topAuthors = computed(() => {
  // Cần có cả danh sách bài viết và người dùng để tính
  if (mainPosts.value.length === 0 || allUsers.value.length === 0) {
    return [];
  }

  // 1. Đếm số bài viết của mỗi userId
  const postCounts = new Map<string, number>();
  for (const post of mainPosts.value) {
    if (post.userId) {
      postCounts.set(post.userId, (postCounts.get(post.userId) || 0) + 1);
    }
  }

  // 2. Chuyển Map thành mảng và sắp xếp theo số lượng bài viết giảm dần
  const sortedAuthorIds = Array.from(postCounts.entries())
    .sort((a, b) => b[1] - a[1]) // Sắp xếp [userId, count] theo count
    .slice(0, 5); // Lấy top 5

  // 3. Map ID đã sắp xếp với thông tin người dùng đầy đủ
  const userMap = new Map(allUsers.value.map(u => [u.id, u]));
  
  return sortedAuthorIds.map(([userId, count]) => {
    const user = userMap.get(userId);
    return user ? { ...user, postCount: count } : null;
  }).filter(Boolean); // Lọc bỏ những user không tìm thấy
});
</script>

<style scoped>
.img-fluid { max-width: 100%; height: auto; }
.post-content { white-space: pre-wrap; line-height: 1.6; }
.post-title-link { text-decoration: none; color: inherit; }
.post-title-link:hover .fw-semibold, .post-title-link:hover .fw-bold { text-decoration: underline; color: var(--bs-primary); }
.pinned-posts-container { position: fixed; bottom: 2rem; right: 2rem; z-index: 1050; }
.pinned-posts-list { position: absolute; bottom: calc(100% + 1rem); right: 0; width: 300px; max-height: 400px; overflow-y: auto; }
.pinned-post-link:hover .fw-semibold { color: var(--bs-primary); }
</style>