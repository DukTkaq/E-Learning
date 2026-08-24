import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Shield, Camera, Edit2, Save, X, Lock, Eye, EyeOff, Briefcase, Link as LinkIcon, AlignLeft, BookOpen, Award, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

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

  // Instructor Application State
  const [isApplyingInstructor, setIsApplyingInstructor] = useState(false)
  const [instructorForm, setInstructorForm] = useState({
    expertise: '',
    bio: '',
    portfolio_url: '',
    agreeTerms: false
  })
  const [applyLoading, setApplyLoading] = useState(false)

  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)

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
      
      // Fetch stats
      api.get('/auth/profile/stats')
        .then(res => setStats(res.data))
        .catch(err => console.error('Error fetching stats:', err))
        
    } catch {
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

      const response = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const data = response.data
      toast.success(data.message)
      const updatedUser = { ...user, ...data.user }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setIsEditing(false)
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (error) {
      if (error.response?.status !== 403) {
        toast.error(error.response?.data?.message || 'Failed to update profile')
      }
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
      const response = await api.put('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });

      const data = response.data;
      toast.success(data.message);
      setIsChangingPassword(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      if (error.response?.status !== 403) {
        toast.error(error.response?.data?.message || 'Failed to change password');
      }
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

  const handleApplyInstructor = async (e) => {
    e.preventDefault();
    if (!instructorForm.expertise || !instructorForm.bio) {
      toast.error('Expertise and Bio are required.');
      return;
    }
    if (!instructorForm.agreeTerms) {
      toast.error('You must agree to the terms to apply.');
      return;
    }

    setApplyLoading(true);
    try {
      const res = await api.post('/auth/apply-instructor', {
        expertise: instructorForm.expertise,
        bio: instructorForm.bio,
        portfolio_url: instructorForm.portfolio_url
      });
      toast.success(res.data.message);
      const updatedUser = { ...user, status: 'Pending' };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsApplyingInstructor(false);
      window.dispatchEvent(new Event('authChange'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply.');
    } finally {
      setApplyLoading(false);
    }
  }

  if (!user) return <div className="p-8 text-center text-gray-500">Loading profile...</div>

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
          <div className="absolute top-20 left-8 flex items-start space-x-4">
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
            <div className="pt-14">
              <h3 className="text-2xl font-bold text-gray-800 leading-tight">{user.name}</h3>
              <p className="text-primary font-medium text-sm flex items-center gap-1 mt-0.5">
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
                <Calendar className="w-4 h-4" />
                Joined Date
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium">
                {stats?.created_at ? new Date(stats.created_at).toLocaleDateString('en-US') : 'Loading...'}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed">
                {user.email}
              </div>
              <p className="text-xs text-gray-400 mt-1">* Email address cannot be changed</p>
            </div>

            {(!user.role || user.role === 'Student') && stats && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Enrolled Courses
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-primary font-bold">
                    {stats.enrolledCourses}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Certificates
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-amber-500 font-bold">
                    {stats.certificatesReceived}
                  </div>
                </div>
              </>
            )}

            {user.role === 'Instructor' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Expertise
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium">
                    {user.expertise || 'Not provided'}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Portfolio URL
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium truncate">
                    {user.portfolio_url ? (
                      <a href={user.portfolio_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{user.portfolio_url}</a>
                    ) : 'Not provided'}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <AlignLeft className="w-4 h-4" />
                    Bio / Introduction
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium whitespace-pre-wrap">
                    {user.bio || 'Not provided'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="px-8 pb-8 border-t border-gray-100 pt-8 flex gap-4">
          {!isChangingPassword ? (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 hover:border-primary/30 hover:bg-gray-100 rounded-xl transition-all font-medium"
            >
              <Lock className="w-4 h-4" />
              Change Password
            </button>
          ) : null}

          {(!user.role || user.role === 'Student') && (
            <button
              onClick={() => setIsApplyingInstructor(true)}
              disabled={user.status === 'Pending' || user.status === 'Rejected'}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="w-4 h-4" />
              {user.status === 'Pending' ? 'Application Pending Approval' : user.status === 'Rejected' ? 'Application Rejected' : 'Become an Instructor'}
            </button>
          )}
        </div>

        {isChangingPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white p-7 rounded-2xl border border-gray-200 shadow-2xl relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-primary" />
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
          </div>
        )}

        {isApplyingInstructor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-white p-7 rounded-2xl border border-gray-200 shadow-2xl relative my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  Become an Instructor
                </h3>
                <button 
                  onClick={() => setIsApplyingInstructor(false)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleApplyInstructor} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">Expertise Field <span className="text-error">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT, Languages, Business..."
                    value={instructorForm.expertise}
                    onChange={(e) => setInstructorForm({...instructorForm, expertise: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">Bio / Teaching Experience <span className="text-error">*</span></label>
                  <textarea
                    required
                    rows="4"
                    placeholder="Tell us about your teaching experience and why you want to become an instructor..."
                    value={instructorForm.bio}
                    onChange={(e) => setInstructorForm({...instructorForm, bio: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all resize-none"
                  ></textarea>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">CV / LinkedIn URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={instructorForm.portfolio_url}
                    onChange={(e) => setInstructorForm({...instructorForm, portfolio_url: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl outline-none transition-all"
                  />
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={instructorForm.agreeTerms}
                    onChange={(e) => setInstructorForm({...instructorForm, agreeTerms: e.target.checked})}
                    className="mt-1 w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor="agreeTerms" className="text-sm text-gray-600 cursor-pointer">
                    I agree to the Instructor Terms and Conditions, and confirm that the information provided is accurate.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={applyLoading || !instructorForm.agreeTerms}
                  className="w-full py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 mt-4"
                >
                  {applyLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
