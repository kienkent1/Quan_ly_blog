// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import TrangChu from '../components/TrangChu.vue'

const routes = [
  {
    path: '/',
    name: 'trang-chu',
    component: TrangChu
  },
  {
    path: '/bai-viet',
    name: 'tat-ca-bai-viet',
    component: () => import('../components/BaiViet.vue')
  },
  {
    path: '/bai-viet-ca-nhan',
    name: 'bai-viet-ca-nhan',
    component: () => import('../components/BaiVietCaNhan.vue'),
    meta: { requiresAuth: true } // Route này yêu cầu phải đăng nhập
  },
  {
    path: '/create-post',
    name: 'create-post',
    component: () => import('../components/Create_BV.vue'),
    meta: { requiresAuth: true } // Route này yêu cầu phải đăng nhập
  },
  {
    path: '/dang-nhap',
    name: 'dang-nhap',
    component: () => import('../components/login_singin.vue'),
    meta: { guestOnly: true } // Chỉ cho phép truy cập nếu chưa đăng nhập
  },
  {
    path: '/dang-ky',
    name: 'dang-ky',
    component: () => import('../components/Create_acc.vue'),
    meta: { guestOnly: true } // Chỉ cho phép truy cập nếu chưa đăng nhập
  },
  // THÊM ROUTE CHO ADMIN
  {
    path: '/admin/quan-ly-tai-khoan',
    name: 'admin-quan-ly-tai-khoan',
    component: () => import('../components/admin/QuanLyTaiKhoan.vue'), // Bạn sẽ tạo component này
    meta: { requiresAuth: true, requiresAdmin: true } // Yêu cầu đăng nhập VÀ phải là admin
  },
  {
    path: '/admin/quan-ly-bai-viet',
    name: 'admin-quan-ly-bai-viet',
    component: () => import('../components/admin/QuanLyBaiViet.vue'), // Bạn sẽ tạo component này
    meta: { requiresAuth: true, requiresAdmin: true } // Yêu cầu đăng nhập VÀ phải là admin
  },
  {
    path: '/trang-ca-nhan',
    name: 'trang-ca-nhan',
    component: () => import('../components/TrangCaNhan.vue'),
    meta: { requiresAuth: true } // Route này yêu cầu phải đăng nhập
  },
   {
    path: '/trang-profile',
    name: 'trang-profile',
    component: () => import('../components/profile.vue'),
    meta: { requiresAuth: true } // Route này yêu cầu phải đăng nhập
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// === LOGIC BẢO VỆ ROUTE (NAVIGATION GUARD) ===
router.beforeEach((to, from, next) => {
  // Lấy thông tin người dùng từ localStorage
  const loggedInUserString = localStorage.getItem('loggedInUser');
  let user = null;
  if (loggedInUserString) {
    user = JSON.parse(loggedInUserString);
  }

  // 1. Kiểm tra route yêu cầu quyền admin
  if (to.meta.requiresAdmin) {
    if (user && user.role === 'admin') {
      next(); // Cho phép truy cập
    } else {
      alert('Bạn không có quyền truy cập trang này!');
      next({ name: 'trang-chu' }); // Chuyển hướng về trang chủ
    }
    return; // Dừng tại đây
  }

  // 2. Kiểm tra route yêu cầu đăng nhập
  if (to.meta.requiresAuth && !user) {
    alert('Vui lòng đăng nhập để truy cập!');
    next({ name: 'dang-nhap' }); // Chuyển hướng đến trang đăng nhập
    return;
  }

  // 3. Kiểm tra route chỉ dành cho khách (chưa đăng nhập)
  if (to.meta.guestOnly && user) {
    next({ name: 'trang-chu' }); // Nếu đã đăng nhập, chuyển về trang chủ
    return;
  }

  // Nếu không rơi vào các trường hợp trên, cho phép truy cập
  next();
});

export default router