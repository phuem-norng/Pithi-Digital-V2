'use client';

import { useMemo, useState, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Cog,
  LayoutDashboard,
  Music,
  PlusSquare,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export type AdminMenuKey =
  | 'dashboard'
  | 'create-event'
  | 'all-guests'
  | 'users'
  | 'music'
  | 'analytics'
  | 'settings'
  | 'profile';

interface RecentEventItem {
  id: string;
  name: string;
}

interface AdminSidebarProps {
  userName: string;
  role: string;
  avatarUrl?: string;
  activeItem: AdminMenuKey;
  onSelect: (item: AdminMenuKey) => void;
  recentEvents: RecentEventItem[];
}

type SidebarItem = {
  key: AdminMenuKey;
  label: string;
  icon: ComponentType<{ className?: string }>;
  subItems?: string[];
};

const sidebarItems: SidebarItem[] = [
  {
    key: 'dashboard',
    label: 'ផ្ទាំងគ្រប់គ្រង',
    icon: LayoutDashboard,
    subItems: ['កម្មវិធីរបស់ខ្ញុំ', 'ចំណូលសរុប', 'របាយការណ៍'],
  },
  {
    key: 'create-event',
    label: 'បង្កើតកម្មវិធី',
    icon: PlusSquare,
    subItems: ['មង្គលការ', 'បុណ្យទូទៅ', 'ខួបកំណើត', 'ឡើងផ្ទះ', 'បុណ្យសព'],
  },
  { key: 'all-guests', label: 'បញ្ជីភ្ញៀវ', icon: Users },
  { key: 'users', label: 'Users (Create User)', icon: CircleUserRound },
  { key: 'music', label: 'តន្ត្រី (Music Library)', icon: Music },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'ការកំណត់', icon: Settings },
  { key: 'profile', label: 'Profile', icon: Cog },
];

export function AdminSidebar({ userName, role, avatarUrl, activeItem, onSelect, recentEvents }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<AdminMenuKey | null>(null);
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({
    dashboard: true,
    'create-event': true,
  });

  const initials = useMemo(() => {
    if (!userName) {
      return 'AD';
    }

    return userName
      .split(' ')
      .map((part) => part[0]?.toUpperCase())
      .slice(0, 2)
      .join('');
  }, [userName]);

  const toggleOpen = (key: string) => {
    setOpenKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 100 : 340 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="relative m-4 flex h-[calc(100vh-2rem)] flex-col rounded-[2rem] bg-white p-4 font-khmer-body shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:bg-slate-900 dark:shadow-[0_20px_50px_rgba(2,6,23,0.45)]"
    >
      <div className="mb-4 flex items-center justify-between">
        {!collapsed && <p className="font-khmer-heading text-lg text-gray-900 dark:text-slate-100">Pithi Admin</p>}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-full border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle Sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="mb-4">
        {collapsed ? (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800">
            <Search className="h-4 w-4 text-gray-500 dark:text-slate-400" />
          </div>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
            <Input placeholder="ស្វែងរក..." className="h-10 rounded-xl border-gray-200 pl-9" />
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const active = activeItem === item.key;
          const isOpen = openKeys[item.key];
          const shouldShowHoverMenu = collapsed && hoveredKey === item.key && item.subItems?.length;

          return (
            <div
              key={item.key}
              className="relative"
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey((prev) => (prev === item.key ? null : prev))}
            >
              <button
                type="button"
                onClick={() => {
                  onSelect(item.key);
                  if (item.subItems?.length && !collapsed) {
                    toggleOpen(item.key);
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition ${active
                    ? 'bg-gray-100 font-semibold text-gray-900 dark:bg-slate-800 dark:text-slate-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`}
              >
                <Icon className="h-5 w-5" />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.subItems?.length ? (
                  <span className="text-xs text-gray-400 dark:text-slate-500">{isOpen ? '−' : '+'}</span>
                ) : null}
              </button>

              {!collapsed && item.subItems?.length && isOpen ? (
                <div className="ml-5 mt-1 border-l border-gray-200 pl-4 dark:border-slate-700">
                  {item.subItems.map((subItem) => (
                    <div key={subItem} className="relative py-1.5 text-sm text-gray-500 dark:text-slate-400">
                      <span className="absolute -left-4 top-1/2 h-px w-3 -translate-y-1/2 bg-gray-200 dark:bg-slate-700" />
                      {subItem}
                    </div>
                  ))}
                </div>
              ) : null}

              <AnimatePresence>
                {shouldShowHoverMenu ? (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="absolute left-16 top-0 z-30 w-56 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
                  >
                    <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-slate-400">{item.label}</p>
                    <div className="border-l border-gray-200 pl-3 dark:border-slate-700">
                      {item.subItems?.map((subItem) => (
                        <div key={subItem} className="relative py-1.5 text-sm text-gray-600 dark:text-slate-300">
                          <span className="absolute -left-3 top-1/2 h-px w-2 -translate-y-1/2 bg-gray-200 dark:bg-slate-700" />
                          {subItem}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}

        {!collapsed && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Recent Events</p>
            <div className="space-y-2">
              {recentEvents.slice(0, 3).map((event, index) => (
                <div key={event.id} className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                    {index + 1}
                  </div>
                  <p className="truncate text-sm text-gray-700 dark:text-slate-300">{event.name}</p>
                </div>
              ))}
              {recentEvents.length === 0 && <p className="text-sm text-gray-500 dark:text-slate-400">No recent events</p>}
            </div>
          </div>
        )}
      </nav>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName || 'Admin'}
              className="h-11 w-11 rounded-full border border-gray-200 object-cover dark:border-slate-700"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-gray-700 dark:bg-slate-700 dark:text-slate-200">
              {initials || 'AD'}
            </div>
          )}
          {!collapsed && (
            <div>
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">{userName || 'Admin User'}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{role}</p>
            </div>
          )}
          {!collapsed && <CalendarDays className="ml-auto h-4 w-4 text-gray-400 dark:text-slate-500" />}
        </div>
      </div>
    </motion.aside>
  );
}
