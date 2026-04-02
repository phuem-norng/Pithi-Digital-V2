'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, CalendarDays, Home, Menu, Plus, UserCircle, Users, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient, Event, Guest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/event-card';

type RecentConfirmedGuest = Guest & {
  eventTitle: string;
};

function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [recentConfirmedGuests, setRecentConfirmedGuests] = useState<RecentConfirmedGuest[]>([]);
  const [trendData, setTrendData] = useState<Array<{ label: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
            label: monthDate.toLocaleDateString('km-KH', { month: 'short' }),
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
  }, [isAuthenticated]);

  const totalGuests = events.reduce((sum, event) => sum + (event.guestCount || 0), 0);
  const upcomingEvents = events.filter((event) => new Date(event.date).getTime() >= Date.now()).length;
  const publicEvents = events.filter((event) => (event.metadata?.visibility as string) !== 'PRIVATE').length;

  const summaryCards = [
    { title: 'ព្រឹត្តិការណ៍សរុប', value: events.length, icon: CalendarDays },
    { title: 'ភ្ញៀវសរុប', value: totalGuests, icon: Users },
    { title: 'កម្មវិធីកំពុងខិតជិត', value: upcomingEvents, icon: BarChart3 },
    { title: 'កម្មវិធីសាធារណៈ', value: publicEvents, icon: Home },
  ];

  const maxTrend = Math.max(...trendData.map((item) => item.count), 1);

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
        <Link href="/dashboard" onClick={onLinkClick} className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          <Home className="h-4 w-4" /> ទំព័រដើម
        </Link>
        <Link href="/events/create" onClick={onLinkClick} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
          <Plus className="h-4 w-4" /> បង្កើតព្រឹត្តិការណ៍ថ្មី
        </Link>
        <Link href="/dashboard/profile" onClick={onLinkClick} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
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
                <h1 className="font-khmer-heading text-xl text-gray-900 sm:text-3xl truncate">ព្រឹត្តិការណ៍របស់អ្នក</h1>
                <p className="mt-0.5 text-xs text-gray-500 font-khmer-body sm:text-sm">{user?.name}</p>
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
            <section className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <article key={card.title} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <card.icon className="h-5 w-5 text-rose-500" />
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                </article>
              ))}
            </section>

            <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <h3 className="font-khmer-heading text-lg text-gray-900">Recent Guest RSVPs</h3>
                <div className="mt-4 space-y-3">
                  {recentConfirmedGuests.length === 0 ? (
                    <p className="text-sm text-gray-500">មិនទាន់មានភ្ញៀវបាន Confirm នៅឡើយទេ។</p>
                  ) : (
                    recentConfirmedGuests.map((guest) => (
                      <div key={guest.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm font-semibold text-gray-900">{guest.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{guest.eventTitle}</p>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <h3 className="font-khmer-heading text-lg text-gray-900">Guest Trends</h3>
                <div className="mt-5 flex h-44 items-end gap-3">
                  {trendData.map((item) => {
                    const barHeight = Math.max(16, Math.round((item.count / maxTrend) * 140));
                    return (
                      <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                        <div className="w-full rounded-t-md bg-rose-400/80" style={{ height: `${barHeight}px` }} />
                        <p className="text-xs text-gray-500">{item.label}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-gray-500">Simple placeholder chart for monthly confirmed guests.</p>
              </article>
            </section>

            {isLoading ? (
              <div className="py-16 text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-rose-500" />
                <p className="mt-4 text-gray-600">កំពុងទាញយកព្រឹត្តិការណ៍...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                <p className="text-gray-500">មិនទាន់មានព្រឹត្តិការណ៍ទេ។ សូមបង្កើតថ្មីមួយ។</p>
              </div>
            ) : (
              <section>
                <h3 className="mb-4 font-khmer-heading text-xl text-gray-900">បញ្ជីព្រឹត្តិការណ៍</h3>
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 2xl:grid-cols-3">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
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

export default DashboardPage;
