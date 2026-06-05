export const API_BASE_URL = "https://loki-0pfz.onrender.com/api";
export const API_VERSION = "v1";
export const API_KEY_HEADER = "x-api-key";

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
  token?: string | null
): Promise<{ ok: boolean; status: number; data: T }> => {
  const response = await fetch(`${API_BASE_URL}/${API_VERSION}${path}`, {
    method: "POST",
    headers: buildHeaders({ json: true, token }),
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as T;
  return { ok: response.ok, status: response.status, data };
};
