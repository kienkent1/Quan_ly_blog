<!-- File: src/components/admin/QuanLyBaiViet.vue (Đã dọn dẹp) -->
<template>
  <div class="container mt-4">
    <header class="mb-4">
      <h1>Trang Quản Lý Bài Viết</h1>
      <p>Duyệt các bài viết đang chờ hoặc xử lý các bài viết bị người dùng báo cáo.</p>
    </header>

    <BCard no-body>
      <BTabs pills card lazy @activate-tab="onTabActivate">
        
        <!-- TAB 1: BÀI VIẾT CHỜ DUYỆT -->
        <BTab title="Bài Viết Chờ Duyệt">
          <div v-if="isLoading.pending" class="text-center p-5"><BSpinner /></div>
          <div v-else-if="pendingPosts.length === 0" class="text-center p-5 text-muted">Không có bài viết nào đang chờ duyệt.</div>
          <BTable v-else striped hover responsive :items="pendingPosts" :fields="pendingTableFields">
            <template #cell(author)="{ item }"><div class="d-flex align-items-center gap-2"><BAvatar :src="formatAvatarUrl(item.author.avatarUrl)" :text="item.author.displayName.charAt(0).toUpperCase()" /> <span class="fw-bold">{{ item.author.displayName }}</span></div></template>
            <template #cell(title)="{ item }">{{ item.title || '(Bài viết không có tiêu đề)' }}</template>
            <template #cell(actions)="{ item }"><div class="d-flex gap-2 justify-content-center"><BButton size="sm" variant="success" @click="approvePost(item.id)"><i class="bi bi-check-lg"></i> Duyệt</BButton><BButton size="sm" variant="danger" @click="openRejectModal(item)"><i class="bi bi-x-lg"></i> Từ chối</BButton><BButton size="sm" variant="info" @click="visitPost(item.id)"><i class="bi bi-eye-fill"></i> Xem</BButton></div></template>
          </BTable>
        </BTab>
        
        <!-- TAB 2: XỬ LÝ BÁO CÁO -->
        <BTab title="Xử Lý Báo Cáo">
          <div v-if="isLoading.reported" class="text-center p-5">
            <BSpinner label="Đang tải..." />
            <p class="mt-2 text-muted">Đang tải các bài viết bị báo cáo...</p>
          </div>
          <div v-else-if="reportedPosts.length === 0" class="text-center p-5 text-muted">
            <p class="mt-2">Tuyệt vời! Không có bài viết nào bị báo cáo.</p>
          </div>
          <BTable v-else striped hover responsive :items="reportedPosts" :fields="reportedTableFields">
            <template #cell(authorInfo)="{ item }"><div class="d-flex align-items-center gap-2"><BAvatar :src="formatAvatarUrl(item.authorInfo.avatarUrl)" :text="item.authorInfo.displayName.charAt(0).toUpperCase()" /> <span class="fw-bold">{{ item.authorInfo.displayName }}</span></div></template>
            <template #cell(title)="{ item }">{{ item.title || '(Bài viết không có tiêu đề)' }}</template>
            <template #cell(reportCount)="{ item }"><BBadge variant="warning" pill>{{ item.reportCount }}</BBadge></template>
            <template #cell(actions)="{ item }">
              <div class="d-flex gap-2 justify-content-center">
                <BButton size="sm" variant="danger" @click="deleteReportedPost(item.id, item.title || '(Không có tiêu đề)')" title="Xóa vĩnh viễn bài viết"><i class="bi bi-trash-fill"></i></BButton>
                <BButton size="sm" variant="success" @click="pardonPost(item.id, item.title || '(Không có tiêu đề)')" title="Bỏ qua báo cáo"><i class="bi bi-shield-check"></i></BButton>
                <BButton size="sm" variant="warning" @click="showReportsToast(item)" title="Xem chi tiết báo cáo"><i class="bi bi-card-text"></i></BButton>
                <BButton size="sm" variant="info" @click="visitPost(item.id)" title="Xem chi tiết bài viết"><i class="bi bi-eye-fill"></i></BButton>
              </div>
            </template>
          </BTable>
        </BTab>
      </BTabs>
    </BCard>

    <!-- Modal từ chối bài viết -->
    <BModal v-model="isRejectModalVisible" id="reject-post-modal" title="Xác nhận từ chối bài viết" centered @hidden="rejectionReason = ''" @ok="confirmRejectPost">
        <p>Bạn có chắc chắn muốn từ chối bài viết: <strong>{{ postToReject?.title || '(Không có tiêu đề)' }}</strong>?</p>
        <label for="rejection-reason" class="form-label">Vui lòng nhập lý do từ chối:</label>
        <textarea id="rejection-reason" v-model="rejectionReason" class="form-control" rows="3"></textarea>
    </BModal>

    <!-- TOAST HIỂN THỊ CHI TIẾT BÁO CÁO -->
    <BToast v-model="isToastVisible" variant="light" solid toaster="b-toaster-top-center" auto-hide="false">
      <template #title><strong class="me-auto">Chi tiết Báo cáo</strong></template>
      <div v-if="postForToast" class="report-toast-content">
        <div class="p-3 border-bottom bg-white">
          <p class="mb-0"><strong>Bài viết:</strong> {{ postForToast.title || '(Không có tiêu đề)' }}</p>
        </div>
        <ul class="list-group list-group-flush" style="max-height: 400px; overflow-y: auto;">
          <li v-for="report in postForToast.reports" :key="report.id" class="list-group-item">
            <div class="d-flex align-items-start">
              <BAvatar :src="formatAvatarUrl(report.reporterInfo.avatarUrl)" :text="report.reporterInfo.displayName.charAt(0).toUpperCase()" class="me-3 flex-shrink-0" size="sm"/>
              <div class="flex-grow-1">
                <h6 class="mb-1 fw-bold">{{ report.reporterInfo.displayName }}</h6>
                <p class="mb-0 text-muted">{{ report.reason }}</p>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </BToast>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { BToast, BCard, BTabs, BTab, BTable, BButton, BAvatar, BSpinner, BModal, BBadge, type BvEvent } from 'bootstrap-vue-next';
import { useRouter } from 'vue-router';
import { useAuth } from '../../composables/useAuth';

interface AuthorInfo { displayName: string; avatarUrl: string | null; }
interface PendingPost { id: string; userId: string; title: string | null; author: AuthorInfo; }
interface DetailedReport { id: string; reason: string; reporterInfo: AuthorInfo; }
interface ReportedPost { id: string; title: string | null; reportCount: number; authorInfo: AuthorInfo; reports: DetailedReport[]; }

const pendingPosts = ref<PendingPost[]>([]);
const reportedPosts = ref<ReportedPost[]>([]);
const isLoading = ref({ pending: true, reported: false });
const router = useRouter();
const { user: adminUser } = useAuth(); // Lấy thông tin admin

const isRejectModalVisible = ref(false);
const postToReject = ref<PendingPost | null>(null);
const rejectionReason = ref('');

const isToastVisible = ref(false);
const postForToast = ref<ReportedPost | null>(null);

const pendingTableFields = [ { key: 'author', label: 'Tác Giả' }, { key: 'title', label: 'Tiêu Đề' }, { key: 'actions', label: 'Hành Động' }];
const reportedTableFields = [ { key: 'authorInfo', label: 'Tác Giả' }, { key: 'title', label: 'Tiêu Đề' }, { key: 'reportCount', label: 'Lượt Báo Cáo' }, { key: 'actions', label: 'Hành Động' }];

const API_BASE_URL = 'http://localhost:3000';

const fetchPendingPosts = async () => {
  isLoading.value.pending = true;
  try {
    // Gọi API tùy chỉnh mới để lấy bài viết chờ duyệt kèm thông tin tác giả
    const response = await fetch(`${API_BASE_URL}/api/posts/pending`);
    if (!response.ok) throw new Error('Không thể tải bài viết chờ duyệt.');
    pendingPosts.value = await response.json();
  } catch (error) {
    console.error("Lỗi tải bài viết chờ duyệt:", error);
    alert('Đã xảy ra lỗi khi tải danh sách bài viết cần duyệt.'); 
  } finally {
    isLoading.value.pending = false;
  }
};

const fetchReportedPosts = async () => {
  isLoading.value.reported = true;
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/reported`);
    if (!response.ok) throw new Error('Không thể tải bài viết bị báo cáo.');
    reportedPosts.value = await response.json();
  } catch (error) {
    console.error("Lỗi tải bài viết bị báo cáo:", error);
    alert((error as Error).message);
  } finally {
    isLoading.value.reported = false;
  }
};

const onTabActivate = (newTabId: string, preTabId: string, newTabIndex: number, prevTabIndex: number, event: BvEvent) => {
  if (newTabIndex === 1 && reportedPosts.value.length === 0) {
    fetchReportedPosts();
  }
};

const approvePost = async (postId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/approve`, {
      method: 'POST',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Duyệt bài viết thất bại.');
    }
    alert('Bài viết đã được duyệt thành công!');
    await fetchPendingPosts();
  } catch (error) {
    console.error("Lỗi khi duyệt bài viết:", error);
    alert((error as Error).message);
  }
};

const openRejectModal = (post: PendingPost) => {
  postToReject.value = post;
  rejectionReason.value = '';
  isRejectModalVisible.value = true;
};

// ĐÂY LÀ PHIÊN BẢN DUY NHẤT CỦA HÀM confirmRejectPost
const confirmRejectPost = async () => {
  if (!postToReject.value) return;
  if (!rejectionReason.value.trim()) {
    alert('Vui lòng nhập lý do từ chối.');
    return;
  }

  // Lấy ID admin từ composable useAuth
  const adminId = adminUser.value?.id;
  if (!adminId) {
      alert('Không thể xác định admin. Vui lòng đăng nhập lại.');
      return;
  }
  
  const postId = postToReject.value.id;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        reason: rejectionReason.value,
        adminId: adminId 
      }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Từ chối bài viết thất bại.');
    }

    alert('Bài viết đã bị từ chối.');
    await fetchPendingPosts();
    
  } catch (error) {
    console.error("Lỗi khi từ chối bài viết:", error);
    alert((error as Error).message);
  } finally {
    isRejectModalVisible.value = false;
  }
};

const deleteReportedPost = async (postId: string, title: string) => {
  if (!confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN bài viết "${title}" không?`)) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/posts/${postId}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Xóa bài viết thất bại.');
    }
    alert('Bài viết đã được xóa thành công.');
    fetchReportedPosts();
  } catch (error) {
    console.error(error);
    alert((error as Error).message);
  }
};

const pardonPost = async (postId: string, title: string) => {
  if (!confirm(`Bạn có chắc muốn thông qua bài viết "${title}" và xóa tất cả báo cáo?`)) return;
  try {
    const response = await fetch(`${API_BASE_URL}/api/reports/by-post/${postId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Xóa báo cáo thất bại.');
    alert('Tất cả báo cáo đã được xóa.');
    fetchReportedPosts();
  } catch (error) {
    console.error(error);
    alert((error as Error).message);
  }
};

const showReportsToast = (post: ReportedPost) => {
  postForToast.value = post;
  isToastVisible.value = true;
};

const visitPost = (postId: string) => router.push({ name: 'PostDetail', params: { id: postId } });

const formatAvatarUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

onMounted(() => {
  fetchPendingPosts();
});
</script>

<style scoped>
.report-toast-content .list-group-item {
  background-color: transparent;
}
</style>