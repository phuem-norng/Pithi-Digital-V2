'use client';

import { Label } from '@/components/ui/label';
import { UploadCloud, X } from 'lucide-react';

type BackgroundSectionProps = {
  backgroundUrl: string;
  onBackgroundChange: (file: File | null) => void;
  lang: 'km' | 'en';
};

export default function BackgroundSection({
  backgroundUrl,
  onBackgroundChange,
  lang,
}: BackgroundSectionProps) {
  const isKm = lang === 'km';
  
  return (
    <div className="space-y-4">
      {backgroundUrl ? (
        <div className="relative h-32 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
          <img src={backgroundUrl} alt="Background" className="h-full w-full object-cover" />
          <button
            onClick={() => onBackgroundChange(null)}
            className="absolute right-2 top-2 rounded-full bg-white p-1 text-red-500 shadow hover:bg-gray-50 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700">
          <UploadCloud className="mb-2 h-6 w-6 text-gray-400 dark:text-slate-400" />
          <span className="text-sm text-gray-500 dark:text-slate-300">
            {isKm ? 'ដាក់រូបភាព' : 'Upload Background'}
          </span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onBackgroundChange(file);
            }}
          />
        </label>
      )}
    </div>
  );
}
