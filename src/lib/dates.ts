/** Postgres / Neon may return DATE columns as Date objects. */
export function formatDisplayDate(value: unknown): string {
  if (value == null || value === "") return "—";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}
