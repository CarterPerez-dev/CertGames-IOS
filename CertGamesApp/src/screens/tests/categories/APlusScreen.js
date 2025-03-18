// src/screens/tests/categories/APlusScreen.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * A+ Core 1 (1101) Test List Screen
 */
const APlusScreen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'aplus',
          title: 'CompTIA A+ Core 1 (1101) 💻',
          ...route.params
        }
      }}
    />
  );
};

export default APlusScreen;
