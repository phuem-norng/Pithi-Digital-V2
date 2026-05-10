'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { UploadCloud, X } from 'lucide-react';
import type { BuilderState } from '../types';

type GallerySectionProps = {
  images: string[];
  onChange: (updates: Partial<BuilderState>) => void;
  lang: 'km' | 'en';
};

export default function GallerySection({ images, onChange, lang }: GallerySectionProps) {
  const isKm = lang === 'km';
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (images.length >= 8) {
      setUploadError(isKm ? 'អាចដាក់បានត្រឹម 8 រូបប៉ុណ្ណោះ។' : 'You can upload up to 8 images only.');
      e.target.value = '';
      return;
    }

    setUploadError('');
    setIsUploading(true);

    try {
      const url = await apiClient.uploadFile(file);
      onChange({ galleryImages: [...images, url] });
    } catch {
      setUploadError(isKm ? 'បរាជ័យក្នុងការបញ្ចូលរូបភាព។' : 'Failed to upload image.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = images.filter((_, idx) => idx !== indexToRemove);
    onChange({ galleryImages: newImages });
  };

  return (
    <div className="space-y-4">
      {uploadError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
          {uploadError}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        {images.map((img, idx) => (
          <div key={idx} className="group relative h-24 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
            <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-100 ring-offset-2 transition-opacity hover:bg-red-600 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-400 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
              aria-label={isKm ? `លុបរូបទី ${idx + 1}` : `Remove gallery image ${idx + 1}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {images.length < 8 && (
          <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700">
            <UploadCloud className="mb-1 h-5 w-5 text-gray-400 dark:text-slate-400" />
            <span className="text-[10px] text-gray-500 dark:text-slate-300">
              {isUploading
                ? isKm
                  ? 'កំពុងបញ្ចូល...'
                  : 'Uploading...'
                : isKm
                  ? 'ដាក់រូបភាព'
                  : 'Add photo'}
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}
