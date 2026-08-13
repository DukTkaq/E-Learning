import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      let data = {};
      try {
        data = await response.json();
      } catch (err) {
        throw new Error('Server returned invalid data');
      }

      if (response.ok) {
        toast.success(data.message);
        setIsSent(true);
      } else {
        toast.error(data.message || 'Failed to send reset link');
      }
    } catch (error) {
      toast.error(error.message || 'Could not connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card-bg backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-100 transition-all">
      <div className="mb-8">
        <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Login
        </Link>
      </div>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
          Forgot Password
        </h2>
        <p className="text-gray-500 mt-3 text-sm">
          {!isSent 
            ? "Enter your email address and we'll send you a link to reset your password."
            : "We have sent a password reset link to your email."}
        </p>
      </div>

      {!isSent ? (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email" 
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 text-white font-semibold rounded-xl bg-gradient-to-r from-primary to-secondary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl text-sm text-gray-600 text-center leading-relaxed">
            Please check your inbox at <span className="font-semibold text-gray-800">{email}</span> and click the link to reset your password.
            <br/><br/>
            <span className="text-xs text-gray-400">(If you don't see it, check your Spam folder or wait a minute)</span>
          </div>
          <button 
            onClick={() => setIsSent(false)}
            className="w-full py-3 text-primary font-medium hover:bg-primary/5 rounded-xl transition-colors"
          >
            Try another email
          </button>
        </div>
      )}
    </div>
  );
}
