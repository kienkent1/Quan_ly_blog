<template>
  <main class="container">
    <!-- 1. CAROUSEL -->
    <BCarousel controls indicators ride="carousel" :ride-reverse="true">
      <BCarouselSlide class="carousel-item-height" :img-src="blogImage1" />
      <BCarouselSlide class="carousel-item-height" img-src="https://picsum.photos/1024/480/?image=23" />
      <BCarouselSlide class="carousel-item-height" img-src="https://picsum.photos/1024/480/?image=24" />
    </BCarousel>

    <div class="container marketing mt-3">
      <div class="row">
        <!-- 2. CỘT CHÍNH CHỨA BÀI VIẾT -->
        <div class="col-md-8">
          <!-- BỘ LỌC BÀI VIẾT -->
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

          <!-- DANH SÁCH BÀI VIẾT -->
          <div v-if="paginatedPosts.length > 0">
            <div
              v-for="post in paginatedPosts"
              :key="post.id"
              class="mb-4 p-3 border rounded-4 shadow-sm bg-white post-card"
            >
              <!-- HEADER BÀI VIẾT -->
              <div class="d-flex justify-content-between align-items-start mb-3">
                
                <div class="d-flex align-items-center gap-3 ">
                  <router-link :to="{ name: 'user-profile', params: { userId: post.userId } }" class="d-flex align-items-center text-decoration-none text-dark">
                    <BAvatar
                      :src="post.avatar"
                      :text="post.authorName?.charAt(0).toUpperCase()"
                      variant="secondary"
                      size="2.5rem"
                      class="me-3"
                    />
                    <div class="flex-grow-1">
                      <div class="fw-bold">{{ post.authorName }}</div>
                      <div class="text-muted small">{{ post.createdAtFormatted }}</div>
                    
                    </div>
                  </router-link>

                </div>
                
                <BDropdown
                  variant="link"
                  no-caret
                  toggle-class="text-decoration-none p-0 text-secondary"
                  placement="bottom-end"
                >
                  <template #button-content>
                    <i class="bi bi-three-dots-vertical"></i>
                  </template>

                  <!-- ✅ CHỨC NĂNG GHIM BÀI VIẾT -->
                  <BDropdownItemButton
                     @click="togglePin(post)"
                     :disabled="!loggedInUser || (!isPinned(post.id) && pinnedPostIds.length >= 5)"
                  >
                    <i class="bi me-2" :class="isPinned(post.id) ? 'bi-pin-angle-fill text-primary' : 'bi-pin-angle'"></i>
                    {{ isPinned(post.id) ? 'Bỏ ghim' : 'Ghim bài viết' }}
                  </BDropdownItemButton>
                  <BTooltip 
                    v-if="!isPinned(post.id) && pinnedPostIds.length >= 5" 
                    target-id="tooltip-target" 
                    placement="left"
                  >
                    Bạn chỉ có thể ghim tối đa 5 bài viết.
                  </BTooltip>
                  <span v-if="!isPinned(post.id) && pinnedPostIds.length >= 5" id="tooltip-target"></span>
                  <!-- KẾT THÚC CHỨC NĂNG GHIM -->
                  <BDropdownDivider />

                  <BDropdownForm class="p-0">
                    <!-- TRẠNG THÁI 1: FORM ĐANG MỞ -->
                    <div v-if="post.isReporting" class="px-3 py-2">
                      <BForm @submit.prevent="submitReport(post)">
                        <label :for="`report-reason-${post.id}`" class="form-label fw-bold small mb-1">
                          Lý do tố cáo:
                        </label>
                        <BFormInput
                          :id="`report-reason-${post.id}`"
                          v-model="reportReasons[post.id]"
                          size="sm"
                          placeholder="Nội dung không phù hợp..."
                          autofocus
                          class="mb-2"
                        />
                        <div class="d-flex justify-content-end gap-2">
                          <BButton size="sm" variant="secondary" @click="post.isReporting = false">
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
                        @click.stop="post.isReporting = true"
                      >
                        <i class="bi bi-flag-fill me-2 text-danger"></i> Tố cáo bài viết
                      </BDropdownItemButton>
                      <BDropdownText v-if="loggedInUser?.id === post.userId" class="small text-muted px-3">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        Đây là bài viết của bạn.
                      </BDropdownText>
                      <BDropdownText v-if="(userReportCounts[post.id] ?? 0) >= 3" class="small text-muted px-3">
                        <i class="bi bi-check-circle-fill me-2 text-success"></i>
                        Bạn đã báo cáo bài viết này.
                      </BDropdownText>
                    </template>
                  </BDropdownForm>
                </BDropdown>
              </div>

              <!-- NỘI DUNG BÀI VIẾT -->
              <div class="mb-3">
                <router-link :to="{ name: 'PostDetail', params: { id: post.id } }" class="post-title-link">
                  <h5 class="fw-semibold">{{ post.title }}</h5>
                </router-link>
                
                <p v-if="!post.isExpanded && post.content" v-html="truncateContent(post.content)"></p>
                <p v-else-if="post.content" v-html="post.content?.replace(/\r\n/g, '<br />').replace(/\n/g, '<br />')"></p>
                
                <BButton
                  v-if="post.content && post.content.length > TRUNCATE_LENGTH"
                  variant="link"
                  class="btn btn-link p-0 text-decoration-none text-dark fw-bold"
                  @click="toggleExpand(post)"
                >
                  {{ post.isExpanded ? 'Ẩn bớt' : 'Xem thêm...' }}
                </BButton>
              </div>

              <!-- HÌNH ẢNH HOẶC VIDEO -->
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
                />
              </div>

              <!-- THANH TƯƠNG TÁC -->
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
                    @click="toggleComments(post.id)"
                  >
                    <i class="bi bi-chat-fill"></i> Bình luận
                  </BButton>
                </div>
              </div>

              <!-- KHU VỰC BÌNH LUẬN -->
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
            
            <BPagination
              v-model="currentPage"
              :total-rows="rows"
              :per-page="perPage"
              first-number
              last-number
              class="d-flex justify-content-center mt-4"
            />
          </div>
          <div v-else class="text-center text-muted py-5">
            <h5>Chưa có bài viết nào được duyệt.</h5>
          </div>
        </div>

        <!-- 3. SIDEBAR BÊN PHẢI -->
        <div class="col-md-4">
          <div class="position-sticky" style="top: 2rem">
            <!-- Ô TÌM KIẾM -->
            <div class="search-input-container mb-4">
              <BFormInput
                v-model="searchQuery"
                type="text"
                placeholder="Tìm kiếm bài viết..."
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
                    <div
                      class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top"
                    >
                      <video
                        v-if="post.imageOrVideoUrl && isVideoUrl(post.imageOrVideoUrl)"
                        :src="post.imageOrVideoUrl"
                        style="width: 96px; height: 96px; object-fit: cover; border-radius: 0.25rem"
                        autoplay muted loop playsinline
                        alt="Post video preview"
                      ></video>
                      <img
                        v-else
                        :src="post.imageOrVideoUrl || post.avatar || 'https://via.placeholder.com/96x96'"
                        style="width: 96px; height: 96px; object-fit: cover; border-radius: 0.25rem"
                        alt="thumbnail"
                      />
                      <div class="col-lg-8">
                        <h6 class="mb-0">{{ post.title || 'Bài viết không có tiêu đề' }}</h6>
                        <small class="text-body-secondary">bởi {{ post.authorName }}</small>
                      </div>
                    </div>
                   </router-link>
                </li>
              </ul>
              <p v-else class="text-muted border-top pt-3">Không tìm thấy bài viết nào.</p>
            </div>

            <!-- HIỂN THỊ TOP 5 BÀI VIẾT -->
            <div v-if="!searchQuery.trim()" class="border rounded-2 p-2 mb-4">
              <h4 class="fst-italic mb-3 border-bottom pb-2">Top bài viết nổi bật</h4>
              <ul v-if="topPosts.length > 0" class="list-unstyled mb-0">
                <li v-for="post in topPosts" :key="`top-${post.id}`">
                   <router-link :to="{ name: 'PostDetail', params: { id: post.id } }" class="post-title-link">
                    <div
                      class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top"
                    >
                      <video
                        v-if="post.imageOrVideoUrl && isVideoUrl(post.imageOrVideoUrl)"
                        :src="post.imageOrVideoUrl"
                        style="width: 96px; height: 96px; object-fit: cover; border-radius: 0.25rem"
                        autoplay muted loop playsinline
                        alt="Post video preview"
                      ></video>
                      <img
                        v-else
                        :src="post.imageOrVideoUrl || post.avatar || 'https://via.placeholder.com/96x96'"
                        style="width: 96px; height: 96px; object-fit: cover; border-radius: 0.25rem"
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

            <!-- HIỂN THỊ TOP TÁC GIẢ -->
            <div v-if="!searchQuery.trim()" class="border rounded-2 p-2">
              <h4 class="fst-italic mb-3 border-bottom pb-2">Top tác giả</h4>
              <ul v-if="topAuthors.length > 0" class="list-unstyled mb-0">
                <li
                  v-for="author in topAuthors"
                  :key="author.id"
                  class="d-flex align-items-center mb-3"
                > 
              <router-link :to="{ name: 'user-profile', params: { userId: author.id } }" class="d-flex align-items-center text-decoration-none text-dark">
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

    <!-- ✅ ĐÃ SỬA LỖI: CHỈ GIỮ LẠI MỘT KHỐI BONG BÓNG CHAT -->
    <div v-if="loggedInUser" class="pinned-posts-container">
      <!-- Nút bấm để mở/đóng danh sách ghim -->
      <BButton
        pill
        variant="primary"
        class="shadow-lg"
        @click="isPinnedListVisible = !isPinnedListVisible"
      >
        <i class="bi bi-pin-angle-fill fs-5"></i>
        <BBadge v-if="pinnedPostIds.length > 0" variant="danger" pill class="position-absolute top-0 start-100 translate-middle">
          {{ pinnedPostIds.length }}
        </BBadge>
      </BButton>

      <!-- Danh sách các bài đã ghim -->
      <div v-if="isPinnedListVisible" class="pinned-posts-list card shadow-lg rounded-3">
        <div class="card-header d-flex justify-content-between align-items-center bg-light">
          <h6 class="mb-0 fw-bold">
            <i class="bi bi-pin-angle-fill me-2"></i>
            Bài viết đã ghim
          </h6>
          <BButton close @click="isPinnedListVisible = false"></BButton>
        </div>
        <div class="card-body p-2">
          <ul v-if="pinnedPosts.length > 0" class="list-group list-group-flush">
            <li
              v-for="post in pinnedPosts"
              :key="`pinned-${post.id}`"
              class="list-group-item d-flex justify-content-between align-items-center py-2 px-2"
            >
                <router-link
                    :to="{ name: 'PostDetail', params: { id: post.id } }"
                    class="text-decoration-none text-dark flex-grow-1 me-2 pinned-post-link d-flex align-items-center gap-3"
                    @click="isPinnedListVisible = false"
                >
                    <BAvatar
                      :src="post.avatar"
                      :text="post.authorName?.charAt(0).toUpperCase()"
                      size="2.25rem"
                      rounded="circle"
                      variant="secondary"
                    />
                    <div class="flex-grow-1 overflow-hidden">
                      <div class="fw-semibold small text-truncate">{{ post.title || 'Bài viết không tiêu đề' }}</div>
                      <div class="text-muted x-small">bởi {{ post.authorName }}</div>
                    </div>
                </router-link>
                <BButton variant="link" class="p-0 text-danger" @click="togglePin(post)">
                    <i class="bi bi-x-circle-fill"></i>
                </BButton>
            </li>
          </ul>
          <div v-else class="text-center text-muted p-3 small">
            Bạn chưa ghim bài viết nào.
            <br>
            (Tối đa 5 bài)
          </div>
        </div>
      </div>
    </div>

  </main>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useAuth } from '../composables/useAuth';
import CommentSection from './CommentSection.vue';
import { emitter } from '../eventBus.js';
import { RouterLink } from 'vue-router';
import {
  BAvatar,
  BPagination,
  BCarousel,
  BCarouselSlide,
  BButton,
  BFormInput,
  BDropdown,
  BDropdownText,
  BDropdownDivider,
  BDropdownItemButton,
  BBadge,
  BDropdownForm,
  BTooltip,
  BForm
} from 'bootstrap-vue-next';

// --- PHẦN STATE VÀ CONSTANTS ---
const { user: loggedInUser } = useAuth();
const posts = ref<any[]>([]);
const users = ref<any[]>([]);
const comments = ref<any[]>([]);
const reports = ref<any[]>([]);
const processedPosts = ref<any[]>([]);
const commentsByPost = ref<{ [key: string]: any[] }>({});
const searchQuery = ref('');
const activeSort = ref<'newest' | 'top'>('newest');
const reportReasons = ref<{ [key: string]: string }>({});
const currentPage = ref(1);
const perPage = 5;
const blogImage1 = '/blog1.jpg';
const TRUNCATE_LENGTH = 250;
const generateId = (): string => Math.random().toString(36).substring(2, 9);

// ✅ STATE MỚI CHO CHỨC NĂNG GHIM BÀI VIẾT
const pinnedPostIds = ref<string[]>([]);
const isPinnedListVisible = ref(false);
const PIN_LIMIT = 5;

const getFullUrl = (url: string | null) => {
          if (!url) return null;
          return url.startsWith('http') ? url : `http://localhost:3000${url}`;
        };
// --- HÀM TRỢ GIÚP ---
const isVideoUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|mov|ogg)$/i.test(url);
};

const truncateContent = (content: string | null | undefined): string => {
  if (!content) return '';
  if (content.length <= TRUNCATE_LENGTH) return content.replace(/\r\n/g, '<br />').replace(/\n/g, '<br />');
  return content.substring(0, TRUNCATE_LENGTH).replace(/\r\n/g, '<br />').replace(/\n/g, '<br />') + '...';
};

const toggleExpand = (post: any) => {
  post.isExpanded = !post.isExpanded;
};

const toggleComments = (postId: string) => {
    const post = processedPosts.value.find(p => p.id === postId);
    if (post) {
        post.showComments = !post.showComments;
    }
};

// --- PHẦN FETCH DATA ---
async function fetchData() {
  try {
    const [postsRes, usersRes, commentsRes, reportsRes] = await Promise.all([
      fetch('http://localhost:3000/posts?state=pass'),
      fetch('http://localhost:3000/users'),
      fetch('http://localhost:3000/comments'),
      fetch('http://localhost:3000/reports'),
    ]);
    if (!postsRes.ok || !usersRes.ok || !commentsRes.ok || !reportsRes.ok) {
        throw new Error('Một trong các yêu cầu API thất bại');
    }
    posts.value = await postsRes.json();
    users.value = await usersRes.json();
    comments.value = await commentsRes.json();
    reports.value = await reportsRes.json();
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
}
// Hàm handleAvatarUpdate
// Trong file BaiViet.vue

const handleAvatarUpdate = (payload: { userId: string, newAvatarUrl: string }) => {
  // ✅ LOG KHI NHẬN ĐƯỢC SỰ KIỆN
  

  const { userId, newAvatarUrl } = payload;
  if (!userId) {
    console.error('Lỗi: Sự kiện nhận được không có userId.');
    return;
  }
  
  const fullAvatarUrl = getFullUrl(newAvatarUrl);
  let updatedInPosts = false;
  let updatedInAuthors = false;

  // Cập nhật trong danh sách bài viết chính (processedPosts)
  
  processedPosts.value.forEach(post => {
    // So sánh userId từ sự kiện với userId của tác giả bài viết
    if (post.userId === userId) {
      
      post.avatar = fullAvatarUrl;
      updatedInPosts = true;
    }
  });
  if (!updatedInPosts) {
    console.warn(`Không tìm thấy user ID: ${userId} trong bất kỳ bài viết nào của processedPosts.`);
  }

  // Cập nhật trong danh sách top tác giả (topAuthors)
 
  topAuthors.value.forEach(author => {
    // So sánh userId từ sự kiện với id của tác giả
    if (author.id === userId) {
      
      author.avatarUrl = fullAvatarUrl;
      updatedInAuthors = true;
    }
  });
  if (!updatedInAuthors) {
    console.warn(`Không tìm thấy user ID: ${userId} trong danh sách topAuthors.`);
  }

 
};


onMounted(() => {
  
  fetchData();
  loadPinnedPosts();
  emitter.on('avatarUpdated', handleAvatarUpdate);
});

onUnmounted(() => {
  
  emitter.off('avatarUpdated', handleAvatarUpdate);
});

// --- PHẦN WATCHERS ---
watch([posts, users, comments], () => {
    if (!users.value.length || !posts.value.length) {
        processedPosts.value = [];
        commentsByPost.value = {};
        return;
    }
    const userMap = new Map(users.value.map(user => [user.id, user]));
    const stateMap = processedPosts.value.reduce((acc, post) => {
        acc[post.id] = { 
          showComments: post.showComments,
          isExpanded: post.isExpanded,
          isReporting: post.isReporting 
        };
        return acc;
    }, {} as {[key: string]: any});
    
    processedPosts.value = posts.value.map(post => {
        const author = userMap.get(post.userId);
        return {
            ...post,
            authorName: author?.displayName || 'Người dùng ẩn',
            avatar: getFullUrl(author?.avatarUrl),
            imageOrVideoUrl: getFullUrl(post.imageOrVideoUrl),
            createdAtFormatted: new Date(post.createdAt).toLocaleString('vi-VN'),
            isExpanded: stateMap[post.id]?.isExpanded || false,
            showComments: stateMap[post.id]?.showComments || false,
            isReporting: stateMap[post.id]?.isReporting || false,
        };
    });
    
    const groupedComments: { [key: string]: any[] } = {};
    comments.value.forEach(comment => {
        const author = userMap.get(comment.userId);
        const processedComment = {
            ...comment,
            author: {
                id: author?.id || null,
                displayName: author?.displayName || 'Người dùng ẩn',
                // ✅ SỬA LỖI: Không cần định nghĩa lại getFullUrl ở đây nữa
                avatarUrl: getFullUrl(author?.avatarUrl)
            },
            createdAtFormatted: new Date(comment.createdAt).toLocaleString('vi-VN', { timeStyle: 'short', dateStyle: 'short' }),
        };
        if (!groupedComments[comment.postId]) { groupedComments[comment.postId] = []; }
        groupedComments[comment.postId].push(processedComment);
    });
    commentsByPost.value = groupedComments;
}, { deep: true, immediate: true });

watch(activeSort, () => {
  currentPage.value = 1;
});

// ✅ WATCHER CHO CHỨC NĂNG GHIM
// Tự động lưu vào localStorage khi danh sách ghim thay đổi
watch(pinnedPostIds, (newIds) => {
  savePinnedPosts(newIds);
}, { deep: true });

// Tải lại danh sách ghim khi người dùng thay đổi (đăng nhập/đăng xuất)
watch(loggedInUser, (newUser) => {
    // Luôn tải lại danh sách ghim cho user mới (hoặc xóa đi nếu là logout)
    loadPinnedPosts();

    // Nếu người dùng đăng xuất (newUser là null)
    if (!newUser) {
        // Đóng danh sách bài viết đã ghim nếu nó đang mở
        isPinnedListVisible.value = false;

        // Xóa nội dung ô tìm kiếm
        searchQuery.value = '';

        // Reset bộ lọc về mặc định
        activeSort.value = 'newest';
        
        // Reset phân trang về trang đầu tiên
        currentPage.value = 1;

        // Xóa các lý do report đang nhập dở
        reportReasons.value = {};
    }
});


// --- CÁC METHODS ---

// ✅ CÁC HÀM MỚI CHO VIỆC GHIM BÀI VIẾT
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
    // Nếu không có user, xóa danh sách ghim
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

const togglePin = (post: any) => {
  if (!loggedInUser.value) {
    alert('Vui lòng đăng nhập để ghim bài viết.');
    return;
  }
  const postId = post.id;
  const index = pinnedPostIds.value.indexOf(postId);

  if (index > -1) {
    // Nếu đã ghim -> Bỏ ghim
    pinnedPostIds.value.splice(index, 1);
  } else {
    // Nếu chưa ghim -> Kiểm tra giới hạn trước khi ghim
    if (pinnedPostIds.value.length >= PIN_LIMIT) {
      alert(`Bạn chỉ có thể ghim tối đa ${PIN_LIMIT} bài viết.`);
      return;
    }
    pinnedPostIds.value.push(postId);
  }
};
// --- KẾT THÚC CÁC HÀM MỚI ---

const setSort = (type: 'newest' | 'top') => {
  activeSort.value = type;
};

async function submitReport(post: any) { 
  if (!loggedInUser.value) {
    alert("Bạn cần đăng nhập để thực hiện thao tác này.");
    return;
  }
  const reason = reportReasons.value[post.id];
  if (!reason || !reason.trim()) {
    alert('Vui lòng nhập lý do tố cáo.');
    return;
  }

  const currentReportCount = userReportCounts.value[post.id] ?? 0;
  if (currentReportCount >= 3) {
    alert('Bạn đã báo cáo bài viết này 3 lần. Vui lòng chờ admin xem xét.');
    post.isReporting = false; 
    return;
  }

  const newReport = {
    postId: post.id,
    reporterId: loggedInUser.value.id,
    reason: reason,
  };

  try {
    const res = await fetch('http://localhost:3000/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReport),
    });
    if (!res.ok) {
        throw new Error('Không thể gửi báo cáo.');
    }

    alert(`Cảm ơn bạn đã báo cáo bài viết. Chúng tôi sẽ xem xét sớm nhất.`);
    post.isReporting = false;
    reportReasons.value[post.id] = '';
    await fetchData(); 

  } catch (error) {
    console.error('Lỗi khi gửi báo cáo:', error);
    alert('Đã có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại.');
  }
}

async function handleAddComment(postId: string, content: string) {
  if (!loggedInUser.value) {
    alert('Vui lòng đăng nhập để bình luận.');
    return;
  }
  
  // Dữ liệu chỉ cần những thông tin này, server sẽ tự tạo id và ngày tháng
  const commentPayload = { 
    postId, 
    userId: loggedInUser.value.id, 
    content,
    parentId: null // Đây là bình luận gốc
  };

  try {
    // ✅ THAY ĐỔI: Gọi đến API tùy chỉnh có khả năng tạo thông báo
    const res = await fetch('http://localhost:3000/api/comments', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentPayload), // Gửi payload đã được dọn dẹp
    });
    
    if (!res.ok) throw new Error('Không thể gửi bình luận.');
    
    // Sau khi gửi thành công, fetch lại toàn bộ dữ liệu để cập nhật giao diện
    await fetchData(); 
  } catch (error) {
    console.error('Lỗi khi thêm bình luận:', error);
    alert('Đã có lỗi xảy ra khi gửi bình luận.');
  }
}

async function handleAddReply(postId: string, { content, parentId }: { content: string, parentId: string }) {
  if (!loggedInUser.value) {
      alert('Vui lòng đăng nhập để trả lời bình luận.');
      return;
  }

  // Dữ liệu gửi đi cho một trả lời
  const replyPayload = { 
      postId, 
      userId: loggedInUser.value.id, 
      content, 
      parentId 
  };
  
  try {
    // ✅ THAY ĐỔI: Gọi đến API tùy chỉnh có khả năng tạo thông báo
    const res = await fetch('http://localhost:3000/api/comments', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(replyPayload),
    });

    if (!res.ok) throw new Error('Không thể gửi trả lời.');
    
    // Tải lại dữ liệu để cập nhật giao diện
    await fetchData();
  } catch (error) {
    console.error('Lỗi khi thêm trả lời:', error);
    alert('Đã có lỗi xảy ra khi gửi trả lời.');
  }
}

async function handleDeleteComment(commentId: string) {
    if (!confirm('Bạn chắc chắn muốn xóa bình luận này?')) return;
    try {
        const replies = comments.value.filter(c => c.parentId === commentId);
        await Promise.all(
            replies.map(reply => fetch(`http://localhost:3000/comments/${reply.id}`, { method: 'DELETE' }))
        );

        const res = await fetch(`http://localhost:3000/comments/${commentId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa bình luận.');
        await fetchData();
    } catch (error) {
        console.error('Lỗi khi xóa bình luận:', error);
    }
}

async function handleToggleLike(comment: any) {
  if (!loggedInUser.value) return;
  const userId = loggedInUser.value.id;
  const likedBy = comment.likedBy || [];
  const userIndex = likedBy.indexOf(userId);
  
  if (userIndex > -1) likedBy.splice(userIndex, 1);
  else likedBy.push(userId);
  
  try {
    const res = await fetch(`http://localhost:3000/comments/${comment.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ likedBy: likedBy }),
    });
    if (!res.ok) throw new Error('Thao tác thất bại.');
    await fetchData();
  } catch (error) {
    console.error('Lỗi khi thích/bỏ thích:', error);
  }
}

async function handleInteraction(post: any, interactionType: 'like' | 'dislike') {
  if (!loggedInUser.value) {
    alert("Bạn cần đăng nhập để thực hiện thao tác này.");
    return;
  }
  try {
    const res = await fetch(`http://localhost:3000/api/posts/${post.id}/interact`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: loggedInUser.value.id, interactionType }),
    });
    if (!res.ok) throw new Error('Tương tác không thành công.');
    await fetchData();
  } catch (error) {
    console.error(`Lỗi khi ${interactionType} bài viết:`, error);
  }
}

// --- PHẦN COMPUTED PROPERTIES ---

// ✅ COMPUTED MỚI ĐỂ LẤY THÔNG TIN ĐẦY ĐỦ CỦA CÁC BÀI ĐÃ GHIM
const pinnedPosts = computed(() => {
  if (!pinnedPostIds.value.length) return [];
  // Duyệt qua danh sách ID đã ghim và tìm thông tin post tương ứng trong processedPosts
  return pinnedPostIds.value
    .map(id => processedPosts.value.find(p => p.id === id))
    .filter(Boolean); // Lọc ra những post có thể không tìm thấy (ví dụ: đã bị xóa)
});

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

const filteredAndSortedPosts = computed(() => {
  const postsToDisplay = [...processedPosts.value];

  if (activeSort.value === 'top') {
    postsToDisplay.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
  } else {
    postsToDisplay.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return postsToDisplay;
});

const rows = computed(() => filteredAndSortedPosts.value.length);
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  const end = start + perPage;
  return filteredAndSortedPosts.value.slice(start, end);
});

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return [];
  const lowerCaseQuery = searchQuery.value.toLowerCase();
  return processedPosts.value.filter(
    (post) =>
      post.authorName?.toLowerCase().includes(lowerCaseQuery) ||
      post.title?.toLowerCase().includes(lowerCaseQuery) ||
      post.content?.toLowerCase().includes(lowerCaseQuery)
  );
});

const topPosts = computed(() => {
  return [...processedPosts.value]
    .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
    .slice(0, 5);
});

const topAuthors = computed(() => {
  if (!posts.value.length || !users.value.length) return [];
  const postCounts = posts.value.reduce((acc, post) => {
    acc[post.userId] = (acc[post.userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return users.value
    .map((user) => ({
      ...user,
     avatarUrl: getFullUrl(user.avatarUrl),
      postCount: postCounts[user.id] || 0
    }))
    .filter((user) => user.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 5);
});
</script>

<style scoped>
.carousel-item-height :deep(img) {
  height: 450px;
  object-fit: cover;
  width: 100%;
}
.search-input-container {
  position: relative;
}
.search-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 1rem;
  color: #6c757d;
  pointer-events: none;
}
.search-input {
  padding-left: 2.5rem;
}
.post-title-link {
  text-decoration: none;
  color: inherit;
}
.post-title-link:hover .fw-semibold {
  text-decoration: underline;
  color: var(--bs-primary);
}

.post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

/* ✅ CSS MỚI CHO BONG BÓNG CHAT */
.pinned-posts-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1050; /* Cao hơn hầu hết các element khác */
}

.pinned-posts-list {
  position: absolute;
  bottom: calc(100% + 1rem); /* Hiển thị phía trên nút bấm */
  right: 0;
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
}

.pinned-post-link:hover .fw-semibold {
  color: var(--bs-primary);
}
</style>

