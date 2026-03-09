import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore, useUserStore } from '../stores';
import AuthStack from './AuthStack';
import RiderTabs from './RiderTabs';
import DriverTabs from './DriverTabs';

const RootNavigator = () => {
  const isAuth = useAuthStore((state) => state.isAuth);
  const userType = useUserStore((state) => state.userType);

  return (
    <NavigationContainer>
      {!isAuth ? (
        <AuthStack />
      ) : userType === 'driver' ? (
        <DriverTabs />
      ) : (
        <RiderTabs />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;
