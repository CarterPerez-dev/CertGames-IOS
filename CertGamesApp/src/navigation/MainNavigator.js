// src/navigation/MainNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen'; //complete
import ProfileScreen from '../screens/profile/ProfileScreen'; //complete
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ShopScreen from '../screens/shop/ShopScreen';
import TestListScreen from '../screens/tests/TestListScreen';
import TestScreen from '../screens/tests/TestScreen';
import AnalogyHubScreen from '../screens/tools/AnalogyHubScreen'; //complete
import ScenarioSphereScreen from '../screens/tools/ScenarioSphereScreen'; //complete
import GRCScreen from '../screens/tools/GRCScreen'; //complete
import AchievementsScreen from '../screens/profile/AchievementsScreen'; //complete
import SupportScreen from '../screens/profile/SupportScreen';
import XploitCraftScreen from '../screens/tools/XploitCraftScreen'; 
import NewsletterScreen from '../screens/tools/NewsletterScreen'; // New
import DailyStationScreen from '../screens/tools/DailyStationScreen'; // New

// Create Navigators
const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const LeaderboardStack = createStackNavigator();
const ShopStack = createStackNavigator();

// Home Stack
const HomeStackNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#1E1E1E',
        elevation: 0, // Android
        shadowOpacity: 0, // iOS
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <HomeStack.Screen 
      name="HomeScreen" 
      component={HomeScreen} 
      options={{ title: 'Dashboard' }}
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
      options={{ title: 'Analogy Hub' }}
    />
    <HomeStack.Screen 
      name="ScenarioSphere" 
      component={ScenarioSphereScreen} 
      options={{ title: 'Scenario Sphere' }}
    />
    <HomeStack.Screen 
      name="GRC" 
      component={GRCScreen} 
      options={{ title: 'GRC Questions' }}
    />
    <HomeStack.Screen 
      name="XploitCraft" 
      component={XploitCraftScreen} 
      options={{ title: 'XploitCraft' }}
    />
    {/* New screens */}
    <HomeStack.Screen 
      name="DailyStation" 
      component={DailyStationScreen} 
      options={{ title: 'Daily Station' }}
    />
    <HomeStack.Screen 
      name="Newsletter" 
      component={NewsletterScreen} 
      options={{ title: 'Daily Cyber Brief' }}
    />
  </HomeStack.Navigator>
);

// Profile Stack
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#1E1E1E',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <ProfileStack.Screen 
      name="ProfileScreen" 
      component={ProfileScreen} 
      options={{ title: 'My Profile' }}
    />
    <ProfileStack.Screen 
      name="Achievements" 
      component={AchievementsScreen} 
      options={{ title: 'Achievements' }}
    />
    <ProfileStack.Screen 
      name="Support" 
      component={SupportScreen} 
      options={{ title: 'Support' }}
    />
    {/* Access daily station and newsletter from profile as well */}
    <ProfileStack.Screen 
      name="DailyStation" 
      component={DailyStationScreen} 
      options={{ title: 'Daily Station' }}
    />
    <ProfileStack.Screen 
      name="Newsletter" 
      component={NewsletterScreen} 
      options={{ title: 'Daily Cyber Brief' }}
    />
  </ProfileStack.Navigator>
);

// Leaderboard Stack
const LeaderboardStackNavigator = () => (
  <LeaderboardStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#1E1E1E',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <LeaderboardStack.Screen 
      name="LeaderboardScreen" 
      component={LeaderboardScreen} 
      options={{ title: 'Leaderboard' }}
    />
  </LeaderboardStack.Navigator>
);

// Shop Stack
const ShopStackNavigator = () => (
  <ShopStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#1E1E1E',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <ShopStack.Screen 
      name="ShopScreen" 
      component={ShopScreen} 
      options={{ title: 'Shop' }}
    />
  </ShopStack.Navigator>
);

// Main Tab Navigator
const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Leaderboard') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Shop') {
            iconName = focused ? 'cart' : 'cart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6543CC',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#333333',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Leaderboard" component={LeaderboardStackNavigator} />
      <Tab.Screen name="Shop" component={ShopStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
