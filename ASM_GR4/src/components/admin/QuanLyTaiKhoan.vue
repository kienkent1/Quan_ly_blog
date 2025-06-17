<template>
  <div class="container mt-4">
    <h1>Trang Quản Lý Tài Khoản (Chỉ Admin)</h1>
    <p>Chào mừng, {{ user?.email }}!</p>
    <p>Đây là nơi bạn sẽ xây dựng chức năng thêm/sửa/xóa tài khoản người dùng.</p>
    <!-- Giao diện quản lý sẽ được thêm vào đây -->
  </div>
</template>

<script setup>
// Import useAuth để lấy thông tin admin đang đăng nhập
import { useAuth } from '../../composables/useAuth';

const { user } = useAuth();
</script>