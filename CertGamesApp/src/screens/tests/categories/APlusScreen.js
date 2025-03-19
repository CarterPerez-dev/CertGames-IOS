// src/screens/tests/categories/APlusScreen.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import TestListScreen from '../TestListScreen';

/**
 * A+ Core 1 (1101) Test List Screen
 * 
 * @param {Object} props - Component props
 * @param {Object} props.navigation - Navigation object
 * @param {Object} props.route - Route object with params
 * @returns {JSX.Element} - APlusScreen component
 */
const APlusScreen = ({ navigation, route }) => {
  // Ensure we have a default category even if not in route params
  const params = {
    ...route.params,
    category: route.params?.category || 'aplus',
    title: 'CompTIA A+ Core 1 (1101) 💻'
  };
  
  return (
    <TestListScreen
      navigation={navigation}
      route={{
        ...route,
        params
      }}
    />
  );
};

const styles = StyleSheet.create({
  // Add styles if needed
});

export default APlusScreen;
