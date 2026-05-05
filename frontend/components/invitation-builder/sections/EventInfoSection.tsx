'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BuilderState } from '../types';

type EventInfoSectionProps = {
  eventDate: string;
  eventEndDate: string;
  eventLocation: string;
  onChange: (updates: Partial<BuilderState>) => void;
  lang: 'km' | 'en';
};

export default function EventInfoSection({
  eventDate,
  eventEndDate,
  eventLocation,
  onChange,
  lang,
}: EventInfoSectionProps) {
  const isKm = lang === 'km';
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{isKm ? 'កាលបរិច្ឆេទ និងម៉ោង' : 'Date & Time'}</Label>
        <Input
          value={eventDate}
          onChange={(e) => onChange({ eventDate: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>{isKm ? 'ថ្ងៃបញ្ចប់កម្មវិធី' : 'Event End Date'}</Label>
        <Input
          value={eventEndDate}
          onChange={(e) => onChange({ eventEndDate: e.target.value })}
          placeholder={isKm ? 'ឧ. 31/03/2026 ឬ 31/03/2026, 11:30 PM' : 'Ex. 31/03/2026 or 31/03/2026, 11:30 PM'}
        />
      </div>
      <div className="space-y-2">
        <Label>{isKm ? 'ទីតាំង' : 'Location'}</Label>
        <Input
          value={eventLocation}
          onChange={(e) => onChange({ eventLocation: e.target.value })}
        />
      </div>
    </div>
  );
}
