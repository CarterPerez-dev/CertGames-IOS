// src/navigation/TestNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import test screens
import TestListScreen from '../screens/tests/TestListScreen';
import TestScreen from '../screens/tests/TestScreen';

// Import category screens
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

/**
 * TestNavigator - Navigation stack for certification test screens
 * Manages navigation between test categories and individual tests
 */
const TestNavigator = () => {
  return (
    <Stack.Navigator
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
        cardStyle: { backgroundColor: '#121212' }
      }}
    >
      {/* Test List Screen - this is a generic entry point that redirects to specific category */}
      <Stack.Screen 
        name="TestList" 
        component={TestListScreen} 
        options={({ route }) => ({ 
          title: route.params?.title || 'Practice Tests',
          headerBackTitleVisible: false
        })}
      />
      
      {/* Individual Test Screen */}
      <Stack.Screen 
        name="Test" 
        component={TestScreen} 
        options={({ route }) => ({ 
          title: route.params?.title || 'Test',
          headerBackTitleVisible: false,
          // Add this to make header behave better
          headerLeft: null, // This removes the back button
          gestureEnabled: false // This prevents swipe back gesture 
        })}
      />
      
      {/* Category Specific Screens */}
      <Stack.Screen 
        name="APlusTests" 
        component={APlusScreen} 
        options={{ title: 'A+ Core 1 (1101)', headerBackTitleVisible: false }}
        initialParams={{ category: 'aplus' }}
      />
      
      <Stack.Screen 
        name="APlus2Tests" 
        component={APlus2Screen} 
        options={{ title: 'A+ Core 2 (1102)', headerBackTitleVisible: false }}
        initialParams={{ category: 'aplus2' }}
      />
      
      <Stack.Screen 
        name="NetworkPlusTests" 
        component={NetworkPlusScreen} 
        options={{ title: 'Network+ (N10-009)', headerBackTitleVisible: false }}
        initialParams={{ category: 'nplus' }}
      />
      
      <Stack.Screen 
        name="SecurityPlusTests" 
        component={SecurityPlusScreen} 
        options={{ title: 'Security+ (SY0-701)', headerBackTitleVisible: false }}
        initialParams={{ category: 'secplus' }}
      />
      
      <Stack.Screen 
        name="CySAPlusTests" 
        component={CySAPlusScreen} 
        options={{ title: 'CySA+ (CS0-003)', headerBackTitleVisible: false }}
        initialParams={{ category: 'cysa' }}
      />
      
      <Stack.Screen 
        name="PenPlusTests" 
        component={PenPlusScreen} 
        options={{ title: 'PenTest+ (PT0-003)', headerBackTitleVisible: false }}
        initialParams={{ category: 'penplus' }}
      />
      
      <Stack.Screen 
        name="CaspPlusTests" 
        component={CaspPlusScreen} 
        options={{ title: 'CASP+ (CAS-005)', headerBackTitleVisible: false }}
        initialParams={{ category: 'caspplus' }}
      />
      
      <Stack.Screen 
        name="LinuxPlusTests" 
        component={LinuxPlusScreen} 
        options={{ title: 'Linux+ (XK0-005)', headerBackTitleVisible: false }}
        initialParams={{ category: 'linuxplus' }}
      />
      
      <Stack.Screen 
        name="CloudPlusTests" 
        component={CloudPlusScreen} 
        options={{ title: 'Cloud+ (CV0-004)', headerBackTitleVisible: false }}
        initialParams={{ category: 'cloudplus' }}
      />
      
      <Stack.Screen 
        name="DataPlusTests" 
        component={DataPlusScreen} 
        options={{ title: 'Data+ (DA0-001)', headerBackTitleVisible: false }}
        initialParams={{ category: 'dataplus' }}
      />
      
      <Stack.Screen 
        name="ServerPlusTests" 
        component={ServerPlusScreen} 
        options={{ title: 'Server+ (SK0-005)', headerBackTitleVisible: false }}
        initialParams={{ category: 'serverplus' }}
      />
      
      <Stack.Screen 
        name="CisspTests" 
        component={CisspScreen} 
        options={{ title: 'CISSP', headerBackTitleVisible: false }}
        initialParams={{ category: 'cissp' }}
      />
      
      <Stack.Screen 
        name="AWSCloudTests" 
        component={AWSCloudScreen} 
        options={{ title: 'AWS Cloud Practitioner', headerBackTitleVisible: false }}
        initialParams={{ category: 'awscloud' }}
      />
    </Stack.Navigator>
  );
};

export default TestNavigator;
