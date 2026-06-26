'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, LogIn, Building2, User as UserIcon, ArrowRight } from 'lucide-react';
import { Card, CardBody, Button, Input, Alert, Badge } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { useAuth, portalHome } from '@/lib/auth-context';

const DEMO = {
  recruiter: { email: 'recruiter@jobmagic.dev', password: 'demo1234' },
  seeker: { email: 'sofia@jobmagic.dev', password: 'demo1234' },
} as const;

export function LoginForm() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, setPending] = React.useState<null | 'form' | 'recruiter' | 'seeker'>(null);

  // Already signed in → send to the right portal.
  React.useEffect(() => {
    if (!loading && user) router.replace(portalHome(user.role));
  }, [loading, user, router]);

  async function doLogin(em: string, pw: string, which: 'form' | 'recruiter' | 'seeker') {
    setPending(which);
    setError('');
    try {
      const u = await login(em, pw);
      router.replace(portalHome(u.role));
    } catch (err) {
      setError((err as Error).message);
      setPending(null);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex flex-col items-center text-center">
        <Link href="/" className="rounded-lg" aria-label="Jobmagic home">
          <Logo />
        </Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Sign in to your seeker or recruiter portal.
        </p>
      </div>

      <Card>
        <CardBody className="space-y-5">
          {/* One-click demo */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Try it instantly
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="secondary"
                onClick={() => doLogin(DEMO.recruiter.email, DEMO.recruiter.password, 'recruiter')}
                loading={pending === 'recruiter'}
                disabled={pending !== null}
                leftIcon={<Building2 className="h-4 w-4" />}
              >
                Recruiter demo
              </Button>
              <Button
                variant="secondary"
                onClick={() => doLogin(DEMO.seeker.email, DEMO.seeker.password, 'seeker')}
                loading={pending === 'seeker'}
                disabled={pending !== null}
                leftIcon={<UserIcon className="h-4 w-4" />}
              >
                Job seeker demo
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-ink-faint">or sign in</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Credentials form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doLogin(email, password, 'form');
            }}
            className="space-y-4"
            aria-busy={pending === 'form'}
          >
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="••••••••"
            />

            {error && (
              <Alert tone="error" title="Couldn't sign you in">
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={pending === 'form'}
              disabled={pending !== null || !email || !password}
              leftIcon={<LogIn className="h-4 w-4" />}
            >
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-ink-faint">
            New here?{' '}
            <Link href="/" className="font-medium text-brand-700 hover:text-brand-800">
              Back to home
            </Link>
          </p>
        </CardBody>
      </Card>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-faint">
        <Badge tone="amber" size="sm">
          Demo auth
        </Badge>
        <span>Tokens are stored in your browser. Don&apos;t use real passwords.</span>
      </div>
    </div>
  );
}
