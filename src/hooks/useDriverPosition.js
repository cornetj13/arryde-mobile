import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { useMutation } from '@apollo/client/react';
import { UPDATE_DRIVER_LOCATION } from '../graphql/mutations';

// While on duty with the app open: refresh (and publish) every 20 s. The
// web driver page publishes every 5 s from a continuous watch; phones are
// gentler on battery here and nobody needs sub-block precision for "how
// far is the pickup".
const POLL_MS = 20000;

/**
 * The driver's current position, for the "X mi · Y min to pickup" line on
 * each request/queue card. While on duty it is also sent to the server so a
 * rider's pickup screen can show the car approaching. Foreground only — no
 * background location, by design for the alpha.
 *
 * Returns { lat, lng } or null (permission denied, simulator, no fix yet).
 */
export const useDriverPosition = ({ userId, isOnDuty }) => {
  const [position, setPosition] = useState(null);
  const [updateDriverLocation] = useMutation(UPDATE_DRIVER_LOCATION);
  const permission = useRef(null); // null = not asked yet

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const tick = async () => {
      try {
        if (permission.current === null) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          permission.current = status === 'granted';
        }
        if (!permission.current || cancelled) return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(next);

        if (isOnDuty && userId) {
          updateDriverLocation({
            variables: { id: userId, latitude: next.lat, longitude: next.lng },
          }).catch(() => {
            // Publishing is best-effort; the local estimate still works.
          });
        }
      } catch {
        // No fix (indoors, simulator, web without permission) — keep the
        // last known position, or null.
      }
    };

    tick();
    if (isOnDuty) timer = setInterval(tick, POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      sub.remove();
    };
  }, [isOnDuty, userId, updateDriverLocation]);

  return position;
};
