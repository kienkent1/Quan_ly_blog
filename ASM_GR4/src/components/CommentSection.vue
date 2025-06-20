<!-- src/components/CommentSection.vue (Phiên bản mới với logic "làm phẳng") -->
<template>
  <div class="mt-4 p-3 bg-light rounded-3">
    <h5 class="mb-3">Bình luận ({{ comments.length }})</h5>

    <!-- KHUNG NHẬP BÌNH LUẬN MỚI (Cấp cao nhất) -->
    <div v-if="currentUserId" class="d-flex gap-2 mb-4">
      <BFormInput
        v-model="newCommentContent"
        placeholder="Viết bình luận của bạn..."
        class="shadow-none"
        @keyup.enter="submitNewComment"
      />
      <BButton variant="primary" @click="submitNewComment">Gửi</BButton>
    </div>

    <!-- DANH SÁCH BÌNH LUẬN ĐÃ ĐƯỢC LÀM PHẲNG -->
    <div v-if="flatCommentList.length > 0">
      <div v-for="comment in flatCommentList" :key="comment.id" class="mb-3">
        <CommentItem 
          :comment="comment"
          :current-user-id="currentUserId"
          :replying-to-id="replyingToCommentId"
          v-model:reply-text="replyContent"
          @toggle-like="toggleLike"
          @start-reply="startReply"
          @delete-comment="handleDeleteComment"
          @submit-reply="submitReply"
          @cancel-reply="cancelReply"
        />
      </div>
    </div>
    <div v-else class="text-center text-muted">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { BAvatar, BFormInput, BButton } from 'bootstrap-vue-next';
import { v4 as uuidv4 } from 'uuid';
import { API_BASE_URL } from '../config.js';
import CommentItem from './CommentItem.vue'; // Import component hiển thị mới

const props = defineProps({
  postId: { type: String, required: true },
  comments: { type: Array as () => any[], default: () => [] },
  currentUserId: { type: String, default: null }
});
const emit = defineEmits(['comment-submitted', 'comment-updated']);

// --- State ---
const newCommentContent = ref('');
const replyingToCommentId = ref<string | null>(null);
const replyContent = ref('');

// --- LOGIC "LÀM PHẲNG" BÌNH LUẬN ---
const flatCommentList = computed(() => {
  if (!props.comments || props.comments.length === 0) return [];

  const commentMap = new Map(props.comments.map(c => [c.id, c]));
  const childrenMap = new Map<string, string[]>();
  const rootComments: any[] = [];

  // Phân loại comment gốc và xây dựng map con-cái
  for (const comment of props.comments) {
    if (comment.parentId) {
      if (!childrenMap.has(comment.parentId)) {
        childrenMap.set(comment.parentId, []);
      }
      childrenMap.get(comment.parentId)!.push(comment.id);
    } else {
      rootComments.push(comment);
    }
  }

  // Sắp xếp các comment gốc theo thời gian
  rootComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const flatList: any[] = [];

  // Hàm đệ quy để duyệt cây và thêm vào danh sách phẳng
  function traverse(commentId: string, parentAuthorName: string | null) {
    const comment = commentMap.get(commentId);
    if (!comment) return;

    // Thêm thông tin người được trả lời vào đối tượng comment
    flatList.push({ ...comment, parentAuthorName });

    const children = childrenMap.get(commentId);
    if (children) {
      // Sắp xếp các câu trả lời theo thời gian
      children.sort((aId, bId) => {
        const aDate = new Date(commentMap.get(aId)?.createdAt || 0).getTime();
        const bDate = new Date(commentMap.get(bId)?.createdAt || 0).getTime();
        return aDate - bDate;
      });
      // Duyệt qua các con
      for (const childId of children) {
        traverse(childId, comment.author.displayName);
      }
    }
  }

  // Bắt đầu duyệt từ các comment gốc
  for (const root of rootComments) {
    traverse(root.id, null);
  }

  return flatList;
});


// --- Functions (giữ nguyên logic API) ---
const startReply = (comment: any) => {
  replyingToCommentId.value = comment.id;
  replyContent.value = '';
};

const cancelReply = () => {
  replyingToCommentId.value = null;
  replyContent.value = '';
};

async function postData(endpoint: string, method: 'POST' | 'PATCH' | 'DELETE', body?: object) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : null,
    });
    if (!response.ok) throw new Error(`API call failed: ${method} ${endpoint}`);
    emit('comment-updated');
  } catch (error) {
    console.error("Lỗi khi tương tác với API:", error);
  }
}

const submitNewComment = async () => {
  if (!newCommentContent.value.trim() || !props.currentUserId) return;
  const newComment = {
    id: uuidv4(),
    postId: props.postId,
    userId: props.currentUserId,
    content: newCommentContent.value,
    createdAt: new Date().toISOString(),
    likedBy: [],
    parentId: null,
  };
  await postData('/comments', 'POST', newComment);
  newCommentContent.value = '';
};

const submitReply = async () => {
  if (!replyContent.value.trim() || !replyingToCommentId.value || !props.currentUserId) return;
  const newReply = {
    id: uuidv4(),
    postId: props.postId,
    userId: props.currentUserId,
    content: replyContent.value,
    createdAt: new Date().toISOString(),
    likedBy: [],
    parentId: replyingToCommentId.value,
  };
  await postData('/comments', 'POST', newReply);
  cancelReply();
};

const toggleLike = async (comment: any) => {
  if (!props.currentUserId) return;
  const currentLikedBy = comment.likedBy || [];
  const updatedLikedBy = currentLikedBy.includes(props.currentUserId)
    ? currentLikedBy.filter((id: string) => id !== props.currentUserId)
    : [...currentLikedBy, props.currentUserId];
  await postData(`/comments/${comment.id}`, 'PATCH', { likedBy: updatedLikedBy });
};

const handleDeleteComment = async (commentId: string) => {
  if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
  await postData(`/comments/${commentId}`, 'DELETE');
};
</script>