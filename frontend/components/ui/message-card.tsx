'use client';

import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion } from 'framer-motion';

type MessageCardProps = {
  text: string;
  tone: 'success' | 'error';
  onClose: () => void;
  className?: string;
};

export function MessageCard({ text, tone, onClose, className = '' }: MessageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-start gap-3 rounded-2xl border p-3 text-sm shadow-sm ${
        tone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
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
        className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5"
        aria-label="Close message"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
