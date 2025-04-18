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
import { fetchUserData } from '../store/slices/userSlice';

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
  const { userId, status, subscriptionActive, error, needsUsername, oauth_provider } = useSelector((state) => {
    const userData = state.user;
    debugLog(`Redux state: userId=${userData.userId?.substring(0,8) || 'null'}, status=${userData.status}, subscriptionActive=${userData.subscriptionActive}`);
    return userData;
  }, (prev, next) => {
    // Custom equality check to prevent unnecessary re-renders
    return (
      prev.userId === next.userId && 
      prev.status === next.status && 
      prev.subscriptionActive === next.subscriptionActive &&
      prev.needsUsername === next.needsUsername
    );
  });
  
  const [appIsReady, setAppIsReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Use a ref to track whether the app has been initialized
  // This prevents duplicate initialization calls
  const appInitializedRef = React.useRef(false);

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
          
          // Verify the data is usable
          if (!userData || !userData._id) {
            debugLog("User data incomplete or invalid");
          } else {
            debugLog(`User data loaded: subscription=${userData.subscriptionActive}`);
          }
        } catch (fetchError) {
          debugLog(`Error fetching user data: ${fetchError.message}`);
          
          // Check if this is a network error
          if (fetchError.message && fetchError.message.includes('network')) {
            setInitError("Could not fetch user data. Please check your network connection.");
          } else {
            // If it's not a network error, try to clear userId as it might be invalid
            await SecureStore.deleteItemAsync('userId');
            debugLog("Cleared userId from SecureStore due to fetch error");
          }
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

  // Determine which navigator to render based on auth and subscription status
  const renderNavigator = useCallback(() => {
    debugLog(`renderNavigator called with: 
      userId = ${userId?.substring(0,8) || 'null'}, 
      status = ${status}, 
      subscriptionActive = ${subscriptionActive},
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
            onPress={() => {
              debugLog("Retry button pressed");
              setInitError(null);
              appInitializedRef.current = false; // Reset initialization flag
              prepare();
            }}
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
              provider: oauth_provider || 'oauth' 
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
  }, [userId, status, needsUsername, initialLoadComplete, initError]);

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
