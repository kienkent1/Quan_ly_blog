<template>
  <div  class="d-flex flex-column justify-content-center align-items-center">
    <div class="col-xl-8 p-4 border rounded-4 d-flex  juastify-content-center">

      <!-- =============================================================== -->
      <!-- Phần hiển thị Avatar và Tên (luôn hiển thị)                  -->
      <!-- =============================================================== -->
      <div class="avatar-container  d-flex flex-column mb-3  col-md-7">
        <BAvatar
          :src="avatarSrc"
          variant="secondary"
          :text="user.email?.charAt(0).toUpperCase()"
          size="6rem"
        />
        <!-- Nút camera chỉ hiển thị khi không ở trong luồng đổi mật khẩu -->
        <h5 class="mb-4 mt-2" >{{ user.displayName || user.email }}</h5>
      <p >Email: {{user.email}}</p>
      </div>
      <div class="col-md-5 mt-3  h-25 d-flex flex-column ">
        <div class="d-flex gap-4 justify-content-between">
        <BButton
          variant="secondary"
          class="mb-3"
        :to="{ name: 'tat-ca-bai-viet' }"
          ><i class="bi bi-plus-circle-fill"></i> Tạo bài blog</BButton>
           <BButton
          variant="secondary"
          class="mb-3"
        :to="{ name: 'trang-ca-nhan' }"
          ><i class="bi bi-pencil-square"></i> Chỉnh sửa profile</BButton>
        </div>
        <div class="d-grid ">
        <BButton
          variant="secondary"
          class="mb-3"
        :to="{ name: 'bai-viet-ca-nhan' }"
          ><i class="bi bi-substack"></i> Bài viết của tôi
        </BButton>
        </div>
        </div>
    </div>
    <div class="col-xl-8 mt-3 border rounded-4 p-4">
      <h4>Bài viết gần đây</h4>
        <div class="mt-4 border rounded-4 p-3">
          <p class="text-secondary">Chưa có bài viết nào.</p>

        </div>
    </div>

    
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { useAuth } from '../composables/useAuth.js';
import {
  BForm,
  BLink,
  BFormGroup,
  BFormInput, // Sửa thành BFormInput
  BButton,
  BAvatar,
} from 'bootstrap-vue-next';

const { user, setUser } = useAuth();

const formData = ref({ displayName: '', email: '' });
const fileInput = ref(null);
const avatarSrc = ref(null);

// === Biến trạng thái và dữ liệu cho việc đổi mật khẩu ===


// Watcher cho thông tin cá nhân (giữ nguyên)
watch(user, (newUser) => {
  if (newUser) {
    formData.value.displayName = newUser.displayName || '';
    formData.value.email = newUser.email || '';
    if (newUser.avatarUrl && !newUser.avatarUrl.startsWith('blob:')) {
      avatarSrc.value = `http://localhost:3000${newUser.avatarUrl}`;
    } else {
      avatarSrc.value = newUser.avatarUrl;
    }
  }
}, { immediate: true, deep: true });


</script>

