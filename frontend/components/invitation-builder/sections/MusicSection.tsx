'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BuilderState, MusicOption } from '../types';

const getMusicById = (options: MusicOption[], id: string) =>
  options.find((option) => option.id === id) || options[0];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatTime = (seconds: number) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

type MusicSectionProps = {
  musicOptions: MusicOption[];
  lang: 'km' | 'en';
  musicEnabled: boolean;
  musicId: string;
  musicUrl: string;
  musicStartSec?: number;
  musicEndSec?: number;
  onChange: (updates: Partial<BuilderState>) => void;
};

export default function MusicSection({
  musicOptions,
  lang,
  musicEnabled,
  musicId,
  musicUrl,
  musicStartSec,
  musicEndSec,
  onChange,
}: MusicSectionProps) {
  const isKm = lang === 'km';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);

  const start = useMemo(() => (typeof musicStartSec === 'number' ? musicStartSec : 0), [musicStartSec]);
  const end = useMemo(() => (typeof musicEndSec === 'number' ? musicEndSec : 0), [musicEndSec]);

  const handleSelect = (value: string | null) => {
    if (!value) return;
    const option = getMusicById(musicOptions, value);
    onChange({ musicId: value, musicUrl: option?.url || '', musicStartSec: 0, musicEndSec: 0 });
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => {
      const d = Number.isFinite(audio.duration) ? Math.floor(audio.duration) : 0;
      setDuration(d > 0 ? d : 0);
    };
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('durationchange', onLoaded);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('durationchange', onLoaded);
    };
  }, [musicUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const notifyEditorPlay = () => {
      window.dispatchEvent(new CustomEvent('pithi:builder-editor-music-play'));
    };

    const onPreviewPlay = () => {
      if (!audio.paused) {
        audio.pause();
      }
    };

    audio.addEventListener('play', notifyEditorPlay);
    window.addEventListener('pithi:builder-preview-music-play', onPreviewPlay);
    return () => {
      audio.removeEventListener('play', notifyEditorPlay);
      window.removeEventListener('pithi:builder-preview-music-play', onPreviewPlay);
    };
  }, []);

  const normalizedStart = duration > 0 ? clamp(Math.floor(start || 0), 0, Math.max(0, duration - 1)) : Math.max(0, Math.floor(start || 0));
  const normalizedEndRaw = Math.floor(end || 0);
  const normalizedEnd = duration > 0 ? clamp(normalizedEndRaw, 0, duration) : Math.max(0, normalizedEndRaw);
  const isClipEnabled = duration > 0 && normalizedEnd > normalizedStart;
  const effectiveEndLabel = isClipEnabled ? normalizedEnd : duration;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-white">{isKm ? 'តន្ត្រី' : 'Music'}</span>
        <button
          type="button"
          onClick={() => onChange({ musicEnabled: !musicEnabled })}
          className={`h-6 w-11 rounded-full p-0.5 transition ${musicEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
          aria-pressed={musicEnabled}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white transition ${musicEnabled ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      <Select value={musicId} onValueChange={handleSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isKm ? 'ជ្រើសបទតន្ត្រី' : 'Select music'}>
            {getMusicById(musicOptions, musicId)?.label || (isKm ? 'ជ្រើសបទតន្ត្រី' : 'Select music')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {musicOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <audio ref={audioRef} controls src={musicUrl} className="w-full" />

      <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
            {isKm ? 'កាត់ចម្រៀង' : 'Trim music'}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ musicStartSec: 0, musicEndSec: 0 })}
          >
            {isKm ? 'Reset' : 'Reset'}
          </Button>
        </div>

        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          {duration > 0
            ? isKm
              ? `ប្រវែងបទ: ${formatTime(duration)} · Clip: ${formatTime(normalizedStart)} → ${formatTime(effectiveEndLabel)}`
              : `Duration: ${formatTime(duration)} · Clip: ${formatTime(normalizedStart)} → ${formatTime(effectiveEndLabel)}`
            : isKm
              ? 'កំពុងទាញយកប្រវែងបទ...'
              : 'Loading duration...'}
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-slate-200">{isKm ? 'ចាប់ផ្តើម (វិនាទី)' : 'Start (sec)'}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={duration > 0 ? Math.max(0, duration - 1) : undefined}
                value={normalizedStart}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  const nextStart = Number.isFinite(next) ? next : 0;
                  const clamped = duration > 0 ? clamp(Math.floor(nextStart), 0, Math.max(0, duration - 1)) : Math.max(0, Math.floor(nextStart));
                  onChange({ musicStartSec: clamped });
                }}
                className="h-8 w-24 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration > 0 ? Math.max(0, duration - 1) : 0}
              step={1}
              value={duration > 0 ? normalizedStart : 0}
              onChange={(e) => {
                const nextStart = Math.floor(Number(e.target.value) || 0);
                onChange({ musicStartSec: nextStart });
              }}
              disabled={duration <= 0}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-slate-200">{isKm ? 'បញ្ចប់ (វិនាទី)' : 'End (sec)'}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={duration > 0 ? duration : undefined}
                value={normalizedEnd}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  const nextEnd = Number.isFinite(next) ? next : 0;
                  const clamped = duration > 0 ? clamp(Math.floor(nextEnd), 0, duration) : Math.max(0, Math.floor(nextEnd));
                  onChange({ musicEndSec: clamped });
                }}
                className="h-8 w-24 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 0}
              step={1}
              value={duration > 0 ? normalizedEnd : 0}
              onChange={(e) => {
                const nextEnd = Math.floor(Number(e.target.value) || 0);
                onChange({ musicEndSec: nextEnd });
              }}
              disabled={duration <= 0}
              className="w-full"
            />
          </div>
        </div>

        <p className="mt-2 text-[11px] text-gray-500 dark:text-slate-400">
          {isKm
            ? 'បើ End = 0 ឬ End ≤ Start នឹងលេងពេញបទ (ដូចមុន)។'
            : 'If End is 0 or End ≤ Start, it plays the full track (same as before).'}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => onChange({ musicUrl: '', musicId: '', musicStartSec: 0, musicEndSec: 0 })}
      >
        {isKm ? 'លុបតន្ត្រី' : 'Remove music'}
      </Button>
    </div>
  );
}
