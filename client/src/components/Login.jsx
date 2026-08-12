import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [errorField, setErrorField] = useState(null)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    // Clear error when typing
    if (errorField === e.target.name) {
      setErrorField(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorField(null)

    // Top-down validation
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

    if (!formData.password) {
      toast.error("Password cannot be empty!")
      setErrorField('password')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        // Redirect to dashboard
        navigate('/dashboard')
      } else {
        toast.error(data.message || 'Login failed!')
        // Highlight specific fields based on generic backend errors if possible
        if (data.message.toLowerCase().includes('email')) setErrorField('email')
        if (data.message.toLowerCase().includes('password')) setErrorField('password')
      }
    } catch (err) {
      toast.error('Could not connect to the server!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-card-bg backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-200 transition-all">
      <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
        Welcome Back
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            placeholder="Password" 
            className={`w-full px-4 py-3 rounded-xl border bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 transition-all ${
              errorField === 'password' 
                ? 'border-error focus:border-error focus:ring-error/20 ring-error/20' 
                : 'border-gray-200 focus:border-primary focus:ring-primary/10'
            }`}
          />
          {errorField === 'password' && (
            <p className="mt-1 text-sm text-error font-medium">Please enter a valid password.</p>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 mt-4 text-white font-semibold rounded-xl bg-gradient-to-r from-primary to-secondary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Login'}
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <span className="text-gray-500">Don't have an account? </span>
        <Link to="/register" className="font-semibold text-primary hover:text-primary-hover hover:underline transition-colors">
          Register here
        </Link>
      </div>
    </div>
  )
}
