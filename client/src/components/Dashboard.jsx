import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'

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
      await api.post('/auth/logout')
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
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome back, <span className="text-primary">{user.name}</span>!
          </h2>
          <p className="text-gray-500 mt-1">What do you want to learn today?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder cards for future features */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-40 flex flex-col justify-center items-center text-gray-400 border-dashed border-2">
          Featured Courses Area
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-40 flex flex-col justify-center items-center text-gray-400 border-dashed border-2">
          My Progress Area
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-40 flex flex-col justify-center items-center text-gray-400 border-dashed border-2">
          Recommendations
        </div>
      </div>
    </div>
  )
}
