'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { BuilderState } from '../types';

type LanguageSectionProps = {
  language: BuilderState['language'];
  onChange: (updates: Partial<BuilderState>) => void;
};

export default function LanguageSection({ language, onChange }: LanguageSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">ភាសា (Language)</span>
      </div>
      <RadioGroup
        value={language}
        onValueChange={(val: string) => onChange({ language: val as 'km' | 'en' })}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="km" id="lang-km" />
          <Label htmlFor="lang-km">ភាសាខ្មែរ</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="en" id="lang-en" />
          <Label htmlFor="lang-en">English</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
