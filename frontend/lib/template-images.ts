import type { Template } from './api-client';

const DEFAULT_TEMPLATE_IMAGE =
  'https://pub-93085525881746c1a7b523e463cbfb35.r2.dev/public/template-cover-kh-en-sample-20260429.png';

type TemplateImageSource = Pick<Template, 'thumbnail' | 'previewUrl'> | null | undefined;
/** Event wrapper for catalog cover only — not `event.coverImage` (that field is for event UI, not invitation builder). */
type EventTemplateImageSource = { template?: TemplateImageSource } | null | undefined;

export function getTemplateCatalogImage(template: TemplateImageSource): string | undefined {
  if (!template) {
    return undefined;
  }

  return template.previewUrl || template.thumbnail || DEFAULT_TEMPLATE_IMAGE;
}

export function getEventTemplateCatalogImage(event: EventTemplateImageSource): string | undefined {
  return getTemplateCatalogImage(event?.template);
}

/** Cover from synced `metadata.myTemplateSnapshots` for a catalog template id (not my-template row id). */
export function getBuilderCoverFromMyTemplateSnapshots(
  metadata: unknown,
  catalogTemplateId: string,
): string | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  const snapRoot = (metadata as Record<string, unknown>).myTemplateSnapshots;
  if (!snapRoot || typeof snapRoot !== 'object') {
    return undefined;
  }

  for (const entry of Object.values(snapRoot as Record<string, unknown>)) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const row = entry as { templateId?: unknown; builderState?: unknown };
    if (row.templateId !== catalogTemplateId) {
      continue;
    }

    const bs = row.builderState;
    if (!bs || typeof bs !== 'object') {
      continue;
    }

    const url = (bs as { coverImageUrl?: unknown }).coverImageUrl;
    if (typeof url === 'string' && url.trim().length > 0) {
      return url.trim();
    }
  }

  return undefined;
}
