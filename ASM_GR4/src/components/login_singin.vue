<template>
  <div class="d-flex justify-content-center mb-5">
    <div class="d-grid gap-3 col-md-4 border p-3 rounded-2 shadow-sm">
      <h1>{{ formTitle }}</h1>

      <BForm @submit.prevent="handleLogin">
        <!-- Luôn hiển thị trường Email -->
        <BFormGroup
          label="Email"
          label-for="input-email"
          class="my-1"
        >
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

        <!-- Hiển thị thông báo lỗi chung cho cả đăng nhập và quên mật khẩu -->
        <p v-if="errorMessage" class="text-danger mt-2">{{ errorMessage }}</p>

        <!-- Các nút cho chế độ Quên mật khẩu -->
        <div v-if="isForgotPasswordMode" class="d-flex justify-content-between mt-3">
          <!-- LỖI: showLoginForm không được định nghĩa -->
          <BButton type="button" @click="showLoginForm" :disabled="loading">
            <i class="bi bi-arrow-left"></i> Quay lại
          </BButton>
          <BButton type="button" variant="secondary" @click="handleForgotPassword" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            {{ loading ? 'Đang xử lý...' : 'Tiếp tục' }}
            <i v-if="!loading" class="bi bi-arrow-right"></i>
          </BButton>
        </div>

        <!-- Các thành phần cho chế độ Đăng nhập -->
        <template v-if="!isForgotPasswordMode">
          <BFormGroup
            label="Mật khẩu"
            label-for="input-password"
            class="my-1"
          >
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
             <!-- LỖI: showForgotPassword không được định nghĩa (Dòng 66) -->
            <BLink
              @click.prevent="showForgotPassword"
              href="#"
              underline-offset="3"
              underline-opacity="0"
              underline-offset-hover="1"
              underline-opacity-hover="100"
              variant="dark"
              class="m-2"
            >
              Quên mật khẩu
            </BLink>
            <BLink
              :to="{ name: 'dang-ky' }"
              underline-offset="3"
              underline-opacity="0"
              underline-offset-hover="1"
              underline-opacity-hover="100"
              variant="dark"
              class="m-2"
            >
              Đăng ký
            </BLink>
          </div>

          <div class="d-grid">
            <BButton variant="secondary" type="submit" :disabled="loading" >
              <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ loading ? 'Đang xử lý...' : 'Đăng nhập' }}
            </BButton>

            <BButton variant="secondary" @click="triggerGoogleLogin" :disabled="loading"  class="mt-3">
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
import { googleTokenLogin } from 'vue3-google-login';
import { useAuth } from '../composables/useAuth';

// --- LẤY URL GỐC CỦA API TỪ FILE .ENV.DEVELOPMENT ---
// Đây là thay đổi quan trọng nhất
// const API_URL = import.meta.env.VITE_API_BASE_URL;

// --- Định nghĩa kiểu dữ liệu cho User ---
interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
  name?: string;
  avatar?: string;
  loginMethod: 'password' | 'google';
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
  if (password.value.length === 0) return null
  return password.value.length >= 6
})

// === HÀM TRỢ GIÚP ===
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

const handleGoogleLoginSuccess = async (response: any) => {
  loading.value = true;
  try {
    const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${response.access_token}` }
    });
    if (!googleUserResponse.ok) throw new Error('Không thể lấy thông tin từ Google.');
    const googleUserData = await googleUserResponse.json();

    // THAY ĐỔI 1: SỬ DỤNG API_URL
    const serverResponse = await fetch(`http://localhost:3000/api/auth/google`, {
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
      googleErrorMessage.value = userDataFromServer.message;
      return;
    }

    loginUser(userDataFromServer);
  } catch (error) {
    console.error('Lỗi khi xử lý đăng nhập Google:', error);
    googleErrorMessage.value = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  } finally {
    loading.value = false;
  }
};

// --- Email/Password Login ---
const handleLogin = async () => {
  if (isForgotPasswordMode.value) return;
  errorMessage.value = '';
  googleErrorMessage.value = '';
  if (!email.value || !password.value) {
    errorMessage.value = 'Vui lòng nhập đầy đủ email và mật khẩu.';
    return;
  }
  loading.value = true;

  try {
    const apiUrlToCall = `http://localhost:3000/api/login`;
    console.log("ĐANG THỬ GỌI API ĐẾN:", apiUrlToCall); // Dòng debug

    // THAY ĐỔI 2: SỬ DỤNG apiUrlToCall
    const response = await fetch(apiUrlToCall, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      })
    });

    const userData = await response.json();
    if (!response.ok) {
      errorMessage.value = userData.message;
      return;
    }
    loginUser(userData);

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
    // THAY ĐỔI 3: SỬ DỤNG API_URL
    // const response = await fetch(`${API_URL}/api/forgot-password`, {
    const response = await fetch(`http://localhost:3000/api/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Lỗi không xác định.');
    }
    alert(data.message);
    showLoginForm();

  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Lỗi không xác định. Vui lòng thử lại.';
    console.error('Lỗi quên mật khẩu:', error);
  } finally {
    loading.value = false;
  }
};
</script>