import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Driver tab screens
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import InviteRiderScreen from '../screens/driver/InviteRiderScreen';
import DriverHistoryScreen from '../screens/driver/DriverHistoryScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';

const Tab = createBottomTabNavigator();

const DriverTabs = () => {
  // Android edge-to-edge draws the app BEHIND the system navigation bar —
  // extend the tab bar by the device's real bottom inset so the system
  // buttons don't cover the tabs (see RiderTabs for details).
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.driver.dark,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[200],
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
          height: 65 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'DriverHome') iconName = 'car';
          else if (route.name === 'InviteRider') iconName = 'person-add';
          else if (route.name === 'DriverHistory') iconName = 'time';
          else if (route.name === 'DriverProfile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="InviteRider"
        component={InviteRiderScreen}
        options={{ tabBarLabel: 'Invite' }}
      />
      <Tab.Screen
        name="DriverHistory"
        component={DriverHistoryScreen}
        options={{ tabBarLabel: 'History' }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default DriverTabs;
