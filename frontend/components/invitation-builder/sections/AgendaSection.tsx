'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AgendaItem, AgendaSection as AgendaSectionType } from '../types';

type AgendaSectionProps = {
  sections: AgendaSectionType[];
  onAddSection: () => void;
  onUpdateSection: (sectionId: string, updates: Partial<AgendaSectionType>) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (sectionId: string, itemId: string, updates: Partial<AgendaItem>) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
};

export default function AgendaSection({
  sections,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: AgendaSectionProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm font-semibold text-gray-700">
        {sections.length} របៀបវារៈ
      </p>

      {sections.map((section) => (
        <div key={section.id} className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gray-800">ឈ្មោះរបៀបវារៈ*</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveSection(section.id)}
              >
                លុបរបៀបវារៈ
              </Button>
            </div>
            <Input
              placeholder="របៀបវារៈទី1"
              value={section.title}
              onChange={(event) => onUpdateSection(section.id, { title: event.target.value })}
            />
          </div>

          {section.items.map((item) => (
            <div key={item.id} className="space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-700">កម្មវិធី</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveItem(section.id, item.id)}
                >
                  លុប
                </Button>
              </div>
              <Input
                placeholder="ឈ្មោះកម្មវិធី"
                value={item.title}
                onChange={(event) => onUpdateItem(section.id, item.id, { title: event.target.value })}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  placeholder="កាលបរិច្ឆេទ"
                  value={item.date}
                  onChange={(event) => onUpdateItem(section.id, item.id, { date: event.target.value })}
                />
                <Input
                  placeholder="ម៉ោង"
                  value={item.time}
                  onChange={(event) => onUpdateItem(section.id, item.id, { time: event.target.value })}
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" className="w-full" onClick={() => onAddItem(section.id)}>
            + បន្ថែមកម្មវិធី
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" className="w-full" onClick={onAddSection}>
        + បន្ថែមរបៀបវារៈកម្មវិធី
      </Button>
    </div>
  );
}
