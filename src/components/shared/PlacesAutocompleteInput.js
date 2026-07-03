import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

/**
 * Google Places Autocomplete (New) input for React Native.
 *
 * Uses the HTTP/REST endpoints (NOT the JS SDK), so no native module is required
 * for the autocomplete itself. Native maps still need react-native-maps.
 *
 * Props:
 *  - value:            string  — controlled text value
 *  - onChangeText:     (s) => void — fires on every keystroke (use for free-text validation/state)
 *  - onPlaceSelected:  ({ address, lat, lng }) => void — fires when a suggestion is picked
 *  - placeholder:      string
 *  - dotColor:         string — left-edge dot color (matches existing FindRide style)
 *  - hasError:         boolean — outline-red when truthy
 *  - locationBias:     { lat, lng } | null — optional bias center (defaults to Bellingham)
 *
 * Cost note: a "session" bundles all keystrokes + one selection into a single
 * billing event. We mint a new session token on mount and after every selection.
 */
const PLACES_API_BASE = 'https://places.googleapis.com/v1';
const DEFAULT_BIAS = { lat: 48.7519, lng: -122.4787 }; // Bellingham, WA
const BIAS_RADIUS_M = 50000;
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 250;

// Non-cryptographic random — Google accepts any consistent string.
const newSessionToken = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

const PlacesAutocompleteInput = ({
  value,
  onChangeText,
  onPlaceSelected,
  placeholder,
  dotColor,
  hasError,
  locationBias,
}) => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionTokenRef = useRef(newSessionToken());
  const debounceRef = useRef(null);
  const lastQueryRef = useRef('');

  // Lazily warn — once — if the key isn't set, so devs know why autocomplete
  // is silently inert.
  useEffect(() => {
    if (!apiKey) {
      console.warn(
        '[PlacesAutocompleteInput] EXPO_PUBLIC_GOOGLE_API_KEY is not set; autocomplete will be disabled.'
      );
    }
  }, [apiKey]);

  const fetchSuggestions = useCallback(
    async (input) => {
      if (!apiKey || input.length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      const bias = locationBias || DEFAULT_BIAS;
      const body = {
        input,
        sessionToken: sessionTokenRef.current,
        includedRegionCodes: ['us'],
        includedPrimaryTypes: ['establishment', 'geocode'],
        locationBias: {
          circle: {
            center: { latitude: bias.lat, longitude: bias.lng },
            radius: BIAS_RADIUS_M,
          },
        },
      };

      setLoading(true);
      try {
        const res = await fetch(`${PLACES_API_BASE}/places:autocomplete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify(body),
        });
        // Stale-response guard: if user has kept typing, ignore this result.
        if (input !== lastQueryRef.current) return;

        if (!res.ok) {
          setSuggestions([]);
          setShowDropdown(false);
          return;
        }
        const json = await res.json();
        const list = json.suggestions || [];
        setSuggestions(list);
        setShowDropdown(list.length > 0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        if (input === lastQueryRef.current) setLoading(false);
      }
    },
    [apiKey, locationBias]
  );

  const handleTextChange = (text) => {
    onChangeText?.(text);
    lastQueryRef.current = text;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), DEBOUNCE_MS);
  };

  const handleSelect = async (suggestion) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    // Use display text as immediate UI feedback before we have full details.
    const tentativeAddress = prediction.text?.text || '';
    onChangeText?.(tentativeAddress);
    setShowDropdown(false);
    setSuggestions([]);

    // Place ID comes as "places/ChIJ..." — strip the prefix.
    const placeId = prediction.placeId || (prediction.place || '').replace(/^places\//, '');
    if (!placeId) return;

    try {
      const res = await fetch(
        `${PLACES_API_BASE}/places/${placeId}?sessionToken=${encodeURIComponent(sessionTokenRef.current)}`,
        {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'displayName,formattedAddress,location',
          },
        }
      );
      if (!res.ok) return;
      const json = await res.json();
      const lat = json.location?.latitude;
      const lng = json.location?.longitude;
      const address = json.formattedAddress || json.displayName?.text || tentativeAddress;

      if (lat != null && lng != null) {
        onChangeText?.(address);
        onPlaceSelected?.({ address, lat, lng });
      }
    } catch {
      // Selection still works as plain text even if details fetch fails.
    } finally {
      // Billing session consumed — rotate token for the next search.
      sessionTokenRef.current = newSessionToken();
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputRow,
          hasError && styles.inputRowError,
          showDropdown && styles.inputRowOpen,
        ]}
      >
        {dotColor ? (
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        ) : null}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.gray[400]}
            style={styles.trailingIcon}
          />
        ) : value && value.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              onChangeText?.('');
              setSuggestions([]);
              setShowDropdown(false);
              lastQueryRef.current = '';
            }}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            style={styles.trailingIcon}
          >
            <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showDropdown && suggestions.length > 0 ? (
        <View style={styles.dropdown}>
          {suggestions.map((suggestion, idx) => {
            const prediction = suggestion.placePrediction || {};
            const main = prediction.structuredFormat?.mainText?.text || prediction.text?.text || '';
            const secondary = prediction.structuredFormat?.secondaryText?.text || '';
            const key = prediction.placeId || prediction.place || `s-${idx}`;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.dropdownItem,
                  idx === suggestions.length - 1 && styles.dropdownItemLast,
                ]}
                onPress={() => handleSelect(suggestion)}
                activeOpacity={0.6}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.gray[500]}
                  style={styles.dropdownIcon}
                />
                <View style={styles.dropdownTextWrap}>
                  <Text style={styles.dropdownMain} numberOfLines={1}>
                    {main}
                  </Text>
                  {secondary ? (
                    <Text style={styles.dropdownSecondary} numberOfLines={1}>
                      {secondary}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 10,
  },
  inputRowError: {
    borderColor: colors.error.light,
  },
  inputRowOpen: {
    // Square the bottom when the dropdown is showing so they visually connect.
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[900],
  },
  trailingIcon: {
    marginRight: 12,
  },
  dropdown: {
    backgroundColor: colors.white,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray[300],
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: 10,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownIcon: {
    marginTop: 1,
  },
  dropdownTextWrap: {
    flex: 1,
  },
  dropdownMain: {
    fontSize: 15,
    color: colors.gray[900],
    fontWeight: '500',
  },
  dropdownSecondary: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 1,
  },
});

export default PlacesAutocompleteInput;
