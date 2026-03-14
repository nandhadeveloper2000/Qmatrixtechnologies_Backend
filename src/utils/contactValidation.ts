export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string) {
  return /^[0-9]{6,15}$/.test(phone.replace(/\s+/g, ""));
}

export function sanitizeText(value: unknown) {
  return String(value || "").trim();
}