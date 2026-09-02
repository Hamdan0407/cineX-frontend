import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

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

export const api = axios.create({
  baseURL: API_BASE,
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

    if (status === 401) {
      onUnauthorized?.();
    } else if (status === 403 && message) {
      onForbidden?.(message);
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
