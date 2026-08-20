import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Register from './components/Register'
import Login from './components/Login'
import Layout from './components/Layout'
import Profile from './components/Profile'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import UserManagement from './components/UserManagement'
import CategoryManagement from './components/CategoryManagement'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './components/AdminDashboard'
import InstructorLayout from './components/layout/InstructorLayout'
import CourseManagementPage from './pages/instructor/CourseManagementPage'
import InstructorCourseDetailPage from './pages/instructor/CourseDetailPage'
import LessonManagementPage from './pages/instructor/LessonManagementPage'
import QuizManagementPage from './pages/instructor/QuizManagementPage'
import RevenueDashboardPage from './pages/instructor/RevenueDashboardPage'
import ReviewsPage from './pages/instructor/ReviewsPage'
import VoucherManagementPage from './pages/instructor/VoucherManagementPage'
import CartPage from './pages/student/CartPage'
import CheckoutPage from './pages/student/CheckoutPage'
import VnpayResultPage from './pages/student/VnpayResultPage'
import CatalogPage from './pages/student/CatalogPage'
import MyCoursesPage from './pages/student/MyCoursesPage'
import CourseApprovalsPage from './pages/admin/CourseApprovalsPage'
import InstructorApprovalsPage from './pages/admin/InstructorApprovalsPage'
import RoleHomeRedirect from './components/routing/RoleHomeRedirect'
import PendingCartIntent from './components/routing/PendingCartIntent'
import CourseDetailPage from './pages/student/CourseDetailPage'
import PaymentHistoryPage from './pages/student/PaymentHistoryPage'
import LearningCoursePage from './pages/student/LearningCoursePage'
import LessonPlayerPage from './pages/student/LessonPlayerPage'

function App() {
  return (
    <Router>
      <PendingCartIntent />
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '0.75rem',
            border: '1px solid #f3f4f6'
          },
        }} 
      />

      <Routes>
        <Route path="/" element={<Layout><CatalogPage /></Layout>} />
        <Route path="/courses/:courseId" element={<Layout><CourseDetailPage /></Layout>} />
        <Route path="/dashboard" element={<RoleHomeRedirect />} />
        
        {/* Auth Routes */}
        <Route path="/register" element={
          <div className="min-h-screen font-inter bg-slate-50 relative flex items-center justify-center p-4 overflow-hidden">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
            <div className="relative z-10 w-full flex justify-center"><Register /></div>
          </div>
        } />
        
        <Route path="/login" element={
          <div className="min-h-screen font-inter bg-slate-50 relative flex items-center justify-center p-4 overflow-hidden">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
            <div className="relative z-10 w-full flex justify-center"><Login /></div>
          </div>
        } />
        
        <Route path="/forgot-password" element={
          <div className="min-h-screen font-inter bg-slate-50 relative flex items-center justify-center p-4 overflow-hidden">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
            <div className="relative z-10 w-full flex justify-center"><ForgotPassword /></div>
          </div>
        } />

        <Route path="/reset-password" element={
          <div className="min-h-screen font-inter bg-slate-50 relative flex items-center justify-center p-4 overflow-hidden">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
            <div className="relative z-10 w-full flex justify-center"><ResetPassword /></div>
          </div>
        } />

        {/* Main Routes (With Navbar) */}
        <Route path="/profile" element={
          <Layout>
            <Profile />
          </Layout>
        } />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={[1]} />}>
          <Route path="/admin/dashboard" element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          } />
          <Route path="/admin/users" element={
            <AdminLayout>
              <UserManagement />
            </AdminLayout>
          } />
          <Route path="/admin/categories" element={
            <AdminLayout>
              <CategoryManagement />
            </AdminLayout>
          } />
          <Route path="/admin/approvals" element={<AdminLayout><CourseApprovalsPage /></AdminLayout>} />
          <Route path="/admin/instructor-approvals" element={<AdminLayout><InstructorApprovalsPage /></AdminLayout>} />
        </Route>

        {/* Instructor Routes */}
        <Route element={<ProtectedRoute allowedRoles={[2]} />}>
          <Route path="/instructor/courses" element={<InstructorLayout><CourseManagementPage /></InstructorLayout>} />
          <Route path="/instructor/courses/:courseId" element={<InstructorLayout><InstructorCourseDetailPage /></InstructorLayout>} />
          <Route path="/instructor/courses/:courseId/lessons" element={<InstructorLayout><LessonManagementPage /></InstructorLayout>} />
          <Route path="/instructor/courses/:courseId/lessons/:lessonId/quiz" element={<InstructorLayout><QuizManagementPage /></InstructorLayout>} />
          <Route path="/instructor/vouchers" element={<InstructorLayout><VoucherManagementPage /></InstructorLayout>} />
          <Route path="/instructor/revenue" element={<InstructorLayout><RevenueDashboardPage /></InstructorLayout>} />
          <Route path="/instructor/reviews" element={<InstructorLayout><ReviewsPage /></InstructorLayout>} />
          <Route path="/instructor/profile" element={<InstructorLayout><Profile /></InstructorLayout>} />
        </Route>

        {/* Student Commerce Routes */}
        <Route element={<ProtectedRoute allowedRoles={[3]} />}>
          <Route path="/cart" element={<Layout><CartPage /></Layout>} />
          <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
          <Route path="/checkout/vnpay-result" element={<Layout><VnpayResultPage /></Layout>} />
          <Route path="/my-courses" element={<Layout><MyCoursesPage /></Layout>} />
          <Route path="/my-courses/:courseId" element={<Layout><LearningCoursePage /></Layout>} />
          <Route path="/learn/courses/:courseId/lessons/:lessonId" element={<Layout><LessonPlayerPage /></Layout>} />
          <Route path="/payments" element={<Layout><PaymentHistoryPage /></Layout>} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
