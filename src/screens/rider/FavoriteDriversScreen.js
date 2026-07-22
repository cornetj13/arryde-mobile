import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@apollo/client/react';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { useUserStore } from '../../stores';
import { GET_FAVORITE_DRIVERS, GET_ALL_DRIVERS } from '../../graphql/queries';
import { ADD_FAVORITE_DRIVER, REMOVE_FAVORITE_DRIVER } from '../../graphql/mutations';
import { secondsToTimeString } from '../../utils/formatting';

const FavoriteDriversScreen = ({ navigation }) => {
  const userId = useUserStore((state) => state.userId);
  const [showAvailable, setShowAvailable] = useState(false);

  const {
    data: favData,
    loading: favLoading,
    refetch: refetchFavorites,
  } = useQuery(GET_FAVORITE_DRIVERS, {
    variables: { riderId: userId },
    skip: !userId,
    fetchPolicy: 'network-only',
  });

  // ALL drivers, not just on-duty — you can favorite a driver who's off
  // duty right now (being logged in ≠ being on duty).
  const {
    data: availData,
    loading: availLoading,
  } = useQuery(GET_ALL_DRIVERS, {
    skip: !showAvailable,
    fetchPolicy: 'network-only',
  });

  const [addFavorite] = useMutation(ADD_FAVORITE_DRIVER);
  const [removeFavorite] = useMutation(REMOVE_FAVORITE_DRIVER);

  const favoriteDrivers = favData?.getFavoriteDrivers || [];
  const allDrivers = availData?.getAllDrivers || [];
  const favoriteIds = favoriteDrivers.map((d) => d.id);

  // Drivers not already favorited, on-duty ones first
  const nonFavoriteAvailable = allDrivers
    .filter((d) => !favoriteIds.includes(d.id))
    .sort((a, b) => (b.isOnDuty === true) - (a.isOnDuty === true));

  const handleRemoveFavorite = async (driverId, driverName) => {
    Alert.alert(
      'Remove Favorite',
      `Remove ${driverName} from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFavorite({
                variables: { riderId: userId, driverId },
              });
              refetchFavorites();
              Toast.show({ type: 'success', text1: `${driverName} removed from favorites` });
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Failed to remove driver' });
            }
          },
        },
      ]
    );
  };

  const handleAddFavorite = async (driverId, driverName) => {
    try {
      await addFavorite({
        variables: { riderId: userId, driverId },
      });
      refetchFavorites();
      Toast.show({ type: 'success', text1: `${driverName} added to favorites!` });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to add driver' });
    }
  };

  const getAvailabilityText = (driver) => {
    // `driverNextAvailableAt` is a Long (ms timestamp), not seconds.
    if (!driver.driverNextAvailableAt) return 'Now';
    const diffMs = driver.driverNextAvailableAt - Date.now();
    if (diffMs <= 0) return 'Now';
    return '~' + secondsToTimeString(Math.floor(diffMs / 1000));
  };

  const renderFavoriteDriver = ({ item: driver }) => (
    // Card itself is tappable → opens driver profile.
    // The heart button below is a nested Touchable, so taps on it are captured
    // by the heart and DON'T bubble up to trigger navigation.
    <TouchableOpacity
      style={styles.driverCard}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('DriverProfileView', { driverId: driver.id })
      }
    >
      <View style={styles.driverRow}>
        <View style={styles.driverAvatar}>
          <Text style={styles.driverInitial}>
            {driver.name?.charAt(0)?.toUpperCase() || 'D'}
          </Text>
        </View>
        <View style={styles.driverInfo}>
          <View style={styles.driverNameRow}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <View style={[styles.statusDot, driver.isOnDuty ? styles.dotOn : styles.dotOff]} />
          </View>
          {driver.isOnDuty ? (
            <View style={styles.driverMeta}>
              <Text style={styles.metaText}>Queue: {driver.riderQueue || 0}</Text>
              <Text style={styles.metaDivider}>|</Text>
              <Text style={styles.metaText}>Available: {getAvailabilityText(driver)}</Text>
            </View>
          ) : (
            <Text style={styles.offDutyText}>Off Duty</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFavorite(driver.id, driver.name)}
        >
          <Ionicons name="heart-dislike" size={20} color={colors.error.light} />
        </TouchableOpacity>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.gray[300]}
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );

  if (favLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.rider.dark} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.screenTitle}>Favorite Drivers</Text>

      {favoriteDrivers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.emptyText}>No favorite drivers yet</Text>
          <Text style={styles.emptySubtext}>
            Browse available drivers to add favorites
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => setShowAvailable(true)}
          >
            <Text style={styles.browseButtonText}>Browse Drivers</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={favoriteDrivers}
            keyExtractor={(item) => item.id}
            renderItem={renderFavoriteDriver}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={() => setShowAvailable(!showAvailable)}
              >
                <Ionicons
                  name={showAvailable ? 'chevron-up' : 'add-circle-outline'}
                  size={20}
                  color={colors.rider.dark}
                />
                <Text style={styles.addMoreText}>
                  {showAvailable ? 'Hide Drivers' : 'Add More Drivers'}
                </Text>
              </TouchableOpacity>
            }
          />
        </>
      )}

      {/* Available Drivers Section */}
      {showAvailable && (
        <View style={styles.availableSection}>
          <Text style={styles.sectionTitle}>All Drivers</Text>
          {availLoading ? (
            <ActivityIndicator color={colors.rider.dark} style={{ padding: 20 }} />
          ) : nonFavoriteAvailable.length === 0 ? (
            <Text style={styles.noDriversText}>No other drivers to add</Text>
          ) : (
            <FlatList
              data={nonFavoriteAvailable}
              keyExtractor={(item) => item.id}
              renderItem={({ item: driver }) => (
                <View style={styles.driverCard}>
                  <View style={styles.driverRow}>
                    <View style={styles.driverAvatar}>
                      <Text style={styles.driverInitial}>
                        {driver.name?.charAt(0)?.toUpperCase() || 'D'}
                      </Text>
                    </View>
                    <View style={styles.driverInfo}>
                      <View style={styles.driverNameRow}>
                        <Text style={styles.driverName}>{driver.name}</Text>
                        <View
                          style={[
                            styles.statusDot,
                            driver.isOnDuty ? styles.dotOn : styles.dotOff,
                          ]}
                        />
                      </View>
                      {driver.isOnDuty ? (
                        <Text style={styles.metaText}>
                          Queue: {driver.riderQueue || 0} | Available: {getAvailabilityText(driver)}
                        </Text>
                      ) : (
                        <Text style={styles.offDutyText}>Off Duty</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleAddFavorite(driver.id, driver.name)}
                    >
                      <Ionicons name="heart" size={20} color={colors.error.light} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: 12,
  },
  driverCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.driver.light + '20',
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
  dotOn: { backgroundColor: colors.rider.light },
  dotOff: { backgroundColor: colors.gray[400] },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  metaDivider: {
    marginHorizontal: 6,
    color: colors.gray[300],
  },
  offDutyText: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  chevron: {
    marginLeft: 2,
  },
  addButton: {
    padding: 8,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  addMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.rider.dark,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: colors.rider.dark,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  browseButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  availableSection: {
    paddingHorizontal: 20,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 10,
  },
  noDriversText: {
    fontSize: 14,
    color: colors.gray[400],
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default FavoriteDriversScreen;
