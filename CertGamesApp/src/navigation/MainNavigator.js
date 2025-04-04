// src/navigation/MainNavigator.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

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
import SubscriptionScreenIOS from '../screens/subscription/SubscriptionScreenIOS';

import TestNavigator from './TestNavigator';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const LeaderboardStack = createNativeStackNavigator();
const ShopStack = createNativeStackNavigator();

// Custom header background with theme
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

// Home Stack
const HomeStackNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerBackground: () => <HeaderBackground />,
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: theme.sizes.fontSize.lg,
          fontFamily: 'Orbitron-Bold',
        },
        headerBackVisible: true,
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
        headerStyle: {
          height: theme.responsive ? theme.responsive.scaleHeight(60) : 60,
        },
        contentStyle: { backgroundColor: theme.colors.background },
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
};

// Profile Stack
const ProfileStackNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerBackground: () => <HeaderBackground />,
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: theme.sizes.fontSize.lg,
          fontFamily: 'Orbitron-Bold',
        },
        headerBackVisible: true,
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
        headerStyle: {
          height: theme.responsive ? theme.responsive.scaleHeight(60) : 60,
        },
        contentStyle: { backgroundColor: theme.colors.background },
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
      <ProfileStack.Screen 
        name="SubscriptionIOS" 
        component={SubscriptionScreenIOS}
        options={{ title: 'Subscription' }}
      />
    </ProfileStack.Navigator>      
  );
};

// Leaderboard Stack
const LeaderboardStackNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <LeaderboardStack.Navigator
      screenOptions={{
        headerBackground: () => <HeaderBackground />,
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: theme.sizes.fontSize.lg,
          fontFamily: 'Orbitron-Bold',
        },
        headerBackVisible: true,
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
        headerStyle: {
          height: theme.responsive ? theme.responsive.scaleHeight(60) : 60,
        },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <LeaderboardStack.Screen 
        name="LeaderboardScreen" 
        component={LeaderboardScreen} 
        options={{ headerShown: false }}
      />
    </LeaderboardStack.Navigator>
  );
};

// Shop Stack
const ShopStackNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <ShopStack.Navigator
      screenOptions={{
        headerBackground: () => <HeaderBackground />,
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: theme.sizes.fontSize.lg,
          fontFamily: 'Orbitron-Bold',
        },
        headerBackVisible: true,
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
        headerStyle: {
          height: theme.responsive ? theme.responsive.scaleHeight(60) : 60,
        },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <ShopStack.Screen 
        name="ShopScreen" 
        component={ShopScreen} 
        options={{ headerShown: false }}
      />
    </ShopStack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator = () => {
  const { theme } = useTheme();
  const { responsive } = theme;
  
  // Calculate the safe area bottom padding
  const safeAreaBottom = responsive?.safeArea?.bottom ?? (Platform.OS === 'ios' ? 34 : 0);
  
  // Calculate appropriate tab bar height based on device
  const tabBarHeight = responsive?.isTablet 
    ? responsive.scaleHeight(70) + safeAreaBottom 
    : responsive?.scaleHeight(80) + safeAreaBottom;
  
  // Determine appropriate icon sizes based on device
  const tabIconSize = responsive?.isTablet 
    ? responsive.scale(28) 
    : responsive?.scale(24) || 24;
  
  return (
    <Tab.Navigator
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
            return <Ionicons name={iconName(focused)} size={tabIconSize} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.tabInactive,
          tabBarStyle: {
            backgroundColor: theme.colors.tabBackground,
            height: tabBarHeight,
            paddingTop: responsive ? responsive.scaleHeight(12) : 12,
            paddingBottom: safeAreaBottom > 0 ? safeAreaBottom : (responsive ? responsive.scaleHeight(20) : 20),
            borderTopWidth: 1,
            borderTopColor: theme.colors.border + '80',
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            elevation: 8,
          },
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: responsive ? responsive.scaleFont(12) : 12,
            paddingBottom: responsive ? responsive.scaleHeight(4) : 4,
            fontFamily: 'ShareTechMono',
          },
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

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 80,
    paddingTop: 12,
    paddingBottom: 25,
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default MainNavigator;
