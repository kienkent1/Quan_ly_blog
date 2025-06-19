<template>
  <div class="d-flex justify-content-center">
    <BNavbar
      v-b-color-mode="'light'"
      variant="white" 
      class="col-md-11 fs-5 lh-lg"
    >
      <BNavbarNav class="w-100 border-bottom align-items-center p-1">
        <img src="../assets/images/logo.png" height="40px" width="50px" alt="">

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
        <BNavItem v-if="isLoggedIn" :to="{ name: 'trang-profile' }">Profile</BNavItem> 
      <BNavItem href="https://www.facebook.com/nguyen.tien.413507" target="_blank">Liên hệ</BNavItem>

        <div class="ms-auto d-flex align-items-center">
          <router-link v-if="!isLoggedIn" class="nav-item" :to="{ name: 'dang-nhap' }">
            <BButton variant="dark">
              <i class="bi bi-box-arrow-in-left"></i> Sign in
            </BButton>
          </router-link>

          <div v-else class="d-flex align-items-center  ps-3 ">
            <!-- === DÒNG ĐÃ ĐƯỢC THAY ĐỔI === -->
             <div class="me-3 ">
             <BNavItem  >
              <BButton
                  v-b-popover.left="{ title: 'Thông báo', body: 'Bạn có 11 thông báo chưa đọc.', container: 'body' }"
                  variant="link"
                  class="text-secondary position-relative"
                >
                  <i class="bi bi-bell-fill fs-5"></i>
                  <BBadge
                    variant="danger"
                    class="position-absolute top-0 start-100 translate-middle"
                  >
                    11
                  </BBadge>
                </BButton>
            </BNavItem>
          </div>
            <div class="d-flex justify-contetn-end">
            <BAvatar 
              variant="secondary" 
              :src="user?.avatarUrl ? `http://localhost:3000${user.avatarUrl}` : null"
              :text="user?.email?.charAt(0).toUpperCase()" 
              class="me-2" 
            />
            <!-- ============================= -->
             
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
  BNavbar,
  BNavItem,
  BNavItemDropdown,
  BNavbarNav,
  BDropdownItem,
  BAvatar,
  BButton,
  BBadge,
} from 'bootstrap-vue-next';
import { vBColorMode, vBPopover } from 'bootstrap-vue-next';

import { useAuth } from '../composables/useAuth.js';

const { isLoggedIn, isAdmin, user, logout } = useAuth();

const handleLogout = () => {
  if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
    logout();
  }
};
</script>