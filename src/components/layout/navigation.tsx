import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Database, History, BookOpen, Bot, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface NavLink {
  path: string;
  label: string;
  icon: typeof Home;
  matchPrefix?: string;
}

const NAV_LINKS: NavLink[] = [
  { path: '/', label: '首頁', icon: Home },
  { path: '/history', label: '組織沿革', icon: History },
  { path: '/editorial', label: '凡例', icon: BookOpen },
  { path: '/registry', label: '職名錄檢索', icon: Database, matchPrefix: '/roster/' },
  { path: '/chat', label: '研究助理', icon: Bot },
];

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 切換頁面時自動關閉行動選單
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string, matchPrefix?: string) =>
    location.pathname === path || (matchPrefix && location.pathname.startsWith(matchPrefix));

  const handleLogout = async () => {
    setMobileOpen(false);
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
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo / Title */}
          <div className="flex items-center min-w-0">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group min-w-0">
              <div className="relative flex-shrink-0">
                <Database className="w-6 h-6 sm:w-7 sm:h-7 text-[#d4af37] group-hover:text-[#e0bb44] transition-colors relative z-10" />
                <div className="absolute inset-0 bg-[#d4af37] blur-md opacity-0 group-hover:opacity-40 transition-opacity"></div>
              </div>
              <span className="text-sm sm:text-lg font-medium tracking-wide text-[#d4af37] group-hover:text-[#e0bb44] transition-colors truncate">
                中國國民黨職名錄檢索系統
              </span>
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {NAV_LINKS.map(({ path, label, icon: Icon, matchPrefix }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-1.5 lg:space-x-2 px-3 lg:px-4 py-2 rounded transition-all relative overflow-hidden group text-sm ${
                  isActive(path, matchPrefix)
                    ? 'bg-white/15 backdrop-blur-sm'
                    : 'hover:bg-white/10'
                }`}
              >
                {isActive(path, matchPrefix) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{label}</span>
              </Link>
            ))}

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

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
            aria-label={mobileOpen ? '關閉選單' : '開啟選單'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden border-t border-white/10"
          style={{
            background: 'linear-gradient(135deg, rgba(44,62,80,0.99) 0%, rgba(52,73,94,0.99) 40%, rgba(44,62,80,0.99) 70%, rgba(52,73,94,0.99) 100%)',
          }}
        >
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(({ path, label, icon: Icon, matchPrefix }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(path, matchPrefix)
                    ? 'bg-white/15 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
                {isActive(path, matchPrefix) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div>
                )}
              </Link>
            ))}
            <div className="my-2 h-px bg-white/10" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">登出</span>
            </button>
          </div>
        </div>
      )}

      <div className="bottom-ink-wash"></div>
    </nav>
  );
}
