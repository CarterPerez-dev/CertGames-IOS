// src/screens/tests/categories/CaspPlusScreen.js
import React from 'react';
import TestListScreen from '../TestListScreen';

/**
 * CASP+ (CAS-005) Test List Screen
 */
const CaspPlusScreen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'caspplus',
          title: 'CompTIA Security-X (CAS-005) ⚔️',
          ...route.params
        }
      }}
    />
  );
};

export default CaspPlusScreen;
