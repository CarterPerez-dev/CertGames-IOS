// src/navigation/AuthNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Import auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import CreateUsernameScreen from '../screens/auth/CreateUsernameScreen';
import TermsScreen from '../screens/auth/TermsScreen';
import SubscriptionScreenIOS from '../screens/subscription/SubscriptionScreenIOS';
import PrivacyPolicyScreen from '../screens/auth/PrivacyPolicyScreen.js';

const Stack = createNativeStackNavigator();

// Custom header background
const HeaderBackground = () => {
  const { theme } = useTheme();
  
  return (
    <LinearGradient
      colors={theme.colors.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
};

const AuthNavigator = () => {
  const { theme } = useTheme();
  const responsive = theme.responsive;

  // Adjust header height and text size for different devices
  const headerHeight = responsive?.scaleHeight(60) || 60;
  const headerFontSize = responsive?.scaleFont(theme.sizes.fontSize.lg) || theme.sizes.fontSize.lg;
  
  return (
    <Stack.Navigator
      initialRouteName="Register"
      screenOptions={{
        headerBackground: () => <HeaderBackground />,
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: headerFontSize,
          fontFamily: 'Orbitron-Bold',
        },
        headerBackVisible: true,
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
        headerStyle: {
          height: headerHeight,
        },
        contentStyle: { backgroundColor: theme.colors.background }
      }}
    >
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateUsername" component={CreateUsernameScreen} options={{ title: 'Choose Username' }} />
      <Stack.Screen name="SubscriptionIOS" component={SubscriptionScreenIOS} options={{ headerShown: false }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
