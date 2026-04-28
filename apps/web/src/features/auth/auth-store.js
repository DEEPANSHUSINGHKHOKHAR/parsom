import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: '',
      actor: null,

      setSession: (payload) => {
        set({
          token: payload?.token || '',
          actor: payload?.user || payload?.admin || null,
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
      name: 'parsom-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);