import { useEffect, useRef } from 'react';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { useMutation, useApolloClient } from '@apollo/client/react';
import { useAuthStore, useUserStore, useRideStore } from '../stores';
import {
  REGISTER_RIDER_PUSH_TOKEN,
  REGISTER_DRIVER_PUSH_TOKEN,
} from '../graphql/mutations';
import { GET_SINGLE_RIDE } from '../graphql/queries';
import {
  setupNotificationHandling,
  requestPushPermissionsAndGetToken,
  addNotificationTapListener,
  getInitialNotificationResponse,
} from '../utils/pushNotifications';
import AuthStack from './AuthStack';
import RiderNavigator from './RiderNavigator';
import DriverNavigator from './DriverNavigator';

// Configure foreground notification behavior once at module load.
setupNotificationHandling();

// Single navigation ref so push-tap handlers (which live outside React's
// render tree) can navigate without needing access to a component's
// `navigation` prop.
const navigationRef = createNavigationContainerRef();

// The Apollo client, published by RootNavigator once it exists, so the tap
// handler can fetch a ride before deciding where to land.
let apolloClient = null;

// Backend push payloads that all mean "open this ride".
const RIDE_ACTIONS = new Set([
  'RIDE_ACCEPTED',
  'RIDE_COMPLETED',
  'RIDE_CANCELED',
  'RIDE_EXPIRED',
]);

/**
 * Land a rider on the screen that matches a ride's CURRENT state — not the
 * state the notification described. A "driver accepted" push tapped an hour
 * later, after the ride was completed, must open the completed screen, not
 * pickup info. The ride is fetched fresh so the params carry a full ride
 * object, exactly like the in-app transitions pass.
 */
const openRiderRide = async (rideId) => {
  const home = { name: 'RiderTabs' };
  const land = (routes) =>
    navigationRef.reset({ index: routes.length - 1, routes });

  try {
    const { data } = await apolloClient.query({
      query: GET_SINGLE_RIDE,
      variables: { id: rideId },
      fetchPolicy: 'network-only',
    });
    const ride = data?.getRide;
    if (!ride) return land([home]);

    if (ride.isCompleted) return land([home, { name: 'RideCompleted' }]);
    if (ride.isCanceled) {
      return land([
        home,
        { name: 'RideCanceled', params: { ride, canceledBy: ride.canceledBy } },
      ]);
    }
    if (ride.isExpired) return land([home, { name: 'RideExpired' }]);

    const { setCurrentRide, setCurrentDriver } = useRideStore.getState();
    setCurrentRide(ride.id);
    if (ride.isAccepted) {
      setCurrentDriver(ride.driverId, ride.driverName);
      return land([home, { name: 'PickupInfo', params: { ride } }]);
    }
    return land([home, { name: 'WaitingForRide', params: { ride } }]);
  } catch {
    // Offline or the ride is gone — home is always a safe landing.
    land([home]);
  }
};

/**
 * Translate a notification tap into a navigation action.
 * Push payloads from the backend:
 *   - { action: 'REQUEST_RIDE', driverId, driverName }   (rider: favorite went on duty)
 *   - { action: 'NEW_RIDE_REQUEST', rideId, riderName }  (driver: a new request is in)
 *   - { action: 'RIDE_ACCEPTED' | 'RIDE_COMPLETED' | 'RIDE_CANCELED' | 'RIDE_EXPIRED',
 *       rideId, canceledBy? }                            (rider: their ride moved;
 *                                                         driver: their rider canceled)
 */
const handleNotificationTap = (response) => {
  try {
    const data = response?.notification?.request?.content?.data;
    if (!data || !navigationRef.isReady()) return;

    // Only follow a push into a flow the signed-in role actually has. A
    // stale rider push tapped while logged in as a driver (or vice versa)
    // would otherwise target a screen that isn't in the current navigator.
    const { isAuth } = useAuthStore.getState();
    const { userType } = useUserStore.getState();
    if (!isAuth) return;

    if (data.action === 'REQUEST_RIDE' && data.driverId) {
      if (userType !== 'rider') return;
      // Rider tapping a "your favorite is on duty" push → straight into the
      // ride request form with that driver pre-selected.
      navigationRef.navigate('FindRide', {
        prefillRide: { requestedDriverIds: [String(data.driverId)] },
      });
    } else if (data.action === 'NEW_RIDE_REQUEST') {
      if (userType !== 'driver') return;
      // Driver tapping a "new ride request" push → jump to the driver home,
      // which defaults to the Requests tab so the new request is visible.
      navigationRef.navigate('DriverTabs', { screen: 'DriverHome' });
    } else if (RIDE_ACTIONS.has(data.action) && data.rideId) {
      if (userType === 'rider') {
        if (!apolloClient) return;
        openRiderRide(data.rideId);
      } else if (userType === 'driver') {
        // "Your rider canceled" → the queue on the driver home is already
        // updated by the time they look.
        navigationRef.navigate('DriverTabs', { screen: 'DriverHome' });
      }
    }
  } catch {
    // Defensive: a malformed payload should never crash the app.
  }
};

const RootNavigator = () => {
  const isAuth = useAuthStore((state) => state.isAuth);
  const userType = useUserStore((state) => state.userType);
  const userId = useUserStore((state) => state.userId);
  const client = useApolloClient();

  const [registerRiderToken] = useMutation(REGISTER_RIDER_PUSH_TOKEN);
  const [registerDriverToken] = useMutation(REGISTER_DRIVER_PUSH_TOKEN);

  // Expose the client to the module-level tap handler.
  useEffect(() => {
    apolloClient = client;
  }, [client]);

  // Whenever a user becomes authenticated (fresh login OR auto-login on app
  // launch via a valid refresh token), register the device's Expo push token
  // against their account. Idempotent — backend overwrites on each call.
  // Routes to the right mutation based on userType so riders/drivers each
  // get pushes for the events that matter to them.
  useEffect(() => {
    if (!isAuth || !userId || !userType) return;
    let canceled = false;
    (async () => {
      const token = await requestPushPermissionsAndGetToken();
      if (canceled || !token) return;
      try {
        if (userType === 'rider') {
          await registerRiderToken({
            variables: { riderId: userId, expoPushToken: token },
          });
        } else if (userType === 'driver') {
          await registerDriverToken({
            variables: { driverId: userId, expoPushToken: token },
          });
        }
      } catch {
        // Non-fatal — a transient registration failure shouldn't surface to
        // the user. The next login attempt will try again.
      }
    })();
    return () => {
      canceled = true;
    };
  }, [isAuth, userType, userId, registerRiderToken, registerDriverToken]);

  // Active tap listener for the lifetime of the app session (foreground +
  // background taps).
  useEffect(() => {
    const unsubscribe = addNotificationTapListener(handleNotificationTap);
    return unsubscribe;
  }, []);

  // Cold-start case: app was launched from killed state via a notification
  // tap. Defer slightly so NavigationContainer is fully ready first.
  const handledColdStart = useRef(false);
  useEffect(() => {
    if (handledColdStart.current) return;
    handledColdStart.current = true;
    (async () => {
      const initial = await getInitialNotificationResponse();
      if (initial) {
        setTimeout(() => handleNotificationTap(initial), 300);
      }
    })();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      {!isAuth ? (
        <AuthStack />
      ) : userType === 'driver' ? (
        <DriverNavigator />
      ) : (
        <RiderNavigator />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;
