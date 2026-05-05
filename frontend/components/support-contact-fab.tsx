'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { apiClient, type SupportLink } from '@/lib/api-client';

const platformStyles: Record<string, { bg: string; icon: JSX.Element }> = {
  telegram: { bg: 'bg-[#1D9BF0]', icon: <Send className="h-5 w-5" /> },
  facebook: { bg: 'bg-[#1877F2]', icon: <MessageCircle className="h-5 w-5" /> },
  messenger: { bg: 'bg-[#0084FF]', icon: <MessageCircle className="h-5 w-5" /> },
};

export function SupportContactFab() {
  const [links, setLinks] = useState<SupportLink[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient.getPublicSupportLinks().then((res) => {
      if (active) {
        setLinks(res.filter((item) => item.isActive));
      }
    }).catch(() => {
      if (active) {
        setLinks([]);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const visibleLinks = useMemo(() => links.slice(0, 6), [links]);

  if (visibleLinks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2">
      {open && visibleLinks.map((link) => {
        const key = (link.platform || '').toLowerCase();
        const style = platformStyles[key] || { bg: 'bg-[#2b2f36]', icon: <MessageCircle className="h-5 w-5" /> };
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-white shadow-lg transition hover:brightness-105 ${style.bg}`}
          >
            {style.icon}
            <span className="text-sm font-semibold">{link.label}</span>
          </a>
        );
      })}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border-4 border-pink-300 bg-orange-500 px-4 py-2 text-white shadow-lg transition hover:brightness-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="text-sm font-semibold">{open ? 'បិទទំនាក់ទំនង' : 'ទាក់ទងពួកយើង'}</span>
      </button>
    </div>
  );
}
