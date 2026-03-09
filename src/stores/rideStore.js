import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultRideState = {
  activeRides: [],
  acceptedRides: [],
  hiddenRideIds: [],
  currentRideId: null,
  currentDriverId: null,
  currentDriverName: null,
  lastUpdated: null,
};

export const useRideStore = create(
  persist(
    (set) => ({
      ...defaultRideState,

      // Setters
      setCurrentRide: (rideId) =>
        set({
          currentRideId: rideId,
          lastUpdated: new Date().toISOString(),
        }),

      setCurrentDriver: (driverId, driverName) =>
        set({
          currentDriverId: driverId,
          currentDriverName: driverName,
          lastUpdated: new Date().toISOString(),
        }),

      // List Updates
      updateActiveRides: (rides) =>
        set({
          activeRides: rides,
          lastUpdated: new Date().toISOString(),
        }),

      updateAcceptedRides: (rides) =>
        set({
          acceptedRides: rides,
          lastUpdated: new Date().toISOString(),
        }),

      // Single Ride Updates
      updateRideStatus: (rideId, updates) =>
        set((state) => ({
          activeRides: state.activeRides.map((ride) =>
            ride.id === rideId ? { ...ride, ...updates } : ride
          ),
          acceptedRides: state.acceptedRides.map((ride) =>
            ride.id === rideId ? { ...ride, ...updates } : ride
          ),
          lastUpdated: new Date().toISOString(),
        })),

      // Hidden Rides
      hideRide: (rideId) =>
        set((state) => ({
          hiddenRideIds: [...state.hiddenRideIds, rideId],
          lastUpdated: new Date().toISOString(),
        })),

      clearHiddenRides: () =>
        set({
          hiddenRideIds: [],
          lastUpdated: new Date().toISOString(),
        }),

      // Reset
      resetRideState: () => set(defaultRideState),
    }),
    {
      name: 'ride-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
