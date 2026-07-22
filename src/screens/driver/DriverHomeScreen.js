import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useSubscription } from '@apollo/client/react';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { useAuthStore, useUserStore, useDriverStore, useRideStore } from '../../stores';
import {
  LOGOUT_DRIVER,
  UPDATE_DRIVER_IS_ON_DUTY,
  UPDATE_RIDE_STATUS,
  UPDATE_DRIVER_NEXT_AVAILABLE_AT,
} from '../../graphql/mutations';
import { GET_ACTIVE_RIDES, GET_ACCEPTED_RIDES, GET_SINGLE_DRIVER } from '../../graphql/queries';
import {
  RIDE_CREATED,
  RIDE_CANCELED,
  RIDE_COMPLETED,
  RIDE_EXPIRED,
  DRIVER_DUTY_STATUS_UPDATES,
  DRIVER_AVAILABILITY_UPDATES,
} from '../../graphql/subscriptions';
import { secureStorage } from '../../utils/secureStorage';
import { secondsToTimeString } from '../../utils/formatting';
import RideStatusModal from '../../components/driver/RideStatusModal';

const DriverHomeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('requests');
  const [refreshing, setRefreshing] = useState(false);

  // Modal shown after a ride completes (this driver tapped Complete) or gets
  // canceled by the rider. eventType=null means hidden.
  const [rideStatusModal, setRideStatusModal] = useState({
    visible: false,
    eventType: null,
    riderName: '',
  });
  const closeRideStatusModal = () =>
    setRideStatusModal((s) => ({ ...s, visible: false }));

  const userId = useUserStore((state) => state.userId);
  const userName = useUserStore((state) => state.userName);
  const resetAuthState = useAuthStore((state) => state.resetAuthState);
  const resetUserState = useUserStore((state) => state.resetUserState);
  const resetDriverState = useDriverStore((state) => state.resetDriverState);
  const isOnDuty = useDriverStore((state) => state.isOnDuty);
  const updateDriverDutyStatus = useDriverStore((state) => state.updateDriverDutyStatus);
  const riderQueue = useDriverStore((state) => state.riderQueue);
  const nextAvailableAt = useDriverStore((state) => state.nextAvailableAt);
  const updateDriverAvailability = useDriverStore((state) => state.updateDriverAvailability);
  const updateDriverRiderQueue = useDriverStore((state) => state.updateDriverRiderQueue);

  const [logoutDriver] = useMutation(LOGOUT_DRIVER);
  const [updateDutyStatus, { loading: dutyLoading }] = useMutation(UPDATE_DRIVER_IS_ON_DUTY);
  const [updateRideStatus] = useMutation(UPDATE_RIDE_STATUS);
  const [updateDriverNextAvailable] = useMutation(UPDATE_DRIVER_NEXT_AVAILABLE_AT);

  // Fetch driver data
  const { data: driverData } = useQuery(GET_SINGLE_DRIVER, {
    variables: { id: userId },
    skip: !userId,
  });

  // Fetch active rides (ride requests)
  const {
    data: activeRidesData,
    refetch: refetchActive,
  } = useQuery(GET_ACTIVE_RIDES, {
    variables: { driverId: parseInt(userId) },
    skip: !userId,
    fetchPolicy: 'network-only',
  });

  // Fetch accepted rides (driver's queue)
  const {
    data: acceptedRidesData,
    refetch: refetchAccepted,
  } = useQuery(GET_ACCEPTED_RIDES, {
    variables: { driverId: userId },
    skip: !userId,
    fetchPolicy: 'network-only',
  });

  // Initialize driver state from query
  useEffect(() => {
    if (driverData?.getDriver) {
      const driver = driverData.getDriver;
      updateDriverDutyStatus(driver.isOnDuty);
      updateDriverRiderQueue(driver.riderQueue || 0);
      updateDriverAvailability(driver.driverNextAvailableAt);
    }
  }, [driverData]);

  // Refetch ride lists every time this screen regains focus.
  // Covers two important UX paths:
  //   - User taps a "new ride request" push notification while the app is
  //     backgrounded → the screen is already mounted, subscriptions may have
  //     missed the event during background, so we pull fresh state.
  //   - User navigates between tabs and comes back to Home — same idea.
  useFocusEffect(
    useCallback(() => {
      refetchActive();
      refetchAccepted();
    }, [refetchActive, refetchAccepted])
  );

  // Subscriptions for real-time updates
  useSubscription(RIDE_CREATED, {
    variables: { driverId: parseInt(userId) },
    skip: !userId,
    onData: () => {
      refetchActive();
      Toast.show({ type: 'info', text1: 'New ride request!' });
    },
  });

  useSubscription(RIDE_CANCELED, {
    onData: ({ data: subData }) => {
      refetchActive();
      refetchAccepted();

      // Show the cancellation modal only when:
      //  - the RIDER (not this driver) initiated the cancel, AND
      //  - the ride was actually assigned to this driver (driverId matches).
      // This avoids modaling drivers who only ever saw the request in passing.
      const payload = subData?.data?.rideCanceled;
      if (!payload) return;
      const { ride, canceledBy } = payload;
      if (
        canceledBy === 'RIDER' &&
        ride?.driverId != null &&
        String(ride.driverId) === String(userId)
      ) {
        setRideStatusModal({
          visible: true,
          eventType: 'canceled',
          riderName: ride.riderName,
        });
      }
    },
  });

  useSubscription(RIDE_COMPLETED, {
    onData: () => {
      refetchAccepted();
    },
  });

  useSubscription(RIDE_EXPIRED, {
    onData: () => {
      refetchActive();
    },
  });

  useSubscription(DRIVER_DUTY_STATUS_UPDATES, {
    onData: ({ data: subData }) => {
      const update = subData?.data?.driverDutyStatusUpdates;
      if (update && String(update.id) === String(userId)) {
        updateDriverDutyStatus(update.isOnDuty);
      }
    },
  });

  useSubscription(DRIVER_AVAILABILITY_UPDATES, {
    onData: ({ data: subData }) => {
      const update = subData?.data?.driverAvailabilityUpdates;
      if (update && String(update.id) === String(userId)) {
        updateDriverRiderQueue(update.riderQueue);
        updateDriverAvailability(update.driverNextAvailableAt);
      }
    },
  });

  const activeRides = activeRidesData?.getActiveRides || [];
  const acceptedRides = acceptedRidesData?.getAcceptedRides || [];

  const handleToggleDuty = async () => {
    try {
      await updateDutyStatus({
        variables: { id: userId, isOnDuty: !isOnDuty },
      });
      updateDriverDutyStatus(!isOnDuty);
      Toast.show({
        type: 'success',
        text1: !isOnDuty ? 'You are now on duty!' : 'You are now off duty',
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to update duty status' });
    }
  };

  const handleAcceptRide = async (ride) => {
    try {
      await updateRideStatus({
        variables: {
          id: ride.id,
          driverId: userId,
          driverName: userName,
          isRequested: false,
          isAccepted: true,
          isCanceled: false,
          isCompleted: false,
          isExpired: false,
        },
      });
      // Server atomically adds +10 min to the availability clock and
      // recounts the queue — no second mutation needed.
      Toast.show({ type: 'success', text1: 'Ride accepted!' });
      refetchActive();
      refetchAccepted();
    } catch (err) {
      // RIDE_ALREADY_ACCEPTED = another driver won the race for this ride.
      const code =
        err?.graphQLErrors?.[0]?.extensions?.code ||
        err?.errors?.[0]?.extensions?.code;
      Toast.show({
        type: 'error',
        text1:
          code === 'RIDE_ALREADY_ACCEPTED'
            ? 'Another driver just took this ride'
            : 'Failed to accept ride',
      });
      // Refresh so the taken ride drops off the request list.
      refetchActive();
    }
  };

  const handleCompleteRide = async (ride) => {
    try {
      await updateRideStatus({
        variables: {
          id: ride.id,
          driverId: userId,
          driverName: userName,
          isRequested: false,
          isAccepted: false,
          isCanceled: false,
          isCompleted: true,
          isExpired: false,
        },
      });
      // Server atomically frees -5 min on the availability clock and
      // recounts the queue — no second mutation needed.
      refetchAccepted();
      // Modal replaces the prior toast — gives the driver an immediate chance
      // to fine-tune their availability after finishing the ride.
      setRideStatusModal({
        visible: true,
        eventType: 'completed',
        riderName: ride.riderName,
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to complete ride' });
    }
  };

  const handleCancelRide = async (ride) => {
    try {
      await updateRideStatus({
        variables: {
          id: ride.id,
          isRequested: false,
          isAccepted: false,
          isCanceled: true,
          isCompleted: false,
          isExpired: false,
          canceledBy: 'DRIVER',
        },
      });
      // Server atomically refunds the queued 10 min and recounts the queue —
      // no second mutation needed.
      Toast.show({ type: 'info', text1: 'Ride canceled' });
      refetchAccepted();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to cancel ride' });
    }
  };

  const handleLogout = async () => {
    try {
      // The auth link reads context.refreshToken to build the
      // X-Refresh-Token header — without it the server can't find the
      // session and the refresh token is never revoked.
      const refreshToken = await secureStorage.getRefreshToken();
      await logoutDriver({ context: { refreshToken } });
    } catch (err) {}
    await secureStorage.removeRefreshToken();
    resetDriverState();
    resetUserState();
    resetAuthState();
    Toast.show({ type: 'success', text1: 'Logged out successfully' });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchActive(), refetchAccepted()]);
    setRefreshing(false);
  }, []);

  // Live-ticking availability display.
  // `nextAvailableAt` is a `Long` (millisecond Unix timestamp) from the API —
  // NOT seconds — so subtract from Date.now() directly, then convert ms→s for
  // the formatter. Re-runs every second so the timer counts down on screen.
  const [availabilityText, setAvailabilityText] = useState('Now');
  useEffect(() => {
    const update = () => {
      if (!nextAvailableAt) {
        setAvailabilityText('Now');
        return;
      }
      const diffMs = nextAvailableAt - Date.now();
      if (diffMs <= 0) {
        setAvailabilityText('Now');
        return;
      }
      setAvailabilityText(secondsToTimeString(Math.floor(diffMs / 1000), { showSeconds: true }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextAvailableAt]);

  // Adjust the next-available time by ±minutes (0 = reset to "now").
  const handleTimeChange = async (minutes) => {
    try {
      await updateDriverNextAvailable({
        variables: {
          id: userId,
          riderQueueChange: 0,
          secondsToAdd: minutes * 60,
        },
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to update availability' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Driver Dashboard</Text>
          <Text style={styles.userName}>{userName || 'Driver'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Duty Toggle */}
        <View style={styles.dutyCard}>
          <View style={styles.dutyInfo}>
            <View style={[styles.dutyDot, isOnDuty ? styles.dutyDotOn : styles.dutyDotOff]} />
            <Text style={[styles.dutyText, !isOnDuty && styles.dutyTextOff]}>
              {isOnDuty ? 'On Duty' : 'Off Duty'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.dutyToggle, isOnDuty ? styles.dutyToggleOn : styles.dutyToggleOff]}
            onPress={handleToggleDuty}
            disabled={dutyLoading}
          >
            {dutyLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.dutyToggleText}>
                {isOnDuty ? 'Go Off Duty' : 'Go On Duty'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Availability Card — live timer + adjust controls */}
        <View style={styles.availabilityCard}>
          <Text style={styles.availabilityLabel}>Next Available In</Text>
          <Text style={styles.availabilityValue}>{availabilityText}</Text>
          <View style={styles.timeControlsRow}>
            <TouchableOpacity
              style={[styles.timeButton, styles.timeButtonNegative]}
              onPress={() => handleTimeChange(-5)}
            >
              <Text style={styles.timeButtonNegativeText}>-5m</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeButton, styles.timeButtonNegative]}
              onPress={() => handleTimeChange(-1)}
            >
              <Text style={styles.timeButtonNegativeText}>-1m</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeButton, styles.timeButtonReset]}
              onPress={() => handleTimeChange(0)}
            >
              <Ionicons name="refresh" size={18} color={colors.gold.dark} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeButton, styles.timeButtonPositive]}
              onPress={() => handleTimeChange(1)}
            >
              <Text style={styles.timeButtonPositiveText}>+1m</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeButton, styles.timeButtonPositive]}
              onPress={() => handleTimeChange(5)}
            >
              <Text style={styles.timeButtonPositiveText}>+5m</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Queue Card */}
        <View style={styles.queueCard}>
          <Text style={styles.queueLabel}>In Queue</Text>
          <Text style={styles.queueValue}>{riderQueue}</Text>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
              Ride Requests ({activeRides.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'queue' && styles.tabActive]}
            onPress={() => setActiveTab('queue')}
          >
            <Text style={[styles.tabText, activeTab === 'queue' && styles.tabTextActive]}>
              Your Queue ({acceptedRides.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'requests' ? (
          activeRides.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyText}>
                {isOnDuty ? 'No ride requests yet' : 'Go on duty to see ride requests'}
              </Text>
            </View>
          ) : (
            activeRides.map((ride) => (
              <View key={ride.id} style={styles.rideCard}>
                <View style={styles.rideCardHeader}>
                  <Text style={styles.riderName}>{ride.riderName}</Text>
                  {ride.bidAmount > 0 && (
                    <View style={styles.bidTag}>
                      <Text style={styles.bidTagText}>${ride.bidAmount}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.locationRow}>
                  <View style={[styles.dot, { backgroundColor: colors.rider.light }]} />
                  <Text style={styles.locationText} numberOfLines={1}>{ride.pickUp}</Text>
                </View>
                <View style={styles.locationRow}>
                  <View style={[styles.dot, { backgroundColor: colors.error.light }]} />
                  <Text style={styles.locationText} numberOfLines={1}>{ride.dropOff}</Text>
                </View>
                <View style={styles.rideCardMeta}>
                  <Text style={styles.metaText}>{ride.passengers} passenger{ride.passengers > 1 ? 's' : ''}</Text>
                  <Text style={styles.metaText}>{ride.pickUpTime}</Text>
                </View>
                {isOnDuty && (
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRide(ride)}
                  >
                    <Text style={styles.acceptButtonText}>Accept Ride</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )
        ) : acceptedRides.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No rides in your queue</Text>
          </View>
        ) : (
          acceptedRides.map((ride, index) => (
            <View key={ride.id} style={styles.rideCard}>
              <View style={styles.rideCardHeader}>
                <View style={styles.queueBadge}>
                  <Text style={styles.queueBadgeText}>#{index + 1}</Text>
                </View>
                <Text style={styles.riderName}>{ride.riderName}</Text>
              </View>
              <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: colors.rider.light }]} />
                <Text style={styles.locationText} numberOfLines={1}>{ride.pickUp}</Text>
              </View>
              <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: colors.error.light }]} />
                <Text style={styles.locationText} numberOfLines={1}>{ride.dropOff}</Text>
              </View>
              <View style={styles.queueActions}>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handleCompleteRide(ride)}
                >
                  <Text style={styles.completeButtonText}>Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelRide(ride)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Post-event modal: completion or rider-cancel */}
      <RideStatusModal
        visible={rideStatusModal.visible}
        eventType={rideStatusModal.eventType}
        riderName={rideStatusModal.riderName}
        onClose={closeRideStatusModal}
        onTimeChange={handleTimeChange}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.driver.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: colors.gold.light,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dutyCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dutyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dutyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dutyDotOn: {
    backgroundColor: colors.rider.light,
  },
  dutyDotOff: {
    backgroundColor: colors.error.light,
  },
  dutyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  dutyTextOff: {
    color: colors.error.dark,
  },
  dutyToggle: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  dutyToggleOn: {
    backgroundColor: colors.gray[600],
  },
  dutyToggleOff: {
    backgroundColor: colors.rider.dark,
  },
  dutyToggleText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  availabilityCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  availabilityLabel: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  availabilityValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.driver.dark,
    marginTop: 6,
    marginBottom: 14,
    fontVariant: ['tabular-nums'],
  },
  timeControlsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  timeButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 64,
  },
  timeButtonNegative: {
    backgroundColor: colors.error.light + '15',
    borderWidth: 1,
    borderColor: colors.error.light + '40',
  },
  timeButtonNegativeText: {
    color: colors.error.light,
    fontSize: 14,
    fontWeight: '700',
  },
  timeButtonReset: {
    backgroundColor: colors.gold.light + '25',
    borderWidth: 1,
    borderColor: colors.gold.dark + '40',
  },
  timeButtonPositive: {
    backgroundColor: colors.rider.light + '15',
    borderWidth: 1,
    borderColor: colors.rider.light + '40',
  },
  timeButtonPositiveText: {
    color: colors.rider.dark,
    fontSize: 14,
    fontWeight: '700',
  },
  queueCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  queueLabel: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '600',
  },
  queueValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.driver.dark,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
  },
  tabTextActive: {
    color: colors.gray[900],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.gray[400],
    textAlign: 'center',
  },
  rideCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  rideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  riderName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
  },
  bidTag: {
    backgroundColor: colors.gold.light,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  bidTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[900],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationText: {
    fontSize: 14,
    color: colors.gray[700],
    flex: 1,
  },
  rideCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  metaText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  acceptButton: {
    backgroundColor: colors.rider.dark,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  queueBadge: {
    backgroundColor: colors.driver.light,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  queueBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  queueActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  completeButton: {
    flex: 1,
    backgroundColor: colors.rider.dark,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.error.light,
  },
  cancelButtonText: {
    color: colors.error.light,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default DriverHomeScreen;
