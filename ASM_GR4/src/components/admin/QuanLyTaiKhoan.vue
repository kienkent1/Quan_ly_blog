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

      <!-- SỬA: BẢNG DỮ LIỆU VÀ KHỐI NÚT HÀNH ĐỘNG ĐƯỢC GỘP CHUNG TRONG v-else -->
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
      
        <!-- 2. KHỐI NÚT HÀNH ĐỘNG (ĐÃ ĐƯỢC CHUYỂN VÀO ĐÂY) -->
        <div class="mt-3 pt-3 border-top">
          <!-- HIỂN THỊ KHI ĐÃ CHỌN MỘT USER -->
          <div v-if="selectedUser" class="d-md-flex justify-content-between align-items-center">
            <!-- Thông tin user đã chọn -->
            <div class="mb-3 mb-md-0">
              <span class="fw-bold">Đã chọn:</span>
              <span>{{ selectedUser.email }} ({{ selectedUser.role }})</span>
            </div>
            
            <!-- Các nút chức năng -->
           <!-- Các nút chức năng -->
<!-- Các nút chức năng (ĐÃ NÂNG CẤP) -->
<div class="d-flex justify-content-end gap-2">
    <!-- Nút Cấp/Bỏ quyền Admin -->
    <BButton
      :variant="selectedUser.role === 'admin' ? 'secondary' : 'success'"
      @click="toggleAdminRole"
      :disabled="isActionLoading || isSuperAdmin"
    >
      <i :class="selectedUser.role === 'admin' ? 'bi bi-person-fill-down' : 'bi bi-person-fill-up'"></i>
      {{ selectedUser.role === 'admin' ? 'Bỏ quyền Admin' : 'Cấp quyền Admin' }}
    </BButton>

    <!-- Nút Khóa/Mở khóa -->
    <BButton
      :variant="isSelectedUserLocked ? 'info' : 'warning'"
      @click="toggleUserLock"
      :disabled="isActionLoading"
    >
      <i :class="isSelectedUserLocked ? 'bi bi-unlock-fill' : 'bi bi-lock-fill'"></i>
      {{ isSelectedUserLocked ? 'Mở khóa' : 'Khóa' }}
    </BButton>

    <!-- Nút Xóa (ĐÃ NÂNG CẤP) -->
    <!-- Nút Xóa (Sửa lại) -->
<BButton
  id="delete-button" 
  variant="danger"
  @click="deleteUser"
  :disabled="isActionLoading || selectedUser.role === 'admin'"
>
  <i class="bi bi-trash-fill"></i> Xóa
</BButton>

<!-- THÊM COMPONENT TOOLTIP -->
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
// Bỏ qua import useAuth vì không dùng trong file này
import { BTable, BButton, BAvatar, BTooltip } from 'bootstrap-vue-next';
import type { User } from '../../types';

// --- STATE MANAGEMENT ---
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

// ...
const isSelectedUserLocked = computed(() => selectedUser.value?.status === 'locked');

// === THÊM MỚI: BIẾN KIỂM TRA SUPER ADMIN ===
const SUPER_ADMIN_ID = 'ffff6c11-1c30-4fa7-85cd-0b7113c2c7f8';
const isSuperAdmin = computed(() => selectedUser.value?.id === SUPER_ADMIN_ID);
// ===========================================

// --- HÀM NÀY SẼ LẤY TẤT CẢ USER ---
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

// const onRowSelected = (items: User[]) => {
//    console.log('Sự kiện @row-selected đã được kích hoạt!', items); 
//   if (items && items.length > 0) {
//     selectedUser.value = items[0];
//      console.log('Biến selectedUser đã được cập nhật:', selectedUser.value);
//   } else {
//     selectedUser.value = null;
//     console.log('Đã bỏ chọn hàng, selectedUser được set về null.');
//   }
// };
// BỎ HÀM onRowSelected CŨ. THAY BẰNG 2 HÀM MỚI DƯỚI ĐÂY:

// Hàm xử lý sự kiện khi một hàng được click
const onRowClicked = (item: User) => {
  // Nếu click vào hàng đang được chọn, thì bỏ chọn nó (set về null)
  if (selectedUser.value && selectedUser.value.id === item.id) {
    selectedUser.value = null;
  } 
  // Nếu click vào một hàng khác, thì chọn hàng đó
  else {
    selectedUser.value = item;
  }
};

// Hàm này thêm một class CSS để làm nổi bật hàng được chọn
const rowClass = (item: User | null, type: string) => {
  if (!item || type !== 'row') return;
  if (selectedUser.value && item.id === selectedUser.value.id) {
    // 'table-active' là một class của Bootstrap để làm xám nền
    return 'table-active'; 
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

// --- CÁC HÀM HÀNH ĐỘNG ---
const updateUserField = async (userId: string, data: object) => {
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
    await fetchUsers(); // Tải lại danh sách để cập nhật UI
  } catch (error) {
    console.error('Lỗi khi cập nhật người dùng:', error);
    alert('Có lỗi xảy ra, vui lòng thử lại.');
  } finally {
    isActionLoading.value = false;
  }
};

const toggleAdminRole = async () => {
  if (!selectedUser.value || isSuperAdmin.value) return;

  const newRole = selectedUser.value.role === 'admin' ? 'user' : 'admin';
  const actionText = newRole === 'user' ? 'bỏ quyền admin' : 'cấp quyền admin';
  
  if (confirm(`Bạn có chắc chắn muốn ${actionText} cho người dùng "${selectedUser.value.email}" không?`)) {
    await updateUserField(selectedUser.value.id, { role: newRole });
  }
};

const toggleUserLock = async () => {
  if (!selectedUser.value) return;
  const newStatus = isSelectedUserLocked.value ? 'active' : 'locked';
  await updateUserField(selectedUser.value.id, { status: newStatus });
};

const deleteUser = async () => {
  if (!selectedUser.value) return;
  
  // === THÊM MỚI: LỚP BẢO VỆ THỨ HAI ===
  if (selectedUser.value.role === 'admin') {
    alert('Không thể xóa tài khoản có quyền Admin.');
    return;
  }
  // ===================================
  
  if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${selectedUser.value.email}" không? Hành động này không thể hoàn tác.`)) return;
  
  if (isActionLoading.value) return;
  isActionLoading.value = true;
  try {
    const response = await fetch(`/users/${selectedUser.value.id}`, { method: 'DELETE' });
    if (!response.ok) {
        throw new Error('Xóa thất bại');
    }
    await fetchUsers(); // Tải lại danh sách
  } catch (error) {
    console.error('Lỗi khi xóa người dùng:', error);
    alert('Có lỗi xảy ra, vui lòng thử lại.');
  } finally {
    isActionLoading.value = false;
  }
};

</script>
<style scoped>
.button-group {
  display: flex;
  gap: 8px;
}

.btn {
  min-width: 120px;
}
</style>