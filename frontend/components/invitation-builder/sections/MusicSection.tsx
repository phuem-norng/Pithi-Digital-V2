'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BuilderState, MusicOption } from '../types';

const getMusicById = (options: MusicOption[], id: string) =>
  options.find((option) => option.id === id) || options[0];

type MusicSectionProps = {
  musicOptions: MusicOption[];
  musicEnabled: boolean;
  musicId: string;
  musicUrl: string;
  onChange: (updates: Partial<BuilderState>) => void;
};

export default function MusicSection({ musicOptions, musicEnabled, musicId, musicUrl, onChange }: MusicSectionProps) {
  const handleSelect = (value: string | null) => {
    if (!value) return;
    const option = getMusicById(musicOptions, value);
    onChange({ musicId: value, musicUrl: option?.url || '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Music</span>
        <button
          type="button"
          onClick={() => onChange({ musicEnabled: !musicEnabled })}
          className={`h-6 w-11 rounded-full p-0.5 transition ${musicEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
          aria-pressed={musicEnabled}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white transition ${musicEnabled ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      <Select value={musicId} onValueChange={handleSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select music" />
        </SelectTrigger>
        <SelectContent>
          {musicOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <audio controls src={musicUrl} className="w-full" />

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => onChange({ musicUrl: '', musicId: '' })}
      >
        Remove music
      </Button>
    </div>
  );
}
