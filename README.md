# E-Learning Platform API (SWP391)

Đây là Backend cho dự án E-Learning, xây dựng bằng Node.js, Express và kết nối với cơ sở dữ liệu Supabase (PostgreSQL) thông qua Sequelize.

## Cấu trúc thư mục (MVC)
- `src/config/`: Cấu hình hệ thống (Database, Cloudinary...)
- `src/controllers/`: Xử lý logic nghiệp vụ
- `src/middlewares/`: Chứa các hàm chặn (Auth, Validate...)
- `src/models/`: Định nghĩa các bảng trong Database
- `src/routes/`: Định tuyến API

## Hướng dẫn cài đặt cho thành viên nhóm

Làm đúng theo các bước sau để chạy dự án trên máy cá nhân của bạn:

### Bước 1: Clone project về máy
```bash
git clone <đường-dẫn-repo-của-nhóm>
cd elearning-project
```

### Bước 2: Cài đặt thư viện (Dependencies)
Cài đặt toàn bộ các packages cần thiết (Express, Sequelize, Bcrypt...):
```bash
npm install
```

### Bước 3: Cấu hình biến môi trường (Cực kỳ quan trọng)
Dự án cần file `.env` để kết nối Database. **Tuyệt đối không push file `.env` lên Git**.
1. Copy nội dung từ file `.env.example`.
2. Tạo một file mới tên là `.env` ở thư mục gốc (ngang hàng với `package.json`).
3. Dán nội dung vào file `.env` và liên hệ Team Leader để xin mật khẩu Database thực tế điền vào biến `DATABASE_URL`.

### Bước 4: Khởi chạy Server
Chạy lệnh sau để khởi động server:
```bash
npm run dev
# Hoặc: node src/index.js
```
Nếu bạn thấy dòng chữ `✅ Kết nối Database Supabase thành công!` tức là bạn đã cấu hình đúng và có thể bắt đầu code API của mình!

## Quy tắc Code nhóm (Team Convention)
1. Mỗi người code một tính năng thì tạo branch mới: `git checkout -b feature/ten-tinh-nang`
2. Sau khi code xong phải tạo Pull Request (PR) để review, không tự ý merge thẳng vào branch `main`.
3. Tuân thủ chuẩn RESTful API.
