// src/screens/tests/categories/APlusScreen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * A+ Core 1 (1101) Test List Screen
 */
const APlusScreen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    // If route.params.category is missing, default to 'aplus'
    category: route.params?.category || 'aplus',
    // If route.params.title is missing, default:
    title: route.params?.title || 'CompTIA A+ Core 1 (1101)',
  };
  
  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default APlusScreen;

const styles = StyleSheet.create({});

