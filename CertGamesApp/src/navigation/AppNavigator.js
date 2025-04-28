// src/navigation/AppNavigator.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  InteractionManager 
} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  useNavigationContainerRef,
  CommonActions
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Import specific screens used in this navigator stack
import SubscriptionScreenIOS from '../screens/subscription/SubscriptionScreenIOS';
import UpgradeSubscriptionScreen from '../screens/subscription/UpgradeSubscriptionScreen';
import CreateUsernameScreen from '../screens/auth/CreateUsernameScreen';

// Import shared components
import PremiumFeaturePrompt from '../components/PremiumFeaturePrompt';
import NotificationOverlay from '../components/NotificationOverlay';
import GlobalErrorHandler from '../components/GlobalErrorHandler';

// Import Redux actions
import { fetchUserData, checkSubscription, logout } from '../store/slices/userSlice';

// Import Services
import AppleSubscriptionService from '../api/AppleSubscriptionService';
import GoogleAuthService from '../api/GoogleAuthService';

// Import API client and store injection
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

// Debugging log function
const debugLog = (message) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[AppNavigator-DEBUG ${timestamp}] ${message}`);
};

// --- AppNavigator Component ---
const AppNavigator = () => {
  const dispatch = useDispatch();
  const navigationRef = useNavigationContainerRef();

  // --- State Variables ---
  const [appIsReady, setAppIsReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [recoveryAttempt, setRecoveryAttempt] = useState(0);
  const [prevUserId, setPrevUserId] = useState(null);

  // --- Refs ---
  const appInitializedRef = useRef(false);
  const lastKnownGoodState = useRef({ userId: null, subscriptionActive: false, needsUsername: false });
  const stableSubscriptionStatus = useRef(false);

  // --- Redux State Selector ---
  const { userId, status, subscriptionActive, error, needsUsername, oauth_provider, subscriptionType } = useSelector((state) => {
    const userData = state.user || {};
    return userData;
  }, (prev, next) => {
    return (
      prev.userId === next.userId &&
      prev.status === next.status &&
      prev.subscriptionActive === next.subscriptionActive &&
      prev.needsUsername === next.needsUsername &&
      prev.subscriptionType === next.subscriptionType
    );
  });

  // --- Initialization Function (prepare) ---
  const prepare = async () => {
    if (appInitializedRef.current) {
      debugLog("prepare() blocked: Already initialized.");
      return;
    }
    
    appInitializedRef.current = true;
    debugLog("Starting prepare() function");
    
    try {
      let storedUserId;
      
      try {
        storedUserId = await SecureStore.getItemAsync('userId');
        debugLog(`Found stored userId: ${storedUserId?.substring(0,8) || 'null'}`);
      } catch (secureStoreError) { 
        debugLog(`Error accessing SecureStore: ${secureStoreError.message}`);
      }
      
      try {
        await GoogleAuthService.initialize();
        debugLog("Google Auth Service initialized");
      } catch (googleAuthError) { 
        debugLog(`Error initializing Google Auth Service: ${googleAuthError.message}`);
      }
      
      if (Platform.OS === 'ios') {
        try {
          debugLog("Initializing IAP connection");
          await AppleSubscriptionService.initializeConnection();
          debugLog("IAP connection initialized successfully");
        } catch (iapError) { 
          debugLog(`Error initializing IAP: ${iapError.message}`);
        }
      }
      
      if (storedUserId) {
        debugLog(`Prepare: Stored userId found (${storedUserId.substring(0,8)}). Fetching data...`);
        setPrevUserId(storedUserId);
        
        try {
          debugLog(`Dispatching fetchUserData for: ${storedUserId.substring(0,8)}`);
          const userDataResultAction = await dispatch(fetchUserData(storedUserId));
          
          if (fetchUserData.rejected.match(userDataResultAction)) {
            throw userDataResultAction.payload || new Error('fetchUserData rejected');
          }
          
          const userData = userDataResultAction.payload;
          debugLog(`User data fetched successfully for ${storedUserId.substring(0,8)}`);
          
          if (userData && userData._id) {
            lastKnownGoodState.current = {
              userId: userData._id,
              subscriptionActive: !!userData.subscriptionActive,
              needsUsername: !!userData.needs_username,
              subscriptionType: userData.subscriptionType || 'free'
            };
            
            debugLog(`Updated last known good state: ${JSON.stringify(lastKnownGoodState.current)}`);
            
            try {
              debugLog(`Dispatching checkSubscription for: ${userData._id.substring(0,8)}`);
              await dispatch(checkSubscription(userData._id)).unwrap();
              debugLog("Subscription status checked and updated");
            } catch (subError) { 
              debugLog(`Error checking subscription during prepare: ${subError.message || subError}`);
            }
          } else {
            debugLog(`Fetched user data missing _id for ${storedUserId.substring(0,8)}`);
            throw new Error('Fetched user data invalid');
          }
        } catch (fetchError) {
          debugLog(`Error during fetchUserData or checkSubscription in prepare: ${fetchError.message || fetchError}`);
          
          if (String(fetchError).includes('network')) {
            setInitError("Could not fetch user data. Please check your network connection.");
          } else {
            if (recoveryAttempt >= 2) {
              try {
                await SecureStore.deleteItemAsync('userId');
                debugLog("Cleared userId from SecureStore after multiple fetch failures.");
                setPrevUserId(null);
              } catch (clearError) {
                debugLog(`Error clearing userId: ${clearError.message}`);
              }
            } else {
              setRecoveryAttempt(prev => prev + 1);
              debugLog(`Increased recovery attempt to ${recoveryAttempt + 1}`);
            }
            
            if (!initError) setInitError("Failed to load user profile.");
          }
        }
      } else {
        debugLog("No stored userId found - user needs to login/register.");
        setPrevUserId(null);
      }
    } catch (e) {
      debugLog(`Error in prepare() top-level catch: ${e.message}`);
      setInitError("Error initializing app: " + e.message);
    } finally {
      try {
        debugLog("Prepare finally block: Setting appIsReady=true, initialLoadComplete=true");
        setAppIsReady(true);
        setInitialLoadComplete(true);
        
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
            debugLog("Splash screen hidden.");
          } catch (splashError) {
            debugLog(`Error hiding splash screen: ${splashError.message}`);
          }
        }, 150);
      } catch (finalError) {
        debugLog(`Error in prepare() finally block: ${finalError.message}`);
      }
    }
  };

  // --- useEffect Hooks ---

  // Initial App Load Effect
  useEffect(() => {
    debugLog("Running initial useEffect for app initialization");
    
    const initializeApp = async () => {
      try {
        await prepare();
      } catch (initError) {
        debugLog(`Top-level initialization error caught in useEffect: ${initError.message}`);
        setInitError("App initialization failed. Please restart the app.");
        setAppIsReady(true);
        setInitialLoadComplete(true);
      }
    };
    
    initializeApp();
    
    return () => {
      debugLog("Cleanup for initial useEffect");
    };
  }, []);

  // Deep Linking Effect
  useEffect(() => {
    debugLog("Setting up deep link listener.");
    
    const subscription = Linking.addEventListener('url', url => {
      debugLog(`Received deep link via listener: ${JSON.stringify(url)}`);
    });
    
    Linking.getInitialURL().then(url => {
      debugLog(`Initial URL on mount: ${url}`);
    });
    
    return () => {
      debugLog("Removing deep link listener.");
      subscription.remove();
    };
  }, []);

  // Stable Subscription Status Ref Update
  useEffect(() => {
    if (stableSubscriptionStatus.current !== subscriptionActive) {
      debugLog(`Updating stable subscription status ref from ${stableSubscriptionStatus.current} to ${subscriptionActive}`);
      stableSubscriptionStatus.current = subscriptionActive;
    }
  }, [subscriptionActive]);

  // Navigation Effect Using InteractionManager
  useEffect(() => {
    if (!appIsReady) return;
    
    debugLog(`Navigation state check: userId=${userId?.substring(0,8) || 'null'}, prevUserId=${prevUserId?.substring(0,8) || 'null'}, needsUsername=${needsUsername}`);
  
    // Condition 1: User just logged in successfully and doesn't need a username
    if (userId && !prevUserId && !needsUsername) {
      debugLog(`>>> Detected LOGIN transition (userId: ${userId.substring(0,8)}). Navigating to Main.`);
      
      // Simple setTimeout to allow current render to complete
      setTimeout(() => {
        if (navigationRef.isReady()) {
          debugLog(`>>> Dispatching navigation reset to Main`);
          navigationRef.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Main' }],
            })
          );
        }
      }, 150); // Short timeout instead of InteractionManager
      
      setPrevUserId(userId);
    } 
    // Condition 2: User just logged out
    else if (!userId && prevUserId) {
      debugLog(`>>> Detected LOGOUT transition.`);
      setPrevUserId(null);
    }
    // Condition 3: User logged in but needs username
    else if (userId && !prevUserId && needsUsername) {
      debugLog(`>>> Detected login transition needing username (userId: ${userId.substring(0,8)}).`);
      setPrevUserId(userId);
    }
  }, [userId, needsUsername, appIsReady, prevUserId, navigationRef]);
  
  
  // Retry App Initialization Callback
  const handleRetry = useCallback(() => {
    debugLog("Retry button pressed");
    setInitError(null);
    setRecoveryAttempt(0);
    appInitializedRef.current = false;
    prepare();
  }, []);

  // Handle Username Error Callback
  const handleUsernameError = useCallback((error) => {
    debugLog(`Username creation error occurred: ${error.message}`);
    return false;
  }, []);

  // --- Render Navigator Function ---
  const renderNavigator = useCallback(() => {
    debugLog(`renderNavigator Decision Check: initialLoadComplete=${initialLoadComplete}, initError=${!!initError}, userId=${userId?.substring(0,8) || 'null'}, needsUsername=${needsUsername}`);

    // Loading View
    if (!initialLoadComplete) {
      debugLog("renderNavigator: Returning Loading View (initial load not complete)");
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0C15'}}>
          <ActivityIndicator size="large" color="#6543CC" />
          <Text style={{color: '#FFFFFF', marginTop: 20}}>Initializing...</Text>
        </View>
      );
    }
    
    // Error View
    if (initError) {
      debugLog("renderNavigator: Returning Error View");
      return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0C15', padding: 20}}>
          <Text style={{color: '#FF4C8B', marginBottom: 20, textAlign: 'center', fontSize: 16}}>
            Initialization Error:
          </Text>
          <Text style={{color: '#FF4C8B', marginBottom: 20, textAlign: 'center'}}>
            {initError}
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#6543CC', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 }} 
            onPress={handleRetry}
          >
            <Text style={{color: '#FFFFFF', fontWeight: 'bold'}}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Auth Navigator (Not logged in)
    if (!userId) {
      debugLog("renderNavigator: Returning AuthNavigator");
      return <AuthNavigator />;
    }
    
    // Create Username Stack
    if (needsUsername) {
      debugLog(`renderNavigator: Returning CreateUsername Stack (userId: ${userId.substring(0,8)}, provider: ${oauth_provider || 'N/A'})`);
      const UsernameStack = createNativeStackNavigator();
      return (
        <UsernameStack.Navigator screenOptions={{ headerShown: false }}>
          <UsernameStack.Screen 
            name="CreateUsername" 
            component={CreateUsernameScreen} 
            initialParams={{ 
              userId: userId, 
              provider: oauth_provider || 'oauth', 
              onError: handleUsernameError 
            }} 
          />
          <UsernameStack.Screen 
            name="SubscriptionIOS" 
            component={SubscriptionScreenIOS} 
          />
        </UsernameStack.Navigator>
      );
    }
    
    // Default: Return Main App Stack
    debugLog("renderNavigator: Returning MainStack (Main App)");
    const MainStack = createNativeStackNavigator();
    return (
      <MainStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <MainStack.Screen 
          name="Main" 
          component={MainNavigator} 
        />
        <MainStack.Screen 
          name="SubscriptionIOS" 
          component={SubscriptionScreenIOS} 
          options={{ 
            animation: 'slide_from_bottom', 
            presentation: 'modal' 
          }} 
        />
        <MainStack.Screen 
          name="UpgradeSubscription" 
          component={UpgradeSubscriptionScreen} 
          options={{ 
            animation: 'slide_from_bottom', 
            presentation: 'modal' 
          }} 
        />
        <MainStack.Screen 
          name="PremiumFeaturePrompt" 
          component={PremiumFeaturePrompt} 
          options={{ 
            animation: 'fade', 
            presentation: 'transparentModal' 
          }} 
        />
      </MainStack.Navigator>
    );
  }, [
    userId, 
    status, 
    needsUsername, 
    subscriptionType, 
    initialLoadComplete, 
    initError,
    handleRetry, 
    handleUsernameError, 
    oauth_provider
  ]);

  // Critical Error Recovery Effect
  useEffect(() => {
    if (error && typeof error === 'string' && error.includes('critical')) {
      debugLog(`Critical error detected: ${error}`);
      
      const recover = async () => {
        debugLog("Attempting recovery from critical error");
        
        try {
          if (lastKnownGoodState.current.userId) {
            debugLog(`Recovering using last known good userId: ${lastKnownGoodState.current.userId.substring(0,8)}`);
            await dispatch(fetchUserData(lastKnownGoodState.current.userId)).unwrap();
            debugLog("Recovery fetch successful");
          } else {
            debugLog("No recovery state - resetting to login by clearing userId");
            await SecureStore.deleteItemAsync('userId');
            dispatch(logout());
          }
        } catch (recoverError) {
          debugLog(`Recovery failed: ${recoverError.message || recoverError}. Resetting.`);
          
          try {
            await SecureStore.deleteItemAsync('userId');
            dispatch(logout());
          } catch (finalClearError){
            debugLog(`Error clearing user state during recovery failure: ${finalClearError.message}`);
          }
        }
      };
      
      recover();
    }
  }, [error, dispatch]);

  // --- Main Render Logic ---
  if (!appIsReady) {
    return null; // Render nothing until app is ready
  }

  debugLog("App is ready, rendering NavigationContainer...");
  return (
    <View style={styles.container}>
      <NavigationContainer
        ref={navigationRef}
        theme={DarkTheme}
        fallback={<ActivityIndicator size="large" color="#6543CC" />}
        linking={{
          prefixes: ['certgamesapp://', 'https://certgames.com'],
          config: {
            screens: {
              Main: {
                screens: {
                  Home: 'home',
                  Profile: 'profile',
                  Leaderboard: 'leaderboard',
                  Shop: 'shop'
                }
              },
              SubscriptionIOS: 'subscription',
              CreateUsername: 'create-username'
            }
          }
        }}
      >
        {renderNavigator()}
      </NavigationContainer>
      <GlobalErrorHandler />
      {userId && <NotificationOverlay />}
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C15',
  }
});

export default AppNavigator;
