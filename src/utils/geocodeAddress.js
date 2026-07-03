/**
 * Geocode a plain-text address string to lat/lng using Google Places API (New)
 * Text Search. One HTTP request, no native deps.
 *
 * Returns `{ address, lat, lng }` on success — `address` is the canonicalized
 * form returned by Google (often more complete than what was passed in).
 * Returns `null` on any failure (no key, no result, network error). Callers
 * should fall back to displaying the user's typed text without a map pin.
 *
 * Notes:
 *  - Uses Bellingham as default locationBias (same as the autocomplete).
 *  - Capped at maxResultCount: 1 — we only want the best match.
 *  - Cheap relative to autocomplete: one request per quick-pick, not per
 *    keystroke.
 */
const DEFAULT_BIAS = { lat: 48.7519, lng: -122.4787 }; // Bellingham, WA
const BIAS_RADIUS_M = 50000;

export const geocodeAddress = async (address, options = {}) => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  if (!apiKey || !address || !address.trim()) return null;

  const bias = options.locationBias || DEFAULT_BIAS;

  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.location,places.formattedAddress,places.displayName',
        },
        body: JSON.stringify({
          textQuery: address,
          locationBias: {
            circle: {
              center: { latitude: bias.lat, longitude: bias.lng },
              radius: BIAS_RADIUS_M,
            },
          },
          maxResultCount: 1,
        }),
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const place = json.places?.[0];
    if (!place?.location) return null;

    return {
      address: place.formattedAddress || place.displayName?.text || address,
      lat: place.location.latitude,
      lng: place.location.longitude,
    };
  } catch {
    return null;
  }
};
