export type Language = 'km' | 'en';

export type AgendaItem = {
  id: string;
  title: string;
  date: string;
  time: string;
};

export type AgendaSection = {
  id: string;
  title: string;
  items: AgendaItem[];
};

export type MusicOption = {
  id: string;
  label: string;
  url: string;
};

export type BuilderState = {
  styleVariant?: 'default' | 'floral-rose';
  /** Catalog template id; used for template-specific cover layout only. */
  templateId?: string;
  language: Language;
  musicEnabled: boolean;
  musicId: string;
  musicUrl: string;
  /**
   * Music clip range in seconds.
   * - If `musicEndSec` is 0 (or <= start), treat as "play full track".
   */
  musicStartSec?: number;
  musicEndSec?: number;
  textColor: string;
  headingColor: string;
  coverImageUrl: string;
  backgroundUrl: string;
  eventTitle: string;
  eventSubtitle: string;
  eventDate: string;
  eventEndDate: string;
  eventLocation: string;
  greetingTitle: string;
  greetingMessage: string;
  agendaSections: AgendaSection[];
  mapUrl: string;
  mapImageUrl: string;
  galleryImages: string[];
  thankYouTitle: string;
  thankYouMessage: string;
  khqrUsdUrl: string;
  khqrKhrUrl: string;
};
