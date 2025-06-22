<template>
  <main class="container py-5">
    <div v-if="loading" class="text-center">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    <div v-else-if="post" class="row g-5">
      <!-- CỘT BÊN TRÁI: NỘI DUNG BÀI VIẾT -->
      <div class="col-md-8">
        <div class="p-4 border rounded-4 shadow-sm bg-white">
          <!-- HEADER BÀI VIẾT -->
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="d-flex align-items-center gap-3">
              <BAvatar
                :src="post.avatar"
                :text="post.authorName?.charAt(0).toUpperCase()"
                variant="secondary"
                size="3rem"
              />
              <div>
                <div class="fw-bold">{{ post.authorName }}</div>
                <div class="text-muted small">{{ post.createdAtFormatted }}</div>
              </div>
            </div>

            <!-- ✅ DROPDOWN MENU CHO GHIM & TỐ CÁO -->
            <BDropdown
              variant="link"
              no-caret
              toggle-class="text-decoration-none p-0 text-secondary"
              placement="bottom-end"
            >
              <template #button-content>
                <i class="bi bi-three-dots-vertical"></i>
              </template>

              <!-- CHỨC NĂNG GHIM BÀI VIẾT -->
              <BDropdownItemButton
                @click="togglePin(post)"
                :disabled="!loggedInUser || (!isPinned(post.id) && pinnedPostIds.length >= PIN_LIMIT)"
              >
                <i
                  class="bi me-2"
                  :class="isPinned(post.id) ? 'bi-pin-angle-fill text-primary' : 'bi-pin-angle'"
                ></i>
                {{ isPinned(post.id) ? 'Bỏ ghim' : 'Ghim bài viết' }}
              </BDropdownItemButton>
              <BTooltip
                v-if="!isPinned(post.id) && pinnedPostIds.length >= PIN_LIMIT"
                target="tooltip-target-detail"
                placement="left"
              >
                Bạn chỉ có thể ghim tối đa 5 bài viết.
              </BTooltip>
              <span
                v-if="!isPinned(post.id) && pinnedPostIds.length >= PIN_LIMIT"
                id="tooltip-target-detail"
              ></span>
              <BDropdownDivider />

              <!-- CHỨC NĂNG TỐ CÁO BÀI VIẾT -->
              <BDropdownForm class="p-0">
                <!-- TRẠNG THÁI 1: FORM ĐANG MỞ -->
                <div v-if="isReporting" class="px-3 py-2">
                  <BForm @submit.prevent="submitReport">
                    <label for="report-reason-detail" class="form-label fw-bold small mb-1">
                      Lý do tố cáo:
                    </label>
                    <BFormInput
                      id="report-reason-detail"
                      v-model="reportReason"
                      size="sm"
                      placeholder="Nội dung không phù hợp..."
                      autofocus
                      class="mb-2"
                    />
                    <div class="d-flex justify-content-end gap-2">
                      <BButton size="sm" variant="secondary" @click="isReporting = false">
                        Hủy
                      </BButton>
                      <BButton size="sm" variant="primary" type="submit"> Gửi </BButton>
                    </div>
                  </BForm>
                </div>

                <!-- TRẠNG THÁI 2: FORM ĐANG ĐÓNG -->
                <template v-else>
                  <BDropdownItemButton
                    v-if="loggedInUser?.id !== post.userId && (userReportCounts[post.id] ?? 0) < 3"
                    @click.stop="isReporting = true"
                  >
                    <i class="bi bi-flag-fill me-2 text-danger"></i> Tố cáo bài viết
                  </BDropdownItemButton>
                  <BDropdownText
                    v-if="loggedInUser?.id === post.userId"
                    class="small text-muted px-3"
                  >
                    <i class="bi bi-info-circle-fill me-2"></i>
                    Đây là bài viết của bạn.
                  </BDropdownText>
                  <BDropdownText
                    v-if="(userReportCounts[post.id] ?? 0) >= 3"
                    class="small text-muted px-3"
                  >
                    <i class="bi bi-check-circle-fill me-2 text-success"></i>
                    Bạn đã báo cáo bài viết này.
                  </BDropdownText>
                </template>
              </BDropdownForm>
            </BDropdown>
          </div>

          <!-- NỘI DUNG BÀI VIẾT -->
          <article class="mb-3">
            <h2 class="fw-bold mb-3">{{ post.title }}</h2>
            <p v-html="post.content?.replace(/\r\n/g, '<br />').replace(/\n/g, '<br />')"></p>
          </article>

          <!-- HÌNH ẢNH HOẶC VIDEO -->
          <div v-if="post.imageOrVideoUrl" class="text-center bg-light rounded-3 p-2 mb-3">
            <video
              v-if="isVideoUrl(post.imageOrVideoUrl)"
              controls
              class="w-100 rounded-3"
              style="max-height: 550px; object-fit: contain"
            >
              <source :src="post.imageOrVideoUrl" type="video/mp4" />
            </video>
            <img
              v-else
              :src="post.imageOrVideoUrl"
              class="img-fluid rounded-3"
              style="max-height: 550px; object-fit: contain"
            />
          </div>

          <!-- THANH TƯƠNG TÁC -->
          <div class="pt-2 border-top mt-1">
            <div class="d-flex justify-content-evenly align-items-center">
              <BButton
                variant="outline-light"
                class="fs-5 border-0 col-md-6"
                :class="{
                  'text-primary': post.likes?.includes(loggedInUser?.id),
                  'text-secondary': !post.likes?.includes(loggedInUser?.id)
                }"
                @click="handleInteraction(post, 'like')"
              >
                <i class="bi bi-hand-thumbs-up-fill"></i> Thích ({{ post.likes?.length || 0 }})
              </BButton>
              <BButton
                variant="outline-light"
                class="fs-5 border-0 col-md-6"
                :class="{
                  'text-primary': post.dislikes?.includes(loggedInUser?.id),
                  'text-secondary': !post.dislikes?.includes(loggedInUser?.id)
                }"
                @click="handleInteraction(post, 'dislike')"
              >
                <i class="bi bi-hand-thumbs-down-fill"></i> Không thích ({{
                  post.dislikes?.length || 0
                }})
              </BButton>
            </div>
          </div>
        </div>
      </div>

      <!-- CỘT BÊN PHẢI: KHU VỰC BÌNH LUẬN -->
      <div class="col-md-4">
        <div class="position-sticky" style="top: 1rem">
          <h4>Bình luận ở đây</h4>
          <CommentSection
            :post-id="post.id"
            :comments="processedComments"
            :current-user-id="loggedInUser?.id"
            @add-comment="(content) => handleAddComment(post.id, content)"
            @add-reply="(payload) => handleAddReply(post.id, payload)"
            @delete-comment="handleDeleteComment"
            @toggle-like="handleToggleLike"
          />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import CommentSection from './CommentSection.vue';
import {
  BAvatar,
  BButton,
  BDropdown,
  BDropdownItemButton,
  BDropdownDivider,
  BDropdownForm,
  BDropdownText,
  BForm,
  BFormInput,
  BTooltip
} from 'bootstrap-vue-next';

// --- STATE & ROUTER ---
const route = useRoute();
const router = useRouter();
const { user: loggedInUser } = useAuth();

const postId = route.params.id as string;
const post = ref<any>(null);
const comments = ref<any[]>([]);
const users = ref<any[]>([]);
const reports = ref<any[]>([]); // ✅ STATE FOR REPORTS

const loading = ref(true);
const error = ref<string | null>(null);

const generateId = (): string => Math.random().toString(36).substring(2, 9);

// ✅ STATE FOR PIN & REPORT
const pinnedPostIds = ref<string[]>([]);
const PIN_LIMIT = 5;
const isReporting = ref(false);
const reportReason = ref('');

// --- HELPERS ---
const isVideoUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|mov|ogg)$/i.test(url);
};

// --- DATA FETCHING ---
async function fetchData() {
  loading.value = true;
  error.value = null;
  try {
    const [postRes, commentsRes, usersRes, reportsRes] = await Promise.all([
      fetch(`http://localhost:3000/posts/${postId}`),
      fetch(`http://localhost:3000/comments?postId=${postId}`),
      fetch('http://localhost:3000/users'),
      fetch('http://localhost:3000/reports') // ✅ FETCH REPORTS
    ]);

    if (!postRes.ok) throw new Error(`Không tìm thấy bài viết với ID: ${postId}`);
    if (!commentsRes.ok || !usersRes.ok || !reportsRes.ok) {
      throw new Error('Lỗi khi tải dữ liệu.');
    }

    const postData = await postRes.json();
    comments.value = await commentsRes.json();
    users.value = await usersRes.json();
    reports.value = await reportsRes.json(); // ✅ STORE REPORTS

    const userMap = new Map(users.value.map((user) => [user.id, user]));
    const author = userMap.get(postData.userId);

    const getFullUrl = (url: string | null) => {
      if (!url) return null;
      return url.startsWith('http') ? url : `http://localhost:3000${url}`;
    };

    post.value = {
      ...postData,
      authorName: author?.displayName || 'Người dùng ẩn',
      avatar: getFullUrl(author?.avatarUrl),
      imageOrVideoUrl: getFullUrl(postData.imageOrVideoUrl),
      createdAtFormatted: new Date(postData.createdAt).toLocaleString('vi-VN')
    };
  } catch (e: any) {
    console.error('Lỗi khi tải dữ liệu bài viết:', e);
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
  loadPinnedPosts(); // ✅ LOAD PINNED POSTS ON MOUNT
});

// ✅ WATCHERS FOR PINNING
watch(
  pinnedPostIds,
  (newIds) => {
    savePinnedPosts(newIds);
  },
  { deep: true }
);

watch(loggedInUser, (newUser) => {
  // Luôn tải lại danh sách ghim (logic này đã đúng)
  loadPinnedPosts();

  // ✅ THÊM VÀO: Dọn dẹp state của form tố cáo khi đăng xuất
  if (!newUser) {
    isReporting.value = false;
    reportReason.value = '';
  }
});
// --- COMPUTED PROPERTIES ---
const processedComments = computed(() => {
  if (!comments.value.length || !users.value.length) return [];
  const userMap = new Map(users.value.map((user) => [user.id, user]));
  return comments.value.map((comment) => {
    const author = userMap.get(comment.userId);
    let authorAvatar;
    if (author?.avatarUrl) {
      authorAvatar = author.avatarUrl.startsWith('http')
        ? author.avatarUrl
        : `http://localhost:3000${author.avatarUrl}`;
    }
    return {
      ...comment,
      author: {
        id: author?.id || null,
        displayName: author?.displayName || 'Người dùng ẩn',
        avatarUrl: authorAvatar
      },
      createdAtFormatted: new Date(comment.createdAt).toLocaleString('vi-VN', {
        timeStyle: 'short',
        dateStyle: 'short'
      })
    };
  });
});

// ✅ COMPUTED FOR REPORT COUNT
const userReportCounts = computed(() => {
  if (!loggedInUser.value || !reports.value.length) {
    return {};
  }
  const counts: { [postId: string]: number } = {};
  for (const report of reports.value) {
    if (report.reporterId === loggedInUser.value.id) {
      if (!counts[report.postId]) {
        counts[report.postId] = 0;
      }
      counts[report.postId]++;
    }
  }
  return counts;
});

// --- ✅ PINNING METHODS ---
const getLocalStorageKey = () => {
  if (!loggedInUser.value) return null;
  return `pinned_posts_${loggedInUser.value.id}`;
};

const loadPinnedPosts = () => {
  const key = getLocalStorageKey();
  if (key) {
    const saved = localStorage.getItem(key);
    pinnedPostIds.value = saved ? JSON.parse(saved) : [];
  } else {
    pinnedPostIds.value = [];
  }
};

const savePinnedPosts = (ids: string[]) => {
  const key = getLocalStorageKey();
  if (key) {
    localStorage.setItem(key, JSON.stringify(ids));
  }
};

const isPinned = (postId: string) => {
  return pinnedPostIds.value.includes(postId);
};

const togglePin = (postToPin: any) => {
  if (!loggedInUser.value) {
    alert('Vui lòng đăng nhập để ghim bài viết.');
    return;
  }
  const id = postToPin.id;
  const index = pinnedPostIds.value.indexOf(id);

  if (index > -1) {
    pinnedPostIds.value.splice(index, 1);
  } else {
    if (pinnedPostIds.value.length >= PIN_LIMIT) {
      alert(`Bạn chỉ có thể ghim tối đa ${PIN_LIMIT} bài viết.`);
      return;
    }
    pinnedPostIds.value.push(id);
  }
};

// --- ✅ REPORTING METHOD ---
async function submitReport() {
  if (!loggedInUser.value) {
    alert('Bạn cần đăng nhập để thực hiện thao tác này.');
    return;
  }
  if (!reportReason.value || !reportReason.value.trim()) {
    alert('Vui lòng nhập lý do tố cáo.');
    return;
  }
  const currentReportCount = userReportCounts.value[post.value.id] ?? 0;
  if (currentReportCount >= 3) {
    alert('Bạn đã báo cáo bài viết này 3 lần. Vui lòng chờ admin xem xét.');
    isReporting.value = false;
    return;
  }

  const newReport = {
    postId: post.value.id,
    reporterId: loggedInUser.value.id,
    reason: reportReason.value
  };

  try {
    const res = await fetch('http://localhost:3000/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReport)
    });
    if (!res.ok) {
      throw new Error('Không thể gửi báo cáo.');
    }
    alert(`Cảm ơn bạn đã báo cáo bài viết. Chúng tôi sẽ xem xét sớm nhất.`);
    isReporting.value = false;
    reportReason.value = '';
    await fetchData(); // Refetch to update report count
  } catch (error) {
    console.error('Lỗi khi gửi báo cáo:', error);
    alert('Đã có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại.');
  }
}

// --- OTHER METHODS ---
async function handleAddComment(pId: string, content: string) {
  if (!loggedInUser.value) return;
  const newComment = {
    id: generateId(),
    postId: pId,
    userId: loggedInUser.value.id,
    content,
    parentId: null,
    likedBy: [],
    createdAt: new Date().toISOString()
  };
  try {
    const res = await fetch('http://localhost:3000/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComment)
    });
    if (!res.ok) throw new Error('Không thể gửi bình luận.');
    await fetchData();
  } catch (e) {
    console.error('Lỗi khi thêm bình luận:', e);
  }
}

async function handleAddReply(pId: string, { content, parentId }: { content: string; parentId: string }) {
  if (!loggedInUser.value) return;
  const newReply = {
    id: generateId(),
    postId: pId,
    userId: loggedInUser.value.id,
    content,
    parentId,
    likedBy: [],
    createdAt: new Date().toISOString()
  };
  try {
    const res = await fetch('http://localhost:3000/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReply)
    });
    if (!res.ok) throw new Error('Không thể gửi trả lời.');
    await fetchData();
  } catch (e) {
    console.error('Lỗi khi thêm trả lời:', e);
  }
}

async function handleDeleteComment(commentId: string) {
  if (!confirm('Bạn chắc chắn muốn xóa bình luận này?')) return;
  try {
    const replies = comments.value.filter((c) => c.parentId === commentId);
    await Promise.all(
      replies.map((reply) => fetch(`http://localhost:3000/comments/${reply.id}`, { method: 'DELETE' }))
    );
    const res = await fetch(`http://localhost:3000/comments/${commentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Không thể xóa bình luận.');
    await fetchData();
  } catch (e) {
    console.error('Lỗi khi xóa bình luận:', e);
  }
}

async function handleToggleLike(comment: any) {
  if (!loggedInUser.value) return;
  const userId = loggedInUser.value.id;
  const likedBy = comment.likedBy || [];
  const userIndex = likedBy.indexOf(userId);
  userIndex > -1 ? likedBy.splice(userIndex, 1) : likedBy.push(userId);
  try {
    const res = await fetch(`http://localhost:3000/comments/${comment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ likedBy: likedBy })
    });
    if (!res.ok) throw new Error('Thao tác thất bại.');
    await fetchData();
  } catch (e) {
    console.error('Lỗi khi thích/bỏ thích:', e);
  }
}

async function handleInteraction(postToUpdate: any, interactionType: 'like' | 'dislike') {
  if (!loggedInUser.value) {
    alert('Bạn cần đăng nhập để thực hiện thao tác này.');
    return;
  }
  try {
    const res = await fetch(`http://localhost:3000/api/posts/${postToUpdate.id}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: loggedInUser.value.id,
        interactionType: interactionType
      })
    });
    if (!res.ok) throw new Error('Tương tác không thành công.');
    await fetchData();
  } catch (e) {
    console.error(`Lỗi khi ${interactionType} bài viết:`, e);
  }
}
</script>

<style scoped>
/* Thêm style nếu cần */
</style>