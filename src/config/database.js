const { Sequelize } = require('sequelize');
require('dotenv').config();

// Khởi tạo kết nối Sequelize sử dụng DATABASE_URL từ .env
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Cần thiết khi kết nối với Supabase
    }
  },
  logging: false, // Đặt true nếu muốn xem câu lệnh SQL in ra console
});

module.exports = sequelize;
