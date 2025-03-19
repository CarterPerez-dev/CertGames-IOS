// src/screens/tests/categories/APlus2Screen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * A+ Core 2 (1102) Test List Screen
 */
const APlus2Screen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    category: route.params?.category || 'aplus2',
    title: route.params?.title || 'CompTIA A+ Core 2 (1102) 🖥️',
  };

  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default APlus2Screen;

const styles = StyleSheet.create({});

