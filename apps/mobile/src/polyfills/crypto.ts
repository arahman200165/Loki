import * as ExpoCrypto from "expo-crypto";

const target = globalThis as unknown as {
  crypto?: Record<string, unknown>;
};
const existing = target.crypto ?? {};

if (!existing.getRandomValues) {
  existing.getRandomValues = ExpoCrypto.getRandomValues as unknown;
}

if (!existing.randomUUID) {
  existing.randomUUID = ExpoCrypto.randomUUID as unknown;
}

target.crypto = existing;
