import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@apollo/client/react';
import { GET_DRIVE_ESTIMATE } from '../../graphql/queries';
import { useTheme } from '../../theme/ThemeContext';
import { formatMiles, formatMinutes, isPoint, localDriveEstimate } from '../../utils/geo';

/*
  Two lines a driver reads before accepting:
    ➤ 2.1 mi · 7 min to pickup     (from the driver's current position)
    ↗ 4.2 mi · 12 min trip         (pickup → dropoff, stored on the ride)
  "≈" marks a straight-line estimate rather than a Google driving time.
  Lines are omitted when the coordinates behind them don't exist.
*/

// ~100 m buckets so a moving driver doesn't fire a new query per GPS tick.
const bucket = (n) => Math.round(n * 1000) / 1000;

const useDriveEstimate = (origin, dest) => {
  const ready = isPoint(origin) && isPoint(dest);
  const { data } = useQuery(GET_DRIVE_ESTIMATE, {
    skip: !ready,
    variables: ready
      ? {
          originLat: bucket(origin.lat),
          originLng: bucket(origin.lng),
          destLat: bucket(dest.lat),
          destLng: bucket(dest.lng),
        }
      : undefined,
  });
  if (!ready) return null;
  return data?.getDriveEstimate || localDriveEstimate(origin, dest);
};

const Line = ({ icon, estimate, label, styles, colors }) => {
  if (!estimate) return null;
  const approx = estimate.source !== 'GOOGLE' ? '≈ ' : '';
  return (
    <View style={styles.line}>
      <Ionicons name={icon} size={14} color={colors.driver.light} />
      <Text style={styles.text}>
        <Text style={styles.strong}>{approx}{formatMiles(estimate.distanceMeters)}</Text>
        <Text style={styles.dim}> · </Text>
        <Text style={styles.strong}>{formatMinutes(estimate.durationSeconds)}</Text>
        <Text style={styles.dim}> {label}</Text>
      </Text>
    </View>
  );
};

const RideEstimates = ({ ride, driverPosition }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const pickup =
    ride?.pickUpLat != null && ride?.pickUpLng != null
      ? { lat: ride.pickUpLat, lng: ride.pickUpLng }
      : null;
  const dropoff =
    ride?.dropOffLat != null && ride?.dropOffLng != null
      ? { lat: ride.dropOffLat, lng: ride.dropOffLng }
      : null;

  const toPickup = useDriveEstimate(isPoint(driverPosition) ? driverPosition : null, pickup);
  const trip =
    ride?.tripDistanceMeters != null
      ? {
          distanceMeters: ride.tripDistanceMeters,
          durationSeconds: ride.tripDurationSeconds,
          source: ride.tripEstimateSource,
        }
      : localDriveEstimate(pickup, dropoff);

  if (!toPickup && !trip) return null;

  return (
    <View style={styles.box}>
      <Line icon="navigate-outline" estimate={toPickup} label="to pickup" styles={styles} colors={colors} />
      <Line icon="trending-up-outline" estimate={trip} label="trip" styles={styles} colors={colors} />
    </View>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
    box: {
      backgroundColor: colors.gray[100],
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginBottom: 8,
      gap: 4,
    },
    line: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    text: {
      fontSize: 13,
      color: colors.gray[700],
    },
    strong: {
      fontWeight: '700',
      color: colors.gray[900],
    },
    dim: {
      color: colors.gray[500],
    },
  });

export default RideEstimates;
