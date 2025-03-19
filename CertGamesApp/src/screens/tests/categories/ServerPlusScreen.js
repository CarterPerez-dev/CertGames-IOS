// src/screens/tests/categories/ServerPlusScreen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * Server+ (SK0-005) Test List Screen
 */
const ServerPlusScreen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    category: route.params?.category || 'serverplus',
    title: route.params?.title || 'CompTIA Server+ (SK0-005) 🧛‍♂️',
  };

  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default ServerPlusScreen;

const styles = StyleSheet.create({});

