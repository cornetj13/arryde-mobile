import { useState } from 'react';
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
import { useMutation } from '@apollo/client/react';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { useUserStore, useRideStore } from '../../stores';
import { CREATE_RIDE } from '../../graphql/mutations';
import BidBadge from '../../components/shared/BidBadge';
import InfoRow from '../../components/shared/InfoRow';

const ConfirmRideScreen = ({ navigation, route }) => {
  const { rideData, selectedDriverIds, selectedDrivers } = route.params;
  const userId = useUserStore((state) => state.userId);
  const setCurrentRide = useRideStore((state) => state.setCurrentRide);
  const setCurrentDriver = useRideStore((state) => state.setCurrentDriver);

  const [createRide, { loading }] = useMutation(CREATE_RIDE);

  const handleConfirm = async () => {
    try {
      const variables = {
        riderId: userId,
        riderName: rideData.name,
        phoneNumber: rideData.phone,
        passengers: rideData.passengers,
        pickUp: rideData.pickUp,
        dropOff: rideData.dropOff,
        pickUpTime: rideData.pickUpTime,
      };

      if (rideData.bidAmount > 0) {
        variables.bidAmount = rideData.bidAmount;
      }

      if (selectedDriverIds.length > 0) {
        variables.requestedDriverIds = selectedDriverIds;
      }

      const { data } = await createRide({ variables });

      if (data?.createRide) {
        setCurrentRide(data.createRide.id);
        if (data.createRide.driverId) {
          setCurrentDriver(data.createRide.driverId, data.createRide.driverName);
        }

        // Navigate to waiting screen, reset ride form stack
        navigation.reset({
          index: 0,
          routes: [
            { name: 'RiderTabs' },
            {
              name: 'WaitingForRide',
              params: { ride: data.createRide },
            },
          ],
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to create ride',
        text2: err.message || 'Please try again',
      });
    }
  };

  const driverDisplay =
    selectedDrivers.length > 0
      ? selectedDrivers.map((d) => d.name).join(', ')
      : 'Next Available Driver';

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
        <Text style={styles.headerTitle}>Confirm Ride</Text>
        <Text style={styles.headerSubtitle}>Review your ride details</Text>
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Bid Badge */}
          <BidBadge amount={rideData.bidAmount} />

          {/* Driver Banner */}
          <View style={[
            styles.driverBanner,
            selectedDrivers.length > 0 ? styles.driverBannerSpecific : styles.driverBannerGeneral,
          ]}>
            <Ionicons
              name={selectedDrivers.length > 0 ? 'person' : 'people'}
              size={18}
              color={selectedDrivers.length > 0 ? colors.teal.dark : colors.gray[600]}
            />
            <Text style={[
              styles.driverBannerText,
              selectedDrivers.length > 0 ? styles.driverBannerTextSpecific : {},
            ]}>
              {driverDisplay}
            </Text>
          </View>

          {/* Ride Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ride Details</Text>
            <InfoRow label="Name" value={rideData.name} />
            <InfoRow label="Phone" value={rideData.phone} />
            <InfoRow label="Passengers" value={String(rideData.passengers)} />
            <InfoRow label="Pickup Time" value={rideData.pickUpTime} />
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
                <Text style={styles.locationAddress}>{rideData.pickUp}</Text>
              </View>
            </View>
            <View style={styles.locationItem}>
              <View style={styles.locationTimeline}>
                <View style={[styles.locationDot, { backgroundColor: colors.error.light }]} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Drop Off</Text>
                <Text style={styles.locationAddress}>{rideData.dropOff}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButtonFooter}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonFooterText}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={styles.confirmButtonText}>Confirm Ride</Text>
              </>
            )}
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
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.gold.light,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  driverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  driverBannerGeneral: {
    backgroundColor: colors.gray[100],
  },
  driverBannerSpecific: {
    backgroundColor: colors.teal.light + '15',
    borderWidth: 1,
    borderColor: colors.teal.light + '40',
  },
  driverBannerText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[700],
    flex: 1,
  },
  driverBannerTextSpecific: {
    color: colors.teal.dark,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  backButtonFooter: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray[300],
  },
  backButtonFooterText: {
    color: colors.gray[700],
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.rider.dark,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ConfirmRideScreen;
