// src/screens/tests/categories/ServerPlusScreen.js
import React from 'react';
import TestListScreen from '../TestListScreen';

/**
 * Server+ (SK0-005) Test List Screen
 */
const ServerPlusScreen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'serverplus',
          title: 'CompTIA Server+ (SK0-005) 🧛‍♂️',
          ...route.params
        }
      }}
    />
  );
};

export default ServerPlusScreen;
