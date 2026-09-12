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
import {
  FORGOT_PASSWORD_RIDER,
  FORGOT_PASSWORD_DRIVER,
} from '../../graphql/mutations';

/*
  Requests a password-reset email. The emailed link opens the WEB reset page
  (arryde.com/reset-password), which already handles choosing a new password —
  so the app only needs to kick off the request, not complete the reset.

  The backend intentionally returns the same success message whether or not
  the account exists (anti-enumeration), so this screen does too.
*/
const ForgotPasswordScreen = ({ navigation, route }) => {
  // Default to whichever account type the user was trying to log in as.
  const [userType, setUserType] = useState(route?.params?.userType || 'rider');
  const [email, setEmail] = useState(route?.params?.email || '');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const [forgotRider, { loading: riderLoading }] = useMutation(
    FORGOT_PASSWORD_RIDER
  );
  const [forgotDriver, { loading: driverLoading }] = useMutation(
    FORGOT_PASSWORD_DRIVER
  );
  const loading = riderLoading || driverLoading;

  const handleSubmit = async () => {
    setError('');
    const trimmed = email.trim();

    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const mutation = userType === 'rider' ? forgotRider : forgotDriver;
      await mutation({ variables: { email: trimmed } });
      setSent(true);
    } catch (err) {
      setError('Unable to send the reset email. Please try again.');
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="mail-outline" size={44} color={colors.rider.dark} />
          </View>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successBody}>
            If an account exists for {email.trim()}, we've sent a link to reset
            your password. The link expires in 1 hour.
          </Text>
          <Text style={styles.successHint}>
            Don't see it? Check your spam folder.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSent(false)}>
            <Text style={styles.linkText}>Use a different email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
          </TouchableOpacity>

          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter the email on your account and we'll send you a reset link.
          </Text>

          {/* Account type — reset mutations differ for riders and drivers */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                userType === 'rider' && styles.typeOptionActive,
              ]}
              onPress={() => setUserType('rider')}
            >
              <Text
                style={[
                  styles.typeText,
                  userType === 'rider' && styles.typeTextActive,
                ]}
              >
                Rider
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeOption,
                userType === 'driver' && styles.typeOptionActive,
              ]}
              onPress={() => setUserType('driver')}
            >
              <Text
                style={[
                  styles.typeText,
                  userType === 'driver' && styles.typeTextActive,
                ]}
              >
                Driver
              </Text>
            </TouchableOpacity>
          </View>

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
            autoComplete="email"
            textContentType="emailAddress"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  scroll: { padding: 24, flexGrow: 1 },
  backButton: { width: 44, height: 44, justifyContent: 'center' },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[500],
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 21,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray[200],
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeOptionActive: { backgroundColor: colors.white },
  typeText: { fontSize: 14, fontWeight: '600', color: colors.gray[500] },
  typeTextActive: { color: colors.gray[900] },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.gray[900],
  },
  errorText: { color: colors.error.dark, marginTop: 12, fontSize: 14 },
  primaryButton: {
    backgroundColor: colors.rider.dark,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  linkText: {
    color: colors.rider.dark,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
  successWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.rider.light + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  successBody: {
    fontSize: 15,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  successHint: {
    fontSize: 13,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 12,
  },
});

export default ForgotPasswordScreen;
