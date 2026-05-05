'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, LayoutTemplate, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvitationBuilder } from '@/components/invitation-builder';
import { SupportContactFab } from '@/components/support-contact-fab';
import type { BuilderState } from '@/components/invitation-builder/types';
import { apiClient, Event } from '@/lib/api-client';
import { getSavedMyTemplateById, saveMyTemplate } from '@/lib/my-templates';
import { Assets } from '@/lib/assets';
import { getTemplateCatalogImage } from '@/lib/template-images';
import { useLanguage } from '@/lib/language-context';
import { getEventDetailPageStrings } from '@/lib/event-detail-page-i18n';

const LOCAL_TO_R2: Record<string, string> = {
  '/GlfpFt.jpg': Assets.heroBackground,
  '/map.png': Assets.map,
  '/decorative-divider.png': Assets.decorativeDivider,
  '/frame.png': Assets.frame,
  '/underline-kbach-1.png': Assets.underlineKbach,
  '/badge-frame.svg': Assets.badgeFrame,
};

function migrateLocalPath(url: string | undefined): string | undefined {
  if (!url) return url;
  return LOCAL_TO_R2[url] ?? url;
}

function migrateBuilderState(state: BuilderState): BuilderState {
  return {
    ...state,
    backgroundUrl: migrateLocalPath(state.backgroundUrl) ?? state.backgroundUrl,
    mapImageUrl: migrateLocalPath(state.mapImageUrl) ?? state.mapImageUrl,
  };
}

export default function InvitationBuilderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const templateId = searchParams.get('templateId');
  const myTemplateId = searchParams.get('myTemplateId');
  const backHref = myTemplateId
    ? `/events/${eventId}?tab=my-template`
    : `/events/${eventId}?tab=template-shop`;

  const { language } = useLanguage();
  const isKhmer = language === 'km';
  const S = useMemo(() => getEventDetailPageStrings(isKhmer), [isKhmer]);

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const [builderState, setBuilderState] = useState<BuilderState | null>(null);
  const [initialBuilderState, setInitialBuilderState] = useState<BuilderState | null>(null);
  const [mobilePreviewToken, setMobilePreviewToken] = useState(0);
  const displayTemplateId = templateId || event?.templateId || '';

  const handleSaveToMyTemplate = async () => {
    if (!event) {
      return;
    }

    const resolvedTemplateId = event.templateId || templateId || '';

    if (!resolvedTemplateId) {
      setSaveStatus(S.builder.selectTemplateFirst);
      return;
    }

    const saved = saveMyTemplate({
      existingId: myTemplateId || undefined,
      templateId: resolvedTemplateId,
      eventId: event.id,
      name: event.template?.name || `Template ${resolvedTemplateId.slice(0, 8)}`,
      thumbnail:
        builderState?.coverImageUrl ||
        builderState?.backgroundUrl ||
        getTemplateCatalogImage(event.template),
      previewUrl:
        builderState?.coverImageUrl ||
        builderState?.backgroundUrl ||
        getTemplateCatalogImage(event.template),
      eventTypeId: event.eventTypeId,
      eventTypeName: event.eventType?.name,
      builderState: builderState || undefined,
    });

    try {
      const metadata = event.metadata && typeof event.metadata === 'object'
        ? (event.metadata as Record<string, unknown>)
        : {};

      const currentSnapshots =
        metadata.myTemplateSnapshots && typeof metadata.myTemplateSnapshots === 'object'
          ? (metadata.myTemplateSnapshots as Record<string, unknown>)
          : {};

      const updatedEvent = await apiClient.updateEvent(event.id, {
        metadata: {
          ...metadata,
          myTemplateSnapshots: {
            ...currentSnapshots,
            [saved.id]: {
              name: saved.name,
              builderState: saved.builderState,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      });

      setEvent(updatedEvent);
    } catch {
      // Keep local save success even if metadata sync fails.
    }

    setSaveStatus(S.builder.savedShowingPreview);
    setMobilePreviewToken((prev) => prev + 1);
  };

  useEffect(() => {
    if (!myTemplateId) {
      setInitialBuilderState(null);
      return;
    }

    const saved = getSavedMyTemplateById(myTemplateId);
    if (saved?.builderState) {
      setInitialBuilderState({
        ...migrateBuilderState(saved.builderState),
        templateId: saved.builderState.templateId || saved.templateId || templateId || undefined,
      });
      setSaveStatus(getEventDetailPageStrings(language === 'km').builder.openedFromMyTemplates);
    }
  }, [myTemplateId, templateId, language]);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError('');

    const loadEvent = async () => {
      try {
        const data = await apiClient.getEvent(eventId);
        let resolvedEvent: Event = data;

        if (templateId && data.eventTypeId) {
          try {
            const templates = await apiClient.getTemplates(data.eventTypeId);
            const selectedTemplate = templates.find((template) => template.id === templateId);

            if (selectedTemplate) {
              resolvedEvent = {
                ...data,
                templateId: selectedTemplate.id,
                template: selectedTemplate,
              };
            }
          } catch {
            resolvedEvent = data;
          }
        }

        if (!isActive) return;
        setEvent(resolvedEvent);
      } catch {
        if (!isActive) return;
        setError(getEventDetailPageStrings(language === 'km').builder.loadError);
      } finally {
        if (!isActive) return;
        setIsLoading(false);
      }
    };

    void loadEvent();

    return () => {
      isActive = false;
    };
  }, [eventId, templateId, language]);

  useEffect(() => {
    if (!saveStatus && !error) {
      return;
    }
    feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [saveStatus, error]);

  return (
    <div className="min-h-screen bg-gray-50 font-khmer-body dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href={backHref}>
              <Button variant="outline" className="border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {S.builder.back}
              </Button>
            </Link>
            <div>
              <h1 className="font-khmer-heading text-2xl text-gray-900 dark:text-slate-100">{S.builder.title}</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{S.builder.subtitle}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700">
              <LayoutTemplate className="h-4 w-4 text-gray-500" />
              {displayTemplateId ? `${S.builder.templateIdLabel}: ${displayTemplateId}` : S.builder.templatePreview}
            </div>
            <Button type="button" onClick={handleSaveToMyTemplate} className="bg-[#C52133] text-white hover:bg-[#aa1b2a]">
              <Save className="mr-2 h-4 w-4" />
              {isKhmer ? 'រក្សាទុក' : 'Save'}
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 pt-3 pb-8 sm:px-6 sm:pt-4 lg:px-8">
        {(saveStatus || error) && (
          <div ref={feedbackRef}>
            {saveStatus && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {saveStatus}
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            {S.builder.loading}
          </div>
        ) : event ? (
          <InvitationBuilder
            event={event}
            initialState={initialBuilderState}
            onStateChange={setBuilderState}
            forceMobilePreviewToken={mobilePreviewToken}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            {S.builder.noEvent}
          </div>
        )}
      </main>
      <SupportContactFab />
    </div>
  );
}
