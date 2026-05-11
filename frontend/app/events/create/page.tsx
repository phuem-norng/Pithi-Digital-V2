'use client';

import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Globe,
  Home,
  MapPin,
  Menu,
  PartyPopper,
  Plus,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCard } from '@/components/ui/message-card';
import { apiClient, EventType as ApiEventType } from '@/lib/api-client';
import { EVENT_CATEGORY_BY_KEY, EVENT_CATEGORY_OPTIONS, EventFlowType } from '@/lib/event-categories';
import { withProtectedRoute } from '@/lib/protected-route';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { DashboardLanguageThemeControls } from '@/components/dashboard-language-theme-controls';
import { DashboardSharedSidebar } from '@/components/dashboard-shared-sidebar';

const EVENT_TYPE_OPTIONS: Array<{ value: EventFlowType; label: string }> = [
  { value: 'WEDDING', label: 'មង្គលការ' },
  { value: 'CEREMONY', label: 'បុណ្យទូទៅ' },
  { value: 'BIRTHDAY', label: 'ខួបកំណើត' },
  { value: 'HOUSEWARMING', label: 'ឡើងផ្ទះ' },
];

const WEDDING_PROGRAM_TYPE_OPTIONS = [
  { value: 'ភ្ជាប់ពាក្យ', km: 'ភ្ជាប់ពាក្យ', en: 'Engagement' },
  { value: 'មង្គលការ', km: 'មង្គលការ', en: 'Wedding ceremony' },
  { value: 'កាត់ចំណងដៃ', km: 'កាត់ចំណងដៃ', en: 'Gift-cutting ceremony' },
  { value: 'ពិសារស្លាដក់កន្សែង', km: 'ពិសារស្លាដក់កន្សែង', en: 'Traditional blessing meal' },
  { value: 'OTHERS', km: 'ផ្សេងៗ', en: 'Others' },
] as const;

type WeddingProgramType = (typeof WEDDING_PROGRAM_TYPE_OPTIONS)[number]['value'];

function RequiredStar() {
  return <span className="ml-1 text-red-500">*</span>;
}

function getLocalizedEventTypeName(rawName: string, language: 'km' | 'en') {
  if (language === 'en') return rawName;

  const key = rawName.toLowerCase();
  if (key.includes('wedding')) return 'មង្គលការ';
  if (key.includes('birthday')) return 'ខួបកំណើត';
  if (key.includes('housewarming')) return 'ឡើងផ្ទះ';
  if (key.includes('ceremony') || key.includes('other')) return 'បុណ្យទូទៅ';
  if (key.includes('funeral')) return 'បុណ្យសព';
  return rawName;
}

function CreateEventPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { language } = useLanguage();
  const isKhmer = language === 'km';

  const [eventType, setEventType] = useState<EventFlowType>('WEDDING');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(EVENT_CATEGORY_OPTIONS[0]?.key || 'wedding');
  const [eventTypes, setEventTypes] = useState<ApiEventType[]>([]);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [weddingProgramType, setWeddingProgramType] = useState<WeddingProgramType>('មង្គលការ');

  const [ceremonyName, setCeremonyName] = useState('');
  const [watName, setWatName] = useState('');
  const [mainCelebrant, setMainCelebrant] = useState('');

  const [hostName, setHostName] = useState('');
  const [eventTitle, setEventTitle] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapLink, setGoogleMapLink] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [preventDuplicateGuestNames, setPreventDuplicateGuestNames] = useState(false);

  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [filePreviews]);

  useEffect(() => {
    const loadEventTypes = async () => {
      try {
        const data = await apiClient.getEventTypes();
        setEventTypes(data);
      } catch (loadError) {
        console.error('Failed to load event types', loadError);
      }
    };

    loadEventTypes();
  }, []);

  useEffect(() => {
    const selectedCategory = EVENT_CATEGORY_BY_KEY[selectedCategoryKey] || EVENT_CATEGORY_OPTIONS[0];
    if (selectedCategory && selectedCategory.defaultEventType !== eventType) {
      setEventType(selectedCategory.defaultEventType);
    }
  }, [selectedCategoryKey, eventType]);

  useEffect(() => {
    if (!eventTypes.length) {
      return;
    }

    const map: Record<EventFlowType, string> = {
      WEDDING: 'wedding',
      CEREMONY: 'other',
      BIRTHDAY: 'birthday',
      HOUSEWARMING: 'housewarming',
    };

    const matched = eventTypes.find((item) => item.slug === map[eventType]);
    setSelectedEventTypeId(matched?.id || eventTypes[0]?.id || '');
  }, [eventType, eventTypes]);

  const selectedCategory = EVENT_CATEGORY_BY_KEY[selectedCategoryKey] || EVENT_CATEGORY_OPTIONS[0];

  const eventTypeKhmerLabel = useMemo(
    () => selectedCategory?.subtitle || EVENT_TYPE_OPTIONS.find((item) => item.value === eventType)?.label || '',
    [selectedCategory, eventType],
  );

  const labelClassName = 'mb-2 block text-sm font-medium text-gray-700 dark:text-slate-100 font-khmer-body';
  const inputClassName =
    'h-11 w-full min-w-0 max-w-full box-border rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm transition focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder:text-slate-500 dark:focus-visible:ring-slate-700';
  const selectClassName =
    'h-11 w-full min-w-0 max-w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:focus:ring-slate-700';

  const sanitizeEnglishDigits = (value: string) => value.replace(/[^0-9]/g, '');

  const handleDigitsOnlyKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const allowedControlKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'Enter',
      'Escape',
    ];

    if (allowedControlKeys.includes(event.key)) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(event.key.toLowerCase())) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  };

  const handleDigitsOnlyPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text');
    if (!/^[0-9]+$/.test(pasted)) {
      event.preventDefault();
    }
  };

  const handleFileChange = (key: string, file: File | null) => {
    setFilePreviews((previous) => {
      const next = { ...previous };

      if (next[key]) {
        URL.revokeObjectURL(next[key]);
        delete next[key];
      }

      if (file) {
        next[key] = URL.createObjectURL(file);
      }

      return next;
    });

    setFileNames((previous) => {
      const next = { ...previous };
      if (file) {
        next[key] = file.name;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const buildEventData = () => {
    if (eventType === 'WEDDING') {
      if (!groomName.trim() || !brideName.trim()) {
        throw new Error(isKhmer ? 'សូមបំពេញឈ្មោះកូនប្រុស និង កូនស្រី' : 'Please fill in groom and bride names');
      }

      return {
        title: `ពិធីរៀបមង្គលការ ${groomName.trim()} និង ${brideName.trim()}`,
        metadata: {
          category: eventTypeKhmerLabel,
          categoryKey: selectedCategory?.key || 'wedding',
          groomName: groomName.trim(),
          brideName: brideName.trim(),
          programType: weddingProgramType,
        },
      };
    }

    if (eventType === 'CEREMONY') {
      if (!ceremonyName.trim() || !watName.trim() || !mainCelebrant.trim()) {
        throw new Error(isKhmer ? 'សូមបំពេញ Ceremony Name, Wat Name និង Main Celebrant' : 'Please fill in Ceremony Name, Wat Name, and Main Celebrant');
      }

      return {
        title: ceremonyName.trim(),
        metadata: {
          category: eventTypeKhmerLabel,
          categoryKey: selectedCategory?.key || 'wedding',
          ceremonyName: ceremonyName.trim(),
          watName: watName.trim(),
          mainCelebrant: mainCelebrant.trim(),
        },
      };
    }

    if (!hostName.trim() || !eventTitle.trim()) {
      throw new Error(isKhmer ? 'សូមបំពេញ Host Name និង Event Title' : 'Please fill in Host Name and Event Title');
    }

    return {
      title: eventTitle.trim(),
      metadata: {
        category: eventTypeKhmerLabel,
        categoryKey: selectedCategory?.key || 'wedding',
        hostName: hostName.trim(),
        eventTitle: eventTitle.trim(),
      },
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const backgroundImageFile = formData.get('backgroundImage') as File | null;
    const khqrDollarFile = formData.get('khqrDollar') as File | null;
    const khqrRielFile = formData.get('khqrRiel') as File | null;

    const hasFile = (file: File | null) => !!file && file.size > 0;

    try {
      if (!startDate) {
        throw new Error(isKhmer ? 'សូមបំពេញ Date/Time' : 'Please fill in Date/Time');
      }

      const baseData = buildEventData();

      let coverImage: string | undefined;
      let khqrDollar: string | undefined;
      let khqrRiel: string | undefined;

      if (hasFile(backgroundImageFile)) {
        coverImage = await apiClient.uploadFile(backgroundImageFile as File);
      }

      if (hasFile(khqrDollarFile)) {
        khqrDollar = await apiClient.uploadFile(khqrDollarFile as File);
      }

      if (hasFile(khqrRielFile)) {
        khqrRiel = await apiClient.uploadFile(khqrRielFile as File);
      }

      const event = await apiClient.createEvent(
        baseData.title,
        eventType,
        startDate,
        address.trim(),
        undefined,
        coverImage,
        {
          ...baseData.metadata,
          visibility,
          preventDuplicateGuestNames,
          eventEndDate: endDate || startDate,
        },
        googleMapLink.trim() || undefined,
        khqrDollar,
        khqrRiel,
        selectedEventTypeId || undefined,
        undefined,
        address.trim(),
        undefined,
      );

      router.push(`/events/${event.id}`);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      if (Array.isArray(message)) {
        setError(message.join(', '));
      } else {
        setError(message || err?.message || 'Failed to create event');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadSections = [
    {
      key: 'backgroundImage',
      label: isKhmer ? 'រូបភាពផ្ទៃខាងក្រោយ' : 'Background Image',
      isKhqr: false,
    },
    {
      key: 'khqrDollar',
      label: isKhmer ? 'KHQR ប្រាក់ដុល្លារ' : 'KHQR Dollar',
      isKhqr: true,
    },
    {
      key: 'khqrRiel',
      label: isKhmer ? 'KHQR ប្រាក់រៀល' : 'KHQR Riel',
      isKhqr: true,
    },
  ];

  const handleSignOut = () => {
    logout();
    router.replace('/login');
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
    <div className="min-h-screen bg-gray-50 font-khmer-body flex flex-col dark:bg-slate-950 dark:text-slate-200">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-hidden="true" />
      )}

      {/* Mobile slide-in sidebar */}
      <div
        ref={mobileMenuRef}
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-slate-900 lg:hidden ${
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
        <DashboardSharedSidebar
          currentPath={pathname}
          onSignOut={handleSignOut}
          onLinkClick={() => setIsMobileMenuOpen(false)}
        />
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
            <div className="flex w-full items-center gap-3 px-4 py-3 sm:px-6">
              {/* Hamburger – mobile only */}
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setIsMobileMenuOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="truncate font-khmer-heading text-xl text-gray-900 dark:text-slate-100 sm:text-3xl">{isKhmer ? 'បង្កើតព្រឹត្តិការណ៍ថ្មី' : 'Create Event'}</h1>
                <p className="mt-0.5 font-khmer-body text-xs text-gray-500 dark:text-slate-400 sm:text-sm">{isKhmer ? 'បំពេញព័ត៌មានកម្មវិធីរបស់អ្នក' : 'Fill your event information'}</p>
              </div>

              <div className="flex items-center gap-2">
                <DashboardLanguageThemeControls />
              </div>

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
            </div>
          </header>

          <main className="min-w-0 px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto w-full min-w-0 max-w-5xl rounded-2xl bg-white p-4 text-gray-900 shadow-md dark:border dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 sm:p-8">
              <form onSubmit={handleSubmit} className="min-w-0 space-y-5 [&>div]:min-w-0">
            {error && (
              <MessageCard text={error} tone="error" onClose={() => setError('')} className="p-4" />
            )}

            <input type="hidden" name="eventCategory" value={selectedCategoryKey} />

            <div>
              <label htmlFor="eventTypeId" className={labelClassName}>
                {isKhmer ? 'ប្រភេទកម្មវិធី (Catalog)' : 'Event Type Catalog'}
              </label>
              <select
                id="eventTypeId"
                value={selectedEventTypeId}
                onChange={(e) => setSelectedEventTypeId(e.target.value)}
                disabled={isLoading || eventTypes.length === 0}
                className={selectClassName}
              >
                {eventTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {getLocalizedEventTypeName(item.name, language)}
                  </option>
                ))}
              </select>
            </div>

            {eventType === 'WEDDING' && (
              <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 [&>div]:min-w-0">
                <div>
                  <label htmlFor="groomName" className={labelClassName}>
                    {isKhmer ? 'ឈ្មោះកូនប្រុស' : 'Groom Name'}<RequiredStar />
                  </label>
                  <div className="relative min-w-0 w-full max-w-full">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      id="groomName"
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      disabled={isLoading}
                      className={`${inputClassName} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="brideName" className={labelClassName}>
                    {isKhmer ? 'ឈ្មោះកូនស្រី' : 'Bride Name'}<RequiredStar />
                  </label>
                  <div className="relative min-w-0 w-full max-w-full">
                    <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      id="brideName"
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      disabled={isLoading}
                      className={`${inputClassName} pl-10`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="weddingProgramType" className={labelClassName}>
                    {isKhmer ? 'ប្រភេទកម្មវិធី' : 'Program Type'}
                  </label>
                  <select
                    id="weddingProgramType"
                    value={weddingProgramType}
                    onChange={(e) => setWeddingProgramType(e.target.value as WeddingProgramType)}
                    disabled={isLoading}
                    className={selectClassName}
                  >
                    {WEDDING_PROGRAM_TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {isKhmer ? item.km : item.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {eventType === 'CEREMONY' && (
              <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 [&>div]:min-w-0">
                <div>
                  <label htmlFor="ceremonyName" className={labelClassName}>
                    {isKhmer ? 'ឈ្មោះពិធី' : 'Ceremony Name'}<RequiredStar />
                  </label>
                  <Input
                    id="ceremonyName"
                    value={ceremonyName}
                    onChange={(e) => setCeremonyName(e.target.value)}
                    disabled={isLoading}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="watName" className={labelClassName}>
                    {isKhmer ? 'ទីតាំង (ឈ្មោះវត្ត)' : 'Location (Wat Name)'}<RequiredStar />
                  </label>
                  <Input
                    id="watName"
                    value={watName}
                    onChange={(e) => setWatName(e.target.value)}
                    disabled={isLoading}
                    className={inputClassName}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="mainCelebrant" className={labelClassName}>
                    {isKhmer ? 'ព្រះសង្ឃនាំពិធី' : 'Main Celebrant'}<RequiredStar />
                  </label>
                  <Input
                    id="mainCelebrant"
                    value={mainCelebrant}
                    onChange={(e) => setMainCelebrant(e.target.value)}
                    disabled={isLoading}
                    className={inputClassName}
                  />
                </div>
              </div>
            )}

            {(eventType === 'HOUSEWARMING' || eventType === 'BIRTHDAY') && (
              <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 [&>div]:min-w-0">
                <div>
                  <label htmlFor="hostName" className={labelClassName}>
                    {isKhmer ? 'ឈ្មោះម្ចាស់កម្មវិធី' : 'Host Name'}<RequiredStar />
                  </label>
                  <div className="relative min-w-0 w-full max-w-full">
                    <Home className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      id="hostName"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      disabled={isLoading}
                      className={`${inputClassName} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="eventTitle" className={labelClassName}>
                    {isKhmer ? 'ចំណងជើងកម្មវិធី' : 'Event Title'}<RequiredStar />
                  </label>
                  <div className="relative min-w-0 w-full max-w-full">
                    <PartyPopper className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      id="eventTitle"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      disabled={isLoading}
                      className={`${inputClassName} pl-10`}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="startDate" className={labelClassName}>
                {isKhmer ? 'កាលបរិច្ឆេទ/ម៉ោង' : 'Date/Time'}<RequiredStar />
              </label>
              <div className="relative min-w-0 w-full max-w-full">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isLoading}
                  className={`${inputClassName} pl-10`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="endDate" className={labelClassName}>
                {isKhmer ? 'ថ្ងៃបញ្ចប់កម្មវិធី' : 'Event End Date'}
              </label>
              <div className="relative min-w-0 w-full max-w-full">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isLoading}
                  className={`${inputClassName} pl-10`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className={labelClassName}>
                {isKhmer ? 'អាសយដ្ឋាន' : 'Address'}
              </label>
              <p className="mb-2 text-xs text-gray-500 dark:text-slate-400 font-khmer-body">
                {isKhmer ? 'មិនទាន់ដាក់ក៏បាន' : 'Optional'}
              </p>
              <div className="relative min-w-0 w-full max-w-full">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="address"
                  name="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isLoading}
                  className={`${inputClassName} pl-10`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="googleMapLink" className={labelClassName}>
                {isKhmer ? 'តំណ Google Maps' : 'Google Maps Link'}
              </label>
              <p className="mb-2 text-xs text-gray-500 dark:text-slate-400 font-khmer-body">
                {isKhmer ? 'មិនទាន់ដាក់ក៏បាន' : 'Optional'}
              </p>
              <div className="relative min-w-0 w-full max-w-full">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="googleMapLink"
                  name="googleMapLink"
                  type="url"
                  value={googleMapLink}
                  onChange={(e) => setGoogleMapLink(e.target.value)}
                  disabled={isLoading}
                  className={`${inputClassName} pl-10`}
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <p className="mb-3 text-sm font-medium text-gray-700 dark:text-slate-100">{isKhmer ? 'អ្នកណាអាចចូលមើលបាន?' : 'Who can view this?'}</p>
              <div className="space-y-2 text-sm text-gray-700 dark:text-slate-100">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="PUBLIC"
                    checked={visibility === 'PUBLIC'}
                    onChange={() => setVisibility('PUBLIC')}
                    disabled={isLoading}
                  />
                  {isKhmer ? 'គ្រប់គ្នា' : 'Everyone'}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="PRIVATE"
                    checked={visibility === 'PRIVATE'}
                    onChange={() => setVisibility('PRIVATE')}
                    disabled={isLoading}
                  />
                  {isKhmer ? 'សម្រាប់តែខ្ញុំ' : 'Only me'}
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-100">
                <input
                  type="checkbox"
                  checked={preventDuplicateGuestNames}
                  onChange={(e) => setPreventDuplicateGuestNames(e.target.checked)}
                  disabled={isLoading}
                />
                {isKhmer ? 'មិនអនុញ្ញាតឱ្យមានភ្ញៀវឈ្មោះដូចគ្នា' : 'Prevent duplicate guest names'}
              </label>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {uploadSections.map((section) => (
                <div key={section.key}>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-100 font-khmer-body">{section.label}</p>
                  <p className="mb-2 text-xs text-gray-500 dark:text-slate-400 font-khmer-body">
                    {isKhmer ? 'មិនទាន់ដាក់ក៏បាន' : 'Optional'}
                  </p>
                  <label
                    htmlFor={section.key}
                    className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 text-center text-sm transition-all ${
                      filePreviews[section.key]
                        ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100 shadow-sm'
                        : section.isKhqr
                          ? 'border-rose-300 bg-rose-50/70 text-rose-700 hover:border-rose-400'
                          : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-red-300'
                    }`}
                  >
                    {filePreviews[section.key] ? (
                      <>
                        <img
                          src={filePreviews[section.key]}
                          alt={section.label}
                          className="mb-2 h-20 w-full rounded-md object-cover"
                        />
                        <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {isKhmer ? 'ជោគជ័យ' : 'Success'}
                        </p>
                        <p className="line-clamp-2 break-all text-xs text-gray-600">{fileNames[section.key]}</p>
                      </>
                    ) : (
                      <>
                        <Upload className="mb-2 h-5 w-5" />
                        <p className="font-khmer-body">{isKhmer ? 'ចុចដើម្បីបញ្ចូល ឬ អូសទម្លាក់' : 'Click to upload or drag and drop'}</p>
                      </>
                    )}
                    <input
                      id={section.key}
                      name={section.key}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleFileChange(section.key, event.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              ))}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-xl bg-red-600 text-base text-white hover:bg-red-700"
            >
              {isLoading ? (isKhmer ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKhmer ? 'រក្សាទុក' : 'Save')}
            </Button>
              </form>
            </div>
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

export default withProtectedRoute(CreateEventPage);
