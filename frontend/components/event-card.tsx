'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PartyPopper, Users } from 'lucide-react';
import { format } from 'date-fns';
import { km } from 'date-fns/locale';
import { Event } from '@/lib/api-client';

type EventCardProps = {
  event: Event;
};

const KHMER_NUMERALS: Record<string, string> = {
  '0': '០',
  '1': '១',
  '2': '២',
  '3': '៣',
  '4': '៤',
  '5': '៥',
  '6': '៦',
  '7': '៧',
  '8': '៨',
  '9': '៩',
};

function toKhmerDigits(value: string) {
  return value.replace(/\d/g, (digit) => KHMER_NUMERALS[digit] || digit);
}

function formatKhmerDate(dateInput: string) {
  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return dateInput;
  }

  const weekday = format(date, 'EEEE', { locale: km });
  const day = toKhmerDigits(format(date, 'd', { locale: km }));
  const month = format(date, 'MMMM', { locale: km });

  return `${weekday} ទី${day} ខែ${month}`;
}

function getEventTypeLabel(event: Event) {
  const metadataCategory = event.metadata?.category;
  if (typeof metadataCategory === 'string' && metadataCategory.trim()) {
    return metadataCategory;
  }

  if (event.eventType?.name) {
    return event.eventType.name;
  }

  const typeMap: Record<string, string> = {
    WEDDING: 'ពិធីរៀបមង្គលការ',
    CEREMONY: 'បុណ្យទូទៅ',
    BIRTHDAY: 'ខួបកំណើត',
    HOUSEWARMING: 'ឡើងផ្ទះ',
    FUNERAL: 'បុណ្យសព',
    OTHER: 'ព្រឹត្តិការណ៍',
  };

  return typeMap[event.type] || 'ព្រឹត្តិការណ៍';
}

function extractCoupleNames(title: string) {
  const normalized = title.replace(/^ពិធីរៀបមង្គលការ\s*/u, '').trim();

  if (normalized.includes(' និង ')) {
    const [groom, bride] = normalized.split(' និង ').map((part) => part.trim());
    return { groom: groom || 'Groom', bride: bride || 'Bride' };
  }

  if (normalized.includes('&')) {
    const [groom, bride] = normalized.split('&').map((part) => part.trim());
    return { groom: groom || 'Groom', bride: bride || 'Bride' };
  }

  return { groom: normalized || 'Groom', bride: 'Bride' };
}

export function EventCard({ event }: EventCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  const { isCompleted, days, hours, minutes, seconds } = useMemo(() => {
    const target = new Date(event.date).getTime();
    const diff = target - now;
    const remaining = Math.max(0, diff);

    const totalSeconds = Math.floor(remaining / 1000);
    return {
      isCompleted: diff <= 0,
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }, [event.date, now]);

  const eventTypeLabel = getEventTypeLabel(event);
  const displayDate = formatKhmerDate(event.date);
  const { groom, bride } = extractCoupleNames(event.title);

  return (
    <Link href={`/events/${event.id}`} className="block">
      <article className="overflow-hidden rounded-2xl bg-white shadow-sm transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
        <div className="relative h-72 overflow-hidden rounded-2xl">
          <img
            src={event.coverImage || '/file.svg'}
            alt={event.title}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4">
            {isCompleted ? (
              <div className="mx-auto max-w-[220px] rounded-2xl border border-white/40 bg-emerald-400/25 px-4 py-4 text-center text-white shadow-lg backdrop-blur-xl">
                <p className="font-khmer-heading text-base">Completed</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Days', value: days },
                  { label: 'Hours', value: String(hours).padStart(2, '0') },
                  { label: 'Minutes', value: String(minutes).padStart(2, '0') },
                  { label: 'Seconds', value: String(seconds).padStart(2, '0') },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/35 bg-white/15 px-2 py-3 text-center text-white shadow-md backdrop-blur-xl"
                  >
                    <p className="text-lg font-bold leading-none">{item.value}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-white/90 font-khmer-body">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-3 flex items-center justify-between px-3">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white backdrop-blur-md">
              {eventTypeLabel}
            </span>
            <span className="rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur-sm font-khmer-body">
              {displayDate}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4">
          <div className="rounded-xl bg-pink-100 p-2 text-pink-600">
            <PartyPopper className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-khmer-heading text-base font-bold text-gray-900 line-clamp-2">
              ពិធីរៀបមង្គលការ {groom} និង {bride}
            </h3>
            <p className="mt-2 flex items-center gap-1 text-sm text-gray-500 font-khmer-body">
              <Users className="h-4 w-4" />
              ចំនួនភ្ញៀវ {event.guestCount ?? 0} នាក់
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}
