// Client-generated correlation ID for Idempotency-Key headers (ADR-018).
// This is not a cryptographic key — it only needs to be unique per submission
// attempt so a retry of the same action reuses the same key. Math.random() is
// fine here; do not use this pattern for anything security-sensitive.
export const generateIdempotencyKey = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
