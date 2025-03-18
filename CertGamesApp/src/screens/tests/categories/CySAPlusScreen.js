// src/screens/tests/categories/CySAPlusScreen.js
import React from 'react';
import TestListScreen from '../TestListScreen';

/**
 * CySA+ (CS0-003) Test List Screen
 */
const CySAPlusScreen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'cysa',
          title: 'CompTIA CySA+ (CS0-003) 🕵️‍♂️',
          ...route.params
        }
      }}
    />
  );
};

export default CySAPlusScreen;
