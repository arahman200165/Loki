// MVP retention limits (loki-architecture.md Appendix G, loki-mvp-prd.md)
// Change these only via ADR — they are product constraints, not defaults.

export const ENVELOPE_TTL_MIN_SECONDS = 86_400;   // 24 hours
export const ENVELOPE_TTL_MAX_SECONDS = 259_200;  // 72 hours
export const ENVELOPE_TTL_DEFAULT_SECONDS = 86_400;

export const CONTACT_REQUEST_TTL_DAYS = 7;
export const PUBLIC_ID_ROTATION_COOLDOWN_DAYS = 7;
export const DEPRECATED_PUBLIC_ID_LOCKOUT_DAYS = 180;

export const MAX_DEVICES_PER_ACCOUNT = 3;
export const MAX_GROUP_MEMBERS = 25;

export type EnvelopeTtlSeconds = number; // must be within min–max above
