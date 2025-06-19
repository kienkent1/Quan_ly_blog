<template>
  
<div class="row g-5"> 
    <div class="col-md-8"> 
      <h3 class="pb-4 mb-4 fst-italic ">
          Tiêu đề bài viết
</h3> 
<article class="blog-post"> 
  <div>
    <BInputGroup class="mt-2 mb-3">
      <BFormInput
        v-model="searchQuery"
        type="text"
        placeholder="Tìm kiếm bài viết của bạn..."
        class="shadow-none border-2"
      />
      <BButton variant="secondary"><i class="bi bi-search"></i></BButton>
    </BInputGroup>
    <h5 class="mb-3">Lịch sử bài viết của bạn</h5>
    <div v-if="isLoading" class="text-center my-4">
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang tải bài viết...
    </div>
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
      <BButton variant="outline-danger" size="sm" class="ms-2" @click="fetchMyPosts">Thử lại</BButton>
    </div>
    <div v-else>
      <div v-if="posts.length === 0" class="text-muted">Bạn chưa có bài viết nào.</div>
      <div v-else-if="filteredPosts.length === 0" class="text-muted">Không tìm thấy bài viết nào phù hợp với từ khóa.</div>
      <div v-else>
        <div v-for="post in filteredPosts" :key="post.id" class="mb-4 p-3 rounded-3 shadow-sm position-relative" style="background: #fff; border: 1px solid #d1d5db; border-radius: 10px;">
          <div>
            <h5 class="mb-2">{{ post.title || 'Bài viết không có tiêu đề' }}</h5>
            <div class="mb-2" style="white-space: pre-line;">
              <template v-if="post.content && post.content.length > 200">
                <span v-if="expandedPosts[post.id]">{{ post.content }}</span>
                <span v-else>{{ post.content.slice(0, 200) }}...</span>
                <BButton
                  size="sm"
                  variant="link"
                  class="p-0 ms-2"
                  @click="toggleExpand(post.id)"
                  style="font-size: 0.95rem;"
                >
                  {{ expandedPosts[post.id] ? 'Ẩn bớt' : 'Hiện thêm' }}
                </BButton>
              </template>
              <template v-else>
                {{ post.content }}
              </template>
            </div>
          </div>
          <div v-if="post.imageOrVideoUrl">
            <img v-if="!isVideoUrl(post.imageOrVideoUrl)" :src="`http://localhost:3000${post.imageOrVideoUrl}`" style="max-width: 100%; max-height: 300px; border-radius: 8px;" />
            <video v-else :src="`http://localhost:3000${post.imageOrVideoUrl}`" controls style="max-width: 100%; max-height: 300px; border-radius: 8px;"></video>
          </div>
          <BButton size="sm" variant="secondary" class="delete-btn position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center"
            :disabled="isProcessing[post.id]" @click="deletePost(post)">
            <i class="bi bi-trash"></i>
          </BButton>
          <div class="d-flex align-items-center gap-3 mt-2">
            <BButton size="sm" variant="link" class="text-secondary p-0" style="font-size: 1.6rem;"
              :disabled="isProcessing[post.id] || (loggedInUser && hasLiked(post, loggedInUser.id))"
              :title="loggedInUser && hasLiked(post, loggedInUser.id) ? 'Bạn đã like bài viết này' : ''"
              @click="likePost(post)">
              <i class="bi bi-hand-thumbs-up-fill"></i>
              <span style="font-size: 1rem; margin-left: 4px;">{{ post.likes || 0 }}</span>
            </BButton>
            <BButton size="sm" variant="link" class="text-danger p-0" style="font-size: 1.6rem;"
              :disabled="isProcessing[post.id] || (loggedInUser && hasLoved(post, loggedInUser.id))"
              :title="loggedInUser && hasLoved(post, loggedInUser.id) ? 'Bạn đã thả tim bài viết này' : ''"
              @click="lovePost(post)">
              <i class="bi bi-heart-fill"></i>
              <span style="font-size: 1rem; margin-left: 4px;">{{ post.loves || 0 }}</span>
            </BButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</article> 
    
     
    </div> 
    <div class="col-md-4"> 
        <div class="position-sticky" style="top: 2rem;"> 
         <div class="container mt-4" style="max-width: 500px;">
  
<!-- ĐÃ XÓA PHẦN TÌM KIẾM BÀI VIẾT CỦA BẠN Ở ĐÂY -->
</div>
        <div> 
            <h5 class="fst-italic">Bài đăng của bạn</h5>
            <ul class="list-unstyled" style="max-height: 350px; overflow-y: auto;">
              <li v-if="filteredPosts.length === 0" class="text-muted border-top pt-3">
                Chưa có bài viết nào.
              </li>
              <li v-for="post in filteredPosts" :key="post.id">
                <div class="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center py-3 link-body-emphasis text-decoration-none border-top">
                  <img v-if="post.imageOrVideoUrl && !isVideoUrl(post.imageOrVideoUrl)" :src="`http://localhost:3000${post.imageOrVideoUrl}`" class="bd-placeholder-img" width="100" height="96" style="object-fit:cover;" alt="Post image" />
                  <video v-else-if="post.imageOrVideoUrl" :src="`http://localhost:3000${post.imageOrVideoUrl}`" class="bd-placeholder-img" width="100" height="96" autoplay muted loop playsinline alt="Post video preview"></video>
                  <div class="col-lg-8">
                    <h6 class="mb-0">{{ post.title || 'Bài viết không có tiêu đề' }}</h6>
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
<script setup>
import {
  BFormInput,
  BButton,
  BInputGroup,
} from 'bootstrap-vue-next'
import { vBColorMode } from 'bootstrap-vue-next'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { eventBus } from '../eventBus';

const posts = ref([])
const isLoading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const filteredPosts = computed(() =>
  posts.value.filter(post =>
    (post.title && post.title.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
    (post.content && post.content.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
)

const isProcessing = ref({}); // Để disable nút khi đang gửi request
const loggedInUser = ref(null);
const expandedPosts = ref({}); // Lưu trạng thái mở rộng của từng post

function isVideoUrl(url) {
  return /\.(mp4|webm|mov|ogg)$/i.test(url)
}
function formatDateTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function hasLiked(post, userId) {
  const likesKey = `post_likes_${post.id}`;
  const currentLikes = JSON.parse(localStorage.getItem(likesKey) || '[]');
  return currentLikes.includes(userId);
}
function hasLoved(post, userId) {
  const lovesKey = `post_loves_${post.id}`;
  const currentLoves = JSON.parse(localStorage.getItem(lovesKey) || '[]');
  return currentLoves.includes(userId);
}

async function fetchMyPosts() {
  isLoading.value = true
  error.value = null
  try {
    const userString = localStorage.getItem('loggedInUser')
    if (!userString) {
      error.value = 'Vui lòng đăng nhập để xem bài viết của bạn'
      return
    }
    const user = JSON.parse(userString)
    const userId = String(user.id)
    
    const res = await fetch(`http://localhost:3000/api/posts/user/${userId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    if (!res.ok) {
      throw new Error('Không thể tải bài viết cá nhân. Vui lòng thử lại sau.')
    }
    const data = await res.json()
    // Lưu dữ liệu vào localStorage để backup
    localStorage.setItem(`user_posts_${userId}`, JSON.stringify(data))
    posts.value = data
    console.log('Đã tải bài viết thành công:', data)
  } catch (e) {
    console.error('Lỗi khi tải bài viết:', e)
    // Nếu không tải được từ server, thử lấy từ localStorage
    const userString = localStorage.getItem('loggedInUser')
    if (userString) {
      const user = JSON.parse(userString)
      const cachedPosts = localStorage.getItem(`user_posts_${user.id}`)
      if (cachedPosts) {
        posts.value = JSON.parse(cachedPosts)
        console.log('Đã tải bài viết từ cache')
        return
      }
    }
    error.value = e.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    posts.value = []
  } finally {
    isLoading.value = false
  }
}

async function likePost(post) {
  const userString = localStorage.getItem('loggedInUser')
  if (!userString) return;
  const user = JSON.parse(userString)
  if (hasLiked(post, user.id)) return;
  isProcessing.value[post.id] = true;
  try {
    const likesKey = `post_likes_${post.id}`
    const currentLikes = JSON.parse(localStorage.getItem(likesKey) || '[]')
    currentLikes.push(user.id)
    localStorage.setItem(likesKey, JSON.stringify(currentLikes))
    const res = await fetch(`http://localhost:3000/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        likes: (post.likes || 0) + 1,
        updatedAt: new Date().toISOString(),
        likedBy: currentLikes
      })
    })
    if (res.ok) {
      post.likes = (post.likes || 0) + 1;
    }
  } finally {
    isProcessing.value[post.id] = false;
  }
}

async function lovePost(post) {
  const userString = localStorage.getItem('loggedInUser')
  if (!userString) return;
  const user = JSON.parse(userString)
  if (hasLoved(post, user.id)) return;
  isProcessing.value[post.id] = true;
  try {
    const lovesKey = `post_loves_${post.id}`
    const currentLoves = JSON.parse(localStorage.getItem(lovesKey) || '[]')
    currentLoves.push(user.id)
    localStorage.setItem(lovesKey, JSON.stringify(currentLoves))
    const res = await fetch(`http://localhost:3000/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        loves: (post.loves || 0) + 1,
        updatedAt: new Date().toISOString(),
        lovedBy: currentLoves
      })
    })
    if (res.ok) {
      post.loves = (post.loves || 0) + 1;
    }
  } finally {
    isProcessing.value[post.id] = false;
  }
}

async function deletePost(post) {
  const userString = localStorage.getItem('loggedInUser')
  if (!userString) return;
  const user = JSON.parse(userString)
  if (post.authorId && post.authorId !== user.id) return;
  if (!confirm(`Bạn có chắc muốn xóa bài viết \"${post.title || 'Không có tiêu đề'}\" này?`)) return
  isProcessing.value[post.id] = true;
  try {
    localStorage.removeItem(`post_likes_${post.id}`)
    localStorage.removeItem(`post_loves_${post.id}`)
    const res = await fetch(`http://localhost:3000/posts/${post.id}`, { 
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    if (res.ok) {
      posts.value = posts.value.filter(p => p.id !== post.id)
      const cachedPosts = localStorage.getItem(`user_posts_${user.id}`)
      if (cachedPosts) {
        const postsArr = JSON.parse(cachedPosts)
        const updatedPosts = postsArr.filter(p => p.id !== post.id)
        localStorage.setItem(`user_posts_${user.id}`, JSON.stringify(updatedPosts))
      }
    }
  } finally {
    isProcessing.value[post.id] = false;
  }
}

// Thêm hàm để đồng bộ dữ liệu từ localStorage với server
async function syncDataWithServer() {
  const userString = localStorage.getItem('loggedInUser')
  if (!userString) return
  
  const user = JSON.parse(userString)
  const userId = user.id
  
  try {
    // Đồng bộ likes
    const posts = JSON.parse(localStorage.getItem(`user_posts_${userId}`) || '[]')
    for (const post of posts) {
      const likesKey = `post_likes_${post.id}`
      const likes = JSON.parse(localStorage.getItem(likesKey) || '[]')
      if (likes.length > 0) {
        await fetch(`http://localhost:3000/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ likedBy: likes })
        })
      }
      
      // Đồng bộ loves
      const lovesKey = `post_loves_${post.id}`
      const loves = JSON.parse(localStorage.getItem(lovesKey) || '[]')
      if (loves.length > 0) {
        await fetch(`http://localhost:3000/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lovedBy: loves })
        })
      }
    }
    console.log('Đã đồng bộ dữ liệu thành công')
  } catch (e) {
    console.error('Lỗi khi đồng bộ dữ liệu:', e)
  }
}

function toggleExpand(postId) {
  expandedPosts.value[postId] = !expandedPosts.value[postId];
}

onMounted(() => {
  fetchMyPosts()
  syncDataWithServer()
  const userString = localStorage.getItem('loggedInUser');
  if (userString) loggedInUser.value = JSON.parse(userString);
  eventBus.on('post-created', () => {
    fetchMyPosts()
  })
})

onUnmounted(() => {
  eventBus.off('post-created', fetchMyPosts)
})
</script>
<style scoped>
.delete-btn {
  background-color: #f3f4f6;
  color: #495057;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  box-shadow: 0 1px 4px rgba(60,60,100,0.08);
  transition: box-shadow 0.2s, background 0.2s, color 0.2s;
}
.delete-btn:hover {
  background-color: #d1d5db;
  color: #212529;
  box-shadow: 0 2px 8px rgba(60,60,100,0.15);
}
</style>