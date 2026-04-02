'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, LayoutTemplate, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvitationBuilder } from '@/components/invitation-builder';
import type { BuilderState } from '@/components/invitation-builder/types';
import { apiClient, Event } from '@/lib/api-client';
import { getSavedMyTemplateById, saveMyTemplate } from '@/lib/my-templates';

export default function InvitationBuilderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const templateId = searchParams.get('templateId');
  const myTemplateId = searchParams.get('myTemplateId');
  const backHref = myTemplateId
    ? `/events/${eventId}?tab=my-template`
    : `/events/${eventId}?tab=template-shop`;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [builderState, setBuilderState] = useState<BuilderState | null>(null);
  const [initialBuilderState, setInitialBuilderState] = useState<BuilderState | null>(null);

  const handleSaveToMyTemplate = async () => {
    if (!event) {
      return;
    }

    const resolvedTemplateId = event.templateId || templateId || '';

    if (!resolvedTemplateId) {
      setSaveStatus('សូមជ្រើសរើសគំរូពី ហាងគំរូធៀប មុនពេលរក្សាទុក។');
      return;
    }

    const saved = saveMyTemplate({
      existingId: myTemplateId || undefined,
      templateId: resolvedTemplateId,
      eventId: event.id,
      name: event.template?.name || `Template ${resolvedTemplateId.slice(0, 8)}`,
      thumbnail: builderState?.coverImageUrl || event.template?.thumbnail || event.coverImage,
      previewUrl: builderState?.coverImageUrl || event.template?.previewUrl || event.coverImage,
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

    setSaveStatus('បានរក្សាទុកទៅ គំរូធៀបខ្ញុំ រួចហើយ។');
  };

  useEffect(() => {
    if (!myTemplateId) {
      setInitialBuilderState(null);
      return;
    }

    const saved = getSavedMyTemplateById(myTemplateId);
    if (saved?.builderState) {
      setInitialBuilderState(saved.builderState);
      setSaveStatus('បានបើកគំរូពី គំរូធៀបខ្ញុំ អ្នកអាចកែប្រែបន្តបាន។');
    }
  }, [myTemplateId]);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError('');

    apiClient
      .getEvent(eventId)
      .then((data) => {
        if (!isActive) return;
        setEvent(data);
      })
      .catch(() => {
        if (!isActive) return;
        setError('មិនអាចទាញយកទិន្នន័យព្រឹត្តិការណ៍បានទេ');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [eventId]);

  return (
    <div className="min-h-screen bg-gray-50 font-khmer-body">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href={backHref}>
              <Button variant="outline" className="border-gray-200">
                <ArrowLeft className="mr-2 h-4 w-4" />
                ត្រឡប់
              </Button>
            </Link>
            <div>
              <h1 className="font-khmer-heading text-2xl text-gray-900">រៀបចំធៀប</h1>
              <p className="mt-1 text-sm text-gray-500">កែតម្រូវព័ត៌មាន និងពិនិត្យសាកល្បង</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700">
              <LayoutTemplate className="h-4 w-4 text-gray-500" />
              {templateId ? `Template ID: ${templateId}` : 'Template Preview'}
            </div>
            <Button type="button" onClick={handleSaveToMyTemplate} className="bg-[#C52133] text-white hover:bg-[#aa1b2a]">
              <Save className="mr-2 h-4 w-4" />
              រក្សាទុកទៅគំរូធៀបខ្ញុំ
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            កំពុងទាញយកទិន្នន័យ...
          </div>
        ) : event ? (
          <InvitationBuilder
            event={event}
            initialState={initialBuilderState}
            onStateChange={setBuilderState}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            មិនមានទិន្នន័យព្រឹត្តិការណ៍។
          </div>
        )}
      </main>
    </div>
  );
}
