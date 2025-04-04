// src/navigation/TestNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
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

const Stack = createNativeStackNavigator();

const TestNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // This completely removes the header
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {/* Generic TestList - rarely used if you always go to category screens */}
      <Stack.Screen
        name="TestList"
        component={TestListScreen}
        initialParams={{ title: 'Practice Tests' }}
      />

      {/* Individual test screen */}
      <Stack.Screen
        name="Test"
        component={TestScreen}
        options={{ gestureEnabled: false }}
        initialParams={{ title: 'Test' }}
      />

      {/* Category specific screens */}
      <Stack.Screen
        name="APlusTests"
        component={APlusScreen}
        initialParams={{ category: 'aplus', title: 'CompTIA A+ Core 1 (1101)' }}
      />
      <Stack.Screen
        name="APlus2Tests"
        component={APlus2Screen}
        initialParams={{ category: 'aplus2', title: 'CompTIA A+ Core 2 (1102)' }}
      />
      <Stack.Screen
        name="NetworkPlusTests"
        component={NetworkPlusScreen}
        initialParams={{ category: 'nplus', title: 'Network+ (N10-009)' }}
      />
      <Stack.Screen
        name="SecurityPlusTests"
        component={SecurityPlusScreen}
        initialParams={{ category: 'secplus', title: 'Security+ (SY0-701)' }}
      />
      <Stack.Screen
        name="CySAPlusTests"
        component={CySAPlusScreen}
        initialParams={{ category: 'cysa', title: 'CySA+ (CS0-003)' }}
      />
      <Stack.Screen
        name="PenPlusTests"
        component={PenPlusScreen}
        initialParams={{ category: 'penplus', title: 'PenTest+ (PT0-003)' }}
      />
      <Stack.Screen
        name="CaspPlusTests"
        component={CaspPlusScreen}
        initialParams={{ category: 'caspplus', title: 'CASP+ (CAS-005)' }}
      />
      <Stack.Screen
        name="LinuxPlusTests"
        component={LinuxPlusScreen}
        initialParams={{ category: 'linuxplus', title: 'Linux+ (XK0-005)' }}
      />
      <Stack.Screen
        name="CloudPlusTests"
        component={CloudPlusScreen}
        initialParams={{ category: 'cloudplus', title: 'Cloud+ (CV0-004)' }}
      />
      <Stack.Screen
        name="DataPlusTests"
        component={DataPlusScreen}
        initialParams={{ category: 'dataplus', title: 'Data+ (DA0-001)' }}
      />
      <Stack.Screen
        name="ServerPlusTests"
        component={ServerPlusScreen}
        initialParams={{ category: 'serverplus', title: 'Server+ (SK0-005)' }}
      />
      <Stack.Screen
        name="CisspTests"
        component={CisspScreen}
        initialParams={{ category: 'cissp', title: 'CISSP' }}
      />
      <Stack.Screen
        name="AWSCloudTests"
        component={AWSCloudScreen}
        initialParams={{ category: 'awscloud', title: 'AWS Cloud Practitioner' }}
      />
    </Stack.Navigator>
  );
};

export default TestNavigator;
