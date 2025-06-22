<template>
  <div v-if="loading" class="text-center p-5">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <p class="mt-2">Đang tải thông tin người dùng...</p>
  </div>

  <div v-else-if="error" class="alert alert-danger text-center col-xl-10 mx-auto mt-4">
    {{ error }}
  </div>

  <div v-else-if="profileUser" class="d-flex flex-column justify-content-center align-items-center">
    <!-- ✅ PHẦN NÀY CHỈ HIỂN THỊ NẾU BẠN LÀ CHỦ PROFILE -->
    <div
      v-if="isOwner"
      class="col-xl-11 p-4 border rounded-4 shadow-sm d-flex flex-column flex-md-row juastify-content-center bg-white"
    >
      <div class="avatar-container d-flex flex-column mb-3 col-md-7">
        <BAvatar
          :src="avatarSrc"
          variant="secondary"
          :text="profileUser.email?.charAt(0).toUpperCase()"
          size="6rem"
        />
        <h5 class="mb-4 mt-2">{{ profileUser.displayName || profileUser.email }}</h5>
        <p>Email: {{ profileUser.email }}</p>
      </div>
      <div class="col-md-5 mt-3 h-25 d-flex flex-column">
        <div class="d-flex gap-4 justify-content-between">
          <BButton variant="secondary" class="mb-3" :to="{ name: 'create-post' }">
            <i class="bi bi-plus-circle-fill"></i> Tạo bài blog
          </BButton>
          <BButton variant="secondary" class="mb-3" :to="{ name: 'trang-ca-nhan' }">
            <i class="bi bi-pencil-square"></i> Cập nhật tài khoản
          </BButton>
        </div>
        <div class="d-grid">
          <BButton variant="secondary" class="mb-3" :to="{ name: 'bai-viet-ca-nhan' }">
            <i class="bi bi-substack"></i> Bài viết của tôi
          </BButton>
        </div>
      </div>
    </div>
    
    <div class="col-xl-10 mt-3 d-flex flex-column flex-md-row justify-content-center gap-3">
      <!-- Cột Giới thiệu (luôn hiển thị) -->
      <div class="col-md-4">
        <div class="position-sticky" style="top: 2rem;">
          <div class="border rounded-4 p-3 bg-white shadow-sm">
            <h4 class="border-bottom pb-2 mb-3">Giới thiệu</h4>
            <div class="d-flex align-items-center gap-3 mb-3">
              <BAvatar
                :src="avatarSrc"
                variant="secondary"
                :text="profileUser.email?.charAt(0).toUpperCase()"
                size="3rem"
              />
              <h6 class="mb-0 fw-bold">{{ profileUser.displayName || profileUser.email }}</h6>
            </div>
            <div class="mb-3">
              <p v-if="userDescription" class="text-dark small" style="white-space: pre-wrap;">{{ userDescription }}</p>
              <p v-else class="text-muted fst-italic small">Người dùng này chưa có mô tả.</p>
            </div>
            <!-- ✅ Nút chỉnh sửa chỉ hiển thị cho chủ profile -->
            <BButton v-if="isOwner" variant="outline-secondary" size="sm" class="w-100" @click="openEditToast">
              <i class="bi bi-pencil-fill"></i> Chỉnh sửa giới thiệu
            </BButton>
          </div>
        </div>
      </div>

      <!-- Cột Bài viết -->
      <div class="col-md-9">
        <div class="border rounded-4 p-3 bg-white shadow-sm">
          <h4 class="border-bottom pb-2">Bài viết của {{ profileUser.displayName || profileUser.email }}</h4>

          <div v-if="profileUserPosts.length > 0" class="mt-3">
            <div
              v-for="post in displayedPosts"
              :key="post.id"
              class="mb-4 p-3 border rounded-4 bg-light"
            >
              <!-- Header bài viết -->
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex align-items-center gap-3">
                  <BAvatar :src="post.avatar" variant="secondary" size="3rem" />
                  <div>
                    <div class="fw-bold">{{ post.authorName }}</div>
                    <div class="text-muted small">
                      {{ post.createdAtFormatted }}
                      <!-- ✅ FIX: Chỉ hiển thị badge status cho chủ bài viết hoặc admin -->
                      <BBadge v-if="isOwner || loggedInUser?.role === 'admin'" :variant="post.statusVariant" pill class="ms-2">
                        {{ post.statusText }}
                      </BBadge>
                    </div>
                  </div>
                </div>

                <!-- ✅ DROPDOWN ĐƯỢC CẬP NHẬT LOGIC HIỂN THỊ -->
                <BDropdown
                  variant="link"
                  no-caret
                  toggle-class="text-decoration-none p-0 text-secondary"
                  placement="bottom-end"
                >
                  <template #button-content>
                    <i class="bi bi-three-dots-vertical fs-5"></i>
                  </template>

                  <!-- Chức năng Ghim (dành cho người dùng đã đăng nhập) -->
                  <BDropdownItemButton
                     v-if="loggedInUser"
                     @click="togglePin(post)"
                     :disabled="!isPinned(post.id) && pinnedPostIds.length >= PIN_LIMIT"
                  >
                    <i class="bi me-2" :class="isPinned(post.id) ? 'bi-pin-angle-fill text-primary' : 'bi-pin-angle'"></i>
                    {{ isPinned(post.id) ? 'Bỏ ghim' : 'Ghim bài viết' }}
                  </BDropdownItemButton>
                  
                  <span v-if="loggedInUser && !isPinned(post.id) && pinnedPostIds.length >= PIN_LIMIT" :id="`tooltip-target-${post.id}`"></span>
                  <BTooltip 
                    v-if="loggedInUser && !isPinned(post.id) && pinnedPostIds.length >= PIN_LIMIT" 
                    :target="`tooltip-target-${post.id}`"
                    placement="left"
                  >
                    Bạn chỉ có thể ghim tối đa 5 bài viết.
                  </BTooltip>

                  <!-- Chức năng Xóa CHỈ DÀNH CHO CHỦ PROFILE -->
                  <BDropdownItemButton v-if="isOwner" @click="handleDeletePost(post.id)">
                    <i class="bi bi-trash-fill me-2 text-danger"></i> Xóa bài viết
                  </BDropdownItemButton>

                  <BDropdownDivider v-if="isOwner || (loggedInUser && !isOwner)" />

                  <!-- Chức năng Report CHỈ DÀNH CHO KHÁCH (ĐÃ ĐĂNG NHẬP) -->
                  <BDropdownForm v-if="loggedInUser && !isOwner" class="p-0">
                    <div v-if="post.isReporting" class="px-3 py-2" style="width: 250px;">
                      <BForm @submit.prevent="submitReport(post)">
                        <BFormInput
                          v-model="reportReasons[post.id]" size="sm"
                          placeholder="Nội dung không phù hợp..." autofocus class="mb-2"
                        />
                        <div class="d-flex justify-content-end gap-2">
                          <BButton size="sm" variant="secondary" @click="post.isReporting = false">Hủy</BButton>
                          <BButton size="sm" variant="primary" type="submit"> Gửi </BButton>
                        </div>
                      </BForm>
                    </div>
                    <template v-else>
                      <BDropdownItemButton
                        v-if="(userReportCounts[post.id] ?? 0) < 3"
                        @click.stop="post.isReporting = true"
                      >
                        <i class="bi bi-flag-fill me-2 text-danger"></i> Tố cáo bài viết
                      </BDropdownItemButton>
                      <BDropdownText v-else class="small text-muted px-3">
                        <i class="bi bi-check-circle-fill me-2 text-success"></i>
                        Bạn đã báo cáo bài viết này.
                      </BDropdownText>
                    </template>
                  </BDropdownForm>
                </BDropdown>

              </div>

              <!-- Nội dung bài viết... -->
              <div class="mb-3">
                <router-link
                  :to="{ name: 'PostDetail', params: { id: post.id } }"
                  class="post-title-link"
                >
                  <h5 class="fw-semibold">{{ post.title }}</h5>
                </router-link>
                <p v-if="!post.isExpanded" v-html="truncateContent(post.content)"></p>
                <p v-else v-html="post.content?.replace(/\n/g, '<br />')"></p>
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
              <div v-if="post.imageOrVideoUrl" class="text-center bg-white rounded-3 p-2">
                <video
                  v-if="isVideoUrl(post.imageOrVideoUrl)"
                  controls
                  class="w-100 rounded-3"
                  style="max-height: 400px; object-fit: contain"
                >
                  <source :src="post.imageOrVideoUrl" type="video/mp4" />
                </video>
                <img
                  v-else
                  :src="post.imageOrVideoUrl"
                  class="img-fluid rounded-3"
                  style="max-height: 400px; object-fit: contain"
                />
              </div>

              <!-- Tương tác -->
              <div class="pt-2 border-top mt-1">
                <div class="d-flex justify-content-evenly align-items-center">
                  <BButton
                    variant="outline-light"
                    class="fs-5 border-0 col-6"
                    :class="{
                      'text-primary': post.likes?.includes(loggedInUser?.id),
                      'text-secondary': !post.likes?.includes(loggedInUser?.id)
                    }"
                    @click="handleInteraction(post, 'like')"
                  >
                    <i class="bi bi-hand-thumbs-up-fill"></i> ({{ post.likes?.length || 0 }})
                  </BButton>
                  <BButton
                    variant="outline-light"
                    class="fs-5 border-0 col-6"
                    :class="{
                      'text-primary': post.dislikes?.includes(loggedInUser?.id),
                      'text-secondary': !post.dislikes?.includes(loggedInUser?.id)
                    }"
                    @click="handleInteraction(post, 'dislike')"
                  >
                    <i class="bi bi-hand-thumbs-down-fill"></i> ({{ post.dislikes?.length || 0 }})
                  </BButton>
                </div>
              </div>
            </div>

            <BPagination
              v-if="profileUserPosts.length > perPage"
              v-model="currentPage"
              :total-rows="profileUserPosts.length"
              :per-page="perPage"
              first-number last-number
              class="d-flex justify-content-center mt-4"
            />
          </div>

          <div v-else class="text-center text-secondary p-4">
            <p>Người dùng này chưa có bài viết nào được duyệt.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="showEditToast" class="modal-toast-overlay">
      <BToast 
        v-model="showEditToast" 
        title="Chỉnh sửa giới thiệu" 
        no-auto-hide 
        static 
        class="shadow-lg modal-toast"
      >
        <BFormTextarea
          v-model="descriptionInput"
          placeholder="Viết vài dòng về bạn..."
          rows="5"
          class="mb-3"
        />
        <div class="d-flex justify-content-end gap-2">
          <BButton variant="secondary" @click="showEditToast = false">Hủy</BButton>
          <BButton variant="primary" @click="saveDescription">Lưu thay đổi</BButton>
        </div>
      </BToast>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useAuth } from '../composables/useAuth.js';
import {
  BButton, BAvatar, BBadge, BPagination, BDropdown, BDropdownItemButton,
  BToast, BFormTextarea, BDropdownDivider, BDropdownForm, BForm, BFormInput,
  BTooltip, BDropdownText
} from 'bootstrap-vue-next';

// --- PROPS & AUTH ---
const props = defineProps<{ userId: string }>();
const { user: loggedInUser } = useAuth(); // Người đang xem trang

// --- STATE CỦA COMPONENT ---
const profileUser = ref<any>(null); // Người chủ của profile
const loading = ref(true);
const error = ref<string | null>(null);
const avatarSrc = ref<string | null>(null);

// --- STATE GIỚI THIỆU ---
const showEditToast = ref(false);
const descriptionInput = ref('');
const userDescription = ref('');

// --- STATE BÀI VIẾT & TƯƠNG TÁC ---
const allPosts = ref<any[]>([]); // Chỉ chứa bài viết của profileUser
const reports = ref<any[]>([]);
const currentPage = ref(1);
const perPage = 5;
const pinnedPostIds = ref<string[]>([]);
const reportReasons = ref<{ [key: string]: string }>({});

const TRUNCATE_LENGTH = 200;
const PIN_LIMIT = 5;

// --- COMPUTED PROPERTIES ---
const isOwner = computed(() => {
  if (!loggedInUser.value || !profileUser.value) return false;
  return loggedInUser.value.id === profileUser.value.id;
});

const profileUserPosts = computed(() => {
  // Lọc thêm các bài viết chưa được duyệt nếu không phải chủ nhân
  const postsToShow = isOwner.value 
      ? allPosts.value 
      : allPosts.value.filter(p => p.state === 'pass');

  return postsToShow.map(post => {
      let statusText = '', statusVariant = 'secondary';
      switch (post.state) {
        case 'pass': statusText = 'Đã duyệt'; statusVariant = 'success'; break;
        case 'fail': statusText = 'Bị từ chối'; statusVariant = 'danger'; break;
        default: statusText = 'Đang chờ duyệt'; statusVariant = 'info'; break;
      }
      const author = post.user; // API đã expand user
      return {
        ...post,
        authorName: author?.displayName || 'Không rõ',
        avatar: author?.avatarUrl?.startsWith('http') ? author.avatarUrl : `http://localhost:3000${author?.avatarUrl || ''}`,
        createdAtFormatted: new Date(post.createdAt).toLocaleString('vi-VN'),
        isExpanded: post.isExpanded || false,
        isReporting: post.isReporting || false,
        statusText,
        statusVariant
      }
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

const displayedPosts = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  const end = start + perPage;
  return profileUserPosts.value.slice(start, end);
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


// --- LOGIC GIỚI THIỆU ---
const getDescriptionKey = () => `user_description_${props.userId}`;

const loadDescription = () => {
  userDescription.value = localStorage.getItem(getDescriptionKey()) || '';
}
const saveDescription = () => {
  localStorage.setItem(getDescriptionKey(), descriptionInput.value);
  userDescription.value = descriptionInput.value;
  showEditToast.value = false;
}
const openEditToast = () => {
  descriptionInput.value = userDescription.value;
  showEditToast.value = true;
}

// --- LOGIC GHIM BÀI VIẾT (của người đang đăng nhập) ---
const getPinLocalStorageKey = () => {
  if (!loggedInUser.value) return null;
  return `pinned_posts_${loggedInUser.value.id}`;
};
const loadPinnedPosts = () => {
  const key = getPinLocalStorageKey();
  if (key) pinnedPostIds.value = JSON.parse(localStorage.getItem(key) || '[]');
  else pinnedPostIds.value = [];
};
const savePinnedPosts = () => {
  const key = getPinLocalStorageKey();
  if (key) localStorage.setItem(key, JSON.stringify(pinnedPostIds.value));
};
const isPinned = (postId: string) => pinnedPostIds.value.includes(postId);
const togglePin = (post: any) => {
  if (!loggedInUser.value) return;
  const index = pinnedPostIds.value.indexOf(post.id);
  if (index > -1) {
    pinnedPostIds.value.splice(index, 1);
  } else if (pinnedPostIds.value.length < PIN_LIMIT) {
    pinnedPostIds.value.push(post.id);
  } else {
    alert(`Bạn chỉ có thể ghim tối đa ${PIN_LIMIT} bài viết.`);
  }
  savePinnedPosts(); // Lưu ngay sau khi thay đổi
};

// --- DATA FETCHING ---
async function fetchProfileData() {
  loading.value = true;
  error.value = null;
  try {
    const [userRes, postsRes, reportsRes] = await Promise.all([
      fetch(`http://localhost:3000/users/${props.userId}`),
      fetch(`http://localhost:3000/posts?userId=${props.userId}&_expand=user`),
      fetch('http://localhost:3000/reports')
    ]);

    if (!userRes.ok) throw new Error('Không tìm thấy người dùng này.');
    
    profileUser.value = await userRes.json();
    allPosts.value = await postsRes.json();
    reports.value = await reportsRes.json();

    // Cập nhật các state phụ thuộc
    loadDescription();
    avatarSrc.value = profileUser.value.avatarUrl
      ? (profileUser.value.avatarUrl.startsWith('http') ? profileUser.value.avatarUrl : `http://localhost:3000${profileUser.value.avatarUrl}`)
      : null;

  } catch (err: any) {
    error.value = err.message || 'Có lỗi xảy ra khi tải trang.';
  } finally {
    loading.value = false;
  }
}

// --- WATCHERS ---
watch(() => props.userId, (newId) => {
  if (newId) fetchProfileData();
}, { immediate: true });

watch(loggedInUser, (newUser) => {
  if (newUser) loadPinnedPosts();
  else pinnedPostIds.value = [];
}, { immediate: true });

// --- METHODS ---
const toggleExpand = (post: any) => { post.isExpanded = !post.isExpanded; };
const truncateContent = (content: string) => !content ? '' : content.length <= TRUNCATE_LENGTH ? content.replace(/\n/g, '<br />') : content.substring(0, TRUNCATE_LENGTH).replace(/\n/g, '<br />') + '...';
const isVideoUrl = (url: string) => /\.(mp4|webm|mov|ogg)$/i.test(url);

async function submitReport(post: any) { 
  if (!loggedInUser.value) return;
  const reason = reportReasons.value[post.id];
  if (!reason?.trim()) return alert('Vui lòng nhập lý do tố cáo.');
  
  try {
    const res = await fetch('http://localhost:3000/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: post.id, reporterId: loggedInUser.value.id, reason }),
    });
    if (!res.ok) throw new Error('Không thể gửi báo cáo.');
    alert(`Cảm ơn bạn đã báo cáo bài viết.`);
    post.isReporting = false;
    reportReasons.value[post.id] = '';
    // Fetch lại reports để cập nhật `userReportCounts`
    const reportsRes = await fetch('http://localhost:3000/reports');
    reports.value = await reportsRes.json();
  } catch (err) {
    alert('Đã có lỗi xảy ra khi gửi báo cáo.');
  }
}

async function handleDeletePost(postId: string) {
  if (!confirm('Bạn chắc chắn muốn xóa bài viết này?')) return;
  try {
    const res = await fetch(`http://localhost:3000/posts/${postId}/cascade`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Xóa bài viết thất bại.');
    // Xóa bài viết khỏi state cục bộ thay vì fetch lại toàn bộ
    allPosts.value = allPosts.value.filter(p => p.id !== postId);
    alert('Đã xóa bài viết thành công!');
  } catch (err: any) {
    alert(err.message || 'Có lỗi xảy ra khi xóa.');
  }
}

async function handleInteraction(post: any, interactionType: 'like' | 'dislike') {
  if (!loggedInUser.value) return alert("Vui lòng đăng nhập để tương tác.");
  try {
    const res = await fetch(`http://localhost:3000/api/posts/${post.id}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: loggedInUser.value.id, interactionType }),
    });
    if (!res.ok) throw new Error('Tương tác không thành công.');
    // Cập nhật lại post trong state cục bộ
    const updatedPost = await res.json();
    const index = allPosts.value.findIndex(p => p.id === post.id);
    if (index !== -1) {
        allPosts.value[index].likes = updatedPost.likes;
        allPosts.value[index].dislikes = updatedPost.dislikes;
    }
  } catch (err) {
    console.error(`Lỗi khi ${interactionType} bài viết:`, err);
  }
}
</script>

<style scoped>
/* ... Style giữ nguyên ... */
.post-title-link { text-decoration: none; color: inherit; }
.post-title-link:hover .fw-semibold { text-decoration: underline; color: var(--bs-primary); }
.modal-toast-overlay { 
  position: fixed; 
  top: 0; 
  left: 0; 
  width: 100vw; 
  height: 100vh; 
  background-color: rgba(0, 0, 0, 0.5); 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  z-index: 1056; }
.modal-toast-overlay :deep(.modal-toast) { width: 500px; max-width: 90vw; }
.modal-toast-overlay :deep(textarea) { width: 475px !important; }
</style>