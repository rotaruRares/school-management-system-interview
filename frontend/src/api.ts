import axios, { type AxiosError } from 'axios';
import type { ApiErrorBody, AuthResponse } from './types';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
    retried?: boolean;
  }
}

const baseURL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api`;

export const api = axios.create({ baseURL, withCredentials: true });

let accessToken: string | null = null;
let sessionLostHandler: (() => void) | null = null;
let refreshing: Promise<AuthResponse> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setSessionLostHandler(handler: () => void): void {
  sessionLostHandler = handler;
}

export function refreshSession(): Promise<AuthResponse> {
  if (!refreshing) {
    refreshing = api
      .post<AuthResponse>('/auth/refresh', undefined, { skipAuthRefresh: true })
      .then((response) => {
        accessToken = response.data.accessToken;
        return response.data;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.request.use((config) => {
  if (accessToken && !config.skipAuthRefresh) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const config = error.config;
    if (error.response?.status === 401 && config && !config.skipAuthRefresh && !config.retried) {
      config.retried = true;
      try {
        await refreshSession();
      } catch {
        accessToken = null;
        sessionLostHandler?.();
        return Promise.reject(error);
      }
      return api.request(config);
    }
    return Promise.reject(error);
  },
);
