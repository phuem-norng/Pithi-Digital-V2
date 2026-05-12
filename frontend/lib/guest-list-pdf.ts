import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const FONT_FILE = 'NotoSansKhmer-Regular.ttf';
const FONT_NAME = 'NotoSansKhmer';

export type GuestListPdfTableRow = {
  name: string;
  phone: string;
  group: string;
  tag: string;
  status: string;
  greeting: string;
  note: string;
};

export type GuestListPdfColumnLabels = {
  name: string;
  phone: string;
  group: string;
  tag: string;
  status: string;
  greeting: string;
  note: string;
};

export type GuestListPdfHeaderLine = { label: string; value: string };

export type GuestListPdfOptions = {
  /** File base without extension, e.g. `EventTitle_GuestList_Selected_3` */
  filenameBase: string;
  docTitle: string;
  headerLines: GuestListPdfHeaderLine[];
  dateLine?: string;
  locationLine?: string;
  generatedLine: string;
  columns: GuestListPdfColumnLabels;
  rows: GuestListPdfTableRow[];
};

function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode(...slice);
  }
  return binary;
}

async function embedKhmerFont(doc: jsPDF): Promise<void> {
  const response = await fetch('/fonts/NotoSansKhmer-Regular.ttf');
  if (!response.ok) {
    throw new Error(`Khmer font failed to load (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  const base64 = btoa(arrayBufferToBinaryString(buffer));
  doc.addFileToVFS(FONT_FILE, base64);
  doc.addFont(FONT_FILE, FONT_NAME, 'normal', 'normal', 'Identity-H');
  doc.setFont(FONT_NAME, 'normal');
}

function drawSingleLine(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidthMm: number,
  fontSize: number,
): number {
  const safe = String(text ?? '').trim() || '-';
  doc.setFont(FONT_NAME, 'normal');
  let size = fontSize;
  doc.setFontSize(size);
  while (size > 6 && doc.getTextWidth(safe) > maxWidthMm) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  doc.text(safe, x, y);
  return y + Math.max(4.8, size * 0.56);
}

/**
 * Builds a printable guest list PDF with embedded Khmer-capable font.
 */
export async function downloadGuestListPdf(options: GuestListPdfOptions): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  await embedKhmerFont(doc);

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 12;
  let y = margin;
  const textMax = pageW - margin * 2;

  doc.setTextColor(30, 30, 30);
  y = drawSingleLine(doc, options.docTitle, margin, y + 4, textMax, 15);

  doc.setTextColor(35, 35, 35);
  for (const line of options.headerLines) {
    const combined = `${line.label}: ${(line.value ?? '').trim() || '-'}`;
    y = drawSingleLine(doc, combined, margin, y + 3, textMax, 10);
  }

  if (options.dateLine) {
    doc.setTextColor(55, 55, 55);
    y = drawSingleLine(doc, options.dateLine, margin, y + 3, textMax, 9.5);
  }
  if (options.locationLine) {
    doc.setTextColor(55, 55, 55);
    y = drawSingleLine(doc, options.locationLine, margin, y + 3, textMax, 9.5);
  }

  y += 2;
  doc.setTextColor(90, 90, 90);
  y = drawSingleLine(doc, options.generatedLine, margin, y + 3, textMax, 8.5);
  y += 4;

  const head = [
    [
      options.columns.name,
      options.columns.phone,
      options.columns.group,
      options.columns.tag,
      options.columns.status,
      options.columns.greeting,
      options.columns.note,
    ],
  ];

  const body = options.rows.map((row) => [
    row.name,
    row.phone,
    row.group,
    row.tag,
    row.status,
    row.greeting,
    row.note,
  ]);

  autoTable(doc, {
    startY: y,
    head,
    body,
    styles: {
      font: FONT_NAME,
      fontSize: 7.5,
      cellPadding: 1.5,
      textColor: [35, 35, 35],
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      font: FONT_NAME,
      fillColor: [197, 33, 51],
      textColor: 255,
      fontStyle: 'normal',
      halign: 'left',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 24 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 48 },
      5: { cellWidth: 62 },
      6: { cellWidth: 38 },
    },
    margin: { left: margin, right: margin },
    tableWidth: pageW - margin * 2,
    showHead: 'everyPage',
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const safe = options.filenameBase.replace(/[\\/:*?"<>|]/g, '-');
  doc.save(`${safe}_${stamp}.pdf`);
}
