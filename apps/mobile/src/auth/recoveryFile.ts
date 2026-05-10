export type RecoveryFileV1 = {
  version: 1;
  account_locator: string;
  recovery_private_jwk: string;
  recovery_public_jwk?: string;
  created_at: string;
};

export type RecoveryImportResult = {
  accountLocator: string;
  recoveryPrivateJwk: string;
  recoveryPublicJwk: string | null;
};

const parseJsonObject = (text: string): Record<string, unknown> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Recovery file is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Recovery file has an invalid format.");
  }

  return parsed as Record<string, unknown>;
};

const requireNonEmptyString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Recovery file is missing ${fieldName}.`);
  }

  return value.trim();
};

const validateJwkText = (text: string): string => {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error();
    }
  } catch {
    throw new Error("Recovery file has an invalid recovery_private_jwk value.");
  }

  return text;
};

export const buildRecoveryFileV1 = (params: {
  accountLocator: string;
  recoveryPrivateJwk: string;
  recoveryPublicJwk?: string | null;
  createdAt?: string;
}): RecoveryFileV1 => {
  const accountLocator = requireNonEmptyString(params.accountLocator, "account_locator");
  const recoveryPrivateJwk = validateJwkText(
    requireNonEmptyString(params.recoveryPrivateJwk, "recovery_private_jwk"),
  );
  const createdAt = params.createdAt ?? new Date().toISOString();

  const output: RecoveryFileV1 = {
    version: 1,
    account_locator: accountLocator,
    recovery_private_jwk: recoveryPrivateJwk,
    created_at: createdAt,
  };

  if (typeof params.recoveryPublicJwk === "string" && params.recoveryPublicJwk.trim()) {
    output.recovery_public_jwk = params.recoveryPublicJwk.trim();
  }

  return output;
};

export const stringifyRecoveryFile = (file: RecoveryFileV1) => `${JSON.stringify(file, null, 2)}\n`;

export const parseRecoveryFileText = (text: string): RecoveryImportResult => {
  const payload = parseJsonObject(text);
  const version = payload.version;

  if (version !== 1) {
    throw new Error("Recovery file version is not supported.");
  }

  const accountLocator = requireNonEmptyString(payload.account_locator, "account_locator");
  const recoveryPrivateJwk = validateJwkText(
    requireNonEmptyString(payload.recovery_private_jwk, "recovery_private_jwk"),
  );

  let recoveryPublicJwk: string | null = null;
  if (typeof payload.recovery_public_jwk === "string" && payload.recovery_public_jwk.trim()) {
    recoveryPublicJwk = payload.recovery_public_jwk.trim();
  }

  return {
    accountLocator,
    recoveryPrivateJwk,
    recoveryPublicJwk,
  };
};
