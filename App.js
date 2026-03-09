import { StatusBar } from 'expo-status-bar';
import { ApolloProvider } from '@apollo/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import useApollo from './src/graphql/client';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const client = useApollo();

  return (
    <ApolloProvider client={client}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <RootNavigator />
        <Toast />
      </SafeAreaProvider>
    </ApolloProvider>
  );
}
