'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { BuilderState } from '../types';

type LanguageSectionProps = {
  language: BuilderState['language'];
  onChange: (updates: Partial<BuilderState>) => void;
};

export default function LanguageSection({ language, onChange }: LanguageSectionProps) {
  const isKm = language === 'km';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 dark:text-white">
          {isKm ? 'ភាសា' : 'Language'}
        </span>
      </div>
      <RadioGroup
        value={language}
        onValueChange={(val: string) => onChange({ language: val as 'km' | 'en' })}
        className="grid grid-cols-2 gap-3"
      >
        <div
          className={`flex items-center space-x-2 rounded-lg border px-3 py-2 transition-colors ${
            language === 'km'
              ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-200'
              : 'border-gray-200 bg-white text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <RadioGroupItem value="km" id="lang-km" />
          <Label htmlFor="lang-km" className="cursor-pointer">ខ្មែរ</Label>
        </div>
        <div
          className={`flex items-center space-x-2 rounded-lg border px-3 py-2 transition-colors ${
            language === 'en'
              ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-200'
              : 'border-gray-200 bg-white text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <RadioGroupItem value="en" id="lang-en" />
          <Label htmlFor="lang-en" className="cursor-pointer">English</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
