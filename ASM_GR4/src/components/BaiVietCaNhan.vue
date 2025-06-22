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

          <!-- KHỐI v-if: HIỂN THỊ KHI CÓ BÀI VIẾT -->
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
                  <BAvatar :src="post.avatar" variant="secondary" size="3rem" class="me-3" />
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

              <!-- Tương tác -->
              <div class="pt-2 border-top mt-1">
                <div class="d-flex justify-content-evenly align-items-center">
                  <BButton
                    variant="outline-light"
                    class="fs-5 border-0 col-md-4"
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
                    class="fs-5 border-0 col-md-4"
                    :class="{
                      'text-primary': post.dislikes?.includes(loggedInUser?.id),
                      'text-secondary': !post.dislikes?.includes(loggedInUser?.id)
                    }"
                    @click="handleInteraction(post, 'dislike')"
                  >
                    <i class="bi bi-hand-thumbs-down-fill"></i> ({{ post.dislikes?.length || 0 }})
                  </BButton>
                  <BButton
                    variant="outline-light"
                    class="fs-5 border-0 text-secondary col-md-4"
                    @click="toggleComments(post)"
                  >
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

          <!-- ✅ THAY ĐỔI: Khi không có bài viết nào, chỉ cần 1 thông báo duy nhất -->
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
                placeholder="Tìm kiếm trong bài viết của bạn..."
                class="shadow-none search-input"
              />
              <i class="bi bi-search search-icon"></i>
            </div>

            <!-- HIỂN THỊ KẾT QUẢ TÌM KIẾM (CHỈ HIỆN KHI CÓ NHẬP `searchQuery`) -->
            <div v-if="searchQuery.trim()">
              <h4 class="fst-italic">Kết quả tìm kiếm</h4>
              <ul v-if="searchResults.length > 0" class="list-unstyled">
                <li v-for="post in searchResults" :key="`search-${post.id}`">
                  <router-link
                    :to="{ name: 'PostDetail', params: { id: post.id } }"
                    class="post-title-link"
                  >
                    <a
                      class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top"
                      href="#"
                    >
                      <video
                        v-if="post.imageOrVideoUrl && isVideoUrl(post.imageOrVideoUrl)"
                        :src="post.imageOrVideoUrl"
                        style="width: 96px; height: 96px; object-fit: cover; border-radius: 0.25rem"
                        autoplay
                        muted
                        loop
                        playsinline
                        alt="Post video preview"
                      ></video>
                      <img
                        v-else
                        :src="
                          post.imageOrVideoUrl || post.avatar || 'https://via.placeholder.com/96x96'
                        "
                        style="width: 96px; height: 96px; object-fit: cover; border-radius: 0.25rem"
                        alt="thumbnail"
                      />
                      <div class="col-lg-8">
                        <h6 class="mb-0">{{ post.title || 'Bài viết không có tiêu đề' }}</h6>
                        <small class="text-body-secondary">{{
                          new Date(post.createdAt).toLocaleDateString('vi-VN')
                        }}</small>
                      </div>
                    </a>
                  </router-link>
                </li>
              </ul>
              <p v-else class="text-muted border-top pt-3">Không tìm thấy bài viết nào.</p>
            </div>

            <!-- HIỂN THỊ CÁC WIDGET MẶC ĐỊNH (CHỈ HIỆN KHI KHÔNG TÌM KIẾM) -->
            <div v-if="!searchQuery.trim()">
              <!-- HIỂN THỊ TOP 5 BÀI VIẾT NỔI BẬT CỦA TOÀN TRANG -->
              <div class="border rounded-2 p-2 mb-4">
                <h4 class="fst-italic mb-3 border-bottom pb-2">Top bài viết nổi bật</h4>
                <ul v-if="topPosts.length > 0" class="list-unstyled mb-0">
                  <li v-for="post in topPosts" :key="`top-${post.id}`">
                    <router-link
                      :to="{ name: 'PostDetail', params: { id: post.id } }"
                      class="post-title-link"
                    >
                      <a
                        class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top"
                        href="#"
                      >
                        <video
                          v-if="post.imageOrVideoUrl && isVideoUrl(post.imageOrVideoUrl)"
                          :src="post.imageOrVideoUrl"
                          style="
                            width: 96px;
                            height: 96px;
                            object-fit: cover;
                            border-radius: 0.25rem;
                          "
                          autoplay
                          muted
                          loop
                          playsinline
                          alt="Post video preview"
                        ></video>
                        <img
                          v-else
                          :src="
                            post.imageOrVideoUrl || post.avatar || 'https://via.placeholder.com/96x96'
                          "
                          style="
                            width: 96px;
                            height: 96px;
                            object-fit: cover;
                            border-radius: 0.25rem;
                          "
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
                      </a></router-link
                    >
                  </li>
                </ul>
                <p v-else class="text-muted border-top pt-3">Chưa có bài viết nổi bật.</p>
              </div>

              <!-- HIỂN THỊ TOP TÁC GIẢ -->
              <div class="border rounded-2 p-2">
                <h4 class="fst-italic mb-3 border-bottom pb-2">Top tác giả</h4>
                <ul v-if="topAuthors.length > 0" class="list-unstyled mb-0">
                  <li
                    v-for="author in topAuthors"
                    :key="author.id"
                    class="d-flex align-items-center mb-3"
                  >
                    <BAvatar :src="author.avatarUrl" variant="secondary" class="me-3" />
                    <div class="flex-grow-1">
                      <div class="fw-bold">{{ author.displayName }}</div>
                    </div>
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
import { onMounted, ref, computed, watchEffect, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import CommentSection from './CommentSection.vue'
import {
  BAvatar,
  BPagination,
  BButton,
  BFormInput,
  BDropdown,
  BDropdownText,
  BDropdownDivider,
  BDropdownItemButton,
  BBadge
} from 'bootstrap-vue-next'

// --- State cho Authentication ---
const { user: loggedInUser } = useAuth()

// --- State cho Bài viết và Người dùng ---
const posts = ref<any[]>([])
const users = ref<any[]>([])
const processedPosts = ref<any[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const perPage = 5
const TRUNCATE_LENGTH = 250

const allComments = ref<any[]>([])
const commentsByPost = ref<{ [key: string]: any[] }>({})

const activeSort = ref<'newest' | 'top'>('newest')

// --- HÀM FETCH DỮ LIỆU ---
async function fetchData() {
  try {
    const [postsRes, usersRes, commentsRes] = await Promise.all([
      fetch('http://localhost:3000/posts'),
      fetch('http://localhost:3000/users'),
      fetch('http://localhost:3000/comments')
    ])
    posts.value = await postsRes.json()
    users.value = await usersRes.json()
    allComments.value = await commentsRes.json()
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }
}

onMounted(() => {
  fetchData()
})

const isVideoUrl = (url: string | null | undefined): boolean => {
  if (!url) return false
  return /\.(mp4|webm|mov|ogg)$/i.test(url)
}

// --- XỬ LÝ DỮ LIỆU SAU KHI FETCH ---
watchEffect(() => {
  if (posts.value.length > 0 && users.value.length > 0) {
    const currentPostsMap = new Map(processedPosts.value.map((p) => [p.id, p]))
    processedPosts.value = posts.value.map((post) => {
      const author = users.value.find((u) => u.id === post.userId)
      const existingPost = currentPostsMap.get(post.id)

      let statusText = ''
      let statusVariant = 'secondary'

      switch (post.state) {
        case 'pass':
          statusText = 'Đã duyệt'
          statusVariant = 'success'
          break
        case 'fail':
          statusText = 'Bị từ chối'
          statusVariant = 'danger'
          break
        default:
          statusText = 'Đang chờ duyệt'
          statusVariant = 'info'
          break
      }

      let mediaUrl
      if (post.imageOrVideoUrl) {
        mediaUrl = post.imageOrVideoUrl.startsWith('http')
          ? post.imageOrVideoUrl
          : `http://localhost:3000${post.imageOrVideoUrl}`
      }
      let avatarUrl
      if (author?.avatarUrl) {
        avatarUrl = author.avatarUrl.startsWith('http')
          ? author.avatarUrl
          : `http://localhost:3000${author.avatarUrl}`
      }

      return {
        ...post,
        authorName: author?.displayName || 'Không rõ',
        avatar: avatarUrl || '',
        imageOrVideoUrl: mediaUrl,
        createdAtFormatted: new Date(post.createdAt).toLocaleString('vi-VN'),
        isExpanded: existingPost?.isExpanded || false,
        showComments: existingPost?.showComments || false,
        statusText: statusText,
        statusVariant: statusVariant
      }
    })
  } else {
    processedPosts.value = []
  }
})

watch(
  allComments,
  (newComments) => {
    if (!newComments || newComments.length === 0 || !users.value.length) {
      commentsByPost.value = {}
      return
    }
    const userMap = new Map(users.value.map((user) => [user.id, user]))
    const groupedComments: { [key: string]: any[] } = {}

    newComments.forEach((comment) => {
      const author = userMap.get(comment.userId)
      const processedComment = {
        ...comment,
        author: {
          displayName: author?.displayName || `Người dùng ẩn`,
          avatarUrl: author?.avatarUrl || ''
        },
        createdAtFormatted: new Date(comment.createdAt).toLocaleString('vi-VN', {
          timeStyle: 'short',
          dateStyle: 'short'
        })
      }
      if (!groupedComments[comment.postId]) {
        groupedComments[comment.postId] = []
      }
      groupedComments[comment.postId].push(processedComment)
    })
    commentsByPost.value = groupedComments
  },
  { deep: true }
)

// WATCHER ĐỂ RESET PHÂN TRANG KHI LỌC hoặc TÌM KIẾM
watch([activeSort, searchQuery], () => {
  currentPage.value = 1
})

// --- COMPUTED PROPERTIES ---

// Chỉ lấy các bài viết của người dùng đang đăng nhập
const currentUserPosts = computed(() => {
  if (!loggedInUser.value) return []
  return processedPosts.value.filter((post) => post.userId === loggedInUser.value.id)
})
watch(loggedInUser, (newUser) => {
  if (!newUser) {
    // Nếu người dùng đăng xuất, reset các state của trang
    searchQuery.value = '';
    activeSort.value = 'newest';
    currentPage.value = 1;
  }
});

// Sắp xếp danh sách bài viết của người dùng
const sortedCurrentUserPosts = computed(() => {
  const postsToSort = [...currentUserPosts.value]

  if (activeSort.value === 'top') {
    postsToSort.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
  } else {
    postsToSort.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }
  return postsToSort
})

// `searchResults` chỉ dành cho sidebar
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) {
    return []
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase()
  return currentUserPosts.value.filter(
    (post) =>
      post.title?.toLowerCase().includes(lowerCaseQuery) ||
      post.content?.toLowerCase().includes(lowerCaseQuery)
  )
})

// ✅ THAY ĐỔI: `mainPostList` giờ đây chỉ là danh sách đã được sắp xếp,
// không còn bị ảnh hưởng bởi `searchQuery`.
const mainPostList = computed(() => {
  return sortedCurrentUserPosts.value;
});

// `rows` và `paginatedPosts` giờ đây dựa trên `mainPostList`
const rows = computed(() => mainPostList.value.length)

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * perPage
  const end = start + perPage
  return mainPostList.value.slice(start, end)
})

// COMPUTED PROPERTIES CHO SIDEBAR (giữ nguyên logic)
const topPosts = computed(() => {
  if (!processedPosts.value.length) {
    return []
  }
  const approvedPosts = processedPosts.value.filter((p) => p.state === 'pass')
  return [...approvedPosts]
    .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
    .slice(0, 5)
})

const topAuthors = computed(() => {
  if (!posts.value.length || !users.value.length) {
    return []
  }
  const postCounts = posts.value.reduce((acc, post) => {
    if (post.state === 'pass') {
      acc[post.userId] = (acc[post.userId] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return users.value
    .map((user) => {
      let avatarUrl
      if (user.avatarUrl) {
        avatarUrl = user.avatarUrl.startsWith('http')
          ? user.avatarUrl
          : `http://localhost:3000${user.avatarUrl}`
      }
      return {
        ...user,
        avatarUrl: avatarUrl,
        postCount: postCounts[user.id] || 0
      }
    })
    .filter((user) => user.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 5)
})

// --- METHODS ---
// Các methods còn lại giữ nguyên, không cần thay đổi.
const setSort = (type: 'newest' | 'top') => {
  activeSort.value = type
}

async function handleDeletePost(postId: string) {
  if (!confirm('Bạn chắc chắn muốn xóa bài viết này và tất cả bình luận liên quan?')) {
    return;
  }
  
  try {
    // Chỉ cần gọi đến MỘT API duy nhất
    const response = await fetch(`http://localhost:3000/posts/${postId}/cascade`, {
      method: 'DELETE',
    });
    
    // Kiểm tra phản hồi từ API mới của chúng ta
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Xóa bài viết thất bại.');
    }
    
    // Nếu thành công, tải lại toàn bộ dữ liệu để cập nhật giao diện
    await fetchData(); 
    alert('Đã xóa bài viết thành công!');

  } catch (error) {
    console.error('Lỗi khi xóa bài viết:', error);
    alert((error as Error).message || 'Có lỗi xảy ra khi xóa.');
  }
}

const toggleExpand = (post: any) => {
  post.isExpanded = !post.isExpanded
}
const truncateContent = (content: string | null | undefined) =>
  !content
    ? ''
    : content.length <= TRUNCATE_LENGTH
    ? content.replace(/\n/g, '<br />')
    : content.substring(0, TRUNCATE_LENGTH).replace(/\n/g, '<br />') + '...'

const toggleComments = (post: any) => {
  if (!loggedInUser.value) {
    alert('Bạn cần đăng nhập để xem và viết bình luận.')
    return
  }
  post.showComments = !post.showComments
}

const generateId = (length: number = 7): string => Math.random().toString(36).substring(2, 2 + length)

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
  if (!confirm('Bạn chắc chắn muốn xóa bình luận này?')) return
  try {
    const replies = allComments.value.filter((c) => c.parentId === commentId)
    await Promise.all(
      replies.map((reply) => fetch(`http://localhost:3000/comments/${reply.id}`, { method: 'DELETE' }))
    )
    const res = await fetch(`http://localhost:3000/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) await fetchData()
  } catch (error) {
    console.error('Lỗi khi xóa bình luận:', error)
  }
}

async function handleToggleLike(comment: any) {
  if (!loggedInUser.value) return
  const userId = loggedInUser.value.id
  const likedBy = [...(comment.likedBy || [])]
  const userIndex = likedBy.indexOf(userId)
  if (userIndex > -1) {
    likedBy.splice(userIndex, 1)
  } else {
    likedBy.push(userId)
  }
  try {
    const res = await fetch(`http://localhost:3000/comments/${comment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ likedBy })
    })
    if (res.ok) await fetchData()
  } catch (error) {
    console.error('Lỗi khi thích/bỏ thích:', error)
  }
}
async function handleInteraction(post: any, interactionType: 'like' | 'dislike') {
  if (!loggedInUser.value) {
    alert('Bạn cần đăng nhập để thực hiện thao tác này.')
    return
  }

  try {
    const res = await fetch(`http://localhost:3000/api/posts/${post.id}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: loggedInUser.value.id,
        interactionType: interactionType
      })
    })

    if (!res.ok) {
      throw new Error('Tương tác không thành công.')
    }

    await fetchData()
  } catch (error) {
    console.error(`Lỗi khi ${interactionType} bài viết:`, error)
    alert('Đã có lỗi xảy ra. Vui lòng thử lại.')
  }
}
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
  text-decoration: none; /* Bỏ gạch chân mặc định */
  color: inherit; /* Giữ màu chữ gốc của thẻ h5 */
}
.post-title-link:hover .fw-semibold {
  text-decoration: underline; /* Thêm gạch chân khi di chuột qua */
  color: var(--bs-primary); /* Đổi màu chữ thành màu chính của Bootstrap */
}
</style>