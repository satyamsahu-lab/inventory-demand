export function escapeIdentifier(ident: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(ident)) {
    throw new Error('Invalid identifier');
  }
  return `"${ident}"`;
}

export function buildILikeSearch(columns: string[], search?: string) {
  if (!search) {
    return { clause: '', params: [] as any[] };
  }

  const q = `%${search}%`;
  const parts = columns.map((c, i) => `${c} ILIKE $${i + 1}`);
  return {
    clause: `(${parts.join(' OR ')})`,
    params: columns.map(() => q)
  };
}
