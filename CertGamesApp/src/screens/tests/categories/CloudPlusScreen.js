// src/screens/tests/categories/CloudPlusScreen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * Cloud+ (CV0-004) Test List Screen
 */
const CloudPlusScreen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    category: route.params?.category || 'cloudplus',
    title: route.params?.title || 'CompTIA Cloud+ (CV0-004) 🌩️',
  };

  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default CloudPlusScreen;

const styles = StyleSheet.create({});

