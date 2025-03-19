// src/screens/tests/categories/NetworkPlusScreen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * Network+ (N10-009) Test List Screen
 */
const NetworkPlusScreen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    category: route.params?.category || 'nplus',
    title: route.params?.title || 'CompTIA Network+ (N10-009) 📡',
  };

  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default NetworkPlusScreen;

const styles = StyleSheet.create({});

