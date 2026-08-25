const sequelize = require('../config/database');

const Role = require('./Role');
const User = require('./User');
const Category = require('./Category');
const Course = require('./Course');
const Lesson = require('./Lesson');
const Quiz = require('./Quiz');
const Question = require('./Question');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Coupon = require('./Coupon');
const Payment = require('./Payment');
const Enrollment = require('./Enrollment');
const Certificate = require('./Certificate');
const Review = require('./Review');
const InstructorCertificate = require('./InstructorCertificate');

// === DEFINE ASSOCIATIONS ===

// Role & User
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

// Category & Course
Category.hasMany(Course, { foreignKey: 'category_id' });
Course.belongsTo(Category, { foreignKey: 'category_id' });

// User (Instructor) & Course
User.hasMany(Course, { foreignKey: 'instructor_id', as: 'InstructorCourses' });
Course.belongsTo(User, { foreignKey: 'instructor_id', as: 'Instructor' });

// Course & Lesson
Course.hasMany(Lesson, { foreignKey: 'course_id' });
Lesson.belongsTo(Course, { foreignKey: 'course_id' });

// Lesson & Quiz
Lesson.hasOne(Quiz, { foreignKey: 'lesson_id' });
Quiz.belongsTo(Lesson, { foreignKey: 'lesson_id' });

// Quiz & Question
Quiz.hasMany(Question, { foreignKey: 'quiz_id' });
Question.belongsTo(Quiz, { foreignKey: 'quiz_id' });

// User (Student) & Cart
User.hasMany(Cart, { foreignKey: 'user_id' });
Cart.belongsTo(User, { foreignKey: 'user_id' });

// Cart & CartItem
Cart.hasMany(CartItem, { foreignKey: 'cart_id', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });

// Course & CartItem
Course.hasMany(CartItem, { foreignKey: 'course_id', onDelete: 'CASCADE' });
CartItem.belongsTo(Course, { foreignKey: 'course_id' });

// User (Instructor) & Coupon
User.hasMany(Coupon, { foreignKey: 'instructor_id', as: 'InstructorCoupons' });
Coupon.belongsTo(User, { foreignKey: 'instructor_id', as: 'CouponInstructor' });

// Course & Coupon
Course.hasMany(Coupon, { foreignKey: 'course_id' });
Coupon.belongsTo(Course, { foreignKey: 'course_id' });

// User & Payment
User.hasMany(Payment, { foreignKey: 'user_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });

// Course & Payment
Course.hasMany(Payment, { foreignKey: 'course_id' });
Payment.belongsTo(Course, { foreignKey: 'course_id' });

// Coupon & Payment
Coupon.hasMany(Payment, { foreignKey: 'coupon_id' });
Payment.belongsTo(Coupon, { foreignKey: 'coupon_id' });

// User & Enrollment
User.hasMany(Enrollment, { foreignKey: 'user_id' });
Enrollment.belongsTo(User, { foreignKey: 'user_id' });

// Course & Enrollment
Course.hasMany(Enrollment, { foreignKey: 'course_id' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id' });

// User & Certificate
User.hasMany(Certificate, { foreignKey: 'user_id' });
Certificate.belongsTo(User, { foreignKey: 'user_id' });

// Course & Certificate
Course.hasMany(Certificate, { foreignKey: 'course_id' });
Certificate.belongsTo(Course, { foreignKey: 'course_id' });

// User & Review
User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });

// Course & Review
Course.hasMany(Review, { foreignKey: 'course_id' });
Review.belongsTo(Course, { foreignKey: 'course_id' });

// User & InstructorCertificate
User.hasMany(InstructorCertificate, { foreignKey: 'user_id' });
InstructorCertificate.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  Role,
  User,
  Category,
  Course,
  Lesson,
  Quiz,
  Question,
  Cart,
  CartItem,
  Coupon,
  Payment,
  Enrollment,
  Certificate,
  Review,
  InstructorCertificate
};
