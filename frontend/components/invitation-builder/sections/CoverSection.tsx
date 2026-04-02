'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CoverSectionProps = {
  coverImageUrl: string;
  onCoverChange: (file: File | null) => void;
};

export default function CoverSection({ coverImageUrl, onCoverChange }: CoverSectionProps) {
  return (
    <div className="space-y-3">
      <Label>ផ្ទុករូបភាព</Label>
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
