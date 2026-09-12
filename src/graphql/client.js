import { useEffect, useMemo } from 'react';
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

// Set EXPO_PUBLIC_USE_PROD_API=true in .env to point a DEV session at the
// production backend — for testing the mobile experience against live data
// (e.g. alongside Dave) without a local backend or a matching LAN IP.
// Restart with `npx expo start --clear` after changing it.
const USE_PROD_API = process.env.EXPO_PUBLIC_USE_PROD_API === 'true';

// Production URL is the original Railway subdomain from when the project
// was called "Bellingham Rideshare" — kept rather than renamed to avoid
// breaking the web app's existing prod config. Matches arryde-web's
// VITE_API_GRAPHQL_URI in .env.production.
const PROD_API_URL = 'https://rideshare-api-production.up.railway.app/graphql';
const PROD_WS_URL = 'wss://rideshare-api-production.up.railway.app/graphql';

const API_URL =
  __DEV__ && !USE_PROD_API ? `http://${DEV_HOST}:3001/graphql` : PROD_API_URL;

const WS_URL =
  __DEV__ && !USE_PROD_API ? `ws://${DEV_HOST}:3001/graphql` : PROD_WS_URL;

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

// Decode base64 for JWT (React Native compatible).
// JWTs are base64URL encoded — convert to standard base64 first (the old
// sanitizer stripped '-' and '_' outright, corrupting the payload).
const decodeBase64 = (rawStr) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  let str = rawStr.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4 !== 0) str += '=';
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

// Check if the token is expired. `leewaySeconds` treats a token as expired
// slightly early so we never present one that dies in transit.
const isTokenExpired = (accessToken, leewaySeconds = 30) => {
  if (!accessToken) return true;

  try {
    const decoded = JSON.parse(decodeBase64(accessToken.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime + leewaySeconds;
  } catch {
    return true;
  }
};

// Helper to get current auth state
const getAuthState = () => useAuthStore.getState();
const getUserState = () => useUserStore.getState();

/* ============================================
   WEBSOCKET CLIENT (module scope — created once)
   ============================================ */

// The server verifies the JWT at connect time and REJECTS invalid tokens —
// graphql-ws treats that rejection as fatal and stops retrying, killing
// every subscription (even the public ones). Two rules keep the socket
// alive and correctly identified:
//   1. NEVER present an expired token — connect anonymously instead (the
//      server allows token-less connections; they get public events).
//   2. Restart the socket whenever the access token changes (login, logout,
//      refresh) — connectionParams are only read at connect time, and
//      subscription filters use the identity the socket connected with.
const wsClient = createClient({
  url: WS_URL,
  retryAttempts: 5,
  retryWait: async (retries) => {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(1000 * Math.pow(2, retries), 10000))
    );
  },
  connectionParams: () => {
    const { accessToken } = getAuthState();
    if (accessToken && !isTokenExpired(accessToken)) {
      return { authorization: `Bearer ${accessToken}` };
    }
    return {};
  },
});

let lastWsToken = null;
useAuthStore.subscribe((state) => {
  const token = state.accessToken ?? null;
  if (token === lastWsToken) return;
  lastWsToken = token;
  try {
    wsClient.restart();
  } catch (e) {
    // Socket not connected yet — nothing to restart.
  }
});

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

  // WebSocket link (wraps the module-scope wsClient above)
  const wsLink = new GraphQLWsLink(wsClient);

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
        // Codes the backend actually throws for a dead session — the only
        // way forward is a fresh login.
        const serverErrors = [
          'NO_REFRESH_TOKEN',
          'SESSION_INVALIDATED',
          'INVALID_TOKEN',
          'REFRESH_ACCESS_TOKEN_ERROR',
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

  // Bootstrap: a cold start restores a persisted session whose access token
  // (10 min TTL) is almost always expired. Without a proactive refresh, the
  // WebSocket connects anonymously and filtered subscriptions stay silent
  // until some HTTP query happens to 401. Refresh immediately; the auth
  // store subscriber then restarts the socket with the fresh identity.
  useEffect(() => {
    const { isAuth, accessToken } = getAuthState();
    if (!isAuth || !isTokenExpired(accessToken)) return;

    refreshAccessToken(client)
      .then((data) => {
        if (data?.accessToken) setAccessToken(data.accessToken);
      })
      .catch(() => {
        // Dead session — refreshAccessToken already force-logs-out on the
        // fatal codes; anything else just stays logged out gracefully.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  return client;
};

export default useApollo;
