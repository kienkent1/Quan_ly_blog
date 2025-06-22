<!-- file: src/components/CommentSection.vue (Phiên bản chỉ emit sự kiện) -->
<template>
  <div class="mt-4 p-3 bg-light rounded-3">
    <h5 class="mb-3">Bình luận ({{ comments.length }})</h5>

    <!-- KHUNG NHẬP BÌNH LUẬN MỚI -->
    <div v-if="currentUserId" class="d-flex gap-2 mb-4">
      <BFormInput
        v-model="newCommentContent"
        placeholder="Viết bình luận của bạn..."
        class="shadow-none"
        @keyup.enter="submitNewComment"
      />
      <BButton variant="secondary" @click="submitNewComment">Gửi</BButton>
    </div>

    <!-- DANH SÁCH BÌNH LUẬN -->
    <div v-if="flatCommentList.length > 0">
      <div v-for="comment in flatCommentList" :key="comment.id" class="mb-3">
        <CommentItem 
          :comment="comment"
          :level="comment.level"
          :current-user-id="currentUserId"
          :replying-to-id="replyingToCommentId"
          v-model:reply-text="replyContent"
          @toggle-like="toggleLike"
          @start-reply="startReply"
          @delete-comment="deleteComment"
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
import { BFormInput, BButton } from 'bootstrap-vue-next';
import CommentItem from './CommentItem.vue';

const props = defineProps({
  postId: { type: String, required: true },
  comments: { type: Array as () => any[], default: () => [] },
  currentUserId: { type: String, default: null }
});

// ✅ ĐỊNH NGHĨA CÁC SỰ KIỆN MỚI
const emit = defineEmits([
  'add-comment',
  'add-reply',
  'delete-comment',
  'toggle-like'
]);

// --- State ---
const newCommentContent = ref('');
const replyingToCommentId = ref<string | null>(null);
const replyContent = ref('');

// --- LOGIC "LÀM PHẲNG" BÌNH LUẬN (giữ nguyên) ---
// ... các import ...

// --- LOGIC "LÀM PHẲNG" BÌNH LUẬN - ✅ CẬP NHẬT ĐỂ TÍNH TOÁN ĐỘ SÂU ---
const flatCommentList = computed(() => {
  if (!props.comments || props.comments.length === 0) return [];
  
  const commentMap = new Map(props.comments.map(c => [c.id, c]));
  const childrenMap = new Map<string, string[]>();
  const rootComments: any[] = [];

  // Phân loại bình luận gốc và bình luận con
  for (const comment of props.comments) {
    if (comment.parentId) {
      if (!childrenMap.has(comment.parentId)) { childrenMap.set(comment.parentId, []); }
      childrenMap.get(comment.parentId)!.push(comment.id);
    } else {
      rootComments.push(comment);
    }
  }

  // Sắp xếp bình luận gốc theo thời gian
  rootComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  const flatList: any[] = [];

  // Hàm đệ quy để duyệt cây bình luận
  // Thêm tham số `level` và `parentAuthorName`
  function traverse(commentId: string, level: number, parentAuthorName: string | null) {
    const comment = commentMap.get(commentId);
    if (!comment) return;

    // Thêm level vào đối tượng bình luận
    flatList.push({ ...comment, level, parentAuthorName });

    const children = childrenMap.get(commentId);
    if (children) {
      // Sắp xếp các con theo thời gian
      children.sort((aId, bId) => new Date(commentMap.get(aId)?.createdAt || 0).getTime() - new Date(commentMap.get(bId)?.createdAt || 0).getTime());
      
      // Duyệt các con, tăng level lên 1
      for (const childId of children) {
        traverse(childId, level + 1, comment.author.displayName); 
      }
    }
  }

  // Bắt đầu duyệt từ các bình luận gốc (level 0)
  for (const root of rootComments) {
    traverse(root.id, 0, null); 
  }
  
  return flatList;
});

// --- Functions (chỉ emit sự kiện) ---
const startReply = (comment: any) => {
  replyingToCommentId.value = comment.id;
  replyContent.value = '';
};

const cancelReply = () => {
  replyingToCommentId.value = null;
  replyContent.value = '';
};

const submitNewComment = () => {
  if (!newCommentContent.value.trim() || !props.currentUserId) return;
  // Gửi nội dung bình luận lên cho cha
  emit('add-comment', newCommentContent.value);
  newCommentContent.value = ''; // Xóa nội dung sau khi gửi
};

const submitReply = () => {
  if (!replyContent.value.trim() || !replyingToCommentId.value || !props.currentUserId) return;
  // Gửi nội dung và ID của bình luận cha lên
  emit('add-reply', {
    content: replyContent.value,
    parentId: replyingToCommentId.value
  });
  cancelReply(); // Đóng khung trả lời
};

const toggleLike = (comment: any) => {
  // Gửi cả object comment lên để cha xử lý
  emit('toggle-like', comment);
};

const deleteComment = (commentId: string) => {
  // Gửi ID của bình luận cần xóa lên
  emit('delete-comment', commentId);
};
</script>