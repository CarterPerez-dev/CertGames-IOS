// src/components/GlobalErrorHandler.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { clearErrors, refreshAppData } from '../store/slices/networkSlice';
import { useTheme } from '../context/ThemeContext';

const GlobalErrorHandler = () => {
  const { isOffline, serverError, refreshing } = useSelector(state => state.network || {});
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [animValue] = useState(new Animated.Value(0));
  
  // Effect to handle visibility and auto-hide
  useEffect(() => {
    // Only show banner if we have an error condition
    const shouldShow = isOffline || serverError;
    
    if (shouldShow && !visible) {
      setVisible(true);
      // Animate banner in
      Animated.timing(animValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (!shouldShow && visible) {
      // Animate banner out
      Animated.timing(animValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }
  }, [isOffline, serverError, visible]);
  
  // Set up network change listener to automatically clear errors when connected
  useEffect(() => {
    // Function to handle network state changes
    const handleNetworkChange = (state) => {
      if (state.isConnected && state.isInternetReachable) {
        // Auto-clear errors when network is restored
        if (isOffline) {
          dispatch(clearErrors());
          // Attempt to refresh app data if we were previously offline
          dispatch(refreshAppData());
        }
      }
    };
    
    // Subscribe to network info updates
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);
    
    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [dispatch, isOffline]);
  
  // If not visible, don't render anything
  if (!visible) return null;
  
  // Determine error text and icon
  const errorIcon = isOffline ? "cloud-offline" : "server-outline";
  const errorMessage = isOffline 
    ? "You're offline. Please check your internet connection." 
    : "Our servers are currently unavailable. We're working on it.";
  const errorColor = isOffline ? theme?.colors?.error : theme?.colors?.warning;
  
  // Handle retry - debounced to prevent multiple clicks
  const handleRetry = () => {
    if (refreshing) return; // Prevent multiple refresh attempts
    dispatch(clearErrors());
    dispatch(refreshAppData());
  };
  
  // Calculate status bar height for proper positioning
  const statusBarHeight = Platform.OS === 'ios' ? 44 : 0;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          backgroundColor: errorColor,
          paddingTop: statusBarHeight + 8,
          transform: [
            { translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0]
              })
            }
          ],
          opacity: animValue
        }
      ]}
    >
      <View style={styles.content}>
        <Ionicons 
          name={errorIcon} 
          size={24} 
          color="#FFFFFF" 
        />
        <Text style={styles.message}>
          {errorMessage}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={handleRetry}
        disabled={refreshing}
      >
        <Text style={styles.retryText}>
          {refreshing ? 'Retrying...' : 'Retry'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  message: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 13,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default GlobalErrorHandler;
