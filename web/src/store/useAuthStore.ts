import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export type PortalUserRole = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: PortalUserRole;
  mustChangePassword?: boolean;
  schoolId?: string;
  schoolName?: string;
  npsn?: string;
  class?: string;
  nisn?: string;
  nuptk?: string;
}

export type ActiveApp = 'gaspa' | 'edulock';

interface AuthState {
  user: PortalUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  _hasHydrated: boolean;
  activeApp: ActiveApp;
  setUser: (user: PortalUser | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: PortalUser) => void;
  logout: () => Promise<void>;
  clearLocalAuth: () => void;
  updateUser: (patch: Partial<PortalUser>) => void;
  setActiveApp: (app: ActiveApp) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: true,
      _hasHydrated: false,
      activeApp: 'gaspa',
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (loading) => set({ loading }),
      login: (user) => set({ user, isAuthenticated: true }),
      logout: async () => {
        try {
          await signOut(auth);
        } catch (e) {
          console.error("Logout error", e);
        }
        set({ user: null, isAuthenticated: false, activeApp: 'gaspa' });
      },
      clearLocalAuth: () => set({ user: null, isAuthenticated: false, activeApp: 'gaspa' }),
      updateUser: (patch) =>
        set((state) => {
          if (!state.user) return state;
          return { user: { ...state.user, ...patch } };
        }),
      setActiveApp: (app) => set({ activeApp: app }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
