// src/context/NetworkContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { View, Text, StyleSheet } from 'react-native';

export const NetworkContext = createContext({ isConnected: true });

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
      
      // Only show banner when we're sure there's no internet
      setShowOfflineBanner(!state.isConnected || state.isInternetReachable === false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, isInternetReachable }}>
      {showOfflineBanner && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            You're offline. Some features may be unavailable.
          </Text>
        </View>
      )}
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#FF4C8B',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 1000,
  },
  offlineText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
