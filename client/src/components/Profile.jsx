import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Shield, Camera, Edit2, Save, X, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  // Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false
  })
  const [passwordLoading, setPasswordLoading] = useState(false)

  const fileInputRef = useRef(null)
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

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2MB limit')
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', editName)
      if (selectedFile) {
        formData.append('avatar', selectedFile)
      }

      const response = await fetch('http://localhost:3000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      let data = {}
      try {
        data = await response.json()
      } catch (e) {
        throw new Error('Server returned invalid data (possibly 404/500 HTML)')
      }

      if (response.ok) {
        toast.success(data.message)
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        setIsEditing(false)
        setSelectedFile(null)
        setPreviewUrl(null)
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      toast.error(error.message || 'Could not connect to the server')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword.trim() || !passwordForm.newPassword.trim() || !passwordForm.confirmPassword.trim()) {
      toast.error('All password fields are required!');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Server returned invalid data (possibly 404/500 HTML)');
      }

      if (response.ok) {
        toast.success(data.message);
        setIsChangingPassword(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      toast.error(error.message || 'Could not connect to the server');
    } finally {
      setPasswordLoading(false);
    }
  }

  if (!user) return null

  const getAvatarContent = () => {
    if (previewUrl) {
      return <img src={previewUrl} alt="Avatar Preview" className="w-full h-full rounded-full object-cover" />
    }
    if (user.avatar_url) {
      return <img src={`http://localhost:3000${user.avatar_url}`} alt="Avatar" className="w-full h-full rounded-full object-cover" />
    }
    return user.name.charAt(0).toUpperCase()
  }

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
                setSelectedFile(null)
                setPreviewUrl(null)
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
                {getAvatarContent()}
              </div>
              {isEditing && (
                <>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-100 text-primary hover:bg-gray-50 transition-colors" 
                    title="Upload avatar"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </>
              )}
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

        {/* Change Password Section */}
        <div className="px-8 pb-8 border-t border-gray-100 pt-8">
          {!isChangingPassword ? (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 hover:border-primary/30 hover:bg-gray-100 rounded-xl transition-all font-medium"
            >
              <Lock className="w-4 h-4" />
              Change Password
            </button>
          ) : (
            <div className="max-w-md bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Change Password
                </h3>
                <button 
                  onClick={() => setIsChangingPassword(false)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
                {/* Old Password */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword.old ? "text" : "password"}
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({...showPassword, old: !showPassword.old})}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                    >
                      {showPassword.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                    >
                      {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">At least 8 characters, letters and numbers.</p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                    >
                      {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 mt-2"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
