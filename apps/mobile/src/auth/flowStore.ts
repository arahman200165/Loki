import AsyncStorage from "@react-native-async-storage/async-storage";

export const AUTH_STORAGE_KEYS = {
  authToken: "authToken",
  userId: "authUserId",
  deviceId: "authDeviceId",
  devicePublicJwk: "authDevicePublicJwk",
  devicePrivateJwk: "authDevicePrivateJwk",
  recoveryPublicJwk: "authRecoveryPublicJwk",
  recoveryPrivateJwk: "authRecoveryPrivateJwk",
  userPublicJwk: "authUserPublicJwk",
  accountLocator: "authAccountLocator",
  displayName: "authDisplayName",
  lockMode: "authLockMode",
  recoveryPhrase: "authRecoveryPhrase",
  recoveryVerified: "authRecoveryVerified",
  recoveryFileExported: "authRecoveryFileExported",
  recoveryPhraseViewed: "authRecoveryPhraseViewed",
  pendingDevicePublicJwk: "authPendingDevicePublicJwk",
  pendingDevicePrivateJwk: "authPendingDevicePrivateJwk",
  linkSessionId: "authLinkSessionId",
  recoverySessionId: "authRecoverySessionId",
  recoveryChallenge: "authRecoveryChallenge",
  resolvedLinkSessionId: "authResolvedLinkSessionId",
  pendingDeviceLabel: "authPendingDeviceLabel",
  pendingDevicePlatform: "authPendingDevicePlatform",
  localPasswordFailedAttempts: "authLocalPasswordFailedAttempts",
  localPasswordLockUntilMs: "authLocalPasswordLockUntilMs",
  localPasswordLockStage: "authLocalPasswordLockStage",
};

export type LockMode = "none" | "biometric" | "pin" | "passphrase";

export type AuthFlowState = {
  authToken: string | null;
  userId: string | null;
  deviceId: string | null;
  devicePublicJwk: string | null;
  devicePrivateJwk: string | null;
  recoveryPublicJwk: string | null;
  recoveryPrivateJwk: string | null;
  userPublicJwk: string | null;
  accountLocator: string | null;
  displayName: string | null;
  lockMode: LockMode | null;
  recoveryPhrase: string[] | null;
  recoveryVerified: boolean;
  recoveryFileExported: boolean;
  recoveryPhraseViewed: boolean;
  pendingDevicePublicJwk: string | null;
  pendingDevicePrivateJwk: string | null;
  linkSessionId: string | null;
  recoverySessionId: string | null;
  recoveryChallenge: string | null;
  resolvedLinkSessionId: string | null;
  pendingDeviceLabel: string | null;
  pendingDevicePlatform: string | null;
  localPasswordFailedAttempts: number;
  localPasswordLockUntilMs: number | null;
  localPasswordLockStage: number;
};

const fromEntries = (pairs: readonly (readonly [string, string | null])[]) =>
  Object.fromEntries(pairs);

const parseBoolean = (value: string | null) => value === "true";
const parseLockMode = (value: string | null): LockMode | null => {
  if (!value) {
    return null;
  }

  if (value === "none" || value === "biometric" || value === "pin" || value === "passphrase") {
    return value;
  }

  return null;
};
const parseNumber = (value: string | null) => {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parsePhrase = (value: string | null): string[] | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((part) => typeof part === "string")) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const loadAuthFlowState = async (): Promise<AuthFlowState> => {
  const values = await AsyncStorage.multiGet(Object.values(AUTH_STORAGE_KEYS));
  const byKey = fromEntries(values);

  return {
    authToken: byKey[AUTH_STORAGE_KEYS.authToken] ?? null,
    userId: byKey[AUTH_STORAGE_KEYS.userId] ?? null,
    deviceId: byKey[AUTH_STORAGE_KEYS.deviceId] ?? null,
    devicePublicJwk: byKey[AUTH_STORAGE_KEYS.devicePublicJwk] ?? null,
    devicePrivateJwk: byKey[AUTH_STORAGE_KEYS.devicePrivateJwk] ?? null,
    recoveryPublicJwk: byKey[AUTH_STORAGE_KEYS.recoveryPublicJwk] ?? null,
    recoveryPrivateJwk: byKey[AUTH_STORAGE_KEYS.recoveryPrivateJwk] ?? null,
    userPublicJwk: byKey[AUTH_STORAGE_KEYS.userPublicJwk] ?? null,
    accountLocator: byKey[AUTH_STORAGE_KEYS.accountLocator] ?? null,
    displayName: byKey[AUTH_STORAGE_KEYS.displayName] ?? null,
    lockMode: parseLockMode(byKey[AUTH_STORAGE_KEYS.lockMode] ?? null),
    recoveryPhrase: parsePhrase(byKey[AUTH_STORAGE_KEYS.recoveryPhrase] ?? null),
    recoveryVerified: parseBoolean(byKey[AUTH_STORAGE_KEYS.recoveryVerified] ?? null),
    recoveryFileExported: parseBoolean(byKey[AUTH_STORAGE_KEYS.recoveryFileExported] ?? null),
    recoveryPhraseViewed: parseBoolean(byKey[AUTH_STORAGE_KEYS.recoveryPhraseViewed] ?? null),
    pendingDevicePublicJwk: byKey[AUTH_STORAGE_KEYS.pendingDevicePublicJwk] ?? null,
    pendingDevicePrivateJwk: byKey[AUTH_STORAGE_KEYS.pendingDevicePrivateJwk] ?? null,
    linkSessionId: byKey[AUTH_STORAGE_KEYS.linkSessionId] ?? null,
    recoverySessionId: byKey[AUTH_STORAGE_KEYS.recoverySessionId] ?? null,
    recoveryChallenge: byKey[AUTH_STORAGE_KEYS.recoveryChallenge] ?? null,
    resolvedLinkSessionId: byKey[AUTH_STORAGE_KEYS.resolvedLinkSessionId] ?? null,
    pendingDeviceLabel: byKey[AUTH_STORAGE_KEYS.pendingDeviceLabel] ?? null,
    pendingDevicePlatform: byKey[AUTH_STORAGE_KEYS.pendingDevicePlatform] ?? null,
    localPasswordFailedAttempts: parseNumber(
      byKey[AUTH_STORAGE_KEYS.localPasswordFailedAttempts] ?? null,
    ) ?? 0,
    localPasswordLockUntilMs: parseNumber(byKey[AUTH_STORAGE_KEYS.localPasswordLockUntilMs] ?? null),
    localPasswordLockStage: parseNumber(byKey[AUTH_STORAGE_KEYS.localPasswordLockStage] ?? null) ?? 0,
  };
};

export const saveAuthFlowPatch = async (patch: Partial<AuthFlowState>) => {
  const pairs: [string, string][] = [];
  const removeKeys: string[] = [];

  const set = (key: string, value: string | number | null | undefined) => {
    if (value === null) {
      removeKeys.push(key);
      return;
    }

    if (typeof value === "string") {
      pairs.push([key, value]);
      return;
    }

    if (typeof value === "number") {
      pairs.push([key, String(value)]);
    }
  };

  set(AUTH_STORAGE_KEYS.authToken, patch.authToken);
  set(AUTH_STORAGE_KEYS.userId, patch.userId);
  set(AUTH_STORAGE_KEYS.deviceId, patch.deviceId);
  set(AUTH_STORAGE_KEYS.devicePublicJwk, patch.devicePublicJwk);
  set(AUTH_STORAGE_KEYS.devicePrivateJwk, patch.devicePrivateJwk);
  set(AUTH_STORAGE_KEYS.recoveryPublicJwk, patch.recoveryPublicJwk);
  set(AUTH_STORAGE_KEYS.recoveryPrivateJwk, patch.recoveryPrivateJwk);
  set(AUTH_STORAGE_KEYS.userPublicJwk, patch.userPublicJwk);
  set(AUTH_STORAGE_KEYS.accountLocator, patch.accountLocator);
  set(AUTH_STORAGE_KEYS.displayName, patch.displayName);
  set(AUTH_STORAGE_KEYS.lockMode, patch.lockMode);
  set(AUTH_STORAGE_KEYS.pendingDevicePublicJwk, patch.pendingDevicePublicJwk);
  set(AUTH_STORAGE_KEYS.pendingDevicePrivateJwk, patch.pendingDevicePrivateJwk);
  set(AUTH_STORAGE_KEYS.linkSessionId, patch.linkSessionId);
  set(AUTH_STORAGE_KEYS.recoverySessionId, patch.recoverySessionId);
  set(AUTH_STORAGE_KEYS.recoveryChallenge, patch.recoveryChallenge);
  set(AUTH_STORAGE_KEYS.resolvedLinkSessionId, patch.resolvedLinkSessionId);
  set(AUTH_STORAGE_KEYS.pendingDeviceLabel, patch.pendingDeviceLabel);
  set(AUTH_STORAGE_KEYS.pendingDevicePlatform, patch.pendingDevicePlatform);
  set(AUTH_STORAGE_KEYS.localPasswordFailedAttempts, patch.localPasswordFailedAttempts);
  set(AUTH_STORAGE_KEYS.localPasswordLockUntilMs, patch.localPasswordLockUntilMs);
  set(AUTH_STORAGE_KEYS.localPasswordLockStage, patch.localPasswordLockStage);

  if (Array.isArray(patch.recoveryPhrase)) {
    pairs.push([AUTH_STORAGE_KEYS.recoveryPhrase, JSON.stringify(patch.recoveryPhrase)]);
  }

  if (typeof patch.recoveryVerified === "boolean") {
    pairs.push([AUTH_STORAGE_KEYS.recoveryVerified, patch.recoveryVerified ? "true" : "false"]);
  }
  if (typeof patch.recoveryFileExported === "boolean") {
    pairs.push([
      AUTH_STORAGE_KEYS.recoveryFileExported,
      patch.recoveryFileExported ? "true" : "false",
    ]);
  }
  if (typeof patch.recoveryPhraseViewed === "boolean") {
    pairs.push([
      AUTH_STORAGE_KEYS.recoveryPhraseViewed,
      patch.recoveryPhraseViewed ? "true" : "false",
    ]);
  }

  if (pairs.length) {
    await AsyncStorage.multiSet(pairs);
  }

  if (removeKeys.length) {
    await AsyncStorage.multiRemove(removeKeys);
  }
};

export const clearTransientOnboardingState = async () => {
  await AsyncStorage.multiRemove([
    AUTH_STORAGE_KEYS.recoveryPhrase,
    AUTH_STORAGE_KEYS.recoveryPhraseViewed,
    AUTH_STORAGE_KEYS.recoveryVerified,
    AUTH_STORAGE_KEYS.recoveryFileExported,
    AUTH_STORAGE_KEYS.lockMode,
    AUTH_STORAGE_KEYS.pendingDevicePublicJwk,
    AUTH_STORAGE_KEYS.pendingDevicePrivateJwk,
    AUTH_STORAGE_KEYS.linkSessionId,
    AUTH_STORAGE_KEYS.recoverySessionId,
    AUTH_STORAGE_KEYS.recoveryChallenge,
    AUTH_STORAGE_KEYS.resolvedLinkSessionId,
    AUTH_STORAGE_KEYS.pendingDeviceLabel,
    AUTH_STORAGE_KEYS.pendingDevicePlatform,
    AUTH_STORAGE_KEYS.localPasswordFailedAttempts,
    AUTH_STORAGE_KEYS.localPasswordLockUntilMs,
    AUTH_STORAGE_KEYS.localPasswordLockStage,
  ]);
};

export const clearAuthSession = async () => {
  await AsyncStorage.multiRemove([
    AUTH_STORAGE_KEYS.authToken,
    AUTH_STORAGE_KEYS.userId,
  ]);
};

export const clearAllAuthFlowState = async () => {
  await AsyncStorage.multiRemove(Object.values(AUTH_STORAGE_KEYS));
};

export const getEntryAuthRoute = async (): Promise<
  "/(auth)/unlock" | "/(auth)/restore-or-add-device" | "/(auth)/welcome"
> => {
  const state = await loadAuthFlowState();
  const hasDeviceIdentity = Boolean(state.deviceId && state.devicePrivateJwk);
  if (hasDeviceIdentity) {
    return "/(auth)/unlock";
  }

  const hasReturningAccountHints = Boolean(
    state.accountLocator ||
      state.userPublicJwk ||
      state.recoveryPublicJwk ||
      (state.recoveryPhrase && state.recoveryPhrase.length),
  );

  return hasReturningAccountHints ? "/(auth)/restore-or-add-device" : "/(auth)/welcome";
};
