export function csvFromRows(headers: string[], rows: Array<Record<string, any>>) {
  const formatHeader = (h: string) => h.replace(/_/g, ' ').toUpperCase();
  const formatValue = (v: any) => {
    if (v instanceof Date) return formatDateDDMMYYYY(v);
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return formatDateDDMMYYYY(d);
    }
    return v;
  };

  const esc = (v: any) => {
    const s = String(formatValue(v) ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [headers.map(formatHeader).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => esc(row[h])).join(','));
  }
  return lines.join('\n');
}

function formatDateDDMMYYYY(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
