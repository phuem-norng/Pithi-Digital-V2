'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BuilderState } from '../types';

type MapSectionProps = {
  mapUrl: string;
  mapImageUrl: string;
  onChange: (updates: Partial<BuilderState>) => void;
  onMapImageChange: (file: File | null) => void;
};

export default function MapSection({ mapUrl, mapImageUrl, onChange, onMapImageChange }: MapSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Google Maps Link</Label>
        <Input value={mapUrl} onChange={(event) => onChange({ mapUrl: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>រូបភាពផែនទី</Label>
        <Input type="file" accept="image/*" onChange={(event) => onMapImageChange(event.target.files?.[0] || null)} />
        {mapImageUrl ? (
          <img src={mapImageUrl} alt="map" className="h-28 w-full rounded-xl object-cover" />
        ) : null}
      </div>
    </div>
  );
}
