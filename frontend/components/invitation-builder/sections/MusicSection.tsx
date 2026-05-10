'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  clamp,
  clampPlayheadToClip,
  formatMusicTime,
  resolveClipRange,
  resolveClipRangeFromDuration,
  seekIfNeeded,
} from '../music-clip-utils';
import type { BuilderState, MusicOption } from '../types';
import { cn } from '@/lib/utils';

const getMusicById = (options: MusicOption[], id: string) =>
  options.find((option) => option.id === id) || options[0];

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
  const scrubbingRef = useRef(false);
  const trimAutoPlayBaselineRef = useRef<string | null>(null);
  /** Real media duration (float) — keeps sliders & loop aligned with decoded audio. */
  const [durationSec, setDurationSec] = useState(0);
  const [audioNow, setAudioNow] = useState(0);
  /** While dragging playback scrub — drives the slider so React state cannot fight backward seeks. */
  const [playbackDragSec, setPlaybackDragSec] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
      const raw = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDurationSec(raw > 0 ? raw : 0);
      setAudioNow(audio.currentTime);
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
    const sync = () => setIsPlaying(!audio.paused);
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);
    sync();
    return () => {
      audio.removeEventListener('play', sync);
      audio.removeEventListener('pause', sync);
    };
  }, [musicUrl]);

  useLayoutEffect(() => {
    if (!scrubbingRef.current) {
      setPlaybackDragSec(null);
    }

    const audio = audioRef.current;
    if (!audio || !musicEnabled || !musicUrl || durationSec <= 0) return;

    const clip = resolveClipRange(audio, musicStartSec, musicEndSec, durationSec);
    if (!clip.hasClip) {
      setAudioNow(audio.currentTime);
      return;
    }

    clampPlayheadToClip(audio, clip);
    setAudioNow(audio.currentTime);
  }, [musicEnabled, musicUrl, durationSec, musicStartSec, musicEndSec]);

  useEffect(() => {
    const sig = `${musicUrl}|${musicStartSec ?? ''}|${musicEndSec ?? ''}`;
    const prevBaseline = trimAutoPlayBaselineRef.current;
    trimAutoPlayBaselineRef.current = sig;

    if (prevBaseline === null || prevBaseline === sig) {
      return;
    }

    if (!musicEnabled || !musicUrl || durationSec <= 0) {
      return;
    }

    const tid = window.setTimeout(() => {
      const el = audioRef.current;
      if (!el || !musicEnabled) return;

      const clip = resolveClipRange(el, musicStartSec, musicEndSec, durationSec);
      if (clip.hasClip) {
        seekIfNeeded(el, clip.start, 0.08);
      }

      void el.play().catch(() => {
        /* Autoplay gesture / browser restriction — ignore silently. */
      });
    }, 260);

    return () => window.clearTimeout(tid);
  }, [musicStartSec, musicEndSec, musicUrl, musicEnabled, durationSec]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !musicUrl) return;

    const syncFromElement = () => {
      const clip = resolveClipRange(audio, musicStartSec, musicEndSec, durationSec);

      if (!scrubbingRef.current) {
        setAudioNow(audio.currentTime);
      }

      if (!clip.hasClip || !musicEnabled || scrubbingRef.current) return;
      if (audio.currentTime >= clip.end - 0.06) {
        const wasPlaying = !audio.paused;
        seekIfNeeded(audio, clip.start, 0.08);
        if (wasPlaying) {
          void audio.play().catch(() => {});
        }
      }
    };

    const onSeeked = () => {
      const clip = resolveClipRange(audio, musicStartSec, musicEndSec, durationSec);
      if (scrubbingRef.current) {
        /* Handlers apply setAudioNow from the clamped seek target; avoid reading stale currentTime mid-drag. */
        return;
      }
      setAudioNow(audio.currentTime);
      if (!clip.hasClip || !musicEnabled) return;
      clampPlayheadToClip(audio, clip);
      setAudioNow(audio.currentTime);
    };

    audio.addEventListener('timeupdate', syncFromElement);
    audio.addEventListener('seeked', onSeeked);
    return () => {
      audio.removeEventListener('timeupdate', syncFromElement);
      audio.removeEventListener('seeked', onSeeked);
    };
  }, [musicUrl, durationSec, musicStartSec, musicEndSec, musicEnabled]);

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

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !musicEnabled || !musicUrl || durationSec <= 0) return;
    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    const clip = resolveClipRange(audio, musicStartSec, musicEndSec, durationSec);
    if (clip.hasClip && (audio.currentTime < clip.start || audio.currentTime >= clip.end - 0.06)) {
      seekIfNeeded(audio, clip.start, 0.08);
    }
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [musicEnabled, musicUrl, durationSec, musicStartSec, musicEndSec]);

  const durInt = useMemo(() => (durationSec > 0 ? Math.floor(durationSec) : 0), [durationSec]);

  const endScrubbing = useCallback(() => {
    scrubbingRef.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = audioRef.current;
        if (!el || durInt <= 0) {
          setPlaybackDragSec(null);
          return;
        }
        const clip = resolveClipRange(el, musicStartSec, musicEndSec, durationSec);
        if (clip.hasClip && musicEnabled) {
          clampPlayheadToClip(el, clip);
        }
        setAudioNow(el.currentTime);
        setPlaybackDragSec(null);
      });
    });
  }, [durInt, durationSec, musicEnabled, musicStartSec, musicEndSec]);

  const normalizedStart =
    durInt > 0 ? clamp(Math.floor(start || 0), 0, Math.max(0, durInt - 1)) : Math.max(0, Math.floor(start || 0));
  const normalizedEndRaw = Math.floor(end || 0);
  const normalizedEndStored = durInt > 0 ? clamp(normalizedEndRaw, 0, durInt) : Math.max(0, normalizedEndRaw);

  const clipTimes = useMemo(
    () => resolveClipRangeFromDuration(durationSec, musicStartSec, musicEndSec),
    [durationSec, musicStartSec, musicEndSec],
  );

  const isClipEnabled = clipTimes.hasClip;
  const implicitEndToFullTrack = normalizedEndRaw === 0 && normalizedStart > 0 && durInt > 0 && clipTimes.hasClip;

  const clipSpanSec = isClipEnabled ? Math.max(0, clipTimes.end - clipTimes.start) : 0;
  const inClipSeconds = isClipEnabled ? clamp(audioNow - clipTimes.start, 0, clipSpanSec) : audioNow;
  const scrubMax = isClipEnabled ? Math.max(0.01, clipSpanSec) : Math.max(0.01, Math.max(durationSec, durInt || 1));
  const scrubFullMax = durationSec > 0 ? durationSec : durInt;
  const scrubValue = isClipEnabled ? inClipSeconds : clamp(audioNow, 0, scrubFullMax);
  const scrubLabelEnd = isClipEnabled ? clipSpanSec : scrubFullMax;
  /** Slider thumb position — during drag avoids controlled-input fighting the browser while seeking backward. */
  const playbackSliderValue = clamp(
    playbackDragSec !== null ? playbackDragSec : scrubValue,
    0,
    scrubMax,
  );

  const endSliderDisplayedValue =
    durInt <= 0
      ? 0
      : implicitEndToFullTrack
        ? durInt
        : normalizedEndRaw > 0 && normalizedEndRaw > normalizedStart
          ? normalizedEndStored
          : normalizedEndRaw === 0 && normalizedStart === 0
            ? 0
            : durInt;

  const commitEndSlider = (sliderValue: number) => {
    if (durInt <= 0) return;
    const v = clamp(Math.floor(sliderValue), 0, durInt);
    const st = normalizedStart;

    if (st === 0) {
      if (v <= 0 || v >= durInt) {
        onChange({ musicEndSec: 0 });
        return;
      }
      onChange({ musicEndSec: v });
      return;
    }

    if (v >= durInt) {
      onChange({ musicEndSec: 0 });
      return;
    }
    if (v <= st) {
      onChange({ musicEndSec: 0 });
      return;
    }
    onChange({ musicEndSec: v });
  };

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
        <SelectTrigger
          className={cn(
            'h-auto min-h-10 w-full justify-between gap-2 whitespace-normal rounded-xl border-gray-200/90 bg-white px-3 py-2 text-left text-sm leading-snug text-gray-900 shadow-sm',
            'hover:bg-gray-50/90 data-[size=default]:h-auto data-[size=default]:min-h-10',
            '*:data-[slot=select-value]:line-clamp-2 *:data-[slot=select-value]:text-left',
            'focus-visible:border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-200/50',
            'dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/90',
            isKm && 'font-khmer-body',
          )}
        >
          <SelectValue placeholder={isKm ? 'ជ្រើសបទតន្ត្រី' : 'Select music'}>
            {getMusicById(musicOptions, musicId)?.label || (isKm ? 'ជ្រើសបទតន្ត្រី' : 'Select music')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={false}
          sideOffset={8}
          align="start"
          className={cn(
            'max-h-[min(20rem,58vh)] w-[min(var(--anchor-width),17rem)] min-w-[min(var(--anchor-width),17rem)] rounded-xl border border-gray-100 bg-white p-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.1)] ring-0 sm:w-[min(var(--anchor-width),19rem)] sm:min-w-[min(var(--anchor-width),19rem)]',
            'dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_8px_28px_rgba(0,0,0,0.4)]',
          )}
        >
          {musicOptions.map((option) => (
            <SelectItem
              key={option.id}
              value={option.id}
              textWrap
              className={cn(
                'cursor-pointer rounded-lg border-0 py-2 pl-2.5 pr-9 text-left text-sm leading-snug text-gray-900',
                'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900 focus:bg-transparent',
                'dark:text-slate-100 dark:data-[highlighted]:bg-slate-800 dark:data-[highlighted]:text-slate-50',
                '[&_svg]:size-4 [&_svg]:text-gray-900 dark:[&_svg]:text-slate-100',
                isKm && 'font-khmer-body',
              )}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {musicUrl ? (
        <>
          <audio ref={audioRef} src={musicUrl} preload="auto" className="hidden" />
          <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <button
                type="button"
                disabled={!musicEnabled || durInt <= 0}
                onClick={() => void togglePlay()}
                className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-rose-700 shadow-sm disabled:pointer-events-none disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-rose-300"
                aria-label={isKm ? (isPlaying ? 'ផ្អាក' : 'លេង') : isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[11px] font-semibold leading-snug text-gray-800 dark:text-slate-200">
                  {isKm
                    ? isClipEnabled
                      ? 'លេងតន្ត្រី (ជាប់នឹងការកាត់)'
                      : 'លេងតន្ត្រី'
                    : isClipEnabled
                      ? 'Playback (trimmed range)'
                      : 'Playback'}
                </p>
                <input
                  type="range"
                  min={0}
                  max={scrubMax}
                  step={0.05}
                  value={playbackSliderValue}
                  disabled={!musicEnabled || durInt <= 0}
                  onPointerDown={() => {
                    scrubbingRef.current = true;
                    const el = audioRef.current;
                    if (!el || durInt <= 0) return;
                    const clip = resolveClipRange(el, musicStartSec, musicEndSec, durationSec);
                    const mx = scrubMax;
                    const rel = clip.hasClip
                      ? clamp(el.currentTime - clip.start, 0, mx)
                      : clamp(el.currentTime, 0, mx);
                    setPlaybackDragSec(rel);
                  }}
                  onPointerUp={endScrubbing}
                  onPointerCancel={endScrubbing}
                  onInput={(e) => {
                    const audio = audioRef.current;
                    if (!audio || durInt <= 0) return;
                    const vRaw = Number((e.target as HTMLInputElement).value);
                    const vRel = clamp(vRaw, 0, scrubMax);
                    setPlaybackDragSec(vRel);
                    const clip = resolveClipRange(audio, musicStartSec, musicEndSec, durationSec);
                    const maxAbs =
                      Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : durationSec;
                    const raw = clip.hasClip ? clip.start + vRel : vRel;
                    const next = clamp(raw, 0, maxAbs);
                    audio.currentTime = next;
                    setAudioNow(next);
                  }}
                  onChange={(e) => {
                    const audio = audioRef.current;
                    if (!audio || durInt <= 0) return;
                    const vRaw = Number(e.target.value);
                    const vRel = clamp(vRaw, 0, scrubMax);
                    setPlaybackDragSec(vRel);
                    const clip = resolveClipRange(audio, musicStartSec, musicEndSec, durationSec);
                    const maxAbs =
                      Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : durationSec;
                    const raw = clip.hasClip ? clip.start + vRel : vRel;
                    const next = clamp(raw, 0, maxAbs);
                    audio.currentTime = next;
                    setAudioNow(next);
                  }}
                  className="w-full accent-rose-600 disabled:opacity-40"
                  aria-valuemin={0}
                  aria-valuemax={scrubMax}
                  aria-valuenow={playbackSliderValue}
                />
                <div className="flex justify-between gap-2 font-mono text-[10px] text-gray-600 dark:text-slate-400">
                  <span>{formatMusicTime(playbackSliderValue)}</span>
                  <span>{formatMusicTime(scrubLabelEnd)}</span>
                </div>
                {isClipEnabled && durInt > 0 ? (
                  <p className="text-[10px] leading-snug text-gray-500 dark:text-slate-500">
                    {isKm ? 'ទីតាំងក្នុងបទពេញ' : 'Position in full file'}: {formatMusicTime(audioNow)} /{' '}
                    {formatMusicTime(durationSec)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}

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
          {durInt > 0
            ? isKm
              ? `ប្រវែងបទ: ${formatMusicTime(durationSec)} · Clip: ${formatMusicTime(clipTimes.start)} → ${formatMusicTime(clipTimes.end)}`
              : `Duration: ${formatMusicTime(durationSec)} · Clip: ${formatMusicTime(clipTimes.start)} → ${formatMusicTime(clipTimes.end)}`
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
                max={durInt > 0 ? Math.max(0, durInt - 1) : undefined}
                value={normalizedStart}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  const nextStart = Number.isFinite(next) ? next : 0;
                  const clamped = durInt > 0 ? clamp(Math.floor(nextStart), 0, Math.max(0, durInt - 1)) : Math.max(0, Math.floor(nextStart));
                  onChange({ musicStartSec: clamped });
                }}
                className="h-8 w-24 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <input
              type="range"
              min={0}
              max={durInt > 0 ? Math.max(0, durInt - 1) : 0}
              step={1}
              value={durInt > 0 ? normalizedStart : 0}
              onInput={(e) => {
                const nextStart = Math.floor(Number((e.target as HTMLInputElement).value) || 0);
                onChange({ musicStartSec: nextStart });
              }}
              onChange={(e) => {
                const nextStart = Math.floor(Number(e.target.value) || 0);
                onChange({ musicStartSec: nextStart });
              }}
              disabled={durInt <= 0}
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
                max={durInt > 0 ? durInt : undefined}
                value={normalizedEndRaw}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  const nextEnd = Number.isFinite(next) ? next : 0;
                  const vi = durInt > 0 ? clamp(Math.floor(nextEnd), 0, durInt) : Math.max(0, Math.floor(nextEnd));
                  if (normalizedStart > 0 && (vi === 0 || vi >= durInt)) {
                    onChange({ musicEndSec: 0 });
                    return;
                  }
                  if (normalizedStart === 0) {
                    if (vi <= 0 || vi >= durInt) {
                      onChange({ musicEndSec: 0 });
                    } else {
                      onChange({ musicEndSec: vi });
                    }
                    return;
                  }
                  if (vi > normalizedStart) {
                    onChange({ musicEndSec: vi });
                    return;
                  }
                  onChange({ musicEndSec: 0 });
                }}
                className="h-8 w-24 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <input
              type="range"
              min={0}
              max={durInt > 0 ? durInt : 0}
              step={1}
              value={durInt > 0 ? endSliderDisplayedValue : 0}
              onInput={(e) => commitEndSlider(Number((e.target as HTMLInputElement).value))}
              onChange={(e) => commitEndSlider(Number(e.target.value))}
              disabled={durInt <= 0}
              className="w-full"
            />
          </div>
        </div>

        <p className="mt-2 text-[11px] text-gray-500 dark:text-slate-400">
          {isKm
            ? 'បើ Start = 0 និង End = 0 លេងពេញបទ។ បើ Start > 0 ហើយ End = 0 លេងពីចំណុច Start ដល់ចុងបទ។'
            : 'Start=0 and End=0: full track. If Start>0 and End=0: play from Start to end of file. End>Start sets an explicit end.'}
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
