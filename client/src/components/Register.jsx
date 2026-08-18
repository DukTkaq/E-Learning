import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [errorField, setErrorField] = useState(null)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errorField === e.target.name) {
      setErrorField(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorField(null)

    // Top-down validation
    if (formData.name.trim().length < 2) {
      toast.error("Full Name must be at least 2 characters long!")
      setErrorField('name')
      setLoading(false)
      return
    }

    if (!formData.email.trim()) {
      toast.error("Email cannot be empty!")
      setErrorField('email')
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email format!")
      setErrorField('email')
      setLoading(false)
      return
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    if (!passwordRegex.test(formData.password)) {
      toast.error("Password must be at least 8 characters long and contain letters and numbers!")
      setErrorField('password')
      setLoading(false)
      return
    }

    try {
      const response = await api.post('/auth/register', formData)
      const data = response.data

      toast.success(data.message)
      setFormData({ name: '', email: '', password: '' })
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const data = err.response?.data || {}
      if (err.response?.status !== 403) {
        toast.error(data.message || 'An error occurred!')
      }
      if (data.message?.toLowerCase().includes('email')) setErrorField('email')
      if (data.message?.toLowerCase().includes('password')) setErrorField('password')
      if (data.message?.toLowerCase().includes('name')) setErrorField('name')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-card-bg backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-200 transition-all">
      <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
        Create Account
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name" 
            className={`w-full px-4 py-3 rounded-xl border bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 transition-all ${
              errorField === 'name' 
                ? 'border-error focus:border-error focus:ring-error/20 ring-error/20' 
                : 'border-gray-200 focus:border-primary focus:ring-primary/10'
            }`}
          />
        </div>
        <div>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address" 
            className={`w-full px-4 py-3 rounded-xl border bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 transition-all ${
              errorField === 'email' 
                ? 'border-error focus:border-error focus:ring-error/20 ring-error/20' 
                : 'border-gray-200 focus:border-primary focus:ring-primary/10'
            }`}
          />
        </div>
        <div>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password (min 8 chars, letters & numbers)" 
            className={`w-full px-4 py-3 rounded-xl border bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 transition-all ${
              errorField === 'password' 
                ? 'border-error focus:border-error focus:ring-error/20 ring-error/20' 
                : 'border-gray-200 focus:border-primary focus:ring-primary/10'
            }`}
          />
          {errorField === 'password' && (
            <p className="mt-1 text-sm text-error font-medium">Please enter a valid password format.</p>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 mt-4 text-white font-semibold rounded-xl bg-gradient-to-r from-primary to-secondary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Register'}
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <span className="text-gray-500">Already have an account? </span>
        <Link to="/login" className="font-semibold text-primary hover:text-primary-hover hover:underline transition-colors">
          Login here
        </Link>
      </div>
    </div>
  )
}
