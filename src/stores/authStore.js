import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultAuthState = {
  accessToken: null,
  isAuth: false,
};

export const useAuthStore = create(
  persist(
    (set) => ({
      ...defaultAuthState,

      setAccessToken: (accessToken) => set({ accessToken }),
      setIsAuth: (isAuth) => set({ isAuth }),

      resetAuthState: () => set(defaultAuthState),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
