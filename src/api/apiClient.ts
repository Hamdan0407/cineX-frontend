import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

/**
 * A localhost API URL is valid only during local development. If it is baked
 * into a deployed bundle, use the existing same-origin Nginx proxy instead.
 */
export function getApiBaseUrl(
  configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "",
  hostname = typeof window === "undefined" ? "" : window.location.hostname,
): string {
  const baseUrl = configuredBaseUrl.trim().replace(/\/$/, "");
  if (!baseUrl || !hostname) return baseUrl;

  try {
    const apiHost = new URL(baseUrl).hostname;
    const isLocalApi = apiHost === "localhost" || apiHost === "127.0.0.1" || apiHost === "::1";
    const isLocalBrowser = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
    return isLocalApi && !isLocalBrowser ? "" : baseUrl;
  } catch {
    return baseUrl;
  }
}

const API_BASE = getApiBaseUrl();
const API_REQUEST_TIMEOUT_MS = 30_000;

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;
let onUnauthorized: (() => void) | null = null;
let onForbidden: ((message: string) => void) | null = null;

export function configureApiAuth(options: {
  getToken: TokenGetter;
  onUnauthorized?: () => void;
  onForbidden?: (message: string) => void;
}) {
  tokenGetter = options.getToken;
  onUnauthorized = options.onUnauthorized ?? null;
  onForbidden = options.onForbidden ?? null;
}

export function clearApiAuth() {
  tokenGetter = null;
  onUnauthorized = null;
  onForbidden = null;
}

export const api = axios.create({
  baseURL: API_BASE,
  // Surface the existing error UI instead of loading indefinitely when the API is unavailable.
  timeout: API_REQUEST_TIMEOUT_MS,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (config.skipAuth || !tokenGetter) {
    return config;
  }

  try {
    const token = await tokenGetter();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Clerk session not ready; public endpoints may still proceed without a token.
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const skipAuth = error.config?.skipAuth === true;

    // Public endpoints opt out of global auth side-effects (e.g. "Session expired" toast).
    if (!skipAuth) {
      if (status === 401) {
        onUnauthorized?.();
      } else if (status === 403 && message) {
        onForbidden?.(message);
      }
    }

    return Promise.reject(error);
  }
);

export async function downloadAuthenticatedFile(path: string, filename: string): Promise<void> {
  const response = await api.get(path, { responseType: "blob" });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function fetchAuthenticatedBlobUrl(path: string): Promise<string> {
  const response = await api.get(path, { responseType: "blob" });
  return window.URL.createObjectURL(response.data);
}

export function getApiErrorMessage(error: unknown, fallback = "Request failed"): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
}
