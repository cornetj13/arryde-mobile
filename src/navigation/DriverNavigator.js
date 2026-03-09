import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriverTabs from './DriverTabs';

const Stack = createNativeStackNavigator();

const DriverNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DriverTabs" component={DriverTabs} />
  </Stack.Navigator>
);

export default DriverNavigator;
