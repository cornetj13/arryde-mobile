import { StatusBar } from 'expo-status-bar';
import { ApolloProvider } from '@apollo/client/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import useApollo from './src/graphql/client';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';

export default function App() {
  const client = useApollo();

  return (
    <ApolloProvider client={client}>
      <ThemeProvider>
        <SafeAreaProvider>
          {/* "auto" flips the status bar icons to match the active theme. */}
          <StatusBar style="auto" />
          <RootNavigator />
          <Toast />
        </SafeAreaProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}
