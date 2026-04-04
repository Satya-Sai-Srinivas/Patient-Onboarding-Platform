import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  CardStyleInterpolators,
  StackNavigationOptions,
} from '@react-navigation/stack';
import { RootStackParamList } from '../services/api/types';
import ErrorBoundary from '../components/ErrorBoundary';

// Import screens
import LandingScreen from '../screens/LandingScreen';
import RoleSelectScreen from '../screens/RoleSelectScreen';
import PhoneInputScreen from '../screens/PhoneInputScreen';
import OTPVerifyScreen from '../screens/OTPVerifyScreen';
import QRScanScreen from '../screens/QRScanScreen';
import CheckInSuccessScreen from '../screens/CheckInSuccessScreen';
import PatientQueueDisplayScreen from '../screens/PatientQueueDisplayScreen';

const Stack = createStackNavigator<RootStackParamList>();

// Default screen options with slide transitions
const defaultScreenOptions: StackNavigationOptions = {
  headerShown: false,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  cardStyle: { backgroundColor: '#fff' },
  gestureEnabled: true,
  gestureDirection: 'horizontal',
};

const AppNavigator: React.FC = () => {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Landing"
          screenOptions={defaultScreenOptions}
        >
          {/* Landing Screen */}
          <Stack.Screen
            name="Landing"
            component={LandingScreen}
            options={{
              title: 'Welcome',
              animationEnabled: true,
            }}
          />

          {/* Role Selection Screen */}
          <Stack.Screen
            name="RoleSelect"
            component={RoleSelectScreen}
            options={{
              title: 'Select Role',
              animationEnabled: true,
            }}
          />

          {/* Phone Input Screen */}
          <Stack.Screen
            name="PhoneInput"
            component={PhoneInputScreen}
            options={{
              title: 'Enter Phone',
              animationEnabled: true,
            }}
          />

          {/* OTP Verification Screen */}
          <Stack.Screen
            name="OTPVerify"
            component={OTPVerifyScreen}
            options={{
              title: 'Verify OTP',
              animationEnabled: true,
            }}
          />

          {/* QR Code Scanner Screen */}
          <Stack.Screen
            name="QRScan"
            component={QRScanScreen}
            options={{
              title: 'Scan QR Code',
              animationEnabled: true,
            }}
          />

          {/* Check-In Success Screen */}
          <Stack.Screen
            name="CheckInSuccess"
            component={CheckInSuccessScreen}
            options={{
              title: 'Success',
              gestureEnabled: false, // Prevent swipe back from success screen
              animationEnabled: true,
            }}
          />

          {/* Patient Queue Display Screen */}
          <Stack.Screen
            name="PatientQueueDisplay"
            component={PatientQueueDisplayScreen}
            options={{
              title: 'Patient Queue',
              animationEnabled: true,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default AppNavigator;
