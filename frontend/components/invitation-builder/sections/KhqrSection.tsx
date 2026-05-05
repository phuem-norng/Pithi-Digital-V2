'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type KhqrSectionProps = {
  khqrUsdUrl: string;
  khqrKhrUrl: string;
  lang: 'km' | 'en';
  onKhqrUsdChange: (file: File | null) => void;
  onKhqrKhrChange: (file: File | null) => void;
};

export default function KhqrSection({ khqrUsdUrl, khqrKhrUrl, lang, onKhqrUsdChange, onKhqrKhrChange }: KhqrSectionProps) {
  const isKm = lang === 'km';
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label className="dark:text-slate-300">{isKm ? 'KHQR ដុល្លារ' : 'KHQR USD'}</Label>
        <Input type="file" accept="image/*" onChange={(event) => onKhqrUsdChange(event.target.files?.[0] || null)} />
        {khqrUsdUrl ? (
          <img src={khqrUsdUrl} alt="KHQR USD" className="h-24 w-full rounded-xl object-cover" />
        ) : null}
      </div>
      <div className="space-y-2">
        <Label className="dark:text-slate-300">{isKm ? 'KHQR រៀល' : 'KHQR KHR'}</Label>
        <Input type="file" accept="image/*" onChange={(event) => onKhqrKhrChange(event.target.files?.[0] || null)} />
        {khqrKhrUrl ? (
          <img src={khqrKhrUrl} alt="KHQR KHR" className="h-24 w-full rounded-xl object-cover" />
        ) : null}
      </div>
    </div>
  );
}
