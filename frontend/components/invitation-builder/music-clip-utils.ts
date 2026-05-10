/** Shared playback math for trimmed music (editor Music section + preview). */

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function formatMusicTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function seekIfNeeded(audio: HTMLAudioElement, targetTime: number, epsilon = 0.25) {
  if (!Number.isFinite(targetTime)) return;
  if (Math.abs(audio.currentTime - targetTime) < epsilon) return;
  audio.currentTime = targetTime;
}

export type ClipRange = {
  start: number;
  end: number;
  hasClip: boolean;
  duration: number;
};

/**
 * Pure trim math (same rules as `resolveClipRange`) so UI scrubbers match playback.
 * `totalSec` should be the real media length (e.g. `audio.duration`), not a rounded floor.
 */
export function resolveClipRangeFromDuration(
  totalSec: number,
  musicStartSec: number | undefined,
  musicEndSec: number | undefined,
): ClipRange {
  const dur = Number.isFinite(totalSec) && totalSec > 0 ? totalSec : 0;
  const rawStart = typeof musicStartSec === 'number' ? musicStartSec : 0;
  const rawEnd = typeof musicEndSec === 'number' ? musicEndSec : 0;
  const safeDuration = dur > 0 ? dur : 0;
  const safeStart =
    safeDuration > 0 ? clamp(rawStart, 0, Math.max(0, safeDuration - 0.25)) : Math.max(0, rawStart);

  let safeEnd: number;
  let hasClip: boolean;

  if (safeDuration <= 0) {
    safeEnd = 0;
    hasClip = false;
  } else if (rawStart === 0 && rawEnd === 0) {
    safeEnd = safeDuration;
    hasClip = false;
  } else if (rawEnd === 0 && rawStart > 0) {
    safeEnd = safeDuration;
    hasClip = safeEnd > safeStart;
  } else if (rawEnd > 0 && rawEnd > rawStart) {
    safeEnd = clamp(rawEnd, 0, safeDuration);
    hasClip = safeEnd > safeStart;
  } else {
    return {
      start: 0,
      end: safeDuration,
      hasClip: false,
      duration: safeDuration,
    };
  }

  return {
    start: safeStart,
    end: safeEnd,
    hasClip,
    duration: safeDuration,
  };
}

/**
 * Clip rules (matches editor help copy):
 * - Start=0, End=0 → no trim (play full file from 0).
 * - Start>0, End=0 → play from Start through end of file (implicit end).
 * - End>0 and End>Start → explicit end time in the file.
 * - Otherwise → no trim (full file from 0).
 */
export function resolveClipRange(
  audio: HTMLAudioElement,
  musicStartSec: number | undefined,
  musicEndSec: number | undefined,
  fallbackDuration = 0,
) {
  const dur =
    Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Math.max(0, fallbackDuration);
  return resolveClipRangeFromDuration(dur, musicStartSec, musicEndSec);
}

/** Clamp playhead inside [start, end) for looping preview; uses small inner margin before `end`. */
export function clampPlayheadToClip(audio: HTMLAudioElement, clip: ClipRange, innerEndMargin = 0.06): void {
  if (!clip.hasClip || clip.duration <= 0) return;
  const lower = clip.start;
  const upperExclusive = Math.max(lower, clip.end - innerEndMargin);
  const t = clamp(audio.currentTime, lower, upperExclusive);
  seekIfNeeded(audio, t, 0.08);
}
