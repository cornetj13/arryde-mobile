import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@apollo/client/react';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { useAuthStore, useUserStore, useRideStore } from '../../stores';
import { LOGOUT_RIDER } from '../../graphql/mutations';
import { secureStorage } from '../../utils/secureStorage';

const RiderHomeScreen = ({ navigation }) => {
  const userName = useUserStore((state) => state.userName);
  const resetAuthState = useAuthStore((state) => state.resetAuthState);
  const resetUserState = useUserStore((state) => state.resetUserState);
  const resetRideState = useRideStore((state) => state.resetRideState);

  const [logoutRider] = useMutation(LOGOUT_RIDER);

  const handleLogout = async () => {
    try {
      await logoutRider({
        context: { isRefreshOperation: true },
      });
    } catch (err) {
      // Continue with logout even if server call fails
    }
    await secureStorage.removeRefreshToken();
    resetRideState();
    resetUserState();
    resetAuthState();
    Toast.show({ type: 'success', text1: 'Logged out successfully' });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userName || 'Rider'}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Find A Ride CTA */}
        <TouchableOpacity
          style={styles.findRideButton}
          onPress={() => navigation.navigate('FindRide')}
          activeOpacity={0.8}
        >
          <View style={styles.findRideContent}>
            <View style={styles.findRideIcon}>
              <Ionicons name="car" size={32} color={colors.rider.dark} />
            </View>
            <View style={styles.findRideText}>
              <Text style={styles.findRideTitle}>Find A Ride</Text>
              <Text style={styles.findRideSubtitle}>
                Request a ride from your favorite drivers
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.rider.dark} />
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Favorites')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.error.light + '15' }]}>
              <Ionicons name="heart" size={24} color={colors.error.light} />
            </View>
            <Text style={styles.actionTitle}>Favorite Drivers</Text>
            <Text style={styles.actionSubtitle}>Manage your list</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('RiderHistory')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.teal.light + '15' }]}>
              <Ionicons name="time" size={24} color={colors.teal.dark} />
            </View>
            <Text style={styles.actionTitle}>Ride History</Text>
            <Text style={styles.actionSubtitle}>View past rides</Text>
          </TouchableOpacity>
        </View>

        {/* Tagline */}
        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>Not Who's Closest,</Text>
          <Text style={styles.tagline}>Who You're Closest To</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.rider.dark,
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
    fontSize: 16,
    color: colors.gold.light,
    fontWeight: '500',
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
  },
  profileButton: {
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
    paddingTop: 24,
  },
  findRideButton: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.rider.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: colors.rider.light + '30',
  },
  findRideContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  findRideIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.rider.light + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  findRideText: {
    flex: 1,
  },
  findRideTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.rider.dark,
    marginBottom: 2,
  },
  findRideSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.gray[500],
  },
  taglineContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.gray[400],
    fontWeight: '500',
  },
});

export default RiderHomeScreen;
