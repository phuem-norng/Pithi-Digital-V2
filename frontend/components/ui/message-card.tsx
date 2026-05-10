'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion } from 'framer-motion';

const DEFAULT_AUTO_DISMISS_MS: Record<'success' | 'error', number> = {
  success: 6500,
  error: 8500,
};

type MessageCardProps = {
  text: string;
  tone: 'success' | 'error';
  onClose: () => void;
  className?: string;
  /**
   * Auto-hide after this many milliseconds.
   * Defaults by tone (~6.5s success, ~8.5s error) for readable Khmer copy.
   * Set to `0` to disable (close button only).
   */
  autoDismissMs?: number;
};

export function MessageCard({
  text,
  tone,
  onClose,
  className = '',
  autoDismissMs,
}: MessageCardProps) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (autoDismissMs === 0) {
      return;
    }
    const ms =
      typeof autoDismissMs === 'number' ? autoDismissMs : DEFAULT_AUTO_DISMISS_MS[tone];
    const id = window.setTimeout(() => {
      onCloseRef.current();
    }, ms);
    return () => window.clearTimeout(id);
  }, [text, tone, autoDismissMs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-start gap-3 rounded-2xl border p-3 text-sm shadow-sm ${
        tone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/35 dark:text-rose-200'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/35 dark:text-emerald-200'
      } ${className}`}
    >
      {tone === 'error' ? (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
      )}
      <p className="flex-1">{text}</p>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Close message"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
