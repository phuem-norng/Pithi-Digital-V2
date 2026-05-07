'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import InvitationCard from './InvitationCard';
import type { BuilderState } from './types';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function seekIfNeeded(audio: HTMLAudioElement, targetTime: number) {
  if (!Number.isFinite(targetTime)) return;
  // Avoid repeated seeks that cause audible stutter during autoplay retries.
  if (Math.abs(audio.currentTime - targetTime) < 0.35) return;
  audio.currentTime = targetTime;
}

function resolveClipRange(audio: HTMLAudioElement, data: BuilderState) {
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  const start = typeof data.musicStartSec === 'number' ? data.musicStartSec : 0;
  const end = typeof data.musicEndSec === 'number' ? data.musicEndSec : 0;

  const safeDuration = duration > 0 ? duration : 0;
  const safeStart = safeDuration > 0 ? clamp(start, 0, Math.max(0, safeDuration - 0.25)) : Math.max(0, start);
  const safeEnd =
    safeDuration > 0 && end > safeStart
      ? clamp(end, 0, safeDuration)
      : safeDuration;

  return { start: safeStart, end: safeEnd, hasClip: safeDuration > 0 && safeEnd > safeStart && end > safeStart };
}

type PreviewPanelProps = {
  data: BuilderState;
};

export default function PreviewPanel({ data }: PreviewPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playAttemptTokenRef = useRef(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    playAttemptTokenRef.current += 1;
    const token = playAttemptTokenRef.current;

    if (!data.musicEnabled || !data.musicUrl) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    const tryPlay = async () => {
      try {
        const { start } = resolveClipRange(audio, data);
        seekIfNeeded(audio, start);
        await audio.play();
        if (playAttemptTokenRef.current !== token) return;
        setIsPlaying(true);
      } catch {
        if (playAttemptTokenRef.current !== token) return;
        setIsPlaying(false);
      }
    };

    tryPlay();
  }, [data.musicEnabled, data.musicUrl, data.musicStartSec, data.musicEndSec]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !data.musicEnabled || !data.musicUrl) return;

    const onTimeUpdate = () => {
      const { start, end, hasClip } = resolveClipRange(audio, data);
      if (!hasClip) return;
      if (audio.currentTime >= Math.max(0, end - 0.05)) {
        const wasPlaying = !audio.paused;
        seekIfNeeded(audio, start);
        if (wasPlaying) {
          void audio.play().catch(() => {
            setIsPlaying(false);
          });
        }
      }
    };

    const onLoaded = () => {
      const { start } = resolveClipRange(audio, data);
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
  }, [data.musicEnabled, data.musicUrl, data.musicStartSec, data.musicEndSec]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const notifyPreviewPlay = () => {
      window.dispatchEvent(new CustomEvent('pithi:builder-preview-music-play'));
    };

    const onEditorPlay = () => {
      if (!audio.paused) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    audio.addEventListener('play', notifyPreviewPlay);
    window.addEventListener('pithi:builder-editor-music-play', onEditorPlay);
    return () => {
      audio.removeEventListener('play', notifyPreviewPlay);
      window.removeEventListener('pithi:builder-editor-music-play', onEditorPlay);
    };
  }, []);

  const handleToggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio || !data.musicEnabled || !data.musicUrl) {
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      const { start } = resolveClipRange(audio, data);
      seekIfNeeded(audio, start);
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <aside className="relative h-full overflow-y-auto bg-[#f7f1e8] px-3 py-5 dark:bg-slate-950 sm:px-4 sm:py-6 lg:px-5 lg:py-7">
      {data.musicEnabled && data.musicUrl ? (
        <div className="pointer-events-none absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-3 py-2 shadow-sm dark:border-slate-600 dark:bg-slate-900/95">
            <span className="text-xs font-medium text-gray-700 dark:text-slate-200">
              {data.language === 'en' ? 'Music' : 'តន្ត្រី'}
            </span>
            <button
              type="button"
              onClick={handleToggleMusic}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-[#7b1c2f] dark:border-slate-600 dark:bg-slate-800 dark:text-rose-300"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>
          <audio ref={audioRef} src={data.musicUrl} preload="auto" className="hidden" />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[31rem]">
        <InvitationCard data={data} />
      </div>
    </aside>
  );
}
