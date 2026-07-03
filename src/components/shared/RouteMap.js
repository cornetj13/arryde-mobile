import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors } from '../../theme/colors';

/**
 * Reusable map showing pickup + dropoff pins on a route.
 * Designed to be the same component used across FindRide preview, ConfirmRide
 * review, history details, and (later) driver-side ride request previews.
 *
 * Props:
 *  - pickup:  { lat, lng } | null
 *  - dropoff: { lat, lng } | null
 *  - height:  number — pixel height of the map (defaults to 220)
 *  - showLegend: boolean — render the small "Pickup / Dropoff" key
 *
 * Behavior:
 *  - Renders a placeholder card when no coordinates are set yet
 *  - When one coordinate is set, centers on it
 *  - When both are set, auto-fits the camera to both with padding
 */
const DEFAULT_REGION = {
  // Bellingham, WA — sensible fallback for an empty map.
  latitude: 48.7519,
  longitude: -122.4787,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const RouteMap = ({ pickup, dropoff, height = 220, showLegend = true }) => {
  const mapRef = useRef(null);

  const hasPickup = pickup?.lat != null && pickup?.lng != null;
  const hasDropoff = dropoff?.lat != null && dropoff?.lng != null;
  const hasAny = hasPickup || hasDropoff;

  // Auto-fit camera when coords change.
  useEffect(() => {
    if (!mapRef.current) return;
    const coords = [];
    if (hasPickup) coords.push({ latitude: pickup.lat, longitude: pickup.lng });
    if (hasDropoff) coords.push({ latitude: dropoff.lat, longitude: dropoff.lng });

    if (coords.length === 2) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    } else if (coords.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: coords[0].latitude,
          longitude: coords[0].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        400
      );
    }
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng, hasPickup, hasDropoff]);

  // The MapView ALWAYS renders — no conditional mount/unmount of the heavy
  // native component. Markers come and go inside it as coords change.
  // (Mounting a fresh MapView in the same tick that the autocomplete dropdown
  //  unmounts triggers `addViewAt: failed to insert view` on Android. Keeping
  //  the map stably mounted avoids that whole class of view-tree churn.)
  return (
    <View style={[styles.wrapper, { height }]}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        pointerEvents="none"
        // ^ Pure preview — don't capture pan/zoom gestures inside scrollable
        // parent views. Remove this if you ever need interactive maps.
      >
        {hasPickup ? (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            title="Pickup"
            pinColor={colors.rider.light}
          />
        ) : null}
        {hasDropoff ? (
          <Marker
            coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
            title="Dropoff"
            pinColor={colors.error.light}
          />
        ) : null}
      </MapView>

      {/* Hint overlay shown when there's nothing to look at yet. */}
      {!hasAny ? (
        <View style={styles.hintOverlay} pointerEvents="none">
          <Ionicons name="map-outline" size={28} color={colors.gray[600]} />
          <Text style={styles.hintText}>
            Pickup and dropoff will appear here
          </Text>
        </View>
      ) : null}

      {showLegend && hasAny ? (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.rider.light }]} />
            <Text style={styles.legendText}>Pickup</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error.light }]} />
            <Text style={styles.legendText}>Dropoff</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  hintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    color: colors.gray[700],
    fontSize: 13,
    fontWeight: '600',
  },
  legend: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[800],
  },
});

export default RouteMap;
