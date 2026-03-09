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
import { useQuery } from '@apollo/client/react';
import { colors } from '../../theme/colors';
import { useUserStore } from '../../stores';
import { GET_FAVORITE_DRIVERS } from '../../graphql/queries';
import { secondsToTimeString } from '../../utils/formatting';

const ChooseDriverScreen = ({ navigation, route }) => {
  const { rideData, prefillDriverIds = [] } = route.params;

  const userId = useUserStore((state) => state.userId);
  const [selectedDriverIds, setSelectedDriverIds] = useState(prefillDriverIds);
  const [useNextAvailable, setUseNextAvailable] = useState(prefillDriverIds.length === 0);

  // Fetch favorite drivers
  const { data, loading } = useQuery(GET_FAVORITE_DRIVERS, {
    variables: { riderId: userId },
    skip: !userId,
  });

  const favoriteDrivers = data?.getFavoriteDrivers || [];
  const onDutyDrivers = favoriteDrivers.filter((d) => d.isOnDuty);

  const toggleDriver = (driverId) => {
    setSelectedDriverIds((prev) => {
      const newIds = prev.includes(driverId)
        ? prev.filter((id) => id !== driverId)
        : [...prev, driverId];

      setUseNextAvailable(newIds.length === 0);
      return newIds;
    });
  };

  const handleNextAvailable = () => {
    setSelectedDriverIds([]);
    setUseNextAvailable(true);
  };

  const handleContinue = () => {
    navigation.navigate('ConfirmRide', {
      rideData,
      selectedDriverIds: useNextAvailable ? [] : selectedDriverIds,
      selectedDrivers: useNextAvailable
        ? []
        : favoriteDrivers.filter((d) => selectedDriverIds.includes(d.id)),
    });
  };

  const getAvailabilityText = (driver) => {
    if (!driver.driverNextAvailableAt) return 'Now';
    const now = Math.floor(Date.now() / 1000);
    const diff = driver.driverNextAvailableAt - now;
    if (diff <= 0) return 'Now';
    return '~' + secondsToTimeString(diff);
  };

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
        <Text style={styles.headerTitle}>Choose Drivers</Text>
        <Text style={styles.headerSubtitle}>Select who should get your ride request</Text>
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Next Available Option */}
          <TouchableOpacity
            style={[styles.driverCard, useNextAvailable && styles.driverCardSelected]}
            onPress={handleNextAvailable}
          >
            <View style={styles.driverRow}>
              <View style={[styles.driverAvatar, { backgroundColor: colors.teal.light + '20' }]}>
                <Ionicons name="people" size={22} color={colors.teal.dark} />
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>Next Available Driver</Text>
                <Text style={styles.driverMeta}>Any on-duty driver can accept</Text>
              </View>
              {useNextAvailable && (
                <Ionicons name="checkmark-circle" size={24} color={colors.teal.dark} />
              )}
            </View>
          </TouchableOpacity>

          {/* Favorite Drivers Section */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.rider.dark} />
              <Text style={styles.loadingText}>Loading your drivers...</Text>
            </View>
          ) : favoriteDrivers.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>
                Your Favorite Drivers
              </Text>

              {favoriteDrivers.map((driver) => {
                const isSelected = selectedDriverIds.includes(driver.id);
                const isOnDuty = driver.isOnDuty;

                return (
                  <TouchableOpacity
                    key={driver.id}
                    style={[
                      styles.driverCard,
                      isSelected && styles.driverCardSelected,
                      !isOnDuty && styles.driverCardDisabled,
                    ]}
                    onPress={() => isOnDuty && toggleDriver(driver.id)}
                    disabled={!isOnDuty}
                  >
                    <View style={styles.driverRow}>
                      <View style={[styles.driverAvatar, { backgroundColor: colors.driver.light + '20' }]}>
                        <Text style={styles.driverInitial}>
                          {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                        </Text>
                      </View>
                      <View style={styles.driverInfo}>
                        <View style={styles.driverNameRow}>
                          <Text style={[styles.driverName, !isOnDuty && styles.textDisabled]}>
                            {driver.name}
                          </Text>
                          <View style={[styles.statusDot, isOnDuty ? styles.dotOnDuty : styles.dotOffDuty]} />
                        </View>
                        {isOnDuty ? (
                          <View style={styles.driverStats}>
                            <Text style={styles.driverMeta}>
                              Queue: {driver.riderQueue || 0}
                            </Text>
                            <Text style={styles.driverMetaDivider}>|</Text>
                            <Text style={styles.driverMeta}>
                              Available: {getAvailabilityText(driver)}
                            </Text>
                          </View>
                        ) : (
                          <Text style={[styles.driverMeta, styles.textDisabled]}>Off Duty</Text>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.rider.dark} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={40} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No favorite drivers yet</Text>
              <Text style={styles.emptySubtext}>
                Your ride will be sent to the next available driver
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
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
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: 20,
    marginBottom: 12,
  },
  driverCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  driverCardSelected: {
    backgroundColor: colors.rider.light + '10',
    borderColor: colors.rider.dark,
  },
  driverCardDisabled: {
    opacity: 0.5,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.driver.dark,
  },
  driverInfo: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnDuty: {
    backgroundColor: colors.rider.light,
  },
  dotOffDuty: {
    backgroundColor: colors.gray[400],
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  driverMeta: {
    fontSize: 13,
    color: colors.gray[500],
  },
  driverMetaDivider: {
    marginHorizontal: 6,
    color: colors.gray[300],
  },
  textDisabled: {
    color: colors.gray[400],
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.gray[500],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  continueButton: {
    backgroundColor: colors.rider.dark,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ChooseDriverScreen;
