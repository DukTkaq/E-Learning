import { useState } from 'react'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    // Basic frontend validation
    if (formData.name.trim().length < 2) {
      setError("Full Name must be at least 2 characters long!")
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Invalid email format!")
      setLoading(false)
      return
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 8 characters long and contain letters and numbers!")
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setFormData({ name: '', email: '', password: '' })
      } else {
        setError(data.message || 'An error occurred!')
      }
    } catch (err) {
      setError('Could not connect to the server!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-card-bg backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-200 transition-all">
      <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
        Create Account
      </h2>

      {/* Toast Messages inline for simplicity, can be absolute positioned later */}
      {error && (
        <div className="mb-4 p-3 bg-error-bg border-l-4 border-error text-error font-semibold rounded-md shadow-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-success-bg border-l-4 border-success text-success font-semibold rounded-md shadow-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name" 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
        <div>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address" 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
        <div>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password (min 8 chars, letters & numbers)" 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/90 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          />
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
        <a href="#" className="font-semibold text-primary hover:text-primary-hover hover:underline transition-colors">
          Login here
        </a>
      </div>
    </div>
  )
}
