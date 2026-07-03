import { useEffect, useRef } from 'react';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { useMutation } from '@apollo/client/react';
import { useAuthStore, useUserStore } from '../stores';
import {
  REGISTER_RIDER_PUSH_TOKEN,
  REGISTER_DRIVER_PUSH_TOKEN,
} from '../graphql/mutations';
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

/**
 * Translate a notification tap into a navigation action.
 * Push payloads from the backend:
 *   - { action: 'REQUEST_RIDE', driverId, driverName }   (rider-side: favorite went on duty)
 *   - { action: 'NEW_RIDE_REQUEST', rideId, riderName }  (driver-side: a new request is in)
 * For other actions in the future, branch off here.
 */
const handleNotificationTap = (response) => {
  try {
    const data = response?.notification?.request?.content?.data;
    if (!data || !navigationRef.isReady()) return;

    if (data.action === 'REQUEST_RIDE' && data.driverId) {
      // Rider tapping a "your favorite is on duty" push → straight into the
      // ride request form with that driver pre-selected.
      navigationRef.navigate('FindRide', {
        prefillRide: { requestedDriverIds: [String(data.driverId)] },
      });
    } else if (data.action === 'NEW_RIDE_REQUEST') {
      // Driver tapping a "new ride request" push → jump to the driver home,
      // which defaults to the Requests tab so the new request is visible.
      navigationRef.navigate('DriverTabs', { screen: 'DriverHome' });
    }
  } catch {
    // Defensive: a malformed payload should never crash the app.
  }
};

const RootNavigator = () => {
  const isAuth = useAuthStore((state) => state.isAuth);
  const userType = useUserStore((state) => state.userType);
  const userId = useUserStore((state) => state.userId);

  const [registerRiderToken] = useMutation(REGISTER_RIDER_PUSH_TOKEN);
  const [registerDriverToken] = useMutation(REGISTER_DRIVER_PUSH_TOKEN);

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
