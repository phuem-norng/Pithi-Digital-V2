'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PartyPopper, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, km } from 'date-fns/locale';
import { Event } from '@/lib/api-client';
import { getSeededCoverImage } from '@/lib/assets';
import { useLanguage } from '@/lib/language-context';

type EventCardProps = {
  event: Event;
  onDelete?: (event: Event) => void;
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

function formatDisplayDate(dateInput: string, isKhmer: boolean) {
  if (!isKhmer) {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
      return dateInput;
    }
    return format(date, 'EEEE, MMM d', { locale: enUS });
  }
  return formatKhmerDate(dateInput);
}

function getEventTypeLabel(event: Event, isKhmer: boolean) {
  const enTypeMap: Record<string, string> = {
    WEDDING: 'Wedding',
    CEREMONY: 'Ceremony',
    BIRTHDAY: 'Birthday',
    HOUSEWARMING: 'Housewarming',
    FUNERAL: 'Funeral',
    OTHER: 'Event',
  };
  const kmTypeMap: Record<string, string> = {
    WEDDING: 'អាពាហ៍ពិពាហ៍',
    CEREMONY: 'បុណ្យទូទៅ',
    BIRTHDAY: 'ខួបកំណើត',
    HOUSEWARMING: 'ឡើងផ្ទះ',
    FUNERAL: 'បុណ្យសព',
    OTHER: 'ព្រឹត្តិការណ៍',
  };

  const metadataCategory = event.metadata?.category;
  if (isKhmer && typeof metadataCategory === 'string' && metadataCategory.trim()) {
    return metadataCategory;
  }

  if (event.eventType?.name) {
    return event.eventType.name;
  }

  return (isKhmer ? kmTypeMap[event.type] : enTypeMap[event.type]) || (isKhmer ? 'ព្រឹត្តិការណ៍' : 'Event');
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

export function EventCard({ event, onDelete }: EventCardProps) {
  const { language } = useLanguage();
  const isKhmer = language === 'km';
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  const { phase, days, hours, minutes, seconds } = useMemo(() => {
    const startAt = new Date(event.date).getTime();
    const rawEndDate =
      event.metadata && typeof event.metadata === 'object'
        ? (event.metadata as Record<string, unknown>).eventEndDate
        : undefined;
    const parsedEndAt =
      typeof rawEndDate === 'string' && rawEndDate.trim().length > 0
        ? new Date(rawEndDate).getTime()
        : Number.NaN;
    const endAt = Number.isFinite(parsedEndAt) ? parsedEndAt : startAt;

    const phase: 'upcoming' | 'running' | 'ended' =
      now < startAt ? 'upcoming' : now > endAt ? 'ended' : 'running';

    const diff = startAt - now;
    const remaining = Math.max(0, diff);

    const totalSeconds = Math.floor(remaining / 1000);
    return {
      phase,
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }, [event.date, event.metadata, now]);

  const eventTypeLabel = getEventTypeLabel(event, isKhmer);
  const displayDate = formatDisplayDate(event.date, isKhmer);
  const { groom, bride } = extractCoupleNames(event.title);

  return (
    <Link href={`/events/${event.id}`} className="block">
      <article className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
        <div className="relative h-72 overflow-hidden rounded-2xl">
          <img
            src={event.coverImage || getSeededCoverImage(event.id || event.title || event.date)}
            alt={event.title}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4">
            {phase === 'ended' ? (
              <div className="mx-auto max-w-[220px] rounded-2xl border border-white/40 bg-emerald-400/25 px-4 py-4 text-center text-white shadow-lg backdrop-blur-xl">
                <p className="font-khmer-heading text-base">{isKhmer ? 'កម្មវិធីបានបញ្ចប់' : 'Event ended'}</p>
              </div>
            ) : phase === 'running' ? (
              <div className="mx-auto max-w-[240px] rounded-2xl border border-white/40 bg-emerald-400/25 px-4 py-4 text-center text-white shadow-lg backdrop-blur-xl">
                <p className="font-khmer-heading text-base">{isKhmer ? 'កម្មវិធីកំពុងដំណើរការ' : 'Event in progress'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: isKhmer ? 'ថ្ងៃ' : 'Days', value: days },
                  { label: isKhmer ? 'ម៉ោង' : 'Hours', value: String(hours).padStart(2, '0') },
                  { label: isKhmer ? 'នាទី' : 'Minutes', value: String(minutes).padStart(2, '0') },
                  { label: isKhmer ? 'វិនាទី' : 'Seconds', value: String(seconds).padStart(2, '0') },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/35 bg-white/15 px-2 py-3 text-center text-white shadow-md backdrop-blur-xl"
                  >
                    <p className="text-lg font-bold leading-none">{item.value}</p>
                    <p className="mt-1 text-[10px] tracking-wide text-white/90 font-khmer-body">{item.label}</p>
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

          {onDelete && (
            <div className="absolute right-3 top-3 z-20" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1 rounded-full bg-rose-600/90 px-3 text-xs font-medium text-white opacity-100 backdrop-blur-sm transition-opacity duration-150 hover:bg-rose-700 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
                onClick={(eventClick) => {
                  eventClick.preventDefault();
                  eventClick.stopPropagation();
                  onDelete(event);
                }}
                aria-label={isKhmer ? 'លុបព្រឹត្តិការណ៍' : 'Delete event'}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isKhmer ? 'លុប' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 p-4">
          <div className="rounded-xl bg-pink-100 p-2 text-pink-600">
            <PartyPopper className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-khmer-heading text-base font-bold text-gray-900 line-clamp-2">
              {event.title?.trim() ? event.title : isKhmer ? `ពិធីរៀបមង្គលការ ${groom} និង ${bride}` : `Wedding of ${groom} and ${bride}`}
            </h3>
            <p className="mt-2 flex items-center gap-1 text-sm text-gray-500 font-khmer-body">
              <Users className="h-4 w-4" />
              {isKhmer ? `ភ្ញៀវសរុប ${event.guestCount ?? 0} នាក់` : `Total guests ${event.guestCount ?? 0}`}
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}
