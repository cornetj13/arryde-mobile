import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore, useUserStore } from '../stores';
import AuthStack from './AuthStack';
import RiderNavigator from './RiderNavigator';
import DriverNavigator from './DriverNavigator';

const RootNavigator = () => {
  const isAuth = useAuthStore((state) => state.isAuth);
  const userType = useUserStore((state) => state.userType);

  return (
    <NavigationContainer>
      {!isAuth ? (
        <AuthStack />
      ) : userType === 'driver' ? (
        <DriverNavigator />
      ) : (
        <RiderNavigator />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;
