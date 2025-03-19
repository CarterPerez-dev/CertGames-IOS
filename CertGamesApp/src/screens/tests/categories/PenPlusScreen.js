// src/screens/tests/categories/PenPlusScreen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * PenTest+ (PT0-003) Test List Screen
 */
const PenPlusScreen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    category: route.params?.category || 'penplus',
    title: route.params?.title || 'CompTIA PenTest+ (PT0-003) 🐍',
  };

  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default PenPlusScreen;

const styles = StyleSheet.create({});

