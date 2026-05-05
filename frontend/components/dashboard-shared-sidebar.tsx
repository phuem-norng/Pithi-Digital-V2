'use client';

import Link from 'next/link';
import { Home, Plus, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Assets } from '@/lib/assets';
import { useLanguage } from '@/lib/language-context';

interface DashboardSharedSidebarProps {
  currentPath: string;
  onSignOut: () => void;
  onLinkClick?: () => void;
}

export function DashboardSharedSidebar({ currentPath, onSignOut, onLinkClick }: DashboardSharedSidebarProps) {
  const { language } = useLanguage();
  const isKhmer = language === 'km';

  const getNavClass = (isActive: boolean) =>
    `flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${isActive
      ? 'border-rose-100 bg-rose-50 font-semibold text-rose-700 shadow-[inset_3px_0_0_0_#f43f5e] dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200'
      : 'border-transparent text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800'
    }`;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-100 px-3 py-4 dark:border-slate-800">
        <div className="flex items-center justify-start">
          <img
            src={Assets.logo}
            alt="Pithi Digital Logo"
            className="h-[72px] w-auto max-w-[250px] object-contain"
          />
        </div>
        <p className="mt-3 text-sm font-medium text-gray-500 dark:text-slate-400">{isKhmer ? 'ម៉ឺនុយផ្ទាំងគ្រប់គ្រង' : 'Dashboard Menu'}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link href="/dashboard" onClick={onLinkClick} className={getNavClass(currentPath === '/dashboard')}>
          <Home className="h-4 w-4" /> {isKhmer ? 'ទំព័រដើម' : 'Home'}
        </Link>
        <Link href="/events/create" onClick={onLinkClick} className={getNavClass(currentPath === '/events/create')}>
          <Plus className="h-4 w-4" /> {isKhmer ? 'បង្កើតព្រឹត្តិការណ៍ថ្មី' : 'Create Event'}
        </Link>
        <Link href="/dashboard/profile" onClick={onLinkClick} className={getNavClass(currentPath === '/dashboard/profile')}>
          <UserCircle className="h-4 w-4" /> {isKhmer ? 'ប្រវត្តិរូប' : 'Profile'}
        </Link>
        <Link
          href="/"
          onClick={onLinkClick}
          className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Home className="h-4 w-4" /> {isKhmer ? 'គេហទំព័រ' : 'Website'}
        </Link>
      </nav>

      <div className="mt-auto px-4 pb-4">
        <Button variant="outline" onClick={() => { onSignOut(); onLinkClick?.(); }} className="w-full border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
          {isKhmer ? 'ចាកចេញ' : 'Sign Out'}
        </Button>
      </div>
    </div>
  );
}
