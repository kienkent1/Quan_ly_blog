// server.cjs (Hoàn toàn tương thích với cú pháp CommonJS)

// --- Các thư viện cần thiết ---
const express = require('express');
const jsonServer = require('json-server');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Tìm đến file .env ở thư mục cha (thư mục gốc)
// require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Chỉ cho dotenv biết phải nạp file 'tk.env' trong thư mục hiện tại
require('dotenv').config({ path: 'tk.env' }); 
// ==========================================================
// === BẠN HÃY DÁN ĐOẠN CODE DEBUG VÀO NGAY ĐÂY ===
console.log('>>> Server đang khởi động. Giá trị EMAIL_USER là:', process.env.EMAIL_USER ? 'CÓ' : 'KHÔNG');
// ==========================================================




// --- Định nghĩa các đường dẫn quan trọng ---
const rootDir = path.join(__dirname, '..');
const dbPath = path.join(rootDir, 'db.json');
const publicPath = path.join(rootDir, 'public');
const uploadsPath = path.join(publicPath, 'uploads');
if (!fs.existsSync(dbPath)) {
    console.error(`FATAL ERROR: db.json not found at ${dbPath}. Please make sure it's in the 'my-backend' directory.`);
    process.exit(1);
}
const server = express();
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults(); // Lấy các middleware mặc định
const PORT = 3000;

// --- CÁC MIDDLEWARE CƠ BẢN ---
// Phải được đặt trước các route
// server.options('*', cors()); 
server.use(middlewares); 
server.use(express.json());
server.use(cors());
server.use(express.static(publicPath)); // Phục vụ ảnh từ thư mục public ở gốc


// ===================================================================
// --- CÁC API TÙY CHỈNH (CUSTOM ROUTES) ---
// ===================================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Tự động tạo thư mục uploads nếu nó chưa tồn tại
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// --- API UPLOAD AVATAR ---
server.post('/upload-avatar/:userId', upload.single('avatar'), (req, res) => {
  try {
    const userId = req.params.userId;
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được tải lên.' });
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    
    const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
    const userIndex = db.users.findIndex(u => u.id == userId);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }
    db.users[userIndex].avatarUrl = avatarUrl;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    res.json(db.users[userIndex]);
  } catch (error) {
    console.error('Lỗi khi upload avatar:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
});

// API 2: Quên Mật Khẩu
server.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Vui lòng cung cấp email.' });
  }
  try {
    const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8')); // SỬA: Dùng dbPath
    const userToUpdate = db.users.find(u => u.email === email);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'Email không tồn tại trong hệ thống.' });
    }
    if (userToUpdate.loginMethod === 'google') {
      return res.status(400).json({ message: 'Tài khoản này đăng ký bằng Google, không thể đặt lại mật khẩu.' });
    }
    const newPassword = Math.random().toString(36).slice(-8);
    const userIndex = db.users.findIndex(u => u.id === userToUpdate.id);
    db.users[userIndex].password = newPassword;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); // SỬA: Dùng dbPath
    await transporter.sendMail({
      from: `"Hỗ trợ tài khoản" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Khôi phục mật khẩu tài khoản của bạn',
      html: `<p>Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>`,
    });
    res.status(200).json({ message: 'Mật khẩu mới đã được gửi tới email của bạn.' });
  } catch (error) {
    console.error('Lỗi trong quá trình quên mật khẩu:', error);
    res.status(500).json({ message: 'Đã có lỗi xảy ra phía máy chủ.' });
  }
});
// API 3: Đăng ký tài khoản
server.post('/api/register', async (req, res) => { // THÊM "async" ở đây
  const { email, password, displayName } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
  }

  const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
  const existingUser = db.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({ message: 'Email này đã được sử dụng.' });
  }

  const newUser = {
    id: crypto.randomUUID(),
    email: email,
    password: password,
    displayName: displayName,
    role: 'user',
    avatarUrl: null,
    loginMethod: 'local'
  };

  db.users.push(newUser);
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

  // --- BẮT ĐẦU THÊM MỚI: Gửi email chào mừng ---
  try {
    await transporter.sendMail({
      from: `"DauBlog" <${process.env.EMAIL_USER}>`, // <-- Nhớ thay đổi "Tên Website Của Bạn"
      to: email, // Email người dùng vừa đăng ký
      subject: 'Chào mừng bạn đã đến với chúng tôi!',
      html: `
        <h1>Chào mừng, ${displayName}!</h1>
        <p>Cảm ơn bạn đã đăng ký tài khoản thành công tại website của chúng tôi.</p>
        <p>Bây giờ bạn có thể đăng nhập và bắt đầu khám phá các tính năng tuyệt vời.</p>
        <br>
        <p>Trân trọng,</p>
        <p>Đội ngũ phát triển❤️</p>
      `,
    });
    console.log(`Email chào mừng đã được gửi thành công tới ${email}`);
  } catch (emailError) {
    // Quan trọng: Chỉ log lỗi, không làm gián đoạn quá trình đăng ký.
    // Người dùng đã được tạo, việc gửi email thất bại không nên ngăn họ nhận được phản hồi thành công.
    console.error(`Lỗi khi gửi email chào mừng tới ${email}:`, emailError);
  }
  // --- KẾT THÚC THÊM MỚI ---

  const { password: _, ...userToReturn } = newUser;
  res.status(201).json(userToReturn);
});

// API 4: Đăng nhập/Đăng ký bằng Google
server.post('/api/auth/google', (req, res) => {
  const { email, name, picture } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Thông tin từ Google không hợp lệ.' });
  }
  const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
  let user = db.users.find(u => u.email === email);
  if (user) {
    if (user.loginMethod !== 'google') {
      return res.status(409).json({ message: 'Email này đã được đăng ký bằng mật khẩu.' });
    }
    const { password, ...userToReturn } = user;
    return res.json(userToReturn);
  } else {
    const newUser = {
      id: crypto.randomUUID(),
      email: email,
      password: null,
      displayName: name,
      role: 'user',
      avatarUrl: picture,
      loginMethod: 'google'
    };
    db.users.push(newUser);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    const { password: _, ...userToReturn } = newUser;
    return res.status(201).json(userToReturn);
  }
});

// API 5: Đăng nhập bằng Email/Mật khẩu
// server.post('/api/login', (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu.' });
//   }
//   const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
//   const user = db.users.find(u => u.email === email);
//   if (!user) {
//     return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
//   }
//   if (user.loginMethod === 'google') {
//     return res.status(403).json({ message: 'Tài khoản này được đăng ký bằng Google. Vui lòng sử dụng nút đăng nhập với Google.' });
//   }
//   if (user.password !== password) {
//     return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
//   }
//   const { password: _, ...userToReturn } = user;
//   res.json(userToReturn);
// });
server.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng cung cấp email và mật khẩu.' });
  }
  const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
  const user = db.users.find(u => u.email === email);

  // Kiểm tra user có tồn tại không
  if (!user) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
  }
  
  // KIỂM TRA TRẠNG THÁI TÀI KHOẢN (RẤT QUAN TRỌNG)
  if (user.status === 'locked') {
    return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
  }

  // Kiểm tra phương thức đăng nhập
  if (user.loginMethod === 'google') {
    return res.status(403).json({ message: 'Tài khoản này được đăng ký bằng Google. Vui lòng sử dụng nút đăng nhập với Google.' });
  }
  
  // Kiểm tra mật khẩu
  if (user.password !== password) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
  }
  
  // Nếu mọi thứ đều ổn, trả về thông tin người dùng (không kèm mật khẩu)
  const { password: _, ...userToReturn } = user;
  res.json(userToReturn);
});
// ===================================================================
// --- API ĐỔI MẬT KHẨU (ĐÃ THÊM) ---
// ===================================================================

// API 1: Xác thực mật khẩu hiện tại
server.post('/verify-password', (req, res) => {
    const { userId, password } = req.body;
    if (!userId || !password) {
        return res.status(400).json({ message: 'Thiếu thông tin userId hoặc mật khẩu.' });
    }

    const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
    const user = db.users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    if (user.password !== password) {
        return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng.' });
    }

    // Mật khẩu đúng
    res.status(200).json({ message: 'Xác thực thành công.' });
});

// API 2: Cập nhật mật khẩu mới (PHIÊN BẢN MỚI - ĐÃ NÂNG CẤP)
server.post('/update-password', async (req, res) => { // THÊM 1: Chuyển sang async
    const { userId, newPassword } = req.body;
    console.log('--- [DEBUG] Bắt đầu /update-password ---');
    console.log('[DEBUG] Nhận được userId:', userId);
    console.log('[DEBUG] Nhận được newPassword:', newPassword ? '***' : '(trống)');
    if (!userId || !newPassword) {
        return res.status(400).json({ message: 'Thiếu thông tin userId hoặc mật khẩu mới.' });
    }

    const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
    const userIndex = db.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }
    
    // Cập nhật mật khẩu mới
    db.users[userIndex].password = newPassword;
    const updatedUser = db.users[userIndex]; // THÊM 2: Lấy thông tin người dùng đã cập nhật để có email và tên

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    // --- BẮT ĐẦU NÂNG CẤP: GỬI EMAIL THÔNG BÁO ---
    try {
        await transporter.sendMail({
            from: `"Bảo mật tài khoản" <${process.env.EMAIL_USER}>`,
            to: updatedUser.email, // Lấy email từ user object
            subject: 'Thông báo: Mật khẩu của bạn đã được thay đổi thành công',
            html: `
                <h1>Chào ${updatedUser.displayName || 'bạn'},</h1>
                <p>Chúng tôi xác nhận rằng mật khẩu cho tài khoản của bạn (${updatedUser.email}) đã được thay đổi thành công vào lúc ${new Date().toLocaleString('vi-VN')}.</p>
                <p>Nếu bạn không phải là người thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức để được hỗ trợ.</p>
                <br>
                <p>Trân trọng,</p>
                <p>Đội ngũ phát triển❤️</p>
            `,
        });
        console.log(`Đã gửi email thông báo đổi mật khẩu thành công tới ${updatedUser.email}`);
    } catch (emailError) {
        // Rất quan trọng: Chỉ log lỗi, không làm hỏng cả request
        // Việc đổi mật khẩu đã thành công, không nên báo lỗi cho người dùng chỉ vì không gửi được email.
        console.error(`Lỗi khi gửi email thông báo đổi mật khẩu tới ${updatedUser.email}:`, emailError);
    }
    // --- KẾT THÚC NÂNG CẤP ---

    // Luôn trả về thành công vì mật khẩu đã được đổi
    res.status(200).json({ message: 'Cập nhật mật khẩu thành công.' });
});
// --- API TẠO BÀI VIẾT MỚI ---
server.post('/api/posts', upload.single('imageOrVideo'), async (req, res) => {
    try {
        const { userId, title, content } = req.body;
        const hasImageOrVideo = req.file !== undefined && req.file !== null;

        // Kiểm tra xem ít nhất một trong các trường (title, content, imageOrVideo) có giá trị không
        if (!title && !content && !hasImageOrVideo) {
            return res.status(400).json({ message: 'Bài viết phải có ít nhất một trong các thông tin: tiêu đề, nội dung hoặc ảnh/video.' });
        }

        // Kiểm tra xem userId có được cung cấp không
        if (!userId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp userId.' });
        }

        // Tạo ID duy nhất cho bài viết
        const postId = crypto.randomUUID();

        // Lấy thời gian tạo bài viết
        const createdAt = new Date().toISOString();

        let imageOrVideoUrl = null;
        if (req.file) {
            imageOrVideoUrl = `/uploads/${req.file.filename}`;
        }

        // Đọc dữ liệu từ db.json
        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));

        // Tạo đối tượng bài viết mới
        const newPost = {
            id: postId,
            userId: userId,
            title: title || null, // Sử dụng null nếu không có tiêu đề
            content: content || null, // Sử dụng null nếu không có nội dung
            imageOrVideoUrl: imageOrVideoUrl || null, // Sử dụng null nếu không có ảnh/video
            createdAt: createdAt
        };

        // Thêm bài viết mới vào mảng posts trong db.json
        db.posts = db.posts || []; // Khởi tạo mảng posts nếu nó chưa tồn tại
        db.posts.push(newPost);

        // Ghi lại dữ liệu vào db.json
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        router.db.read();
        // Trả về bài viết mới đã tạo
        res.status(201).json(newPost);

    } catch (error) {
        console.error('Lỗi khi tạo bài viết:', error);
        res.status(500).json({ message: 'Lỗi server khi tạo bài viết.' });
    }
});
// API 6: LẤY CÁC BÀI VIẾT GẦN ĐÂY (ĐÃ GỘP THÔNG TIN TÁC GIẢ)
server.get('/api/posts/recent', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        const posts = db.posts || [];
        const users = db.users || [];

        // 1. Sắp xếp tất cả bài viết theo thời gian tạo, mới nhất lên đầu
        const sortedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // 2. Lấy 3 bài viết đầu tiên
        const recentPosts = sortedPosts.slice(0, 3);
        
        // 3. Gộp thông tin tác giả vào mỗi bài viết
        const postsWithAuthors = recentPosts.map(post => {
            const author = users.find(user => user.id === post.userId);
            
            // Tạo một object author an toàn, chỉ chứa thông tin cần thiết
            const authorInfo = author 
                ? { displayName: author.displayName, avatarUrl: author.avatarUrl }
                : { displayName: 'Người dùng không tồn tại', avatarUrl: null }; // Fallback

            // Trả về object bài viết mới đã có thông tin tác giả
            return {
                ...post, // Giữ lại tất cả thông tin của bài viết gốc
                author: authorInfo
            };
        });

        res.status(200).json(postsWithAuthors);

    } catch (error) {
        console.error('Lỗi khi lấy bài viết gần đây:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy bài viết.' });
    }
});
// --- API XÓA BÀI VIẾT (AN TOÀN) ---
// ===================================================================
server.delete('/api/posts/:postId', (req, res) => {
    try {
        const { postId } = req.params;
        // Lấy userId từ body của request để xác thực quyền sở hữu
        const { userId } = req.body;

        // 1. Kiểm tra thông tin đầu vào
        if (!userId) {
            return res.status(400).json({ message: 'Yêu cầu xóa không hợp lệ, thiếu thông tin người dùng.' });
        }
        
        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        const postIndex = db.posts.findIndex(p => p.id === postId);

        // 2. Kiểm tra bài viết có tồn tại không
        if (postIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết để xóa.' });
        }

        const postToDelete = db.posts[postIndex];

        // 3. KIỂM TRA QUYỀN SỞ HỮU (QUAN TRỌNG NHẤT)
        // So sánh userId của bài viết với userId của người gửi yêu cầu
        if (postToDelete.userId !== userId) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này.' });
        }

        // 4. Nếu mọi thứ hợp lệ, tiến hành xóa
        db.posts.splice(postIndex, 1); // Xóa bài viết khỏi mảng
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); // Ghi lại file db.json
        
        // Báo cho router của json-server biết là db đã thay đổi
        router.db.read(); 

        res.status(200).json({ message: 'Bài viết đã được xóa thành công.' });

    } catch (error) {
        console.error('Lỗi khi xóa bài viết:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa bài viết.' });
    }
});

// ===================================================================
// --- SỬ DỤNG JSON SERVER (PHẢI ĐẶT Ở CUỐI CÙNG) ---
// ===================================================================

server.use(router);

// --- Khởi động server ---
server.listen(PORT,'0.0.0.0', () => {
  console.log(`Backend server (Express + JSON Server) đang chạy tại http://localhost:${PORT}`);
});