'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Eye, Mail, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvitationCard from '@/components/invitation-builder/InvitationCard';
import type { BuilderState } from '@/components/invitation-builder/types';
import { apiClient } from '@/lib/api-client';
import { getSavedMyTemplateById } from '@/lib/my-templates';

function formatBuilderEventDate(rawDate?: string) {
  if (!rawDate) {
    return 'ថ្ងៃរៀបអាពាហ៍ពិពាហ៍';
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return rawDate;
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  const minute = String(parsed.getMinutes()).padStart(2, '0');

  const hour24 = parsed.getHours();
  const amPm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const hour = String(hour12).padStart(2, '0');

  return `${day}/${month}/${year}, ${hour}:${minute} ${amPm}`;
}

function formatBuilderDateOnly(rawDate?: string) {
  if (!rawDate) {
    return '';
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

function createBuilderStateFromEvent(event: {
  title?: string;
  date?: string;
  location?: string;
  musicUrl?: string;
  coverImage?: string;
  googleMapLink?: string;
  khqrDollar?: string;
  khqrRiel?: string;
  metadata?: Record<string, unknown>;
}): BuilderState {
  const dateOnly = formatBuilderDateOnly(event.date);
  const metadata = event.metadata && typeof event.metadata === 'object'
    ? (event.metadata as { agenda?: unknown; eventEndDate?: unknown })
    : undefined;

  const agenda = Array.isArray(metadata?.agenda) && metadata?.agenda.length > 0
    ? metadata.agenda
    : [
        {
          id: `agenda-${Date.now()}`,
          title: 'របៀបវារៈទី1',
          items: [{ id: `agenda-item-${Date.now()}`, title: '', date: dateOnly, time: '' }],
        },
      ];

  return {
    language: 'km',
    musicEnabled: true,
    musicId: 'classic',
    musicUrl: event.musicUrl || '/audio/wedding.mp3',
    textColor: '#e6c628',
    headingColor: '#142e7b',
    coverImageUrl: event.coverImage || '',
    backgroundUrl: '/GlfpFt.jpg',
    eventTitle: event.title || 'សិរីមង្គលអាពាហ៍ពិពាហ៍',
    eventSubtitle: '',
    eventDate: formatBuilderEventDate(event.date),
    eventEndDate:
      typeof metadata?.eventEndDate === 'string' && metadata.eventEndDate.trim()
        ? metadata.eventEndDate
        : formatBuilderEventDate(event.date),
    eventLocation: event.location || 'ទីតាំងកម្មវិធី',
    greetingTitle: 'យើងខ្ញុំមានកិត្តិយសសូមគោរពអញ្ជើញ',
    greetingMessage:
      'សម្តេច ទ្រង់ ឯកឧត្តម លោកជំទាវ លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោក លោកស្រី អ្នកនាង កញ្ញា ព្រមទាំងប្រិយមិត្តអញ្ជើញចូលរួមជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធិពរជ័យសិរីសួស្តី ជ័យមង្គល ក្នុងពិធីអាពាហ៍ពិពាហ៍ កូនប្រុសស្រី របស់យើងខ្ញុំទាំងពីរ។',
    agendaSections: agenda as BuilderState['agendaSections'],
    mapUrl: event.googleMapLink || '',
    mapImageUrl: '/map.png',
    galleryImages: [],
    thankYouTitle: 'សូមអរគុណ និងសូមអភ័យទោស',
    thankYouMessage:
      'យើងខ្ញុំទាំងពីរ សូមថ្លែងអំណរគុណ យ៉ាងជ្រាលជ្រៅ ចំពោះវត្តមាន ដ៏ឧត្តុង្គឧត្តមរបស់ សម្តេច ឯកឧត្តម លោកជំទាវ លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោក លោកស្រី អ្នកនាង កញ្ញា ដែលបាន អញ្ជើញចូលរួមជាកិត្តិយស ក្នុងពិធីសិរីសួស្តីអាពាហ៍ពិពាហ៍ របស់យើងខ្ញុំ នាពេលខាងមុខនេះ។ យើងខ្ញុំសូមការខន្តីអភ័យទោស ដែលពុំបានជូនលិខិតអញ្ជើញ ដោយផ្ទាល់ ។ ដោយការវកិច្ចដ៏ខ្ពង់ខ្ពស់ពីយើងខ្ញុំ។',
    khqrUsdUrl: event.khqrDollar || '',
    khqrKhrUrl: event.khqrRiel || '',
  };
}

export default function MyTemplatePreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const templateKey = params.templateKey as string;
  const invitedGuestId = searchParams.get('guestId') || '';
  const invitedGuestName = searchParams.get('g') || '';
  const inviteSignature = `${invitedGuestId}::${invitedGuestName}`;
  const isGuestPreview = Boolean(invitedGuestId);

  const getRsvpStorageKey = () => {
    if (invitedGuestId) {
      return `pithi:rsvp:${eventId}:${invitedGuestId}`;
    }

    return `pithi:rsvp:${eventId}:${inviteSignature}`;
  };

  const loadSavedRsvp = () => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(getRsvpStorageKey());
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as {
        rsvpChoice?: 'CONFIRMED' | 'DECLINED';
        adultCount?: number;
        wishMessage?: string;
        sentAt?: number;
      };

      return parsed;
    } catch {
      return null;
    }
  };

  const [builderState, setBuilderState] = useState<BuilderState | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [isCurtainOpening, setIsCurtainOpening] = useState(false);
  const [publicEventSlug, setPublicEventSlug] = useState('');
  const [rsvpChoice, setRsvpChoice] = useState<'CONFIRMED' | 'DECLINED' | undefined>(undefined);
  const [wishMessage, setWishMessage] = useState('');
  const [sentWish, setSentWish] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [adultCount, setAdultCount] = useState(1);
  const [rsvpNotice, setRsvpNotice] = useState('');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayRetryCountRef = useRef(0);
  const petals = Array.from({ length: 24 }, (_, index) => ({
    id: index,
    left: `${2 + ((index * 4.2) % 96)}%`,
    size: 10 + (index % 4) * 5,
    duration: 5 + (index % 7) * 0.9,
    delay: (index % 8) * 0.2,
  }));

  const attemptAutoPlay = async (preferUnmuted: boolean) => {
    const audio = audioRef.current;
    if (!audio || !builderState?.musicEnabled || !builderState.musicUrl) {
      return false;
    }

    try {
      audio.muted = !preferUnmuted;
      await audio.play();
      setIsPlaying(true);

      if (!preferUnmuted) {
        window.setTimeout(() => {
          const activeAudio = audioRef.current;
          if (activeAudio) {
            activeAudio.muted = false;
          }
        }, 300);
      }

      return true;
    } catch {
      setIsPlaying(false);
      return false;
    }
  };

  useEffect(() => {
    let active = true;

    const loadTemplate = async () => {
      const saved = getSavedMyTemplateById(templateKey);
      const hasSavedTemplate = Boolean(saved?.builderState);

      if (saved?.builderState) {
        if (!active) return;
        setBuilderState(saved.builderState);
        setTemplateName(saved.name);
      }

      try {
        let event: Awaited<ReturnType<typeof apiClient.getPublicEvent>> | null = null;

        try {
          event = await apiClient.getPublicEvent(eventId);
        } catch {
          event = await apiClient.getEvent(eventId);
        }

        if (!event) {
          throw new Error('Event not found');
        }
        if (!active) return;
        setPublicEventSlug(event.slug || '');

        const cached = loadSavedRsvp();
        if (cached) {
          if (cached.rsvpChoice) {
            setRsvpChoice(cached.rsvpChoice);
          }
          if (typeof cached.adultCount === 'number') {
            setAdultCount(cached.adultCount);
          }
          if (cached.wishMessage) {
            setWishMessage(cached.wishMessage);
            setSentWish(cached.wishMessage);
          }
          if (cached.sentAt) {
            setSentAt(cached.sentAt);
          }
        } else {
          const guestDisplayName = decodeURIComponent(invitedGuestName || '').trim();
          if (guestDisplayName) {
            setWishMessage(`${guestDisplayName}៖ `);
          }
        }

        if (invitedGuestId && event.slug) {
          try {
            const invitedGuest = await apiClient.getPublicGuestBySlug(event.slug, invitedGuestId);
            if (!active) return;
            if (invitedGuest.rsvpStatus === 'DECLINED') {
              setRsvpChoice('DECLINED');
              setAdultCount(0);
            } else if (invitedGuest.rsvpStatus === 'CONFIRMED') {
              setRsvpChoice('CONFIRMED');
              setAdultCount(typeof invitedGuest.adultCount === 'number' && invitedGuest.adultCount > 0 ? invitedGuest.adultCount : 1);
            }

            if (invitedGuest.greetingMessage?.trim()) {
              const gm = invitedGuest.greetingMessage.trim();
              setWishMessage(gm);
              setSentWish(gm);
              if (invitedGuest.updatedAt) {
                setSentAt(new Date(invitedGuest.updatedAt).getTime());
              } else {
                setSentAt(Date.now());
              }
              setRsvpNotice('បានផ្ញើសារជូនពរ និងបច្ចុប្បន្នភាពស្ថានភាពរួចរាល់។');
            } else if (invitedGuest.rsvpStatus === 'CONFIRMED' || invitedGuest.rsvpStatus === 'DECLINED' || invitedGuest.rsvpStatus === 'ACCEPTED') {
              setRsvpNotice('បានផ្ញើបច្ចុប្បន្នភាពស្ថានភាពរួចរាល់។');
            }

            if (typeof window !== 'undefined') {
              try {
                window.localStorage.setItem(
                  getRsvpStorageKey(),
                  JSON.stringify({
                    rsvpChoice: invitedGuest.rsvpStatus === 'DECLINED' ? 'DECLINED' : 'CONFIRMED',
                    adultCount:
                      invitedGuest.rsvpStatus === 'DECLINED'
                        ? 0
                        : typeof invitedGuest.adultCount === 'number'
                          ? invitedGuest.adultCount
                          : 1,
                    wishMessage: invitedGuest.greetingMessage?.trim() || undefined,
                    sentAt: invitedGuest.updatedAt ? new Date(invitedGuest.updatedAt).getTime() : Date.now(),
                  }),
                );
              } catch {
                // ignore storage failures
              }
            }
          } catch {
            // Ignore if guest lookup fails; section still allows submit by link params.
          }
        }

        const metadata = event.metadata && typeof event.metadata === 'object'
          ? (event.metadata as Record<string, unknown>)
          : {};

        const snapshots =
          metadata.myTemplateSnapshots && typeof metadata.myTemplateSnapshots === 'object'
            ? (metadata.myTemplateSnapshots as Record<string, unknown>)
            : {};

        const exact = snapshots[templateKey] as { name?: unknown; builderState?: unknown } | undefined;

        if (!hasSavedTemplate && exact && exact.builderState && typeof exact.builderState === 'object') {
          if (!active) return;
          setBuilderState(exact.builderState as BuilderState);
          setTemplateName(typeof exact.name === 'string' ? exact.name : 'គំរូធៀបខ្ញុំ');
          return;
        }

        const latest = Object.values(snapshots)
          .map((item) => item as { updatedAt?: unknown; name?: unknown; builderState?: unknown })
          .filter((item) => item && typeof item.builderState === 'object')
          .sort((a, b) => {
            const at = typeof a.updatedAt === 'string' ? a.updatedAt : '';
            const bt = typeof b.updatedAt === 'string' ? b.updatedAt : '';
            return at < bt ? 1 : -1;
          })[0];

        if (!hasSavedTemplate && latest?.builderState && typeof latest.builderState === 'object') {
          if (!active) return;
          setBuilderState(latest.builderState as BuilderState);
          setTemplateName(typeof latest.name === 'string' ? latest.name : 'គំរូធៀបខ្ញុំ');
          return;
        }

        if (!hasSavedTemplate) {
          if (!active) return;
          setBuilderState(createBuilderStateFromEvent(event));
          setTemplateName(event.title || 'គំរូធៀបខ្ញុំ');
          return;
        }
      } catch {
        // ignore and show fallback message below
      }

      if (!active) return;
      if (!hasSavedTemplate) {
        setBuilderState(null);
      }
    };

    loadTemplate();

    return () => {
      active = false;
    };
  }, [templateKey, eventId, inviteSignature]);

  const handleSubmitRsvpAndWish = async () => {
    const fallbackName = decodeURIComponent(invitedGuestName || '').trim() || 'ភ្ញៀវកិត្តិយស';

    setIsSubmittingRsvp(true);
    setRsvpNotice('');

    try {
      let slug = publicEventSlug;
      if (!slug) {
        const event = await apiClient.getPublicEvent(eventId);
        slug = event.slug || '';
        if (slug) {
          setPublicEventSlug(slug);
        }
      }

      if (!slug) {
        setRsvpNotice('បរាជ័យក្នុងការផ្ញើ។ សូមព្យាយាមម្តងទៀត។');
        return;
      }

      await apiClient.submitPublicRsvpBySlug(slug, {
        name: fallbackName,
        guestId: invitedGuestId || undefined,
        rsvpStatus: rsvpChoice,
        greetingMessage: wishMessage.trim() || undefined,
        adultCount: rsvpChoice === 'CONFIRMED' ? adultCount || undefined : 0,
      });

      // mark as sent only after successful server response
      const normalizedWish = wishMessage.trim();
      setWishMessage(normalizedWish);
      setSentWish(normalizedWish || null);
      setSentAt(Date.now());

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            getRsvpStorageKey(),
            JSON.stringify({
              rsvpChoice: rsvpChoice || undefined,
              adultCount: rsvpChoice === 'CONFIRMED' ? adultCount : 0,
              wishMessage: normalizedWish || undefined,
              sentAt: Date.now(),
            }),
          );
        } catch {
          // ignore storage failures
        }
      }

      setRsvpNotice('បានផ្ញើសារជូនពរ និងបច្ចុប្បន្នភាពស្ថានភាពរួចរាល់។');
    } catch {
      setRsvpNotice('បរាជ័យក្នុងការផ្ញើ។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !builderState?.musicEnabled || !builderState.musicUrl || !isOpened) {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    autoPlayRetryCountRef.current = 0;

    let cancelled = false;

    const tryPlay = async () => {
      const playedWithSound = await attemptAutoPlay(true);
      if (cancelled || playedWithSound) {
        return;
      }

      await attemptAutoPlay(false);
    };

    void tryPlay();

    const retryA = window.setTimeout(() => {
      if (!cancelled) {
        autoPlayRetryCountRef.current += 1;
        void tryPlay();
      }
    }, 600);

    const retryB = window.setTimeout(() => {
      if (!cancelled) {
        autoPlayRetryCountRef.current += 1;
        void tryPlay();
      }
    }, 1800);

    const retryC = window.setTimeout(() => {
      if (!cancelled) {
        autoPlayRetryCountRef.current += 1;
        void tryPlay();
      }
    }, 3200);

    return () => {
      cancelled = true;
      window.clearTimeout(retryA);
      window.clearTimeout(retryB);
      window.clearTimeout(retryC);
    };
  }, [builderState?.musicEnabled, builderState?.musicUrl, isOpened]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isPlaying || !builderState?.musicEnabled || !builderState.musicUrl || !isOpened) {
      return;
    }

    const resumeOnInteraction = async () => {
      if (audio.readyState < 2) {
        audio.load();
        return;
      }

      try {
        audio.muted = false;
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };

    window.addEventListener('pointerdown', resumeOnInteraction);
    window.addEventListener('touchstart', resumeOnInteraction);
    window.addEventListener('keydown', resumeOnInteraction);
    window.addEventListener('focus', resumeOnInteraction);
    window.addEventListener('pageshow', resumeOnInteraction);
    document.addEventListener('visibilitychange', resumeOnInteraction);

    return () => {
      window.removeEventListener('pointerdown', resumeOnInteraction);
      window.removeEventListener('touchstart', resumeOnInteraction);
      window.removeEventListener('keydown', resumeOnInteraction);
      window.removeEventListener('focus', resumeOnInteraction);
      window.removeEventListener('pageshow', resumeOnInteraction);
      document.removeEventListener('visibilitychange', resumeOnInteraction);
    };
  }, [isPlaying, builderState?.musicEnabled, builderState?.musicUrl, isOpened]);

  const handleToggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio || !builderState?.musicEnabled || !builderState.musicUrl) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const handleAudioCanPlay = () => {
    if (!isOpened) {
      return;
    }

    if (!isPlaying) {
      autoPlayRetryCountRef.current += 1;
      void attemptAutoPlay(false);
    }
  };

  const handleAudioCanPlayThrough = () => {
    if (!isOpened) {
      return;
    }

    if (!isPlaying) {
      autoPlayRetryCountRef.current += 1;
      void attemptAutoPlay(false);
    }
  };

  const handleAudioLoadedData = () => {
    if (!isOpened) {
      return;
    }

    if (!isPlaying && autoPlayRetryCountRef.current < 8) {
      autoPlayRetryCountRef.current += 1;
      void attemptAutoPlay(false);
    }
  };

  const handleOpenInvitation = async () => {
    if (isCurtainOpening || isOpened) {
      return;
    }

    setIsCurtainOpening(true);
    await attemptAutoPlay(false);

    window.setTimeout(async () => {
      setIsOpened(true);
      setIsCurtainOpening(false);
    }, 650);
  };

  if (!builderState) {
    return (
      <div className="min-h-screen bg-gray-50 font-khmer-body">
        {!isGuestPreview ? (
          <header className="border-b border-gray-100 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link href={`/events/${eventId}?tab=my-template`}>
                <Button variant="outline" className="border-gray-200">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  ត្រឡប់
                </Button>
              </Link>
            </div>
          </header>
        ) : null}

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            មិនមានទិន្នន័យ preview របស់គំរូនេះទេ។ សូមត្រឡប់ទៅ Invitation Builder ហើយរក្សាទុកម្តងទៀត។
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#efe5d6] font-khmer-body">
      {!isGuestPreview ? (
        <header className="border-b border-gray-100 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <Link href={`/events/${eventId}?tab=my-template`}>
              <Button variant="outline" className="border-gray-200">
                <ArrowLeft className="mr-2 h-4 w-4" />
                ត្រឡប់
              </Button>
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700">
              <Eye className="h-4 w-4 text-gray-500" />
              មើលគំរូផ្លូវការ: {templateName || 'គំរូធៀបខ្ញុំ'}
            </div>
          </div>
        </header>
      ) : null}

      <main className="relative px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence>
          {isOpened && (
            <motion.div
              className="pointer-events-none fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
            >
              {petals.map((petal) => (
                <motion.span
                  key={petal.id}
                  className="absolute rounded-[999px_999px_999px_120px] bg-linear-to-b from-[#ffd9e2] via-[#fff2f6] to-[#f7b8cb]/95 shadow-[0_4px_10px_rgba(255,182,193,0.3)]"
                  style={{ left: petal.left, width: petal.size, height: petal.size * 0.72 }}
                  initial={{ y: '-12vh', opacity: 0 }}
                  animate={{ y: '112vh', x: [0, 8, -6, 0], rotate: [0, 16, -12, 0], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: petal.duration + 2.5, delay: petal.delay, ease: 'linear', repeat: Number.POSITIVE_INFINITY }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isOpened && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#220b14]/45 p-6 backdrop-blur-md"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#f4d8a4]/35 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[#f6b8c8]/30 blur-3xl" />

              <motion.div
                className="relative z-30 w-full max-w-md overflow-hidden rounded-[36px] border border-[#d8b26a]/50 bg-[#fff8ee] p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
                initial={{ scale: 0.95, opacity: 0.9 }}
                animate={{ scale: isCurtainOpening ? 0.97 : 1, opacity: isCurtainOpening ? 0 : 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-linear-to-b from-[#f6e3bc]/55 to-transparent" />
                <div className="pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full border border-[#d8b26a]/45" />
                <div className="pointer-events-none absolute -left-10 -top-10 h-24 w-24 rounded-full border border-[#d8b26a]/35" />

                <div className="text-[#7d1833]">
                  <p className="font-khmer-heading text-2xl sm:text-3xl">សិរីមង្គលអាពាហ៏ពិពាហ៍</p>
                  <p className="mt-1 font-khmer-heading text-lg sm:text-2xl">
                    {(builderState?.eventTitle || 'ឈ្មោះកូនកំលោះ & ឈ្មោះកូនក្រមុំ')
                      .replace(/^ពិធីរៀបមង្គលការ\s*/u, '')
                      .trim()}
                  </p>
                  <p className="mt-1 font-khmer-body text-sm text-[#6f4b2d] sm:text-base">សូមគោរពអញ្ជើញ</p>
                </div>
                <div className="mx-auto mt-3 h-px w-40 bg-linear-to-r from-transparent via-[#d2a145] to-transparent" />
                <p className="mt-3 text-sm leading-relaxed text-[#6f4b2d] font-khmer-body">សូមអញ្ជើញបើកធៀប និងអបអរពិធីមង្គលដោយក្តីសោមនស្ស</p>
                <motion.button
                  type="button"
                  onClick={handleOpenInvitation}
                  disabled={isCurtainOpening}
                  className="mt-6 inline-flex h-12 items-center justify-center rounded-full border border-[#b98a34] bg-linear-to-r from-[#f6deb0] to-[#f2c883] px-7 font-khmer-body font-semibold text-[#6f3b00] shadow-[0_10px_24px_rgba(170,115,18,0.25)]"
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  បើកធៀប
                </motion.button>
              </motion.div>

              <motion.div
                className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2"
                initial={{ x: '0%' }}
                animate={
                  isCurtainOpening
                    ? { x: ['0%', '-10%', '-100%'], rotate: [0, -10, -3], y: [0, -18, 0] }
                    : { x: '0%', rotate: [0, 6.5, -5.2, 0], y: [0, -24, 12, 0] }
                }
                transition={
                  isCurtainOpening
                    ? { duration: 0.6, ease: [0.77, 0, 0.175, 1] }
                    : { duration: 0 }
                }
              >
                <div className="relative h-full w-full overflow-hidden bg-[#fff9f0]/18 shadow-[inset_-8px_0_16px_rgba(180,150,120,0.14)] backdrop-blur-[0.5px]">
                  <div className="absolute inset-0 bg-linear-to-r from-[#fff7ef]/30 via-[#f8ecdf]/22 to-[#efe0d1]/24" />
                  <motion.div
                    className="absolute inset-0 opacity-30 [background:linear-gradient(90deg,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.05)_13%,rgba(255,255,255,0.45)_27%,rgba(255,255,255,0.04)_42%,rgba(255,255,255,0.38)_58%,rgba(255,255,255,0.04)_74%,rgba(255,255,255,0.34)_88%,rgba(255,255,255,0.03)_100%)]"
                    animate={isCurtainOpening ? { x: [0, 32, -12] } : { x: [0, 26, -22, 0] }}
                    transition={
                      isCurtainOpening
                        ? { duration: 0.55, ease: 'easeInOut' }
                        : { duration: 0 }
                    }
                  />
                  <motion.div
                    className="absolute inset-0 opacity-32 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.78)_0_1px,transparent_2px),radial-gradient(circle_at_70%_32%,rgba(255,255,255,0.55)_0_1px,transparent_2px),radial-gradient(circle_at_48%_64%,rgba(255,255,255,0.62)_0_1px,transparent_2px),radial-gradient(circle_at_85%_84%,rgba(255,255,255,0.5)_0_1px,transparent_2px)]"
                    animate={isCurtainOpening ? { opacity: [0.06, 0.2, 0.05] } : { opacity: [0.06, 0.22, 0.08] }}
                    transition={
                      isCurtainOpening
                        ? { duration: 0.55, ease: 'easeInOut' }
                        : { duration: 0 }
                    }
                  />
                  <div className="absolute inset-y-0 right-0 w-0.75 bg-linear-to-b from-[#f7dfb5] via-[#d2ad78] to-[#f7dfb5]" />
                  <div className="absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-white/12 blur-3xl" />
                </div>
              </motion.div>

              <motion.div
                className="pointer-events-none absolute inset-y-0 right-0 z-20 w-1/2"
                initial={{ x: '0%' }}
                animate={
                  isCurtainOpening
                    ? { x: ['0%', '10%', '100%'], rotate: [0, 10, 3], y: [0, -18, 0] }
                    : { x: '0%', rotate: [0, -6.5, 5.2, 0], y: [0, 12, -24, 0] }
                }
                transition={
                  isCurtainOpening
                    ? { duration: 0.6, ease: [0.77, 0, 0.175, 1] }
                    : { duration: 0 }
                }
              >
                <div className="relative h-full w-full overflow-hidden bg-[#fff9f0]/18 shadow-[inset_8px_0_16px_rgba(180,150,120,0.14)] backdrop-blur-[0.5px]">
                  <div className="absolute inset-0 bg-linear-to-l from-[#fff7ef]/30 via-[#f8ecdf]/22 to-[#efe0d1]/24" />
                  <motion.div
                    className="absolute inset-0 opacity-30 [background:linear-gradient(90deg,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.05)_13%,rgba(255,255,255,0.45)_27%,rgba(255,255,255,0.04)_42%,rgba(255,255,255,0.38)_58%,rgba(255,255,255,0.04)_74%,rgba(255,255,255,0.34)_88%,rgba(255,255,255,0.03)_100%)]"
                    animate={isCurtainOpening ? { x: [0, -32, 12] } : { x: [0, -26, 22, 0] }}
                    transition={
                      isCurtainOpening
                        ? { duration: 0.55, ease: 'easeInOut' }
                        : { duration: 0 }
                    }
                  />
                  <motion.div
                    className="absolute inset-0 opacity-32 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.78)_0_1px,transparent_2px),radial-gradient(circle_at_64%_35%,rgba(255,255,255,0.55)_0_1px,transparent_2px),radial-gradient(circle_at_42%_68%,rgba(255,255,255,0.62)_0_1px,transparent_2px),radial-gradient(circle_at_90%_82%,rgba(255,255,255,0.5)_0_1px,transparent_2px)]"
                    animate={isCurtainOpening ? { opacity: [0.06, 0.2, 0.05] } : { opacity: [0.06, 0.22, 0.08] }}
                    transition={
                      isCurtainOpening
                        ? { duration: 0.55, ease: 'easeInOut' }
                        : { duration: 0 }
                    }
                  />
                  <div className="absolute inset-y-0 left-0 w-0.75 bg-linear-to-b from-[#f7dfb5] via-[#d2ad78] to-[#f7dfb5]" />
                  <div className="absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-white/12 blur-3xl" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative mx-auto flex h-fit w-full max-w-215 items-start justify-center gap-4">
          <div className="w-full max-w-115 space-y-5">
            <InvitationCard
              data={builderState}
              showInvitationRsvp={Boolean(invitedGuestId)}
              rsvpChoice={rsvpChoice}
              wishMessage={wishMessage}
              isSubmittingRsvp={isSubmittingRsvp}
              rsvpNotice={rsvpNotice}
              onRsvpChoiceChange={setRsvpChoice}
              onWishMessageChange={setWishMessage}
              onSubmitRsvpWish={handleSubmitRsvpAndWish}
              rsvpSenderName={invitedGuestName}
              adultCount={adultCount}
              onAdultCountChange={setAdultCount}
              sentWish={sentWish}
              sentAt={sentAt}
              showMusicControl={Boolean(builderState.musicEnabled && builderState.musicUrl)}
              isMusicPlaying={isPlaying}
              onToggleMusic={handleToggleMusic}
            />
          </div>

          {builderState.musicEnabled && builderState.musicUrl ? (
            <>
              <div className="hidden md:block md:static md:mt-4 md:shrink-0">
                <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-3 py-2 shadow-sm">
                  <button
                    type="button"
                    onClick={handleToggleMusic}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-[#7b1c2f]"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <audio
                ref={audioRef}
                src={builderState.musicUrl}
                loop
                preload="auto"
                playsInline
                onCanPlay={handleAudioCanPlay}
                onCanPlayThrough={handleAudioCanPlayThrough}
                onLoadedData={handleAudioLoadedData}
                className="absolute h-0 w-0 opacity-0"
              />
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
