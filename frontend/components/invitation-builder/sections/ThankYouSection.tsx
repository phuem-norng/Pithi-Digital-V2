'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BuilderState } from '../types';

type ThankYouSectionProps = {
  thankYouTitle: string;
  thankYouMessage: string;
  onChange: (updates: Partial<BuilderState>) => void;
  lang: 'km' | 'en';
};

export default function ThankYouSection({
  thankYouTitle,
  thankYouMessage,
  onChange,
  lang,
}: ThankYouSectionProps) {
  const isKm = lang === 'km';
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{isKm ? 'ចំណងជើងសារ' : 'Title'}</Label>
        <Input
          value={thankYouTitle}
          onChange={(e) => onChange({ thankYouTitle: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>{isKm ? 'សារអរគុណ' : 'Message'}</Label>
        <Textarea
          value={thankYouMessage}
          onChange={(e) => onChange({ thankYouMessage: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
