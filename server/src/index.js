const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');
require('./models'); // Load all models and associations
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const instructorCourseRoutes = require('./routes/instructorCourseRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const errorHandler = require('./middlewares/errorMiddleware');

const app = express();

const path = require('path');

app.use(cors());
app.use(express.json());

// Serve static files (like uploaded avatars)
app.use(express.static(path.join(__dirname, '../public')));

// Định tuyến API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/instructor/courses', instructorCourseRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/courses', catalogRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the E-Learning API!' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Test kết nối DB và chạy server
sequelize.authenticate()
  .then(() => {
    console.log('✅ Kết nối Database Supabase thành công!');
    app.listen(PORT, () => {
      console.log(`🚀 Backend API Server is running on port ${PORT}`);
      console.log(`🔗 Local Link: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối Database:', err);
  });
