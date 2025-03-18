// src/screens/tests/categories/CloudPlusScreen.js
import React from 'react';
import TestListScreen from '../TestListScreen';

/**
 * Cloud+ (CV0-004) Test List Screen
 */
const CloudPlusScreen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'cloudplus',
          title: 'CompTIA Cloud+ (CV0-004) 🌩️',
          ...route.params
        }
      }}
    />
  );
};

export default CloudPlusScreen;
