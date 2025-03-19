// src/screens/tests/categories/CySAPlusScreen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * CySA+ (CS0-003) Test List Screen
 */
const CySAPlusScreen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    category: route.params?.category || 'cysa',
    title: route.params?.title || 'CompTIA CySA+ (CS0-003) 🕵️‍♂️',
  };

  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default CySAPlusScreen;

const styles = StyleSheet.create({});

