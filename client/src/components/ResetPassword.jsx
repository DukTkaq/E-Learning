import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import api from '../utils/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token!');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.newPassword.trim() || !formData.confirmPassword.trim()) {
      toast.error('All password fields are required!');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { 
        token, 
        newPassword: formData.newPassword 
      });

      toast.success(response.data.message);
      setIsSuccess(true);
    } catch (error) {
      if (error.response?.status !== 403) {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  if (isSuccess) {
    return (
      <div className="w-full max-w-md bg-card-bg backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-100 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h2>
        <p className="text-gray-500 mb-8">Your account is secure. You can now log in with your new password.</p>
        <Link 
          to="/login"
          className="inline-block w-full py-3.5 text-white font-semibold rounded-xl bg-gradient-to-r from-primary to-secondary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-card-bg backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-100 transition-all">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
          Create New Password
        </h2>
        <p className="text-gray-500 mt-3 text-sm">
          Please enter your new password below to reset it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <div className="relative">
            <input 
              type={showPassword.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              placeholder="Min 8 chars, letters & numbers" 
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
            >
              {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
          <div className="relative">
            <input 
              type={showPassword.confirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Repeat your new password" 
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
            >
              {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3.5 mt-2 text-white font-semibold rounded-xl bg-gradient-to-r from-primary to-secondary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
