import type { jsPDF } from 'jspdf';

/**
 * jspdf-autotable uses splitTextToSize for overflow: 'linebreak', which splits on
 * code units and breaks Khmer grapheme clusters (coeng / vowel signs misattach).
 * This overflow handler wraps only at grapheme boundaries (Intl.Segmenter).
 */
export function createKhmerSafeTableOverflow(doc: jsPDF) {
  const segmenter =
    typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
      ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      : null;

  return function khmerSafeOverflow(text: string | string[], textSpace: number): string[] {
    const scale = doc.internal.scaleFactor;
    const maxW = textSpace + 1 / scale;
    const paragraphs = Array.isArray(text) ? text : [text];
    const out: string[] = [];

    for (const para of paragraphs) {
      if (para.length === 0) {
        out.push('');
        continue;
      }

      if (!segmenter) {
        const fontSize = doc.getFontSize();
        const legacy = doc.splitTextToSize(para, maxW, { fontSize });
        const arr = Array.isArray(legacy) ? legacy : [legacy];
        out.push(...arr);
        continue;
      }

      const graphemes = Array.from(segmenter.segment(para), (s) => s.segment);
      let line = '';

      for (const g of graphemes) {
        const trial = line + g;
        const w = doc.getTextWidth(trial);
        if (w <= maxW || line.length === 0) {
          line = trial;
        } else {
          out.push(line);
          line = g;
        }
      }
      out.push(line);
    }

    return out;
  };
}
