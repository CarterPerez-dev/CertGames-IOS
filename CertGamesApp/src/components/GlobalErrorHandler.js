// src/components/GlobalErrorHandler.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { clearErrors } from '../store/slices/networkSlice';
import { useTheme } from '../context/ThemeContext';

const GlobalErrorHandler = () => {
  const { isOffline, serverError } = useSelector(state => state.network);
  const dispatch = useDispatch();
  const { theme } = useTheme();
  
  if (!isOffline && !serverError) return null;
  
  const retry = () => {
    dispatch(clearErrors());
    // Optionally trigger a refresh of key data
  };
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: isOffline ? theme.colors.error : theme.colors.warning }
    ]}>
      <View style={styles.content}>
        <Ionicons 
          name={isOffline ? "cloud-offline" : "server-outline"} 
          size={24} 
          color="#FFFFFF" 
        />
        <Text style={styles.message}>
          {isOffline 
            ? "You're offline. Check your connection." 
            : "Our servers are currently unavailable."}
        </Text>
      </View>
      <TouchableOpacity style={styles.retryButton} onPress={retry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default GlobalErrorHandler;
