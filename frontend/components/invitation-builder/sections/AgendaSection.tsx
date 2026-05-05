'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AgendaItem, AgendaSection as AgendaSectionType } from '../types';

type AgendaSectionProps = {
  sections: AgendaSectionType[];
  lang: 'km' | 'en';
  onAddSection: () => void;
  onUpdateSection: (sectionId: string, updates: Partial<AgendaSectionType>) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (sectionId: string, itemId: string, updates: Partial<AgendaItem>) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
};

export default function AgendaSection({
  sections,
  lang,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: AgendaSectionProps) {
  const isKm = lang === 'km';
  return (
    <div className="space-y-5">
      <p className="text-sm font-semibold text-gray-700 dark:text-white">
        {isKm ? `${sections.length} របៀបវារៈ` : `${sections.length} agenda sections`}
      </p>

      {sections.map((section) => (
        <div key={section.id} className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{isKm ? 'ឈ្មោះរបៀបវារៈ*' : 'Section title*'}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveSection(section.id)}
              >
                {isKm ? 'លុបរបៀបវារៈ' : 'Remove section'}
              </Button>
            </div>
            <Input
              placeholder={isKm ? 'របៀបវារៈទី1' : 'Agenda section 1'}
              value={section.title}
              onChange={(event) => onUpdateSection(section.id, { title: event.target.value })}
            />
          </div>

          {section.items.map((item) => (
            <div key={item.id} className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{isKm ? 'កម្មវិធី' : 'Item'}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveItem(section.id, item.id)}
                >
                  {isKm ? 'លុប' : 'Remove'}
                </Button>
              </div>
              <Input
                placeholder={isKm ? 'ឈ្មោះកម្មវិធី' : 'Item title'}
                value={item.title}
                onChange={(event) => onUpdateItem(section.id, item.id, { title: event.target.value })}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  placeholder={isKm ? 'កាលបរិច្ឆេទ' : 'Date'}
                  value={item.date}
                  onChange={(event) => onUpdateItem(section.id, item.id, { date: event.target.value })}
                />
                <Input
                  placeholder={isKm ? 'ម៉ោង' : 'Time'}
                  value={item.time}
                  onChange={(event) => onUpdateItem(section.id, item.id, { time: event.target.value })}
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" className="w-full dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700" onClick={() => onAddItem(section.id)}>
            {isKm ? '+ បន្ថែមកម្មវិធី' : '+ Add item'}
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" className="w-full" onClick={onAddSection}>
        {isKm ? '+ បន្ថែមរបៀបវារៈកម្មវិធី' : '+ Add agenda section'}
      </Button>
    </div>
  );
}
