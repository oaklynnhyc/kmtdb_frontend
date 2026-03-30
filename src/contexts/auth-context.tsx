import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { checkAuthStatus, login as apiLogin, logout as apiLogout, AuthError } from '@/services/api';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    username: null,
    isLoading: true,
  });

  useEffect(() => {
    checkAuthStatus()
      .then(data => {
        setState({
          isAuthenticated: data.authenticated,
          username: data.username,
          isLoading: false,
        });
      })
      .catch(() => {
        setState({ isAuthenticated: false, username: null, isLoading: false });
      });
  }, []);

  const login = async (username: string, password: string) => {
    // ── 測試帳號（前端 only，不經過後端 API）──────────────
    // TODO: 接上正式後端後刪除此區塊
    if (username === 'test' && password === 'test') {
      setState({ isAuthenticated: true, username: 'test', isLoading: false });
      return;
    }
    // ── 測試帳號結束 ─────────────────────────────────────

    const data = await apiLogin(username, password);
    setState({
      isAuthenticated: true,
      username: data.username,
      isLoading: false,
    });
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // 即使 API 失敗，也要清除前端狀態
    }
    setState({ isAuthenticated: false, username: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
