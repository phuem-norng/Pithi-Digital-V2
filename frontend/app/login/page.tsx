'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageCard } from '@/components/ui/message-card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { GoogleSignInButton } from '@/components/google-sign-in-button';

function getLoginErrorMessage(err: any): string {
  const responseMessage = err?.response?.data?.message;

  if (Array.isArray(responseMessage) && responseMessage.length > 0) {
    return responseMessage.join(', ');
  }

  if (typeof responseMessage === 'string' && responseMessage.trim().length > 0) {
    return responseMessage;
  }

  if (err?.message === 'Network Error') {
    return 'Cannot reach server. Please make sure backend is running on port 3001.';
  }

  return 'Login failed. Please try again.';
}

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectByRole = async () => {
    const currentUser = await apiClient.getCurrentUser();

    if (currentUser.role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
      await redirectByRole();
    } catch (err: any) {
      setError(getLoginErrorMessage(err));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credential: string) => {
    setError('');

    try {
      await googleLogin(credential);
      await redirectByRole();
    } catch (err: any) {
      setError(getLoginErrorMessage(err));
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 to-blue-50 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg dark:border dark:border-slate-800 dark:bg-slate-900">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-slate-100">Pithi Digital</h1>
          <p className="mb-8 text-gray-600 dark:text-slate-400">Send beautiful digital invitations</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <MessageCard text={error} tone="error" onClose={() => setError('')} className="p-4" />
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
            <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">or</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
          </div>

          <GoogleSignInButton
            onCredential={handleGoogleLogin}
            disabled={isLoading}
            text="Sign in with Google"
          />

          <div className="mt-6 border-t pt-6 dark:border-slate-700">
            <p className="text-center text-sm text-gray-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-300">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
