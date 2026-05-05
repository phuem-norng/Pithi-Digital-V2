'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import InvitationCard from './InvitationCard';
import type { BuilderState } from './types';

type PreviewPanelProps = {
  data: BuilderState;
};

export default function PreviewPanel({ data }: PreviewPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!data.musicEnabled || !data.musicUrl) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    const tryPlay = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    };

    tryPlay();
  }, [data.musicEnabled, data.musicUrl]);

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
          <audio ref={audioRef} src={data.musicUrl} loop preload="auto" className="hidden" />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[31rem]">
        <InvitationCard data={data} />
      </div>
    </aside>
  );
}
