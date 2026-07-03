import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RiderTabs from './RiderTabs';
import FindRideScreen from '../screens/ride/FindRideScreen';
import ChooseDriverScreen from '../screens/ride/ChooseDriverScreen';
import ConfirmRideScreen from '../screens/ride/ConfirmRideScreen';
import WaitingForRideScreen from '../screens/ride/WaitingForRideScreen';
import PickupInfoScreen from '../screens/ride/PickupInfoScreen';
import RideCompletedScreen from '../screens/ride/RideCompletedScreen';
import RideCanceledScreen from '../screens/ride/RideCanceledScreen';
import RideExpiredScreen from '../screens/ride/RideExpiredScreen';
import DriverProfileViewScreen from '../screens/rider/DriverProfileViewScreen';

const Stack = createNativeStackNavigator();

const RiderNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RiderTabs" component={RiderTabs} />
    <Stack.Screen name="FindRide" component={FindRideScreen} />
    <Stack.Screen name="ChooseDriver" component={ChooseDriverScreen} />
    <Stack.Screen name="ConfirmRide" component={ConfirmRideScreen} />
    <Stack.Screen name="WaitingForRide" component={WaitingForRideScreen} />
    <Stack.Screen name="PickupInfo" component={PickupInfoScreen} />
    <Stack.Screen name="RideCompleted" component={RideCompletedScreen} />
    <Stack.Screen name="RideCanceled" component={RideCanceledScreen} />
    <Stack.Screen name="RideExpired" component={RideExpiredScreen} />
    <Stack.Screen name="DriverProfileView" component={DriverProfileViewScreen} />
  </Stack.Navigator>
);

export default RiderNavigator;
