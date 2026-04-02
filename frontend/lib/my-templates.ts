import type { BuilderState } from '@/components/invitation-builder/types';

export type MyTemplateItem = {
  id: string;
  templateId: string;
  eventId?: string;
  name: string;
  thumbnail?: string;
  previewUrl?: string;
  eventTypeId?: string;
  eventTypeName?: string;
  builderState?: BuilderState;
  savedAt: string;
};

const STORAGE_KEY = 'pithi.myTemplates';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getSavedMyTemplates(): MyTemplateItem[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is MyTemplateItem => {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.templateId === 'string' &&
        typeof item.name === 'string' &&
        typeof item.savedAt === 'string'
      );
    });
  } catch {
    return [];
  }
}

function saveAll(items: MyTemplateItem[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function saveMyTemplate(
  input: Omit<MyTemplateItem, 'id' | 'savedAt'> & { existingId?: string },
): MyTemplateItem {
  const current = getSavedMyTemplates();
  const now = new Date().toISOString();

  const existingById = input.existingId
    ? current.find((item) => item.id === input.existingId)
    : undefined;

  const next: MyTemplateItem = {
    id: existingById?.id || `${input.templateId}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    templateId: input.templateId,
    eventId: input.eventId,
    name: input.name,
    thumbnail: input.thumbnail,
    previewUrl: input.previewUrl,
    eventTypeId: input.eventTypeId,
    eventTypeName: input.eventTypeName,
    builderState: input.builderState,
    savedAt: now,
  };

  const filtered = current.filter((item) => item.id !== next.id);
  saveAll([next, ...filtered]);

  return next;
}

export function removeMyTemplate(id: string) {
  const current = getSavedMyTemplates();
  saveAll(current.filter((item) => item.id !== id));
}

export function getSavedMyTemplateById(id: string): MyTemplateItem | null {
  const current = getSavedMyTemplates();
  return current.find((item) => item.id === id) || null;
}

export function syncMyTemplatesForEvent(
  eventId: string,
  templateIds: Array<string | undefined>,
  updates: Partial<BuilderState>,
) {
  const current = getSavedMyTemplates();
  let changed = false;
  void templateIds;

  const next = current.map((item) => {
    const matchesByEventId = item.eventId === eventId;

    if (!matchesByEventId) {
      return item;
    }

    changed = true;
    return {
      ...item,
      eventId: item.eventId || eventId,
      builderState: {
        ...(item.builderState || ({} as BuilderState)),
        ...updates,
      },
      savedAt: new Date().toISOString(),
    };
  });

  if (changed) {
    saveAll(next);
  }

  return changed;
}
