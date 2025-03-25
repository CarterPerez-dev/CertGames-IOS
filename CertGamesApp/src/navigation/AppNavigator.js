import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';

// Import the notification overlay
import NotificationOverlay from '../components/NotificationOverlay';

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
          
          // Don't navigate here - we'll check subscription in the next effect
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
    if (!userId) {
      return <AuthNavigator />;
    }
    
    if (!subscriptionActive) {
      // Here we can create a custom navigator that starts with the Subscription screen
      // Or we can pass initialParams to MainNavigator
      return (
        <MainNavigator 
          initialParams={{ 
            screen: 'Subscription',
            params: { renewSubscription: true, userId: userId }
          }} 
        />
      );
    }
    
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
      
      {/* Add the notification overlay */}
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
