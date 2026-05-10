'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageCard } from '@/components/ui/message-card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { GoogleSignInButton } from '@/components/google-sign-in-button';
import { apiClient } from '@/lib/api-client';

function getRegistrationErrorMessage(err: any): string {
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

  return 'Registration failed. Please try again.';
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, googleLogin } = useAuth();
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
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = (formData.get('phone') as string) || undefined;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      await register(email, name, password, phone);
      await redirectByRole();
    } catch (err: any) {
      setError(getRegistrationErrorMessage(err));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async (credential: string) => {
    setError('');

    try {
      await googleLogin(credential);
      await redirectByRole();
    } catch (err: any) {
      setError(getRegistrationErrorMessage(err));
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 to-blue-50 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg dark:border dark:border-slate-800 dark:bg-slate-900">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-slate-100">Create Account</h1>
          <p className="mb-8 text-gray-600 dark:text-slate-400">Join Pithi Digital to send beautiful invitations</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <MessageCard text={error} tone="error" onClose={() => setError('')} className="p-4" />
            )}

            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>

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
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 555 123 4567"
                maxLength={15}
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
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">At least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
            <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">or</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
          </div>

          <GoogleSignInButton
            onCredential={handleGoogleRegister}
            disabled={isLoading}
            text="Continue with Google"
          />

          <div className="mt-6 border-t pt-6 dark:border-slate-700">
            <p className="text-center text-sm text-gray-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
