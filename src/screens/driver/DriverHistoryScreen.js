import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@apollo/client/react';
import { colors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useUserStore } from '../../stores';
import { GET_DRIVER_RIDE_HISTORY } from '../../graphql/queries';
import RideHistoryDetailModal from '../../components/shared/RideHistoryDetailModal';

const getStatusInfo = (ride) => {
  if (ride.isCompleted) return { label: 'Completed', color: colors.rider.dark, icon: 'checkmark-circle' };
  if (ride.isCanceled) return { label: 'Canceled', color: colors.error.light, icon: 'close-circle' };
  if (ride.isExpired) return { label: 'Expired', color: colors.gold.dark, icon: 'time' };
  if (ride.isAccepted) return { label: 'Accepted', color: colors.teal.dark, icon: 'car' };
  return { label: 'Unknown', color: colors.gray[400], icon: 'help-circle' };
};

const RideHistoryCard = ({ ride, onPress }) => {
  const status = getStatusInfo(ride);
  const date = ride.date || (ride.createdAt ? new Date(parseInt(ride.createdAt)).toLocaleDateString() : '');

  return (
    <TouchableOpacity style={styles.rideCard} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.rideHeader}>
        <Text style={styles.rideDate}>{date}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
          <Ionicons name={status.icon} size={14} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.riderName}>{ride.riderName}</Text>

      <View style={styles.locationRow}>
        <View style={[styles.dot, { backgroundColor: colors.rider.light }]} />
        <Text style={styles.locationText} numberOfLines={1}>{ride.pickUp}</Text>
      </View>
      <View style={styles.locationRow}>
        <View style={[styles.dot, { backgroundColor: colors.error.light }]} />
        <Text style={styles.locationText} numberOfLines={1}>{ride.dropOff}</Text>
      </View>

      <View style={styles.rideMeta}>
        <Text style={styles.metaText}>{ride.passengers} passenger{ride.passengers > 1 ? 's' : ''}</Text>
        <Text style={styles.metaText}>{ride.pickUpTime}</Text>
        {ride.bidAmount > 0 && <Text style={styles.metaBid}>${ride.bidAmount} bid</Text>}
      </View>
    </TouchableOpacity>
  );
};

const DriverHistoryScreen = () => {
  // Theme-aware palette; `colors` shadows the module import so all
  // existing JSX and styles below pick up light/dark automatically.
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const userId = useUserStore((state) => state.userId);
  const [selectedRide, setSelectedRide] = useState(null);

  const { data, loading } = useQuery(GET_DRIVER_RIDE_HISTORY, {
    variables: { id: userId },
    skip: !userId,
    fetchPolicy: 'network-only',
  });

  const rides = data?.getDriverRideHistory || [];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.driver.dark} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.screenTitle}>Ride History</Text>

      {rides.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.emptyText}>No ride history yet</Text>
          <Text style={styles.emptySubtext}>Your past rides will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RideHistoryCard ride={item} onPress={() => setSelectedRide(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <RideHistoryDetailModal
        visible={!!selectedRide}
        ride={selectedRide}
        viewerRole="driver"
        onClose={() => setSelectedRide(null)}
      />
    </SafeAreaView>
  );
};

const makeStyles = (colors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  rideCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rideDate: {
    fontSize: 13,
    color: colors.gray[500],
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
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
  rideMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  metaText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  metaBid: {
    fontSize: 12,
    color: colors.gold.dark,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[500],
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 13,
    color: colors.gray[400],
  },
});

export default DriverHistoryScreen;
