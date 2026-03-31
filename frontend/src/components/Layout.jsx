import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = {
  doctor: [
    { path: '/doctor', label: 'Dashboard', icon: '⬡' },
    { path: '/doctor/patients', label: 'Patients', icon: '◈' },
    { path: '/doctor/prescriptions', label: 'Prescriptions', icon: '◉' },
    { path: '/doctor/reports', label: 'Reports', icon: '◪' },
    { path: '/doctor/verify', label: 'Verify', icon: '◈' },
  ],
  patient: [
    { path: '/patient', label: 'Dashboard', icon: '⬡' },
    { path: '/patient/prescriptions', label: 'Prescriptions', icon: '◉' },
    { path: '/patient/reports', label: 'Reports', icon: '◪' },
    { path: '/patient/verify', label: 'Verify', icon: '◈' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="font-bold text-lg tracking-tight">MedChain</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Blockchain Medical System</p>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 bg-teal-300 rounded-full" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span>→</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center justify-between">
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
            <div className="space-y-1">
              <span className="block w-5 h-0.5 bg-slate-600" />
              <span className="block w-5 h-0.5 bg-slate-600" />
              <span className="block w-5 h-0.5 bg-slate-600" />
            </div>
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500 bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-medium capitalize">
              {user?.role}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
