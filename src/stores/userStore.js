import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultUserState = {
  userId: null,
  userType: null,
  userName: null,
};

export const useUserStore = create(
  persist(
    (set) => ({
      ...defaultUserState,

      setUserId: (userId) => set({ userId }),
      setUserType: (userType) => set({ userType }),
      setUserName: (userName) => set({ userName }),

      resetUserState: () => set(defaultUserState),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
