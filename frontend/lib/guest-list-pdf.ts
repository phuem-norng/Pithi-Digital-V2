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

/**
 * Builds a printable guest list PDF with embedded Khmer-capable font.
 */
export async function downloadGuestListPdf(options: GuestListPdfOptions): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await embedKhmerFont(doc);

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  doc.setFont(FONT_NAME, 'normal');
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(options.docTitle, margin, y);
  y += 9;

  doc.setFontSize(11);
  doc.setTextColor(55, 55, 55);
  for (const line of options.headerLines) {
    const label = `${line.label}:`;
    doc.setFont(FONT_NAME, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(label, margin, y);
    const labelW = doc.getTextWidth(`${label} `);
    doc.setTextColor(25, 25, 25);
    const wrapped = doc.splitTextToSize(line.value || '—', pageW - margin * 2 - labelW);
    doc.text(wrapped, margin + labelW, y);
    y += Math.max(6, wrapped.length * 5);
  }

  if (options.dateLine) {
    doc.setFontSize(9.5);
    doc.setTextColor(70, 70, 70);
    doc.text(options.dateLine, margin, y);
    y += 5.5;
  }
  if (options.locationLine) {
    doc.setFontSize(9.5);
    doc.setTextColor(70, 70, 70);
    const loc = doc.splitTextToSize(options.locationLine, pageW - margin * 2);
    doc.text(loc, margin, y);
    y += loc.length * 5;
  }

  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(options.generatedLine, margin, y);
  y += 8;

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
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [35, 35, 35],
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    headStyles: {
      font: FONT_NAME,
      fillColor: [197, 33, 51],
      textColor: 255,
      fontStyle: 'normal',
      halign: 'left',
    },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 24 },
      2: { cellWidth: 24 },
      3: { cellWidth: 24 },
      4: { cellWidth: 32 },
      5: { cellWidth: 32 },
      6: { cellWidth: 26 },
    },
    margin: { left: margin, right: margin },
    tableWidth: pageW - margin * 2,
    showHead: 'everyPage',
    horizontalPageBreak: true,
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const safe = options.filenameBase.replace(/[\\/:*?"<>|]/g, '-');
  doc.save(`${safe}_${stamp}.pdf`);
}
