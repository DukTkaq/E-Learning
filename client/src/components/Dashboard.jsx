import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      toast.error('Please login to access the dashboard.')
      navigate('/login')
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch (e) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login')
    }
  }, [navigate])

  const handleLogout = async () => {
    try {
      // Optional: Call backend logout API
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Always remove token client-side
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      toast.success('Logged out successfully!')
      navigate('/login')
    }
  }

  if (!user) return null

  return (
    <div className="w-full max-w-4xl bg-card-bg backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200 transition-all">
      <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
        <h2 className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
          Dashboard
        </h2>
        <button 
          onClick={handleLogout}
          className="px-6 py-2 bg-error/10 text-error hover:bg-error hover:text-white font-semibold rounded-xl transition-all duration-300"
        >
          Logout
        </button>
      </div>

      <div className="bg-white/80 p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Welcome back, {user.name}!</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Email Address</p>
            <p className="font-medium text-gray-800">{user.email}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Account Role</p>
            <p className="font-medium text-primary">
              {user.role || 'Student'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
