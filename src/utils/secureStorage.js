import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'arryde_refresh_token';

// Web fallback using localStorage (SecureStore is not available on web)
const webStorage = {
  async setRefreshToken(token) {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  },
  async getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  async removeRefreshToken() {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Native storage using expo-secure-store (encrypted)
const nativeStorage = {
  async setRefreshToken(token) {
    if (token) {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }
  },
  async getRefreshToken() {
    try {
      const SecureStore = require('expo-secure-store');
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async removeRefreshToken() {
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore errors on deletion
    }
  },
};

export const secureStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
