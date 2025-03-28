// src/navigation/AppNavigator.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
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

// Import API client for store injection
import apiClient, { injectStore } from '../api/apiClient';
import store from '../store';

// Inject store into apiClient for network status management
injectStore(store);

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
  const { userId, status, subscriptionActive, error } = useSelector((state) => state.user);
  const [appIsReady, setAppIsReady] = useState(false);
  const [initError, setInitError] = useState(null);

  // Improved prepare function with better error handling and logging
  const prepare = async () => {
    try {
      // Check if user is already logged in
      const storedUserId = await SecureStore.getItemAsync('userId');
      
      if (storedUserId) {
        // Fetch user data
        try {
          console.log("Fetching user data for:", storedUserId);
          const userData = await dispatch(fetchUserData(storedUserId)).unwrap();
          console.log("User data fetched successfully:", userData);  // Log the actual data
          
          // Verify the data is usable
          if (!userData || !userData._id) {
            console.warn("User data incomplete:", userData);
          }
        } catch (fetchError) {
          console.error("Error fetching user data:", fetchError);
          setInitError("Could not fetch user data. Please check your network connection.");
        }
        
        // Initialize IAP connection for iOS
        if (Platform.OS === 'ios') {
          try {
            await AppleSubscriptionService.initializeConnection();
            console.log("IAP connection initialized");
          } catch (iapError) {
            console.error("Error initializing IAP:", iapError);
            // Non-fatal error, continue without IAP
          }
        }
      }
    } catch (e) {
      console.warn('Error preparing app:', e);
      setInitError("Error initializing app: " + e.message);
    } finally {
      // Tell the application to render
      setAppIsReady(true);
      await SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    prepare();
  }, [dispatch]);

  // Determine which navigator to render based on auth and subscription status
  const renderNavigator = () => {
    if (initError) {
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0C15', padding: 20}}>
          <Text style={{color: '#FF4C8B', marginBottom: 20, textAlign: 'center'}}>{initError}</Text>
          <TouchableOpacity 
            style={{
              backgroundColor: '#6543CC',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 8
            }}
            onPress={() => {
              setInitError(null);
              setAppIsReady(false);
              prepare(); // Use the prepare function defined above
            }}
          >
            <Text style={{color: '#FFFFFF', fontWeight: 'bold'}}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
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
              name="SubscriptionIOS" 
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
