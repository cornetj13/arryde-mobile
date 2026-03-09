import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@apollo/client/react';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { useUserStore } from '../../stores';
import { GET_SINGLE_RIDER } from '../../graphql/queries';
import { UPDATE_RIDER } from '../../graphql/mutations';
import { formatPhone } from '../../utils/formatting';

const RiderProfileScreen = () => {
  const userId = useUserStore((state) => state.userId);
  const setUserName = useUserStore((state) => state.setUserName);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [workAddress, setWorkAddress] = useState('');

  const { data, loading, refetch } = useQuery(GET_SINGLE_RIDER, {
    variables: { id: userId },
    skip: !userId,
  });

  const [updateRider, { loading: updating }] = useMutation(UPDATE_RIDER);

  const rider = data?.getRider;

  useEffect(() => {
    if (rider) {
      setName(rider.name || '');
      setPhone(rider.phoneNumber || '');
      setHomeAddress(rider.homeAddress || '');
      setWorkAddress(rider.workAddress || '');
    }
  }, [rider]);

  const handleSave = async () => {
    try {
      const phoneDigits = phone.replace(/\D/g, '');
      const formattedPhone = phoneDigits.length === 10 ? formatPhone(phoneDigits) : phone;

      await updateRider({
        variables: {
          id: userId,
          name: name.trim(),
          phoneNumber: formattedPhone,
          homeAddress: homeAddress.trim() || null,
          workAddress: workAddress.trim() || null,
        },
      });

      setUserName(name.trim());
      setEditing(false);
      refetch();
      Toast.show({ type: 'success', text1: 'Profile updated!' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to update profile' });
    }
  };

  if (loading) {
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {rider?.name?.charAt(0)?.toUpperCase() || 'R'}
            </Text>
          </View>
          <Text style={styles.profileName}>{rider?.name}</Text>
          <Text style={styles.profileEmail}>{rider?.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rider?.completedRidesTotal || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rider?.requestedRidesTotal || 0}</Text>
            <Text style={styles.statLabel}>Requested</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rider?.FavoriteDrivers?.length || 0}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>

        {/* Edit Toggle */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)}>
            {updating ? (
              <ActivityIndicator size="small" color={colors.rider.dark} />
            ) : (
              <Text style={styles.editButton}>{editing ? 'Save' : 'Edit'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={setName}
              />
            ) : (
              <Text style={styles.fieldValue}>{rider?.name}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Phone</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.fieldValue}>{rider?.phoneNumber}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>{rider?.email}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Home Address</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={homeAddress}
                onChangeText={setHomeAddress}
                placeholder="Optional"
                placeholderTextColor={colors.gray[400]}
              />
            ) : (
              <Text style={styles.fieldValue}>{rider?.homeAddress || '—'}</Text>
            )}
          </View>

          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Work Address</Text>
            {editing ? (
              <TextInput
                style={styles.fieldInput}
                value={workAddress}
                onChangeText={setWorkAddress}
                placeholder="Optional"
                placeholderTextColor={colors.gray[400]}
              />
            ) : (
              <Text style={styles.fieldValue}>{rider?.workAddress || '—'}</Text>
            )}
          </View>
        </View>

        {editing && (
          <TouchableOpacity
            style={styles.cancelEditButton}
            onPress={() => {
              setEditing(false);
              if (rider) {
                setName(rider.name || '');
                setPhone(rider.phoneNumber || '');
                setHomeAddress(rider.homeAddress || '');
                setWorkAddress(rider.workAddress || '');
              }
            }}
          >
            <Text style={styles.cancelEditText}>Cancel Editing</Text>
          </TouchableOpacity>
        )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.rider.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.gray[500],
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.rider.dark,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[500],
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
  },
  editButton: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.rider.dark,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    width: '35%',
  },
  fieldValue: {
    fontSize: 15,
    color: colors.gray[900],
    textAlign: 'right',
    flex: 1,
  },
  fieldInput: {
    fontSize: 15,
    color: colors.gray[900],
    textAlign: 'right',
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  cancelEditButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 12,
  },
  cancelEditText: {
    color: colors.gray[500],
    fontSize: 15,
    fontWeight: '600',
  },
});

export default RiderProfileScreen;
