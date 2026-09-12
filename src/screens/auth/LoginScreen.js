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
import { LOGIN_RIDER, LOGIN_DRIVER } from '../../graphql/mutations';
import { useAuthStore, useUserStore } from '../../stores';
import { secureStorage } from '../../utils/secureStorage';

const LoginScreen = ({ navigation }) => {
  const [userType, setUserType] = useState('rider');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setIsAuth = useAuthStore((state) => state.setIsAuth);
  const setUserId = useUserStore((state) => state.setUserId);
  const setUserName = useUserStore((state) => state.setUserName);
  const setUserType_ = useUserStore((state) => state.setUserType);

  const [loginRider, { loading: riderLoading }] = useMutation(LOGIN_RIDER);
  const [loginDriver, { loading: driverLoading }] = useMutation(LOGIN_DRIVER);

  const loading = riderLoading || driverLoading;

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const mutation = userType === 'rider' ? loginRider : loginDriver;
      const { data } = await mutation({
        variables: { email: email.trim(), password },
      });

      const result = data.loginRider || data.loginDriver;

      // Store tokens and user info
      setAccessToken(result.accessToken);
      await secureStorage.setRefreshToken(result.refreshToken);
      setUserId(result.rider?.id || result.driver?.id);
      setUserName(result.rider?.name || result.driver?.name);
      setUserType_(userType);
      setIsAuth(true);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
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
        <Text style={styles.headerTitle}>Welcome Back</Text>
        <Text style={styles.headerSubtitle}>Log in to your account</Text>
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
            {/* Rider/Driver Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  userType === 'rider' && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setUserType('rider');
                  setError('');
                }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    userType === 'rider' && styles.toggleTextActive,
                  ]}
                >
                  Rider
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  userType === 'driver' && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setUserType('driver');
                  setError('');
                }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    userType === 'driver' && styles.toggleTextActive,
                  ]}
                >
                  Driver
                </Text>
              </TouchableOpacity>
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
                autoComplete="email"
                textContentType="emailAddress"
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
                  placeholder="Enter your password"
                  placeholderTextColor={colors.gray[400]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
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

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: userType === 'rider' ? colors.rider.dark : colors.driver.dark },
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  Log In as {userType === 'rider' ? 'Rider' : 'Driver'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password — carries the current account type and any
                typed email through, so the user doesn't retype them. */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() =>
                navigation.navigate('ForgotPassword', {
                  userType,
                  email: email.trim(),
                })
              }
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  forgotText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[600],
    textDecorationLine: 'underline',
  },
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    padding: 4,
    marginBottom: 28,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[500],
  },
  toggleTextActive: {
    color: colors.gray[900],
  },
  fieldContainer: {
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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

export default LoginScreen;
