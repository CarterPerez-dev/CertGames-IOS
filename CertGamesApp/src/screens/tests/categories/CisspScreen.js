// src/screens/tests/categories/CisspScreen.js
import React from 'react';
import TestListScreen from '../TestListScreen';

/**
 * CISSP Test List Screen
 */
const CisspScreen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'cissp',
          title: '(ISC)² CISSP 👾',
          ...route.params
        }
      }}
    />
  );
};

export default CisspScreen;
