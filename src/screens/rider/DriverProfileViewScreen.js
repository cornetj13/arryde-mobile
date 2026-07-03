import { useState, useEffect } from 'react';
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
import { useQuery, useSubscription } from '@apollo/client/react';
import { colors } from '../../theme/colors';
import { GET_SINGLE_DRIVER } from '../../graphql/queries';
import {
  DRIVER_DUTY_STATUS_UPDATES,
  DRIVER_AVAILABILITY_UPDATES,
} from '../../graphql/subscriptions';
import { secondsToTimeString } from '../../utils/formatting';

/**
 * Rider's read-only view of a driver's profile.
 *
 * Route params: { driverId }
 *
 * Shows status, vehicle info, lifetime stats, a coming-soon banner for
 * the future scheduling feature, and a "Request a Ride" CTA that deep-links
 * into the FindRide flow with this driver pre-selected.
 */
const DriverProfileViewScreen = ({ navigation, route }) => {
  const { driverId } = route.params || {};

  const { data, loading, refetch } = useQuery(GET_SINGLE_DRIVER, {
    variables: { id: driverId },
    skip: !driverId,
    fetchPolicy: 'network-only',
  });

  const driver = data?.getDriver;

  // Real-time status — refetch when this driver's duty or availability changes.
  useSubscription(DRIVER_DUTY_STATUS_UPDATES, {
    onData: ({ data: subData }) => {
      const update = subData?.data?.driverDutyStatusUpdates;
      if (update && String(update.id) === String(driverId)) refetch();
    },
  });
  useSubscription(DRIVER_AVAILABILITY_UPDATES, {
    onData: ({ data: subData }) => {
      const update = subData?.data?.driverAvailabilityUpdates;
      if (update && String(update.id) === String(driverId)) refetch();
    },
  });

  // Live-ticking availability display. `driverNextAvailableAt` is a Long
  // (ms Unix timestamp), so subtract from Date.now() directly, divide by 1000
  // for the formatter.
  const [availabilityText, setAvailabilityText] = useState('Now');
  useEffect(() => {
    const tick = () => {
      const next = driver?.driverNextAvailableAt;
      if (!next) {
        setAvailabilityText('Now');
        return;
      }
      const diffMs = next - Date.now();
      if (diffMs <= 0) {
        setAvailabilityText('Now');
        return;
      }
      setAvailabilityText(
        secondsToTimeString(Math.floor(diffMs / 1000), { showSeconds: true })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [driver?.driverNextAvailableAt]);

  const handleRequestRide = () => {
    if (!driver) return;
    navigation.navigate('FindRide', {
      prefillRide: {
        requestedDriverIds: [driver.id],
      },
    });
  };

  if (loading || !driver) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Driver</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.rider.dark} />
        </View>
      </SafeAreaView>
    );
  }

  const vehicleParts = [driver.carColor, driver.carMake, driver.carModel]
    .filter(Boolean)
    .join(' ');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Profile</Text>
      </View>

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Identity */}
          <View style={styles.identitySection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {driver.name?.charAt(0)?.toUpperCase() || 'D'}
              </Text>
            </View>
            <Text style={styles.driverName}>{driver.name}</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  driver.isOnDuty ? styles.dotOn : styles.dotOff,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: driver.isOnDuty ? colors.rider.dark : colors.gray[500] },
                ]}
              >
                {driver.isOnDuty ? 'On Duty' : 'Off Duty'}
              </Text>
            </View>
          </View>

          {/* Live status — only meaningful when on duty */}
          {driver.isOnDuty && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Status</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{driver.riderQueue || 0}</Text>
                  <Text style={styles.statLabel}>In Queue</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{availabilityText}</Text>
                  <Text style={styles.statLabel}>Available In</Text>
                </View>
              </View>
            </View>
          )}

          {/* Vehicle */}
          {(vehicleParts || driver.licensePlate) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Vehicle</Text>
              {vehicleParts ? (
                <Text style={styles.cardBody}>{vehicleParts}</Text>
              ) : null}
              {driver.licensePlate ? (
                <View style={styles.licensePlate}>
                  <Text style={styles.licensePlateText}>{driver.licensePlate}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Stats */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Driving History</Text>
            <Text style={styles.cardBody}>
              {driver.completedRidesTotal || 0} ride
              {driver.completedRidesTotal === 1 ? '' : 's'} completed
            </Text>
          </View>

          {/* Coming Soon — schedule */}
          <View style={styles.comingSoonCard}>
            <View style={styles.comingSoonHeader}>
              <Ionicons name="time-outline" size={20} color={colors.gold.dark} />
              <Text style={styles.comingSoonLabel}>Coming Soon</Text>
            </View>
            <Text style={styles.comingSoonText}>
              See your driver's usual working hours and schedule a ride ahead of time.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* CTA footer */}
        <View style={styles.ctaFooter}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleRequestRide}
          >
            <Ionicons name="car" size={20} color={colors.white} />
            <Text style={styles.ctaButtonText}>
              Request a Ride with {driver.name?.split(' ')[0] || 'this Driver'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.rider.dark,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  body: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    padding: 20,
  },
  identitySection: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.driver.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOn: { backgroundColor: colors.rider.light },
  dotOff: { backgroundColor: colors.gray[400] },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  cardBody: {
    fontSize: 15,
    color: colors.gray[900],
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.driver.dark,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.gray[200],
  },
  licensePlate: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gray[100],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray[300],
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 6,
  },
  licensePlateText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[800],
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  comingSoonCard: {
    backgroundColor: colors.gold.light + '20',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gold.dark + '30',
  },
  comingSoonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  comingSoonLabel: {
    fontSize: 12,
    color: colors.gold.dark,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comingSoonText: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  ctaFooter: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  ctaButton: {
    backgroundColor: colors.rider.dark,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DriverProfileViewScreen;
