<template>
  <div class="container mt-4">
    <!-- === PHẦN TIÊU ĐỀ === -->
    <header class="mb-4">
      <h1>Trang Quản Lý Tài Khoản</h1>
      <p>Chọn một người dùng từ bảng dưới đây để thực hiện các thao tác.</p>
    </header>

    <!-- === PHẦN NỘI DUNG CHÍNH === -->
    <main>
      
      <!-- KHU VỰC ĐIỀU KHIỂN -->
      <div class="d-flex justify-content-end align-items-center mb-2">
        <BButton variant="secondary" @click="fetchUsers" :disabled="isLoading">
          <i class="bi bi-arrow-clockwise"></i>
          {{ isLoading ? 'Đang tải...' : 'Làm mới' }}
        </BButton>
      </div>

      <!-- TRẠNG THÁI LOADING -->
      <div v-if="isLoading" class="text-center p-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải dữ liệu...</span>
        </div>
        <p class="mt-2 text-muted">Đang tải danh sách người dùng...</p>
      </div>

      <!-- BẢNG DỮ LIỆU VÀ KHỐI NÚT HÀNH ĐỘNG -->
      <div v-else>
        <!-- 1. BẢNG DỮ LIỆU -->
        <BTable
            bordered
            hover
            :items="users" 
            :fields="tableFields"
            selectable
            select-mode="single"
            @row-clicked="onRowClicked" 
            responsive="sm"
            tbody-tr-class="cursor-pointer" 
        >
          <template #cell(avatarUrl)="{ item }">
            <BAvatar :src="formatAvatarUrl(item.avatarUrl)" :text="item.email.charAt(0).toUpperCase()" />
          </template>
        </BTable>
      
        <!-- 2. KHỐI NÚT HÀNH ĐỘNG (KHÔNG CẦN SỬA) -->
        <div class="mt-3 pt-3 border-top">
          <div v-if="selectedUser" class="d-md-flex justify-content-between align-items-center">
            <!-- Thông tin user đã chọn -->
            <div class="mb-3 mb-md-0">
              <span class="fw-bold">Đã chọn:</span>
              <span>{{ selectedUser.email }} ({{ selectedUser.role }})</span>
            </div>
            
            <!-- Các nút chức năng -->
            <div class="d-flex justify-content-end gap-2">
              <!-- Nút Cấp/Bỏ quyền Admin -->
              <BButton
                id="toggle-admin-button"
                :variant="selectedUser.role === 'admin' ? 'secondary' : 'success'"
                @click="toggleAdminRole"
                :disabled="!canCurrentUserToggleAdmin"
              >
                <i :class="selectedUser.role === 'admin' ? 'bi bi-person-fill-down' : 'bi bi-person-fill-up'"></i>
                {{ selectedUser.role === 'admin' ? 'Bỏ quyền Admin' : 'Cấp quyền Admin' }}
              </BButton>
              <BTooltip 
                target="toggle-admin-button" 
                v-if="!canCurrentUserToggleAdmin"
              >
                {{ isSuperAdminSelected ? 'Không thể thay đổi quyền của Super Admin.' : 'Chỉ Super Admin mới có quyền thực hiện hành động này.' }}
              </BTooltip>

              <!-- Nút Khóa/Mở khóa -->
              <BButton
                :variant="isSelectedUserLocked ? 'info' : 'warning'"
                @click="toggleUserLock"
                :disabled="isActionLoading || isSuperAdminSelected"
              >
                <i :class="isSelectedUserLocked ? 'bi bi-unlock-fill' : 'bi bi-lock-fill'"></i>
                {{ isSelectedUserLocked ? 'Mở khóa' : 'Khóa' }}
              </BButton>

              <!-- Nút Xóa -->
              <BButton
                id="delete-button" 
                variant="danger"
                @click="deleteUser"
                :disabled="isActionLoading || selectedUser.role === 'admin'"
              >
                <i class="bi bi-trash-fill"></i> Xóa
              </BButton>
              <BTooltip 
                target="delete-button" 
                v-if="selectedUser && selectedUser.role === 'admin'"
              >
                Không thể xóa tài khoản Admin
              </BTooltip>
            </div>
          </div>

          <!-- HIỂN THỊ KHI CHƯA CHỌN USER NÀO -->
          <div v-else class="text-center text-muted p-3">
            <p class="mb-0">Vui lòng chọn một người dùng từ bảng để thực hiện hành động.</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { BTable, BButton, BAvatar, BTooltip } from 'bootstrap-vue-next';
// SỬA ĐỔI: Import useAuth từ file bạn đã cung cấp
import { useAuth } from '../../composables/useAuth';

export interface User {
    id: string;
    email: string;
    displayName?: string;
    avatarUrl?: string | null;
    role: 'admin' | 'user';
    status?: 'active' | 'locked';
}

// --- STATE MANAGEMENT (KHÔNG ĐỔI) ---
const users = ref<User[]>([]);
const selectedUser = ref<User | null>(null);
const isLoading = ref(false);
const isActionLoading = ref(false);
const tableFields = [
  { key: 'id', label: 'ID người dùng', sortable: true },
  { key: 'avatarUrl', label: 'Avatar', class: 'text-center' },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'displayName', label: 'Tên hiển thị', sortable: true },
  { key: 'role', label: 'Quyền', sortable: true, class: 'text-capitalize' },
  { key: 'status', label: 'Trạng thái', sortable: true, class: 'text-capitalize' },
];
const isSelectedUserLocked = computed(() => selectedUser.value?.status === 'locked');

// === SỬA ĐỔI: PHẦN QUẢN LÝ QUYỀN VÀ NGƯỜI DÙNG ===
const SUPER_ADMIN_ID = '58dc';

// 1. Lấy thông tin người dùng đang đăng nhập từ useAuth của bạn
//    Sử dụng alias `user: currentUser` để đổi tên biến cho rõ ràng và tránh trùng lặp
const { user: currentUser } = useAuth();

// 2. Computed property kiểm tra xem người dùng ĐANG ĐĂNG NHẬP có phải là Super Admin không
const isCurrentUserSuperAdmin = computed(() => {
  // Thêm ?. để phòng trường hợp currentUser.value là null (chưa đăng nhập)
  return currentUser.value?.id === SUPER_ADMIN_ID;
});

// 3. Computed property kiểm tra xem người dùng ĐƯỢC CHỌN TRONG BẢNG có phải là Super Admin không
const isSuperAdminSelected = computed(() => selectedUser.value?.id === SUPER_ADMIN_ID);

// 4. Computed property tổng hợp tất cả các điều kiện để bật/tắt nút "Cấp quyền Admin"
//    Logic này không thay đổi, nhưng giờ nó hoạt động với dữ liệu người dùng thật.
const canCurrentUserToggleAdmin = computed(() => {
  // Điều kiện 1: Chỉ Super Admin đang đăng nhập mới có quyền
  if (!isCurrentUserSuperAdmin.value) {
    return false;
  }
  // Điều kiện 2: Không thể thay đổi quyền của chính Super Admin (người được chọn trong bảng)
  if (isSuperAdminSelected.value) {
    return false;
  }
  // Điều kiện 3: Không có hành động nào khác đang chạy
  if (isActionLoading.value) {
    return false;
  }
  return true;
});
// ========================================================

// --- CÁC HÀM XỬ LÝ DỮ LIỆU VÀ SỰ KIỆN (KHÔNG ĐỔI) ---
const fetchUsers = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  selectedUser.value = null; 
  try {
    const response = await fetch('/users'); 
    if (!response.ok) throw new Error(`Lỗi mạng: ${response.statusText}`);
    const data = await response.json();
    users.value = data.map(u => ({ ...u, status: u.status || 'active' }));
  } catch (error) {
    console.error("Lỗi khi tải danh sách người dùng:", error);
    alert('Không thể tải danh sách người dùng. Vui lòng thử lại.');
    users.value = [];
  } finally {
    isLoading.value = false;
  }
};

const onRowClicked = (item: User) => {
  if (selectedUser.value && selectedUser.value.id === item.id) {
    selectedUser.value = null;
  } else {
    selectedUser.value = item;
  }
};

const formatAvatarUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `http://localhost:3000${url}`;
}

onMounted(() => {
  fetchUsers();
});

// --- CÁC HÀM HÀNH ĐỘNG (LOGIC BÊN TRONG GIỮ NGUYÊN) ---
const updateUserField = async (userId: string, data: object) => {
  // ... (Không đổi)
  if (isActionLoading.value) return;
  isActionLoading.value = true;
  try {
    const response = await fetch(`/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Cập nhật thất bại');
    }
    await fetchUsers();
  } catch (error) {
    console.error('Lỗi khi cập nhật người dùng:', error);
    alert('Có lỗi xảy ra, vui lòng thử lại.');
  } finally {
    isActionLoading.value = false;
  }
};

const toggleAdminRole = async () => {
  // Logic kiểm tra quyền đã được chuyển vào `canCurrentUserToggleAdmin`
  if (!canCurrentUserToggleAdmin.value || !selectedUser.value) return;

  const newRole = selectedUser.value.role === 'admin' ? 'user' : 'admin';
  const actionText = newRole === 'user' ? 'bỏ quyền admin' : 'cấp quyền admin';
  
  if (confirm(`Bạn có chắc chắn muốn ${actionText} cho người dùng "${selectedUser.value.email}" không?`)) {
    await updateUserField(selectedUser.value.id, { role: newRole });
  }
};

const toggleUserLock = async () => {
  // Thêm điều kiện kiểm tra isSuperAdminSelected để không khóa/mở khóa super admin
  if (!selectedUser.value || isSuperAdminSelected.value) return;
  const newStatus = isSelectedUserLocked.value ? 'active' : 'locked';
  await updateUserField(selectedUser.value.id, { status: newStatus });
};

const deleteUser = async () => {
  // ... (Không đổi)
  if (!selectedUser.value) return;
  
  if (selectedUser.value.role === 'admin') {
    alert('Không thể xóa tài khoản có quyền Admin.');
    return;
  }
  
  if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${selectedUser.value.email}" không? Hành động này không thể hoàn tác.`)) return;
  
  if (isActionLoading.value) return;
  isActionLoading.value = true;
  try {
    const response = await fetch(`/users/${selectedUser.value.id}`, { method: 'DELETE' });
    if (!response.ok) {
        throw new Error('Xóa thất bại');
    }
    await fetchUsers();
  } catch (error) {
    console.error('Lỗi khi xóa người dùng:', error);
    alert('Có lỗi xảy ra, vui lòng thử lại.');
  } finally {
    isActionLoading.value = false;
  }
};
</script>

<style scoped>
.btn:disabled {
  cursor: not-allowed;
}
.cursor-pointer {
  cursor: pointer;
}
</style>