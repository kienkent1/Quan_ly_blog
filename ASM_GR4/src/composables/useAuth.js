// src/composables/useAuth.js (PHIÊN BẢN SỬA LỖI HOÀN CHỈNH)

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

// -------------------------------------------------------------------
// PHẦN KHỞI TẠO GLOBAL STATE (Singleton Pattern)
// -------------------------------------------------------------------

// 1. Tạo một biến ref toàn cục để lưu trạng thái người dùng.
// Biến này sẽ chỉ được tạo một lần duy nhất cho toàn bộ ứng dụng.
const user = ref(null);

// 2. Tự động đọc dữ liệu từ localStorage ngay khi file này được import lần đầu.
// Đây là chìa khóa để đảm bảo trạng thái luôn được khởi tạo sớm.
try {
    const storedUser = localStorage.getItem('loggedInUser');
    if (storedUser) {
        user.value = JSON.parse(storedUser);
    }
} catch (e) {
    console.error("Lỗi khi đọc dữ liệu người dùng từ localStorage, dữ liệu sẽ được xóa:", e);
    localStorage.removeItem('loggedInUser');
}


// -------------------------------------------------------------------
// HÀM COMPOSABLE `useAuth`
// -------------------------------------------------------------------

// Hàm này sẽ trả về các công cụ để tương tác với global state ở trên.
export function useAuth() {
    
    // --- Computed Properties ---
    // Các biến này sẽ tự động cập nhật khi `user.value` thay đổi.
    const isLoggedIn = computed(() => !!user.value);
    const isAdmin = computed(() => user.value?.role === 'admin');

    // --- Actions (Hành động) ---
    
    // Hàm đăng nhập
    const login = (userData) => {
        user.value = userData;
        localStorage.setItem('loggedInUser', JSON.stringify(userData));
    };

    // Hàm đăng xuất
    const logout = () => {
        // ✅ SỬA LỖI: Gọi `useRouter()` BÊN TRONG hàm `logout`.
        // Điều này đảm bảo router chỉ được truy cập khi người dùng thực sự nhấn nút logout trong một component.
        const router = useRouter(); 
        
        localStorage.removeItem('loggedInUser');
        user.value = null;
        
        // Chuyển hướng về trang chủ một cách an toàn
        router.push({ name: 'trang-chu' }).then(() => {
            // Tải lại trang để reset mọi thứ
            window.location.reload();
        });
    };
    
    // Hàm cập nhật thông tin người dùng (ví dụ: đổi avatar, tên)
    const updateUser = (updatedData) => {
        if (!user.value) return;
        
        // Cập nhật cả state và localStorage
        user.value = { ...user.value, ...updatedData };
        localStorage.setItem('loggedInUser', JSON.stringify(user.value));
    };

    // Hàm này được giữ lại để tương thích với code cũ của bạn nếu cần,
    // nhưng hàm `login` đã bao gồm cả chức năng này.
    const setUser = (userData) => {
        login(userData);
    };

    return {
        // State
        user,
        
        // Computed Getters
        isLoggedIn,
        isAdmin,

        // Actions
        login, // <-- Dùng hàm này thay cho setUser để tên rõ ràng hơn
        logout,
        updateUser,
        setUser, // <-- Vẫn giữ lại để tránh lỗi nếu code cũ đang dùng
    };
}