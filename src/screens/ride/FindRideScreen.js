import { useState, useEffect } from 'react';
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
import { useQuery } from '@apollo/client/react';
import { colors } from '../../theme/colors';
import { useUserStore } from '../../stores';
import { GET_SINGLE_RIDER } from '../../graphql/queries';
import { formatPhone } from '../../utils/formatting';
import OptionSelector from '../../components/shared/OptionSelector';
import PlacesAutocompleteInput from '../../components/shared/PlacesAutocompleteInput';
import RouteMap from '../../components/shared/RouteMap';
import { geocodeAddress } from '../../utils/geocodeAddress';
import { getCurrentAddress } from '../../utils/currentLocation';

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

// Quick tip amounts; the field below still takes a custom number.
const TIP_OPTIONS = [
  { label: 'None', value: 0 },
  { label: '$2', value: 2 },
  { label: '$5', value: 5 },
  { label: '$10', value: 10 },
];

const FindRideScreen = ({ navigation, route }) => {
  const userId = useUserStore((state) => state.userId);
  const userName = useUserStore((state) => state.userName);

  // Prefill data from RideCanceled "Request Again"
  const prefill = route.params?.prefillRide || {};

  const [name, setName] = useState(prefill.name || userName || '');
  const [phone, setPhone] = useState(prefill.phone || '');
  const [passengers, setPassengers] = useState(prefill.passengers || 1);
  const [pickUpTime, setPickUpTime] = useState(prefill.pickUpTime || 'ASAP');
  const [pickUp, setPickUp] = useState(prefill.pickUp || '');
  const [dropOff, setDropOff] = useState(prefill.dropOff || '');
  // Coords come from the Places Autocomplete selection. Free-typed addresses
  // leave these null — the backend will still accept the ride, just without
  // map data. (The map preview hides until at least one coord exists.)
  const [pickUpCoords, setPickUpCoords] = useState(
    prefill.pickUpLat != null && prefill.pickUpLng != null
      ? { lat: prefill.pickUpLat, lng: prefill.pickUpLng }
      : null
  );
  const [dropOffCoords, setDropOffCoords] = useState(
    prefill.dropOffLat != null && prefill.dropOffLng != null
      ? { lat: prefill.dropOffLat, lng: prefill.dropOffLng }
      : null
  );
  const [bidAmount, setBidAmount] = useState(prefill.bidAmount ? String(prefill.bidAmount) : '');
  const [showBid, setShowBid] = useState(!!prefill.bidAmount);
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState({});

  // Any free-text change to the address clears the stored coords —
  // coords are only valid for the place the user explicitly *selected*
  // from the autocomplete dropdown (so the map never shows stale pins).
  // PlacesAutocompleteInput overwrites both text + coords together on select.
  const handlePickUpText = (text) => {
    setPickUp(text);
    setPickUpCoords(null);
  };
  const handleDropOffText = (text) => {
    setDropOff(text);
    setDropOffCoords(null);
  };

  // "Use my location": pickup = where the phone is right now, as a street
  // address plus exact coordinates (so the driver gets a precise pin).
  const handleUseMyLocation = async () => {
    setLocating(true);
    setErrors((e) => ({ ...e, pickUp: undefined }));
    try {
      const result = await getCurrentAddress();
      if (result.error) {
        setErrors((e) => ({ ...e, pickUp: result.error }));
        return;
      }
      setPickUp(result.address);
      setPickUpCoords({ lat: result.lat, lng: result.lng });
    } finally {
      setLocating(false);
    }
  };

  // Quick-pick of a saved Home/Work address. We immediately set the text
  // (instant feedback), then geocode in the background so the map gets a pin
  // without the user having to re-type and pick from the autocomplete.
  const handlePickUpQuickPick = async (address) => {
    setPickUp(address);
    setPickUpCoords(null);
    const result = await geocodeAddress(address);
    // Guard: only apply coords if the field still holds this same address.
    // (Otherwise the user may have moved on and we'd stomp on fresh input.)
    if (result) {
      setPickUp((current) => (current === address ? result.address : current));
      setPickUpCoords({ lat: result.lat, lng: result.lng });
    }
  };
  const handleDropOffQuickPick = async (address) => {
    setDropOff(address);
    setDropOffCoords(null);
    const result = await geocodeAddress(address);
    if (result) {
      setDropOff((current) => (current === address ? result.address : current));
      setDropOffCoords({ lat: result.lat, lng: result.lng });
    }
  };

  // Fetch rider profile so we can prefill phone + offer saved address quick-picks.
  const { data: riderData } = useQuery(GET_SINGLE_RIDER, {
    variables: { id: userId },
    skip: !userId,
  });
  const rider = riderData?.getRider;

  // Backfill name/phone only when the field is still empty —
  // so this never stomps on a "request again" prefill or user typing.
  useEffect(() => {
    if (!rider) return;
    if (!name && rider.name) setName(rider.name);
    if (!phone && rider.phoneNumber) setPhone(rider.phoneNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider]);

  // Renders the Home/Work quick-pick row when the rider has saved addresses.
  // `onPick` should be one of the handle*Text helpers above (so coords are
  // cleared — Home/Work addresses are plain text, no lat/lng available).
  const renderAddressQuickPicks = (onPick) => {
    if (!rider?.homeAddress && !rider?.workAddress) return null;
    return (
      <View style={styles.quickPickRow}>
        {rider.homeAddress ? (
          <TouchableOpacity
            style={styles.quickPickPill}
            onPress={() => onPick(rider.homeAddress)}
          >
            <Ionicons name="home" size={13} color={colors.rider.dark} />
            <Text style={styles.quickPickText}>Home</Text>
          </TouchableOpacity>
        ) : null}
        {rider.workAddress ? (
          <TouchableOpacity
            style={styles.quickPickPill}
            onPress={() => onPick(rider.workAddress)}
          >
            <Ionicons name="briefcase" size={13} color={colors.rider.dark} />
            <Text style={styles.quickPickText}>Work</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

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
        // Coords are only present when the user picked an autocomplete result.
        // Backend accepts nulls for these; no map shows on Confirm if absent.
        pickUpLat: pickUpCoords?.lat ?? null,
        pickUpLng: pickUpCoords?.lng ?? null,
        dropOffLat: dropOffCoords?.lat ?? null,
        dropOffLng: dropOffCoords?.lng ?? null,
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
            <PlacesAutocompleteInput
              value={pickUp}
              onChangeText={handlePickUpText}
              onPlaceSelected={({ address, lat, lng }) => {
                setPickUp(address);
                setPickUpCoords({ lat, lng });
              }}
              placeholder="Search by name or address"
              dotColor={colors.rider.light}
              hasError={!!errors.pickUp}
            />
            <TouchableOpacity
              style={styles.locateButton}
              onPress={handleUseMyLocation}
              disabled={locating}
            >
              <Ionicons name="locate" size={16} color={colors.rider.dark} />
              <Text style={styles.locateText}>
                {locating ? 'Finding you…' : 'Use my current location'}
              </Text>
            </TouchableOpacity>
            {renderAddressQuickPicks(handlePickUpQuickPick)}
            {errors.pickUp && <Text style={styles.errorText}>{errors.pickUp}</Text>}
          </View>

          {/* Dropoff Address */}
          <View style={styles.field}>
            <Text style={styles.label}>Dropoff Address</Text>
            <PlacesAutocompleteInput
              value={dropOff}
              onChangeText={handleDropOffText}
              onPlaceSelected={({ address, lat, lng }) => {
                setDropOff(address);
                setDropOffCoords({ lat, lng });
              }}
              placeholder="Search by name or address"
              dotColor={colors.error.light}
              hasError={!!errors.dropOff}
            />
            {renderAddressQuickPicks(handleDropOffQuickPick)}
            {errors.dropOff && <Text style={styles.errorText}>{errors.dropOff}</Text>}
          </View>

          {/* Map preview — always mounted (RouteMap shows a hint overlay
              until the rider picks at least one autocomplete result).
              Keeping the MapView stably mounted avoids Android's
              `addViewAt: failed to insert view` error when the dropdown
              collapses in the same render tick. */}
          <View style={styles.mapPreviewWrap}>
            <RouteMap
              pickup={pickUpCoords}
              dropoff={dropOffCoords}
              height={180}
              showLegend
            />
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
                ? `$${bidAmount} tip`
                : 'Add a tip (optional)'}
            </Text>
          </TouchableOpacity>

          {showBid && (
            <View style={styles.bidSection}>
              <OptionSelector
                options={TIP_OPTIONS}
                selected={parseInt(bidAmount) || 0}
                onSelect={(value) => setBidAmount(value ? String(value) : '')}
              />
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
              <Text style={styles.bidHint}>
                Optional. Drivers see your tip on the request and may pick you up sooner.
                It's settled with the driver, outside Arryde.
              </Text>
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
  quickPickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickPickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.rider.light + '15',
    borderWidth: 1,
    borderColor: colors.rider.light + '40',
  },
  quickPickText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.rider.dark,
  },
  mapPreviewWrap: {
    marginBottom: 20,
  },
  locateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.rider.light + '15',
    borderWidth: 1,
    borderColor: colors.rider.light + '40',
  },
  locateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.rider.dark,
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
