import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('請輸入帳號和密碼');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message === '未登入或權限不足' ? '帳號或密碼錯誤' : '登入失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen ink-wash-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="paper-card rounded-lg seal-corner p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#e8d4a0] to-[#d4af37] mb-4">
              <Database className="w-8 h-8 text-[#2c3e50]" />
            </div>
            <h1 className="text-2xl font-medium ink-text">
              國民黨職名錄數位加值系統
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              請登入以使用系統功能
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium ink-text mb-2">帳號</label>
              <Input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="請輸入帳號"
                className="paper-input"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium ink-text mb-2">密碼</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="paper-input"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full ink-button px-6 py-3 rounded flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? '登入中...' : '登入'}</span>
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            國立政治大學圖書館 &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
