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
  language: Language;
  musicEnabled: boolean;
  musicId: string;
  musicUrl: string;
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
