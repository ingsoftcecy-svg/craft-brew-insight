import { create } from 'zustand';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  init: () => import('firebase/auth').Unsubscribe;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  init: () => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      });
    });
    
    // Return unsubscribe for cleanup if needed
    return unsubscribe;
  },
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Error signing out', error);
    }
  }
}));
