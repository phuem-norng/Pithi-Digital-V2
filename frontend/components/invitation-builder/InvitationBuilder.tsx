'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Event } from '@/lib/api-client';
import { apiClient } from '@/lib/api-client';
import { getEventTemplateCatalogImage } from '@/lib/template-images';
import { getTemplateStyleDefaults } from '@/lib/template-style';
import EditorPanel from './EditorPanel';
import PreviewPanel from './PreviewPanel';
import ResizableSplitLayout from './ResizableSplitLayout';
import type { AgendaItem, AgendaSection, BuilderState, MusicOption } from './types';
import { Assets, getSeededCoverImage, getSeededGalleryImages } from '@/lib/assets';

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const makeAgendaItem = (date: string): AgendaItem => ({
  id: createId(),
  title: '',
  date,
  time: '',
});

const makeAgendaSection = (index: number, date: string): AgendaSection => ({
  id: createId(),
  title: `របៀបវារៈទី${index}`,
  items: [makeAgendaItem(date)],
});

const makeSvgDataUrl = (label: string, background: string, foreground: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="${background}" />
  <circle cx="600" cy="400" r="300" fill="none" stroke="${foreground}" stroke-opacity="0.1" stroke-width="20" />
  <circle cx="600" cy="400" r="260" fill="none" stroke="${foreground}" stroke-opacity="0.2" stroke-width="2" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${foreground}" font-family="'Segoe UI', Arial, sans-serif" font-size="64" font-weight="bold">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const demoCoverImage = makeSvgDataUrl('រូបភាពគម្រប (Cover Image)', '#fff0f2', '#9f1239');
const demoMapImage = Assets.map;
const demoKhqrUsd = Assets.khqrSampleAbaPay;
const demoKhqrKhr = Assets.khqrSampleAbaPay;
const demoMapLink = 'https://maps.app.goo.gl/9F6oE2sEXm5s2bGF8';

const fallbackMusicOptions: MusicOption[] = [
  { id: 'classic', label: 'Classic Wedding', url: Assets.weddingMusic },
];

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }
      reject(new Error('Unable to read file as data URL'));
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const formatBuilderDateOnly = (rawDate?: string) => {
  if (!rawDate) {
    return '';
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
};

const normalizeAgendaSectionsFromEvent = (event?: Event | null): AgendaSection[] => {
  const dateOnly = formatBuilderDateOnly(event?.date);
  const metadata = event?.metadata as { agenda?: unknown } | undefined;

  if (!metadata?.agenda || !Array.isArray(metadata.agenda) || metadata.agenda.length === 0) {
    return [makeAgendaSection(1, dateOnly)];
  }

  const normalized = metadata.agenda
    .map((section, sectionIndex) => {
      if (!section || typeof section !== 'object') {
        return null;
      }

      const rawSection = section as {
        id?: unknown;
        title?: unknown;
        items?: unknown;
      };

      const rawItems = Array.isArray(rawSection.items) ? rawSection.items : [];
      const items: AgendaItem[] = rawItems
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const rawItem = item as {
            id?: unknown;
            title?: unknown;
            date?: unknown;
            time?: unknown;
          };

          return {
            id: typeof rawItem.id === 'string' && rawItem.id ? rawItem.id : createId(),
            title: typeof rawItem.title === 'string' ? rawItem.title : '',
            date: typeof rawItem.date === 'string' ? rawItem.date : dateOnly,
            time: typeof rawItem.time === 'string' ? rawItem.time : '',
          };
        })
        .filter((item): item is AgendaItem => Boolean(item));

      return {
        id: typeof rawSection.id === 'string' && rawSection.id ? rawSection.id : createId(),
        title:
          typeof rawSection.title === 'string' && rawSection.title.trim()
            ? rawSection.title
            : `របៀបវារៈទី${sectionIndex + 1}`,
        items: items.length > 0 ? items : [makeAgendaItem(dateOnly)],
      };
    })
    .filter((section): section is AgendaSection => Boolean(section));

  return normalized.length > 0 ? normalized : [makeAgendaSection(1, dateOnly)];
};

const getGalleryImagesFromEvent = (event?: Event | null): string[] => {
  if (!event?.metadata || typeof event.metadata !== 'object' || Array.isArray(event.metadata)) {
    return [];
  }

  const metadata = event.metadata as Record<string, unknown>;
  const candidates = [metadata.galleryImages, metadata.uploadedImages, metadata.images];

  const urls = candidates
    .flatMap((entry) => (Array.isArray(entry) ? entry : []))
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => entry.trim());

  return [...new Set(urls)];
};

type InvitationBuilderProps = {
  event?: Event | null;
  initialState?: BuilderState | null;
  onStateChange?: (state: BuilderState) => void;
  forceMobilePreviewToken?: number;
};

const formatBuilderEventDate = (rawDate?: string) => {
  if (!rawDate) {
    return 'ថ្ងៃរៀបអាពាហ៍ពិពាហ៍';
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return rawDate;
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  const minute = String(parsed.getMinutes()).padStart(2, '0');

  const hour24 = parsed.getHours();
  const amPm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const hour = String(hour12).padStart(2, '0');

  return `${day}/${month}/${year}, ${hour}:${minute} ${amPm}`;
};

export default function InvitationBuilder({ event, initialState, onStateChange, forceMobilePreviewToken = 0 }: InvitationBuilderProps) {
  const [state, setState] = useState<BuilderState>(() => {
    if (initialState) {
      return {
        ...initialState,
        eventEndDate: initialState.eventEndDate || '',
      } as BuilderState;
    }

    const formattedDate = formatBuilderEventDate(event?.date);
    const metadata = event?.metadata && typeof event.metadata === 'object'
      ? (event.metadata as { eventEndDate?: unknown })
      : undefined;

    const eventEndDateFromMetadata =
      typeof metadata?.eventEndDate === 'string' ? metadata.eventEndDate : '';

    const defaultAgendaSections = normalizeAgendaSectionsFromEvent(event);
    const templateImage = getEventTemplateCatalogImage(event);
    const styleDefaults = getTemplateStyleDefaults(event?.template);
    const eventGalleryImages = getGalleryImagesFromEvent(event);
    return {
      styleVariant: styleDefaults.styleVariant as BuilderState['styleVariant'],
      templateId: event?.templateId || event?.template?.id,
      language: 'km',
      musicEnabled: true,
      musicId: 'classic',
      musicUrl: event?.musicUrl || fallbackMusicOptions[0]?.url || '',
      musicStartSec: 0,
      musicEndSec: 0,
      textColor: styleDefaults.textColor,
      headingColor: styleDefaults.headingColor,
      coverImageUrl: templateImage || getSeededCoverImage(event?.id || event?.title || formattedDate) || demoCoverImage,
      backgroundUrl: styleDefaults.backgroundUrl,
      eventTitle: event?.title || 'សិរីមង្គលអាពាហ៍ពិពាហ៍',
      eventSubtitle: '',
      eventDate: formattedDate,
      eventEndDate: eventEndDateFromMetadata || formattedDate,
      eventLocation: event?.location || 'ទីតាំងកម្មវិធី',
      greetingTitle: 'យើងខ្ញុំមានកិត្តិយសសូមគោរពអញ្ជើញ',
      greetingMessage:
        'សម្តេច ទ្រង់ ឯកឧត្តម លោកជំទាវ លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោក លោកស្រី អ្នកនាង កញ្ញា ព្រមទាំងប្រិយមិត្តអញ្ជើញចូលរួមជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធិពរជ័យសិរីសួស្តី ជ័យមង្គល ក្នុងពិធីអាពាហ៍ពិពាហ៍ កូនប្រុសស្រី របស់យើងខ្ញុំទាំងពីរ។',
      agendaSections: defaultAgendaSections,
      mapUrl: event?.googleMapLink || demoMapLink,
      mapImageUrl: demoMapImage,
      galleryImages: eventGalleryImages.length > 0 ? eventGalleryImages : getSeededGalleryImages(event?.id || event?.title || formattedDate),
      thankYouTitle: 'សូមអរគុណ និងសូមអភ័យទោស',
      thankYouMessage:
        'យើងខ្ញុំទាំងពីរ សូមថ្លែងអំណរគុណ យ៉ាងជ្រាលជ្រៅ ចំពោះវត្តមាន ដ៏ឧត្តុង្គឧត្តមរបស់ សម្តេច ឯកឧត្តម លោកជំទាវ លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោក លោកស្រី អ្នកនាង កញ្ញា ដែលបាន អញ្ជើញចូលរួមជាកិត្តិយស ក្នុងពិធីសិរីសួស្តីអាពាហ៍ពិពាហ៍ របស់យើងខ្ញុំ នាពេលខាងមុខនេះ។ យើងខ្ញុំសូមការខន្តីអភ័យទោស ដែលពុំបានជូនលិខិតអញ្ជើញ ដោយផ្ទាល់ ។ ដោយការវកិច្ចដ៏ខ្ពង់ខ្ពស់ពីយើងខ្ញុំ។',
      khqrUsdUrl: event?.khqrDollar || demoKhqrUsd,
      khqrKhrUrl: event?.khqrRiel || demoKhqrKhr,
    } as BuilderState;
  });
  const latestStateRef = useRef(state);
  const metadataRef = useRef<Record<string, unknown>>({});
  const isAgendaReadyForSync = useRef(false);
  const isUsingInitialStateRef = useRef(Boolean(initialState));

  useEffect(() => {
    latestStateRef.current = state;
    onStateChange?.(state);
  }, [state, onStateChange]);

  useEffect(() => {
    if (!initialState) {
      return;
    }

    isUsingInitialStateRef.current = true;
    setState({
      ...initialState,
      eventEndDate: initialState.eventEndDate || '',
    });
  }, [initialState]);

  useEffect(() => {
    if (!event || isUsingInitialStateRef.current) return;
    const metadata = event.metadata && typeof event.metadata === 'object' ? event.metadata : {};
    metadataRef.current = metadata;

    const eventEndDateFromMetadata =
      typeof (metadata as { eventEndDate?: unknown }).eventEndDate === 'string'
        ? (metadata as { eventEndDate: string }).eventEndDate
        : '';

    const normalizedEventDate = formatBuilderEventDate(event.date);
    const normalizedAgenda = normalizeAgendaSectionsFromEvent(event);
    const templateImage = getEventTemplateCatalogImage(event);
    const styleDefaults = getTemplateStyleDefaults(event.template);
    const eventGalleryImages = getGalleryImagesFromEvent(event);
    setState((prev) =>
      ({
        ...prev,
        styleVariant: (prev.styleVariant || styleDefaults.styleVariant) as BuilderState['styleVariant'],
        templateId: prev.templateId || event.templateId || event.template?.id,
        musicUrl: event.musicUrl || prev.musicUrl,
        musicStartSec: typeof prev.musicStartSec === 'number' ? prev.musicStartSec : 0,
        musicEndSec: typeof prev.musicEndSec === 'number' ? prev.musicEndSec : 0,
        coverImageUrl: prev.coverImageUrl || templateImage || getSeededCoverImage(event.id || event.title || event.date) || demoCoverImage,
        backgroundUrl: prev.backgroundUrl || styleDefaults.backgroundUrl,
        eventDate:
          !prev.eventDate ||
            prev.eventDate === 'ថ្ងៃរៀបអាពាហ៍ពិពាហ៍' ||
            /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(prev.eventDate.trim())
            ? normalizedEventDate
            : prev.eventDate,
        eventEndDate:
          !prev.eventEndDate ||
            prev.eventEndDate === 'ថ្ងៃបញ្ចប់កម្មវិធី' ||
            /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(prev.eventEndDate.trim())
            ? (eventEndDateFromMetadata || normalizedEventDate)
            : prev.eventEndDate,
        mapUrl: event.googleMapLink || prev.mapUrl,
        khqrUsdUrl: event.khqrDollar || prev.khqrUsdUrl,
        khqrKhrUrl: event.khqrRiel || prev.khqrKhrUrl,
        agendaSections: normalizedAgenda,
        galleryImages: eventGalleryImages.length > 0 ? eventGalleryImages : getSeededGalleryImages(event.id || event.title || event.date),
      }) as BuilderState,
    );
    isAgendaReadyForSync.current = true;
  }, [event]);

  useEffect(() => {
    if (!event?.id || !isAgendaReadyForSync.current) {
      return;
    }

    const timer = setTimeout(async () => {
      const sanitizedAgenda = state.agendaSections.map((section) => ({
        ...section,
        title: section.title.trim(),
        items: section.items.map((item) => ({
          ...item,
          title: item.title.trim(),
          date: item.date.trim(),
          time: item.time.trim(),
        })),
      }));

      try {
        const updatedEvent = await apiClient.updateEvent(event.id, {
          metadata: {
            ...metadataRef.current,
            agenda: sanitizedAgenda,
            eventEndDate: state.eventEndDate,
            galleryImages: state.galleryImages,
          },
        });

        metadataRef.current =
          updatedEvent.metadata && typeof updatedEvent.metadata === 'object'
            ? updatedEvent.metadata
            : metadataRef.current;
      } catch {
        // Ignore auto-sync failures to keep editing uninterrupted.
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [event?.id, state.agendaSections, state.eventEndDate, state.galleryImages]);

  useEffect(() => {
    return () => {
      const latest = latestStateRef.current;
      if (latest.coverImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(latest.coverImageUrl);
      }
      if (latest.mapImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(latest.mapImageUrl);
      }
      if (latest.khqrUsdUrl.startsWith('blob:')) {
        URL.revokeObjectURL(latest.khqrUsdUrl);
      }
      if (latest.khqrKhrUrl.startsWith('blob:')) {
        URL.revokeObjectURL(latest.khqrKhrUrl);
      }
    };
  }, []);

  const [musicOptions, setMusicOptions] = useState<MusicOption[]>(fallbackMusicOptions);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [isDesktopViewport, setIsDesktopViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false,
  );

  useEffect(() => {
    if (forceMobilePreviewToken > 0) {
      setMobileView('preview');
    }
  }, [forceMobilePreviewToken]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateViewport = () => {
      setIsDesktopViewport(mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => {
      mediaQuery.removeEventListener('change', updateViewport);
    };
  }, []);

  useEffect(() => {
    apiClient.getMusic().then((tracks) => {
      if (tracks.length > 0) {
        const options = tracks.map((t) => ({ id: t.id, label: t.name, url: t.url }));
        setMusicOptions(options);
        // Sync musicId: if current id doesn't match any DB option, match by URL or fallback to first
        setState((prev) => {
          const matched = options.find((o) => o.id === prev.musicId || o.url === prev.musicUrl);
          if (matched) return { ...prev, musicId: matched.id, musicUrl: matched.url };
          return { ...prev, musicId: options[0].id, musicUrl: prev.musicUrl || options[0].url };
        });
      }
    }).catch(() => {/* keep fallback */ });
  }, []);

  const updateState = (updates: Partial<BuilderState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const addAgendaSection = () => {
    setState((prev) => ({
      ...prev,
      agendaSections: [
        ...prev.agendaSections,
        makeAgendaSection(prev.agendaSections.length + 1, formatBuilderDateOnly(event?.date)),
      ],
    }));
  };

  const updateAgendaSection = (sectionId: string, updates: Partial<AgendaSection>) => {
    setState((prev) => ({
      ...prev,
      agendaSections: prev.agendaSections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section,
      ),
    }));
  };

  const removeAgendaSection = (sectionId: string) => {
    setState((prev) => ({
      ...prev,
      agendaSections: prev.agendaSections.filter((section) => section.id !== sectionId),
    }));
  };

  const addAgendaItem = (sectionId: string) => {
    setState((prev) => ({
      ...prev,
      agendaSections: prev.agendaSections.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            items: [...section.items, makeAgendaItem(formatBuilderDateOnly(event?.date))],
          }
          : section,
      ),
    }));
  };

  const updateAgendaItem = (sectionId: string, itemId: string, updates: Partial<AgendaItem>) => {
    setState((prev) => ({
      ...prev,
      agendaSections: prev.agendaSections.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item,
            ),
          }
          : section,
      ),
    }));
  };

  const removeAgendaItem = (sectionId: string, itemId: string) => {
    setState((prev) => ({
      ...prev,
      agendaSections: prev.agendaSections.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            items: section.items.filter((item) => item.id !== itemId),
          }
          : section,
      ),
    }));
  };

  const updateImage = async (key: keyof BuilderState, file: File | null) => {
    const currentUrl = state[key] as string;
    if (typeof currentUrl === 'string' && currentUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentUrl);
    }

    if (!file) {
      updateState({ [key]: '' } as Partial<BuilderState>);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      updateState({ [key]: dataUrl } as Partial<BuilderState>);
    } catch {
      // Keep existing value if file conversion fails.
    }
  };

  const editorPanel = (
    <EditorPanel
      data={state}
      musicOptions={musicOptions}
      onChange={updateState}
      onAddAgendaSection={addAgendaSection}
      onUpdateAgendaSection={updateAgendaSection}
      onRemoveAgendaSection={removeAgendaSection}
      onAddAgendaItem={addAgendaItem}
      onUpdateAgendaItem={updateAgendaItem}
      onRemoveAgendaItem={removeAgendaItem}
      onCoverChange={(file) => updateImage('coverImageUrl', file)}
      onMapImageChange={(file) => updateImage('mapImageUrl', file)}
      onKhqrUsdChange={(file) => updateImage('khqrUsdUrl', file)}
      onKhqrKhrChange={(file) => updateImage('khqrKhrUrl', file)}
      onBackgroundChange={(file) => updateImage('backgroundUrl', file)}
    />
  );

  const previewPanel = <PreviewPanel data={state} />;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900" style={{ height: 'calc(100vh - 145px)' }}>
      {isDesktopViewport ? (
        <div className="h-full">
          <ResizableSplitLayout
            leftPanel={editorPanel}
            rightPanel={previewPanel}
            defaultLeftWidth={52.5}
            minLeftWidth={300}
            minRightWidth={350}
          />
        </div>
      ) : (
        <div className="h-full">
          <div className="flex gap-2 border-b border-gray-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setMobileView('editor')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${mobileView === 'editor'
                ? 'bg-[#C52133] text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
            >
              រៀបចំធៀបអញ្ជើញ
            </button>
            <button
              type="button"
              onClick={() => setMobileView('preview')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${mobileView === 'preview'
                ? 'bg-[#C52133] text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
            >
              មើល Preview
            </button>
          </div>
          <div className="h-[calc(100%-60px)] overflow-hidden">
            {mobileView === 'editor' ? editorPanel : previewPanel}
          </div>
        </div>
      )}
    </section>
  );
}
