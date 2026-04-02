'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Copy, Search, Send, Users, X } from 'lucide-react';
import { apiClient, Event, Guest } from '@/lib/api-client';
import { withProtectedRoute } from '@/lib/protected-route';
import { Input } from '@/components/ui/input';

type GuestWithUiFields = Guest & {
  group?: string;
  tag?: string;
};

function GuestListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const eventId = searchParams.get('event') || '';
  const guestIdsParam = searchParams.get('guestIds') || '';
  const guestIds = useMemo(
    () => guestIdsParam.split(',').map((item) => item.trim()).filter(Boolean),
    [guestIdsParam],
  );

  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const pageSize = 10;

  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<GuestWithUiFields[]>([]);
  const [guestSearch, setGuestSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shareGuestId, setShareGuestId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [shareNotice, setShareNotice] = useState('');

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

  useEffect(() => {
    const load = async () => {
      if (!eventId) {
        setError('Missing event id');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const [eventData, guestsData] = await Promise.all([
          apiClient.getEvent(eventId),
          apiClient.getEventGuests(eventId),
        ]);

        setEvent(eventData);
        setGuests(guestsData as GuestWithUiFields[]);
      } catch {
        setError('មិនអាចទាញយកបញ្ជីភ្ញៀវបានទេ');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [eventId]);

  const filteredGuests = useMemo(() => {
    const selectedFiltered =
      guestIds.length === 0
        ? guests
        : guests.filter((item) => {
            const selectedSet = new Set(guestIds);
            return selectedSet.has(item.id);
          });

    return selectedFiltered.filter((guest) => {
      const query = guestSearch.trim().toLowerCase();
      const searchable = [guest.name, guest.phone || '', guest.email || ''].join(' ').toLowerCase();
      const matchedSearch = !query || searchable.includes(query);
      return matchedSearch;
    });
  }, [guestIds, guests, guestSearch]);

  const totalRecords = filteredGuests.length;
  const totalPages = totalRecords === 0 ? 1 : Math.ceil(totalRecords / pageSize);
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageGuests = filteredGuests.slice(startIndex, startIndex + pageSize);

  const setPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage));
    router.push(`/guest-list?${params.toString()}`);
  };

  const getStatusBadge = (status: string | undefined) => {
    if (status === 'CONFIRMED') {
      return { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' };
    }

    if (status === 'ACCEPTED') {
      return { label: 'Accepted', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' };
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

  const handleShareGuest = (guest: GuestWithUiFields) => {
    if (typeof window === 'undefined') {
      return;
    }

    const slugOrEventId = event?.slug || eventId;
    const invitationLink = decodeURI(
      encodeURI(`${window.location.origin}/v/${slugOrEventId}?guestId=${guest.id}`),
    );

    setShareGuestId(guest.id);
    setShareLink(invitationLink);
    setShareNotice('');
  };

  const handleCopyInvitationLink = async () => {
    if (!shareLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink);
      setError('');
      setSuccess('បានចម្លងតំណអញ្ជើញរួចរាល់!');
      setShareNotice('បានចម្លងរួចរាល់');
    } catch {
      setSuccess('');
      setError('មិនអាចចម្លងតំណអញ្ជើញបានទេ');
      setShareNotice('មិនអាចចម្លងបានទេ');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 font-khmer-body">
        <div className="mx-auto max-w-5xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-gray-600">កំពុងទាញយកបញ្ជីភ្ញៀវ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-khmer-body">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">បញ្ជីភ្ញៀវ</h1>
              <p className="mt-1 text-sm text-gray-600">
                {event?.title || 'Event'}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
              <Users className="h-4 w-4" />
              {guestIds.length > 0
                ? `បានជ្រើស ${filteredGuests.length} នាក់`
                : `ភ្ញៀវសរុប ${filteredGuests.length} នាក់`}
            </div>
          </div>

          {success && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}
          {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(220px,1.2fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={guestSearch}
              onChange={(event) => {
                setGuestSearch(event.target.value);
                setPage(1);
              }}
              placeholder="ស្វែងរក..."
              className="h-10 rounded-lg pl-10"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">ឈ្មោះ</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">ទូរស័ព្ទ</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">ក្រុម</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">ស្លាក</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">ស្ថានភាព</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">សារជូនពរ</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">កំណត់ចំណាំ</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageGuests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    មិនមានទិន្នន័យភ្ញៀវទេ
                  </td>
                </tr>
              ) : (
                pageGuests.map((guest) => {
                  const statusMeta = getStatusBadge(guest.rsvpStatus || guest.status);
                  const groupValue = guest.group || 'GROOM_SIDE';
                  const tagValue = guest.tag || 'OTHERS';

                  return (
                    <tr key={guest.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{guest.name}</td>
                      <td className="px-4 py-3 text-gray-700">{guest.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${getGroupBadgeClass(groupValue)}`}>
                          {getGroupLabel(groupValue)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${getTagBadgeClass(tagValue)}`}>
                          {getTagLabel(tagValue)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{guest.greetingMessage || '-'}</td>
                      <td className="px-4 py-3 text-gray-700">{guest.note || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
                            title="Share"
                            onClick={() => handleShareGuest(guest)}
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
            <span>
              Page {safePage} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {shareGuestId && (
          <div
            className="fixed inset-0 z-70 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[1px]"
            onClick={() => setShareGuestId(null)}
          >
            <div
              className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-khmer-body text-2xl font-semibold text-gray-900">តំណអញ្ជើញ</h3>
                  <p className="mt-1 text-sm text-gray-500">ចែករំលែកតំណនេះទៅភ្ញៀវ ឬចម្លងរក្សាទុក</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShareGuestId(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {shareNotice && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{shareNotice}</p>}

              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Invitation Link</p>
                <p className="text-sm leading-relaxed text-gray-700 break-all">{shareLink}</p>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShareGuestId(null)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  បិទ
                </button>
                <button
                  type="button"
                  onClick={handleCopyInvitationLink}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#b91c2f] bg-[#C52133] px-4 text-sm font-medium text-white transition-colors hover:bg-[#ad1d2c]"
                  title="Copy"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withProtectedRoute(GuestListPage);
