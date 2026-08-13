import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Shield, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      toast.error('Please login first')
      navigate('/login')
      return
    }
    try {
      setUser(JSON.parse(userData))
    } catch (e) {
      navigate('/login')
    }
  }, [navigate])

  if (!user) return null

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
        My Profile
      </h2>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-primary/80 to-secondary/80 w-full relative">
          <div className="absolute -bottom-12 left-8 flex items-end space-x-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-3xl text-white font-bold shadow-lg">
                {user.name.charAt(0)}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-100 text-gray-500 hover:text-primary transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-2">
              <h3 className="text-2xl font-bold text-gray-800">{user.name}</h3>
              <p className="text-primary font-medium text-sm flex items-center gap-1">
                <Shield className="w-4 h-4" />
                {user.role || 'Student'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium">
                {user.name}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed">
                {user.email}
              </div>
              <p className="text-xs text-gray-400 mt-1">* Email address cannot be changed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
