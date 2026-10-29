import { defineStore } from 'pinia';
import { api, refreshSession, setAccessToken } from '../api';
import type { AuthResponse, Role, SessionUser } from '../types';

interface AuthState {
  user: SessionUser | null;
  ready: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    ready: false,
  }),

  getters: {
    isAuthenticated: (state): boolean => state.user !== null,
    userRole: (state): Role | null => state.user?.role ?? null,
  },

  actions: {
    async login(email: string, password: string): Promise<Role> {
      const { data } = await api.post<AuthResponse>(
        '/auth/login',
        { email, password },
        { skipAuthRefresh: true },
      );
      setAccessToken(data.accessToken);
      this.user = data.user;
      this.ready = true;
      return data.user.role;
    },

    async restore(): Promise<void> {
      if (this.ready) {
        return;
      }
      try {
        const data = await refreshSession();
        this.user = data.user;
      } catch {
        this.user = null;
      } finally {
        this.ready = true;
      }
    },

    async logout(): Promise<void> {
      try {
        await api.post('/auth/logout', undefined, { skipAuthRefresh: true });
      } catch {}
      this.clearSession();
    },

    clearSession(): void {
      setAccessToken(null);
      this.user = null;
      this.ready = true;
    },
  },
});
