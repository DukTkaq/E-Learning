import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, Home, LogOut, Menu, MessageSquare, X, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { label: 'Course Management', path: '/instructor/courses', icon: BookOpen },
  { label: 'Vouchers', path: '/instructor/vouchers', icon: Ticket },
  { label: 'Revenue', path: '/instructor/revenue', icon: BarChart3 },
  { label: 'Reviews', path: '/instructor/reviews', icon: MessageSquare },
];

export default function InstructorLayout({ children }) {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-inter">
      <aside className={`${expanded ? 'w-64' : 'w-20'} z-20 flex shrink-0 flex-col bg-slate-900 text-white shadow-xl transition-all duration-300`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          {expanded && (
            <Link to="/instructor/courses" className="truncate bg-gradient-to-r from-primary to-secondary bg-clip-text text-xl font-bold text-transparent">
              Instructor Portal
            </Link>
          )}
          <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white" aria-label="Toggle sidebar">
            {expanded ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <Link to="/instructor/courses" className="group flex items-center gap-3 rounded-xl px-3 py-3 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
            <Home size={20} />
            {expanded && <span className="font-medium">Home</span>}
          </Link>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} title={expanded ? '' : item.label} className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${active ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <Icon size={20} />
                {expanded && <span className="whitespace-nowrap font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          {expanded && (
            <div className="mb-3 px-3">
              <p className="truncate text-sm font-semibold">{user.name || 'Instructor'}</p>
              <p className="text-xs text-slate-400">Instructor</p>
            </div>
          )}
          <button type="button" onClick={logout} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-error transition-colors hover:bg-error/10 ${expanded ? '' : 'justify-center'}`}>
            <LogOut size={20} />
            {expanded && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">E-Learning</p>
            <p className="text-sm text-gray-500">Build, publish and grow your courses</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-bold text-white">
            {(user.name || 'I').charAt(0).toUpperCase()}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
