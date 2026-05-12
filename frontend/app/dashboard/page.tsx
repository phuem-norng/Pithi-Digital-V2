'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CalendarDays, Home, Menu, Plus, Users, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, Event, Guest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/event-card';
import { useLanguage } from '@/lib/language-context';
import { DashboardLanguageThemeControls } from '@/components/dashboard-language-theme-controls';
import { DashboardSharedSidebar } from '@/components/dashboard-shared-sidebar';

type RecentConfirmedGuest = Guest & {
  eventTitle: string;
};

function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const isKhmer = language === 'km';
  const [events, setEvents] = useState<Event[]>([]);
  const [recentConfirmedGuests, setRecentConfirmedGuests] = useState<RecentConfirmedGuest[]>([]);
  const [trendData, setTrendData] = useState<Array<{ label: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState<Event | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const handleSignOut = () => {
    logout();
    router.replace('/login');
  };

  // Close mobile menu when clicking outside
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

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const loadEvents = async () => {
      try {
        const result = await apiClient.getEvents(1, 12);
        setEvents(result);

        const eventsForGuestInsights = result.slice(0, 6);
        const guestBatches = await Promise.all(
          eventsForGuestInsights.map(async (eventItem) => {
            try {
              const guests = await apiClient.getEventGuests(eventItem.id, 0, 20);
              return guests.map((guest) => ({
                ...guest,
                eventTitle: eventItem.title,
              }));
            } catch {
              return [] as RecentConfirmedGuest[];
            }
          }),
        );

        const allGuests = guestBatches.flat();
        const confirmedGuests = allGuests
          .filter((guest) => guest.rsvpStatus === 'CONFIRMED' || guest.status === 'ACCEPTED')
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        setRecentConfirmedGuests(confirmedGuests.slice(0, 5));

        const now = new Date();
        const monthBuckets = Array.from({ length: 6 }, (_, index) => {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
          const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
          return {
            key,
            label: monthDate.toLocaleDateString(isKhmer ? 'km-KH' : 'en-US', { month: 'short' }),
            count: 0,
          };
        });

        const bucketIndexByKey = new Map(monthBuckets.map((bucket, index) => [bucket.key, index]));
        for (const guest of confirmedGuests) {
          const createdAt = new Date(guest.createdAt);
          const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
          const bucketIndex = bucketIndexByKey.get(key);
          if (bucketIndex !== undefined) {
            monthBuckets[bucketIndex].count += 1;
          }
        }

        const monthlyData = monthBuckets.map(({ label, count }) => ({ label, count }));

        setTrendData(monthlyData);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [isAuthenticated, isKhmer]);

  const totalGuests = events.reduce((sum, event) => sum + (event.guestCount || 0), 0);
  const upcomingEvents = events.filter((event) => new Date(event.date).getTime() >= Date.now()).length;
  const publicEvents = events.filter((event) => (event.metadata?.visibility as string) !== 'PRIVATE').length;

  const summaryCards = [
    { title: isKhmer ? 'ព្រឹត្តិការណ៍សរុប' : 'Total Events', value: events.length, icon: CalendarDays, iconClassName: 'text-violet-500 bg-violet-50' },
    { title: isKhmer ? 'ភ្ញៀវសរុប' : 'Total Guests', value: totalGuests, icon: Users, iconClassName: 'text-blue-500 bg-blue-50' },
    { title: isKhmer ? 'កម្មវិធីកំពុងខិតជិត' : 'Upcoming Events', value: upcomingEvents, icon: BarChart3, iconClassName: 'text-amber-500 bg-amber-50' },
    { title: isKhmer ? 'កម្មវិធីសាធារណៈ' : 'Public Events', value: publicEvents, icon: Home, iconClassName: 'text-emerald-500 bg-emerald-50' },
  ];

  const maxTrend = Math.max(...trendData.map((item) => item.count), 1);

  const handleDeleteEvent = async (event: Event) => {
    setPendingDeleteEvent(event);
  };

  const handleConfirmDeleteEvent = async () => {
    if (!pendingDeleteEvent) {
      return;
    }

    try {
      setIsDeletingEvent(true);
      await apiClient.deleteEvent(pendingDeleteEvent.id);
      setEvents((prev) => prev.filter((item) => item.id !== pendingDeleteEvent.id));
      setRecentConfirmedGuests((prev) => prev.filter((guest) => guest.eventId !== pendingDeleteEvent.id));
      setPendingDeleteEvent(null);
    } catch {
      window.alert(isKhmer ? 'មិនអាចលុបព្រឹត្តិការណ៍បានទេ' : 'Could not delete event');
    } finally {
      setIsDeletingEvent(false);
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

  return (
    <div className="min-h-screen bg-gray-50 font-khmer-body flex flex-col dark:bg-slate-950">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-hidden="true" />
      )}

      {/* Mobile slide-in sidebar */}
      <div
        ref={mobileMenuRef}
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-72 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-slate-900 lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
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
          <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex w-full items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6">
              {/* Hamburger – mobile only */}
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setIsMobileMenuOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden max-[375px]:h-8 max-[375px]:w-8"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="truncate font-khmer-body text-xl font-semibold leading-[1.45] text-gray-900 dark:text-slate-100 sm:text-3xl">{isKhmer ? 'ព្រឹត្តិការណ៍របស់អ្នក' : 'Your Events'}</h1>
                <p className="mt-0.5 font-khmer-body text-xs leading-[1.45] text-gray-500 dark:text-slate-400 sm:text-sm">{user?.name}</p>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <DashboardLanguageThemeControls />
                <Link href="/dashboard/profile" className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-[0_4px_14px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-800 sm:hidden">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User Avatar'}
                      className="h-8 w-8 rounded-full border border-gray-200 object-cover max-[375px]:h-7 max-[375px]:w-7"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-rose-100 text-xs font-semibold text-rose-700 max-[375px]:h-7 max-[375px]:w-7">
                      {(user?.name || 'U').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[36px] truncate text-xs text-gray-700 dark:text-slate-200">{user?.name || 'User'}</span>
                </Link>

                <Link href="/dashboard/profile" className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-[0_4px_14px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-800 sm:flex">
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
                  <span className="text-sm text-gray-700 dark:text-slate-200">{user?.name || 'User'}</span>
                </Link>

                <Link href="/events/create">
                  <Button className="bg-rose-500 text-white hover:bg-rose-600 h-9 px-3 text-sm max-[375px]:h-8 max-[375px]:px-2">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{isKhmer ? 'បង្កើតព្រឹត្តិការណ៍ថ្មី' : 'Create Event'}</span>
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6">
            <section className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <article key={card.title} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-khmer-body text-sm leading-[1.45] text-gray-500 dark:text-slate-400">{card.title}</p>
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.iconClassName}`}>
                      <card.icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900 dark:text-slate-100 sm:text-2xl">{card.value}</p>
                </article>
              ))}
            </section>

            <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <h3 className="font-khmer-body text-lg font-semibold leading-[1.45] text-gray-900 dark:text-slate-100">{isKhmer ? 'ការឆ្លើយតប RSVP ថ្មីៗ' : 'Recent Guest RSVPs'}</h3>
                <div className="mt-4 space-y-2">
                  {recentConfirmedGuests.length === 0 ? (
                    <p className="font-khmer-body text-sm leading-[1.5] text-gray-500 dark:text-slate-400">{isKhmer ? 'មិនទាន់មានភ្ញៀវបានចូលរួមនៅឡើយទេ។' : 'No confirmed guests yet.'}</p>
                  ) : (
                    recentConfirmedGuests.map((guest) => (
                      <div key={guest.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700">
                          {(guest.name || 'G').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">{guest.name}</p>
                          <p className="line-clamp-1 text-xs text-gray-500 dark:text-slate-400">{guest.eventTitle}</p>
                        </div>
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                          {isKhmer ? 'បានចូលរួម' : 'Confirmed'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <h3 className="font-khmer-body text-lg font-semibold leading-[1.45] text-gray-900 dark:text-slate-100">{isKhmer ? 'និន្នាការភ្ញៀវ' : 'Guest Trends'}</h3>
                <div className="mt-5 grid h-44 grid-cols-6 items-end gap-2 sm:gap-3">
                  {trendData.map((item) => {
                    const barHeight = Math.max(16, Math.round((item.count / maxTrend) * 140));
                    return (
                      <div key={item.label} className="min-w-0 flex flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-rose-500/90 via-fuchsia-400/80 to-pink-300/70 shadow-[0_8px_18px_rgba(244,63,94,0.25)]"
                          style={{ height: `${barHeight}px` }}
                        />
                        <p className="w-full truncate text-center text-[11px] text-gray-500 dark:text-slate-400">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">{isKhmer ? 'ចំនួនភ្ញៀវបានចូលរួមប្រចាំខែ។' : 'Monthly confirmed guest volume.'}</p>
              </article>
            </section>

            {isLoading ? (
              <div className="py-16 text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-rose-500" />
                <p className="mt-4 text-gray-600">{isKhmer ? 'កំពុងទាញយកព្រឹត្តិការណ៍...' : 'Loading events...'}</p>
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-gray-500 dark:text-slate-400">{isKhmer ? 'មិនទាន់មានព្រឹត្តិការណ៍ទេ។ សូមបង្កើតថ្មីមួយ។' : 'No events yet. Please create one.'}</p>
              </div>
            ) : (
              <section>
                <h3 className="mb-4 font-khmer-body text-xl font-semibold leading-[1.45] text-gray-900 dark:text-slate-100">{isKhmer ? 'បញ្ជីព្រឹត្តិការណ៍' : 'Event List'}</h3>
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 2xl:grid-cols-3">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onDelete={handleDeleteEvent}
                    />
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      <footer className="mt-auto border-t border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-sm text-gray-500 font-khmer-body sm:px-6 lg:px-8">
          <p>&copy; 2026 Pithi Digital. {isKhmer ? 'រក្សាសិទ្ធិគ្រប់យ៉ាង។' : 'All rights reserved.'}</p>
        </div>
      </footer>

      {pendingDeleteEvent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="font-khmer-body text-lg font-semibold text-gray-900 dark:text-slate-100">
              {isKhmer ? 'លុបព្រឹត្តិការណ៍?' : 'Delete event?'}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
              {isKhmer
                ? `តើអ្នកប្រាកដថាចង់លុប "${pendingDeleteEvent.title}" មែនទេ?`
                : `Are you sure you want to delete "${pendingDeleteEvent.title}"?`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingDeleteEvent(null)}
                disabled={isDeletingEvent}
              >
                {isKhmer ? 'បោះបង់' : 'Cancel'}
              </Button>
              <Button
                type="button"
                className="bg-rose-600 text-white hover:bg-rose-700"
                onClick={handleConfirmDeleteEvent}
                disabled={isDeletingEvent}
              >
                {isDeletingEvent ? (isKhmer ? 'កំពុងលុប...' : 'Deleting...') : isKhmer ? 'លុប' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
