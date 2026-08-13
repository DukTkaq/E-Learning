import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, Settings, BookOpen } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Read auth state from localStorage
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  const isLoggedIn = !!token && !!userData;
  
  let user = null;
  if (isLoggedIn) {
    try {
      user = JSON.parse(userData);
    } catch (e) {
      console.error('Failed to parse user data');
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsDropdownOpen(false);
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <BookOpen className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              E-Learning
            </span>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm"
                placeholder="Search courses..."
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Cart Icon */}
            <button className="relative p-2 text-gray-600 hover:text-primary transition-colors rounded-full hover:bg-gray-100">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-error rounded-full">
                2
              </span>
            </button>

            {/* User Menu */}
            {isLoggedIn ? (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-3 pr-1 rounded-full border border-gray-200 hover:border-primary/30 hover:bg-gray-50 transition-all focus:outline-none"
                >
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-secondary to-primary flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0)}
                  </div>
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden origin-top-right transform transition-all">
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                      <Settings className="w-4 h-4" />
                      My Profile
                    </Link>
                    <Link to="/my-courses" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                      <BookOpen className="w-4 h-4" />
                      My Courses
                    </Link>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                  Login
                </Link>
                <Link to="/register" className="text-sm font-medium text-white bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg shadow-sm shadow-primary/30 transition-all hover:-translate-y-0.5">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
