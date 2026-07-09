import Constants from "expo-constants";
import { Platform } from "react-native";

export const API_VERSION = "v1";
export const API_KEY_HEADER = "x-api-key";

const REMOTE_API_BASE_URL = "https://loki-0pfz.onrender.com/api";
const LOCAL_API_PORT = "4000";

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getExpoHostUri = (): string | null => {
  const constantsWithManifest = Constants as typeof Constants & {
    manifest2?: {
      extra?: {
        expoClient?: {
          hostUri?: string;
        };
      };
    };
  };

  return (
    Constants.expoConfig?.hostUri ??
    constantsWithManifest.manifest2?.extra?.expoClient?.hostUri ??
    null
  );
};

const getDefaultDevApiBaseUrl = (): string | null => {
  const hostUri = getExpoHostUri();
  if (!hostUri) return null;

  const [rawHost] = hostUri.split(":");
  if (!rawHost) return null;

  const host =
    Platform.OS === "android" && ["localhost", "127.0.0.1"].includes(rawHost)
      ? "10.0.2.2"
      : rawHost;

  return `http://${host}:${LOCAL_API_PORT}/api`;
};

const getApiBaseUrl = () => {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configuredBaseUrl) return stripTrailingSlash(configuredBaseUrl);

  if (__DEV__) {
    const localBaseUrl = getDefaultDevApiBaseUrl();
    if (localBaseUrl) return localBaseUrl;
  }

  return REMOTE_API_BASE_URL;
};

export const API_BASE_URL = getApiBaseUrl();

const getApiKey = () => process.env.EXPO_PUBLIC_API_KEY ?? "dev-mobile-api-key";

export const buildHeaders = (options: {
  json?: boolean;
  token?: string | null;
} = {}): Record<string, string> => {
  const headers: Record<string, string> = {
    [API_KEY_HEADER]: getApiKey(),
  };
  if (options.json) headers["Content-Type"] = "application/json";
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;
  return headers;
};

export const apiPost = async <T>(
  path: string,
  body: unknown,
  token?: string | null,
  options?: { idempotencyKey?: string }
): Promise<{ ok: boolean; status: number; data: T }> => {
  const headers = buildHeaders({ json: true, token });
  if (options?.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  const response = await fetch(`${API_BASE_URL}/${API_VERSION}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T;
  return { ok: response.ok, status: response.status, data };
};

export const apiGet = async <T>(
  path: string,
  token?: string | null
): Promise<{ ok: boolean; status: number; data: T }> => {
  const response = await fetch(`${API_BASE_URL}/${API_VERSION}${path}`, {
    method: "GET",
    headers: buildHeaders({ token }),
  });
  const data = (await response.json()) as T;
  return { ok: response.ok, status: response.status, data };
};
