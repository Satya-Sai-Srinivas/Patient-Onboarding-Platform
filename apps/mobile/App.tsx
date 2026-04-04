import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { setupGlobalErrorHandler } from './src/utils/errorHandler';

export default function App() {
  useEffect(() => {
    // Initialize global error handler
    setupGlobalErrorHandler();
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
