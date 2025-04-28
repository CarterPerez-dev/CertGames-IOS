// src/navigation/AppNavigator.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SubscriptionScreenIOS from '../screens/subscription/SubscriptionScreenIOS';
import CreateUsernameScreen from '../screens/auth/CreateUsernameScreen';
import PremiumFeaturePrompt from '../components/PremiumFeaturePrompt';

// Import the notification overlay
import NotificationOverlay from '../components/NotificationOverlay';
import GlobalErrorHandler from '../components/GlobalErrorHandler';

// Import actions
import { fetchUserData, checkSubscription } from '../store/slices/userSlice';

// Import Apple Subscription Service for iOS
import AppleSubscriptionService from '../api/AppleSubscriptionService';

// Import Google Auth Service
import GoogleAuthService from '../api/GoogleAuthService';

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
  
  // Extract Redux state with debug logging
  const { userId, status, subscriptionActive, error, needsUsername, oauth_provider, subscriptionType } = useSelector((state) => {
    const userData = state.user;
    debugLog(`Redux state: userId=${userData.userId?.substring(0,8) || 'null'}, status=${userData.status}, subscriptionActive=${userData.subscriptionActive}, subscriptionType=${userData.subscriptionType || 'unknown'}`);
    return userData;
  }, (prev, next) => {
    // Custom equality check to prevent unnecessary re-renders
    return (
      prev.userId === next.userId && 
      prev.status === next.status && 
      prev.subscriptionActive === next.subscriptionActive &&
      prev.needsUsername === next.needsUsername &&
      prev.subscriptionType === next.subscriptionType
    );
  });
  
  const [appIsReady, setAppIsReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  
  // Use a ref to track whether the app has been initialized
  // This prevents duplicate initialization calls
  const appInitializedRef = React.useRef(false);
  
  // Store last known good state to help recover from errors
  const lastKnownGoodState = React.useRef({
    userId: null,
    subscriptionActive: false,
    needsUsername: false
  });

  // Improved prepare function with better error handling and logging
  const prepare = async () => {
    // Prevent multiple initialization attempts
    if (appInitializedRef.current) return;
    appInitializedRef.current = true;
    
    debugLog("Starting prepare() function");
    try {
      // Initialize Google Auth Service
      try {
        await GoogleAuthService.initialize();
        debugLog("Google Auth Service initialized");
      } catch (googleAuthError) {
        debugLog(`Error initializing Google Auth Service: ${googleAuthError.message}`);
        // Non-blocking error, continue app initialization
      }
      
      // Check if user is already logged in
      const storedUserId = await SecureStore.getItemAsync('userId');
      debugLog(`Found stored userId: ${storedUserId?.substring(0,8) || 'null'}`);
      
      if (storedUserId) {
        // Fetch user data
        try {
          debugLog(`Fetching user data for: ${storedUserId.substring(0,8)}`);
          const userData = await dispatch(fetchUserData(storedUserId)).unwrap();
          debugLog(`User data fetched successfully for ${storedUserId.substring(0,8)}`);
          
          // Store last known good state
          if (userData && userData._id) {
            lastKnownGoodState.current = {
              userId: userData._id,
              subscriptionActive: !!userData.subscriptionActive,
              needsUsername: !!userData.needs_username,
              subscriptionType: userData.subscriptionType || 'free'
            };
            debugLog(`Updated last known good state: ${JSON.stringify(lastKnownGoodState.current)}`);
          }
          
          // Explicitly check subscription status
          if (userData && userData._id) {
            try {
              await dispatch(checkSubscription(userData._id)).unwrap();
              debugLog("Subscription status checked and updated");
            } catch (subError) {
              debugLog(`Error checking subscription: ${subError.message}`);
              // Non-fatal - continue with last known subscription status
            }
          }
        } catch (fetchError) {
          debugLog(`Error fetching user data: ${fetchError.message}`);
          
          // Check if this is a network error
          if (fetchError.message && fetchError.message.includes('network')) {
            setInitError("Could not fetch user data. Please check your network connection.");
          } else {
            // If recovery attempt is too high, clear userId and start fresh
            if (recoveryAttempt > 2) {
              await SecureStore.deleteItemAsync('userId');
              debugLog("Cleared userId from SecureStore after multiple failures");
            } else {
              // Increment recovery attempt for next time
              setRecoveryAttempt(prev => prev + 1);
              debugLog(`Increased recovery attempt to ${recoveryAttempt + 1}`);
            }
          }
        }
        
        // Initialize IAP connection for iOS
        if (Platform.OS === 'ios') {
          try {
            debugLog("Initializing IAP connection");
            await AppleSubscriptionService.initializeConnection();
            debugLog("IAP connection initialized successfully");
            
            // Verify subscription status with Apple
            if (subscriptionActive) {
              try {
                const verificationResult = await AppleSubscriptionService.verifySubscription();
                debugLog(`Apple subscription verification: ${JSON.stringify(verificationResult)}`);
                
                // Update subscription in store if verification failed but we thought active
                if (!verificationResult.active && subscriptionActive) {
                  debugLog("Subscription verification failed - updating store");
                  // This will trigger a re-render with correct subscription state
                  await dispatch(checkSubscription(storedUserId)).unwrap();
                }
              } catch (verifyError) {
                debugLog(`Error verifying subscription: ${verifyError.message}`);
                // Non-fatal - continue with stored subscription state
              }
            }
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
      setInitialLoadComplete(true);
      
      try {
        await SplashScreen.hideAsync();
      } catch (splashError) {
        debugLog(`Error hiding splash screen: ${splashError.message}`);
      }
    }
  };

  useEffect(() => {
    debugLog("Running initial useEffect");
    prepare();
    return () => debugLog("Cleanup for initial useEffect");
  }, []);

  // Log deep links for debugging
  useEffect(() => {
    const subscription = Linking.addEventListener('url', url => {
      debugLog(`Received deep link: ${JSON.stringify(url)}`);
    });
    
    Linking.getInitialURL().then(url => {
      debugLog(`Initial URL: ${url}`);
    });
    
    return () => subscription.remove();
  }, []);

  // Create a stable version of the subscription status to prevent navigation loops
  const stableSubscriptionStatus = React.useRef(subscriptionActive);
  
  // Only update the ref when needed, not on every render
  useEffect(() => {
    if (stableSubscriptionStatus.current !== subscriptionActive) {
      debugLog(`Updating stable subscription status from ${stableSubscriptionStatus.current} to ${subscriptionActive}`);
      stableSubscriptionStatus.current = subscriptionActive;
    }
  }, [subscriptionActive]);

  // Retry app initialization on error
  const handleRetry = useCallback(() => {
    debugLog("Retry button pressed");
    setInitError(null);
    appInitializedRef.current = false; // Reset initialization flag
    setRecoveryAttempt(0); // Reset recovery attempts
    prepare();
  }, []);

  // Handle username creation errors to prevent app crashes
  const handleUsernameError = useCallback((error) => {
    debugLog(`Username creation error: ${error.message}`);
    // Fall back to last known good state
    return false; // Return false to allow default error handling
  }, []);

  // Determine which navigator to render based on auth and subscription status
  const renderNavigator = useCallback(() => {
    debugLog(`renderNavigator called with: 
      userId = ${userId?.substring(0,8) || 'null'}, 
      status = ${status}, 
      subscriptionActive = ${subscriptionActive},
      subscriptionType = ${subscriptionType || 'unknown'},
      needsUsername = ${needsUsername},
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
            onPress={handleRetry}
          >
            <Text style={{color: '#FFFFFF', fontWeight: 'bold'}}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Only show loading during initial app load, not during data refreshes
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
    
    // If username is needed, show username screen
    if (needsUsername) {
      debugLog("Showing CreateUsername screen - user needs username");
      const UsernameStack = createNativeStackNavigator();
      
      return (
        <UsernameStack.Navigator>
          <UsernameStack.Screen 
            name="CreateUsername" 
            component={CreateUsernameScreen} 
            initialParams={{ 
              userId: userId,
              provider: oauth_provider || 'oauth',
              onError: handleUsernameError
            }}
            options={{ headerShown: false }}
          />
          <UsernameStack.Screen 
            name="SubscriptionIOS" 
            component={SubscriptionScreenIOS} 
            options={{ headerShown: false }}
          />
        </UsernameStack.Navigator>
      );
    }

    // For the freemium model: Always show MainNavigator, regardless of subscription status
    // Feature restrictions are handled within screens, not by navigation changes
    debugLog("Showing MainNavigator - freemium model allows access regardless of subscription");
    
    // Create main stack with all screens
    const MainStack = createNativeStackNavigator();
    
    return (
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        <MainStack.Screen name="Main" component={MainNavigator} />
        <MainStack.Screen name="SubscriptionIOS" component={SubscriptionScreenIOS} />
        <MainStack.Screen name="PremiumFeaturePrompt" component={PremiumFeaturePrompt} />
      </MainStack.Navigator>
    );
  }, [userId, status, needsUsername, subscriptionType, initialLoadComplete, initError, handleRetry, handleUsernameError, oauth_provider]);

  // Handle severe errors by attempting recovery
  useEffect(() => {
    if (error && error.includes('critical')) {
      debugLog(`Critical error detected: ${error}`);
      
      // Try to recover using last known good state
      const recover = async () => {
        debugLog("Attempting recovery from critical error");
        try {
          // If we have a last known good userId, try to refetch data
          if (lastKnownGoodState.current.userId) {
            await dispatch(fetchUserData(lastKnownGoodState.current.userId)).unwrap();
            debugLog("Recovery successful");
          } else {
            // If no recovery state, reset to login
            await SecureStore.deleteItemAsync('userId');
            debugLog("No recovery state - resetting to login");
          }
        } catch (recoverError) {
          debugLog(`Recovery failed: ${recoverError.message}`);
          // If recovery fails, clear all and start fresh
          await SecureStore.deleteItemAsync('userId');
        }
      };
      
      recover();
    }
  }, [error, dispatch]);

  if (!appIsReady) {
    debugLog("App not ready yet, returning null");
    return null;
  }

  debugLog("Rendering full app with NavigationContainer");
  return (
    <View style={styles.container}>
      <NavigationContainer theme={DarkTheme} fallback={<ActivityIndicator size="large" color="#6543CC" />}>
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
