'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CoverSectionProps = {
  coverImageUrl: string;
  lang: 'km' | 'en';
  onCoverChange: (file: File | null) => void;
};

export default function CoverSection({ coverImageUrl, lang, onCoverChange }: CoverSectionProps) {
  const isKm = lang === 'km';
  return (
    <div className="space-y-3">
      <Label>{isKm ? 'ផ្ទុករូបភាព' : 'Upload image'}</Label>
      <Input
        type="file"
        accept="image/*"
        onChange={(event) => {
          onCoverChange(event.target.files?.[0] || null);
          event.currentTarget.value = '';
        }}
      />
      {coverImageUrl ? (
        <img src={coverImageUrl} alt="cover" className="h-28 w-full rounded-xl object-cover" />
      ) : null}
    </div>
  );
}
