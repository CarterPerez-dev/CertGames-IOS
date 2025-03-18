// src/screens/tests/categories/LinuxPlusScreen.js
import React from 'react';
import TestListScreen from '../TestListScreen';

/**
 * Linux+ (XK0-005) Test List Screen
 */
const LinuxPlusScreen = ({ navigation, route }) => {
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params: {
          category: 'linuxplus',
          title: 'CompTIA Linux+ (XK0-005) 🐧',
          ...route.params
        }
      }}
    />
  );
};

export default LinuxPlusScreen;
