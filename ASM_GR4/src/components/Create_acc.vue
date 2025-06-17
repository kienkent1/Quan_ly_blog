<template>
  <div class="d-flex justify-content-center mb-5 ">
    <BForm @submit.prevent="handleRegister" class="d-grid gap-2 col-md-4 border p-3 rounded-2 shadow-sm">
      <h1>Đăng ký</h1>

      <!-- Hiển thị thông báo lỗi/thành công -->
      <BAlert
        :model-value="registrationStatus.type !== 'idle'"
        :variant="registrationStatus.type === 'success' ? 'success' : 'danger'"
        class="mt-3"
        dismissible
        @dismissed="registrationStatus.type = 'idle'"
      >
        {{ registrationStatus.message }}
      </BAlert>

      <!-- Email -->
      <BFormGroup label="Email" label-for="register-email" class="my-1">
        <BFormInput
          id="register-email"
          v-model="formData.email"
          :state="emailState"
          trim
          placeholder="Nhập email của bạn"
          type="email"
          required
          autocomplete="email" 
        />
        <BFormInvalidFeedback :state="emailState">
          Vui lòng nhập một địa chỉ email hợp lệ.
        </BFormInvalidFeedback>
      </BFormGroup>

      <!-- Tên tài khoản -->
      <BFormGroup label="Tên tài khoản" label-for="register-username" class="my-1">
        <BFormInput
          id="register-username"
          v-model="formData.username"
          :state="usernameState"
          trim
          placeholder="Nhập tên tài khoản của bạn"
          required
          autocomplete="username"
        />
        <BFormInvalidFeedback :state="usernameState">
          Tên tài khoản không được để trống.
        </BFormInvalidFeedback>
      </BFormGroup>

      <!-- Mật khẩu -->
      <BFormGroup label="Mật khẩu" label-for="register-password" class="my-1">
        <BFormInput
          id="register-password"
          v-model="formData.password"
          :state="passwordState"
          trim
          placeholder="Nhập mật khẩu của bạn"
          type="password"
          required
          autocomplete="new-password"
        />
        <BFormInvalidFeedback :state="passwordState">
          Mật khẩu phải có ít nhất 6 ký tự.
        </BFormInvalidFeedback>
      </BFormGroup>

      <!-- Xác nhận Mật khẩu -->
      <BFormGroup label="Xác nhận mật khẩu" label-for="register-confirm-password" class="my-1">
        <BFormInput
          id="register-confirm-password"
          v-model="formData.confirmPassword"
          :state="confirmPasswordState"
          trim
          placeholder="Nhập lại mật khẩu"
          type="password"
          required
          autocomplete="new-password" 
        />
        <BFormInvalidFeedback :state="confirmPasswordState">
          Mật khẩu xác nhận không khớp.
        </BFormInvalidFeedback>
      </BFormGroup>

      <div class="d-flex justify-content-end">
        <BLink
          :to="{ name: 'dang-nhap' }"
          underline-offset="3"
          underline-opacity="0"
          underline-offset-hover="1"
          underline-opacity-hover="100"
          variant="dark"
          class="m-2"
        >
          Đã có tài khoản? Đăng nhập
        </BLink>
      </div>

      <!-- Nút Đăng ký -->
      <BButton variant="secondary" type="submit" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        {{ loading ? 'Đang xử lý...' : 'Đăng ký' }}
      </BButton>
      
      <!-- Nút Đăng ký với Google -->
      <BButton variant="secondary" @click="triggerGoogleLogin" :disabled="loading"  class="mt-3">
        <i class="bi bi-google me-2"></i> 
        Đăng ký với Google
      </BButton>
      
      <!-- Hiển thị lỗi từ Google -->
      <p v-if="googleErrorMessage" class="text-danger mt-2 text-center">{{ googleErrorMessage }}</p>
    </BForm>
  </div>
</template>

<script setup lang="ts">
import {
  BButton,
  BForm,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BLink,
  BAlert,
} from 'bootstrap-vue-next'
import { computed, ref } from 'vue'
// --- THÊM MỚI: Imports từ trang login ---
import { useRouter } from 'vue-router'
import { googleTokenLogin } from 'vue3-google-login'
import { useAuth } from '../composables/useAuth' // Giả sử đường dẫn này đúng

// --- THÊM MỚI: Định nghĩa kiểu dữ liệu User ---
interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
  name?: string;
  avatar?: string;
  loginMethod: 'password' | 'google';
}

// --- State cho form đăng ký bằng mật khẩu ---
const formData = ref({
  email: '',
  username: '', // Bạn có thể dùng `name` từ Google để điền vào đây
  password: '',
  confirmPassword: '',
})
const registrationStatus = ref<{
  type: 'success' | 'error' | 'idle',
  message: string,
}>({ type: 'idle', message: '' });
const submitted = ref(false)

// --- SỬA ĐỔI: Đổi tên isLoading thành loading cho nhất quán ---
const loading = ref(false); // Dùng chung cho cả 2 nút

// --- THÊM MỚI: State cho chức năng Google ---
const googleErrorMessage = ref('');

// --- THÊM MỚI: Khởi tạo các công cụ ---
const router = useRouter()
const { setUser } = useAuth();

// --- Validation States (giữ nguyên) ---
const emailState = computed(() => {
  if (!submitted.value) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return formData.value.email.length > 0 && emailRegex.test(formData.value.email)
})
const usernameState = computed(() => {
  if (!submitted.value) return null
  return formData.value.username.length > 0
})
const passwordState = computed(() => {
  if (!submitted.value) return null
  return formData.value.password.length >= 6
})
const confirmPasswordState = computed(() => {
  if (!submitted.value) return null
  return formData.value.confirmPassword.length > 0 && formData.value.password === formData.value.confirmPassword
})


// --- THÊM MỚI: Hàm trợ giúp xử lý sau khi đăng nhập/đăng ký thành công ---
const loginUser = (user: User) => {
  localStorage.setItem('loggedInUser', JSON.stringify(user));
  setUser(user);
  alert(`Chào mừng ${user.name || user.email}!`);
  if (user.role === 'admin') {
    router.push({ name: 'admin-quan-ly-tai-khoan' });
  } else {
    router.push({ name: 'trang-chu' });
  }
};


// --- Hàm xử lý đăng ký bằng email/mật khẩu (SỬA ĐỔI: Dùng `loading` thay vì `isLoading`) ---
// --- Hàm xử lý đăng ký bằng email/mật khẩu ---
const handleRegister = async () => {
  submitted.value = true;
  registrationStatus.value = { type: 'idle', message: '' }; // Reset thông báo

  // Kiểm tra validation phía client trước khi gửi
  if (!emailState.value || !usernameState.value || !passwordState.value || !confirmPasswordState.value) {
    registrationStatus.value = { type: 'error', message: 'Vui lòng kiểm tra lại các thông tin đã nhập.' };
    return;
  }

  loading.value = true;

  try {
    // GỌI ĐẾN API /api/register MỚI
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // SỬA LỖI: Lấy dữ liệu từ formData, không phải biến riêng lẻ
        email: formData.value.email,
        password: formData.value.password,
        displayName: formData.value.username // Gửi trường 'username' dưới tên 'displayName'
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Hiển thị lỗi từ server (ví dụ: email đã tồn tại)
      registrationStatus.value = { type: 'error', message: responseData.message };
    } else {
      // Đăng ký thành công
      registrationStatus.value = { 
        type: 'success', 
        message: 'Đăng ký thành công! Bạn sẽ được chuyển đến trang đăng nhập sau 3 giây.' 
      };
      // Tự động chuyển trang sau khi thành công
      setTimeout(() => {
        router.push({ name: 'dang-nhap' });
      }, 3000);
    }

  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    registrationStatus.value = { type: 'error', message: 'Đã có lỗi mạng xảy ra. Vui lòng thử lại.' };
  } finally {
    loading.value = false;
  }
};


// --- THÊM MỚI: Toàn bộ logic cho Google Login, copy từ trang Login ---

// === HÀM ĐỂ KÍCH HOẠT ĐĂNG NHẬP/ĐĂNG KÝ GOOGLE ===
const triggerGoogleLogin = async () => {
  registrationStatus.value = { type: 'idle', message: '' }; // Xóa các thông báo lỗi khác
  try {
    const response = await googleTokenLogin();
    handleGoogleLoginSuccess(response);
  } catch (error) {
    googleErrorMessage.value = 'Quá trình đăng nhập/đăng ký Google đã bị hủy.';
  }
};

// === HÀM XỬ LÝ KHI GOOGLE TRẢ VỀ KẾT QUẢ ===
const handleGoogleLoginSuccess = async (response) => {
  googleErrorMessage.value = '';
  loading.value = true;
  
  try {
    // Bước 1: Lấy thông tin từ Google (giữ nguyên)
    const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${response.access_token}` }
    });
    if (!googleUserResponse.ok) throw new Error('Không thể lấy thông tin từ Google.');
    const googleUserData = await googleUserResponse.json();

    // Bước 2: Gửi thông tin Google lên server của bạn
    const serverResponse = await fetch('http://localhost:3000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: googleUserData.email,
        name: googleUserData.name,
        picture: googleUserData.picture,
      })
    });

    const userDataFromServer = await serverResponse.json();

    if (!serverResponse.ok) {
      // Hiển thị lỗi từ server (ví dụ: email đã đăng ký bằng mật khẩu)
      googleErrorMessage.value = userDataFromServer.message;
      return;
    }

    // Bước 3: Đăng nhập/Đăng ký thành công
    loginUser(userDataFromServer);

  } catch (error) {
    console.error('Lỗi khi xử lý đăng ký Google:', error);
    googleErrorMessage.value = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  } finally {
    loading.value = false;
  }
};

</script>