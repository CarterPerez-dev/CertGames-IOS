// src/screens/tests/categories/AWSCloudScreen.js
import React from 'react';
import TestListScreen from '../TestListScreen';

/**
 * AWS Cloud Practitioner Test List Screen
 */
const AWSCloudScreen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'awscloud',
          title: 'AWS Cloud Practitioner (CLE-002) 🌥️',
          ...route.params
        }
      }}
    />
  );
};

export default AWSCloudScreen;
