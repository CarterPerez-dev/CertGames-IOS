// src/navigation/AppNavigator.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SubscriptionScreenIOS from '../screens/subscription/SubscriptionScreenIOS';

// Import the notification overlay
import NotificationOverlay from '../components/NotificationOverlay';
import GlobalErrorHandler from '../components/GlobalErrorHandler';

// Import actions
import { fetchUserData } from '../store/slices/userSlice';

// Import Apple Subscription Service for iOS
import AppleSubscriptionService from '../api/AppleSubscriptionService';

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
  const { userId, status, subscriptionActive } = useSelector((state) => state.user);
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Check if user is already logged in
        const storedUserId = await SecureStore.getItemAsync('userId');
        
        if (storedUserId) {
          // Fetch user data
          await dispatch(fetchUserData(storedUserId));
          
          // Initialize IAP connection for iOS
          if (Platform.OS === 'ios') {
            await AppleSubscriptionService.initializeConnection();
          }
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

  // Determine which navigator to render based on auth and subscription status
  const renderNavigator = () => {
    // If still loading user data, show a loading screen
    if (status === 'loading') {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0C15'}}>
          <ActivityIndicator size="large" color="#6543CC" />
          <Text style={{color: '#FFFFFF', marginTop: 20}}>Loading user data...</Text>
        </View>
      );
    }
    
    // If not logged in, show auth screens
    if (!userId) {
      return <AuthNavigator />;
    }
    
    // If no subscription, direct to subscription screen
    if (!subscriptionActive) {
      // On iOS we should show the iOS subscription screen
      if (Platform.OS === 'ios') {
        // Create a special navigator that starts with subscription screen
        const SubscriptionStack = createNativeStackNavigator();
        
        return (
          <SubscriptionStack.Navigator>
            <SubscriptionStack.Screen 
              name="Subscription" 
              component={SubscriptionScreenIOS} 
              initialParams={{ renewal: true, userId: userId }}
              options={{ headerShown: false }}
            />
          </SubscriptionStack.Navigator>
        );
      } else {
        // On other platforms, we'll use the main navigator but pass subscription as initial screen
        return (
          <MainNavigator 
            initialParams={{ 
              screen: 'Profile',
              params: { showSubscription: true }
            }} 
          />
        );
      }
    }
    
    // User is logged in and has active subscription
    return <MainNavigator />;
  };

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      <NavigationContainer theme={DarkTheme}>
        {renderNavigator()}
      </NavigationContainer>
      <GlobalErrorHandler />
      {userId && <NotificationOverlay />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export default AppNavigator;
