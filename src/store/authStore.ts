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
}));
