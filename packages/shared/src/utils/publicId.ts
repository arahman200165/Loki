// Public-ID format rules (from loki-mvp-prd.md):
//   - Characters: a–z, 0–9, single hyphen between chars
//   - Length: 8–24 characters
//   - Must start with a letter
//   - No trailing hyphen
//   - No consecutive hyphens

export const PUBLIC_ID_MIN_LENGTH = 8;
export const PUBLIC_ID_MAX_LENGTH = 24;

// Anchored: starts with [a-z], then zero-or-more alphanum segments joined by single hyphens
const PUBLIC_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

export const RESERVED_PUBLIC_IDS: ReadonlySet<string> = new Set([
  "admin",
  "support",
  "security",
  "moderator",
  "system",
  "loki",
  "official",
  "api",
  "web",
  "mail",
  "root",
  "null",
  "undefined",
  "help",
  "safety",
  "verify",
  "verified",
  "trust",
]);

// Common Unicode homoglyphs that visually resemble ASCII a–z, 0–9.
// The format regex already blocks these, but we surface a distinct reason
// so callers can log or audit confusable attempts separately.
const CONFUSABLE_CHARS: ReadonlySet<string> = new Set([
  // Cyrillic
  "а", // а → a
  "е", // е → e
  "о", // о → o
  "р", // р → r
  "с", // с → c
  "х", // х → x
  "і", // і → i
  "й", // й → short-i
  // Greek
  "ο", // ο → o
  "α", // α → a
  "ε", // ε → e
  "ν", // ν → v
  // Latin extended
  "ó", // ó
  "é", // é
  "à", // à
  "ä", // ä
  "ü", // ü
  "ö", // ö
]);

export type PublicIdValidationError =
  | "too_short"
  | "too_long"
  | "invalid_format"
  | "reserved"
  | "confusable";

export type PublicIdValidationResult =
  | { valid: true }
  | { valid: false; reason: PublicIdValidationError };

export function validatePublicId(id: string): PublicIdValidationResult {
  if (RESERVED_PUBLIC_IDS.has(id)) return { valid: false, reason: "reserved" };
  if (id.length < PUBLIC_ID_MIN_LENGTH)
    return { valid: false, reason: "too_short" };
  if (id.length > PUBLIC_ID_MAX_LENGTH)
    return { valid: false, reason: "too_long" };

  // Check for known confusable Unicode chars before the format regex
  // so we can return a distinct reason rather than generic invalid_format
  if (hasConfusableChars(id)) return { valid: false, reason: "confusable" };

  if (!PUBLIC_ID_PATTERN.test(id))
    return { valid: false, reason: "invalid_format" };

  return { valid: true };
}

// Strip leading/trailing whitespace and lowercase before validation.
// Does NOT normalize confusable Unicode — callers must pass the raw input.
export function normalizePublicId(raw: string): string {
  return raw.trim().toLowerCase();
}

function hasConfusableChars(id: string): boolean {
  for (const ch of id) {
    if (CONFUSABLE_CHARS.has(ch)) return true;
  }
  return false;
}
