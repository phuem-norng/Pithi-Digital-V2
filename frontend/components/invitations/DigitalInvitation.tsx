'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Eye, MapPin, Music2, Pause, Play, Share2, X } from 'lucide-react';
import type { Event } from '@/lib/api-client';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function seekIfNeeded(audio: HTMLAudioElement, targetTime: number) {
  if (!Number.isFinite(targetTime)) return;
  if (Math.abs(audio.currentTime - targetTime) < 0.35) return;
  audio.currentTime = targetTime;
}

type DigitalInvitationProps = {
  eventData: Event;
};

type ProgramItem = {
  time: string;
  title: string;
  detail?: string;
};

const weddingPrefix = 'ពិធីរៀបមង្គលការ';

function normalizeName(name: string) {
  const trimmed = name.trim();
  const escapedPrefix = weddingPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return trimmed.replace(new RegExp(`^(?:${escapedPrefix}\\s*)+`, 'u'), '').trim();
}

function parseCoupleNames(eventTitle?: string, metadata?: Record<string, unknown>) {
  const metaGroom = typeof metadata?.groomName === 'string' ? metadata.groomName : '';
  const metaBride = typeof metadata?.brideName === 'string' ? metadata.brideName : '';

  if (metaGroom || metaBride) {
    return {
      groomName: normalizeName(metaGroom || 'កូនប្រុស'),
      brideName: normalizeName(metaBride || 'កូនស្រី'),
    };
  }

  if (!eventTitle) {
    return { groomName: 'កូនប្រុស', brideName: 'កូនស្រី' };
  }

  if (eventTitle.includes(' និង ')) {
    const [groom, bride] = eventTitle.split(' និង ').map((item) => item.trim());
    return {
      groomName: normalizeName(groom || 'កូនប្រុស'),
      brideName: normalizeName(bride || 'កូនស្រី'),
    };
  }

  if (eventTitle.includes('&')) {
    const [groom, bride] = eventTitle.split('&').map((item) => item.trim());
    return {
      groomName: normalizeName(groom || 'កូនប្រុស'),
      brideName: normalizeName(bride || 'កូនស្រី'),
    };
  }

  return {
    groomName: normalizeName(eventTitle),
    brideName: 'កូនស្រី',
  };
}

function getGalleryImages(eventData: Event) {
  const metadata = (eventData.metadata || {}) as Record<string, unknown>;

  const fromMetadataArrays = [
    metadata.galleryImages,
    metadata.uploadedImages,
    metadata.images,
  ]
    .flatMap((value) => (Array.isArray(value) ? value : []))
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  const source = [eventData.coverImage, ...fromMetadataArrays].filter(
    (item): item is string => typeof item === 'string' && item.length > 0,
  );

  return [...new Set(source)];
}

function formatEventDate(date: string) {
  return new Date(date).toLocaleString('km-KH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getProgramItems(eventData: Event): ProgramItem[] {
  const metadata = (eventData.metadata || {}) as Record<string, unknown>;
  const rawProgram = metadata.programItems;

  if (Array.isArray(rawProgram)) {
    const items = rawProgram
      .map((item) => {
        if (typeof item !== 'object' || !item) return null;
        const row = item as Record<string, unknown>;
        const time = typeof row.time === 'string' ? row.time : '';
        const title = typeof row.title === 'string' ? row.title : '';
        const detail = typeof row.detail === 'string' ? row.detail : undefined;
        if (!time || !title) return null;
        return { time, title, detail };
      })
      .filter(Boolean) as ProgramItem[];

    if (items.length) {
      return items;
    }
  }

  const eventTime = new Date(eventData.date);
  const hourMinute = eventTime.toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' });

  return [
    { time: hourMinute, title: 'ពិធីទទួលភ្ញៀវ', detail: eventData.location },
    { time: hourMinute, title: 'ពិធីសែនព្រេន', detail: 'សូមអញ្ជើញចូលរួមដោយមេត្រីភាព' },
    { time: hourMinute, title: 'ពិធីទទួលទានអាហារ', detail: eventData.address || eventData.location },
  ];
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.55, ease: 'easeOut' as const },
};

const instantSection = {
  initial: false,
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0 },
};

export default function DigitalInvitation({ eventData }: DigitalInvitationProps) {
  const [opened, setOpened] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [visibleGalleryCount, setVisibleGalleryCount] = useState(4);
  const [useLiteEffects, setUseLiteEffects] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const galleryLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const playAttemptTokenRef = useRef(0);
  const isAttemptingPlayRef = useRef(false);
  const openClickLockRef = useRef(false);
  const openClickAtRef = useRef(0);

  const metadata = (eventData.metadata || {}) as Record<string, unknown>;
  const { groomName, brideName } = useMemo(
    () => parseCoupleNames(eventData.title, metadata),
    [eventData.title, metadata],
  );

  const galleryImages = useMemo(() => getGalleryImages(eventData), [eventData]);
  const displayedGalleryImages = useMemo(
    () => galleryImages.slice(0, visibleGalleryCount),
    [galleryImages, visibleGalleryCount],
  );
  const programItems = useMemo(() => getProgramItems(eventData), [eventData]);

  useEffect(() => {
    setVisibleGalleryCount(4);
  }, [galleryImages.length]);

  const resolveClipRange = (audio: HTMLAudioElement) => {
    const metadata = (eventData.metadata || {}) as Record<string, unknown>;
    const start = typeof metadata.musicStartSec === 'number' ? metadata.musicStartSec : 0;
    const end = typeof metadata.musicEndSec === 'number' ? metadata.musicEndSec : 0;
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const safeDuration = duration > 0 ? duration : 0;
    const safeStart = safeDuration > 0 ? clamp(start, 0, Math.max(0, safeDuration - 0.25)) : Math.max(0, start);
    const safeEnd =
      safeDuration > 0 && end > safeStart
        ? clamp(end, 0, safeDuration)
        : safeDuration;
    return { start: safeStart, end: safeEnd, hasClip: safeDuration > 0 && safeEnd > safeStart && end > safeStart };
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 900px), (prefers-reduced-motion: reduce)');

    const updateMode = () => {
      setUseLiteEffects(mediaQuery.matches);
    };

    updateMode();
    mediaQuery.addEventListener('change', updateMode);

    return () => {
      mediaQuery.removeEventListener('change', updateMode);
    };
  }, []);

  useEffect(() => {
    const target = galleryLoadMoreRef.current;
    if (!target || visibleGalleryCount >= galleryImages.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) {
          return;
        }

        setVisibleGalleryCount((prev) => Math.min(prev + 4, galleryImages.length));
      },
      {
        root: null,
        rootMargin: '120px 0px',
        threshold: 0.01,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [galleryImages.length, visibleGalleryCount]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    playAttemptTokenRef.current += 1;
    const token = playAttemptTokenRef.current;

    if (isMusicPlaying) {
      if (!audio.paused) {
        setIsMusicPlaying(true);
        return;
      }

      const playNow = async () => {
        if (isAttemptingPlayRef.current) return;
        isAttemptingPlayRef.current = true;
        try {
          const { start } = resolveClipRange(audio);
          seekIfNeeded(audio, start);
          await audio.play();
          if (playAttemptTokenRef.current !== token) return;
          setIsMusicPlaying(true);
        } catch {
          if (playAttemptTokenRef.current !== token) return;
          setIsMusicPlaying(false);
        } finally {
          isAttemptingPlayRef.current = false;
        }
      };

      void playNow();
      return;
    }

    audio.pause();
  }, [isMusicPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !eventData.musicUrl) {
      return;
    }

    const onTimeUpdate = () => {
      const { start, end, hasClip } = resolveClipRange(audio);
      if (!hasClip) return;
      if (audio.currentTime >= Math.max(0, end - 0.05)) {
        const wasPlaying = !audio.paused;
        seekIfNeeded(audio, start);
        if (wasPlaying) {
          void audio.play().catch(() => {
            setIsMusicPlaying(false);
          });
        }
      }
    };

    const onLoaded = () => {
      const { start } = resolveClipRange(audio);
      if (start > 0) seekIfNeeded(audio, start);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('durationchange', onLoaded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('durationchange', onLoaded);
    };
  }, [eventData.musicUrl, eventData.metadata]);

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

      if (!galleryImages.length) {
        return;
      }

      if (event.key === 'ArrowRight') {
        setActiveGalleryIndex((prev) => (prev === null ? 0 : (prev + 1) % galleryImages.length));
      }

      if (event.key === 'ArrowLeft') {
        setActiveGalleryIndex((prev) => {
          if (prev === null) {
            return 0;
          }
          return (prev - 1 + galleryImages.length) % galleryImages.length;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeGalleryIndex, galleryImages.length]);

  useEffect(() => {
    if (
      !isSlideshowPlaying ||
      activeGalleryIndex === null ||
      galleryImages.length <= 1
    ) {
      return;
    }

    const id = window.setInterval(() => {
      setActiveGalleryIndex((prev) => {
        if (prev === null) {
          return 0;
        }
        return (prev + 1) % galleryImages.length;
      });
    }, 2500);

    return () => {
      window.clearInterval(id);
    };
  }, [activeGalleryIndex, galleryImages.length, isSlideshowPlaying]);

  const petals = Array.from({ length: useLiteEffects ? 6 : 14 }, (_, index) => ({
    id: index,
    left: `${2 + ((index * 5) % 96)}%`,
    size: 10 + (index % 4) * 5,
    duration: 10 + (index % 7) * 1.2,
    delay: (index % 8) * 0.55,
  }));

  const handleOpenInvitation = () => {
    const now = Date.now();
    if (opened) return;
    if (openClickLockRef.current && now - openClickAtRef.current < 1200) {
      return;
    }

    openClickLockRef.current = true;
    openClickAtRef.current = now;
    setOpened(true);
    setIsMusicPlaying(true);

    window.setTimeout(() => {
      openClickLockRef.current = false;
    }, 1200);
  };

  return (
    <article
      className={`relative text-white ${
        opened ? 'min-h-full overflow-x-hidden' : 'h-full overflow-hidden'
      }`}
    >
      <div className="absolute inset-0 -z-10">
        {eventData.coverImage ? (
          <img
            src={eventData.coverImage}
            alt={eventData.title}
            className={`h-full w-full scale-105 object-cover ${useLiteEffects ? 'blur-[18px]' : 'blur-[44px]'} opacity-50`}
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100" />
        )}
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <AnimatePresence>
        {opened && !useLiteEffects && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            {petals.map((petal) => (
              <motion.span
                key={petal.id}
                className="absolute rounded-full bg-[#f4d5cf]/90"
                style={{ left: petal.left, width: petal.size, height: petal.size * 0.72 }}
                animate={useLiteEffects ? { y: ['-8%', '108%'] } : { y: ['-12%', '112%'], x: [0, 10, -8, 0], rotate: [0, 16, -12, 0] }}
                transition={{ duration: petal.duration, repeat: Number.POSITIVE_INFINITY, delay: petal.delay, ease: 'easeInOut' }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsMusicPlaying((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-amber-700 shadow-lg backdrop-blur-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Toggle music"
        disabled={!opened}
      >
        {isMusicPlaying ? <Pause className="h-5 w-5" /> : <Music2 className="h-5 w-5" />}
      </button>

      {eventData.musicUrl ? <audio ref={audioRef} src={eventData.musicUrl} preload="none" /> : null}

      <AnimatePresence>
        {activeGalleryIndex !== null && galleryImages[activeGalleryIndex] ? (
          <motion.div
            className="fixed inset-0 z-70 bg-black/85 p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {galleryImages.length > 1 ? (
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

            {galleryImages.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() =>
                    setActiveGalleryIndex((prev) => {
                      if (prev === null) {
                        return 0;
                      }
                      return (prev - 1 + galleryImages.length) % galleryImages.length;
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
                      return (prev + 1) % galleryImages.length;
                    })
                  }
                  className="absolute right-4 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            ) : null}

            <div
              className="flex h-full items-center justify-center"
              role="button"
              tabIndex={0}
              onClick={() => setActiveGalleryIndex(null)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  setActiveGalleryIndex(null);
                }
              }}
            >
              <img
                src={galleryImages[activeGalleryIndex]}
                alt={`Gallery ${activeGalleryIndex + 1}`}
                className="max-h-full max-w-full rounded-xl object-contain"
                onClick={(event) => event.stopPropagation()}
              />
            </div>

            <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
              {activeGalleryIndex + 1} / {galleryImages.length}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {!opened && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-black/35 p-6 backdrop-blur-sm"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <motion.div
              className="relative z-10 w-full max-w-md rounded-[32px] border border-white/20 bg-white/20 p-6 text-center shadow-2xl backdrop-blur-lg"
              initial={{ scale: 0.95, opacity: 0.9 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <p className="font-khmer-heading text-xl text-amber-100 mb-2">សិរីមង្គលអាពាហ៍ពិពាហ៍</p>
              <p className="font-khmer-heading text-xl text-white drop-shadow">{groomName} & {brideName}</p>
              <p className="mt-2 text-sm text-white/90 font-khmer-body">{formatEventDate(eventData.date)}</p>
              <motion.button
                type="button"
                onClick={handleOpenInvitation}
                className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-white px-6 font-khmer-body font-semibold text-[#7a5a3b] shadow-lg"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              >
                បើកធៀប
              </motion.button>
            </motion.div>

            <motion.div
              className="pointer-events-none absolute inset-y-0 left-0 w-1/2 overflow-hidden"
              initial={{ x: 0 }}
              exit={{ x: '-110%' }}
              transition={{ duration: 1.05, ease: [0.77, 0, 0.175, 1] }}
            >
              <div className="h-full w-full bg-gradient-to-r from-[#5f1f2f]/90 via-[#7a2a3e]/85 to-[#2f0f18]/80 backdrop-blur-md" />
              <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(90deg,transparent_0,transparent_8px,rgba(255,255,255,0.22)_9px,transparent_18px)]" />
            </motion.div>
            <motion.div
              className="pointer-events-none absolute inset-y-0 right-0 w-1/2 overflow-hidden"
              initial={{ x: 0 }}
              exit={{ x: '110%' }}
              transition={{ duration: 1.05, ease: [0.77, 0, 0.175, 1] }}
            >
              <div className="h-full w-full bg-gradient-to-l from-[#5f1f2f]/90 via-[#7a2a3e]/85 to-[#2f0f18]/80 backdrop-blur-md" />
              <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(90deg,transparent_0,transparent_8px,rgba(255,255,255,0.22)_9px,transparent_18px)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section {...fadeInUp} className="relative h-[68vh] min-h-[480px] overflow-hidden">
        {eventData.coverImage ? (
          <img src={eventData.coverImage} alt={eventData.title} className="h-full w-full object-cover object-top scale-105" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#f5ddc8,_#ead4c0_60%,_#dbc2ab)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/20" />

        <div className="absolute inset-x-0 bottom-10 px-6 text-center text-white">
          <p className="text-sm tracking-[0.2em]">WEDDING INVITATION</p>
          <p className="mt-2 font-khmer-heading text-xl text-amber-100">សិរីមង្គលអាពាហ៍ពិពាហ៍</p>
          <h1 className="mt-4 font-khmer-heading text-4xl leading-tight sm:text-5xl">
            {groomName} <span className="mx-2 text-2xl">&</span> {brideName}
          </h1>
          <p className="mt-4 text-sm">{formatEventDate(eventData.date)}</p>
        </div>
      </motion.section>

      <div className="space-y-8 px-6 py-8">
        <motion.section
          {...(useLiteEffects ? instantSection : fadeInUp)}
          className={`rounded-3xl border border-white/20 bg-white/10 p-5 shadow-sm ${useLiteEffects ? '' : 'backdrop-blur-md'}`}
        >
          <p className="text-center text-lg leading-8 text-white/95">
            សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ លោក លោកស្រី និងភ្ញៀវកិត្តិយសទាំងអស់
            ចូលរួមជាសក្ខីភាពក្នុងពិធីមង្គលការរបស់
            <span className="mx-1 font-semibold text-amber-100">{groomName}</span>
            និង
            <span className="mx-1 font-semibold text-amber-100">{brideName}</span>
            ដែលនឹងប្រព្រឹត្តទៅនៅ
            <span className="mx-1 font-semibold text-amber-100">{eventData.address || eventData.location}</span>។
          </p>
        </motion.section>

        <motion.section
          {...(useLiteEffects ? instantSection : fadeInUp)}
          className={`rounded-3xl border border-white/20 bg-white/10 p-5 shadow-sm ${useLiteEffects ? '' : 'backdrop-blur-md'}`}
        >
          <h2 className="text-center text-lg font-semibold text-white">Countdown</h2>
          <CountdownCards eventDate={eventData.date} />
        </motion.section>

        <motion.section {...(useLiteEffects ? instantSection : fadeInUp)} className="space-y-3">
          <h2 className="text-center text-lg font-semibold text-white">Photo Gallery</h2>
          <div className="grid grid-cols-2 gap-2">
            {galleryImages.length ? (
              displayedGalleryImages.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  onClick={() => setActiveGalleryIndex(index)}
                  className={`group relative w-full overflow-hidden rounded-2xl ${
                    index === 0 ? 'col-span-2 h-72 sm:h-80' : 'h-56 sm:h-64'
                  }`}
                  aria-label={`View gallery image ${index + 1}`}
                >
                  <img
                    src={imageUrl}
                    alt={`Wedding ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    className="h-full w-full cursor-zoom-in rounded-2xl object-cover object-top shadow-sm transition duration-200 group-hover:scale-[1.02]"
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '256px' }}
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-black/0 pb-2 text-xs font-medium text-white opacity-0 transition duration-200 group-hover:bg-black/30 group-hover:opacity-100">
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    ចុចមើលរូប
                  </span>
                </button>
              ))
            ) : (
              <div className="col-span-2 rounded-2xl border border-dashed border-white/30 bg-white/10 p-6 text-center text-sm text-white/85 backdrop-blur-sm">
                មិនទាន់មានរូបភាពនៅក្នុងព្រឹត្តិការណ៍នេះ
              </div>
            )}
          </div>
          {galleryImages.length > displayedGalleryImages.length ? (
            <>
              <div ref={galleryLoadMoreRef} className="h-1 w-full" aria-hidden="true" />
              <div className="text-center text-xs text-white/80">
                កំពុងផ្ទុករូបភាពបន្ថែម...
              </div>
            </>
          ) : null}
        </motion.section>

        <motion.section
          {...(useLiteEffects ? instantSection : fadeInUp)}
          className={`rounded-3xl border border-white/20 bg-white/10 p-5 shadow-sm ${useLiteEffects ? '' : 'backdrop-blur-md'}`}
        >
          <h2 className="text-center text-lg font-semibold text-white">ចំណងជើងធំ</h2>
          <div className="relative mt-5 space-y-4 before:absolute before:bottom-1 before:left-[11px] before:top-1 before:w-px before:bg-white/35">
            {programItems.map((item) => (
              <div key={`${item.time}-${item.title}`} className="relative pl-8">
                <span className="absolute left-0 top-1.5 h-[10px] w-[10px] rounded-full bg-amber-200" />
                <p className="text-xs font-semibold tracking-wide text-amber-100">{item.time}</p>
                <p className="mt-0.5 font-semibold text-white">{item.title}</p>
                {item.detail && <p className="text-sm text-white/85">{item.detail}</p>}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          {...(useLiteEffects ? instantSection : fadeInUp)}
          className={`rounded-3xl border border-white/20 bg-white/10 p-5 shadow-sm ${useLiteEffects ? '' : 'backdrop-blur-md'}`}
        >
          <h2 className="text-center text-lg font-semibold text-white">Location</h2>
          <div className="mt-4 space-y-3">
            <p className="inline-flex items-center gap-2 text-sm text-white/90">
              <MapPin className="h-4 w-4 text-amber-100" />
              {eventData.address || eventData.location}
            </p>
            <p className="inline-flex items-center gap-2 text-sm text-white/90">
              <CalendarDays className="h-4 w-4 text-amber-100" />
              {formatEventDate(eventData.date)}
            </p>

            {eventData.googleMapLink ? (
              <a
                href={eventData.googleMapLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#8f6b46] px-4 py-2 text-sm text-white transition hover:bg-[#7a5a3b]"
              >
                Open Google Maps
                <Share2 className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </motion.section>
      </div>

      <motion.footer
        {...(useLiteEffects ? instantSection : fadeInUp)}
        className="border-t border-[#e3d0ba] bg-[#fff7ef] px-6 py-8 text-center text-sm text-[#73593f]"
      >
        <div className="mb-2 flex items-center justify-center gap-3 text-[#8f6b46]">
          <Play className="h-4 w-4" />
          <span>Created by Pithi Digital</span>
        </div>
        <p>@pithidigital · Facebook · Telegram · Instagram</p>
      </motion.footer>
    </article>
  );
}

function CountdownCards({ eventDate }: { eventDate: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const targetTime = new Date(eventDate).getTime();
  const remaining = Math.max(targetTime - now, 0);
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
      {[
        { label: 'ថ្ងៃ', value: days },
        { label: 'ម៉ោង', value: String(hours).padStart(2, '0') },
        { label: 'នាទី', value: String(minutes).padStart(2, '0') },
        { label: 'វិនាទី', value: String(seconds).padStart(2, '0') },
      ].map((cell) => (
        <div key={cell.label} className="rounded-2xl bg-white/20 px-1 py-3 text-white shadow-sm backdrop-blur-sm">
          <p className="text-xl font-bold">{cell.value}</p>
          <p className="text-[11px] text-white/80">{cell.label}</p>
        </div>
      ))}
    </div>
  );
}
