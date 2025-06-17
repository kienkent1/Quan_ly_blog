import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

// Khởi tạo state ở ngoài để nó là global singleton
const user = ref(null);

// Lấy dữ liệu từ localStorage khi ứng dụng khởi chạy
const storedUser = localStorage.getItem('loggedInUser');
if (storedUser) {
    user.value = JSON.parse(storedUser);
}

export function useAuth() {
    const router = useRouter();

    // Biến computed để kiểm tra có phải admin không
    const isAdmin = computed(() => user.value?.role === 'admin');
    
    // Biến computed để kiểm tra đã đăng nhập chưa
    const isLoggedIn = computed(() => !!user.value);

    // Hàm đăng xuất
    const logout = () => {
        localStorage.removeItem('loggedInUser');
        user.value = null;
        // Chuyển về trang chủ sau khi đăng xuất
        router.push({ name: 'trang-chu' }).then(() => {
            // Tải lại trang để đảm bảo mọi state được reset sạch sẽ
            window.location.reload();
        });
    };
    
    // Hàm này sẽ được gọi từ component login để cập nhật state
    // **Cải tiến nhỏ**: Thêm cả việc lưu vào localStorage ở đây để tập trung logic
    const setUser = (userData) => {
        user.value = userData;
        localStorage.setItem('loggedInUser', JSON.stringify(userData));
    };

    // --- HÀM MỚI ĐỂ CẬP NHẬT THÔNG TIN NGƯỜI DÙNG ---
    const updateUser = (updatedData) => {
        // Chỉ thực hiện nếu người dùng đã đăng nhập
        if (!user.value) {
            console.error("Không thể cập nhật: người dùng chưa đăng nhập.");
            return;
        }

        // 1. Cập nhật state cục bộ (reactive state)
        // Dùng spread syntax (...) để gộp object user cũ và dữ liệu mới
        // Các trường trong updatedData sẽ ghi đè lên các trường tương ứng trong user.value
        user.value = { ...user.value, ...updatedData };

        // 2. Lưu state đã cập nhật vào localStorage
        // Điều này đảm bảo dữ liệu được duy trì khi người dùng tải lại trang
        localStorage.setItem('loggedInUser', JSON.stringify(user.value));
    };

    return {
        user,
        isAdmin,
        isLoggedIn,
        logout,
        setUser,
        updateUser // <-- Thêm hàm mới vào object trả về
    };
}