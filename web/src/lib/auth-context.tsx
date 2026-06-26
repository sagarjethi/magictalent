'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Building2 } from 'lucide-react';
import { Spinner, Button } from '@/components/ui';
import type { User, UserRole, AuthResult } from '@/lib/domain/types';
import { apiGet, apiPost, TOKEN_KEY, USER_KEY } from '@/lib/api-client';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthState | null>(null);

function persist(token: string, user: User) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearPersisted() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

/** Portal home for a role. */
export function portalHome(role: UserRole): string {
  return role === 'recruiter' ? '/recruiter' : '/seeker';
}

/**
 * AuthProvider — owns the client auth session. On mount it hydrates the user from
 * a stored bearer token via GET /api/auth/me, clearing the token if it's rejected.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    let cancelled = false;
    (async () => {
      try {
        const { user: me } = await apiGet<{ user: User }>('/api/auth/me');
        if (cancelled) return;
        setUser(me);
        window.localStorage.setItem(USER_KEY, JSON.stringify(me));
      } catch {
        // token invalid/expired → drop the session
        if (cancelled) return;
        clearPersisted();
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await apiPost<AuthResult>('/api/auth/login', { email, password });
    persist(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = React.useCallback(
    async (name: string, email: string, password: string, role: UserRole) => {
      const res = await apiPost<AuthResult>('/api/auth/register', { name, email, password, role });
      persist(res.token, res.user);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const logout = React.useCallback(() => {
    clearPersisted();
    setToken(null);
    setUser(null);
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}

/** Full-screen centered loading state while auth resolves. */
function AuthLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink-faint">
      <Spinner size={28} label="Checking your session" />
      <p className="text-sm">Checking your session…</p>
    </div>
  );
}

/**
 * AuthGate — guards a portal. While loading shows a spinner; unauthenticated users
 * are redirected to /login; users in the wrong portal are bounced to their own.
 */
export function AuthGate({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== role) {
      router.replace(portalHome(user.role));
    }
  }, [loading, user, role, router]);

  if (loading) return <AuthLoading />;
  if (!user || user.role !== role) return <AuthLoading />; // redirect in flight

  return <>{children}</>;
}

/**
 * UserMenu — the signed-in identity + logout, rendered in the AppShell top bar
 * via its `actions` slot. Must be inside an <AuthProvider>.
 */
export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const RoleIcon = user.role === 'recruiter' ? Building2 : UserIcon;

  function onLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden min-w-0 flex-col items-end leading-tight sm:flex">
        <span className="max-w-[12rem] truncate text-sm font-medium text-ink">{user.name}</span>
        <span className="inline-flex items-center gap-1 text-xs capitalize text-ink-faint">
          <RoleIcon className="h-3 w-3" aria-hidden="true" />
          {user.role}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLogout}
        leftIcon={<LogOut className="h-4 w-4" />}
        aria-label="Log out"
      >
        <span className="hidden sm:inline">Log out</span>
      </Button>
    </div>
  );
}
