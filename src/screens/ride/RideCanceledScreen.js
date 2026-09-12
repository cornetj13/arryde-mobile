import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@apollo/client/react';
import { colors } from '../../theme/colors';
import { useUserStore, useRideStore } from '../../stores';
import { RESET_RIDER_RIDE_FLOW_STATUS } from '../../graphql/mutations';

const RideCanceledScreen = ({ navigation, route }) => {
  const ride = route.params?.ride;
  const canceledBy = route.params?.canceledBy;
  const userId = useUserStore((state) => state.userId);
  const resetRideState = useRideStore((state) => state.resetRideState);
  const [resetRiderFlow] = useMutation(RESET_RIDER_RIDE_FLOW_STATUS);

  useEffect(() => {
    if (userId) {
      resetRiderFlow({ variables: { id: userId } }).catch(() => {});
    }
  }, []);

  const getCancelMessage = () => {
    if (canceledBy === 'DRIVER' && ride?.driverName) {
      return `Sorry, ${ride.driverName} has canceled the ride.`;
    }
    if (canceledBy === 'RIDER' && ride?.driverName) {
      return `You have canceled your ride request with ${ride.driverName}.`;
    }
    if (canceledBy === 'RIDER') {
      return 'You have canceled your request.';
    }
    return 'This ride has been canceled.';
  };

  const handleRequestAgain = () => {
    if (ride) {
      const prefillData = {
        name: ride.riderName,
        phone: ride.phoneNumber,
        passengers: ride.passengers,
        pickUpTime: ride.pickUpTime,
        pickUp: ride.pickUp,
        pickUpLat: ride.pickUpLat ?? null,
        pickUpLng: ride.pickUpLng ?? null,
        dropOff: ride.dropOff,
        dropOffLat: ride.dropOffLat ?? null,
        dropOffLng: ride.dropOffLng ?? null,
        bidAmount: ride.bidAmount || 0,
        requestedDriverIds: ride.requestedDriverIds || [],
      };

      resetRideState();
      navigation.reset({
        index: 0,
        routes: [
          { name: 'RiderTabs' },
          { name: 'FindRide', params: { prefillRide: prefillData } },
        ],
      });
    }
  };

  const handleGoHome = () => {
    resetRideState();
    navigation.reset({
      index: 0,
      routes: [{ name: 'RiderTabs' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Cancel Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="close" size={56} color={colors.white} />
          </View>
        </View>

        {/* Message */}
        <Text style={styles.title}>Ride Canceled</Text>
        <Text style={styles.message}>{getCancelMessage()}</Text>

        {/* Buttons */}
        {ride && (
          <TouchableOpacity style={styles.requestAgainButton} onPress={handleRequestAgain}>
            <Ionicons name="refresh" size={20} color={colors.white} />
            <Text style={styles.requestAgainButtonText}>Request That Ride Again</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
          <Text style={styles.homeButtonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 28,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.error.light,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.error.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  requestAgainButton: {
    backgroundColor: colors.rider.dark,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  requestAgainButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  homeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  homeButtonText: {
    color: colors.gray[500],
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RideCanceledScreen;
