// src/navigation/MainNavigator.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ShopScreen from '../screens/shop/ShopScreen';
import TestListScreen from '../screens/tests/TestListScreen';
import TestScreen from '../screens/tests/TestScreen';
import AnalogyHubScreen from '../screens/tools/AnalogyHubScreen';
import ScenarioSphereScreen from '../screens/tools/ScenarioSphereScreen';
import GRCScreen from '../screens/tools/GRCScreen';
import AchievementsScreen from '../screens/profile/AchievementsScreen';
import SupportScreen from '../screens/profile/SupportScreen';
import XploitCraftScreen from '../screens/tools/XploitCraftScreen';
import DailyStationScreen from '../screens/tools/DailyStationScreen';
import NewsletterScreen from '../screens/tools/NewsletterScreen';
import ResourcesScreen from '../screens/tools/ResourcesScreen';
import ThemeSettingsScreen from '../screens/profile/ThemeSettingsScreen';

// Import test navigator
import TestNavigator from './TestNavigator';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const LeaderboardStack = createStackNavigator();
const ShopStack = createStackNavigator();

// Custom header background
const HeaderBackground = () => (
  <LinearGradient
    colors={['#1E1E2E', '#0B0C15']}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    style={StyleSheet.absoluteFill}
  />
);

// Home Stack
const HomeStackNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerBackground: () => <HeaderBackground />,
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 18,
      },
      headerBackTitleVisible: false,
      headerTitleAlign: 'center',
      headerStyle: {
        elevation: 0, // Android
        shadowOpacity: 0, // iOS
        borderBottomWidth: 0,
        height: 60,
      },
    }}
  >
    <HomeStack.Screen 
      name="HomeScreen" 
      component={HomeScreen} 
      options={{ headerShown: false }}
    />
    <HomeStack.Screen 
      name="TestList" 
      component={TestListScreen} 
      options={({ route }) => ({ title: route.params?.title || 'Practice Tests' })}
    />
    <HomeStack.Screen 
      name="Test" 
      component={TestScreen} 
      options={({ route }) => ({ title: route.params?.title || 'Test' })}
    />
    <HomeStack.Screen 
      name="AnalogyHub" 
      component={AnalogyHubScreen} 
      options={{ headerShown: false }}
    />
    <HomeStack.Screen 
      name="ScenarioSphere" 
      component={ScenarioSphereScreen} 
      options={{ headerShown: false }}
    />
    <HomeStack.Screen 
      name="GRC" 
      component={GRCScreen} 
      options={{ headerShown: false }}
    />
    <HomeStack.Screen 
      name="XploitCraft" 
      component={XploitCraftScreen} 
      options={{ headerShown: false }}
    />
    <HomeStack.Screen 
      name="DailyStation" 
      component={DailyStationScreen} 
      options={{ title: 'Daily Station' }}
    />
    <HomeStack.Screen 
      name="Newsletter" 
      component={NewsletterScreen} 
      options={{ headerShown: false }}
    />
    <HomeStack.Screen 
      name="Resources" 
      component={ResourcesScreen} 
      options={{ headerShown: false }}
    />
    <HomeStack.Screen 
      name="Support" 
      component={SupportScreen} 
      options={{ headerShown: false }}
    />
    <HomeStack.Screen 
      name="Tests" 
      component={TestNavigator} 
      options={{ headerShown: false }}
    />
  </HomeStack.Navigator>
);

// Profile Stack
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerBackground: () => <HeaderBackground />,
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 18,
      },
      headerBackTitleVisible: false,
      headerTitleAlign: 'center',
      headerStyle: {
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
        height: 60,
      },
    }}
  >
    <ProfileStack.Screen 
      name="ProfileScreen" 
      component={ProfileScreen} 
      options={{ headerShown: false }}
    />
    <ProfileStack.Screen 
      name="Achievements" 
      component={AchievementsScreen} 
      options={{ title: 'Achievements' }}
    />
    <ProfileStack.Screen 
      name="Support" 
      component={SupportScreen} 
      options={{ headerShown: false }}
    />
    <ProfileStack.Screen 
      name="DailyStation" 
      component={DailyStationScreen} 
      options={{ title: 'Daily Station' }}
    />
    <ProfileStack.Screen 
      name="Newsletter" 
      component={NewsletterScreen} 
      options={{ headerShown: false }}
    />
    <ProfileStack.Screen 
      name="Resources" 
      component={ResourcesScreen} 
      options={{ headerShown: false }}
    />
    {/* Add ThemeSettings Screen */}
    <ProfileStack.Screen 
      name="ThemeSettings" 
      component={ThemeSettingsScreen} 
      options={{ headerShown: false }}
    />
  </ProfileStack.Navigator>
);

// Leaderboard Stack
const LeaderboardStackNavigator = () => (
  <LeaderboardStack.Navigator
    screenOptions={{
      headerBackground: () => <HeaderBackground />,
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 18,
      },
      headerBackTitleVisible: false,
      headerTitleAlign: 'center',
      headerStyle: {
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
        height: 60,
      },
    }}
  >
    <LeaderboardStack.Screen 
      name="LeaderboardScreen" 
      component={LeaderboardScreen} 
      options={{ headerShown: false }}
    />
  </LeaderboardStack.Navigator>
);

// Shop Stack
const ShopStackNavigator = () => (
  <ShopStack.Navigator
    screenOptions={{
      headerBackground: () => <HeaderBackground />,
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 18,
      },
      headerBackTitleVisible: false,
      headerTitleAlign: 'center',
      headerStyle: {
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
        height: 60,
      },
    }}
  >
    <ShopStack.Screen 
      name="ShopScreen" 
      component={ShopScreen} 
      options={{ headerShown: false }}
    />
  </ShopStack.Navigator>
);

// Main Tab Navigator
const MainNavigator = () => {
  return (
    <Tab.Navigator
      sceneContainerStyle={{
        // Add bottom padding to all screens to avoid content being hidden by the tab bar
        paddingBottom: 85,
      }}
      screenOptions={({ route }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = focused => focused ? 'home' : 'home-outline';
        } else if (route.name === 'Profile') {
          iconName = focused => focused ? 'person' : 'person-outline';
        } else if (route.name === 'Leaderboard') {
          iconName = focused => focused ? 'trophy' : 'trophy-outline';
        } else if (route.name === 'Shop') {
          iconName = focused => focused ? 'cart' : 'cart-outline';
        }

        return {
          tabBarIcon: ({ focused, color, size }) => {
            return <Ionicons name={iconName(focused)} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6543CC',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#0F0F17',
            height: 80, // Taller to accommodate iPhone home indicator
            paddingTop: 12, // Raise the icons/content within the tab bar
            paddingBottom: 25, // More padding at bottom for home indicator
            borderTopWidth: 1,
            borderTopColor: 'rgba(34, 34, 51, 0.8)',
            // No margin bottom - flush with screen edge
            // No border radius - flush with screen edges
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 8,
          },
          headerShown: false,
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Leaderboard" component={LeaderboardStackNavigator} />
      <Tab.Screen name="Shop" component={ShopStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
