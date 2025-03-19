// src/screens/tests/categories/LinuxPlusScreen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * Linux+ (XK0-005) Test List Screen
 */
const LinuxPlusScreen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    category: route.params?.category || 'linuxplus',
    title: route.params?.title || 'CompTIA Linux+ (XK0-005) 🐧',
  };

  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default LinuxPlusScreen;

const styles = StyleSheet.create({});

