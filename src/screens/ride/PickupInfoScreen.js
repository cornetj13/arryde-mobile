import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useSubscription, useLazyQuery } from '@apollo/client/react';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { useUserStore, useRideStore } from '../../stores';
import { UPDATE_RIDE_STATUS, RESET_RIDER_RIDE_FLOW_STATUS } from '../../graphql/mutations';
import { GET_SINGLE_DRIVER, GET_SINGLE_RIDE } from '../../graphql/queries';
import {
  RIDE_COMPLETED,
  RIDE_CANCELED,
  DRIVER_AVAILABILITY_UPDATES,
} from '../../graphql/subscriptions';
import Timer from '../../components/shared/Timer';
import { secondsToTimeString } from '../../utils/formatting';

const PickupInfoScreen = ({ navigation, route }) => {
  const ride = route.params?.ride;
  const userId = useUserStore((state) => state.userId);
  const resetRideState = useRideStore((state) => state.resetRideState);

  const [driverQueue, setDriverQueue] = useState(0);
  const [driverAvailableAt, setDriverAvailableAt] = useState(null);
  // 1 = you're next. Comes from the ride itself (ordered by acceptance).
  const [queuePosition, setQueuePosition] = useState(ride?.queuePosition ?? null);

  const [updateRideStatus, { loading: cancelLoading }] = useMutation(UPDATE_RIDE_STATUS);
  const [resetRiderFlow] = useMutation(RESET_RIDER_RIDE_FLOW_STATUS);
  const [fetchRide] = useLazyQuery(GET_SINGLE_RIDE, { fetchPolicy: 'network-only' });

  // Subscriptions silently miss events while the app is backgrounded — a
  // driver completing/canceling while the rider's phone was locked would
  // leave this screen stale. Re-check the ride's status on focus and on
  // return to foreground.
  const syncRideStatus = useCallback(async () => {
    if (!ride?.id) return;
    try {
      const { data } = await fetchRide({ variables: { id: ride.id } });
      const current = data?.getRide;
      if (!current) return;
      setQueuePosition(current.queuePosition ?? null);

      if (current.isCompleted) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'RiderTabs' }, { name: 'RideCompleted' }],
        });
      } else if (current.isCanceled) {
        navigation.reset({
          index: 0,
          routes: [
            { name: 'RiderTabs' },
            {
              name: 'RideCanceled',
              params: {
                ride: { ...ride, ...current },
                canceledBy: current.canceledBy,
              },
            },
          ],
        });
      }
    } catch (err) {
      // Keep showing pickup info — subscriptions remain the primary signal.
    }
  }, [ride?.id]);

  useFocusEffect(
    useCallback(() => {
      syncRideStatus();

      // Safety net: with the app in the FOREGROUND, neither the focus nor
      // the AppState check fires again, so a dropped socket would strand the
      // rider on this screen indefinitely (exactly what happened in
      // testing). Poll while the screen is focused so a missed
      // completion/cancellation surfaces within ~15s regardless.
      const id = setInterval(syncRideStatus, 15000);
      return () => clearInterval(id);
    }, [syncRideStatus])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncRideStatus();
    });
    return () => sub.remove();
  }, [syncRideStatus]);

  // Fetch driver info
  const { data: driverData } = useQuery(GET_SINGLE_DRIVER, {
    variables: { id: ride?.driverId },
    skip: !ride?.driverId,
  });

  useEffect(() => {
    if (driverData?.getDriver) {
      setDriverQueue(driverData.getDriver.riderQueue || 0);
      setDriverAvailableAt(driverData.getDriver.driverNextAvailableAt);
    }
  }, [driverData]);

  // Listen for driver availability updates
  useSubscription(DRIVER_AVAILABILITY_UPDATES, {
    onData: ({ data: subData }) => {
      const update = subData?.data?.driverAvailabilityUpdates;
      if (update && String(update.id) === String(ride?.driverId)) {
        setDriverQueue(update.riderQueue);
        setDriverAvailableAt(update.driverNextAvailableAt);
        // Someone ahead finished or joined — re-read our place in line.
        syncRideStatus();
      }
    },
  });

  // Listen for ride completed
  useSubscription(RIDE_COMPLETED, {
    onData: ({ data: subData }) => {
      const completed = subData?.data?.rideCompleted;
      if (completed && String(completed.id) === String(ride?.id)) {
        Toast.show({ type: 'success', text1: 'Ride completed! Thank you!' });
        navigation.reset({
          index: 0,
          routes: [
            { name: 'RiderTabs' },
            { name: 'RideCompleted' },
          ],
        });
      }
    },
  });

  // Listen for ride canceled
  useSubscription(RIDE_CANCELED, {
    onData: ({ data: subData }) => {
      const canceled = subData?.data?.rideCanceled;
      if (canceled?.ride && String(canceled.ride.id) === String(ride?.id)) {
        navigation.reset({
          index: 0,
          routes: [
            { name: 'RiderTabs' },
            {
              name: 'RideCanceled',
              params: {
                ride: { ...ride, ...canceled.ride },
                canceledBy: canceled.canceledBy,
              },
            },
          ],
        });
      }
    },
  });

  const driver = driverData?.getDriver;

  const handleCallDriver = () => {
    if (driver?.phoneNumber) {
      const phoneUrl = `tel:${driver.phoneNumber.replace(/\D/g, '')}`;
      Linking.openURL(phoneUrl).catch(() => {
        Toast.show({ type: 'error', text1: 'Unable to make call' });
      });
    }
  };

  const handleCancel = async () => {
    try {
      await updateRideStatus({
        variables: {
          id: ride.id,
          isRequested: false,
          isAccepted: false,
          isCanceled: true,
          isCompleted: false,
          isExpired: false,
          canceledBy: 'RIDER',
        },
      });
      resetRideState();
      navigation.reset({
        index: 0,
        routes: [
          { name: 'RiderTabs' },
          {
            name: 'RideCanceled',
            params: { ride, canceledBy: 'RIDER' },
          },
        ],
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to cancel ride' });
    }
  };

  const getAvailabilityText = () => {
    // `driverNextAvailableAt` is a Long (ms timestamp), not seconds.
    if (!driverAvailableAt) return 'Now';
    const diffMs = driverAvailableAt - Date.now();
    if (diffMs <= 0) return 'Now';
    return '~' + secondsToTimeString(Math.floor(diffMs / 1000));
  };

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.gray[500], fontSize: 16 }}>Ride data not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Driver Profile */}
        <View style={styles.driverSection}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitial}>
              {ride.driverName?.charAt(0)?.toUpperCase() || 'D'}
            </Text>
          </View>
          <Text style={styles.driverName}>{ride.driverName}</Text>
          <Text style={styles.pickupMessage}>Will be picking you up soon!</Text>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Time Elapsed</Text>
          <Timer startTime={ride.createdAt || new Date().toISOString()} />
        </View>

        {/* Queue & Availability */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {queuePosition == null
                ? '—'
                : queuePosition === 1
                  ? "You're next"
                  : `${queuePosition - 1} ahead`}
            </Text>
            <Text style={styles.statLabel}>Your Place in Line</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{getAvailabilityText()}</Text>
            <Text style={styles.statLabel}>Available In</Text>
          </View>
        </View>

        {/* Call Driver Button */}
        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCallDriver}
          disabled={!driver?.phoneNumber}
        >
          <Ionicons name="call" size={20} color={colors.white} />
          <Text style={styles.callButtonText}>Call Driver</Text>
        </TouchableOpacity>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.locationItem}>
            <View style={styles.locationTimeline}>
              <View style={[styles.locationDot, { backgroundColor: colors.rider.light }]} />
              <View style={styles.locationLine} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pick Up</Text>
              <Text style={styles.locationAddress}>{ride.pickUp}</Text>
            </View>
          </View>
          <View style={styles.locationItem}>
            <View style={styles.locationTimeline}>
              <View style={[styles.locationDot, { backgroundColor: colors.error.light }]} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Drop Off</Text>
              <Text style={styles.locationAddress}>{ride.dropOff}</Text>
            </View>
          </View>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={[styles.cancelButton, cancelLoading && styles.buttonDisabled]}
          onPress={handleCancel}
          disabled={cancelLoading}
        >
          {cancelLoading ? (
            <ActivityIndicator color={colors.error.dark} />
          ) : (
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    padding: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  driverAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.driver.light + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: colors.driver.dark,
  },
  driverInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.driver.dark,
  },
  driverName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  pickupMessage: {
    fontSize: 15,
    color: colors.rider.dark,
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.driver.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '500',
  },
  callButton: {
    backgroundColor: colors.rider.dark,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  callButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  locationItem: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  locationTimeline: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.gray[300],
    marginTop: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 15,
    color: colors.gray[900],
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: colors.error.light,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: colors.error.dark,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PickupInfoScreen;
