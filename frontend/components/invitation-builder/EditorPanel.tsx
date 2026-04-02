'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageSection from './sections/LanguageSection';
import MusicSection from './sections/MusicSection';
import ThemeSection from './sections/ThemeSection';
import CoverSection from './sections/CoverSection';
import BackgroundSection from './sections/BackgroundSection';
import EventInfoSection from './sections/EventInfoSection';
import GreetingSection from './sections/GreetingSection';
import AgendaSection from './sections/AgendaSection';
import MapSection from './sections/MapSection';
import GallerySection from './sections/GallerySection';
import ThankYouSection from './sections/ThankYouSection';
import KhqrSection from './sections/KhqrSection';
import type { AgendaItem, AgendaSection as AgendaSectionType, BuilderState, MusicOption } from './types';

type EditorPanelProps = {
  data: BuilderState;
  musicOptions: MusicOption[];
  onChange: (updates: Partial<BuilderState>) => void;
  onAddAgendaSection: () => void;
  onUpdateAgendaSection: (sectionId: string, updates: Partial<AgendaSectionType>) => void;
  onRemoveAgendaSection: (sectionId: string) => void;
  onAddAgendaItem: (sectionId: string) => void;
  onUpdateAgendaItem: (sectionId: string, itemId: string, updates: Partial<AgendaItem>) => void;
  onRemoveAgendaItem: (sectionId: string, itemId: string) => void;
  onCoverChange: (file: File | null) => void;
  onBackgroundChange: (file: File | null) => void;
  onMapImageChange: (file: File | null) => void;
  onKhqrUsdChange: (file: File | null) => void;
  onKhqrKhrChange: (file: File | null) => void;
};

export default function EditorPanel({
  data,
  musicOptions,
  onChange,
  onAddAgendaSection,
  onUpdateAgendaSection,
  onRemoveAgendaSection,
  onAddAgendaItem,
  onUpdateAgendaItem,
  onRemoveAgendaItem,
  onCoverChange,
  onBackgroundChange,
  onMapImageChange,
  onKhqrUsdChange,
  onKhqrKhrChange,
}: EditorPanelProps) {
  const isKm = data.language === 'km';
  
  return (
    <aside className="space-y-5 overflow-y-auto border-r border-gray-100 bg-gray-50 p-5 h-full">
      <div>
        <p className="text-sm font-semibold text-gray-900">{isKm ? 'រៀបចំធៀបអញ្ជើញ' : 'Invitation Builder'}</p>
        <p className="text-xs text-gray-500">{isKm ? 'កែសម្រួលព័ត៌មានខាងក្រោម' : 'Edit details below'}</p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>🌐 {isKm ? 'ភាសា' : 'Language'}</CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageSection language={data.language} onChange={onChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>🎵 {isKm ? 'តន្ត្រី' : 'Music'}</CardTitle>
        </CardHeader>
        <CardContent>
          <MusicSection
            musicOptions={musicOptions}
            musicEnabled={data.musicEnabled}
            musicId={data.musicId}
            musicUrl={data.musicUrl}
            onChange={onChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>🎨 {isKm ? 'ការរចនា' : 'Design'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ThemeSection
            textColor={data.textColor}
            headingColor={data.headingColor}
            onChange={onChange}
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold">{isKm ? 'រូបភាពក្របខាងមុខ (Cover)' : 'Cover Image'}</p>
            <CoverSection coverImageUrl={data.coverImageUrl} onCoverChange={onCoverChange} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">{isKm ? 'ផ្ទៃខាងក្រោម (Background)' : 'Background Image'}</p>
            <BackgroundSection backgroundUrl={data.backgroundUrl} onBackgroundChange={onBackgroundChange} lang={data.language} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>📝 {isKm ? 'ចំណងជើងកម្មវិធី' : 'Event Info'}</CardTitle>
        </CardHeader>
        <CardContent>
          <EventInfoSection
            eventTitle={data.eventTitle}
            eventSubtitle={data.eventSubtitle}
            eventDate={data.eventDate}
            eventEndDate={data.eventEndDate}
            eventLocation={data.eventLocation}
            onChange={onChange}
            lang={data.language}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>✍️ {isKm ? 'សារអញ្ជើញ' : 'Greeting Message'}</CardTitle>
        </CardHeader>
        <CardContent>
          <GreetingSection
            greetingTitle={data.greetingTitle}
            greetingMessage={data.greetingMessage}
            onChange={onChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>📅 {isKm ? 'របៀបវារៈកម្មវិធី' : 'Agenda'}</CardTitle>
        </CardHeader>
        <CardContent>
          <AgendaSection
            sections={data.agendaSections}
            onAddSection={onAddAgendaSection}
            onUpdateSection={onUpdateAgendaSection}
            onRemoveSection={onRemoveAgendaSection}
            onAddItem={onAddAgendaItem}
            onUpdateItem={onUpdateAgendaItem}
            onRemoveItem={onRemoveAgendaItem}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>🗺️ {isKm ? 'ទីតាំងកម្មវិធី (Map)' : 'Location'}</CardTitle>
        </CardHeader>
        <CardContent>
          <MapSection mapUrl={data.mapUrl} mapImageUrl={data.mapImageUrl} onChange={onChange} onMapImageChange={onMapImageChange} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>🖼️ {isKm ? 'វិចិត្រសាល Photo' : 'Gallery'}</CardTitle>
        </CardHeader>
        <CardContent>
          <GallerySection images={data.galleryImages} onChange={onChange} lang={data.language} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>🙏 {isKm ? 'សារអរគុណ' : 'Thank You Message'}</CardTitle>
        </CardHeader>
        <CardContent>
          <ThankYouSection thankYouTitle={data.thankYouTitle} thankYouMessage={data.thankYouMessage} onChange={onChange} lang={data.language} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>💳 {isKm ? 'KHQR និង QR សម្គាល់ភ្ញៀវ' : 'KHQR'}</CardTitle>
        </CardHeader>
        <CardContent>
          <KhqrSection
            khqrUsdUrl={data.khqrUsdUrl}
            khqrKhrUrl={data.khqrKhrUrl}
            onKhqrUsdChange={onKhqrUsdChange}
            onKhqrKhrChange={onKhqrKhrChange}
          />
        </CardContent>
      </Card>
    </aside>
  );
}
