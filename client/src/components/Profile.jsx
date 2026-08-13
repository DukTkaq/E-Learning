import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Shield, Camera, Edit2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      toast.error('Please login first')
      navigate('/login')
      return
    }
    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setEditName(parsedUser.name)
    } catch (e) {
      navigate('/login')
    }
  }, [navigate])

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:3000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: editName })
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(data.message)
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        setIsEditing(false)
        // Force Navbar to update by reloading or triggering state if possible. 
        // A simple reload is used here for brevity, or we can just rely on the next navigation.
        // window.location.reload()
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Could not connect to the server')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
          My Profile
        </h2>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-colors font-medium"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setIsEditing(false)
                setEditName(user.name)
              }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors font-medium disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button 
              onClick={handleUpdateProfile}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-hover rounded-xl transition-colors font-medium disabled:opacity-50 shadow-sm shadow-primary/30"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-primary/80 to-secondary/80 w-full relative">
          <div className="absolute -bottom-12 left-8 flex items-end space-x-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-3xl text-white font-bold shadow-lg transition-all">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-100 text-gray-500 hover:text-primary transition-colors cursor-not-allowed" title="Upload avatar (Coming soon)">
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
              {isEditing ? (
                <input 
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-primary focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-gray-800 font-medium outline-none transition-all"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium">
                  {user.name}
                </div>
              )}
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
