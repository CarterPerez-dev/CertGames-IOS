// src/context/NetworkContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const NetworkContext = createContext({ isConnected: true });

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
      
      // Only show banner when BOTH are false (truly offline)
      setShowOfflineBanner(!state.isConnected && state.isInternetReachable === false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, isInternetReachable }}>
      {showOfflineBanner && (
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={['#CF0000', '#B30000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.offlineBanner}
          >
            <Ionicons name="cloud-offline" size={22} color="#FFFFFF" />
            <Text style={styles.offlineText}>
              You're offline. Some features may be unavailable.
            </Text>
          </LinearGradient>
        </View>
      )}
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    // Drop shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 5,
  },
  offlineBanner: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40, // Higher padding for iOS status bar
    paddingBottom: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  offlineText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  }
});
