<template>
  <div class="d-flex justify-content-center mb-5">
    <div class="d-grid gap-3 col-md-4 border p-3 rounded-2 shadow-sm">
      <h1>{{ formTitle }}</h1>

      <BForm @submit.prevent="handleSubmit">
        <!-- Luôn hiển thị trường Email -->
        <BFormGroup label="Email" label-for="input-email" class="my-1">
          <BFormInput
            id="input-email"
            v-model="email"
            trim
            placeholder="Nhập email của bạn"
            type="email"
            required
            autocomplete="username"
            :disabled="loading"
          />
        </BFormGroup>

        <!-- Hiển thị thông báo lỗi chung -->
        <p v-if="errorMessage" class="text-danger mt-2">{{ errorMessage }}</p>

        <!-- Chế độ Quên mật khẩu -->
        <div v-if="isForgotPasswordMode" class="d-flex justify-content-between mt-3">
          <BButton type="button" @click="showLoginForm" :disabled="loading">
            <i class="bi bi-arrow-left"></i> Quay lại
          </BButton>
          <BButton type="submit" variant="secondary" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            {{ loading ? 'Đang xử lý...' : 'Tiếp tục' }}
            <i v-if="!loading" class="bi bi-arrow-right"></i>
          </BButton>
        </div>

        <!-- Chế độ Đăng nhập -->
        <template v-if="!isForgotPasswordMode">
          <BFormGroup label="Mật khẩu" label-for="input-password" class="my-1">
            <BFormInput
              id="input-password"
              v-model="password"
              :state="passwordState"
              trim
              placeholder="Nhập mật khẩu của bạn"
              type="password"
              required
              autocomplete="current-password"
              :disabled="loading"
            />
            <BFormInvalidFeedback :state="passwordState">
              Mật khẩu phải có ít nhất 6 ký tự.
            </BFormInvalidFeedback>
          </BFormGroup>
          
          <div class="d-flex justify-content-end">
            <BLink @click.prevent="showForgotPassword" href="#" class="m-2"> Quên mật khẩu </BLink>
            <BLink :to="{ name: 'dang-ky' }" class="m-2"> Đăng ký </BLink>
          </div>

          <div class="d-grid">
            <BButton variant="secondary" type="submit" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ loading ? 'Đang xử lý...' : 'Đăng nhập' }}
            </BButton>

            <BButton variant="secondary" @click="triggerGoogleLogin" :disabled="loading" class="mt-3">
              <i class="bi bi-google me-2"></i>
              Đăng nhập với Google
            </BButton>

            <p v-if="googleErrorMessage" class="text-danger mt-2 text-center">{{ googleErrorMessage }}</p>
          </div>
        </template>
      </BForm>
    </div>
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
} from 'bootstrap-vue-next'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { googleTokenLogin, type GoogleLoginResponse } from 'vue3-google-login';
import { useAuth } from '../composables/useAuth';
// ✅ SỬA LỖI IMPORT: Thay đổi đường dẫn để trỏ đến file config.js trong thư mục src
import { API_BASE_URL } from '@/config.js';

// --- Định nghĩa kiểu dữ liệu cho User ---
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  displayName?: string;
  avatarUrl?: string;
  loginMethod: 'local' | 'google';
}

// --- State cho form ---
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)
const googleErrorMessage = ref('');
const isForgotPasswordMode = ref(false);

const router = useRouter()
const { setUser } = useAuth();
const formTitle = computed(() => isForgotPasswordMode.value ? 'Quên mật khẩu' : 'Đăng nhập');

// --- Validation ---
const passwordState = computed(() => {
  if (isForgotPasswordMode.value) return null;
  if (password.value.length === 0) return null
  return password.value.length >= 6
})

// === HÀM TRỢ GIÚP ===
const loginUser = (user: User) => {
  localStorage.setItem('loggedInUser', JSON.stringify(user));
  setUser(user);
  alert(`Chào mừng ${user.displayName || user.email}!`);
  
  if (user.role === 'admin') {
    router.push({ name: 'admin-quan-ly-tai-khoan' });
  } else {
    router.push({ name: 'trang-chu' });
  }
};

// === CÁC HÀM ĐIỀU KHIỂN GIAO DIỆN ===
const showForgotPassword = () => {
  isForgotPasswordMode.value = true;
  errorMessage.value = '';
  googleErrorMessage.value = '';
  password.value = '';
};

const showLoginForm = () => {
  isForgotPasswordMode.value = false;
  errorMessage.value = '';
};

// === CÁC HÀM XỬ LÝ CHÍNH ===

// --- Hàm submit trung gian ---
const handleSubmit = () => {
  if (isForgotPasswordMode.value) {
    handleForgotPassword();
  } else {
    handleLogin();
  }
};

// --- Google Login ---
const triggerGoogleLogin = async () => {
  errorMessage.value = '';
  googleErrorMessage.value = '';
  try {
    const response = await googleTokenLogin();
    await handleGoogleLoginSuccess(response);
  } catch (error) {
    googleErrorMessage.value = 'Quá trình đăng nhập Google đã bị hủy.';
  }
};

const handleGoogleLoginSuccess = async (response: GoogleLoginResponse) => {
  loading.value = true;
  try {
    const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${response.access_token}` }
    });
    if (!googleUserResponse.ok) throw new Error('Không thể lấy thông tin từ Google.');
    const googleUserData = await googleUserResponse.json();

    const checkUserUrl = `${API_BASE_URL}/users?email=${encodeURIComponent(googleUserData.email)}`;
    const serverResponse = await fetch(checkUserUrl);
    const existingUsers = await serverResponse.json();

    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      loginUser(user);
    } else {
      googleErrorMessage.value = 'Tài khoản Google này chưa được đăng ký trong hệ thống.';
    }

  } catch (error) {
    console.error('Lỗi khi xử lý đăng nhập Google:', error);
    googleErrorMessage.value = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  } finally {
    loading.value = false;
  }
};

// --- Email/Password Login ---
const handleLogin = async () => {
  errorMessage.value = '';
  googleErrorMessage.value = '';
  
  if (!email.value || passwordState.value !== true) {
    errorMessage.value = 'Vui lòng nhập đầy đủ và đúng định dạng.';
    return;
  }

  loading.value = true;

  try {
    const apiUrlToCall = `${API_BASE_URL}/users?email=${encodeURIComponent(email.value)}&password=${encodeURIComponent(password.value)}`;
    console.log("ĐANG GỌI API ĐĂNG NHẬP ĐẾN:", apiUrlToCall);

    const response = await fetch(apiUrlToCall);
    const matchingUsers = await response.json();

    if (!response.ok) {
        throw new Error('Lỗi mạng hoặc server không phản hồi.');
    }

    if (matchingUsers.length > 0) {
        const user = matchingUsers[0];
        loginUser(user);
    } else {
        errorMessage.value = 'Email hoặc mật khẩu không chính xác.';
    }

  } catch (error) {
    errorMessage.value = 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
    console.error('Lỗi đăng nhập:', error);
  } finally {
    loading.value = false;
  }
}

// --- Forgot Password Logic ---
const handleForgotPassword = async () => {
  if (!email.value) {
    errorMessage.value = 'Vui lòng nhập email của bạn để tiếp tục.';
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  
  try {
    const checkEmailUrl = `${API_BASE_URL}/users?email=${encodeURIComponent(email.value)}`;
    const response = await fetch(checkEmailUrl);
    const matchingUsers = await response.json();

    if (!response.ok) throw new Error('Lỗi kiểm tra email.');

    if (matchingUsers.length > 0) {
      alert(`Một email hướng dẫn đặt lại mật khẩu đã được gửi đến ${email.value}. Vui lòng kiểm tra hộp thư của bạn.`);
      showLoginForm();
    } else {
      errorMessage.value = 'Email này không tồn tại trong hệ thống.';
    }

  } catch (error) {
    const err = error as Error;
    errorMessage.value = err.message || 'Lỗi không xác định. Vui lòng thử lại.';
    console.error('Lỗi quên mật khẩu:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.m-2 {
  text-decoration: none;
}
.m-2:hover {
  text-decoration: underline;
}
</style>