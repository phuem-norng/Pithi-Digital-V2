/**
 * Resolve groom/bride (or single honoree) display strings for PDFs and UI,
 * using metadata first then parsing the event title (Khmer wedding pattern).
 */
const DEFAULT_WEDDING_PREFIX = 'ពិធីរៀបមង្គលការ';

export function getHonoreeNamesForExport(
  eventTitle: string | undefined,
  metadata: Record<string, unknown> | undefined,
  weddingPrefix: string = DEFAULT_WEDDING_PREFIX,
): { groom: string; bride: string } {
  const meta = metadata || {};
  const fromMetaGroom = typeof meta.groomName === 'string' ? meta.groomName.trim() : '';
  const fromMetaBride = typeof meta.brideName === 'string' ? meta.brideName.trim() : '';
  if (fromMetaGroom || fromMetaBride) {
    return { groom: fromMetaGroom, bride: fromMetaBride };
  }

  const raw = (eventTitle || '').trim();
  if (!raw) {
    return { groom: '', bride: '' };
  }

  const escaped = weddingPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripped = raw.replace(new RegExp(`^(?:${escaped}\\s*)+`, 'u'), '').trim();

  if (stripped.includes(' និង ')) {
    const [a, b] = stripped.split(' និង ').map((s) => s.trim());
    return { groom: a || '', bride: b || '' };
  }

  if (stripped.includes('&')) {
    const [a, b] = stripped.split('&').map((s) => s.trim());
    return { groom: a || '', bride: b || '' };
  }

  return { groom: stripped, bride: '' };
}
