'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Copy, Download, MoreVertical, Pencil, Plus, QrCode, RefreshCw, Search, Send, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiClient, Guest, User, Event, SupportLink } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { withProtectedRoute } from '@/lib/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminSidebar, type AdminMenuKey } from '@/components/admin-sidebar';

interface AdminAppProps {
  activeMenu: AdminMenuKey;
}

type GuestWithContext = Guest & {
  eventTitle: string;
  group?: string;
  tag?: string;
  amount?: number;
  note?: string;
  greetingMessage?: string;
};

function AdminAppBase({ activeMenu }: AdminAppProps) {
  const router = useRouter();
  const { user, isLoading: authLoading, updateProfile, logout } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [allGuests, setAllGuests] = useState<GuestWithContext[]>([]);

  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingGuests, setIsLoadingGuests] = useState(true);
  const [isRefreshingGuests, setIsRefreshingGuests] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [passwordDraftByUser, setPasswordDraftByUser] = useState<Record<string, string>>({});
  const [guestSearch, setGuestSearch] = useState('');
  const [guestPage, setGuestPage] = useState(1);
  const [guestRowsPerPage, setGuestRowsPerPage] = useState(10);
  const [guestGroupFilter, setGuestGroupFilter] = useState('ALL');
  const [guestTagFilter, setGuestTagFilter] = useState('ALL');
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestEventId, setNewGuestEventId] = useState('');
  const [newGuestGroup, setNewGuestGroup] = useState<'GROOM_SIDE' | 'BRIDE_SIDE'>('GROOM_SIDE');
  const [newGuestTag, setNewGuestTag] = useState<'HIGH_SCHOOL_FRIEND' | 'COLLEGE_FRIEND' | 'FRIEND' | 'TEAMWORK' | 'RELATIVE' | 'OTHERS'>('OTHERS');
  const [newGuestNote, setNewGuestNote] = useState('');
  const [shareGuestId, setShareGuestId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [shareGuestName, setShareGuestName] = useState('');
  const [shareNotice, setShareNotice] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrLink, setQrLink] = useState('');
  const [qrGuestName, setQrGuestName] = useState('');
  const [actionMenuGuestId, setActionMenuGuestId] = useState<string | null>(null);
  const [isEditGuestModalOpen, setIsEditGuestModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestPhone, setEditGuestPhone] = useState('');
  const [editGuestGroup, setEditGuestGroup] = useState<'GROOM_SIDE' | 'BRIDE_SIDE'>('GROOM_SIDE');
  const [editGuestTag, setEditGuestTag] = useState<'HIGH_SCHOOL_FRIEND' | 'COLLEGE_FRIEND' | 'FRIEND' | 'TEAMWORK' | 'RELATIVE' | 'OTHERS'>('OTHERS');
  const [editGuestGreetingMessage, setEditGuestGreetingMessage] = useState('');
  const [editGuestNote, setEditGuestNote] = useState('');
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!actionMenuGuestId) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuGuestId(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [actionMenuGuestId]);

  const [profileName, setProfileName] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [supportLinks, setSupportLinks] = useState<SupportLink[]>([]);
  const [isLoadingSupportLinks, setIsLoadingSupportLinks] = useState(false);
  const [isSavingSupportLink, setIsSavingSupportLink] = useState(false);
  const [newSupportLabel, setNewSupportLabel] = useState('');
  const [newSupportUrl, setNewSupportUrl] = useState('');
  const [newSupportPlatform, setNewSupportPlatform] = useState('telegram');

  useEffect(() => {
    if (!authLoading && user?.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  const loadGuestsForEvents = async (eventsSource: Event[]) => {
    const guestsByEvent = await Promise.all(
      eventsSource.map(async (event) => {
        try {
          const guests = await apiClient.getEventGuests(event.id, 0, 200);
          return guests.map((guest) => ({ ...guest, eventTitle: event.title }));
        } catch {
          return [] as GuestWithContext[];
        }
      }),
    );

    setAllGuests(guestsByEvent.flat());
  };

  const handleRefreshGuests = async () => {
    if (user?.role !== 'ADMIN') {
      return;
    }

    setError('');
    setIsRefreshingGuests(true);
    try {
      const eventsSource = events.length > 0 ? events : await apiClient.getEvents(1, 50);
      if (events.length === 0) {
        setEvents(eventsSource);
      }
      await loadGuestsForEvents(eventsSource);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to refresh guests');
    } finally {
      setIsRefreshingGuests(false);
    }
  };

  useEffect(() => {
    const loadAdminData = async () => {
      if (user?.role !== 'ADMIN') {
        setIsLoadingUsers(false);
        setIsLoadingEvents(false);
        setIsLoadingGuests(false);
        return;
      }

      setError('');

      try {
        const [usersData, eventsData] = await Promise.all([
          apiClient.getUsers(0, 100),
          apiClient.getEvents(1, 50),
        ]);

        setUsers(usersData);
        setEvents(eventsData);
        await loadGuestsForEvents(eventsData);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load admin data');
      } finally {
        setIsLoadingUsers(false);
        setIsLoadingEvents(false);
        setIsLoadingGuests(false);
      }
    };

    loadAdminData();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileName(user.name || '');
    setProfileAvatarUrl(user.avatarUrl || '');
  }, [user]);

  useEffect(() => {
    if (!newGuestEventId && events.length > 0) {
      setNewGuestEventId(events[0].id);
    }
  }, [events, newGuestEventId]);

  useEffect(() => {
    const loadSupportLinks = async () => {
      if (activeMenu !== 'settings' || user?.role !== 'ADMIN') {
        return;
      }
      setIsLoadingSupportLinks(true);
      try {
        const links = await apiClient.getSupportLinks();
        setSupportLinks(links);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load support links');
      } finally {
        setIsLoadingSupportLinks(false);
      }
    };
    void loadSupportLinks();
  }, [activeMenu, user]);

  if (authLoading || user?.role !== 'ADMIN') {
    return null;
  }

  const handleNavigate = (menu: AdminMenuKey) => {
    const routeMap: Record<AdminMenuKey, string> = {
      dashboard: '/admin/dashboard',
      'create-event': '/admin/events',
      'all-guests': '/admin/guests',
      users: '/admin/users',
      music: '/admin/music',
      analytics: '/admin/analytics',
      settings: '/admin/settings',
      profile: '/admin/profile',
    };

    router.push(routeMap[menu]);
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleRoleChange = async (targetUserId: string, role: 'ADMIN' | 'USER' | 'CUSTOMER') => {
    setError('');
    setUpdatingUserId(targetUserId);

    try {
      const updatedUser = await apiClient.updateUserRole(targetUserId, role);
      setUsers((prev) => prev.map((item) => (item.id === targetUserId ? updatedUser : item)));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAdminResetUserPassword = async (targetUserId: string) => {
    const newPasswordValue = (passwordDraftByUser[targetUserId] || '').trim();

    if (!newPasswordValue) {
      setError('Please enter a new password before reset.');
      return;
    }

    setError('');
    setUpdatingUserId(targetUserId);

    try {
      const result = await apiClient.adminResetUserPassword(targetUserId, newPasswordValue);
      setPasswordDraftByUser((prev) => ({ ...prev, [targetUserId]: '' }));
      alert(result.message || 'User password reset successfully');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset user password');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUploadLogo = async (file: File | null) => {
    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid image format. Please upload JPG, PNG, WEBP, or GIF.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image is too large. Maximum size is 10MB.');
      return;
    }

    setError('');
    setIsSavingProfile(true);

    try {
      const uploadedUrl = await apiClient.uploadFile(file);
      const updated = await updateProfile({ avatarUrl: uploadedUrl });
      setProfileAvatarUrl(updated.avatarUrl || uploadedUrl);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      if (Array.isArray(message)) {
        setError(message.join(', '));
      } else {
        setError(message || err?.message || 'Failed to upload profile logo');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    setError('');
    setIsSavingProfile(true);

    try {
      await updateProfile({ name: profileName, avatarUrl: profileAvatarUrl || undefined });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangeOwnPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setError('');
    setIsChangingPassword(true);

    try {
      await apiClient.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const analytics = useMemo(() => {
    const accepted = allGuests.filter((guest) => (guest.rsvpStatus || guest.status) === 'CONFIRMED' || (guest.rsvpStatus || guest.status) === 'ACCEPTED').length;
    const pending = allGuests.filter((guest) => (guest.rsvpStatus || guest.status) === 'PENDING').length;
    const declined = allGuests.filter((guest) => (guest.rsvpStatus || guest.status) === 'DECLINED').length;

    return {
      totalUsers: users.length,
      totalEvents: events.length,
      totalGuests: allGuests.length,
      accepted,
      pending,
      declined,
    };
  }, [users.length, events.length, allGuests]);

  const renderDashboard = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">កម្មវិធីរបស់ខ្ញុំ</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{analytics.totalEvents}</p>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">ចំណូលសរុប</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">$0</p>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">របាយការណ៍</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{analytics.totalGuests} Guests</p>
      </div>
    </div>
  );

  const renderCreateEvent = () => (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">បង្កើតកម្មវិធីថ្មី</h2>
      <p className="mt-2 text-gray-600">Create event for Wedding, Religious, Birthday, Housewarming, or Funeral.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/events/create">
          <Button className="bg-red-600 hover:bg-red-700">Go to Create Event</Button>
        </Link>
      </div>
    </div>
  );

  const renderGuests = () => {
    const makeInvitationLink = (guestId: string, guestEventId?: string) => {
      if (typeof window === 'undefined') return '';
      const matchedEventSlug = guestEventId ? events.find((item) => item.id === guestEventId)?.slug : undefined;
      const eventPath = matchedEventSlug || guestEventId || 'invitation';
      return decodeURI(encodeURI(`${window.location.origin}/v/${eventPath}?guestId=${guestId}`));
    };

    const handleOpenSharePopover = (guest: GuestWithContext) => {
      setShareGuestId(guest.id);
      setShareGuestName(guest.name || 'ភ្ញៀវ');
      setShareLink(makeInvitationLink(guest.id, guest.eventId));
      setShareNotice('');
    };

    const handleCopyInvitation = async () => {
      if (!shareLink) return;
      try {
        await navigator.clipboard.writeText(shareLink);
        setShareNotice('Copied to clipboard');
      } catch {
        setShareNotice('Copy failed');
      }
    };

    const handleDownloadInvitation = async () => {
      if (!shareLink || typeof window === 'undefined') return;

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=900x900&data=${encodeURIComponent(shareLink)}`;
      const guestName = shareGuestName || 'ភ្ញៀវ';

      try {
        const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = 'anonymous';
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = qrUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 1400;
        const context = canvas.getContext('2d');
        if (!context) return;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = '#111827';
        context.font = '700 64px Kantumruy Pro, sans-serif';
        context.textAlign = 'center';
        context.fillText('តំណអញ្ជើញ', 600, 110);

        context.fillStyle = '#C52133';
        context.font = '600 44px Kantumruy Pro, sans-serif';
        context.fillText(guestName, 600, 180);

        context.fillStyle = '#f3f4f6';
        context.fillRect(150, 230, 900, 900);
        context.drawImage(qrImage, 180, 260, 840, 840);

        context.fillStyle = '#6b7280';
        context.font = '400 22px Kantumruy Pro, sans-serif';
        context.fillText('Scan to view invitation', 600, 1230);

        const pngUrl = canvas.toDataURL('image/png');
        const anchor = document.createElement('a');
        anchor.href = pngUrl;
        anchor.download = `invitation-qr-${guestName.replace(/\s+/g, '-')}.png`;
        anchor.click();
        setShareNotice('QR Code downloaded');
      } catch {
        setShareNotice('Download failed');
      }
    };

    const handleRefreshInvitationLink = () => {
      if (!shareGuestId) return;
      const guest = allGuests.find((item) => item.id === shareGuestId);
      setShareLink(makeInvitationLink(shareGuestId, guest?.eventId));
      setShareNotice('Link refreshed');
    };

    const handleOpenQrModal = (guest: GuestWithContext) => {
      setQrGuestName(guest.name || 'ភ្ញៀវ');
      setQrLink(makeInvitationLink(guest.id, guest.eventId));
      setIsQrModalOpen(true);
    };

    const handleDownloadQrCode = async () => {
      if (!qrLink || typeof window === 'undefined') return;

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=${encodeURIComponent(qrLink)}`;

      try {
        const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = 'anonymous';
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = qrUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = 900;
        canvas.height = 1060;
        const context = canvas.getContext('2d');
        if (!context) return;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = '#111827';
        context.font = '700 46px Kantumruy Pro, sans-serif';
        context.textAlign = 'center';
        context.fillText('QR Code', 450, 80);

        context.fillStyle = '#ffffff';
        context.strokeStyle = '#f1f5f9';
        context.lineWidth = 2;
        context.fillRect(130, 120, 640, 640);
        context.strokeRect(130, 120, 640, 640);
        context.drawImage(qrImage, 145, 135, 610, 610);

        context.fillStyle = '#374151';
        context.font = '500 28px Kantumruy Pro, sans-serif';
        context.fillText(qrGuestName || 'ភ្ញៀវ', 450, 840);

        context.fillStyle = '#6b7280';
        context.font = '400 20px Kantumruy Pro, sans-serif';
        context.fillText('ស្កេនដើម្បីមើលធៀបអញ្ជើញ', 450, 890);

        const dataUrl = canvas.toDataURL('image/png');
        const anchor = document.createElement('a');
        anchor.href = dataUrl;
        anchor.download = `guest-qr-${(qrGuestName || 'guest').replace(/\s+/g, '-')}.png`;
        anchor.click();
      } catch {
        setError('មិនអាចទាញយក QR កូដបានទេ');
      }
    };

    const handleOpenEditGuest = (guest: GuestWithContext) => {
      setEditingGuestId(guest.id);
      setEditGuestName(guest.name || '');
      setEditGuestPhone(guest.phone || '');
      setEditGuestGroup((guest.group as 'GROOM_SIDE' | 'BRIDE_SIDE') || 'GROOM_SIDE');
      setEditGuestTag((guest.tag as 'HIGH_SCHOOL_FRIEND' | 'COLLEGE_FRIEND' | 'FRIEND' | 'TEAMWORK' | 'RELATIVE' | 'OTHERS') || 'OTHERS');
      setEditGuestGreetingMessage(guest.greetingMessage && guest.greetingMessage !== '-' ? guest.greetingMessage : '');
      setEditGuestNote(guest.note && guest.note !== '-' ? guest.note : '');
      setIsEditGuestModalOpen(true);
      setActionMenuGuestId(null);
    };

    const handleSaveEditedGuest = async () => {
      if (!editingGuestId) return;
      const name = editGuestName.trim();

      if (!name) {
        setError('សូមបញ្ចូលឈ្មោះភ្ញៀវ');
        return;
      }

      const phone = editGuestPhone.trim();

      try {
        if (editingGuestId.startsWith('local-')) {
          setAllGuests((prev) =>
            prev.map((guest) =>
              guest.id === editingGuestId
                ? {
                  ...guest,
                  name,
                  phone: phone || undefined,
                  group: editGuestGroup,
                  tag: editGuestTag,
                  greetingMessage: editGuestGreetingMessage.trim() || '-',
                  note: editGuestNote.trim() || '-',
                }
                : guest,
            ),
          );
        } else {
          const updated = await apiClient.updateGuest(editingGuestId, {
            name,
            phone: phone || undefined,
            group: editGuestGroup,
            tag: editGuestTag,
            greetingMessage: editGuestGreetingMessage.trim() || '-',
            note: editGuestNote.trim() || '-',
          });

          setAllGuests((prev) =>
            prev.map((guest) =>
              guest.id === editingGuestId
                ? {
                  ...guest,
                  ...updated,
                  group: editGuestGroup,
                  tag: editGuestTag,
                  greetingMessage: editGuestGreetingMessage.trim() || '-',
                  note: editGuestNote.trim() || '-',
                }
                : guest,
            ),
          );
        }

        setIsEditGuestModalOpen(false);
        setEditingGuestId(null);
        setEditGuestGreetingMessage('');
        setEditGuestNote('');
      } catch {
        setError('កែសម្រួលភ្ញៀវមិនជោគជ័យ');
      }
    };

    const handleDeleteOneGuest = async (guest: GuestWithContext) => {
      const confirmed = window.confirm('លុបភ្ញៀវនេះ?');
      if (!confirmed) return;

      try {
        if (!guest.id.startsWith('local-')) {
          await apiClient.deleteGuest(guest.id);
        }

        setAllGuests((prev) => prev.filter((item) => item.id !== guest.id));
        setSelectedGuestIds((prev) => prev.filter((id) => id !== guest.id));
        setActionMenuGuestId(null);
      } catch {
        setError('លុបទិន្នន័យមិនជោគជ័យ');
      }
    };

    const groupOptions = [
      { value: 'GROOM_SIDE', label: 'ខាងកូនកំលោះ' },
      { value: 'BRIDE_SIDE', label: 'ខាងកូនក្រមុំ' },
    ];

    const tagOptions = [
      { value: 'HIGH_SCHOOL_FRIEND', label: 'មិត្តភក្តិវិទ្យាល័យ' },
      { value: 'COLLEGE_FRIEND', label: 'មិត្តភក្តិឧត្តមសិក្សា' },
      { value: 'FRIEND', label: 'មិត្តភក្តិ' },
      { value: 'TEAMWORK', label: 'ការងារក្រុម' },
      { value: 'RELATIVE', label: 'សាច់ញាតិ' },
      { value: 'OTHERS', label: 'ផ្សេងៗ' },
    ];

    const normalizedGuests = allGuests.map((guest) => ({
      ...guest,
      group: guest.group || 'GROOM_SIDE',
      tag: guest.tag || 'OTHERS',
      amount: guest.amount ?? 1,
      greetingMessage: guest.greetingMessage || '-',
      note: guest.note || '-',
    }));

    const filteredGuests = normalizedGuests.filter((guest) => {
      const query = guestSearch.trim().toLowerCase();
      const searchable = [guest.name, guest.phone || '', guest.email || ''].join(' ').toLowerCase();

      const matchedSearch = !query || searchable.includes(query);
      const matchedGroup = guestGroupFilter === 'ALL' || guest.group === guestGroupFilter;
      const matchedTag = guestTagFilter === 'ALL' || guest.tag === guestTagFilter;

      return matchedSearch && matchedGroup && matchedTag;
    });

    const totalRecords = filteredGuests.length;
    const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / guestRowsPerPage);
    const safePage = totalPages === 0 ? 1 : Math.min(guestPage, totalPages);
    const startIndex = totalRecords === 0 ? 0 : (safePage - 1) * guestRowsPerPage;
    const pageGuests = filteredGuests.slice(startIndex, startIndex + guestRowsPerPage);

    const isAllOnPageSelected = pageGuests.length > 0 && pageGuests.every((item) => selectedGuestIds.includes(item.id));

    const getStatusBadge = (status: string | undefined) => {
      if (status === 'CONFIRMED' || status === 'ACCEPTED') {
        return { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' };
      }

      if (status === 'PENDING') {
        return { label: 'Pending', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' };
      }

      return { label: 'មិនបានចូលរួម', className: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' };
    };

    const getGroupLabel = (group: string) => groupOptions.find((item) => item.value === group)?.label || '-';
    const getTagLabel = (tag: string) => tagOptions.find((item) => item.value === tag)?.label || '-';
    const getGroupBadgeClass = (group: string) =>
      group === 'BRIDE_SIDE'
        ? 'bg-pink-50 text-pink-600 ring-1 ring-pink-200'
        : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200';
    const getTagBadgeClass = (tag: string) => {
      if (tag === 'HIGH_SCHOOL_FRIEND' || tag === 'COLLEGE_FRIEND') {
        return 'bg-purple-50 text-purple-600 ring-1 ring-purple-200';
      }

      if (tag === 'RELATIVE') {
        return 'bg-orange-50 text-orange-600 ring-1 ring-orange-200';
      }

      if (tag === 'TEAMWORK') {
        return 'bg-teal-50 text-teal-600 ring-1 ring-teal-200';
      }

      return 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200';
    };

    const handleCopySelected = async () => {
      if (typeof window === 'undefined') {
        return;
      }

      const selectedRows = filteredGuests.filter((item) => selectedGuestIds.includes(item.id));
      const sourceRows = selectedRows.length > 0 ? selectedRows : filteredGuests;

      if (sourceRows.length === 0) {
        setError('មិនមានភ្ញៀវសម្រាប់ចម្លង');
        setSuccess('');
        return;
      }

      const primaryEventId = sourceRows[0]?.eventId;
      const hasSameEvent = sourceRows.every((item) => item.eventId === primaryEventId);

      let guestListUrl = window.location.href;
      if (primaryEventId && hasSameEvent) {
        const selectedIdsParam = selectedRows.length > 0 ? `&guestIds=${selectedRows.map((item) => item.id).join(',')}` : '';
        guestListUrl = decodeURI(
          encodeURI(`${window.location.origin}/guest-list?event=${primaryEventId}&page=1${selectedIdsParam}`),
        );
      }

      try {
        await navigator.clipboard.writeText(guestListUrl);
        setError('');
        setSuccess('បានចម្លងតំណភ្ជាប់បញ្ជីភ្ញៀវរួចរាល់!');
      } catch {
        setError('មិនអាចចម្លងទិន្នន័យបានទេ');
        setSuccess('');
      }
    };

    const handleDeleteSelected = async () => {
      const selectedRows = filteredGuests.filter((item) => selectedGuestIds.includes(item.id));
      if (selectedRows.length === 0) {
        setError('សូមជ្រើសភ្ញៀវជាមុនសិន');
        return;
      }

      const confirmed = window.confirm(`លុបភ្ញៀវចំនួន ${selectedRows.length} នាក់?`);
      if (!confirmed) {
        return;
      }

      try {
        await Promise.all(selectedRows.map((item) => apiClient.deleteGuest(item.id)));
        setAllGuests((prev) => prev.filter((item) => !selectedGuestIds.includes(item.id)));
        setSelectedGuestIds([]);
        setError('');
      } catch {
        setError('លុបទិន្នន័យមិនជោគជ័យ');
      }
    };

    const handleSaveNewGuest = async () => {
      const name = newGuestName.trim();
      const phone = newGuestPhone.trim();

      if (!name) {
        setError('សូមបញ្ចូលឈ្មោះភ្ញៀវ');
        return;
      }

      if (!newGuestEventId) {
        setError('សូមជ្រើសរើសព្រឹត្តិការណ៍');
        return;
      }

      try {
        const createdGuest = await apiClient.createGuest(newGuestEventId, name, undefined, phone || undefined, {
          group: newGuestGroup,
          tag: newGuestTag,
          note: newGuestNote.trim() || '-',
        });

        const selectedEvent = events.find((item) => item.id === newGuestEventId);

        setAllGuests((prev) => [
          {
            ...createdGuest,
            eventTitle: selectedEvent?.title || 'ព្រឹត្តិការណ៍',
          },
          ...prev,
        ]);
        setIsAddGuestModalOpen(false);
        setNewGuestName('');
        setNewGuestPhone('');
        setNewGuestGroup('GROOM_SIDE');
        setNewGuestTag('OTHERS');
        setNewGuestNote('');
        setError('');
        setSuccess('បានបន្ថែមភ្ញៀវថ្មីរួចរាល់');
      } catch {
        setError('បន្ថែមភ្ញៀវមិនជោគជ័យ');
      }
    };

    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm font-khmer-body">
        <h2 className="mb-5 font-khmer-heading text-2xl text-gray-900">ការគ្រប់គ្រងភ្ញៀវ</h2>

        <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(220px,1.2fr)_220px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={guestSearch}
              onChange={(e) => {
                setGuestSearch(e.target.value);
                setGuestPage(1);
              }}
              placeholder="ស្វែងរក..."
              className="h-10 rounded-lg pl-10"
            />
          </div>

          <select
            value={guestGroupFilter}
            onChange={(e) => {
              setGuestGroupFilter(e.target.value);
              setGuestPage(1);
            }}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
          >
            <option value="ALL">ក្រុម</option>
            {groupOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={guestTagFilter}
            onChange={(e) => {
              setGuestTagFilter(e.target.value);
              setGuestPage(1);
            }}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
          >
            <option value="ALL">ស្លាក</option>
            {tagOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleRefreshGuests}
              disabled={isRefreshingGuests}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              title="Refresh guests"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshingGuests ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleCopySelected}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </button>

            <Button
              type="button"
              className="h-10 bg-[#C52133] px-4 text-white hover:bg-[#aa1b2a]"
              onClick={() => setIsAddGuestModalOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              បន្ថែមថ្មី
            </Button>

            <button
              type="button"
              onClick={handleDeleteSelected}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 overflow-visible">
          <div className="max-h-[420px] overflow-auto rounded-lg">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={isAllOnPageSelected}
                      onChange={(e) => {
                        const ids = pageGuests.map((item) => item.id);
                        if (e.target.checked) {
                          setSelectedGuestIds((prev) => Array.from(new Set([...prev, ...ids])));
                        } else {
                          setSelectedGuestIds((prev) => prev.filter((id) => !ids.includes(id)));
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">ឈ្មោះ</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">លេខទូរស័ព្ទ</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">ក្រុម</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">ស្លាក</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">ស្ថានភាព</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">សារជូនពរ</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">កំណត់ចំណាំ</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-700">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoadingGuests ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                      កំពុងទាញយកទិន្នន័យ...
                    </td>
                  </tr>
                ) : pageGuests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      មិនមានទិន្នន័យ។
                    </td>
                  </tr>
                ) : (
                  pageGuests.map((guest) => {
                    const statusMeta = getStatusBadge(guest.rsvpStatus || guest.status);

                    return (
                      <tr key={guest.id} className="transition-colors hover:bg-gray-50">
                        <td className="relative px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedGuestIds.includes(guest.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGuestIds((prev) => Array.from(new Set([...prev, guest.id])));
                              } else {
                                setSelectedGuestIds((prev) => prev.filter((id) => id !== guest.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{guest.name}</td>
                        <td className="px-6 py-4 text-gray-700">{guest.phone || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${getGroupBadgeClass(guest.group || 'GROOM_SIDE')}`}>
                            {getGroupLabel(guest.group)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${getTagBadgeClass(guest.tag || 'OTHERS')}`}>
                            {getTagLabel(guest.tag)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{guest.greetingMessage}</td>
                        <td className="px-6 py-4 text-gray-700">{guest.note}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
                              title="Share"
                              onClick={() => handleOpenSharePopover(guest)}
                            >
                              <Send className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
                              title="QR"
                              onClick={() => handleOpenQrModal(guest)}
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
                              title="Menu"
                              onClick={() =>
                                setActionMenuGuestId((prev) => (prev === guest.id ? null : guest.id))
                              }
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>

                          <AnimatePresence>
                            {actionMenuGuestId === guest.id && (
                              <motion.div
                                ref={actionMenuRef}
                                initial={{ opacity: 0, y: -12, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -12, scale: 0.9 }}
                                transition={{
                                  duration: 0.2,
                                  type: "spring",
                                  stiffness: 350,
                                  damping: 30
                                }}
                                className="absolute right-0 bottom-full z-50 w-48 mb-2 rounded-xl border border-gray-100 bg-white shadow-lg font-khmer-body"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditGuest(guest)}
                                  className="flex w-full items-center gap-3 rounded-t-xl px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:bg-amber-50"
                                >
                                  <Pencil className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                  <span>កែសម្រួលភ្ញៀវ</span>
                                </button>

                                <div className="border-t border-gray-100" />

                                <button
                                  type="button"
                                  onClick={() => handleDeleteOneGuest(guest)}
                                  className="flex w-full items-center gap-3 rounded-b-xl px-4 py-3 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 flex-shrink-0" />
                                  <span>លុបភ្ញៀវនេះ?</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence>
          {shareGuestId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 p-4"
              onClick={() => setShareGuestId(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-xl"
              >
                <h3 className="font-khmer-body text-xl font-semibold text-gray-900">តំណអញ្ជើញ</h3>
                {shareNotice && <p className="mt-1 text-sm text-emerald-600">{shareNotice}</p>}

                <div className="mt-4 flex items-start gap-4">
                  <div className="flex-1 rounded-2xl bg-gray-100 p-4 text-sm leading-relaxed text-gray-700 break-all">
                    {shareLink}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleCopyInvitation}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#b91c2f] bg-[#C52133] text-white transition-colors hover:bg-[#ad1d2c]"
                      title="Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadInvitation}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-100 text-[#C52133] transition-colors hover:bg-rose-200"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshInvitationLink}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-900 transition-colors hover:bg-gray-200"
                      title="Refresh"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isQrModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
              onClick={() => setIsQrModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-khmer-body text-xl font-semibold text-gray-900">QR Code</h3>
                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=${encodeURIComponent(qrLink)}`}
                    alt="Guest QR Code"
                    className="mx-auto h-64 w-64 rounded-xl bg-white object-contain"
                  />
                </div>

                <p className="mt-3 text-center text-sm text-gray-700">{qrGuestName}</p>
                <p className="mt-1 text-center text-xs text-gray-500">ស្កេនដើម្បីមើលធៀបអញ្ជើញ</p>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleDownloadQrCode}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#C52133] bg-white px-8 py-3 font-khmer-body text-sm font-semibold text-[#C52133] transition-colors hover:bg-rose-50"
                  >
                    <Download className="h-4 w-4" />
                    ទាញយក QR កូដ
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <p>សរុប: {totalRecords} កំណត់ត្រា</p>

          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={guestRowsPerPage}
              onChange={(e) => {
                setGuestRowsPerPage(Number(e.target.value));
                setGuestPage(1);
              }}
              className="h-8 rounded-md border border-gray-200 bg-white px-2"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <span className="ml-2">Page {totalPages === 0 ? 1 : safePage} of {totalPages}</span>

            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white disabled:opacity-40"
              disabled={totalPages === 0 || safePage <= 1}
              onClick={() => setGuestPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white disabled:opacity-40"
              disabled={totalPages === 0 || safePage >= totalPages}
              onClick={() => setGuestPage((prev) => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isEditGuestModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
              onClick={() => setIsEditGuestModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl font-khmer-body"
              >
                <h3 className="font-khmer-heading text-2xl text-black">កែសម្រួលភ្ញៀវ</h3>
                <p className="mt-2 text-sm text-gray-500">បំពេញព័ត៌មានលម្អិតរបស់ភ្ញៀវនៅខាងក្រោម</p>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-700">* ឈ្មោះ</label>
                    <Input value={editGuestName} onChange={(e) => setEditGuestName(e.target.value)} placeholder="បញ្ចូលឈ្មោះ" className="border-gray-200 bg-gray-50" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-gray-700">ទូរស័ព្ទ (មិនចាំបាច់)</label>
                    <Input value={editGuestPhone} onChange={(e) => setEditGuestPhone(e.target.value)} placeholder="បញ្ចូលលេខទូរស័ព្ទ។" className="border-gray-200 bg-gray-50" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">ក្រុម (មិនចាំបាច់)</label>
                    <select
                      value={editGuestGroup}
                      onChange={(e) => setEditGuestGroup(e.target.value as 'GROOM_SIDE' | 'BRIDE_SIDE')}
                      className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm"
                    >
                      <option value="GROOM_SIDE">ខាងកូនកំលោះ</option>
                      <option value="BRIDE_SIDE">ខាងកូនក្រមុំ</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">ស្លាក (មិនចាំបាច់)</label>
                    <select
                      value={editGuestTag}
                      onChange={(e) =>
                        setEditGuestTag(
                          e.target.value as
                          | 'HIGH_SCHOOL_FRIEND'
                          | 'COLLEGE_FRIEND'
                          | 'FRIEND'
                          | 'TEAMWORK'
                          | 'RELATIVE'
                          | 'OTHERS',
                        )
                      }
                      className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm"
                    >
                      <option value="HIGH_SCHOOL_FRIEND">មិត្តភក្តិវិទ្យាល័យ</option>
                      <option value="COLLEGE_FRIEND">មិត្តភក្តិឧត្តមសិក្សា</option>
                      <option value="FRIEND">មិត្តភក្តិ</option>
                      <option value="TEAMWORK">ការងារក្រុម</option>
                      <option value="RELATIVE">សាច់ញាតិ</option>
                      <option value="OTHERS">ផ្សេងៗ</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-gray-700">សារជូនពរ (មិនចាំបាច់)</label>
                    <Input
                      value={editGuestGreetingMessage}
                      onChange={(e) => setEditGuestGreetingMessage(e.target.value)}
                      placeholder="បញ្ចូលសារជូនពរ"
                      className="border-gray-200 bg-gray-50"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-gray-700">កំណត់ចំណាំ (មិនចាំបាច់)</label>
                    <textarea
                      value={editGuestNote}
                      onChange={(e) => setEditGuestNote(e.target.value)}
                      className="min-h-24 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-300"
                      placeholder="បញ្ចូលកំណត់ចំណាំ"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditGuestModalOpen(false)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    ✕ បោះបង់
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditedGuest}
                    className="rounded-md bg-[#C52133] px-4 py-2 text-sm text-white hover:bg-[#aa1b2a]"
                  >
                    រក្សាទុក
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {isAddGuestModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-sm"
              >
                <h3 className="font-khmer-heading text-2xl text-black">បន្ថែមភ្ញៀវថ្មី</h3>
                <p className="mt-2 text-sm text-gray-500">បំពេញព័ត៌មានលម្អិតរបស់ភ្ញៀវនៅខាងក្រោម</p>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-gray-700">* ព្រឹត្តិការណ៍</label>
                    <select
                      value={newGuestEventId}
                      onChange={(e) => setNewGuestEventId(e.target.value)}
                      disabled={events.length === 0}
                      className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm"
                    >
                      {events.length === 0 && <option value="">មិនមានព្រឹត្តិការណ៍</option>}
                      {events.map((eventItem) => (
                        <option key={eventItem.id} value={eventItem.id}>
                          {eventItem.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">* ឈ្មោះ</label>
                    <Input value={newGuestName} onChange={(e) => setNewGuestName(e.target.value)} placeholder="បញ្ចូលឈ្មោះ" className="border-gray-200 bg-gray-50" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-gray-700">ទូរស័ព្ទ (មិនចាំបាច់)</label>
                    <Input value={newGuestPhone} onChange={(e) => setNewGuestPhone(e.target.value)} placeholder="បញ្ចូលលេខទូរស័ព្ទ។" className="border-gray-200 bg-gray-50" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">ក្រុម (មិនចាំបាច់)</label>
                    <select
                      value={newGuestGroup}
                      onChange={(e) => setNewGuestGroup(e.target.value as 'GROOM_SIDE' | 'BRIDE_SIDE')}
                      className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm"
                    >
                      <option value="GROOM_SIDE">ខាងកូនកំលោះ</option>
                      <option value="BRIDE_SIDE">ខាងកូនក្រមុំ</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">ស្លាក (មិនចាំបាច់)</label>
                    <select
                      value={newGuestTag}
                      onChange={(e) =>
                        setNewGuestTag(
                          e.target.value as
                          | 'HIGH_SCHOOL_FRIEND'
                          | 'COLLEGE_FRIEND'
                          | 'FRIEND'
                          | 'TEAMWORK'
                          | 'RELATIVE'
                          | 'OTHERS',
                        )
                      }
                      className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm"
                    >
                      <option value="HIGH_SCHOOL_FRIEND">មិត្តភក្តិវិទ្យាល័យ</option>
                      <option value="COLLEGE_FRIEND">មិត្តភក្តិឧត្តមសិក្សា</option>
                      <option value="FRIEND">មិត្តភក្តិ</option>
                      <option value="TEAMWORK">ការងារក្រុម</option>
                      <option value="RELATIVE">សាច់ញាតិ</option>
                      <option value="OTHERS">ផ្សេងៗ</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-gray-700">កំណត់ចំណាំ (មិនចាំបាច់)</label>
                    <textarea
                      value={newGuestNote}
                      onChange={(e) => setNewGuestNote(e.target.value)}
                      className="min-h-24 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-300"
                      placeholder="បញ្ចូលកំណត់ចំណាំ"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddGuestModalOpen(false)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    ✕ បោះបង់
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewGuest}
                    disabled={events.length === 0}
                    className="rounded-md bg-[#C52133] px-4 py-2 text-sm text-white hover:bg-[#aa1b2a]"
                  >
                    បង្កើតថ្មី
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Users</h2>
        <Link href="/register">
          <Button variant="outline">Create User</Button>
        </Link>
      </div>

      {isLoadingUsers ? (
        <div className="px-6 py-10 text-center text-gray-600">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-600">No users found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((listedUser) => (
                <tr key={listedUser.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{listedUser.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{listedUser.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{listedUser.phone || '-'}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{listedUser.role}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={listedUser.role}
                        onChange={(e) => handleRoleChange(listedUser.id, e.target.value as 'ADMIN' | 'USER' | 'CUSTOMER')}
                        disabled={updatingUserId === listedUser.id || listedUser.id === user.id}
                        className="h-9 rounded-md border border-gray-300 px-2 text-sm"
                      >
                        <option value="USER">USER</option>
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>

                      {listedUser.id !== user.id && (
                        <>
                          <Input
                            type="password"
                            placeholder="New password"
                            value={passwordDraftByUser[listedUser.id] || ''}
                            onChange={(e) =>
                              setPasswordDraftByUser((prev) => ({
                                ...prev,
                                [listedUser.id]: e.target.value,
                              }))
                            }
                            className="h-9 w-40"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingUserId === listedUser.id}
                            onClick={() => handleAdminResetUserPassword(listedUser.id)}
                          >
                            Reset Password
                          </Button>
                        </>
                      )}

                      {listedUser.id === user.id && <span className="text-xs text-gray-500">(You)</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Total Users</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Total Events</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{analytics.totalEvents}</p>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Total Guests</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{analytics.totalGuests}</p>
      </div>
    </div>
  );

  const handleCreateSupportLink = async () => {
    const label = newSupportLabel.trim();
    const url = newSupportUrl.trim();
    if (!label || !url) {
      setError('Please provide link label and URL.');
      return;
    }

    setError('');
    setIsSavingSupportLink(true);
    try {
      const created = await apiClient.createSupportLink({
        label,
        url,
        platform: newSupportPlatform,
        isActive: true,
        sortOrder: supportLinks.length,
      });
      setSupportLinks((prev) => [...prev, created]);
      setNewSupportLabel('');
      setNewSupportUrl('');
      setSuccess('Support link created');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create support link');
    } finally {
      setIsSavingSupportLink(false);
    }
  };

  const handleDeleteSupportLink = async (id: string) => {
    setError('');
    try {
      await apiClient.deleteSupportLink(id);
      setSupportLinks((prev) => prev.filter((item) => item.id !== id));
      setSuccess('Support link deleted');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete support link');
    }
  };

  const handleToggleSupportLink = async (id: string, isActive: boolean) => {
    setError('');
    try {
      const updated = await apiClient.updateSupportLink(id, { isActive: !isActive });
      setSupportLinks((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update support link');
    }
  };

  const renderSettings = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Contact Links</h2>
        <p className="mt-1 text-sm text-gray-600">Create/Delete links shown as floating contact buttons on events pages.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input
            value={newSupportLabel}
            onChange={(e) => setNewSupportLabel(e.target.value)}
            placeholder="Label (Telegram/Facebook)"
          />
          <Input
            value={newSupportUrl}
            onChange={(e) => setNewSupportUrl(e.target.value)}
            placeholder="https://..."
            className="md:col-span-2"
          />
          <select
            value={newSupportPlatform}
            onChange={(e) => setNewSupportPlatform(e.target.value)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="telegram">Telegram</option>
            <option value="facebook">Facebook</option>
            <option value="messenger">Messenger</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="mt-3">
          <Button
            type="button"
            onClick={handleCreateSupportLink}
            disabled={isSavingSupportLink}
            className="bg-[#C52133] text-white hover:bg-[#aa1b2a]"
          >
            {isSavingSupportLink ? 'Saving...' : 'Create Link'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Existing links</h3>
        {isLoadingSupportLinks ? (
          <p className="mt-3 text-sm text-gray-600">Loading links...</p>
        ) : supportLinks.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No links yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {supportLinks.map((link) => (
              <div key={link.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{link.label}</p>
                  <p className="max-w-xl truncate text-xs text-gray-600">{link.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleSupportLink(link.id, link.isActive)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                      link.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {link.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleDeleteSupportLink(link.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Admin Profile</h2>

        <div className="mt-4 flex items-center gap-4">
          {profileAvatarUrl ? (
            <img src={profileAvatarUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-semibold text-gray-600">
              {user.name?.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <label className="mb-2 block text-sm text-gray-600">Upload Image Logo (Profile)</label>
            <Input
              type="file"
              accept="image/*"
              disabled={isSavingProfile}
              onChange={(e) => handleUploadLogo(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-gray-600">Name</label>
            <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} disabled={isSavingProfile} />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-600">Email</label>
            <Input value={user.email} readOnly disabled />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-600">Role</label>
            <Input value={user.role} readOnly disabled />
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-red-600 hover:bg-red-700">
            {isSavingProfile ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Change My Password</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isChangingPassword}
          />
          <Input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isChangingPassword}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isChangingPassword}
          />
        </div>

        <div className="mt-4">
          <Button onClick={handleChangeOwnPassword} disabled={isChangingPassword} variant="outline">
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-700">Name: {user.name}</p>
        <p className="text-sm text-gray-700">Email: {user.email}</p>
        <p className="text-sm text-gray-700">Role: {user.role}</p>
        <Link href="/profile" className="mt-4 inline-block">
          <Button variant="outline">Open User Profile Page</Button>
        </Link>
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeMenu === 'dashboard') return renderDashboard();
    if (activeMenu === 'create-event') return renderCreateEvent();
    if (activeMenu === 'all-guests') return renderGuests();
    if (activeMenu === 'users') return renderUsers();
    if (activeMenu === 'analytics') return renderAnalytics();
    if (activeMenu === 'settings') return renderSettings();
    return renderProfile();
  };

  return (
    <div className="min-h-screen bg-gray-50 font-khmer-body dark:bg-slate-950 dark:text-slate-100">
      <div className="flex">
        <AdminSidebar
          userName={user.name}
          role={user.role}
          avatarUrl={user.avatarUrl}
          activeItem={activeMenu}
          onSelect={handleNavigate}
          recentEvents={events.slice(0, 3).map((event) => ({ id: event.id, name: event.title }))}
        />

        <main className="flex-1 p-6">
          <header className="mb-6 flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-6 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-slate-400">Manage your event platform from one place</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline">Go to Website</Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </header>

          {success && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">{success}</div>}
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

          {(isLoadingEvents || isLoadingUsers) && activeMenu !== 'users' && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 text-gray-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Loading admin data...</div>
          )}

          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export const AdminApp = withProtectedRoute(AdminAppBase);
