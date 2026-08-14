# Ghi chú cho AI (AI Instructions)

## 1. Quy tắc Thiết kế Giao diện (Styling & Colors)
Dự án sử dụng Tailwind CSS. TẤT CẢ các thành phần giao diện (UI) PHẢI sử dụng các biến màu thương hiệu đã được khai báo sẵn trong cấu hình Tailwind. 
**TUYỆT ĐỐI KHÔNG** sử dụng các màu mặc định của Tailwind (như `bg-blue-500`, `text-red-500`, `bg-gray-100` một cách tùy tiện) nếu có màu thương hiệu tương ứng.

Danh sách màu thương hiệu bắt buộc sử dụng:
- **Primary**: `text-primary`, `bg-primary`, `border-primary` (Màu chủ đạo)
- **Secondary**: `text-secondary`, `bg-secondary` (Màu phụ)
- **Accent**: `text-accent`, `bg-accent` (Màu nhấn)
- **Error**: `text-error`, `bg-error` (Dùng cho thông báo lỗi, nút Xóa/Hủy)

Luôn luôn ưu tiên sử dụng `bg-gradient-to-r from-primary to-secondary` cho các điểm nhấn quan trọng (Logo, Tiêu đề chính).

## 2. Quy tắc Code (Coding Convention)
- Code Backend: Chuẩn RESTful API. Trả về đúng mã HTTP (200, 201, 400, 401, 403, 404, 500).
- Code Frontend: React Functional Component + Hooks. Quản lý trạng thái gọn gàng.
