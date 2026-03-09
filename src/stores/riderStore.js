import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultRiderState = {
  allDrivers: [],
  availableDrivers: [],
  unavailableDrivers: [],
  favoriteDrivers: [],
  lastUpdated: {
    favoriteDrivers: null,
    availableDrivers: null,
    unavailableDrivers: null,
  },
};

export const useRiderStore = create(
  persist(
    (set, get) => ({
      ...defaultRiderState,

      // Favorite drivers
      setFavoriteDrivers: (drivers) =>
        set({
          favoriteDrivers: drivers,
          lastUpdated: {
            ...get().lastUpdated,
            favoriteDrivers: Date.now(),
          },
        }),

      addFavoriteDriver: (driver) => {
        const currentFavorites = get().favoriteDrivers;
        if (!currentFavorites.some((fav) => fav.id === driver.id)) {
          set({
            favoriteDrivers: [...currentFavorites, driver],
            lastUpdated: {
              ...get().lastUpdated,
              favoriteDrivers: Date.now(),
            },
          });
        }
      },

      removeFavoriteDriver: (driverId) =>
        set((state) => ({
          favoriteDrivers: state.favoriteDrivers.filter(
            (driver) => driver.id !== driverId
          ),
          lastUpdated: {
            ...state.lastUpdated,
            favoriteDrivers: Date.now(),
          },
        })),

      // Available/unavailable drivers
      setAvailableDrivers: (drivers) => set({ availableDrivers: drivers }),
      setUnavailableDrivers: (drivers) => set({ unavailableDrivers: drivers }),
      setAllDrivers: (drivers) => set({ allDrivers: drivers }),

      // Reset
      resetRiderState: () => set(defaultRiderState),
    }),
    {
      name: 'rider-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
