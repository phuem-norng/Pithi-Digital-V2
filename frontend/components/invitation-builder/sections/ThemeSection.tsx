'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BuilderState } from '../types';

type ThemeSectionProps = {
  textColor: string;
  headingColor: string;
  onChange: (updates: Partial<BuilderState>) => void;
};

export default function ThemeSection({ textColor, headingColor, onChange }: ThemeSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>ពណ៌អក្សរខាងមុខ(ក្របcover)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={textColor}
            onChange={(event) => onChange({ textColor: event.target.value })}
            className="h-11 w-12 p-1"
          />
          <Input value={textColor} placeholder="#e6c628" onChange={(event) => onChange({ textColor: event.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>ពណ៌អក្សរខាងក្រោម</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={headingColor}
            onChange={(event) => onChange({ headingColor: event.target.value })}
            className="h-11 w-12 p-1"
          />
          <Input value={headingColor} placeholder="#142e7b" onChange={(event) => onChange({ headingColor: event.target.value })} />
        </div>
      </div>
    </div>
  );
}
