const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Không tìm thấy token, từ chối truy cập!' });
  }

  // Token thường có dạng "Bearer <token_chuỗi_hash>"
  const token = authHeader.split(' ')[1] || authHeader;

  try {
    const secret = process.env.JWT_SECRET || 'SWP391_SECRET_KEY_MOCK';
    const decoded = jwt.verify(token, secret);
    
    // Lưu thông tin user vào request để các hàm sau (controllers) có thể dùng
    req.user = decoded; 
    next(); // Cho phép đi tiếp vào route
  } catch (error) {
    return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
  }
};

module.exports = {
  verifyToken
};
