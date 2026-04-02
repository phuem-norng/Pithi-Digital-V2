'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient, Event } from '@/lib/api-client';
import DigitalInvitation from '@/components/invitations/DigitalInvitation';

export default function InvitationPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const data = await apiClient.getPublicEvent(eventId);
        setEvent(data);
      } catch {
        setError('រកមិនឃើញលិខិតអញ្ជើញ');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-khmer-body">
        <p className="text-gray-600">កំពុងទាញយកលិខិតអញ្ជើញ...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-khmer-body">
        <p className="text-red-600">{error || 'រកមិនឃើញលិខិតអញ្ជើញ'}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden overscroll-none flex items-center justify-center font-khmer-body">
      <div className="fixed inset-0 -z-10">
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100" />
        )}
      </div>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[40px]" />

      <main className="scrollbar-hide relative z-10 w-full max-w-[450px] h-[90vh] overflow-y-auto overscroll-contain rounded-[40px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <DigitalInvitation eventData={event} />
      </main>
    </div>
  );
}
