// src/screens/tests/categories/AWSCloudScreen.js
import React from 'react';
import { StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * AWS Cloud Practitioner Test List Screen
 */
const AWSCloudScreen = ({ navigation, route }) => {
  // Provide fallback
  const params = {
    ...route.params,
    category: route.params?.category || 'awscloud',
    title: route.params?.title || 'AWS Cloud Practitioner (CLE-002) 🌥️',
  };

  return (
    <TestListScreen
      navigation={navigation}
      route={{ ...route, params }}
    />
  );
};

export default AWSCloudScreen;

const styles = StyleSheet.create({});

