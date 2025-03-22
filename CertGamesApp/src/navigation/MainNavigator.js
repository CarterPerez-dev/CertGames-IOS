// src/navigation/MainNavigator.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
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

// Import test navigator
import TestNavigator from './TestNavigator';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const LeaderboardStack = createStackNavigator();
const ShopStack = createStackNavigator();

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
        cardStyle: { backgroundColor: theme.colors.background },
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
        cardStyle: { backgroundColor: theme.colors.background },
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
        cardStyle: { backgroundColor: theme.colors.background },
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
        cardStyle: { backgroundColor: theme.colors.background },
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

// Tab bar with blur effect
const CustomTabBar = ({ state, descriptors, navigation, theme }) => {
  return (
    <View style={[
      styles.tabBarContainer, 
      { 
        backgroundColor: theme.colors.tabBackground,
        borderTopColor: theme.colors.border,
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName;
        if (route.name === 'Home') {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'Profile') {
          iconName = isFocused ? 'person' : 'person-outline';
        } else if (route.name === 'Leaderboard') {
          iconName = isFocused ? 'trophy' : 'trophy-outline';
        } else if (route.name === 'Shop') {
          iconName = isFocused ? 'cart' : 'cart-outline';
        }

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons 
              name={iconName} 
              size={24} 
              color={isFocused ? theme.colors.tabActive : theme.colors.tabInactive} 
            />
            <Text 
              style={[
                styles.tabLabel, 
                { 
                  color: isFocused ? theme.colors.tabActive : theme.colors.tabInactive,
                  fontWeight: isFocused ? 'bold' : 'normal' 
                }
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Main Tab Navigator
const MainNavigator = () => {
  const { theme } = useTheme();
  
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
            return <Ionicons name={iconName(focused)} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.tabInactive,
          tabBarStyle: {
            backgroundColor: theme.colors.tabBackground,
            height: 80, // Taller to accommodate iPhone home indicator
            paddingTop: 12, // Raise the icons/content within the tab bar
            paddingBottom: 25, // More padding at bottom for home indicator
            borderTopWidth: 1,
            borderTopColor: theme.colors.border + '80',
            // No margin bottom - flush with screen edge
            // No border radius - flush with screen edges
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            elevation: 8,
          },
          headerShown: false,
        };
      }}
      // Use custom tab bar if needed
      // tabBar={props => <CustomTabBar {...props} theme={theme} />}
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
