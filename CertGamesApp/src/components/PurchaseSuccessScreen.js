// src/components/PurchaseSuccessScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { fetchUserData, checkSubscription } from '../store/slices/userSlice';

const PurchaseSuccessScreen = ({ route }) => {
  const [activating, setActivating] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState('Processing your subscription...');
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { userId, subscriptionActive } = useSelector(state => state.user);
  
  // Get the userId from route params or Redux
  const userIdToUse = route.params?.userId || userId;
  
  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      })
    ]).start();
  }, []);
  
  // Poll for subscription status changes
  useEffect(() => {
    if (!userIdToUse) return;
    
    const pollSubscription = async () => {
      try {
        // Only try 8 times (16 seconds total)
        if (attempts >= 8) {
          setMessage("Your purchase was successful! It may take a minute to activate.");
          setActivating(false);
          return;
        }
        
        // Increment attempt counter
        setAttempts(prev => prev + 1);
        
        // Check subscription status with backend
        await dispatch(checkSubscription(userIdToUse));
        
        // Get full user data
        const userData = await dispatch(fetchUserData(userIdToUse)).unwrap();
        
        console.log("Subscription check:", {
          active: userData.subscriptionActive,
          status: userData.subscriptionStatus,
          platform: userData.subscriptionPlatform
        });
        
        // If subscription is active, stop polling
        if (userData.subscriptionActive === true) {
          setMessage("Your subscription is now active!");
          setActivating(false);
          return;
        }
        
        // Update message based on attempt count
        if (attempts === 3) {
          setMessage("Still processing your payment...");
        } else if (attempts === 5) {
          setMessage("Almost there! Finalizing your subscription...");
        }
        
        // Continue polling
        setTimeout(pollSubscription, 2000);
      } catch (error) {
        console.error("Error polling subscription:", error);
        // Continue polling despite errors
        setTimeout(pollSubscription, 2000);
      }
    };
    
    // Start polling
    pollSubscription();
  }, [userIdToUse, attempts]);
  
  // Handle subscription status updates from Redux
  useEffect(() => {
    if (subscriptionActive === true) {
      setMessage("Your subscription is now active!");
      setActivating(false);
    }
  }, [subscriptionActive]);
  
  // Handle continue to app button
  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }]
    });
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0b0c15', '#121225']}
        style={styles.gradientBackground}
      />
      
      <Animated.View 
        style={[
          styles.card, 
          { 
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <View style={styles.iconContainer}>
          {activating ? (
            <LinearGradient
              colors={['#6543CC', '#8A58FC']}
              style={styles.iconBackground}
            >
              <ActivityIndicator size="large" color="#FFFFFF" />
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={['#2ebb77', '#25A76A']}
              style={styles.iconBackground}
            >
              <Ionicons name="checkmark" size={60} color="#FFFFFF" />
            </LinearGradient>
          )}
        </View>
        
        <Text style={styles.title}>
          {activating ? 'Processing Purchase' : 'Purchase Successful!'}
        </Text>
        
        <Text style={styles.message}>{message}</Text>
        
        {activating ? (
          <View style={styles.loadingContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, {
                width: `${Math.min(100, attempts * 12.5)}%`
              }]} />
            </View>
            <Text style={styles.loadingText}>Please wait...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <LinearGradient
              colors={['#6543CC', '#8A58FC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Continue to App</Text>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0B0C15',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  card: {
    backgroundColor: 'rgba(23, 26, 35, 0.95)',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 25,
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6543CC',
    borderRadius: 3,
  },
  loadingText: {
    color: '#9FAAB0',
    fontSize: 14,
  },
  continueButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default PurchaseSuccessScreen;
