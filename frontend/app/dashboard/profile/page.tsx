'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, CalendarDays, Eye, EyeOff, Home, Menu, Plus, Upload, UserCircle, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { withProtectedRoute } from '@/lib/protected-route';
import { apiClient } from '@/lib/api-client';

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
  ) {
    const message = (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
    return Array.isArray(message) ? message.join(', ') : (message || fallback);
  }

  return fallback;
}

function DashboardProfilePage() {
  const { user, updateProfile, logout, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSignOut = () => {
    logout();
    router.replace('/login');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      await updateProfile({
        name,
        phone: phone || undefined,
      });
      setSuccess('Profile updated successfully.');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid image format. Please upload JPG, PNG, WEBP, or GIF.');
      e.target.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image is too large. Maximum size is 10MB.');
      e.target.value = '';
      return;
    }

    setError('');
    setSuccess('');
    setIsUploadingLogo(true);

    try {
      const uploadedUrl = await apiClient.uploadFile(file);
      await updateProfile({ avatarUrl: uploadedUrl });
      setSuccess('Profile logo uploaded successfully.');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to upload profile logo.'));
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await apiClient.changePassword(currentPassword, newPassword);
      setPasswordSuccess(response.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      setPasswordError(getApiErrorMessage(err, 'Failed to change password.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-rose-500" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const SidebarNavContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      <div className="p-6 border-b border-gray-100">
        <h2 className="font-khmer-heading text-xl text-gray-900">Pithi Digital</h2>
        <p className="mt-1 text-sm text-gray-500">Dashboard Menu</p>
      </div>
      <nav className="p-4 space-y-1">
        <Link href="/dashboard" onClick={onLinkClick} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
          <Home className="h-4 w-4" /> ទំព័រដើម
        </Link>
        <Link href="/events/create" onClick={onLinkClick} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
          <Plus className="h-4 w-4" /> បង្កើតព្រឹត្តិការណ៍ថ្មី
        </Link>
        <Link href="/dashboard/profile" onClick={onLinkClick} className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          <UserCircle className="h-4 w-4" /> Profile
        </Link>
      </nav>
      <div className="px-4 mt-2">
        <Button variant="outline" onClick={() => { handleSignOut(); onLinkClick?.(); }} className="w-full border-gray-200">
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-khmer-body flex flex-col">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-hidden="true" />
      )}

      {/* Mobile slide-in sidebar */}
      <div
        ref={mobileMenuRef}
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-end px-4 pt-4">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarNavContent onLinkClick={() => setIsMobileMenuOpen(false)} />
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-70 shrink-0 border-r border-gray-200 bg-white lg:block">
          <div className="sticky top-0">
            <SidebarNavContent />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-gray-200 bg-white/95 backdrop-blur sticky top-0 z-30">
            <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
              {/* Hamburger – mobile only */}
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setIsMobileMenuOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="font-khmer-heading text-xl text-gray-900 sm:text-3xl truncate">Your Profile</h1>
                <p className="mt-0.5 text-xs text-gray-500 font-khmer-body sm:text-sm">View and edit your account information</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User Avatar'}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700">
                      {(user?.name || 'U').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-700">{user?.name || 'User'}</span>
                </div>

                <Link href="/events/create">
                  <Button className="bg-rose-500 text-white hover:bg-rose-600 h-9 px-3 text-sm">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">បង្កើតព្រឹត្តិការណ៍ថ្មី</span>
                  </Button>
                </Link>

              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6">
            <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Account Type</p>
                  <Users className="h-5 w-5 text-rose-500" />
                </div>
                <p className="text-2xl font-semibold text-gray-900 capitalize">{(user?.role || 'User').toLowerCase()}</p>
              </article>

              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Email Status</p>
                  <CalendarDays className="h-5 w-5 text-rose-500" />
                </div>
                <p className="text-2xl font-semibold text-gray-900">Active</p>
              </article>

              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Security</p>
                  <BarChart3 className="h-5 w-5 text-rose-500" />
                </div>
                <p className="text-2xl font-semibold text-gray-900">Protected</p>
              </article>

              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Member</p>
                  <Home className="h-5 w-5 text-rose-500" />
                </div>
                <p className="text-2xl font-semibold text-gray-900">Pithi Digital</p>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-6">
              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-5 font-khmer-heading text-lg text-gray-900">Account Information</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                      {success}
                    </div>
                  )}

                  <div>
                    <label htmlFor="profileLogo" className="mb-2 block text-sm font-medium text-gray-700">
                      Upload Image Logo (Profile)
                    </label>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Profile logo" className="h-20 w-20 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-rose-100 text-lg font-semibold text-rose-700">
                          {(user?.name || 'U').slice(0, 1).toUpperCase()}
                        </div>
                      )}

                      <div className="flex w-full flex-col items-center gap-2 sm:items-start">
                        <label
                          htmlFor="profileLogo"
                          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:py-2"
                        >
                          <Upload className="h-4 w-4" />
                          {isUploadingLogo ? 'Uploading...' : 'Choose Image'}
                        </label>
                        <input
                          id="profileLogo"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleUploadLogo}
                          disabled={isUploadingLogo || isSaving}
                        />
                        <p className="text-xs text-gray-500">JPG, PNG, WEBP, GIF (max 10MB)</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <Input id="email" value={user?.email || ''} readOnly disabled />
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isSaving}
                      placeholder="+1 555 123 4567"
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <Input id="role" value={user?.role || ''} readOnly disabled />
                  </div>

                  <Button type="submit" disabled={isSaving} className="w-full bg-rose-500 text-white hover:bg-rose-600">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </article>

              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <h2 className="mb-5 font-khmer-heading text-lg text-gray-900">Change Password</h2>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  {passwordError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                      {passwordSuccess}
                    </div>
                  )}

                  <div>
                    <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        disabled={isChangingPassword}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                        disabled={isChangingPassword}
                        className="shrink-0 h-10 w-10 px-0"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={isChangingPassword}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        disabled={isChangingPassword}
                        className="shrink-0 h-10 w-10 px-0"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmNewPassword" className="mb-2 block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="confirmNewPassword"
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        disabled={isChangingPassword}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                        aria-label={showConfirmNewPassword ? 'Hide confirm password' : 'Show confirm password'}
                        disabled={isChangingPassword}
                        className="shrink-0 h-10 w-10 px-0"
                      >
                        {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" disabled={isChangingPassword} className="w-full bg-rose-500 text-white hover:bg-rose-600">
                    {isChangingPassword ? 'Changing password...' : 'Change Password'}
                  </Button>
                </form>
              </article>
            </section>
          </main>
        </div>
      </div>

      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-sm text-gray-500 font-khmer-body sm:px-6 lg:px-8">
          <p>&copy; 2026 Pithi Digital. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default withProtectedRoute(DashboardProfilePage);