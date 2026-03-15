import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadAuthFlowState, saveAuthFlowPatch } from "./flowStore";

const LOCK_VERSION = "1";
const LOCK_KEY_PREFIX = "loki.localLock";
const LOCK_KEYS = {
  enabled: `${LOCK_KEY_PREFIX}.enabled`,
  salt: `${LOCK_KEY_PREFIX}.salt`,
  verifier: `${LOCK_KEY_PREFIX}.verifier`,
  version: `${LOCK_KEY_PREFIX}.version`,
  duressEnabled: `${LOCK_KEY_PREFIX}.duress.enabled`,
  duressSalt: `${LOCK_KEY_PREFIX}.duress.salt`,
  duressVerifier: `${LOCK_KEY_PREFIX}.duress.verifier`,
  duressVersion: `${LOCK_KEY_PREFIX}.duress.version`,
};

type KeyValueStore = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

let warnedInsecureFallback = false;
let secureStoreModule:
  | {
      getItemAsync?: (key: string) => Promise<string | null>;
      setItemAsync?: (key: string, value: string) => Promise<void>;
      deleteItemAsync?: (key: string) => Promise<void>;
    }
  | null
  | undefined;
let expoCryptoModule:
  | {
      digestStringAsync?: (
        algorithm: string,
        data: string,
        options?: { encoding?: string },
      ) => Promise<string>;
      getRandomBytes?: (byteCount: number) => Uint8Array;
      CryptoDigestAlgorithm?: { SHA256?: string };
      CryptoEncoding?: { HEX?: string };
    }
  | null
  | undefined;

const getSecureStoreModule = () => {
  if (secureStoreModule !== undefined) {
    return secureStoreModule;
  }

  try {
    // Load lazily so app can still run if native module is missing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    secureStoreModule = require("expo-secure-store");
  } catch {
    secureStoreModule = null;
  }

  return secureStoreModule;
};

const getExpoCryptoModule = () => {
  if (expoCryptoModule !== undefined) {
    return expoCryptoModule;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expoCryptoModule = require("expo-crypto");
  } catch {
    expoCryptoModule = null;
  }

  return expoCryptoModule;
};

const getStore = (): KeyValueStore => {
  const secureStoreApi = getSecureStoreModule();

  if (
    secureStoreApi &&
    secureStoreApi.getItemAsync &&
    secureStoreApi.setItemAsync &&
    secureStoreApi.deleteItemAsync
  ) {
    return {
      getItemAsync: secureStoreApi.getItemAsync,
      setItemAsync: secureStoreApi.setItemAsync,
      deleteItemAsync: secureStoreApi.deleteItemAsync,
    };
  }

  if (!warnedInsecureFallback) {
    warnedInsecureFallback = true;
    console.warn(
      "[localLock] expo-secure-store is unavailable. Falling back to AsyncStorage for local password state.",
    );
  }

  return {
    getItemAsync: (key) => AsyncStorage.getItem(key),
    setItemAsync: (key, value) => AsyncStorage.setItem(key, value),
    deleteItemAsync: (key) => AsyncStorage.removeItem(key),
  };
};

const LOCKOUT_SCHEDULE: Record<number, { seconds: number; stage: number }> = {
  3: { seconds: 30, stage: 1 },
  5: { seconds: 60, stage: 2 },
  7: { seconds: 300, stage: 3 },
};

const FINAL_WIPE_ATTEMPT = 9;

const subtle = () => globalThis.crypto?.subtle ?? null;

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const sha256Hex = async (input: string): Promise<string> => {
  const cryptoSubtle = subtle();
  if (cryptoSubtle) {
    const data = new TextEncoder().encode(input);
    const digest = await cryptoSubtle.digest("SHA-256", data);
    return bytesToHex(new Uint8Array(digest));
  }

  const cryptoModule = getExpoCryptoModule();
  const digestStringAsync = cryptoModule?.digestStringAsync;
  if (digestStringAsync) {
    const sha256 = cryptoModule?.CryptoDigestAlgorithm?.SHA256 ?? "SHA-256";
    const hex = cryptoModule?.CryptoEncoding?.HEX ?? "hex";
    return digestStringAsync(sha256, input, { encoding: hex });
  }

  throw new Error("Secure password hashing is unavailable on this runtime.");
};

const makeSalt = () => {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return bytesToHex(bytes);
  }

  const cryptoModule = getExpoCryptoModule();
  if (cryptoModule?.getRandomBytes) {
    return bytesToHex(cryptoModule.getRandomBytes(16));
  }

  const fallback = () => Math.random().toString(36).slice(2, 10);
  return `${fallback()}${fallback()}${Date.now().toString(36)}`;
};

const deriveVerifier = async (password: string, salt: string): Promise<string> => {
  const first = await sha256Hex(`${LOCK_VERSION}:${salt}:${password}`);
  return sha256Hex(`${LOCK_VERSION}:${first}:${salt}`);
};

const normalizePassword = (password: string) => password.trim();

const loadPrimaryVerifier = async () => {
  const store = getStore();
  const [enabled, salt, verifier] = await Promise.all([
    store.getItemAsync(LOCK_KEYS.enabled),
    store.getItemAsync(LOCK_KEYS.salt),
    store.getItemAsync(LOCK_KEYS.verifier),
  ]);

  return {
    enabled: enabled === "true",
    salt: salt ?? null,
    verifier: verifier ?? null,
  };
};

const loadDuressVerifier = async () => {
  const store = getStore();
  const [enabled, salt, verifier] = await Promise.all([
    store.getItemAsync(LOCK_KEYS.duressEnabled),
    store.getItemAsync(LOCK_KEYS.duressSalt),
    store.getItemAsync(LOCK_KEYS.duressVerifier),
  ]);

  return {
    enabled: enabled === "true",
    salt: salt ?? null,
    verifier: verifier ?? null,
  };
};

const assertPasswordMinLength = (password: string, label: string) => {
  if (password.length < 6) {
    throw new Error(`${label} must be at least 6 characters.`);
  }
};

export const isLocalPasswordEnabled = async (): Promise<boolean> => {
  const data = await loadPrimaryVerifier();
  return Boolean(data.enabled && data.salt && data.verifier);
};

export const hasDuressPasswordEnabled = async (): Promise<boolean> => {
  const data = await loadDuressVerifier();
  return Boolean(data.enabled && data.salt && data.verifier);
};

export const getLocalPasswordLockState = async () => {
  const state = await loadAuthFlowState();
  const lockUntil = state.localPasswordLockUntilMs ?? null;
  const remainingMs = lockUntil ? Math.max(lockUntil - Date.now(), 0) : 0;

  return {
    failedAttempts: state.localPasswordFailedAttempts ?? 0,
    lockUntilMs: lockUntil,
    lockStage: state.localPasswordLockStage ?? 0,
    remainingMs,
  };
};

export const resetLockoutState = async () => {
  await saveAuthFlowPatch({
    localPasswordFailedAttempts: 0,
    localPasswordLockUntilMs: null,
    localPasswordLockStage: 0,
  });
};

export const clearLocalPasswordMaterial = async () => {
  const store = getStore();
  await Promise.all([
    store.deleteItemAsync(LOCK_KEYS.enabled),
    store.deleteItemAsync(LOCK_KEYS.salt),
    store.deleteItemAsync(LOCK_KEYS.verifier),
    store.deleteItemAsync(LOCK_KEYS.version),
  ]);
};

export const clearDuressPasswordMaterial = async () => {
  const store = getStore();
  await Promise.all([
    store.deleteItemAsync(LOCK_KEYS.duressEnabled),
    store.deleteItemAsync(LOCK_KEYS.duressSalt),
    store.deleteItemAsync(LOCK_KEYS.duressVerifier),
    store.deleteItemAsync(LOCK_KEYS.duressVersion),
  ]);
};

export const clearAllLocalPasswordMaterial = async () => {
  await Promise.all([clearLocalPasswordMaterial(), clearDuressPasswordMaterial()]);
};

export const disableLocalPassword = async () => {
  await clearLocalPasswordMaterial();
  await resetLockoutState();
};

export const setLocalPassword = async (password: string) => {
  const store = getStore();
  const normalized = normalizePassword(password);
  assertPasswordMinLength(normalized, "Password");

  const duress = await loadDuressVerifier();
  if (duress.enabled && duress.salt && duress.verifier) {
    const maybeSameAsDuress = await deriveVerifier(normalized, duress.salt);
    if (maybeSameAsDuress === duress.verifier) {
      throw new Error("App password must be different from duress password.");
    }
  }

  const salt = makeSalt();
  const verifier = await deriveVerifier(normalized, salt);

  await Promise.all([
    store.setItemAsync(LOCK_KEYS.enabled, "true"),
    store.setItemAsync(LOCK_KEYS.salt, salt),
    store.setItemAsync(LOCK_KEYS.verifier, verifier),
    store.setItemAsync(LOCK_KEYS.version, LOCK_VERSION),
  ]);

  await resetLockoutState();
};

export const setDuressPassword = async (password: string) => {
  const store = getStore();
  const normalized = normalizePassword(password);
  assertPasswordMinLength(normalized, "Duress password");

  const primary = await loadPrimaryVerifier();
  if (primary.enabled && primary.salt && primary.verifier) {
    const maybeSameAsPrimary = await deriveVerifier(normalized, primary.salt);
    if (maybeSameAsPrimary === primary.verifier) {
      throw new Error("Duress password must be different from app password.");
    }
  }

  const salt = makeSalt();
  const verifier = await deriveVerifier(normalized, salt);

  await Promise.all([
    store.setItemAsync(LOCK_KEYS.duressEnabled, "true"),
    store.setItemAsync(LOCK_KEYS.duressSalt, salt),
    store.setItemAsync(LOCK_KEYS.duressVerifier, verifier),
    store.setItemAsync(LOCK_KEYS.duressVersion, LOCK_VERSION),
  ]);
};

export const verifyLocalPassword = async (password: string): Promise<boolean> => {
  const normalized = normalizePassword(password);
  const data = await loadPrimaryVerifier();
  if (!data.enabled || !data.salt || !data.verifier) {
    return false;
  }

  const candidate = await deriveVerifier(normalized, data.salt);
  return candidate === data.verifier;
};

export const verifyDuressPassword = async (password: string): Promise<boolean> => {
  const normalized = normalizePassword(password);
  const data = await loadDuressVerifier();
  if (!data.enabled || !data.salt || !data.verifier) {
    return false;
  }

  const candidate = await deriveVerifier(normalized, data.salt);
  return candidate === data.verifier;
};

export const recordFailedAttemptAndMaybeLock = async () => {
  const state = await loadAuthFlowState();
  const failedAttempts = (state.localPasswordFailedAttempts ?? 0) + 1;

  if (failedAttempts >= FINAL_WIPE_ATTEMPT) {
    await saveAuthFlowPatch({
      localPasswordFailedAttempts: failedAttempts,
      localPasswordLockUntilMs: null,
      localPasswordLockStage: 4,
    });
    return {
      failedAttempts,
      lockoutSeconds: 0,
      shouldWipeAllData: true,
    };
  }

  const lockConfig = LOCKOUT_SCHEDULE[failedAttempts];
  const lockUntil = lockConfig ? Date.now() + lockConfig.seconds * 1000 : null;

  await saveAuthFlowPatch({
    localPasswordFailedAttempts: failedAttempts,
    localPasswordLockUntilMs: lockUntil,
    localPasswordLockStage: lockConfig?.stage ?? state.localPasswordLockStage ?? 0,
  });

  return {
    failedAttempts,
    lockoutSeconds: lockConfig?.seconds ?? 0,
    shouldWipeAllData: false,
  };
};
