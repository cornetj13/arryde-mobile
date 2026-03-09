import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@apollo/client/react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { SIGNUP_RIDER } from '../../graphql/mutations';
import { useAuthStore, useUserStore } from '../../stores';
import { secureStorage } from '../../utils/secureStorage';
import { formatPhone } from '../../utils/formatting';

const SignupScreen = ({ navigation, route }) => {
  const inviteCodeParam = route?.params?.inviteCode || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(inviteCodeParam);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setIsAuth = useAuthStore((state) => state.setIsAuth);
  const setUserId = useUserStore((state) => state.setUserId);
  const setUserName = useUserStore((state) => state.setUserName);
  const setUserType = useUserStore((state) => state.setUserType);

  const [signupRider, { loading }] = useMutation(SIGNUP_RIDER);

  const handlePhoneChange = (text) => {
    // Strip non-numeric characters for processing
    const numeric = text.replace(/\D/g, '');

    // Limit to 10 digits
    if (numeric.length > 10) return;

    // Auto-format as user types
    if (numeric.length === 0) {
      setPhone('');
    } else if (numeric.length <= 3) {
      setPhone(`(${numeric}`);
    } else if (numeric.length <= 6) {
      setPhone(`(${numeric.slice(0, 3)}) ${numeric.slice(3)}`);
    } else {
      setPhone(`(${numeric.slice(0, 3)}) ${numeric.slice(3, 6)}-${numeric.slice(6)}`);
    }
  };

  const handleSignup = async () => {
    setError('');

    // Validate fields
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Format phone number
    const formattedPhone = formatPhone(phone);
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      const variables = {
        name: name.trim(),
        email: email.trim(),
        password,
        phoneNumber: formattedPhone,
      };

      if (inviteCode.trim()) {
        variables.inviteCode = inviteCode.trim();
      }

      const { data } = await signupRider({ variables });

      const result = data.signupRider;

      // Store tokens and user info
      setAccessToken(result.accessToken);
      await secureStorage.setRefreshToken(result.refreshToken);
      setUserId(result.rider.id);
      setUserName(result.rider.name);
      setUserType('rider');
      setIsAuth(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Green header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSubtitle}>Sign up as a rider</Text>
      </View>

      {/* White card area */}
      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.card}>
            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.gray[400]}
                autoCapitalize="words"
              />
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.gray[400]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Phone Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="(360) 555-1234"
                placeholderTextColor={colors.gray[400]}
                keyboardType="phone-pad"
              />
            </View>

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor={colors.gray[400]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.gray[500]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.gray[400]}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.gray[500]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Invite Code Field (Optional) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Invite Code <Text style={styles.optionalText}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Enter invite code"
                placeholderTextColor={colors.gray[400]}
                autoCapitalize="characters"
              />
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
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
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.gold.light,
  },
  formWrapper: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  card: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  optionalText: {
    fontWeight: '400',
    color: colors.gray[400],
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[900],
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  errorText: {
    color: colors.error.light,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.rider.dark,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default SignupScreen;
