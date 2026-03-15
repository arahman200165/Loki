type LocalAuthenticationModule = {
  hasHardwareAsync?: () => Promise<boolean>;
  isEnrolledAsync?: () => Promise<boolean>;
  getEnrolledLevelAsync?: () => Promise<number>;
  supportedAuthenticationTypesAsync?: () => Promise<number[]>;
  authenticateAsync?: (options?: {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
  }) => Promise<{
    success: boolean;
    error?: string;
    warning?: string;
  }>;
  AuthenticationType?: {
    FINGERPRINT?: number;
    FACIAL_RECOGNITION?: number;
    IRIS?: number;
  };
  SecurityLevel?: {
    NONE?: number;
    SECRET?: number;
    BIOMETRIC_WEAK?: number;
    BIOMETRIC_STRONG?: number;
  };
};

type DeviceAuthResult = {
  ok: boolean;
  code?: string;
  message?: string;
};

type AvailabilityResult =
  | { supported: false; reason: string }
  | { supported: true; localAuth: LocalAuthenticationModule };

let localAuthModule: LocalAuthenticationModule | null | undefined;

const getLocalAuth = () => {
  if (localAuthModule !== undefined) {
    return localAuthModule;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    localAuthModule = require("expo-local-authentication");
  } catch {
    localAuthModule = null;
  }

  return localAuthModule;
};

const unsupported = (message: string): DeviceAuthResult => ({
  ok: false,
  code: "not-available",
  message,
});

const mapErrorMessage = (error?: string): string => {
  switch (error) {
    case "user_cancel":
    case "system_cancel":
    case "app_cancel":
      return "Authentication was canceled.";
    case "not_enrolled":
      return "No biometric or device credential is enrolled on this device.";
    case "not_available":
      return "Secure device authentication is unavailable on this device.";
    case "lockout":
      return "Too many failed attempts. Please retry in a moment.";
    case "passcode_not_set":
      return "Set a device PIN or passcode to enable this unlock method.";
    default:
      return "Authentication failed. Please try again.";
  }
};

const resolveBaseAvailability = async (): Promise<AvailabilityResult> => {
  const localAuth = getLocalAuth();
  if (!localAuth?.hasHardwareAsync || !localAuth?.authenticateAsync) {
    return { supported: false, reason: "Device authentication is unavailable in this app build." };
  }

  const hasHardware = await localAuth.hasHardwareAsync();
  if (!hasHardware) {
    return { supported: false, reason: "This device does not support secure local authentication." };
  }

  return { supported: true as const, localAuth };
};

export const canUseBiometric = async (): Promise<{ supported: boolean; reason?: string }> => {
  const availability = await resolveBaseAvailability();
  if (!availability.supported) {
    return availability;
  }

  const localAuth = availability.localAuth;
  if (!localAuth.isEnrolledAsync || !localAuth.supportedAuthenticationTypesAsync) {
    return { supported: false, reason: "Biometric unlock is unavailable in this app build." };
  }

  const enrolled = await localAuth.isEnrolledAsync();
  if (!enrolled) {
    return { supported: false, reason: "No biometric profile is enrolled on this device." };
  }

  const types = await localAuth.supportedAuthenticationTypesAsync?.();
  const fingerprint = localAuth.AuthenticationType?.FINGERPRINT;
  const face = localAuth.AuthenticationType?.FACIAL_RECOGNITION;
  const iris = localAuth.AuthenticationType?.IRIS;
  const hasSupportedBiometricType = Boolean(
    types?.some((type) => type === fingerprint || type === face || type === iris),
  );

  if (!hasSupportedBiometricType) {
    return { supported: false, reason: "Biometric unlock is not available on this device." };
  }

  return { supported: true };
};

export const canUseDeviceCredential = async (): Promise<{ supported: boolean; reason?: string }> => {
  const availability = await resolveBaseAvailability();
  if (!availability.supported) {
    return availability;
  }

  const localAuth = availability.localAuth;
  if (!localAuth.getEnrolledLevelAsync) {
    return { supported: false, reason: "Device PIN/passcode unlock is unavailable in this app build." };
  }

  const securityLevel = await localAuth.getEnrolledLevelAsync();
  const noneLevel = localAuth.SecurityLevel?.NONE ?? 0;
  const secretLevel = localAuth.SecurityLevel?.SECRET ?? 1;
  if (securityLevel < secretLevel || securityLevel === noneLevel) {
    return { supported: false, reason: "No device PIN/passcode is enrolled on this device." };
  }

  return { supported: true };
};

export const authenticateWithBiometric = async (): Promise<DeviceAuthResult> => {
  const availability = await canUseBiometric();
  if (!availability.supported) {
    return unsupported(availability.reason ?? "Biometric unlock is unavailable.");
  }

  const localAuth = getLocalAuth();
  if (!localAuth?.authenticateAsync) {
    return unsupported("Biometric unlock is unavailable.");
  }

  const result = await localAuth.authenticateAsync({
    promptMessage: "Unlock Loki",
    cancelLabel: "Cancel",
    fallbackLabel: "Use device passcode",
    disableDeviceFallback: true,
  });

  if (result.success) {
    return { ok: true };
  }

  return {
    ok: false,
    code: result.error ?? "auth-failed",
    message: mapErrorMessage(result.error),
  };
};

export const authenticateWithDeviceCredential = async (): Promise<DeviceAuthResult> => {
  const availability = await canUseDeviceCredential();
  if (!availability.supported) {
    return unsupported(availability.reason ?? "Device PIN/passcode unlock is unavailable.");
  }

  const localAuth = getLocalAuth();
  if (!localAuth?.authenticateAsync) {
    return unsupported("Device PIN/passcode unlock is unavailable.");
  }

  const result = await localAuth.authenticateAsync({
    promptMessage: "Unlock Loki",
    cancelLabel: "Cancel",
    fallbackLabel: "Use device passcode",
    disableDeviceFallback: false,
  });

  if (result.success) {
    return { ok: true };
  }

  return {
    ok: false,
    code: result.error ?? "auth-failed",
    message: mapErrorMessage(result.error),
  };
};

export const authenticate = async (mode: "biometric" | "pin"): Promise<DeviceAuthResult> => {
  if (mode === "biometric") {
    return authenticateWithBiometric();
  }

  return authenticateWithDeviceCredential();
};
