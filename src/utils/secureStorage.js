import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'arryde_refresh_token';

export const secureStorage = {
  async setRefreshToken(token) {
    if (token) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }
  },

  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async removeRefreshToken() {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore errors on deletion
    }
  },
};
