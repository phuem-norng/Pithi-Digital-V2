'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { BuilderState } from '../types';

type GreetingSectionProps = {
  greetingTitle: string;
  greetingMessage: string;
  onChange: (updates: Partial<BuilderState>) => void;
};

export default function GreetingSection({ greetingTitle, greetingMessage, onChange }: GreetingSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>ចំណងជើង</Label>
        <Input value={greetingTitle} onChange={(event) => onChange({ greetingTitle: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>សេចក្តីថ្លែងអំណរគុណ</Label>
        <Textarea
          rows={4}
          value={greetingMessage}
          onChange={(event) => onChange({ greetingMessage: event.target.value })}
        />
      </div>
    </div>
  );
}
