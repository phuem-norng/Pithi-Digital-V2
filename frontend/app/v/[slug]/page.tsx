'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CalendarDays, MapPin, Phone, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, Event } from '@/lib/api-client';

export default function PublicEventBySlugPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const guestIdFromLink = searchParams.get('guestId') || '';

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLockedGuest, setIsLockedGuest] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'CONFIRMED' | 'DECLINED'>('CONFIRMED');
  const [adultCount, setAdultCount] = useState(1);
  const [greetingMessage, setGreetingMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const localizeApiError = (rawMessage: unknown, fallback: string) => {
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : String(rawMessage || fallback);

    if (message.toLowerCase().includes('guest name already exists')) {
      return 'មានឈ្មោះភ្ញៀវនេះរួចហើយ សម្រាប់ព្រឹត្តិការណ៍នេះ';
    }

    return message;
  };

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const data = await apiClient.getPublicEventBySlug(slug);
        setEvent(data);

        if (guestIdFromLink) {
          const invitedGuest = await apiClient.getPublicGuestBySlug(slug, guestIdFromLink);
          setName(invitedGuest.name || '');
          setPhone(invitedGuest.phone || '');
          if (invitedGuest.rsvpStatus === 'CONFIRMED' || invitedGuest.rsvpStatus === 'DECLINED') {
            setRsvpStatus(invitedGuest.rsvpStatus);
          }
          setAdultCount(Number(invitedGuest.adultCount || 1));
          setGreetingMessage(invitedGuest.greetingMessage || '');
          setIsLockedGuest(true);
        }
      } catch {
        setError('រកមិនឃើញទំព័រអញ្ជើញនេះ');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      loadEvent();
    }
  }, [slug, guestIdFromLink]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMessage('');

    if (!name.trim()) {
      setSubmitMessage('សូមបញ្ចូលឈ្មោះ');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.submitPublicRsvpBySlug(slug, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        guestId: guestIdFromLink || undefined,
        rsvpStatus,
        adultCount,
        greetingMessage: greetingMessage.trim() || undefined,
      });

      setSubmitMessage('បានផ្ញើ RSVP រួចរាល់។ សូមអរគុណ!');
      if (!isLockedGuest) {
        setName('');
        setPhone('');
        setGreetingMessage('');
      }
    } catch (submitError: any) {
      const message = submitError?.response?.data?.message;
      setSubmitMessage(localizeApiError(message, 'ផ្ញើ RSVP មិនជោគជ័យ'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-khmer-body">
        <p className="text-gray-600">កំពុងទាញយកទិន្នន័យ...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-khmer-body">
        <p className="text-red-600">{error || 'រកមិនឃើញទំព័រ'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 font-khmer-body">
      <main className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="space-y-6 p-8">
          <h1 className="font-khmer-heading text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            {event.title}
          </h1>

          <div className="space-y-3 text-gray-700">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              <span>
                {new Date(event.date).toLocaleString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{event.address || event.location}</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-5">
            <h2 className="text-lg font-semibold text-gray-900">RSVP</h2>

            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ឈ្មោះ"
                className="pl-10"
                disabled={isSubmitting || isLockedGuest}
                required
              />
            </div>

            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="លេខទូរស័ព្ទ (ជាជម្រើស)"
                className="pl-10"
                maxLength={15}
                disabled={isSubmitting || isLockedGuest}
              />
            </div>

            {isLockedGuest && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                អញ្ជើញសម្រាប់ភ្ញៀវនេះតែម្នាក់ប៉ុណ្ណោះ មិនអាចប្តូរឈ្មោះ ឬ លេខទូរស័ព្ទបានទេ។
              </p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                value={rsvpStatus}
                onChange={(e) => setRsvpStatus(e.target.value as 'CONFIRMED' | 'DECLINED')}
                disabled={isSubmitting}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
              >
                <option value="CONFIRMED">ចូលរួម</option>
                <option value="DECLINED">មិនចូលរួម</option>
              </select>

              <Input
                type="number"
                min={0}
                value={adultCount}
                onChange={(e) => setAdultCount(Number(e.target.value))}
                placeholder="ចំនួននាក់"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">សារជូនពរ (ជាជម្រើស)</label>
              <textarea
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                rows={4}
                disabled={isSubmitting}
                placeholder="សូមសរសេរសារជូនពររបស់អ្នក..."
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>

            {submitMessage && (
              <p className={`text-sm ${submitMessage.includes('រួចរាល់') ? 'text-green-600' : 'text-red-600'}`}>
                {submitMessage}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 text-white hover:bg-red-700"
            >
              {isSubmitting ? 'កំពុងផ្ញើ...' : 'ផ្ញើ RSVP'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
