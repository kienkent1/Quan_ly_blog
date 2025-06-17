<template>
  <div v-if="user" class="user-profile-form d-flex justify-content-center">
    <div class="col-xl-8 p-5 border rounded-4 d-flex flex-column align-items-center">

      <!-- =============================================================== -->
      <!-- Phần hiển thị Avatar và Tên (luôn hiển thị)                  -->
      <!-- =============================================================== -->
      <div class="avatar-container position-relative mb-3 d-inline-block">
        <BAvatar
          :src="avatarSrc"
          variant="secondary"
          :text="user.email?.charAt(0).toUpperCase()"
          size="6rem"
        />
        <!-- Nút camera chỉ hiển thị khi không ở trong luồng đổi mật khẩu -->
        <BButton
          v-if="passwordChangeStep === 'default'"
          variant="secondary"
          size="sm"
          class="camera-button rounded-circle"
          @click="triggerFileInput"
          title="Thay đổi ảnh đại diện"
        >
          <i class="bi bi-camera-fill"></i>
        </BButton>
        <input
          ref="fileInput"
          type="file"
          class="d-none"
          accept="image/*"
          @change="handleFileChange"
        />
      </div>
      <h5 class="mb-4">{{ user.displayName || user.email }}</h5>

      <!-- =============================================================== -->
      <!-- Form chính - Sử dụng v-if/v-else để chuyển đổi giao diện    -->
      <!-- =============================================================== -->
      <BForm class="mt-2 text-start w-100 d-flex flex-column">

        <!-- BƯỚC 1: Form thông tin cá nhân (Mặc định) -->
        <div v-if="passwordChangeStep === 'default'">
          <BFormGroup
            id="input-group-display-name"
            label="Tên hiển thị:"
            label-for="input-display-name"
            class="mb-3"
          >
            <BFormInput
              id="input-display-name"
              v-model="formData.displayName"
              placeholder="Nhập tên hiển thị của bạn"
              required
            ></BFormInput>
          </BFormGroup>
          
          <BFormGroup
            id="input-group-email"
            label="Email:"
            label-for="input-email"
            description="Bạn không thể thay đổi địa chỉ email."
          >
            <BFormInput
              id="input-email"
              v-model="formData.email"
              type="email"
              disabled
            ></BFormInput>
          </BFormGroup>
          
          <div class="d-flex justify-content-between align-items-center mt-3">
             <BLink @click.prevent="startChangePasswordProcess" href="#" variant="dark">
              Đổi mật khẩu
            </BLink>
            <BButton @click.prevent="handleUpdateProfile" variant="secondary">
              Lưu thay đổi
            </BButton>
          </div>
        </div>

        <!-- BƯỚC 2: Nhập mật khẩu hiện tại để xác thực -->
        <div v-else-if="passwordChangeStep === 'verify'">
           <h5 class="mb-3 text-center">Xác thực mật khẩu</h5>
           <BFormGroup label="Nhập mật khẩu hiện tại của bạn:" label-for="current-password">
             <BFormInput
                id="current-password"
                type="password"
                v-model="passwordData.currentPassword"
                placeholder="••••••••"
                required
             />
           </BFormGroup>
           <div class="d-flex justify-content-end mt-3 gap-2">
             <BButton variant="outline-secondary" @click="resetPasswordForm">Hủy</BButton>
             <BButton variant="secondary" @click="handleVerifyPassword">Tiếp tục</BButton>
           </div>
        </div>

        <!-- BƯỚC 3: Nhập mật khẩu mới -->
        <div v-else-if="passwordChangeStep === 'new'">
           <h5 class="mb-3 text-center">Tạo mật khẩu mới</h5>
           <BFormGroup label="Nhập mật khẩu mới:" label-for="new-password" class="mb-3">
             <BFormInput
                id="new-password"
                type="password"
                v-model="passwordData.newPassword"
                placeholder="Nhập mật khẩu mới"
                required
             />
           </BFormGroup>
           <BFormGroup label="Xác nhận lại mật khẩu:" label-for="confirm-password">
             <BFormInput
                id="confirm-password"
                type="password"
                v-model="passwordData.confirmPassword"
                placeholder="Xác nhận lại mật khẩu"
                required
             />
           </BFormGroup>
           <div class="d-flex justify-content-end mt-3 gap-2">
             <BButton variant="outline-secondary" @click="resetPasswordForm">Hủy</BButton>
             <BButton variant="secondary" @click="handleUpdatePassword">Lưu mật khẩu mới</BButton>
           </div>
        </div>

      </BForm>
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
const passwordChangeStep = ref('default'); // 'default', 'verify', 'new'
const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

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

// Hàm xử lý file (giữ nguyên)
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  avatarSrc.value = URL.createObjectURL(file);
  const formDataApi = new FormData();
  formDataApi.append('avatar', file);
  try {
    const response = await fetch(`http://localhost:3000/upload-avatar/${user.value.id}`, { method: 'POST', body: formDataApi });
    if (!response.ok) throw new Error('Upload ảnh thất bại!');
    const updatedUserFromServer = await response.json();
    setUser(updatedUserFromServer);
    alert('Ảnh đại diện đã được cập nhật thành công!');
  } catch (error) {
    console.error('Lỗi khi upload ảnh:', error);
    alert('Có lỗi xảy ra khi cập nhật ảnh đại diện.');
    const oldUrl = user.value.avatarUrl;
    avatarSrc.value = oldUrl ? `http://localhost:3000${oldUrl}` : null;
  }
};

// Hàm cập nhật profile (giữ nguyên)
const handleUpdateProfile = async () => {
  // Logic API cập nhật tên tại đây...
  alert('Tên hiển thị của bạn đã được cập nhật!');
};

const triggerFileInput = () => fileInput.value.click();

// === Các hàm cho chức năng đổi mật khẩu ===

const startChangePasswordProcess = () => {
  passwordChangeStep.value = 'verify';
};

const resetPasswordForm = () => {
  passwordChangeStep.value = 'default';
  passwordData.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
};

const handleVerifyPassword = async () => {
  if (!passwordData.value.currentPassword) {
    return alert('Vui lòng nhập mật khẩu hiện tại của bạn.');
  }
  try {
    const response = await fetch('http://localhost:3000/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.value.id, password: passwordData.value.currentPassword })
    });
    if (!response.ok) {
      const errorData = await response.json();
      return alert(errorData.message || 'Mật khẩu hiện tại không đúng.');
    }
    passwordChangeStep.value = 'new';
  } catch (error) {
    console.error('Lỗi khi xác thực mật khẩu:', error);
    alert('Đã có lỗi xảy ra. Vui lòng thử lại.');
  }
};

const handleUpdatePassword = async () => {
  const { newPassword, confirmPassword } = passwordData.value;
  if (!newPassword || !confirmPassword) {
    return alert('Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.');
  }
  if (newPassword !== confirmPassword) {
    return alert('Mật khẩu xác nhận không khớp. Vui lòng nhập lại.');
  }
  try {
    const response = await fetch('http://localhost:3000/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.value.id, newPassword: newPassword })
    });
    if (!response.ok) throw new Error('Cập nhật mật khẩu thất bại');
    alert('Đổi mật khẩu thành công!');
    resetPasswordForm();
  } catch (error) {
    console.error('Lỗi khi cập nhật mật khẩu:', error);
    alert('Đã có lỗi xảy ra khi cập nhật mật khẩu.');
  }
};

onUnmounted(() => {
  if (avatarSrc.value && avatarSrc.value.startsWith('blob:')) {
    URL.revokeObjectURL(avatarSrc.value);
  }
});
</script>

<style scoped>
/* CSS giữ nguyên, không thay đổi */
.camera-button {
  position: absolute;
  bottom: 0;
  right: 0;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  z-index: 1;
  padding: 0.3rem;
  line-height: 1;
}
.camera-button:hover {
  transform: scale(1.1);
  transition: transform 0.2s;
}
</style>