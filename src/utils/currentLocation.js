import * as Location from 'expo-location';

/*
  "Use my current location" for the pickup field.

  Asks for foreground location permission (once; the OS remembers), reads a
  high-accuracy fix, and turns it into a street address with the platform's
  reverse geocoder (no API key, no network cost on-device). When no address
  comes back — web, or a spot with nothing nearby — the coordinates are
  shown so the driver still gets an exact pin.
*/

const formatPlace = (p) => {
  const street = [p.streetNumber, p.street].filter(Boolean).join(' ');
  const regionZip = [p.region, p.postalCode].filter(Boolean).join(' ');
  return [street || p.name, p.city, regionZip].filter(Boolean).join(', ');
};

/**
 * @returns {Promise<{ address: string, lat: number, lng: number } | { error: string }>}
 */
export const getCurrentAddress = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { error: 'Location permission was denied. Allow it in Settings and try again.' };
  }

  let pos;
  try {
    pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  } catch (err) {
    return { error: "Couldn't get a location fix. Try again in a moment." };
  }
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  let address = null;
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (place) address = formatPlace(place);
  } catch {
    // Reverse geocoding is best-effort; fall through to coordinates.
  }
  if (!address) address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  return { address, lat, lng };
};
