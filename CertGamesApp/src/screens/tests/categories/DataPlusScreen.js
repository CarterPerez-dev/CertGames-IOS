// src/screens/tests/categories/DataPlusScreen.js
import React from 'react';
import TestListScreen from '../TestListScreen';

/**
 * Data+ (DA0-001) Test List Screen
 */
const DataPlusScreen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'dataplus',
          title: 'CompTIA Data+ (DA0-001) 📋',
          ...route.params
        }
      }}
    />
  );
};

export default DataPlusScreen;
