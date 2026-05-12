'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CalendarDays, Eye, EyeOff, Home, Mail, Menu, Phone, Plus, Shield, Upload, User, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCard } from '@/components/ui/message-card';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { withProtectedRoute } from '@/lib/protected-route';
import { apiClient } from '@/lib/api-client';
import { DashboardLanguageThemeControls } from '@/components/dashboard-language-theme-controls';
import { DashboardSharedSidebar } from '@/components/dashboard-shared-sidebar';

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

type LiveStatusTone = 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';

type LiveStatusMeta = {
  label: string;
  tone: LiveStatusTone;
  isLive: boolean;
};

function getToneClasses(tone: LiveStatusTone): {
  ping: string;
  dot: string;
  text: string;
  glow: string;
  shield: string;
} {
  if (tone === 'emerald') {
    return {
      ping: 'bg-emerald-500/70',
      dot: 'bg-emerald-500',
      text: 'text-emerald-700',
      glow: 'shadow-[0_0_10px_rgba(16,185,129,0.8)]',
      shield: 'text-emerald-400/40',
    };
  }

  if (tone === 'blue') {
    return {
      ping: 'bg-blue-500/70',
      dot: 'bg-blue-500',
      text: 'text-blue-700',
      glow: 'shadow-[0_0_10px_rgba(59,130,246,0.8)]',
      shield: 'text-blue-400/40',
    };
  }

  if (tone === 'amber') {
    return {
      ping: 'bg-amber-500/70',
      dot: 'bg-amber-500',
      text: 'text-amber-700',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.75)]',
      shield: 'text-amber-400/40',
    };
  }

  if (tone === 'rose') {
    return {
      ping: 'bg-rose-500/70',
      dot: 'bg-rose-500',
      text: 'text-rose-700',
      glow: 'shadow-[0_0_10px_rgba(244,63,94,0.75)]',
      shield: 'text-rose-400/40',
    };
  }

  return {
    ping: 'bg-slate-400/65',
    dot: 'bg-slate-500',
    text: 'text-slate-700',
    glow: 'shadow-[0_0_10px_rgba(100,116,139,0.55)]',
    shield: 'text-slate-400/40',
  };
}

function resolveEmailStatus(user: Record<string, unknown> | null | undefined, isKhmer: boolean): LiveStatusMeta {
  if (!user) {
    return { label: isKhmer ? 'អសកម្ម' : 'Inactive', tone: 'slate', isLive: false };
  }

  const emailVerified = user.emailVerified ?? user.isEmailVerified ?? user.verifiedEmail;
  const accountStatus = user.status ?? user.accountStatus;

  if (emailVerified === false || accountStatus === 'PENDING') {
    return { label: isKhmer ? 'កំពុងរង់ចាំ' : 'Pending', tone: 'amber', isLive: true };
  }

  if (accountStatus === 'SUSPENDED' || accountStatus === 'INACTIVE' || accountStatus === 'DISABLED') {
    return { label: isKhmer ? 'អសកម្ម' : 'Inactive', tone: 'slate', isLive: false };
  }

  return { label: isKhmer ? 'សកម្ម' : 'Active', tone: 'emerald', isLive: true };
}

function resolveSecurityStatus(user: Record<string, unknown> | null | undefined, isKhmer: boolean): LiveStatusMeta {
  if (!user) {
    return { label: isKhmer ? 'អសកម្ម' : 'Inactive', tone: 'slate', isLive: false };
  }

  const isActive = user.isActive;
  const securityStatus = user.securityStatus;
  const accountLocked = user.accountLocked ?? user.isLocked;

  if (accountLocked === true || securityStatus === 'LOCKED') {
    return { label: isKhmer ? 'បានចាក់សោ' : 'Locked', tone: 'rose', isLive: false };
  }

  if (isActive === false || securityStatus === 'PENDING') {
    return { label: isKhmer ? 'កំពុងរង់ចាំ' : 'Pending', tone: 'amber', isLive: true };
  }

  if (securityStatus === 'INACTIVE') {
    return { label: isKhmer ? 'អសកម្ម' : 'Inactive', tone: 'slate', isLive: false };
  }

  return { label: isKhmer ? 'ការពារ' : 'Protected', tone: 'blue', isLive: true };
}

function DashboardProfilePage() {
  const { user, updateProfile, logout, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const isKhmer = language === 'km';

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
      setSuccess(isKhmer ? 'បានអាប់ដេតប្រវត្តិរូបដោយជោគជ័យ។' : 'Profile updated successfully.');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, isKhmer ? 'បរាជ័យក្នុងការអាប់ដេតប្រវត្តិរូប។' : 'Failed to update profile.'));
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
      setError(isKhmer ? 'ទម្រង់រូបភាពមិនត្រឹមត្រូវ។ សូមបញ្ចូល JPG, PNG, WEBP, ឬ GIF។' : 'Invalid image format. Please upload JPG, PNG, WEBP, or GIF.');
      e.target.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(isKhmer ? 'រូបភាពធំពេក។ ទំហំអតិបរមា 10MB។' : 'Image is too large. Maximum size is 10MB.');
      e.target.value = '';
      return;
    }

    setError('');
    setSuccess('');
    setIsUploadingLogo(true);

    try {
      const uploadedUrl = await apiClient.uploadFile(file);
      await updateProfile({ avatarUrl: uploadedUrl });
      setSuccess(isKhmer ? 'បានបញ្ចូលឡូហ្គោប្រវត្តិរូបដោយជោគជ័យ។' : 'Profile logo uploaded successfully.');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, isKhmer ? 'បរាជ័យក្នុងការបញ្ចូលឡូហ្គោប្រវត្តិរូប។' : 'Failed to upload profile logo.'));
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
      setPasswordError(isKhmer ? 'ពាក្យសម្ងាត់ថ្មី និងការបញ្ជាក់ពាក្យសម្ងាត់មិនដូចគ្នា។' : 'New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(isKhmer ? 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច 8 តួអក្សរ។' : 'New password must be at least 8 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await apiClient.changePassword(currentPassword, newPassword);
      setPasswordSuccess(response.message || (isKhmer ? 'បានប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ។' : 'Password changed successfully.'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      setPasswordError(getApiErrorMessage(err, isKhmer ? 'បរាជ័យក្នុងការប្តូរពាក្យសម្ងាត់។' : 'Failed to change password.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-rose-500" />
          <p className="mt-4 text-gray-600">{isKhmer ? 'កំពុងដំណើរការ...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const userRecord = (user ?? null) as unknown as Record<string, unknown> | null;
  const emailStatusMeta = resolveEmailStatus(userRecord, isKhmer);
  const securityStatusMeta = resolveSecurityStatus(userRecord, isKhmer);
  const emailTone = getToneClasses(emailStatusMeta.tone);
  const securityTone = getToneClasses(securityStatusMeta.tone);
  const roleLabel = (() => {
    const role = (user?.role || 'USER').toUpperCase();
    if (!isKhmer) return role.toLowerCase();
    if (role === 'ADMIN') return 'អ្នកគ្រប់គ្រង';
    if (role === 'CUSTOMER') return 'អតិថិជន';
    return 'អ្នកប្រើ';
  })();

  return (
    <div className="min-h-screen bg-gray-50 font-khmer-body flex flex-col dark:bg-slate-950 dark:text-slate-200">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-hidden="true" />
      )}

      {/* Mobile slide-in sidebar */}
      <div
        ref={mobileMenuRef}
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-72 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-slate-900 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-end px-4 pt-4 pb-2">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <DashboardSharedSidebar
            currentPath={pathname}
            onSignOut={handleSignOut}
            onLinkClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-70 shrink-0 border-r border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
          <div className="sticky top-0">
            <DashboardSharedSidebar
              currentPath={pathname}
              onSignOut={handleSignOut}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-gray-200 bg-white/95 backdrop-blur sticky top-0 z-30 dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
              {/* Hamburger – mobile only */}
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setIsMobileMenuOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="font-khmer-heading text-xl text-gray-900 dark:text-slate-100 sm:text-3xl truncate">{isKhmer ? 'ប្រវត្តិរូបរបស់អ្នក' : 'Your Profile'}</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400 font-khmer-body sm:text-sm">{isKhmer ? 'មើល និងកែប្រែព័ត៌មានគណនីរបស់អ្នក' : 'View and edit your account information'}</p>
              </div>

              <div className="flex items-center gap-2">
                <DashboardLanguageThemeControls />
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
                    <span className="hidden sm:inline">{isKhmer ? 'បង្កើតព្រឹត្តិការណ៍ថ្មី' : 'Create Event'}</span>
                  </Button>
                </Link>

              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6">
            <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-500">{isKhmer ? 'ប្រភេទគណនី' : 'Account Type'}</p>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                    <Users className="h-5 w-5" />
                  </span>
                </div>
                <p className="text-2xl font-semibold text-gray-900 capitalize dark:text-slate-100">{roleLabel}</p>
              </article>

              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-500">{isKhmer ? 'ស្ថានភាពអ៊ីមែល' : 'Email Status'}</p>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                    <CalendarDays className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative inline-flex h-3 w-3 items-center justify-center">
                    {emailStatusMeta.isLive && <span className={`absolute inline-flex h-3 w-3 animate-ping rounded-full ${emailTone.ping}`} />}
                    <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${emailTone.dot} ${emailTone.glow}`} />
                  </span>
                  <p className={`text-2xl font-semibold tracking-wide ${emailTone.text} [text-shadow:0_0_12px_rgba(15,23,42,0.14)]`}>
                    {emailStatusMeta.label}
                  </p>
                </div>
              </article>

              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-500">{isKhmer ? 'សុវត្ថិភាព' : 'Security'}</p>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                    <BarChart3 className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative inline-flex h-3 w-3 items-center justify-center">
                    {securityStatusMeta.isLive && <span className={`absolute inline-flex h-3 w-3 animate-ping rounded-full ${securityTone.ping}`} />}
                    <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${securityTone.dot} ${securityTone.glow}`} />
                  </span>
                  <div className="relative inline-flex items-center">
                    <Shield className={`pointer-events-none absolute -left-1 top-1/2 h-4 w-4 -translate-y-1/2 ${securityTone.shield} ${securityStatusMeta.isLive ? '[animation:spin_6s_linear_infinite]' : ''}`} />
                    <p className={`pl-3 text-2xl font-semibold tracking-wide ${securityTone.text} [text-shadow:0_0_12px_rgba(15,23,42,0.14)]`}>
                      {securityStatusMeta.label}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-gray-500">{isKhmer ? 'សមាជិក' : 'Member'}</p>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                    <Home className="h-5 w-5" />
                  </span>
                </div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{isKhmer ? 'ភិធី ឌីជីថល' : 'Pithi Digital'}</p>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-6">
              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <h2 className="mb-5 font-khmer-heading text-lg text-gray-900 dark:text-slate-100">{isKhmer ? 'ព័ត៌មានគណនី' : 'Account Information'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && <MessageCard text={error} tone="error" onClose={() => setError('')} />}
                  {success && <MessageCard text={success} tone="success" onClose={() => setSuccess('')} />}

                  <div>
                    <label htmlFor="profileLogo" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-100">
                      {isKhmer ? 'បញ្ចូលរូបភាពប្រវត្តិរូប' : 'Upload Image Logo (Profile)'}
                    </label>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                      <label htmlFor="profileLogo" className="group relative block cursor-pointer">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Profile logo" className="h-24 w-24 rounded-full object-cover ring-2 ring-white shadow-md" />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-100 text-xl font-semibold text-rose-700 ring-2 ring-white shadow-md">
                            {(user?.name || 'U').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition group-hover:opacity-100">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-gray-700">
                            <Upload className="h-3.5 w-3.5" />
                            {isUploadingLogo ? (isKhmer ? 'កំពុងបញ្ចូល...' : 'Uploading...') : (isKhmer ? 'ជ្រើសរើសរូបភាព' : 'Choose Image')}
                          </span>
                        </div>
                      </label>

                      <div className="flex w-full flex-col items-center gap-2 sm:items-start">
                        <label
                          htmlFor="profileLogo"
                          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:py-2"
                        >
                          <Upload className="h-4 w-4" />
                          {isUploadingLogo ? (isKhmer ? 'កំពុងបញ្ចូល...' : 'Uploading...') : (isKhmer ? 'ជ្រើសរើសរូបភាព' : 'Choose Image')}
                        </label>
                        <input
                          id="profileLogo"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={handleUploadLogo}
                          disabled={isUploadingLogo || isSaving}
                        />
                        <p className="text-xs text-gray-500">{isKhmer ? 'JPG, PNG, WEBP, GIF (អតិបរមា 10MB)' : 'JPG, PNG, WEBP, GIF (max 10MB)'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-100">
                      {isKhmer ? 'ឈ្មោះពេញ' : 'Full Name'}
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isSaving}
                        className="h-11 rounded-xl border-gray-300 bg-white pl-10 text-gray-900 placeholder:text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-100">
                      {isKhmer ? 'អាសយដ្ឋានអ៊ីមែល' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input id="email" value={user?.email || ''} readOnly disabled className="h-11 rounded-xl border-gray-300 bg-gray-100 pl-10 text-gray-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-100">
                      {isKhmer ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isSaving}
                        placeholder="+1 555 123 4567"
                        maxLength={15}
                        className="h-11 rounded-xl border-gray-300 bg-white pl-10 text-gray-900 placeholder:text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-100">
                      {isKhmer ? 'តួនាទី' : 'Role'}
                    </label>
                    <div className="relative">
                      <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input id="role" value={user?.role || ''} readOnly disabled className="h-11 rounded-xl border-gray-300 bg-gray-100 pl-10 text-gray-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400" />
                    </div>
                  </div>

                  <Button type="submit" disabled={isSaving} className="ml-auto flex w-full max-w-xs bg-rose-500 text-white hover:bg-rose-600">
                    {isSaving ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')}
                  </Button>
                </form>
              </article>

              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <h2 className="mb-5 font-khmer-heading text-lg text-gray-900 dark:text-slate-100">{isKhmer ? 'ប្តូរពាក្យសម្ងាត់' : 'Change Password'}</h2>

                <form onSubmit={handleChangePassword} className="space-y-6">
                  {passwordError && (
                    <MessageCard text={passwordError} tone="error" onClose={() => setPasswordError('')} />
                  )}
                  {passwordSuccess && (
                    <MessageCard text={passwordSuccess} tone="success" onClose={() => setPasswordSuccess('')} />
                  )}

                  <div>
                    <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-100">
                      {isKhmer ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current Password'}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        disabled={isChangingPassword}
                        className="h-11 flex-1 rounded-xl border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-500"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                        disabled={isChangingPassword}
                        className="h-11 w-11 shrink-0 rounded-xl border-gray-300 px-0"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-100">
                      {isKhmer ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password'}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={isChangingPassword}
                        className="h-11 flex-1 rounded-xl border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-500"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        disabled={isChangingPassword}
                        className="h-11 w-11 shrink-0 rounded-xl border-gray-300 px-0"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmNewPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-100">
                      {isKhmer ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm New Password'}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="confirmNewPassword"
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        disabled={isChangingPassword}
                        className="h-11 flex-1 rounded-xl border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-500"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                        aria-label={showConfirmNewPassword ? 'Hide confirm password' : 'Show confirm password'}
                        disabled={isChangingPassword}
                        className="h-11 w-11 shrink-0 rounded-xl border-gray-300 px-0"
                      >
                        {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" disabled={isChangingPassword} className="w-full bg-rose-500 text-white hover:bg-rose-600">
                    {isChangingPassword ? (isKhmer ? 'កំពុងប្តូរពាក្យសម្ងាត់...' : 'Changing password...') : (isKhmer ? 'ប្តូរពាក្យសម្ងាត់' : 'Change Password')}
                  </Button>
                </form>
              </article>
            </section>
          </main>
        </div>
      </div>

      <footer className="mt-auto border-t border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-sm text-gray-500 dark:text-slate-400 font-khmer-body sm:px-6 lg:px-8">
          <p>&copy; 2026 Pithi Digital. {isKhmer ? 'រក្សាសិទ្ធិគ្រប់យ៉ាង។' : 'All rights reserved.'}</p>
        </div>
      </footer>
    </div>
  );
}

export default withProtectedRoute(DashboardProfilePage);