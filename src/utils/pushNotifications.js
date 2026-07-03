import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Helpers around expo-notifications:
 *
 *  - requestPushPermissionsAndGetToken: ask the OS for permission, return the
 *    device's Expo push token string (or null on denial / not-a-device / error).
 *
 *  - setupNotificationHandling: configure foreground display behavior.
 *    Call once at app start.
 *
 *  - addNotificationTapListener: register a callback that fires when the user
 *    taps a notification (in any app state). Returns an unsubscribe function.
 *    Use it to deep-link to the right screen based on `notification.data`.
 */

// How notifications behave when received with the app in the foreground.
// Default: show as banner with sound. Without this, foreground pushes are
// silent and only visible if the screen is listening for them.
export const setupNotificationHandling = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

export const requestPushPermissionsAndGetToken = async () => {
  // Push notifications don't work on simulators/emulators or web — bail early.
  if (!Device.isDevice) return null;
  if (Platform.OS === 'web') return null;

  try {
    // Android needs a channel before any notifications display.
    // NOTE: we deliberately omit `sound` — passing the literal string
    // 'default' makes expo-notifications look for a custom sound file
    // named 'default' in the plugin sounds array and crash when it can't
    // find one. Omitting the field uses the OS default notification sound.
    if (Platform.OS === 'android') {
      // Delete first to clear any prior mis-configured 'default' channel.
      // Channels persist across app updates and can't be modified in place,
      // so a fresh delete+create is the only way to override a bad config.
      await Notifications.deleteNotificationChannelAsync('default').catch(() => {});
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#4EA701',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    // EAS projectId is required for Expo push token in dev builds.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn(
        '[pushNotifications] No EAS projectId found; cannot get Expo push token.'
      );
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData?.data || null;
  } catch (err) {
    console.warn('[pushNotifications] Failed to get token:', err?.message);
    return null;
  }
};

/**
 * Register a tap-response listener. Returns an unsubscribe function — call it
 * on unmount/cleanup. Fires for taps that opened the app from background OR
 * killed state, AND for taps while the app is already open.
 */
export const addNotificationTapListener = (callback) => {
  const sub = Notifications.addNotificationResponseReceivedListener(callback);
  return () => sub.remove();
};

/**
 * If the app was opened FROM a notification (cold start from killed state),
 * `getLastNotificationResponseAsync` returns it. Use this on startup to
 * handle the deep-link case where no listener was registered in time.
 */
export const getInitialNotificationResponse = async () => {
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch {
    return null;
  }
};
