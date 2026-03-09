import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@apollo/client/react';
import { colors } from '../../theme/colors';
import { useUserStore, useRideStore } from '../../stores';
import { RESET_RIDER_RIDE_FLOW_STATUS } from '../../graphql/mutations';

const RideCompletedScreen = ({ navigation }) => {
  const userId = useUserStore((state) => state.userId);
  const resetRideState = useRideStore((state) => state.resetRideState);
  const [resetRiderFlow] = useMutation(RESET_RIDER_RIDE_FLOW_STATUS);

  useEffect(() => {
    // Reset rider flow status on mount
    if (userId) {
      resetRiderFlow({ variables: { id: userId } }).catch(() => {});
    }
  }, []);

  const handleFindRide = () => {
    resetRideState();
    navigation.reset({
      index: 0,
      routes: [
        { name: 'RiderTabs' },
        { name: 'FindRide' },
      ],
    });
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
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={56} color={colors.white} />
          </View>
        </View>

        {/* Message */}
        <Text style={styles.title}>Ride Complete!</Text>
        <Text style={styles.message}>
          Thank you for using our service.{'\n'}We hope you had a pleasant ride!
        </Text>

        {/* Buttons */}
        <TouchableOpacity style={styles.findRideButton} onPress={handleFindRide}>
          <Ionicons name="car" size={20} color={colors.white} />
          <Text style={styles.findRideButtonText}>Find Another Ride</Text>
        </TouchableOpacity>

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
    backgroundColor: colors.rider.dark,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.rider.dark,
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
  findRideButton: {
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
  findRideButtonText: {
    color: colors.white,
    fontSize: 18,
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

export default RideCompletedScreen;
