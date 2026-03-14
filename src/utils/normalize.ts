export function normEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}