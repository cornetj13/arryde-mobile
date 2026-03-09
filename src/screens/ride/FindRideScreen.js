import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useUserStore } from '../../stores';
import { formatPhone } from '../../utils/formatting';
import OptionSelector from '../../components/shared/OptionSelector';

const PASSENGER_OPTIONS = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
];

const PICKUP_TIME_OPTIONS = [
  { label: 'ASAP', value: 'ASAP' },
  { label: '15 min', value: '15 minutes' },
  { label: '30 min', value: '30 minutes' },
  { label: '45 min', value: '45 minutes' },
  { label: '1 hour', value: '1 hour' },
];

const FindRideScreen = ({ navigation, route }) => {
  const userName = useUserStore((state) => state.userName);

  // Prefill data from RideCanceled "Request Again"
  const prefill = route.params?.prefillRide || {};

  const [name, setName] = useState(prefill.name || userName || '');
  const [phone, setPhone] = useState(prefill.phone || '');
  const [passengers, setPassengers] = useState(prefill.passengers || 1);
  const [pickUpTime, setPickUpTime] = useState(prefill.pickUpTime || 'ASAP');
  const [pickUp, setPickUp] = useState(prefill.pickUp || '');
  const [dropOff, setDropOff] = useState(prefill.dropOff || '');
  const [bidAmount, setBidAmount] = useState(prefill.bidAmount ? String(prefill.bidAmount) : '');
  const [showBid, setShowBid] = useState(!!prefill.bidAmount);
  const [errors, setErrors] = useState({});

  const handlePhoneChange = (text) => {
    // Strip non-digits
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 10) {
      setPhone(digits.length === 10 ? formatPhone(digits) : text);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    if (!pickUp.trim()) newErrors.pickUp = 'Pickup address is required';
    if (!dropOff.trim()) newErrors.dropOff = 'Dropoff address is required';

    // Validate phone format
    const phoneDigits = phone.replace(/\D/g, '');
    if (phone.trim() && phoneDigits.length !== 10) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    const formattedPhone = formatPhone(phone.replace(/\D/g, ''));
    const bid = bidAmount ? parseInt(bidAmount) : 0;

    navigation.navigate('ChooseDriver', {
      rideData: {
        name: name.trim(),
        phone: formattedPhone,
        passengers,
        pickUpTime,
        pickUp: pickUp.trim(),
        dropOff: dropOff.trim(),
        bidAmount: bid,
      },
      prefillDriverIds: prefill.requestedDriverIds || [],
    });
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
        <Text style={styles.headerTitle}>Find A Ride</Text>
        <Text style={styles.headerSubtitle}>Fill in your ride details</Text>
      </View>

      {/* Form */}
      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.gray[400]}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="(360) 555-1234"
              placeholderTextColor={colors.gray[400]}
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Passengers */}
          <View style={styles.field}>
            <Text style={styles.label}>Passengers</Text>
            <OptionSelector
              options={PASSENGER_OPTIONS}
              selected={passengers}
              onSelect={setPassengers}
            />
          </View>

          {/* Pickup Time */}
          <View style={styles.field}>
            <Text style={styles.label}>Pickup Time</Text>
            <OptionSelector
              options={PICKUP_TIME_OPTIONS}
              selected={pickUpTime}
              onSelect={setPickUpTime}
            />
          </View>

          {/* Pickup Address */}
          <View style={styles.field}>
            <Text style={styles.label}>Pickup Address</Text>
            <View style={styles.addressInputRow}>
              <View style={[styles.addressDot, { backgroundColor: colors.rider.light }]} />
              <TextInput
                style={[styles.addressInput, errors.pickUp && styles.inputError]}
                value={pickUp}
                onChangeText={setPickUp}
                placeholder="1234 Main St, Bellingham, WA"
                placeholderTextColor={colors.gray[400]}
              />
            </View>
            {errors.pickUp && <Text style={styles.errorText}>{errors.pickUp}</Text>}
          </View>

          {/* Dropoff Address */}
          <View style={styles.field}>
            <Text style={styles.label}>Dropoff Address</Text>
            <View style={styles.addressInputRow}>
              <View style={[styles.addressDot, { backgroundColor: colors.error.light }]} />
              <TextInput
                style={[styles.addressInput, errors.dropOff && styles.inputError]}
                value={dropOff}
                onChangeText={setDropOff}
                placeholder="5678 Oak Ave, Bellingham, WA"
                placeholderTextColor={colors.gray[400]}
              />
            </View>
            {errors.dropOff && <Text style={styles.errorText}>{errors.dropOff}</Text>}
          </View>

          {/* Bid Section */}
          <TouchableOpacity
            style={styles.bidToggle}
            onPress={() => setShowBid(!showBid)}
          >
            <Ionicons
              name={showBid ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.gold.dark}
            />
            <Text style={styles.bidToggleText}>
              {bidAmount && parseInt(bidAmount) > 0
                ? `$${bidAmount} Bid`
                : 'Add a Bid (Optional)'}
            </Text>
          </TouchableOpacity>

          {showBid && (
            <View style={styles.bidSection}>
              <View style={styles.bidInputRow}>
                <Text style={styles.bidDollar}>$</Text>
                <TextInput
                  style={styles.bidInput}
                  value={bidAmount}
                  onChangeText={(text) => {
                    const num = text.replace(/\D/g, '');
                    if (parseInt(num) <= 999 || num === '') setBidAmount(num);
                  }}
                  placeholder="0"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <Text style={styles.bidHint}>Tip: Adding a bid can help get your ride accepted faster</Text>
            </View>
          )}

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Choose Drivers</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  formWrapper: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    padding: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[900],
  },
  inputError: {
    borderColor: colors.error.light,
  },
  errorText: {
    color: colors.error.light,
    fontSize: 13,
    marginTop: 4,
  },
  addressInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 10,
  },
  addressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 14,
  },
  addressInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[900],
    borderWidth: 0,
  },
  bidToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 4,
  },
  bidToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gold.dark,
  },
  bidSection: {
    backgroundColor: colors.gold.light + '15',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  bidInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bidDollar: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gold.dark,
  },
  bidInput: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    flex: 1,
    paddingVertical: 4,
  },
  bidHint: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: colors.rider.dark,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default FindRideScreen;
