import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useSubscription } from '@apollo/client/react';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { useUserStore, useRideStore } from '../../stores';
import { UPDATE_RIDE_STATUS, RESET_RIDER_RIDE_FLOW_STATUS } from '../../graphql/mutations';
import { RIDE_ACCEPTED, RIDE_CANCELED, RIDE_EXPIRED } from '../../graphql/subscriptions';
import Timer from '../../components/shared/Timer';
import BidBadge from '../../components/shared/BidBadge';
import InfoRow from '../../components/shared/InfoRow';

const WaitingForRideScreen = ({ navigation, route }) => {
  const ride = route.params?.ride;
  const userId = useUserStore((state) => state.userId);
  const setCurrentDriver = useRideStore((state) => state.setCurrentDriver);
  const resetRideState = useRideStore((state) => state.resetRideState);

  const [updateRideStatus, { loading: cancelLoading }] = useMutation(UPDATE_RIDE_STATUS);
  const [resetRiderFlow] = useMutation(RESET_RIDER_RIDE_FLOW_STATUS);

  // Listen for ride accepted
  useSubscription(RIDE_ACCEPTED, {
    onData: ({ data: subData }) => {
      const accepted = subData?.data?.rideAccepted;
      if (accepted && String(accepted.id) === String(ride?.id)) {
        setCurrentDriver(accepted.driverId, accepted.driverName);
        Toast.show({ type: 'success', text1: `${accepted.driverName} accepted your ride!` });
        navigation.reset({
          index: 0,
          routes: [
            { name: 'RiderTabs' },
            {
              name: 'PickupInfo',
              params: {
                ride: { ...ride, ...accepted, isAccepted: true, isRequested: false },
              },
            },
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

  // Listen for ride expired
  useSubscription(RIDE_EXPIRED, {
    onData: ({ data: subData }) => {
      const expired = subData?.data?.rideExpired;
      if (expired && String(expired.id) === String(ride?.id)) {
        navigation.reset({
          index: 0,
          routes: [
            { name: 'RiderTabs' },
            { name: 'RideExpired' },
          ],
        });
      }
    },
  });

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

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ride data not found</Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'RiderTabs' }] })}
          >
            <Text style={styles.homeButtonText}>Go Home</Text>
          </TouchableOpacity>
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
        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <ActivityIndicator size="small" color={colors.rider.dark} />
          <Text style={styles.statusText}>Searching for drivers...</Text>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Time Waiting</Text>
          <Timer startTime={ride.createdAt || new Date().toISOString()} />
        </View>

        {/* Bid Badge */}
        <BidBadge amount={ride.bidAmount} />

        {/* Ride Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ride Details</Text>
          <InfoRow label="Name" value={ride.riderName} />
          <InfoRow label="Phone" value={ride.phoneNumber} />
          <InfoRow label="Passengers" value={String(ride.passengers)} />
          <InfoRow label="Pickup Time" value={ride.pickUpTime} />
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Locations</Text>
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
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: 16,
  },
  homeButton: {
    backgroundColor: colors.rider.dark,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  homeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.rider.light + '15',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.rider.dark,
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
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
    marginTop: 8,
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

export default WaitingForRideScreen;
