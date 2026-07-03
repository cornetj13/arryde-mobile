import { useMemo } from 'react';
import {
  Observable,
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  split,
  HttpLink,
  gql,
  CombinedGraphQLErrors,
} from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { useAuthStore, useUserStore } from '../stores';
import { secureStorage } from '../utils/secureStorage';

/* ============================================
   CONFIG
   ============================================ */

// Platform-aware dev URLs:
//   web        → localhost
//   native     → your computer's LAN IP (so physical devices on same WiFi can reach it)
// NOTE: Update DEV_LAN_IP when your LAN IP changes (check `npx expo start` output).
import { Platform } from 'react-native';

const DEV_LAN_IP = '10.0.0.188';
const DEV_HOST = Platform.OS === 'web' ? 'localhost' : DEV_LAN_IP;

// Production URL is the original Railway subdomain from when the project
// was called "Bellingham Rideshare" — kept rather than renamed to avoid
// breaking the web app's existing prod config. Matches arryde-web's
// VITE_API_GRAPHQL_URI in .env.production.
const API_URL = __DEV__
  ? `http://${DEV_HOST}:3001/graphql`
  : 'https://rideshare-api-production.up.railway.app/graphql';

const WS_URL = __DEV__
  ? `ws://${DEV_HOST}:3001/graphql`
  : 'wss://rideshare-api-production.up.railway.app/graphql';

/* ============================================
   GRAPHQL MUTATION DEFINITIONS (for internal use)
   ============================================ */

const REFRESH_ACCESS_TOKEN_RIDER = gql`
  mutation RefreshAccessTokenRider {
    refreshAccessTokenRider {
      accessToken
      rider {
        id
        name
      }
    }
  }
`;

const REFRESH_ACCESS_TOKEN_DRIVER = gql`
  mutation RefreshAccessTokenDriver {
    refreshAccessTokenDriver {
      accessToken
      driver {
        id
        name
      }
    }
  }
`;

const LOGOUT_RIDER = gql`
  mutation LogoutRider {
    logoutRider {
      message
    }
  }
`;

const LOGOUT_DRIVER = gql`
  mutation LogoutDriver {
    logoutDriver {
      message
    }
  }
`;

/* ============================================
   HELPER FUNCTIONS
   ============================================ */

// Decode base64 for JWT (React Native compatible)
const decodeBase64 = (str) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  const input = str.replace(/[^A-Za-z0-9+/=]/g, '');

  while (i < input.length) {
    const enc1 = chars.indexOf(input.charAt(i++));
    const enc2 = chars.indexOf(input.charAt(i++));
    const enc3 = chars.indexOf(input.charAt(i++));
    const enc4 = chars.indexOf(input.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }

  return output;
};

// Check if the token is expired
const isTokenExpired = (accessToken) => {
  if (!accessToken) return true;

  try {
    const decoded = JSON.parse(decodeBase64(accessToken.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

// Helper to get current auth state
const getAuthState = () => useAuthStore.getState();
const getUserState = () => useUserStore.getState();

/* ============================================
   APOLLO CLIENT SETUP
   ============================================ */

// Shared in-flight refresh promise — concurrent failed operations await the
// SAME refresh instead of racing (a race could return undefined and crash the retry).
let refreshPromise = null;

const useApollo = () => {
  const { setAccessToken, resetAuthState } = useAuthStore();
  const { resetUserState } = useUserStore();

  const resetGlobalState = async () => {
    resetAuthState();
    resetUserState();
    await secureStorage.removeRefreshToken();
  };

  // HTTP link
  const httpLink = new HttpLink({
    uri: API_URL,
    // No credentials: 'include' — mobile doesn't use cookies
  });

  // WebSocket link
  const wsLink = new GraphQLWsLink(
    createClient({
      url: WS_URL,
      retryAttempts: 5,
      retryWait: async (retries) => {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(1000 * Math.pow(2, retries), 10000))
        );
      },
      connectionParams: () => {
        const { accessToken } = getAuthState();
        return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      },
    })
  );

  // Auth link — attaches JWT and refresh token headers
  const authLink = new ApolloLink((operation, forward) => {
    const publicOperations = [
      'LoginDriver',
      'LoginRider',
      'SignupRider',
      'RefreshAccessTokenRider',
      'RefreshAccessTokenDriver',
      'LogoutRider',
      'LogoutDriver',
    ];

    const operationName = operation.operationName;
    const headers = {};

    // Add auth header for non-public operations
    if (!publicOperations.includes(operationName)) {
      const { accessToken } = getAuthState();
      if (typeof accessToken === 'string' && accessToken.length > 0) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    // For refresh/logout, send refresh token via header (mobile has no cookies)
    if (
      ['RefreshAccessTokenRider', 'RefreshAccessTokenDriver', 'LogoutRider', 'LogoutDriver'].includes(operationName)
    ) {
      // We need to get the refresh token synchronously here.
      // Since SecureStore is async, we attach it in the operation context beforehand.
      const refreshToken = operation.getContext().refreshToken;
      if (refreshToken) {
        headers['X-Refresh-Token'] = refreshToken;
      }
    }

    if (Object.keys(headers).length > 0) {
      operation.setContext({ headers });
    }

    return forward(operation);
  });

  // Refresh the access token.
  // Returns a shared in-flight promise: if a refresh is already running, all
  // callers await the same one (and get the same result) instead of getting
  // undefined back from an early return.
  const refreshAccessToken = (apolloClient) => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        const { userType } = getUserState();
        const mutation =
          userType === 'rider'
            ? REFRESH_ACCESS_TOKEN_RIDER
            : REFRESH_ACCESS_TOKEN_DRIVER;

        // Get refresh token from secure storage to pass via header
        const refreshToken = await secureStorage.getRefreshToken();

        const { data } = await apolloClient.mutate({
          mutation,
          context: { refreshToken },
        });

        return data.refreshAccessTokenRider || data.refreshAccessTokenDriver;
      } catch (error) {
        const serverErrors = [
          'REFRESH_ACCESS_TOKEN_ERROR',
          'NO_REFRESH_TOKEN',
          'INVALID_REFRESH_TOKEN',
          'MISMATCHED_USER',
          'SESSION_INVALIDATED',
          'INVALID_TOKEN',
        ];

        // Apollo Client v4: GraphQL errors arrive wrapped in CombinedGraphQLErrors,
        // not as a top-level `graphQLErrors` array (that's the v3 shape).
        const errorCode = CombinedGraphQLErrors.is(error)
          ? error.errors[0]?.extensions?.code
          : null;
        if (errorCode && serverErrors.includes(errorCode)) {
          await forceLogout(apolloClient);
        }

        throw error;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  // Force logout on auth failure
  const forceLogout = async (apolloClient) => {
    const { userType } = getUserState();
    const mutation = userType === 'rider' ? LOGOUT_RIDER : LOGOUT_DRIVER;
    const refreshToken = await secureStorage.getRefreshToken();

    try {
      await apolloClient.mutate({
        mutation,
        context: { refreshToken },
      });
    } catch {
      // Continue with local cleanup even if server logout fails
    }

    await resetGlobalState();
    await apolloClient.clearStore();
  };

  // Error link — catches UNAUTHORIZED, refreshes the access token, retries once.
  // Apollo Client v4: the handler receives { error, operation, forward }, and
  // GraphQL errors arrive wrapped in a CombinedGraphQLErrors instance (the old
  // v3 `graphQLErrors` argument no longer exists).
  const errorLink = new ErrorLink(({ error, operation, forward }) => {
    // Only handle GraphQL errors; network errors fall through untouched.
    if (!CombinedGraphQLErrors.is(error)) return;

    // Operations the backend treats as fully public (no checkAuth).
    // CreateRide/GetRide must NOT be here — for a logged-in rider they ARE
    // protected. Anonymous callers are excluded below by the `userType` check.
    const publicOperations = ['GetAvailableDrivers', 'GetUnavailableDrivers'];

    const operationName = operation.operationName;
    const { userType } = getUserState();

    const hasAuthError = error.errors.some(
      (err) => err.extensions?.code === 'UNAUTHORIZED'
    );

    // Bail unless this is an auth error for a logged-in user on a protected op.
    if (!hasAuthError || !userType || publicOperations.includes(operationName)) {
      return;
    }

    const { accessToken } = getAuthState();
    if (!isTokenExpired(accessToken)) return;

    // Refresh the token, then retry the operation. ErrorLink only retries a
    // given operation once, so a still-failing retry won't loop forever.
    return new Observable((observer) => {
      refreshAccessToken(client)
        .then((newAccessTokenData) => {
          const newAccessToken = newAccessTokenData.accessToken;
          setAccessToken(newAccessToken);

          const oldHeaders = operation.getContext().headers;
          operation.setContext({
            headers: {
              ...oldHeaders,
              Authorization: `Bearer ${newAccessToken}`,
            },
          });

          forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer),
          });
        })
        .catch((refreshErr) => observer.error(refreshErr));
    });
  });

  // Split link — subscriptions via WS, everything else via HTTP
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    ApolloLink.from([errorLink, authLink, httpLink])
  );

  const client = useMemo(() => {
    return new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache({
        typePolicies: {
          Query: {
            fields: {
              getAvailableDrivers: { maxAge: 30 },
              getFavoriteDrivers: { maxAge: 30 },
            },
          },
        },
      }),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network',
          nextFetchPolicy: 'cache-first',
          errorPolicy: 'none',
        },
        query: {
          fetchPolicy: 'cache-and-network',
          errorPolicy: 'all',
        },
        mutate: {
          refetchQueries: false,
          awaitRefetchQueries: false,
        },
      },
    });
  }, []);

  return client;
};

export default useApollo;
