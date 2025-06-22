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

server.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});


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
    
    // Lấy đối tượng `db` từ instance `router` của json-server
    const db = router.db; 

    // Sử dụng API của lowdb (thư viện bên trong json-server) để tìm và cập nhật
    const userToUpdate = db.get('users').find({ id: userId });

    if (!userToUpdate.value()) { // .value() để lấy ra giá trị thực
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }
    
    // Cập nhật user và gọi .write() để lưu thay đổi
    // .write() sẽ cập nhật cả RAM và file db.json
    const updatedUser = userToUpdate.assign({ avatarUrl: avatarUrl }).write();
    
    // Trả về user đã được cập nhật
    res.json(updatedUser);

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
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); 
    router.db.read();// SỬA: Dùng dbPath
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
router.db.read();
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
    router.db.read();
    const { password: _, ...userToReturn } = newUser;
    return res.status(201).json(userToReturn);
  }
});

// API 5: Đăng nhập bằng Email/Mật khẩu

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
    router.db.read();
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

        if (!title && !content && !hasImageOrVideo) {
            return res.status(400).json({ message: 'Bài viết phải có ít nhất một trong các thông tin: tiêu đề, nội dung hoặc ảnh/video.' });
        }
        if (!userId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp userId.' });
        }

        const postId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        let imageOrVideoUrl = null;
        if (req.file) {
            imageOrVideoUrl = `/uploads/${req.file.filename}`;
        }

        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));

        // --- ĐỐI TƯỢNG BÀI VIẾT MỚI (ĐÃ BỎ "comments") ---
        const newPost = {
            id: postId,
            userId: userId,
            title: title || null,
            content: content || null,
            imageOrVideoUrl: imageOrVideoUrl || null,
            createdAt: createdAt,
            likes: [],
            dislikes: [],
            state: null // Trạng thái chờ duyệt
            // Đã bỏ trường "comments" vì bạn có bảng riêng
        };
        // --- KẾT THÚC THAY ĐỔI ---

        db.posts = db.posts || [];
        db.posts.push(newPost);

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        router.db.read();

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
        const allPosts = db.posts || []; // Đổi tên biến để rõ ràng hơn
        const users = db.users || [];

        // ✅ BƯỚC 1: LỌC BÀI VIẾT CHỈ LẤY NHỮNG BÀI CÓ STATE LÀ "PASS"
        const passedPosts = allPosts.filter(post => post.state === 'pass');

        // BƯỚC 2: Sắp xếp các bài viết đã được duyệt theo thời gian, mới nhất lên đầu
        const sortedPosts = passedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // BƯỚC 3: Lấy 3 bài viết đầu tiên
        const recentPosts = sortedPosts.slice(0, 3);
        
        // BƯỚC 4: Gộp thông tin tác giả vào mỗi bài viết (giữ nguyên)
        const postsWithAuthors = recentPosts.map(post => {
            const author = users.find(user => user.id === post.userId);
            
            const authorInfo = author 
                ? { displayName: author.displayName, avatarUrl: author.avatarUrl }
                : { displayName: 'Người dùng không tồn tại', avatarUrl: null }; 

            return {
                ...post,
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
// --- API MỚI: XỬ LÝ LIKE / DISLIKE BÀI VIẾT ---
// ===================================================================
server.post('/api/posts/:postId/interact', (req, res) => {
    try {
        const { postId } = req.params;
        // Lấy userId và loại tương tác ('like' hoặc 'dislike') từ body
        const { userId, interactionType } = req.body;

        // 1. Kiểm tra thông tin đầu vào
        if (!userId || !interactionType || !['like', 'dislike'].includes(interactionType)) {
            return res.status(400).json({ message: 'Yêu cầu không hợp lệ, thiếu userId hoặc loại tương tác không đúng.' });
        }

        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        const postIndex = db.posts.findIndex(p => p.id === postId);

        // 2. Kiểm tra bài viết có tồn tại không
        if (postIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        const post = db.posts[postIndex];

        // 3. Lấy ra mảng likes và dislikes hiện tại
        const likes = post.likes || [];
        const dislikes = post.dislikes || [];

        // 4. XỬ LÝ LOGIC CHÍNH
        if (interactionType === 'like') {
            const dislikeIndex = dislikes.indexOf(userId);
            if (dislikeIndex > -1) {
                dislikes.splice(dislikeIndex, 1); // Xóa dislike nếu có
            }

            const likeIndex = likes.indexOf(userId);
            if (likeIndex > -1) {
                likes.splice(likeIndex, 1); // User đã like -> Bỏ like (toggle)
            } else {
                likes.push(userId); // User chưa like -> Thêm like
            }
        } else if (interactionType === 'dislike') {
            const likeIndex = likes.indexOf(userId);
            if (likeIndex > -1) {
                likes.splice(likeIndex, 1); // Xóa like nếu có
            }

            const dislikeIndex = dislikes.indexOf(userId);
            if (dislikeIndex > -1) {
                dislikes.splice(dislikeIndex, 1); // User đã dislike -> Bỏ dislike (toggle)
            } else {
                dislikes.push(userId); // User chưa dislike -> Thêm dislike
            }
        }
        
        // 5. Cập nhật lại bài viết trong DB
        db.posts[postIndex].likes = likes;
        db.posts[postIndex].dislikes = dislikes;

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        router.db.read();

        // 6. Trả về bài viết đã được cập nhật
        res.status(200).json(db.posts[postIndex]);

    } catch (error) {
        console.error('Lỗi khi tương tác với bài viết:', error);
        res.status(500).json({ message: 'Lỗi server khi xử lý tương tác.' });
    }
});
// --- API MỚI: TẠO BÁO CÁO (REPORT) CHO BÀI VIẾT ---
// ===================================================================
server.post('/api/reports', (req, res) => {
    try {
        // 1. Lấy thông tin từ body của request
        const { postId, reporterId, reason } = req.body;

        // 2. Kiểm tra dữ liệu đầu vào có đầy đủ không
        if (!postId || !reporterId || !reason) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: postId, reporterId, và reason.' });
        }
        
        // 3. Đọc file database hiện tại
        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        
        // 4. Tạo đối tượng báo cáo mới
        const newReport = {
            id: crypto.randomUUID(), // Tạo ID duy nhất cho báo cáo
            postId: postId,
            reporterId: reporterId,
            reason: reason,
            createdAt: new Date().toISOString(), // Lưu lại thời gian báo cáo
            status: 'pending' // Trạng thái chờ xử lý, có thể dùng sau này
        };

        // 5. Thêm báo cáo mới vào mảng 'reports' trong db
        // Nếu mảng chưa tồn tại, hãy tạo nó
        if (!db.reports) {
            db.reports = [];
        }
        db.reports.push(newReport);
        
        // 6. Ghi lại thay đổi vào file db.json
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        // 7. Báo cho router của json-server biết là db đã thay đổi
        router.db.read(); 

        // 8. Trả về báo cáo đã được tạo thành công
        res.status(201).json(newReport);

    } catch (error) {
        console.error('Lỗi khi tạo báo cáo:', error);
        res.status(500).json({ message: 'Lỗi server khi tạo báo cáo.' });
    }
});
// --- API MỚI: TẠO BÌNH LUẬN VÀ GỬI THÔNG BÁO ---
// ===================================================================
server.post('/api/comments', async (req, res) => {
    try {
        const { postId, userId, content, parentId } = req.body;

        // 1. Kiểm tra dữ liệu đầu vào
        if (!postId || !userId || !content) {
            return res.status(400).json({ message: 'Thiếu thông tin cần thiết để tạo bình luận.' });
        }

        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));

        // 2. Kiểm tra xem bài viết và người dùng có tồn tại không
        const post = db.posts.find(p => p.id === postId);
        if (!post) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }
        const actor = db.users.find(u => u.id === userId); // actor là người thực hiện hành động
        if (!actor) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng bình luận.' });
        }

        // 3. Tạo bình luận mới
        const newComment = {
            id: crypto.randomUUID(),
            postId: postId,
            userId: userId,
            content: content,
            parentId: parentId || null,
            likedBy: [],
            createdAt: new Date().toISOString(),
        };

        if (!db.comments) db.comments = [];
        db.comments.push(newComment);
        
        // 4. Logic tạo thông báo
        if (!db.notifications) db.notifications = [];
        
        // Hàm trợ giúp tạo thông báo
        const createNotification = (recipientId, type) => {
             // Ngăn người dùng tự gửi thông báo cho chính mình
            if (recipientId === userId) return;

            const notification = {
                id: crypto.randomUUID(),
                recipientId: recipientId,       // Người nhận thông báo
                actorId: userId,                // Người gây ra hành động
                postId: postId,                 // Bài viết liên quan
                commentId: newComment.id,       // Bình luận vừa tạo
                type: type,                     // 'new_comment' hoặc 'new_reply'
                read: false,                    // Trạng thái chưa đọc
                createdAt: new Date().toISOString()
            };
            db.notifications.push(notification);
        };

        if (parentId) {
            // Đây là một comment trả lời (reply)
            const parentComment = db.comments.find(c => c.id === parentId);
            if (parentComment) {
                createNotification(parentComment.userId, 'new_reply');
            }
        } else {
            // Đây là một comment mới cho bài viết
            createNotification(post.userId, 'new_comment');
        }

        // 5. Lưu lại DB và trả về kết quả
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        router.db.read();

        res.status(201).json(newComment);

    } catch (error) {
        console.error('Lỗi khi tạo bình luận:', error);
        res.status(500).json({ message: 'Lỗi server khi tạo bình luận.' });
    }
});

// --- API MỚI: LẤY THÔNG BÁO CHO NGƯỜI DÙNG ---
// ===================================================================
// server.cjs - Phiên bản nâng cấp của API /api/notifications/:userId

server.get('/api/notifications/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));

        const userNotifications = (db.notifications || []).filter(n => n.recipientId === userId);

        const enrichedNotifications = userNotifications.map(notification => {
            const actor = db.users.find(u => u.id === notification.actorId);
            const post = db.posts.find(p => p.id === notification.postId);
            
            // --- CẢI TIẾN LOGIC TẠO MESSAGE ---
            let displayMessage = '';
            let postTitle = post ? (post.title || '(bài viết không có tiêu đề)') : '(bài viết đã bị xóa)';

switch (notification.type) {
    case 'new_comment':
        displayMessage = `đã bình luận về bài viết của bạn: "${postTitle}"`;
        break;
    case 'new_reply':
        displayMessage = `đã trả lời bình luận của bạn trong bài viết: "${postTitle}"`;
        break;
    case 'post_rejected':
        // ✅ XÂY DỰNG MESSAGE TỪ CÁC TRƯỜNG ĐÃ TÁCH
        displayMessage = `${notification.actionText}.`;
        if (notification.reason) {
            displayMessage += ` Lý do: "${notification.reason}"`;
        }
        break;
    default:
        displayMessage = 'vừa có một hoạt động mới.';
        break;
}
            // --- KẾT THÚC CẢI TIẾN ---

            return {
                ...notification,
                postExists: !!post,
                actor: actor ? {
                    displayName: actor.displayName,
                    avatarUrl: actor.avatarUrl
                } : {
                    displayName: 'Người dùng ẩn danh',
                    avatarUrl: null
                },
                post: post ? {
                    title: post.title || '(bài viết không có tiêu đề)' // Dùng () để rõ ràng hơn
                } : {
                    title: '(bài viết đã bị xóa)'
                },
                // Sử dụng biến mới, rõ ràng hơn
                message: displayMessage 
            };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json(enrichedNotifications);

    } catch (error) {
        console.error('Lỗi khi lấy thông báo:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy thông báo.' });
    }
});

// --- API MỚI: ĐÁNH DẤU TẤT CẢ THÔNG BÁO LÀ ĐÃ ĐỌC ---
// ===================================================================
server.post('/api/notifications/mark-all-as-read', (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
             return res.status(400).json({ message: 'Thiếu userId.' });
        }

        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        
        let changed = false;
        db.notifications.forEach(n => {
            if (n.recipientId === userId && !n.read) {
                n.read = true;
                changed = true;
            }
        });

        if (changed) {
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
            router.db.read();
        }

        res.status(200).json({ message: 'Đã đánh dấu tất cả là đã đọc.' });

    } catch (error) {
        console.error('Lỗi khi đánh dấu đã đọc:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
});
// --- API MỚI: XÓA MỘT THÔNG BÁO CỤ THỂ ---
// ===================================================================
server.delete('/api/notifications/:notificationId', (req, res) => {
    try {
        const { notificationId } = req.params;
        if (!notificationId) {
             return res.status(400).json({ message: 'Thiếu notificationId.' });
        }

        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        
        const initialLength = db.notifications.length;
        // Lọc và giữ lại tất cả các thông báo KHÔNG có ID trùng khớp
        db.notifications = db.notifications.filter(n => n.id !== notificationId);
        
        // Kiểm tra xem có thông báo nào được xóa không
        if (db.notifications.length === initialLength) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo để xóa.' });
        }

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        router.db.read();

        // 204 No Content là một response thành công chuẩn cho request DELETE
        res.status(204).send(); 

    } catch (error) {
        console.error('Lỗi khi xóa thông báo:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa thông báo.' });
    }
});
// API MỚI: LẤY CÁC BÀI VIẾT CHỜ DUYỆT (KÈM THÔNG TIN TÁC GIẢ) ---
// ===================================================================
server.get('/api/posts/pending', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        const allPosts = db.posts || [];
        const allUsers = db.users || [];

        // 1. Lọc ra các bài viết có state là null (đang chờ duyệt)
        const pendingPosts = allPosts.filter(post => post.state === null);

        // 2. Gắn thông tin tác giả vào mỗi bài viết chờ duyệt
        const postsWithAuthors = pendingPosts.map(post => {
            const author = allUsers.find(user => user.id === post.userId);
            
            // Chỉ trả về những thông tin cần thiết của tác giả
            const authorInfo = author 
                ? { displayName: author.displayName, avatarUrl: author.avatarUrl }
                : { displayName: 'Người dùng không tồn tại', avatarUrl: null }; 

            // Loại bỏ các trường không cần thiết từ bài viết để giảm kích thước payload
            const { likes, dislikes, ...restOfPost } = post;

            return {
                ...restOfPost, // id, userId, title, content, state, v.v.
                author: authorInfo
            };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sắp xếp bài mới nhất lên đầu

        res.status(200).json(postsWithAuthors);

    } catch (error) {
        console.error('Lỗi khi lấy bài viết chờ duyệt:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu.' });
    }
});
// --- API MỚI: TỪ CHỐI BÀI VIẾT VÀ GỬI THÔNG BÁO CHO TÁC GIẢ ---
// ===================================================================
server.post('/api/posts/:postId/reject', async (req, res) => {
    try {
        const { postId } = req.params;
        const { reason, adminId } = req.body;

        // --- DEBUGGING ---
        console.log('--- [REJECT POST] Bắt đầu xử lý ---');
        console.log('[REJECT POST] Post ID:', postId);
        console.log('[REJECT POST] Reason:', reason);
        console.log('[REJECT POST] Admin ID:', adminId);
        // --- END DEBUGGING ---

        if (!reason || !adminId) {
            console.error('[REJECT POST] Lỗi: Thiếu reason hoặc adminId.');
            return res.status(400).json({ message: 'Thiếu thông tin cần thiết.' });
        }

        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        const postIndex = db.posts.findIndex(p => p.id === postId);

        if (postIndex === -1) {
            console.error('[REJECT POST] Lỗi: Không tìm thấy bài viết với ID:', postId);
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        const postToReject = db.posts[postIndex];

        // Cập nhật trạng thái
        postToReject.state = 'fail';

        // --- DEBUGGING ---
        console.log('[REJECT POST] Người nhận thông báo (recipientId):', postToReject.userId);
        // --- END DEBUGGING ---

        // Tạo thông báo
        if (!db.notifications) {
            db.notifications = [];
        }

        const notification = {
        id: crypto.randomUUID(),
        recipientId: postToReject.userId,
        actorId: adminId,
        postId: postId,
        commentId: null,
        type: 'post_rejected',
        // ✅ THAY ĐỔI LỚN: TÁCH THÀNH 2 TRƯỜNG
        actionText: 'đã từ chối bài viết của bạn', // Mô tả hành động
        reason: reason, // Lý do cụ thể
        // Không cần trường "message" nữa
        read: false,
        createdAt: new Date().toISOString()
    };
    db.notifications.push(notification);

        // --- DEBUGGING ---
        console.log('[REJECT POST] Đã tạo đối tượng thông báo:', notification);
        // --- END DEBUGGING ---

        db.notifications.push(notification);

        // Lưu lại DB
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        router.db.read();
        
        console.log('[REJECT POST] Xử lý thành công!');
        res.status(200).json({ message: 'Bài viết đã bị từ chối và thông báo đã được gửi.' });

    } catch (error) {
        console.error('[REJECT POST] Lỗi server nghiêm trọng:', error);
        res.status(500).json({ message: 'Lỗi server khi từ chối bài viết.' });
    }
});
// --- API MỚI 1: LẤY DANH SÁCH CÁC BÀI VIẾT BỊ BÁO CÁO (GROUPED) ---
// ===================================================================
server.get('/api/posts/reported', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        
        // Đảm bảo dữ liệu đầu vào luôn là mảng để không bị lỗi
        const allPosts = db.posts || [];
        const allUsers = db.users || [];
        const allReports = db.reports || [];

        if (allReports.length === 0) {
            return res.status(200).json([]); // Không có báo cáo nào, trả về mảng rỗng
        }

        // 1. Tạo một Map để tra cứu thông tin người dùng nhanh hơn (hiệu năng tốt hơn)
        const userMap = new Map(allUsers.map(user => [user.id, user]));

        // 2. Nhóm các báo cáo theo postId
        const reportsByPost = allReports.reduce((acc, report) => {
            // Chỉ xử lý các báo cáo có postId
            if (report.postId) {
                acc[report.postId] = acc[report.postId] || [];
                acc[report.postId].push(report);
            }
            return acc;
        }, {});

        // 3. Lấy ra danh sách các ID của bài viết bị báo cáo
        const reportedPostIds = Object.keys(reportsByPost);

        if (reportedPostIds.length === 0) {
            return res.status(200).json([]);
        }
        
        // 4. Lọc ra các bài viết tương ứng từ `allPosts`
        const reportedPostsDetails = allPosts
            .filter(post => reportedPostIds.includes(post.id)) // Chỉ lấy những bài viết có trong danh sách báo cáo
            .map(post => {
                const reportsForThisPost = reportsByPost[post.id];
                const author = userMap.get(post.userId);

                // Lấy thông tin chi tiết của người báo cáo
                const detailedReports = reportsForThisPost.map(report => {
                    const reporter = userMap.get(report.reporterId);
                    return {
                        id: report.id,
                        reason: report.reason,
                        reporterInfo: reporter 
                            ? { displayName: reporter.displayName, avatarUrl: reporter.avatarUrl }
                            : { displayName: 'Người dùng ẩn danh', avatarUrl: null }
                    };
                });

                return {
                    id: post.id,
                    title: post.title,
                    userId: post.userId,
                    reportCount: reportsForThisPost.length,
                    authorInfo: author
                        ? { displayName: author.displayName, avatarUrl: author.avatarUrl }
                        : { displayName: 'Người dùng không tồn tại', avatarUrl: null },
                    reports: detailedReports // Đây là mảng chi tiết cho Toast
                };
            });

        // 5. Sắp xếp kết quả theo số lượng báo cáo giảm dần
        res.status(200).json(reportedPostsDetails.sort((a, b) => b.reportCount - a.reportCount));

    } catch (error) {
        console.error('Lỗi khi lấy bài viết bị báo cáo:', error);
        res.status(500).json({ message: 'Lỗi server.', error: error.message });
    }
});


// --- API MỚI 2: XÓA TẤT CẢ BÁO CÁO CỦA MỘT BÀI VIẾT (THÔNG QUA) ---
// ===================================================================
server.delete('/api/reports/by-post/:postId', (req, res) => {
    try {
        const { postId } = req.params;
        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        
        if (!db.reports) {
            return res.status(200).json({ message: 'Không có báo cáo nào để xóa.' });
        }

        const initialLength = db.reports.length;
        // Giữ lại tất cả các báo cáo KHÔNG thuộc về postId này
        db.reports = db.reports.filter(report => report.postId !== postId);

        if (db.reports.length === initialLength) {
            return res.status(404).json({ message: 'Không tìm thấy báo cáo nào cho bài viết này.' });
        }

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        router.db.read();

        res.status(200).json({ message: 'Tất cả báo cáo cho bài viết đã được xóa thành công.' });
    } catch (error) {
        console.error('Lỗi khi xóa báo cáo theo postId:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

// --- API MỚI: DUYỆT BÀI VIẾT ---
// ===================================================================
server.post('/api/posts/:postId/approve', async (req, res) => {
    try {
        const { postId } = req.params;
        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        const postIndex = db.posts.findIndex(p => p.id === postId);

        if (postIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
        }

        // Cập nhật trạng thái thành 'pass'
        db.posts[postIndex].state = 'pass';
        
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        router.db.read();
        
        res.status(200).json({ message: 'Bài viết đã được duyệt thành công.' });

    } catch (error) {
        console.error('Lỗi khi duyệt bài viết:', error);
        res.status(500).json({ message: 'Lỗi server khi duyệt bài viết.' });
    }
});


// --- API MỚI: XÓA BÀI VIẾT (Bởi Admin) ---
// Đây là phiên bản xóa không cần kiểm tra quyền sở hữu
// ===================================================================
server.delete('/api/admin/posts/:postId', (req, res) => {
    try {
        const { postId } = req.params;
        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));

        // Xóa comments, reports liên quan trước
        if (db.comments) {
            db.comments = db.comments.filter(c => c.postId !== postId);
        }
        if (db.reports) {
            db.reports = db.reports.filter(r => r.postId !== postId);
        }

        // Xóa bài viết
        const initialLength = db.posts.length;
        db.posts = db.posts.filter(p => p.id !== postId);
        if (db.posts.length === initialLength) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết để xóa.' });
        }

        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        router.db.read();

        res.status(200).json({ message: 'Bài viết và dữ liệu liên quan đã được xóa.' });
    } catch (error) {
        console.error('Lỗi admin xóa bài viết:', error);
        res.status(500).json({ message: 'Lỗi server khi admin xóa bài viết.' });
    }
});
// --- API MỚI: XÓA BÀI VIẾT VÀ TẤT CẢ DỮ LIỆU LIÊN QUAN (CASCADE DELETE) ---
// ===================================================================
server.delete('/posts/:postId/cascade', (req, res) => {
    try {
        const { postId } = req.params;
        console.log(`[CASCADE DELETE] Nhận yêu cầu xóa toàn diện cho bài viết: ${postId}`);

        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));
        
        const postExists = db.posts.some(p => p.id === postId);
        if (!postExists) {
            return res.status(404).json({ message: 'Không tìm thấy bài viết để xóa.' });
        }

        // 1. Xóa các comments liên quan (nếu có)
        if (db.comments) {
            db.comments = db.comments.filter(c => c.postId !== postId);
        }

        // 2. Xóa các reports liên quan (nếu có)
        if (db.reports) {
            db.reports = db.reports.filter(r => r.postId !== postId);
        }

        // 3. Xóa chính bài viết đó
        db.posts = db.posts.filter(p => p.id !== postId);

        // Ghi lại toàn bộ thay đổi vào file
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        router.db.read();

        console.log(`[CASCADE DELETE] Đã xóa thành công bài viết ${postId} và dữ liệu liên quan.`);
        res.status(200).json({ message: 'Bài viết và tất cả dữ liệu liên quan đã được xóa thành công.' });

    } catch (error) {
        console.error('Lỗi khi thực hiện xóa toàn diện:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa bài viết.' });
    }
});
// --- API MỚI: XÓA NGƯỜI DÙNG VÀ TẤT CẢ DỮ LIỆU LIÊN QUAN (CASCADE DELETE) ---
// ===================================================================
server.delete('/api/users/:userId/cascade', (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`[CASCADE DELETE USER] Nhận yêu cầu xóa toàn diện cho người dùng: ${userId}`);

        const db = JSON.parse(fs.readFileSync(dbPath, 'UTF-8'));

        // 0. Kiểm tra xem người dùng có tồn tại không
        const userIndex = db.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng để xóa.' });
        }

        // 1. Xóa các bài viết của người dùng và tất cả dữ liệu liên quan đến bài viết đó
        const userPosts = db.posts.filter(p => p.userId === userId);
        for (const post of userPosts) {
            // Xóa comments, reports của bài viết này
            if (db.comments) {
                db.comments = db.comments.filter(c => c.postId !== post.id);
            }
            if (db.reports) {
                db.reports = db.reports.filter(r => r.postId !== post.id);
            }
        }
        // Giờ mới xóa các bài viết
        db.posts = db.posts.filter(p => p.userId !== userId);

        // 2. Xóa các bình luận do người dùng này tạo
        if (db.comments) {
            db.comments = db.comments.filter(c => c.userId !== userId);
        }

        // 3. Xóa các báo cáo do người dùng này tạo
        if (db.reports) {
            db.reports = db.reports.filter(r => r.reporterId !== userId);
        }

        // 4. Xóa các thông báo gửi đến hoặc gây ra bởi người dùng này
        if (db.notifications) {
            db.notifications = db.notifications.filter(n => n.recipientId !== userId && n.actorId !== userId);
        }

        // 5. Cuối cùng, xóa chính người dùng đó
        db.users.splice(userIndex, 1);

        // Ghi lại toàn bộ thay đổi vào file
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        router.db.read(); // Báo cho json-server biết DB đã thay đổi

        console.log(`[CASCADE DELETE USER] Đã xóa thành công người dùng ${userId} và dữ liệu liên quan.`);
        res.status(200).json({ message: 'Người dùng và tất cả dữ liệu liên quan đã được xóa thành công.' });

    } catch (error) {
        console.error('Lỗi khi thực hiện xóa người dùng toàn diện:', error);
        res.status(500).json({ message: 'Lỗi server khi xóa người dùng.' });
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