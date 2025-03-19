// src/screens/tests/categories/CaspPlusScreen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * CASP+ (CAS-005) Test List Screen
 */
const CaspPlusScreen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    category: route.params?.category || 'caspplus',
    title: route.params?.title || 'CompTIA Security-X (CAS-005) ⚔️',
  };

  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default CaspPlusScreen;

const styles = StyleSheet.create({});

