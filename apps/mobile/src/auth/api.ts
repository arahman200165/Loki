const API_BASE_URL = "https://loki-0pfz.onrender.com/api";
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? "dev-mobile-api-key";
const API_KEY_HEADER_NAME = "x-api-key";

const buildHeaders = (includeJson = false, token?: string) => {
  const headers: Record<string, string> = {
    [API_KEY_HEADER_NAME]: API_KEY,
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const apiGet = async <T>(path: string, token?: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: buildHeaders(false, token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Request failed.");
  }
  return data as T;
};

export const apiPost = async <T>(path: string, body: object, token?: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(true, token),
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Request failed.");
  }
  return data as T;
};

export const apiPut = async <T>(path: string, body: object, token?: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: buildHeaders(true, token),
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Request failed.");
  }
  return data as T;
};

export const apiDelete = async <T>(path: string, token?: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: buildHeaders(false, token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Request failed.");
  }
  return data as T;
};

