// src/store/authStore.ts
import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User as AppUser } from '../types';

interface AuthState {
  user: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setAppUser: (appUser: AppUser | null) => void;
  setLoading: (loading: boolean) => void;

  // Helpers
  isAdmin: () => boolean;
  isStaff: () => boolean;

  // Demo: elevate current session to staff without Firebase RBAC
  elevateToStaff: () => void;
  elevateToAdmin: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  appUser: null,
  loading: true,
  setUser: (user) => set({ user }),
  setAppUser: (appUser) => set({ appUser }),
  setLoading: (loading) => set({ loading }),

  isAdmin: () => get().appUser?.role === 'admin',
  isStaff: () =>
    get().appUser?.role === 'staff' || get().appUser?.role === 'admin',

  elevateToStaff: () => {
    const current = get().appUser
    if (current) {
      set({ appUser: { ...current, role: 'staff' } })
    } else {
      // No appUser yet — create a synthetic one
      set({
        appUser: {
          id: 'demo-staff',
          email: 'staff@venueflow.demo',
          displayName: 'Demo Staff',
          role: 'staff',
          createdAt: Date.now(),
        },
      })
    }
  },

  elevateToAdmin: () => {
    const current = get().appUser
    if (current) {
      set({ appUser: { ...current, role: 'admin' } })
    } else {
      set({
        appUser: {
          id: 'demo-admin',
          email: 'admin@venueflow.demo',
          displayName: 'Demo Admin',
          role: 'admin',
          createdAt: Date.now(),
        },
      })
    }
  },
}));
