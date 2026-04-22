export function formatDateMMDDYYYY(value: unknown) {
  if (!value) return "";
  const str =
    typeof value === "string" || typeof value === "number" ? String(value) : "";
  const d = value instanceof Date ? value : new Date(str);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${mm}/${dd}/${yyyy}`;
}
