// src/navigation/AppNavigator.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Import actions
import { fetchUserData } from '../store/slices/userSlice';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Custom dark theme
const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6543CC',
    background: '#0B0C15',
    card: '#1A1A2A',
    text: '#FFFFFF',
    border: '#333344',
    notification: '#FF4C8B',
  },
};

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { userId, status } = useSelector((state) => state.user);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Check if user is already logged in
        const storedUserId = await SecureStore.getItemAsync('userId');
        
        if (storedUserId) {
          // Fetch user data
          await dispatch(fetchUserData(storedUserId));
        }
      } catch (e) {
        console.warn('Error preparing app:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [dispatch]);

  if (!appIsReady) {
    return null;
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      {userId ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;
