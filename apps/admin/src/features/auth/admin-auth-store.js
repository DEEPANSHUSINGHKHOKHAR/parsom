import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      actor: null,

      setSession: (payload) => {
        set({
          isAuthenticated: Boolean(payload?.admin || payload?.user),
          actor: payload?.admin || payload?.user || null,
        });
      },

      setActor: (actor) => {
        set({ actor, isAuthenticated: Boolean(actor) });
      },

      clearSession: () => {
        set({
          isAuthenticated: false,
          actor: null,
        });
      },

      hasSession: () => Boolean(get().isAuthenticated),
    }),
    {
      name: 'parsom-admin-auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
