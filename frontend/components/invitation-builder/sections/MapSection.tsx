'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BuilderState } from '../types';

type MapSectionProps = {
  mapUrl: string;
  mapImageUrl: string;
  lang: 'km' | 'en';
  onChange: (updates: Partial<BuilderState>) => void;
  onMapImageChange: (file: File | null) => void;
};

export default function MapSection({ mapUrl, mapImageUrl, lang, onChange, onMapImageChange }: MapSectionProps) {
  const isKm = lang === 'km';
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="dark:text-slate-300">Google Maps Link</Label>
        <Input value={mapUrl} onChange={(event) => onChange({ mapUrl: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label className="dark:text-slate-300">{isKm ? 'រូបភាពផែនទី' : 'Map image'}</Label>
        <Input type="file" accept="image/*" onChange={(event) => onMapImageChange(event.target.files?.[0] || null)} />
        {mapImageUrl ? (
          <img src={mapImageUrl} alt="map" className="h-28 w-full rounded-xl object-cover" />
        ) : null}
      </div>
    </div>
  );
}
