'use client';

import { useEffect, useMemo, useState } from 'react';
import { Assets } from '@/lib/assets';
import {
  Home,
  CalendarDays,
  GalleryHorizontal,
  MapPin,
  MessageSquare,
  Send,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Pause,
  Play,
  X,
} from 'lucide-react';
import ImageCover from './sections/ImageCover';
import type { BuilderState } from './types';

function parseEventDateToTimestamp(rawDate: string): number | null {
  const normalized = rawDate
    .replace(/[\u00A0\u202F]/g, ' ')
    .trim();

  const dmyAmPm = normalized.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s*(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?$/i,
  );

  if (dmyAmPm) {
    let day = Number(dmyAmPm[1]);
    let month = Number(dmyAmPm[2]);
    const year = Number(dmyAmPm[3]);
    const minute = Number(dmyAmPm[5] || '0');
    const amPm = (dmyAmPm[6] || '').toUpperCase();

    if (month > 12 && day <= 12) {
      const swappedDay = month;
      month = day;
      day = swappedDay;
    }

    let hour = Number(dmyAmPm[4] || '0');
    if (amPm) {
      if (hour === 12) {
        hour = 0;
      }
      hour = amPm === 'PM' ? hour + 12 : hour;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31 || minute < 0 || minute > 59 || hour < 0 || hour > 23) {
      return null;
    }

    return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
  }

  const isoLike = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::\d{2})?)?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/,
  );

  if (isoLike) {
    return new Date(
      Number(isoLike[1]),
      Number(isoLike[2]) - 1,
      Number(isoLike[3]),
      Number(isoLike[4] || '0'),
      Number(isoLike[5] || '0'),
      0,
      0,
    ).getTime();
  }

  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseTimeParts(rawTime: string): { hour: number; minute: number } | null {
  const normalized = rawTime.trim();
  if (!normalized) {
    return { hour: 0, minute: 0 };
  }

  const hhmm = normalized.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!hhmm) {
    return null;
  }

  let hour = Number(hhmm[1]);
  const minute = Number(hhmm[2]);
  const amPm = (hhmm[3] || '').toUpperCase();

  if (minute < 0 || minute > 59) {
    return null;
  }

  if (amPm) {
    if (hour < 1 || hour > 12) {
      return null;
    }
    if (hour === 12) {
      hour = 0;
    }
    if (amPm === 'PM') {
      hour += 12;
    }
  } else if (hour < 0 || hour > 23) {
    return null;
  }

  return { hour, minute };
}

function parseAgendaItemTimestamp(dateText: string, timeText: string): number | null {
  const normalizedDate = dateText.trim();
  if (!normalizedDate) {
    return null;
  }

  const dateMatch = normalizedDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!dateMatch) {
    return null;
  }

  let day = Number(dateMatch[1]);
  let month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);

  if (month > 12 && day <= 12) {
    const swappedDay = month;
    month = day;
    day = swappedDay;
  }

  const time = parseTimeParts(timeText);
  if (!time) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return new Date(year, month - 1, day, time.hour, time.minute, 0, 0).getTime();
}

function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
}

function getEndOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
}

type InvitationCardProps = {
  data: BuilderState;
  showInvitationRsvp?: boolean;
  rsvpChoice?: 'CONFIRMED' | 'DECLINED';
  wishMessage?: string;
  isSubmittingRsvp?: boolean;
  rsvpNotice?: string;
  onRsvpChoiceChange?: (choice: 'CONFIRMED' | 'DECLINED') => void;
  onWishMessageChange?: (message: string) => void;
  onSubmitRsvpWish?: () => void;
  rsvpSenderName?: string;
  adultCount?: number;
  onAdultCountChange?: (n: number) => void;
  sentWish?: string | null;
  sentAt?: number | null;
  showMusicControl?: boolean;
  isMusicPlaying?: boolean;
  onToggleMusic?: () => void;
};

export default function InvitationCard({
  data,
  showInvitationRsvp = false,
  rsvpChoice,
  wishMessage = '',
  isSubmittingRsvp = false,
  rsvpNotice = '',
  onRsvpChoiceChange,
  onWishMessageChange,
  onSubmitRsvpWish,
  rsvpSenderName = '',
  adultCount = 1,
  onAdultCountChange,
  sentWish = null,
  sentAt = null,
  showMusicControl = false,
  isMusicPlaying = false,
  onToggleMusic,
}: InvitationCardProps) {
  const isFloralRoseStyle = data.styleVariant === 'floral-rose';
  const [now, setNow] = useState(Date.now());
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);

  const handleScrollTo = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (activeGalleryIndex === null) {
      setIsSlideshowPlaying(false);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveGalleryIndex(null);
        return;
      }

      if (!data.galleryImages.length) {
        return;
      }

      if (event.key === 'ArrowRight') {
        setActiveGalleryIndex((prev) => (prev === null ? 0 : (prev + 1) % data.galleryImages.length));
      }

      if (event.key === 'ArrowLeft') {
        setActiveGalleryIndex((prev) => {
          if (prev === null) {
            return 0;
          }
          return (prev - 1 + data.galleryImages.length) % data.galleryImages.length;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeGalleryIndex, data.galleryImages]);

  useEffect(() => {
    if (
      !isSlideshowPlaying ||
      activeGalleryIndex === null ||
      data.galleryImages.length <= 1
    ) {
      return;
    }

    const id = window.setInterval(() => {
      setActiveGalleryIndex((prev) => {
        if (prev === null) {
          return 0;
        }
        return (prev + 1) % data.galleryImages.length;
      });
    }, 2500);

    return () => {
      window.clearInterval(id);
    };
  }, [activeGalleryIndex, data.galleryImages.length, isSlideshowPlaying]);

  const countdownState = useMemo(() => {
    const fallbackTarget = now + 1000 * 60 * 60 * 24 * 3;
    const eventTarget = data.eventDate ? parseEventDateToTimestamp(data.eventDate) : null;
    const eventEndTarget = data.eventEndDate ? parseEventDateToTimestamp(data.eventEndDate) : null;

    const allAgendaTargets = data.agendaSections
      .flatMap((section) => section.items)
      .map((item) => parseAgendaItemTimestamp(item.date, item.time))
      .filter((timestamp): timestamp is number => typeof timestamp === 'number')
      .sort((a, b) => a - b);

    const upcomingAgendaTargets = allAgendaTargets
      .filter((timestamp): timestamp is number => typeof timestamp === 'number' && timestamp >= now)
      .sort((a, b) => a - b);

    const lifecycleStartCandidates: number[] = [];
    const lifecycleEndCandidates: number[] = [];

    if (eventTarget !== null) {
      lifecycleStartCandidates.push(getStartOfDay(eventTarget));
      lifecycleEndCandidates.push(getEndOfDay(eventTarget));
    }

    if (eventEndTarget !== null) {
      lifecycleEndCandidates.push(getEndOfDay(eventEndTarget));
    }

    if (allAgendaTargets.length > 0) {
      lifecycleStartCandidates.push(allAgendaTargets[0]);
      lifecycleEndCandidates.push(allAgendaTargets[allAgendaTargets.length - 1]);
    }

    const lifecycleStart = lifecycleStartCandidates.length > 0 ? Math.min(...lifecycleStartCandidates) : null;
    const lifecycleEnd = lifecycleEndCandidates.length > 0 ? Math.max(...lifecycleEndCandidates) : null;

    let phase: 'countdown' | 'ended' = 'countdown';
    if (lifecycleStart !== null && now >= lifecycleStart) {
      phase = lifecycleEnd !== null && now > lifecycleEnd ? 'ended' : 'countdown';
    }

    // Priority: event day first; after it passes, switch to the nearest future agenda item.
    const isTrackingEvent = eventTarget !== null && eventTarget >= now;
    const target = isTrackingEvent
      ? eventTarget
      : (upcomingAgendaTargets[0] ?? eventTarget ?? fallbackTarget);

    const remaining = Math.max(target - now, 0);
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const countdownItems = [
      { label: data.language === 'en' ? 'Days' : 'ថ្ងៃ', value: days },
      { label: data.language === 'en' ? 'Hours' : 'ម៉ោង', value: String(hours).padStart(2, '0') },
      { label: data.language === 'en' ? 'Minutes' : 'នាទី', value: String(minutes).padStart(2, '0') },
      { label: data.language === 'en' ? 'Seconds' : 'វិនាទី', value: String(seconds).padStart(2, '0') },
    ];

    const targetLabel = isTrackingEvent
      ? (data.language === 'en' ? 'Counting down to: Event Date' : 'កំពុងរាប់ទៅ: ថ្ងៃកម្មវិធី')
      : (data.language === 'en' ? 'Counting down to: Next Agenda Item' : 'កំពុងរាប់ទៅ: របៀបវារៈបន្ទាប់');

    const statusLabel = phase === 'ended'
      ? (data.language === 'en' ? 'Event has ended' : 'កម្មវិធីបានបញ្ចប់')
      : '';

    return {
      phase,
      countdownItems,
      targetLabel,
      statusLabel,
    };
  }, [now, data.language, data.eventDate, data.eventEndDate, data.agendaSections]);

  return (
    <div 
      className={`overflow-hidden rounded-[28px] font-khmer-body shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:rounded-[32px] ${
        isFloralRoseStyle ? 'bg-[#efefef]' : 'bg-white'
      }`}
      style={{
        backgroundImage: data.backgroundUrl ? `url(${data.backgroundUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <ImageCover data={data} />

      <section className={`space-y-4 px-3 py-4 pb-32 sm:space-y-6 sm:px-5 sm:py-6 ${isFloralRoseStyle ? 'space-y-0 px-0 py-0 pb-24' : ''}`} style={{ color: data.headingColor }}>
        <div id="invitation-top" className={`p-2 text-center sm:p-4 ${isFloralRoseStyle ? 'bg-[#eecfaf] px-4 py-5 sm:px-6 sm:py-6' : ''}`}>
          <p className="font-khmer-heading text-base text-current">
            {data.language === 'en' ? 'Days Remaining' : 'ចំនួនថ្ងៃដែលនៅសល់'}
          </p>
          {countdownState.phase === 'ended' ? (
            <p className="mt-4 text-base font-semibold text-current">
              {countdownState.statusLabel}
            </p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {countdownState.countdownItems.map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1 py-3">
                    <span className="text-xl font-semibold text-current">{item.value}</span>
                    <span className="text-xs text-current">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-current/80">
                {countdownState.targetLabel}
              </p>
            </>
          )}
        </div>

        <div id="invitation-greeting" className={`p-4 text-center ${isFloralRoseStyle ? 'bg-[#f5f5f5] px-4 py-6 sm:px-6 sm:py-7' : ''}`}>
          <h2 className="text-2xl font-bold text-current mb-2">
            {data.greetingTitle}
          </h2>
          <p className="mt-2 text-md text-current">
            {data.greetingMessage}
          </p>
          <div className="flex justify-center my-4">
            <img src={Assets.decorativeDivider} alt="divider" className="h-6" />
          </div>
        </div>

        <div id="invitation-agenda" className={`p-4 text-center ${isFloralRoseStyle ? 'bg-[#eecfaf] px-4 py-6 sm:px-6 sm:py-7' : ''}`}>
          <p className="text-xl font-semibold text-current mb-4">
            {data.language === 'en' ? 'Agenda' : 'របៀបវារៈកម្មវិធី'}
          </p>
          <div className="space-y-6 text-left">
            {data.agendaSections.map((section, sectionIndex) => (
              <div
                key={section.id}
                className={sectionIndex > 0 ? 'border-t border-[#ead8bf] pt-5' : ''}
              >
                <p className="text-base font-bold text-current mb-3 text-center">
                  {section.title || (data.language === 'en' ? 'Agenda' : 'របៀបវារៈ')}
                </p>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div key={item.id} className="flex flex-col items-center justify-center gap-1 py-1">
                      <span className="text-base font-semibold text-current text-center">
                        {item.title || (data.language === 'en' ? 'Program item' : 'ឈ្មោះកម្មវិធី')}
                      </span>
                      <div className="flex items-center justify-center gap-3 text-xs text-current">
                        <span>{item.date || '--/--/----'}</span>
                        <span className="text-current">|</span>
                        <span className="font-medium">{item.time || '--:--'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="invitation-location" className={`p-4 text-center ${isFloralRoseStyle ? 'bg-[#f5f5f5] px-4 py-6 sm:px-6 sm:py-7' : ''}`}>
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <p className="text-xl font-semibold text-current">
              {data.language === 'en' ? 'Event Location' : 'ទីតាំងកម្មវិធី'}
            </p>
            {data.mapUrl ? (
              <a
                href={data.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-current underline"
              >
                {data.language === 'en' ? 'Open Google Maps' : 'បើក Google Maps'}
              </a>
            ) : null}
          </div>
          {data.eventLocation && (
            <p className="mt-1 text-sm text-current flex items-center justify-center gap-1">
              <MapPin className="h-4 w-4" />
              {data.eventLocation}
            </p>
          )}
          {data.mapImageUrl && (
            <div className="mt-4 w-full flex flex-col items-center">
              <p className="text-lg font-semibold text-current mb-3">
                {data.language === 'en' ? 'Location' : 'ទីតាំង'}
              </p>
              <img src={data.mapImageUrl} alt="map" className="w-full max-w-sm object-contain rounded-xl" />
            </div>
          )}
        </div>

        {data.galleryImages && data.galleryImages.length > 0 && (
          <div id="invitation-gallery" className={`p-4 text-center ${isFloralRoseStyle ? 'bg-[#eecfaf] px-4 py-6 sm:px-6 sm:py-7' : ''}`}>
            <p className="text-xl font-semibold text-current mb-4">
              {data.language === 'en' ? 'Gallery' : 'វិចិត្រសាល'}
            </p>
            <div className={`mt-4 grid ${data.galleryImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
              {data.galleryImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveGalleryIndex(i)}
                  className={`group relative w-full overflow-hidden rounded-xl ${
                    data.galleryImages.length === 1 ? 'h-72 sm:h-80' : 'h-56 sm:h-64'
                  }`}
                  aria-label={data.language === 'en' ? `View gallery image ${i + 1}` : `មើលរូបទី ${i + 1}`}
                >
                  <img
                    src={img}
                    alt={`Gallery ${i}`}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    className="h-full w-full cursor-zoom-in object-cover object-top transition duration-200 group-hover:scale-[1.02]"
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '256px' }}
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-black/0 pb-2 text-xs font-medium text-white opacity-0 transition duration-200 group-hover:bg-black/30 group-hover:opacity-100">
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    {data.language === 'en' ? 'Click to view' : 'ចុចមើលរូប'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(data.thankYouTitle || data.thankYouMessage) && (
          <div id="invitation-thanks" className={`p-6 text-center ${isFloralRoseStyle ? 'bg-[#f5f5f5] px-4 py-6 sm:px-6 sm:py-7' : ''}`}>
            <div className="flex justify-center mb-4">
              <img src={Assets.decorativeDivider} alt="divider" className="h-6" />
            </div>
            {data.thankYouTitle && <p className="text-xl font-semibold text-current mb-4">{data.thankYouTitle}</p>}
            {data.thankYouMessage && <p className="text-md text-current leading-relaxed whitespace-pre-wrap">{data.thankYouMessage}</p>}
          </div>
        )}

        <div id="invitation-khqr" className={`p-4 text-center ${isFloralRoseStyle ? 'bg-[#eecfaf] px-4 py-6 sm:px-6 sm:py-7' : ''}`}>
          <p className="text-xl font-semibold text-current mb-4">
            {data.language === 'en' ? 'Gift KHQR' : 'ចងដៃតាមរយៈ KHQR'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 text-center">
              {data.khqrUsdUrl ? (
                <img src={data.khqrUsdUrl} alt="KHQR USD" className="mx-auto h-28 w-28 rounded-xl object-contain" />
              ) : null}
              <p className="mt-3 text-sm font-semibold text-current">USD</p>
            </div>
            <div className="p-3 text-center">
              {data.khqrKhrUrl ? (
                <img src={data.khqrKhrUrl} alt="KHQR KHR" className="mx-auto h-28 w-28 rounded-xl object-contain" />
              ) : null}
              <p className="mt-3 text-sm font-semibold text-current">KHR</p>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <img src={Assets.decorativeDivider} alt="divider" className="h-6" />
          </div>
        </div>

        <div id="invitation-rsvp" className={`p-4 text-center ${isFloralRoseStyle ? 'bg-[#f5f5f5] px-4 py-6 sm:px-6 sm:py-7' : ''}`}>
          {showInvitationRsvp ? (
            <section
              className="relative overflow-hidden rounded-[28px] border border-[#ebd9b8] bg-[#fff8ef] p-5 shadow-[0_14px_30px_rgba(95,63,35,0.12)]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 18% 22%, rgba(208,165,88,0.12) 0 1px, transparent 2px), radial-gradient(circle at 78% 34%, rgba(208,165,88,0.1) 0 1px, transparent 2px), radial-gradient(circle at 44% 70%, rgba(208,165,88,0.09) 0 1px, transparent 2px), linear-gradient(120deg, rgba(255,255,255,0.65), rgba(255,248,239,0.95))',
                backgroundSize: '120px 120px, 140px 140px, 160px 160px, auto',
              }}
            >
              <h3 className="text-center font-khmer-heading text-xl text-[#7d1833]">
                {data.language === 'en' ? 'Wishes' : 'សារជូនពរ'}
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onRsvpChoiceChange?.('CONFIRMED')}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    rsvpChoice === 'CONFIRMED'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {data.language === 'en' ? '✓  Attending' : '✓  មកចូលរួម'}
                </button>
                <button
                  type="button"
                  onClick={() => onRsvpChoiceChange?.('DECLINED')}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    rsvpChoice === 'DECLINED'
                      ? 'border-rose-600 bg-rose-50 text-rose-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {data.language === 'en' ? '✗  Cannot attend' : '✗  មិនបានចូលរួម'}
                </button>
              </div>

              {/* status shown in admin; keep invitation compact */}

              {rsvpChoice === 'CONFIRMED' ? (
                <>
                  <div className="mt-3 flex items-center justify-center gap-3 text-sm text-[#6f4b2d]">
                    <span className="font-medium">
                      {data.language === 'en' ? 'Confirm your attendance' : 'បញ្ជាក់ពីវត្តមានអ្នក'}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-white/80 text-[#4f3621]">
                      {adultCount} {data.language === 'en' ? 'people' : 'នាក់'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-gray-600">{data.language === 'en' ? 'Number of people' : 'ចំនួននាក់'}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onAdultCountChange?.(Math.max(0, adultCount - 1))}
                          className="h-8 w-8 rounded-full border bg-white"
                        >
                          -
                        </button>
                        <span className="w-12 text-center">{adultCount}</span>
                        <button
                          type="button"
                          onClick={() => onAdultCountChange?.(adultCount + 1)}
                          className="h-8 w-8 rounded-full border bg-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              <div className="mt-4">
                <textarea
                  value={wishMessage || sentWish || ''}
                  onChange={(event) => onWishMessageChange?.(event.target.value)}
                  rows={4}
                  placeholder={data.language === 'en' ? 'Please write your message...' : 'សូមសរសេរសារជូនពររបស់អ្នក...'}
                  className="w-full resize-none rounded-2xl border border-[#ead8bf] bg-white/90 px-4 py-3 text-sm text-[#4f3621] outline-none transition focus:border-[#caa260] focus:ring-2 focus:ring-[#efd7ad]"
                />
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  disabled={isSubmittingRsvp}
                  onClick={onSubmitRsvpWish}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#c0923f] bg-linear-to-r from-[#f6deb0] via-[#efc777] to-[#e7b45a] px-7 text-sm font-semibold text-[#6f3b00] shadow-[0_10px_22px_rgba(170,115,18,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingRsvp ? (
                    data.language === 'en' ? 'Sending...' : 'កំពុងផ្ញើ...'
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      {data.language === 'en' ? 'Send message' : 'ផ្ញើសារ'}
                    </>
                  )}
                </button>
              </div>

              {rsvpNotice ? (
                <p className="mt-3 text-center text-xs text-[#6f4b2d]">{rsvpNotice}</p>
              ) : null}

              {sentWish ? (
                <div className="mt-4 rounded-2xl border border-[#ead8bf] bg-white p-3 text-left shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#3b2a1a]">
                      {rsvpSenderName || (data.language === 'en' ? 'Guest' : 'អ្នក')}
                    </div>
                    <div className="text-xs text-gray-500">{sentAt ? new Date(sentAt).toLocaleString() : ''}</div>
                  </div>
                  <p className="mt-2 text-sm text-[#4f3621] whitespace-pre-wrap">{sentWish}</p>
                </div>
              ) : null}
            </section>
          ) : (
            <>
              <p className="text-xl font-semibold text-current">{data.language === 'en' ? 'Wishes' : 'សារជូនពរ'}</p>
              <p className="mt-2 text-sm text-current">{data.language === 'en' ? 'No message yet' : 'មិនទាន់មានសារជូនពរ'}</p>
            </>
          )}
        </div>
      </section>

      <nav className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-transparent px-2 py-2 md:hidden">
        <div className="flex items-center justify-between gap-2 text-pink-500">
          {[
            { id: 'invitation-greeting', icon: Home },
            { id: 'invitation-agenda', icon: CalendarDays },
            { id: 'invitation-location', icon: MapPin },
            { id: 'invitation-gallery', icon: GalleryHorizontal },
            { id: 'invitation-khqr', icon: QrCode },
            { id: 'invitation-rsvp', icon: Send },
          ].map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleScrollTo(id)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-sm text-pink-500"
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
          {showMusicControl ? (
            <button
              type="button"
              onClick={onToggleMusic}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-sm text-pink-500"
              aria-label={
                isMusicPlaying
                  ? (data.language === 'en' ? 'Pause music' : 'ផ្អាកតន្ត្រី')
                  : (data.language === 'en' ? 'Play music' : 'ចាក់តន្ត្រី')
              }
            >
              {isMusicPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
          ) : null}
        </div>
      </nav>

      <div className="mt-0.5 pb-20 text-center text-xs text-[#a89070]">
        <p className="opacity-70">រចនាធៀបការឌីជីថល ដោយ៖</p>
        <p className="mt-0.5 font-semibold opacity-80">Phuem Norng</p>
        <div className="mt-2 flex items-center justify-center gap-3 opacity-70">
          <a href="https://github.com/phuem-norng" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 hover:underline">GitHub</a>
          <span aria-hidden="true">·</span>
          <a href="https://web.facebook.com/phuemnorngofficial/" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 hover:underline">Facebook</a>
          <span aria-hidden="true">·</span>
          <a href="https://t.me/Phuem_Norng" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 hover:underline">Telegram</a>
          <span aria-hidden="true">·</span>
          <a href="https://www.tiktok.com/@phuem_norng" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 hover:underline">TikTok</a>
        </div>
      </div>

      {activeGalleryIndex !== null && data.galleryImages[activeGalleryIndex] ? (
        <div className="fixed inset-0 z-60 bg-black/85 p-4 sm:p-8">
          {data.galleryImages.length > 1 ? (
            <button
              type="button"
              aria-label={isSlideshowPlaying ? 'Pause slideshow' : 'Start slideshow'}
              onClick={() => setIsSlideshowPlaying((prev) => !prev)}
              className="absolute right-16 top-4 z-10 inline-flex h-10 items-center gap-1 rounded-full bg-white/15 px-3 text-xs font-medium text-white hover:bg-white/25"
            >
              {isSlideshowPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isSlideshowPlaying ? 'Pause' : 'Slideshow'}
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Close gallery"
            onClick={() => setActiveGalleryIndex(null)}
            className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>

          {data.galleryImages.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() =>
                  setActiveGalleryIndex((prev) => {
                    if (prev === null) {
                      return 0;
                    }
                    return (prev - 1 + data.galleryImages.length) % data.galleryImages.length;
                  })
                }
                className="absolute left-4 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() =>
                  setActiveGalleryIndex((prev) => {
                    if (prev === null) {
                      return 0;
                    }
                    return (prev + 1) % data.galleryImages.length;
                  })
                }
                className="absolute right-4 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <div className="flex h-full items-center justify-center" onClick={() => setActiveGalleryIndex(null)}>
            <img
              src={data.galleryImages[activeGalleryIndex]}
              alt={`Gallery ${activeGalleryIndex + 1}`}
              className="max-h-full max-w-full rounded-xl object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </div>

          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {activeGalleryIndex + 1} / {data.galleryImages.length}
          </p>
        </div>
      ) : null}
    </div>
  );
}
