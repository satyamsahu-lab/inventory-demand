import PDFDocument from 'pdfkit';

export function csvFromRows(headers: string[], rows: Array<Record<string, any>>) {
  const esc = (v: any) => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => esc(row[h])).join(','));
  }
  return lines.join('\n');
}

export async function pdfTableBuffer(title: string, headers: string[], rows: Array<Record<string, any>>) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks: Buffer[] = [];

  doc.on('data', (c) => chunks.push(c));

  doc.fontSize(16).text(title, { align: 'left' });
  doc.moveDown(1);

  const startX = doc.x;
  let y = doc.y;

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / headers.length;
  const rowHeight = 22;

  // header
  doc.fontSize(10).fillColor('#111827');
  headers.forEach((h, idx) => {
    doc.text(h, startX + idx * colWidth, y, { width: colWidth, align: 'left' });
  });
  y += rowHeight;
  doc.moveTo(startX, y - 6).lineTo(startX + pageWidth, y - 6).strokeColor('#E5E7EB').stroke();

  doc.fontSize(9).fillColor('#111827');
  for (const r of rows) {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    headers.forEach((h, idx) => {
      doc.text(String(r[h] ?? ''), startX + idx * colWidth, y, { width: colWidth, align: 'left' });
    });
    y += rowHeight;
  }

  doc.end();

  await new Promise<void>((resolve) => doc.on('end', () => resolve()));

  return Buffer.concat(chunks);
}
