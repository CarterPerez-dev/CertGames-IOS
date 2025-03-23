// src/navigation/TestNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import TestListScreen from '../screens/tests/TestListScreen';
import TestScreen from '../screens/tests/TestScreen';

// Category screens
import APlusScreen from '../screens/tests/categories/APlusScreen';
import APlus2Screen from '../screens/tests/categories/APlus2Screen';
import NetworkPlusScreen from '../screens/tests/categories/NetworkPlusScreen';
import SecurityPlusScreen from '../screens/tests/categories/SecurityPlusScreen';
import CySAPlusScreen from '../screens/tests/categories/CySAPlusScreen';
import PenPlusScreen from '../screens/tests/categories/PenPlusScreen';
import CaspPlusScreen from '../screens/tests/categories/CaspPlusScreen';
import LinuxPlusScreen from '../screens/tests/categories/LinuxPlusScreen';
import CloudPlusScreen from '../screens/tests/categories/CloudPlusScreen';
import DataPlusScreen from '../screens/tests/categories/DataPlusScreen';
import ServerPlusScreen from '../screens/tests/categories/ServerPlusScreen';
import CisspScreen from '../screens/tests/categories/CisspScreen';
import AWSCloudScreen from '../screens/tests/categories/AWSCloudScreen';

const Stack = createStackNavigator();

// Custom header background
const HeaderBackground = () => (
  <LinearGradient
    colors={['#1E1E2E', '#0B0C15']}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    style={StyleSheet.absoluteFill}
  />
);

const TestNavigator = () => {
  return (
    <Stack.Navigator
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
        cardStyle: { backgroundColor: '#0B0C15' },
      }}
    >
      {/* Generic TestList - rarely used if you always go to category screens */}
      <Stack.Screen
        name="TestList"
        component={TestListScreen}
        options={({ route }) => ({
          title: route.params?.title || 'Practice Tests',
          headerBackTitleVisible: false,
        })}
      />

      {/* Individual test screen */}
      <Stack.Screen
        name="Test"
        component={TestScreen}
        options={({ route }) => ({
          title: route.params?.title || 'Test',
          headerBackTitleVisible: false,
          headerLeft: () => null,
          gestureEnabled: false,
        })}
      />

      {/* Category specific screens */}
      <Stack.Screen
        name="APlusTests"
        component={APlusScreen}
        options={{ title: 'A+ Core 1 (1101)', headerBackTitleVisible: false }}
        initialParams={{ category: 'aplus', title: 'CompTIA A+ Core 1 (1101)' }}
      />
      <Stack.Screen
        name="APlus2Tests"
        component={APlus2Screen}
        options={{ title: 'A+ Core 2 (1102)', headerBackTitleVisible: false }}
        initialParams={{ category: 'aplus2', title: 'CompTIA A+ Core 2 (1102)' }}
      />
      <Stack.Screen
        name="NetworkPlusTests"
        component={NetworkPlusScreen}
        options={{ title: 'Network+ (N10-009)', headerBackTitleVisible: false }}
        initialParams={{ category: 'nplus', title: 'Network+ (N10-009)' }}
      />
      <Stack.Screen
        name="SecurityPlusTests"
        component={SecurityPlusScreen}
        options={{ title: 'Security+ (SY0-701)', headerBackTitleVisible: false }}
        initialParams={{ category: 'secplus', title: 'Security+ (SY0-701)' }}
      />
      <Stack.Screen
        name="CySAPlusTests"
        component={CySAPlusScreen}
        options={{ title: 'CySA+ (CS0-003)', headerBackTitleVisible: false }}
        initialParams={{ category: 'cysa', title: 'CySA+ (CS0-003)' }}
      />
      <Stack.Screen
        name="PenPlusTests"
        component={PenPlusScreen}
        options={{ title: 'PenTest+ (PT0-003)', headerBackTitleVisible: false }}
        initialParams={{ category: 'penplus', title: 'PenTest+ (PT0-003)' }}
      />
      <Stack.Screen
        name="CaspPlusTests"
        component={CaspPlusScreen}
        options={{ title: 'CASP+ (CAS-005)', headerBackTitleVisible: false }}
        initialParams={{ category: 'caspplus', title: 'CASP+ (CAS-005)' }}
      />
      <Stack.Screen
        name="LinuxPlusTests"
        component={LinuxPlusScreen}
        options={{ title: 'Linux+ (XK0-005)', headerBackTitleVisible: false }}
        initialParams={{ category: 'linuxplus', title: 'Linux+ (XK0-005)' }}
      />
      <Stack.Screen
        name="CloudPlusTests"
        component={CloudPlusScreen}
        options={{ title: 'Cloud+ (CV0-004)', headerBackTitleVisible: false }}
        initialParams={{ category: 'cloudplus', title: 'Cloud+ (CV0-004)' }}
      />
      <Stack.Screen
        name="DataPlusTests"
        component={DataPlusScreen}
        options={{ title: 'Data+ (DA0-001)', headerBackTitleVisible: false }}
        initialParams={{ category: 'dataplus', title: 'Data+ (DA0-001)' }}
      />
      <Stack.Screen
        name="ServerPlusTests"
        component={ServerPlusScreen}
        options={{ title: 'Server+ (SK0-005)', headerBackTitleVisible: false }}
        initialParams={{ category: 'serverplus', title: 'Server+ (SK0-005)' }}
      />
      <Stack.Screen
        name="CisspTests"
        component={CisspScreen}
        options={{ title: 'CISSP', headerBackTitleVisible: false }}
        initialParams={{ category: 'cissp', title: 'CISSP' }}
      />
      <Stack.Screen
        name="AWSCloudTests"
        component={AWSCloudScreen}
        options={{ title: 'AWS Cloud Practitioner', headerBackTitleVisible: false }}
        initialParams={{ category: 'awscloud', title: 'AWS Cloud Practitioner' }}
      />
    </Stack.Navigator>
  );
};

export default TestNavigator;
