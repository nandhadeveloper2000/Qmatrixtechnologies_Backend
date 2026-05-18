const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{7,15}$/;
const COUNTRY_CODE_REGEX = /^\+[0-9]{1,4}$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,39}$/;
const URL_LIKE_REGEX =
  /(https?:\/\/|www\.|(?:[a-z0-9-]+\.)+(?:com|net|org|edu|gov|co|in|io|ai|biz|info))/i;
const REPEATED_CHAR_REGEX = /(.)\1{5,}/;
const LONG_TOKEN_REGEX = /^(?=.*[A-Za-z])[A-Za-z0-9]{18,}$/;

export function sanitizeText(value: unknown) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeEmail(value: unknown) {
  return sanitizeText(value).toLowerCase();
}

export function normalizePhone(value: unknown) {
  return String(value ?? "")
    .replace(/[^\d]/g, "")
    .slice(0, 15);
}

export function normalizeCountryCode(value: unknown) {
  const cleaned = sanitizeText(value).replace(/[^\d+]/g, "");
  const withPlus = cleaned.startsWith("+") ? cleaned : `+${cleaned}`;

  return COUNTRY_CODE_REGEX.test(withPlus) ? withPlus : "+91";
}

export function isValidName(name: string) {
  return NAME_REGEX.test(sanitizeText(name));
}

export function isValidEmail(email: string) {
  return EMAIL_REGEX.test(email);
}

export function isValidCountryCode(countryCode: string) {
  return COUNTRY_CODE_REGEX.test(countryCode);
}

export function isValidPhone(phone: string) {
  return PHONE_REGEX.test(normalizePhone(phone));
}

export function hasUrlLikeContent(value: string) {
  return URL_LIKE_REGEX.test(sanitizeText(value));
}

export function isLikelySpamText(value: string) {
  const trimmed = sanitizeText(value);
  if (!trimmed) return false;

  const compact = trimmed.replace(/\s+/g, "");

  if (REPEATED_CHAR_REGEX.test(compact)) {
    return true;
  }

  if (!/\s/.test(trimmed) && compact.length >= 24) {
    return true;
  }

  if (LONG_TOKEN_REGEX.test(compact)) {
    return true;
  }

  return false;
}

export function isValidMessage(message: string) {
  const trimmed = sanitizeText(message);

  if (trimmed.length < 10 || trimmed.length > 1000) {
    return false;
  }

  if (!/[A-Za-z]{3,}/.test(trimmed)) {
    return false;
  }

  if (hasUrlLikeContent(trimmed)) {
    return false;
  }

  if (isLikelySpamText(trimmed)) {
    return false;
  }

  return true;
}

export function isSubmissionTooFast(startedAt: unknown, minElapsedMs = 2500) {
  const started = Number(startedAt);
  if (!Number.isFinite(started) || started <= 0) {
    return false;
  }

  return Date.now() - started < minElapsedMs;
}
