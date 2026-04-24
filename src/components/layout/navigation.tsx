import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Database, History, BookOpen, Bot, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 text-white shadow-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(44,62,80,0.96) 0%, rgba(52,73,94,0.96) 40%, rgba(44,62,80,0.96) 70%, rgba(52,73,94,0.96) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        boxShadow: '0 4px 24px rgba(44,62,80,0.25), 0 1px 0 rgba(212,175,55,0.12)',
      }}
    >
      <div className="top-ink-wash"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Database className="w-7 h-7 text-[#d4af37] group-hover:text-[#e0bb44] transition-colors relative z-10" />
                <div className="absolute inset-0 bg-[#d4af37] blur-md opacity-0 group-hover:opacity-40 transition-opacity"></div>
              </div>
              <span className="text-lg font-medium tracking-wide text-[#d4af37] group-hover:text-[#e0bb44] transition-colors">
                國民黨職名錄數位加值系統
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded transition-all relative overflow-hidden group ${
                isActive('/')
                  ? 'bg-white/15 backdrop-blur-sm'
                  : 'hover:bg-white/10'
              }`}
            >
              {isActive('/') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>
              )}
              <Home className="w-4 h-4 relative z-10" />
              <span className="relative z-10">首頁</span>
            </Link>
            <Link
              to="/history"
              className={`flex items-center space-x-2 px-4 py-2 rounded transition-all relative overflow-hidden group ${
                isActive('/history')
                  ? 'bg-white/15 backdrop-blur-sm'
                  : 'hover:bg-white/10'
              }`}
            >
              {isActive('/history') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>
              )}
              <History className="w-4 h-4 relative z-10" />
              <span className="relative z-10">組織沿革</span>
            </Link>
            <Link
              to="/editorial"
              className={`flex items-center space-x-2 px-4 py-2 rounded transition-all relative overflow-hidden group ${
                isActive('/editorial')
                  ? 'bg-white/15 backdrop-blur-sm'
                  : 'hover:bg-white/10'
              }`}
            >
              {isActive('/editorial') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>
              )}
              <BookOpen className="w-4 h-4 relative z-10" />
              <span className="relative z-10">凡例</span>
            </Link>
            <Link
              to="/registry"
              className={`flex items-center space-x-2 px-4 py-2 rounded transition-all relative overflow-hidden group ${
                isActive('/registry') || location.pathname.startsWith('/roster/')
                  ? 'bg-white/15 backdrop-blur-sm'
                  : 'hover:bg-white/10'
              }`}
            >
              {(isActive('/registry') || location.pathname.startsWith('/roster/')) && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>
              )}
              <Database className="w-4 h-4 relative z-10" />
              <span className="relative z-10">名冊檢索</span>
            </Link>
            <Link
              to="/chat"
              className={`flex items-center space-x-2 px-4 py-2 rounded transition-all relative overflow-hidden group ${
                isActive('/chat')
                  ? 'bg-white/15 backdrop-blur-sm'
                  : 'hover:bg-white/10'
              }`}
            >
              {isActive('/chat') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>
              )}
              <Bot className="w-4 h-4 relative z-10" />
              <span className="relative z-10">研究助理</span>
            </Link>

            {/* Separator */}
            <div className="w-px h-6 bg-white/20 mx-1"></div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-white/10 transition-all text-gray-300 hover:text-white"
              title="登出"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">登出</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bottom-ink-wash"></div>
    </nav>
  );
}
