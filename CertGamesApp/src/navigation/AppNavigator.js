// src/navigation/AppNavigator.js
import React, { useEffect, useState, useCallback } from 'react';
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

// Add debugging log function
const debugLog = (message) => {
  console.log(`[AppNavigator-DEBUG] ${message}`);
};

const AppNavigator = () => {
  debugLog("AppNavigator rendering");
  const dispatch = useDispatch();
  
  // Add rendering counter to track re-renders
  const [renderCount, setRenderCount] = useState(0);
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    debugLog(`Re-render #${renderCount+1}`);
  }, []);
  
  // Extract Redux state with debug logging
  const { userId, status, subscriptionActive, error } = useSelector((state) => {
    const userData = state.user;
    debugLog(`Redux state: userId=${userData.userId?.substring(0,8) || 'null'}, status=${userData.status}, subscriptionActive=${userData.subscriptionActive}`);
    return userData;
  });
  
  const [appIsReady, setAppIsReady] = useState(false);
  const [initError, setInitError] = useState(null);
  
  // NEW: Add initialLoadComplete state to track first load
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Improved prepare function with better error handling and logging
  const prepare = async () => {
    debugLog("Starting prepare() function");
    try {
      // Check if user is already logged in
      const storedUserId = await SecureStore.getItemAsync('userId');
      debugLog(`Found stored userId: ${storedUserId?.substring(0,8) || 'null'}`);
      
      if (storedUserId) {
        // Fetch user data
        try {
          debugLog(`Fetching user data for: ${storedUserId.substring(0,8)}`);
          const userData = await dispatch(fetchUserData(storedUserId)).unwrap();
          debugLog(`User data fetched successfully for ${storedUserId.substring(0,8)}`);
          
          // Verify the data is usable
          if (!userData || !userData._id) {
            debugLog("User data incomplete or invalid");
          } else {
            debugLog(`User data loaded: subscription=${userData.subscriptionActive}`);
          }
        } catch (fetchError) {
          debugLog(`Error fetching user data: ${fetchError.message}`);
          setInitError("Could not fetch user data. Please check your network connection.");
        }
        
        // Initialize IAP connection for iOS
        if (Platform.OS === 'ios') {
          try {
            debugLog("Initializing IAP connection");
            await AppleSubscriptionService.initializeConnection();
            debugLog("IAP connection initialized successfully");
          } catch (iapError) {
            debugLog(`Error initializing IAP: ${iapError.message}`);
            // Non-fatal error, continue without IAP
          }
        }
      } else {
        debugLog("No stored userId found - user not logged in");
      }
    } catch (e) {
      debugLog(`Error in prepare(): ${e.message}`);
      setInitError("Error initializing app: " + e.message);
    } finally {
      // Tell the application to render
      debugLog("Setting appIsReady to true");
      setAppIsReady(true);
      
      // NEW: Mark initial load as complete
      setInitialLoadComplete(true);
      
      await SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    debugLog("Running initial useEffect");
    prepare();
    return () => debugLog("Cleanup for initial useEffect");
  }, [dispatch]);

  // *** FIX: Memoize subscription status to prevent navigation loops ***
  const memoizedSubscriptionStatus = React.useMemo(() => {
    debugLog(`Creating memoized subscription status: ${subscriptionActive}`);
    return subscriptionActive;
  }, [subscriptionActive]);
  
  // Log when subscription status changes
  useEffect(() => {
    debugLog(`Subscription status changed to: ${subscriptionActive}`);
  }, [subscriptionActive]);
  
  // Log when user ID changes
  useEffect(() => {
    debugLog(`User ID changed to: ${userId?.substring(0,8) || 'null'}`);
  }, [userId]);
  
  // Log when status changes
  useEffect(() => {
    debugLog(`Redux status changed to: ${status}`);
  }, [status]);

  // Determine which navigator to render based on auth and subscription status
  const renderNavigator = useCallback(() => {
    debugLog(`renderNavigator called with: 
      userId = ${userId?.substring(0,8) || 'null'}, 
      status = ${status}, 
      subscriptionActive = ${subscriptionActive},
      memoizedStatus = ${memoizedSubscriptionStatus},
      initialLoadComplete = ${initialLoadComplete}`);

    if (initError) {
      debugLog("Showing error screen due to init error");
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
              debugLog("Retry button pressed");
              setInitError(null);
              setAppIsReady(false);
              prepare();
            }}
          >
            <Text style={{color: '#FFFFFF', fontWeight: 'bold'}}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // FIXED: Only show loading during initial app load, not during data refreshes
    if (status === 'loading' && !initialLoadComplete) {
      debugLog("Showing loading screen for initial load only");
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0C15'}}>
          <ActivityIndicator size="large" color="#6543CC" />
          <Text style={{color: '#FFFFFF', marginTop: 20}}>Loading user data...</Text>
        </View>
      );
    }
    
    // If not logged in, show auth screens
    if (!userId) {
      debugLog("Showing AuthNavigator - user not logged in");
      return <AuthNavigator />;
    }
    
    // *** FIX: Use memoized subscription status instead of actual state ***
    // If no subscription, direct to subscription screen
    if (!memoizedSubscriptionStatus) {
      debugLog("Showing subscription screen - no active subscription");
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
        debugLog("Using MainNavigator with subscription params for non-iOS platform");
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
    debugLog("Showing MainNavigator - user logged in and has active subscription");
    return <MainNavigator />;
  }, [userId, status, memoizedSubscriptionStatus, initError, initialLoadComplete]); // Added initialLoadComplete to deps

  if (!appIsReady) {
    debugLog("App not ready yet, returning null");
    return null;
  }

  debugLog("Rendering full app with NavigationContainer");
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
