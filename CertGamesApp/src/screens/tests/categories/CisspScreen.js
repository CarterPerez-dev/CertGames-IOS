// src/screens/tests/categories/CisspScreen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * CISSP Test List Screen
 */
const CisspScreen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    category: route.params?.category || 'cissp',
    title: route.params?.title || '(ISC)² CISSP 👾',
  };

  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default CisspScreen;

const styles = StyleSheet.create({});

