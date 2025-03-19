// src/screens/tests/categories/DataPlusScreen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * Data+ (DA0-001) Test List Screen
 */
const DataPlusScreen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    category: route.params?.category || 'dataplus',
    title: route.params?.title || 'CompTIA Data+ (DA0-001) 📋',
  };

  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default DataPlusScreen;

const styles = StyleSheet.create({});

