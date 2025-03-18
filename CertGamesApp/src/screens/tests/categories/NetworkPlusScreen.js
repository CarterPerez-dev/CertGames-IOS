// src/screens/tests/categories/NetworkPlusScreen.js
import React from 'react';
import TestListScreen from '../TestListScreen';

/**
 * Network+ (N10-009) Test List Screen
 */
const NetworkPlusScreen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'nplus',
          title: 'CompTIA Network+ (N10-009) 📡',
          ...route.params
        }
      }}
    />
  );
};

export default NetworkPlusScreen;
