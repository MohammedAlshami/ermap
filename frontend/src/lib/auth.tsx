import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AUTH_TOKEN_KEY = 'ermap_auth_token';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null
  );
  const [loading, setLoading] = useState(!!token);

  const login = useCallback((u: AuthUser, t: string) => {
    setUser(u);
    setToken(t);
    if (typeof window !== 'undefined') localStorage.setItem(AUTH_TOKEN_KEY, t);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') localStorage.removeItem(AUTH_TOKEN_KEY);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (cancelled) return;
        if (r.ok) return r.json();
        if (r.status === 401) logout();
        return null;
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.user) setUser(data.user);
        else if (token) setUser(null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const getAuthHeaders = useCallback(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
