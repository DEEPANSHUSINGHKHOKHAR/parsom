import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      token: '',
      actor: null,

      setSession: (payload) => {
        set({
          token: payload?.token || '',
          actor: payload?.admin || payload?.user || null,
        });
      },

      setActor: (actor) => {
        set({ actor });
      },

      clearSession: () => {
        set({
          token: '',
          actor: null,
        });
      },

      isAuthenticated: () => Boolean(get().token),
    }),
    {
      name: 'parsom-admin-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);