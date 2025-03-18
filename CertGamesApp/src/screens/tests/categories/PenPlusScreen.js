// src/screens/tests/categories/PenPlusScreen.js
import React from 'react';
import TestListScreen from '../TestListScreen';

/**
 * PenTest+ (PT0-003) Test List Screen
 */
const PenPlusScreen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'penplus',
          title: 'CompTIA PenTest+ (PT0-003) 🐍',
          ...route.params
        }
      }}
    />
  );
};

export default PenPlusScreen;
