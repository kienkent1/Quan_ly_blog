<!-- src/components/CommentItem.vue (Phiên bản mới - KHÔNG TỰ GỌI LẠI) -->
<template>
  <div class="d-flex gap-3">
    <!-- Avatar -->
    <BAvatar 
      :src="comment.author.avatarUrl" 
      :text="comment.author.displayName?.charAt(0).toUpperCase()"
    />
    
    <div class="flex-grow-1">
      <!-- Nội dung bình luận -->
      <div>
        <span class="fw-bold">{{ comment.author.displayName }}</span>
        <!-- Hiển thị người được trả lời -->
        <span v-if="comment.parentAuthorName" class="text-primary mx-1">
          <i class="bi bi-caret-right-fill"></i>
          {{ comment.parentAuthorName }}
        </span>
        <small class="text-muted ms-2">{{ comment.createdAtFormatted }}</small>
      </div>
      <p class="mb-1">{{ comment.content }}</p>
      
      <!-- Các nút tương tác -->
      <div class="d-flex align-items-center gap-3 small">
        <BButton 
          variant="link" 
          size="sm" 
          class="p-0 text-decoration-none"
          :class="{ 'text-primary': isLiked, 'text-secondary': !isLiked }"
          @click="$emit('toggle-like', comment)"
        >
          <i class="bi" :class="isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'"></i>
          Thích ({{ comment.likedBy?.length || 0 }})
        </BButton>
        <BButton v-if="currentUserId" variant="link" size="sm" class="p-0 text-decoration-none text-secondary" @click="$emit('start-reply', comment)">
          <i class="bi bi-reply"></i> Trả lời
        </BButton>
        <BButton 
          v-if="canDelete" 
          variant="link" 
          size="sm" 
          class="p-0 text-decoration-none text-danger"
          @click="$emit('delete-comment', comment.id)"
        >
          <i class="bi bi-trash"></i> Xóa
        </BButton>
      </div>

      <!-- Khung nhập trả lời (chỉ hiển thị khi đang trả lời comment này) -->
      <div v-if="isReplying" class="d-flex gap-2 mt-2">
        <BFormInput
          :value="replyText"
          @input="$emit('update:replyText', $event.target.value)"
          :placeholder="`Trả lời ${comment.author.displayName}...`"
          class="shadow-none"
          @keyup.enter="$emit('submit-reply')"
          v-focus
        />
        <BButton variant="primary" size="sm" @click="$emit('submit-reply')">Gửi</BButton>
        <BButton variant="secondary" size="sm" @click="$emit('cancel-reply')">Hủy</BButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BAvatar, BFormInput, BButton } from 'bootstrap-vue-next';

const props = defineProps({
  comment: { type: Object, required: true },
  currentUserId: { type: String, default: null },
  replyingToId: { type: String, default: null },
  replyText: { type: String, default: '' }
});

defineEmits([
  'toggle-like', 
  'start-reply', 
  'delete-comment', 
  'submit-reply', 
  'cancel-reply',
  'update:replyText'
]);

// Directive để tự động focus vào ô input khi nó xuất hiện
const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
};

const isLiked = computed(() => {
  if (!props.currentUserId || !props.comment.likedBy) return false;
  return props.comment.likedBy.includes(props.currentUserId);
});

const canDelete = computed(() => {
  return props.currentUserId && props.currentUserId === props.comment.userId;
});

const isReplying = computed(() => {
  return props.replyingToId === props.comment.id;
});
</script>