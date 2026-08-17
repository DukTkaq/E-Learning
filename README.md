# Hệ thống E-Learning (SWP391)

Dự án này sử dụng kiến trúc hiện đại **Client-Server Architecture (API-Driven)**, tách biệt hoàn toàn phần Backend (Node.js RESTful API) và Frontend (ReactJS + Tailwind CSS).

## Công nghệ sử dụng (Tech Stack)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Supabase) + Sequelize ORM
- **Frontend**: ReactJS (Vite), Tailwind CSS
- **Tích hợp AI**: Google Gemini API (Hoặc OpenAI)
- **Quản lý Source Code**: Git / GitLab / GitHub

## Cấu trúc dự án
Dự án được chia làm 2 thư mục ngang hàng (Monorepo):
- `server/`: Chứa code của Backend API (Node.js).
- `client/`: Chứa code của giao diện Frontend (ReactJS).

### Cấu trúc Backend (`server/`)
- `src/config/`: Cấu hình hệ thống (Database, Cloudinary, v.v.)
- `src/controllers/`: Xử lý logic nghiệp vụ
- `src/middlewares/`: Chứa các hàm chặn (Auth, Validate, v.v.)
- `src/models/`: Định nghĩa các bảng trong Database (Sequelize)
- `src/routes/`: Định tuyến API

---

## Cấu hình Database (Bắt buộc cho thành viên mới)

Để Backend có thể chạy được, bạn cần phải có file biến môi trường để kết nối với cơ sở dữ liệu **Supabase (PostgreSQL)**.

1. Vào thư mục `server/`.
2. Tạo một file mới tên là `.env`.
3. Copy toàn bộ nội dung từ file `server/.env.example` dán vào file `.env` vừa tạo.
4. **Liên hệ Team Leader** để lấy mật khẩu Database thực tế điền vào biến `DATABASE_URL` trong file `.env`.

*(Lưu ý: File `.env` chứa thông tin nhạy cảm nên đã được đưa vào `.gitignore`, tuyệt đối không cố gắng push file này lên Github).*

---

## Hướng dẫn chạy dự án chi tiết (Localhost)

Dự án này sử dụng mô hình Client-Server, nên bạn **bắt buộc phải mở HAI tab terminal riêng biệt** chạy song song cùng lúc để hệ thống hoạt động.

### 🔴 Terminal 1: Khởi động Backend API (Node.js)
Mở terminal thứ nhất, di chuyển vào thư mục `server`:
```bash
cd server
npm install
npm run dev
```
Khi chạy thành công, Terminal sẽ in ra các dòng thông báo kết nối Database và cổng (Ví dụ: 3000).

### 🔵 Terminal 2: Khởi động Giao diện Frontend (ReactJS)
Mở một cửa sổ Terminal THỨ HAI, di chuyển vào thư mục `client`:
```bash
cd client
npm install
npm run dev
```
Vite sẽ khởi động siêu nhanh và in ra một đường link localhost (thường là cổng 5173).

**👉 BƯỚC CUỐI CÙNG:**
Hãy ấn giữ nút `Ctrl` (hoặc `Cmd` trên Mac) và **click chuột thẳng vào đường link** `http://localhost:5173/` được in ra ở Terminal 2 để mở giao diện Web E-Learning trên trình duyệt!

---

## Tài khoản Test (Mockup Accounts)
Để thuận tiện cho việc kiểm thử các Use Case, hệ thống đã chuẩn bị sẵn 3 tài khoản đại diện cho 3 vai trò (Roles) khác nhau. Bạn có thể sử dụng các tài khoản này để đăng nhập ngay khi khởi động dự án:

1. **Admin (Quản trị viên)**
   - Email: `admin@fpt.edu.vn`
   - Password: `Password123`
2. **Instructor (Giảng viên)**
   - Email: `instructor@fpt.edu.vn`
   - Password: `Password123`
3. **Student (Học viên)**
   - Email: `student@fpt.edu.vn`
   - Password: `Password123`

*(Lưu ý: Mật khẩu trên thực tế đã được mã hóa bằng Bcrypt trong cơ sở dữ liệu).*

---

## Quy tắc Code nhóm (Team Convention)
1. Mỗi người code một tính năng thì tạo branch mới: `git checkout -b feature/ten-tinh-nang`
2. Sau khi code xong phải tạo Pull Request (PR) để review, không tự ý merge thẳng vào branch `master`.
3. Tuân thủ tuyệt đối chuẩn RESTful API khi viết code cho Backend.
