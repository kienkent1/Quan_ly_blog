<template>
  <div class="d-flex justify-content-center">
    <BNavbar
      v-b-color-mode="'light'"
      variant="white"
      class="col-md-11 fs-5 lh-lg"
    >
      <BNavbarNav class="w-100 border-bottom align-items-center p-1">
        <img src="../assets/images/logo.png" height="40px" width="50px" alt="Logo" />

        <BNavItem :to="{ name: 'trang-chu' }">Trang chủ</BNavItem>
        <BNavItem :to="{ name: 'tat-ca-bai-viet' }">Bài viết hay</BNavItem>
        <BNavItemDropdown text="Bài viết" right>
          <template v-if="isLoggedIn">
            <BDropdownItem :to="{ name: 'bai-viet-ca-nhan' }">Bài viết của tôi</BDropdownItem>
            <BDropdownItem :to="{ name: 'create-post' }">Tạo bài viết</BDropdownItem>
          </template>
        </BNavItemDropdown>

        <BNavItemDropdown v-if="isAdmin" text="Quản trị" right>
          <BDropdownItem :to="{ name: 'admin-quan-ly-tai-khoan' }">Quản lý tài khoản</BDropdownItem>
          <BDropdownItem :to="{ name: 'admin-quan-ly-bai-viet' }">Quản lý bài viết</BDropdownItem>
        </BNavItemDropdown>
        <BNavItem v-if="isLoggedIn" :to="{ name: 'user-profile', params: { userId: user.id } }">Profile</BNavItem>
        <BNavItem href="https://www.facebook.com/nguyen.tien.413507" target="_blank">Liên hệ</BNavItem>

        <div class="ms-auto d-flex align-items-center">
          <router-link v-if="!isLoggedIn" class="nav-item" :to="{ name: 'dang-nhap' }">
            <BButton variant="dark">
              <i class="bi bi-box-arrow-in-left"></i> Sign in
            </BButton>
          </router-link>

          <div v-else class="d-flex align-items-center ps-3">
            <!-- ========================================================= -->
            <!-- === KHU VỰC THÔNG BÁO ĐÃ ĐƯỢC NÂNG CẤP HOÀN TOÀN === -->
            <!-- ========================================================= -->
            <BNavItemDropdown
            ref="notificationDropdownRef" 
              no-caret
              variant="link"
              class="text-secondary me-2"
              @show="markAllAsRead"
            >
              <template #button-content>
                <div class="position-relative">
                  <i class="bi bi-bell-fill fs-5"></i>
                  <BBadge
                    v-if="unreadCount > 0"
                    variant="danger"
                    class="position-absolute top-0 start-100 translate-middle p-1 border border-light rounded-circle"
                  >
                    <span class="visually-hidden">thông báo chưa đọc</span>
                    {{ unreadCount > 9 ? '9+' : unreadCount }}
                  </BBadge>
                </div>
              </template>
              
              <BDropdownHeader class="fw-bold">Thông báo</BDropdownHeader>
              <BDropdownDivider />

              <div v-if="notifications.length === 0" class="px-3 py-2 text-muted">
                Bạn không có thông báo nào.
              </div>
              
              <!-- Dùng 1 div để có thể cuộn nếu danh sách dài -->
  <div v-else style="max-height: 400px; overflow-y: auto; min-width: 350px;">
    <BDropdownItem
    v-for="noti in notifications"
    :key="noti.id"
    link-class="p-0"
    variant="link"
>
    <div class="notification-wrapper">

        <!-- 1. KHU VỰC CÓ THỂ CLICK ĐỂ ĐIỀU HƯỚNG (hoặc không) -->
        <!-- Dùng thẻ <component> động để render <router-link> hoặc <div> -->
        <component
                :is="isNotificationClickable(noti) ? 'router-link' : 'div'"
                :to="isNotificationClickable(noti) ? { name: 'PostDetail', params: { id: noti.postId } } : null"
                class="notification-content-area"
                :class="{ 'is-disabled': !isNotificationClickable(noti) }"
                :title="getNotificationTitle(noti)"
                @click="handleNotificationClick(noti)"
            >
            <BAvatar 
                variant="info" 
                :src="getAvatarUrl(noti.actor.avatarUrl)"
                :text="noti.actor.displayName?.charAt(0).toUpperCase()" 
                class="me-3 flex-shrink-0"
            />
            
            <!-- ✅ LOGIC HIỂN THỊ ĐÃ ĐƯỢC HỢP NHẤT VÀO MỘT CHỖ DUY NHẤT -->
            <div class="flex-grow-1">
                <p class="mb-1">
                    <strong class="text-dark">{{ noti.actor.displayName }}</strong>
                    <!-- Hiển thị message được xử lý từ backend -->
                    {{ noti.message }}
                </p>
                <small class="text-muted">{{ formatTimeAgo(noti.createdAt) }}</small>
            </div>
            
            <span v-if="!noti.read" class="unread-dot">
                <span class="visually-hidden">New</span>
            </span>

        </component>

        <!-- 2. NÚT XÓA LUÔN NẰM NGOÀI -->
        <BButton 
            variant="link" 
            class="notification-delete-btn"
            @click.prevent="deleteNotification(noti.id)" 
            title="Xóa thông báo này"
        >
            <i class="bi bi-x-lg"></i>
        </BButton>

    </div>
</BDropdownItem>
              </div>

            </BNavItemDropdown>
            <!-- ========================================================= -->
            <!-- === KẾT THÚC KHU VỰC THÔNG BÁO === -->
            <!-- ========================================================= -->
            <div class="d-flex justify-content-end">
              <BAvatar
                variant="secondary"
                :src="getAvatarUrl(user.avatarUrl)"
                :text="user?.email?.charAt(0).toUpperCase()"
                class="me-2"
              />
              <BNavItemDropdown :text="user?.displayName || user?.email" right>
                <BDropdownItem :to="{ name: 'trang-ca-nhan' }">Trang cá nhân</BDropdownItem>
                <BDropdownItem @click="handleLogout">Đăng xuất</BDropdownItem>
              </BNavItemDropdown>
            </div>
          </div>
        </div>
      </BNavbarNav>
    </BNavbar>
  </div>
</template>

<script setup>
import {
  BNavbar, BNavItem, BNavItemDropdown, BNavbarNav, BDropdownItem,
  BAvatar, BButton, BBadge, BDropdownHeader, BDropdownDivider,
} from 'bootstrap-vue-next';
import { vBColorMode } from 'bootstrap-vue-next';
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { useAuth } from '../composables/useAuth.js';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'vue-router';


// -----------------------------------------------------------------
const { isLoggedIn, isAdmin, user, logout } = useAuth();
const notifications = ref([]);

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length;
});

// Bạn đã có dòng này, rất tốt!
const router = useRouter(); 

// Bạn đã có dòng này, rất tốt!
const notificationDropdownRef = ref(null);

const fetchNotifications = async () => {
  if (isLoggedIn.value && user.value?.id) {
    try {
      const response = await axios.get(`/api/notifications/${user.value.id}`);
      notifications.value = response.data;
    } catch (error) {
      console.error('Không thể lấy danh sách thông báo:', error);
    }
  } else {
    notifications.value = [];
  }
};

const markAllAsRead = async () => {
    if (unreadCount.value === 0) return;
    try {
        await axios.post(`/api/notifications/mark-all-as-read`, { userId: user.value.id });
        notifications.value.forEach(n => n.read = true);
    } catch (error) {
        console.error('Lỗi khi đánh dấu đã đọc:', error);
    }
};

const getAvatarUrl = (url) => {
  if (!url) return null;
  return url;
};

const formatTimeAgo = (dateString) => {
    if(!dateString) return '';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
};

const deleteNotification = async (notificationId) => {
  try {
    await axios.delete(`/api/notifications/${notificationId}`);
    notifications.value = notifications.value.filter(n => n.id !== notificationId);
  } catch (error) {
    console.error('Lỗi khi xóa thông báo:', error);
    alert('Đã có lỗi xảy ra, không thể xóa thông báo này.');
  }
};

const handleLogout = () => {
  if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
    logout();
  }
};

// -----------------------------------------------------------------

// Hàm này kiểm tra xem một thông báo có nên là một liên kết có thể click được hay không.
const isNotificationClickable = (noti) => {
  // Chỉ có thể click nếu bài viết tồn tại VÀ loại thông báo không phải là 'post_rejected'.
  return noti.postExists && noti.type !== 'post_rejected';
};

// Hàm này tạo ra tooltip (văn bản hiện ra khi di chuột) một cách linh hoạt.
const getNotificationTitle = (noti) => {
  // Nếu không thể click, hãy giải thích lý do.
  if (!isNotificationClickable(noti)) {
    // Nếu bài viết không tồn tại, nói rõ.
    if (!noti.postExists) {
      return 'Bài viết này không còn tồn tại';
    }
    // Nếu là thông báo từ chối, giải thích.
    if (noti.type === 'post_rejected') {
      return 'Thông báo từ quản trị viên';
    }
  }
  // Nếu có thể click, không cần tooltip.
  return '';
};


const handleNotificationClick = (noti) => {
  // Nếu không thể click, không làm gì cả
  if (!isNotificationClickable(noti)) {
    return;
  }

  // Nếu dropdown tồn tại, gọi phương thức hide() của nó
  if (notificationDropdownRef.value) {
    notificationDropdownRef.value.hide();
  }

  // Dùng router để chuyển trang
  router.push({ name: 'PostDetail', params: { id: noti.postId } });
};


// -----------------------------------------------------------------
onMounted(fetchNotifications);

watch(isLoggedIn, (newValue) => {
    if (newValue) {
        fetchNotifications();
    } else {
        notifications.value = [];
    }
}, { immediate: true });
</script>
<style scoped>
/* Các style khác của bạn */

/* Wrapper chứa toàn bộ nội dung của một item thông báo */
.notification-wrapper {
  position: relative;
}

/* Hiển thị nút xóa khi hover vào wrapper */
.notification-wrapper:hover .notification-delete-btn {
  opacity: 1;
}

/* Khu vực chứa nội dung text và avatar */
.notification-content-area {
  display: flex;
  align-items: flex-start;
  width: 200px;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: inherit;
  /* Thêm padding bên phải để nút xóa không che mất chấm xanh */
  padding-right: 2.5rem; 
}

/* Hiệu ứng khi hover vào khu vực có thể click */
.notification-content-area:not(.is-disabled):hover {
  background-color: #f8f9fa;
}

/* Style cho phiên bản không thể click */
.notification-content-area.is-disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* Nút xóa được định vị tuyệt đối so với wrapper */
.notification-delete-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  padding: 0.5rem;
  line-height: 1;
  color: #adb5bd;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s ease-in-out, color 0.2s ease-in-out;
}

.notification-delete-btn:hover {
  color: #dc3545;
}

/* Chấm xanh "chưa đọc" */
.unread-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  background-color: #0d6efd;
  border-radius: 50%;
  margin-top: 0.35rem; 
  margin-left: 0.5rem;
}
</style>