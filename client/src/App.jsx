import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Register from './components/Register'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Layout from './components/Layout'
import Profile from './components/Profile'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import UserManagement from './components/UserManagement'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
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
        <Route path="/" element={<Navigate to="/login" replace />} />
        
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
        <Route path="/dashboard" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        <Route path="/profile" element={
          <Layout>
            <Profile />
          </Layout>
        } />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={[1]} />}>
          <Route path="/admin/users" element={
            <Layout>
              <UserManagement />
            </Layout>
          } />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
