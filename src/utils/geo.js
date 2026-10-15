/*
  Small geo helpers for the ride form and the driver cards. The server owns
  the real driving estimates (Google when it has a key); these local versions
  exist so something sensible shows instantly and when offline, and they use
  the same formula as the server's fallback so numbers don't jump.
*/

const ROAD_FACTOR = 1.3; // streets aren't straight lines
const AVG_SPEED_MPS = 11.2; // ~25 mph in town
const METERS_PER_MILE = 1609.344;

const toRad = (deg) => (deg * Math.PI) / 180;

export const haversineMeters = (a, b) => {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

export const isPoint = (p) =>
  p != null && Number.isFinite(p.lat) && Number.isFinite(p.lng);

export const localDriveEstimate = (origin, dest) => {
  if (!isPoint(origin) || !isPoint(dest)) return null;
  const distanceMeters = Math.round(haversineMeters(origin, dest) * ROAD_FACTOR);
  return {
    distanceMeters,
    durationSeconds: Math.round(distanceMeters / AVG_SPEED_MPS),
    source: 'ESTIMATE',
  };
};

export const formatMiles = (meters) => {
  if (!Number.isFinite(meters)) return '';
  const miles = meters / METERS_PER_MILE;
  if (miles < 0.1) return '<0.1 mi';
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
};

export const formatMinutes = (seconds) => {
  if (!Number.isFinite(seconds)) return '';
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};
