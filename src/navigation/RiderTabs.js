import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Rider tab screens
import RiderHomeScreen from '../screens/rider/RiderHomeScreen';
import FavoriteDriversScreen from '../screens/rider/FavoriteDriversScreen';
import RiderHistoryScreen from '../screens/rider/RiderHistoryScreen';
import RiderProfileScreen from '../screens/rider/RiderProfileScreen';

const Tab = createBottomTabNavigator();

const RiderTabs = () => {
  // Android edge-to-edge draws the app BEHIND the system navigation bar
  // (back/home/recents) — a hardcoded height/padding disables React
  // Navigation's automatic safe-area handling, so the system buttons sat on
  // top of the tabs. Extend the bar by the device's real bottom inset.
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.rider.dark,
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
          if (route.name === 'RiderHome') iconName = 'car';
          else if (route.name === 'Favorites') iconName = 'heart';
          else if (route.name === 'RiderHistory') iconName = 'time';
          else if (route.name === 'RiderProfile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="RiderHome"
        component={RiderHomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoriteDriversScreen}
        options={{ tabBarLabel: 'Favorites' }}
      />
      <Tab.Screen
        name="RiderHistory"
        component={RiderHistoryScreen}
        options={{ tabBarLabel: 'History' }}
      />
      <Tab.Screen
        name="RiderProfile"
        component={RiderProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default RiderTabs;
