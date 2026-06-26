import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <AuthProvider>
      <main id="main" className="flex min-h-screen items-center justify-center bg-mesh px-4 py-12">
        <div className="absolute inset-0 bg-grid opacity-50" aria-hidden="true" />
        <div className="relative">
          <LoginForm />
        </div>
      </main>
    </AuthProvider>
  );
}
