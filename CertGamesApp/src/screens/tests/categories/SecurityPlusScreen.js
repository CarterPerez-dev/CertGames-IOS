// src/screens/tests/categories/SecurityPlusScreen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * Security+ (SY0-701) Test List Screen
 */
const SecurityPlusScreen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    category: route.params?.category || 'secplus',
    title: route.params?.title || 'CompTIA Security+ (SY0-701) 🔐',
  };

  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default SecurityPlusScreen;

const styles = StyleSheet.create({});

