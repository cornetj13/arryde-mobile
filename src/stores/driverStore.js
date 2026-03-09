import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultDriverState = {
  isOnDuty: false,
  dutyLastUpdated: null,
  nextAvailableAt: null,
  availabilityLastUpdated: null,
  riderQueue: 0,
};

export const useDriverStore = create(
  persist(
    (set, get) => ({
      ...defaultDriverState,

      // Driver duty status
      getDriverDutyStatus: () => ({
        isOnDuty: get().isOnDuty,
        lastUpdated: get().dutyLastUpdated,
      }),

      updateDriverDutyStatus: (isOnDuty) =>
        set({
          isOnDuty,
          dutyLastUpdated: new Date().toISOString(),
        }),

      // Driver availability
      getDriverAvailability: () => ({
        time: get().nextAvailableAt,
        lastUpdated: get().availabilityLastUpdated,
      }),

      updateDriverAvailability: (time) =>
        set({
          nextAvailableAt: time,
          availabilityLastUpdated: new Date().toISOString(),
        }),

      // Driver rider queue
      getDriverRiderQueue: () => ({
        riderQueue: get().riderQueue,
      }),

      updateDriverRiderQueue: (queueCount) =>
        set({ riderQueue: queueCount }),

      adjustDriverRiderQueue: (adjustment) =>
        set((state) => ({
          riderQueue: Math.max(0, state.riderQueue + adjustment),
        })),

      // Reset
      resetDriverState: () => set(defaultDriverState),
    }),
    {
      name: 'driver-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
