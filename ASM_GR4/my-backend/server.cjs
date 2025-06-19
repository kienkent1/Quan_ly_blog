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

// API 7: LẤY BÀI VIẾT THEO USER ID
server.get('/api/posts/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        const posts = db.posts || [];
        const users = db.users || [];

        // Lọc bài viết theo userId và sắp xếp theo thời gian mới nhất
        const userPosts = posts
            .filter(post => post.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Gộp thông tin tác giả vào mỗi bài viết
        const postsWithAuthors = userPosts.map(post => {
            const author = users.find(user => user.id === post.userId);
            const authorInfo = author 
                ? { displayName: author.displayName, avatarUrl: author.avatarUrl }
                : { displayName: 'Người dùng không tồn tại', avatarUrl: null };

            return {
                ...post,
                author: authorInfo,
                likes: post.likes || 0,
                loves: post.loves || 0,
                likedBy: post.likedBy || [],
                lovedBy: post.lovedBy || []
            };
        });

        res.status(200).json(postsWithAuthors);
    } catch (error) {
        console.error('Lỗi khi lấy bài viết của người dùng:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy bài viết.' });
    }
});

// API 8: LIKE BÀI VIẾT
server.post('/api/posts/:postId/like', (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp userId.' });
        }

        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        const postIndex = db.posts.findIndex(p => p.id === postId);

        if (postIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        const post = db.posts[postIndex];
        const likedBy = post.likedBy || [];

        // Kiểm tra xem người dùng đã like chưa
        if (likedBy.includes(userId)) {
            return res.status(400).json({ message: 'Bạn đã like bài viết này rồi.' });
        }

        // Thêm userId vào danh sách likedBy và tăng số lượng likes
        likedBy.push(userId);
        post.likedBy = likedBy;
        post.likes = (post.likes || 0) + 1;
        post.updatedAt = new Date().toISOString();

        // Cập nhật db.json
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        res.status(200).json(post);
    } catch (error) {
        console.error('Lỗi khi like bài viết:', error);
        res.status(500).json({ message: 'Lỗi server khi like bài viết.' });
    }
});

// API 9: LOVE BÀI VIẾT
server.post('/api/posts/:postId/love', (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp userId.' });
        }

        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        const postIndex = db.posts.findIndex(p => p.id === postId);

        if (postIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        const post = db.posts[postIndex];
        const lovedBy = post.lovedBy || [];

        // Kiểm tra xem người dùng đã love chưa
        if (lovedBy.includes(userId)) {
            return res.status(400).json({ message: 'Bạn đã thả tim bài viết này rồi.' });
        }

        // Thêm userId vào danh sách lovedBy và tăng số lượng loves
        lovedBy.push(userId);
        post.lovedBy = lovedBy;
        post.loves = (post.loves || 0) + 1;
        post.updatedAt = new Date().toISOString();

        // Cập nhật db.json
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        res.status(200).json(post);
    } catch (error) {
        console.error('Lỗi khi love bài viết:', error);
        res.status(500).json({ message: 'Lỗi server khi love bài viết.' });
    }
});

// API 10: XÓA BÀI VIẾT
server.delete('/api/posts/:postId', (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp userId.' });
        }

        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        const postIndex = db.posts.findIndex(p => p.id === postId);

        if (postIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        const post = db.posts[postIndex];

        // Kiểm tra quyền xóa
        if (post.userId !== userId) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa bài viết này.' });
        }

        // Xóa file ảnh/video nếu có
        if (post.imageOrVideoUrl) {
            const filePath = path.join(publicPath, post.imageOrVideoUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Xóa bài viết khỏi mảng posts
        db.posts.splice(postIndex, 1);

        // Cập nhật db.json
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        res.status(200).json({ message: 'Xóa bài viết thành công.' });
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