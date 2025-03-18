// src/screens/tests/categories/SecurityPlusScreen.js
import React from 'react';
import TestListScreen from '../TestListScreen';

/**
 * Security+ (SY0-701) Test List Screen
 */
const SecurityPlusScreen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'secplus',
          title: 'CompTIA Security+ (SY0-701) 🔐',
          ...route.params
        }
      }}
    />
  );
};

export default SecurityPlusScreen;
