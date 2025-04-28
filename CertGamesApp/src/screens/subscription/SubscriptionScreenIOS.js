// src/screens/subscription/SubscriptionScreenIOS.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import AppleSubscriptionService, { SUBSCRIPTION_PRODUCT_ID } from '../../api/AppleSubscriptionService';
import apiClient from '../../api/apiClient';
import { fetchUserData, checkSubscription, logout, resetApiStatus } from '../../store/slices/userSlice';
import { API } from '../../api/apiConfig';

const { width } = Dimensions.get('window');

const SubscriptionScreenIOS = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [subscriptionProduct, setSubscriptionProduct] = useState(null);
  const [error, setError] = useState(null);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);
  
  // Animation states
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const benefitAnimations = React.useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get params from navigation
  const registrationData = route.params?.registrationData;
  const userId = route.params?.userId || useSelector(state => state.user.userId);
  const isOauthFlow = route.params?.isOauthFlow || false;
  const isNewUsername = route.params?.isNewUsername || false;
  const message = route.params?.message;
  const isRenewal = route.params?.renewal || false;
  
  // Debug logging
  useEffect(() => {
    console.log("SubscriptionScreen params:", {
      registrationData: registrationData ? "present" : "not present",
      isOauthFlow,
      isNewUsername,
      userId,
      isRenewal,
      message: route.params?.message || "no message"
    });
  }, []);
  
  useEffect(() => {
    // Initialize IAP connection and fetch subscription product
    const initializeSubscription = async () => {
      try {
        setInitialLoading(true);
        
        // Initialize connection to App Store with retry
        let retryCount = 0;
        let connectionInitialized = false;
        
        while (retryCount < 3 && !connectionInitialized) {
          try {
            connectionInitialized = await AppleSubscriptionService.initializeConnection();
            if (connectionInitialized) {
              console.log("Successfully initialized App Store connection");
              break;
            }
          } catch (initError) {
            console.error(`Initialization attempt ${retryCount + 1} failed:`, initError);
            retryCount++;
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (!connectionInitialized) {
          console.warn("Failed to initialize App Store connection after multiple attempts");
        }
        
        // Check for and finish any pending transactions
        try {
          await AppleSubscriptionService.checkPendingTransactions();
        } catch (pendingError) {
          console.error("Error checking pending transactions:", pendingError);
          // Non-fatal, continue
        }
        
        console.log("Fetching available subscriptions...");
        
        // Fetch available subscription products
        try {
          const subscriptions = await AppleSubscriptionService.getAvailableSubscriptions();
          console.log("Available subscriptions:", subscriptions);
          
          if (subscriptions && subscriptions.length > 0) {
            setSubscriptionProduct(subscriptions[0]);
          } else {
            console.warn("No subscription products found");
            // Still allow purchase to proceed
          }
        } catch (subscriptionError) {
          console.error("Error getting subscriptions:", subscriptionError);
          // Non-fatal, continue
        }
      } catch (err) {
        console.error('Error initializing subscription:', err);
        // Don't set error here - let user continue
      } finally {
        setInitialLoading(false);
      }
    };
    
    initializeSubscription();
    
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
    
    // Start pulsing animation for the CTA button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
    
    // Staggered animations for benefits
    Animated.stagger(150, 
      benefitAnimations.map(anim => 
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true
        })
      )
    ).start();
  }, []);
  
  // Poll for subscription status changes after purchase
  const pollSubscriptionStatus = async (userId, maxAttempts = 5) => {
    console.log(`[SUBSCRIPTION POLLING] Starting polling for userId: ${userId}`);
    let attempts = 0;
    
    // Function to check subscription status
    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        console.log(`[SUBSCRIPTION POLLING] Max attempts reached (${maxAttempts})`);
        return;
      }
      
      attempts++;
      console.log(`[SUBSCRIPTION POLLING] Attempt ${attempts}/${maxAttempts}`);
      
      try {
        // First check subscription status
        await dispatch(checkSubscription(userId));
        
        // Then fetch full user data
        const userData = await dispatch(fetchUserData(userId)).unwrap();
        
        console.log(`[SUBSCRIPTION POLLING] Status: ${userData.subscriptionActive ? 'ACTIVE' : 'INACTIVE'}`);
        console.log(`[SUBSCRIPTION POLLING] Status Data:`, {
          active: userData.subscriptionActive,
          status: userData.subscriptionStatus,
          platform: userData.subscriptionPlatform,
          type: userData.subscriptionType
        });
        
        // If subscription is now active, we can stop polling
        if (userData.subscriptionActive === true) {
          console.log(`[SUBSCRIPTION POLLING] Subscription is now active, stopping poll`);
          return;
        }
        
        // Otherwise, continue polling
        setTimeout(checkStatus, 2000); // Check every 2 seconds
      } catch (error) {
        console.error(`[SUBSCRIPTION POLLING] Error:`, error);
        // Continue polling despite errors
        setTimeout(checkStatus, 2000);
      }
    };
    
    // Start the initial check
    setTimeout(checkStatus, 2000); // First check after 2 seconds
  };

  const registerNewUser = async () => {
    try {
      setLoading(true);
      
      console.log("Registering new user with data:", {
        ...registrationData,
        password: '********' // Log masked password for security
      });
      
      // Register the user via API
      const response = await apiClient.post(API.AUTH.REGISTER, registrationData);
      
      if (!response.data || !response.data.user_id) {
        throw new Error('Registration failed: No user ID returned');
      }
      
      const newUserId = response.data.user_id;
      console.log("User registered successfully, ID:", newUserId);
      
      // Save user ID to secure storage
      await SecureStore.setItemAsync('userId', newUserId);
      
      // Update Redux state
      dispatch({ type: 'user/setCurrentUserId', payload: newUserId });
      
      // Fetch user data to update Redux
      await dispatch(fetchUserData(newUserId));
      
      setRegistrationCompleted(true);
      return newUserId;
      
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubscribe = async () => {
    // Prevent concurrent purchase attempts
    if (purchaseInProgress || loading) {
      console.log("Purchase already in progress, ignoring tap");
      return;
    }
    
    let userIdToUse = userId;
    
    try {
      setLoading(true);
      setPurchaseInProgress(true);
      setError(null);
      
      // Check for pending transactions first
      try {
        await AppleSubscriptionService.checkPendingTransactions();
      } catch (pendingError) {
        console.log("Error checking pending transactions (non-fatal):", pendingError);
        // Continue despite errors here
      }
      
      // STEP 1: Handle new user registration if needed
      if (registrationData && !registrationCompleted) {
        try {
          console.log("Checking if user already exists...");
          const existingUserCheck = await apiClient.get(`${API.USER.DETAILS(userIdToUse)}`).catch(() => null);
  
          if (existingUserCheck && existingUserCheck.data) {
            console.log("User already exists, skipping registration");
            userIdToUse = existingUserCheck.data._id;
            setRegistrationCompleted(true);
          } else {
            console.log("Registering new user");
            const response = await apiClient.post(API.AUTH.REGISTER, registrationData);
  
            if (!response.data || !response.data.user_id) {
              throw new Error('Registration failed: No user ID returned from API');
            }
  
            userIdToUse = response.data.user_id;
            console.log("User registered successfully, ID:", userIdToUse);
            await SecureStore.setItemAsync('userId', userIdToUse);
            
            // Update Redux state
            dispatch({ type: 'user/setCurrentUserId', payload: userIdToUse });
            
            // Fetch user data to update Redux
            await dispatch(fetchUserData(userIdToUse));
            
            setRegistrationCompleted(true);
          }
        } catch (regError) {
          console.error('Registration error:', regError);
          let errorMessage = 'Registration failed. Please try again.';
          
          if (regError.response && regError.response.data && regError.response.data.error) {
            errorMessage = regError.response.data.error;
          } else if (regError.message) {
            errorMessage = regError.message;
          }
          
          setError(errorMessage);
          setPurchaseInProgress(false);
          setLoading(false);
          return;
        }
      }
      
      // STEP 2: Ensure we have a user ID for the purchase
      if (!userIdToUse) {
        setError('User ID is missing. Please try again.');
        setPurchaseInProgress(false);
        setLoading(false);
        return;
      }
      
      // STEP 3: Make the actual purchase request
      console.log("Requesting subscription purchase for user:", userIdToUse);
      
      // TESTFLIGHT FIX: Add a small delay before starting purchase
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Request subscription purchase with improved error handling
      const purchaseResult = await AppleSubscriptionService.purchaseSubscription(userIdToUse);
      
      console.log("Purchase result:", purchaseResult);
      
      // Handle purchase results
      if (!purchaseResult || !purchaseResult.success) {
        const errorMessage = purchaseResult?.error || 'Failed to complete subscription purchase';
        console.error('Purchase failed:', errorMessage);
        
        // Show appropriate error message
        if (errorMessage.includes('cancel')) {
          setError('Subscription purchase was cancelled.');
        } else {
          setError(errorMessage);
        }
        
        setPurchaseInProgress(false);
        setLoading(false);
        return;
      }
      
      console.log("Subscription purchased successfully:", purchaseResult);
      
      // Add delay to allow server sync
      console.log("Waiting for backend sync...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Initial Redux update
      console.log("Checking subscription status...");
      try {
        await dispatch(checkSubscription(userIdToUse));
      } catch (subError) {
        console.error("Error checking subscription:", subError);
      }
      
      // Start polling for subscription status updates
      pollSubscriptionStatus(userIdToUse);
      
      // Navigate to purchase success screen
      try {
        navigation.navigate('PurchaseSuccess', { userId: userIdToUse });
      } catch (navError) {
        console.error("Navigation error:", navError);
        
        // Fallback: direct navigation to Main if PurchaseSuccess isn't available
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }]
          });
        } catch (fallbackError) {
          console.error("Fallback navigation error:", fallbackError);
        }
      }
      
    } catch (error) {
      console.error('Subscription error:', error);
      
      let errorMessage = 'Failed to complete subscription purchase';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.message && error.message.includes('cancel')) {
        setError('Subscription purchase was cancelled.');
      } else {
        setError(errorMessage);
      }
    } finally {
      // TESTFLIGHT FIX: Add delay for UI updates
      setTimeout(() => {
        setLoading(false);
        setPurchaseInProgress(false);
      }, 500);
    }
  };

  const handleContinueFree = async () => {
    // Prevent concurrent attempts
    if (loading) {
      console.log("Already processing, ignoring tap");
      return;
    }

    console.log("=== [handleContinueFree] START ===");
    console.log("Current flow state:", { 
      isOauthFlow, 
      isNewUsername, 
      userId: userId?.substring(0, 8), 
      registrationData: registrationData ? "present" : "not present" 
    });
    
    setLoading(true);
    setError(null);

    let userIdToUse = userId;

    try {
      // STEP 1: Handle user registration if needed
      if (registrationData && !registrationCompleted) {
        try {
          console.log("Checking if user already exists...");
          const existingUserCheck = await apiClient.get(`${API.USER.DETAILS(userIdToUse)}`).catch(() => null);

          if (existingUserCheck && existingUserCheck.data) {
            console.log("User already exists, skipping registration");
            userIdToUse = existingUserCheck.data._id;
            setRegistrationCompleted(true);
          } else {
            console.log("Registering new user");
            const response = await apiClient.post(API.AUTH.REGISTER, registrationData);

            if (!response.data || !response.data.user_id) {
              throw new Error('Registration failed: No user ID returned from API');
            }

            userIdToUse = response.data.user_id;
            console.log("User registered successfully, ID:", userIdToUse);
            await SecureStore.setItemAsync('userId', userIdToUse);
            setRegistrationCompleted(true);
          }
        } catch (regError) {
          console.error('Registration error:', regError);
          setError(regError.message || 'Username is already taken, try again with a different username');
          setLoading(false);
          return;
        }
      }

      // STEP 2: Validate userId
      if (!userIdToUse) {
        console.error("No userIdToUse after registration step!");
        setError("Failed to get valid user ID. Please try again.");
        setLoading(false);
        return;
      }

      // STEP 3: Update Redux state - FIXED for OAuth flow
      console.log("Updating Redux state with userId:", userIdToUse);
      
      // Create a more comprehensive payload with subscription data
      const payload = {
        user_id: userIdToUse,
        _id: userIdToUse,
        subscriptionActive: false,
        subscriptionType: 'free',
        needsUsername: false
      };
      
      // For OAuth flow, fetch user data first to preserve other fields
      if (isOauthFlow || isNewUsername) {
        console.log("OAUTH flow detected, fetching user data first");
        try {
          // Fetch existing user data to merge with our updates
          await dispatch(fetchUserData(userIdToUse)).unwrap();
          
          // Important: Wait for fetchUserData to complete
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Now update with subscription data
          dispatch({ type: 'user/setUser', payload });
        } catch (fetchError) {
          console.error("Error fetching user data:", fetchError);
          // Even if fetch fails, still try to update Redux
          dispatch({ type: 'user/setUser', payload });
        }
      } else {
        // For regular flow, just set the user data directly
        dispatch({ type: 'user/setUser', payload });
      }

      // STEP 4: Navigation
      console.log("Navigating to Main screen...");
      
      // Add delay for state updates to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Use try-catch for navigation
      try {
        if (navigation && navigation.reset) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }]
          });
        } else {
          throw new Error("Navigation.reset not available");
        }
      } catch (navError) {
        console.error("Navigation error:", navError);
        // Fallback navigation approach
        try {
          navigation.navigate('Main');
        } catch (fallbackError) {
          console.error("Fallback navigation error:", fallbackError);
        }
      }

    } catch (error) {
      console.error('Error during free tier setup:', error);
      setError(error.message || 'An unexpected error occurred.');
    } finally {
      // Always reset loading state
      setLoading(false);
      console.log("=== [handleContinueFree] END ===");
    }
  };
  
  // Get subscription type - prioritize OAuth/New Username flow over renewal
  const getSubscriptionType = () => {
    // Add more verbose debugging to understand what's happening
    console.log("Determining subscription type with flags:", {
      isOauthFlow,
      isNewUsername,
      isRenewal
    });
    
    // Make OAuth flow have strict priority
    if (isOauthFlow === true || isNewUsername === true) {
      console.log("Using OAUTH subscription type");
      return "oauth"; // This handles OAuth flows including new username
    } else if (isRenewal === true) {
      console.log("Using RENEWAL subscription type");
      return "renewal"; // This is for expired subscriptions
    } else {
      console.log("Using NEW subscription type (default)");
      return "new"; // Standard new subscription
    }
  };
  
  const subscriptionType = getSubscriptionType();
  console.log("Subscription type:", subscriptionType);

  // Features list
  const benefits = [
    {
      icon: 'game-controller-outline',
      title: '13,000+ Practice Questions',
      description: '13,000+ practice questions across 12 different certifications'
    },
    {
      icon: 'analytics-outline',
      title: 'ScenarioSphere & AnalogyHub',
      description: 'Full access to our advanced learning tools designed for certification success'
    },
    {
      icon: 'finger-print-outline',
      title: 'XploitCraft',
      description: 'Hands-on Cybersecurity and Pentesting Simulations'
    },
    {
      icon: 'library-outline',
      title: 'Resource Hub',
      description: 'Curated study materials, reference guides, and industry standards'
    },
    {
      icon: 'ribbon-outline',
      title: 'Game System',
      description: 'Track your progress with our gamified learning approach'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0b0c15', '#121225']}
        style={styles.gradientBackground}
      >
        <View style={styles.gridOverlay} />
      </LinearGradient>
      
      {/* Animated glow effects */}
      <View style={[styles.glowEffect, { top: '15%', left: '30%' }]} />
      <View style={[styles.glowEffect, { top: '60%', right: '20%', width: 200, height: 200 }]} />
      
      {/* Floating particles */}
      {[...Array(8)].map((_, index) => (
        <View 
          key={index} 
          style={[
            styles.particle, 
            { 
              top: `${10 + index * 10}%`, 
              left: `${index * 12}%`,
              width: 2 + index % 3,
              height: 2 + index % 3
            }
          ]} 
        />
      ))}
      
      {/* Back button - IMPORTANT: Preserving original functionality */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => {
          console.log("Back button pressed, subscription type:", subscriptionType);
          
          // First disable the button to prevent double clicks
          setLoading(true); // Use your existing loading state
          
          if (subscriptionType === "renewal") {
            // Do the logout first, then navigate
            dispatch(logout());
            // Small delay to ensure logout completes
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }]
              });
            }, 200); // Much shorter timeout
          } 
          else if (subscriptionType === "oauth" || isOauthFlow || isNewUsername) {
            // Simple goBack with no other operations
            navigation.goBack();
          }
          else {
            // Do the logout first, then navigate
            dispatch(logout());
            // Small delay to ensure logout completes
            setTimeout(() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Register' }]
              });
            }, 200); // Much shorter timeout
          }
        }}
        disabled={loading} // Prevent multiple clicks
      >
        <Ionicons name="arrow-back" size={22} color="#AAAAAA" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(30, 30, 50, 0.8)', 'rgba(23, 26, 35, 0.95)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardAccent} />
            
            <View style={styles.header}>
              <View style={styles.logoStack}>
                <LinearGradient
                  colors={['#6543CC', '#8A58FC']}
                  style={styles.logoContainer}
                >
                  <Ionicons name="rocket" size={44} color="#FFFFFF" />
                </LinearGradient>
                <LinearGradient
                  colors={['#FF4C8B', '#FF7950']}
                  style={styles.badgeContainer}
                >
                  <Ionicons name="flash" size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.headerTitle}>Unlimited Access</Text>
              <Text style={styles.subtitle}>Unlock your full certification potential</Text>
            </View>
            
            {message && (
              <View style={styles.messageContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#2ebb77" />
                <Text style={styles.messageText}>{message}</Text>
              </View>
            )}
            
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF4C8B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            {initialLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6543CC" />
                <Text style={styles.loadingText}>
                  Loading subscription options...
                </Text>
              </View>
            ) : (
              <View style={styles.pricingContainer}>
                <View style={styles.priceBox}>
                  <View style={styles.priceHeader}>
                    <Text style={styles.priceType}>Premium Membership</Text>
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                  </View>
                  
                  <View style={styles.priceRow}>
                    <Text style={styles.dollarSign}>$</Text>
                    <Text style={styles.price}>9</Text>
                    <View style={styles.priceDetails}>
                      <Text style={styles.priceCents}>.99</Text>
                      <Text style={styles.pricePeriod}>/month</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.priceBilled}>
                    3-day free trial, then billed monthly
                  </Text>
                  <Text style={styles.priceCancelAnytime}>
                    Cancel anytime
                  </Text>
                </View>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>13,000+</Text>
                    <Text style={styles.statLabel}>Practice Questions</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>10+</Text>
                    <Text style={styles.statLabel}>Premium Tools</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>12</Text>
                    <Text style={styles.statLabel}>Certification Paths</Text>
                  </View>
                </View>
                
                {/* Subscribe Button */}
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity 
                    style={styles.subscribeButton}
                    onPress={handleSubscribe}
                    disabled={loading || purchaseInProgress}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#6543CC', '#8A58FC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      {loading ? (
                        <View style={styles.buttonContent}>
                          <ActivityIndicator color="#FFFFFF" />
                          <Text style={styles.buttonText}>Processing...</Text>
                        </View>
                      ) : (
                        <View style={styles.buttonContent}>
                          <Text style={styles.buttonText}>Start Free Trial</Text>
                          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Continue with Free Button */}
                <TouchableOpacity 
                  style={styles.freeButton}
                  onPress={handleContinueFree}
                  disabled={loading || purchaseInProgress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.freeButtonText}>Continue with Free</Text>
                </TouchableOpacity>
                
                {/* Add comparison info */}
                <View style={styles.comparisonContainer}>
                  <Text style={styles.comparisonTitle}>Free vs Premium:</Text>
                  <View style={styles.comparisonRow}>
                    <Ionicons name="checkmark" size={16} color="#2ebb77" />
                    <Text style={styles.comparisonText}>Free: 100 practice questions</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Ionicons name="checkmark" size={16} color="#2ebb77" />
                    <Text style={styles.comparisonText}>Free: AnalogyHub access</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Ionicons name="close" size={16} color="#FF4C8B" />
                    <Text style={styles.comparisonText}>Free: No premium tools</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Ionicons name="checkmark" size={16} color="#2ebb77" />
                    <Text style={styles.comparisonText}>Premium: Unlimited questions</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Ionicons name="checkmark" size={16} color="#2ebb77" />
                    <Text style={styles.comparisonText}>Premium: All premium tools</Text>
                  </View>
                </View>
              </View>
            )}
            
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitsHeader}>
                <LinearGradient
                  colors={['rgba(101, 67, 204, 0.1)', 'rgba(255, 76, 139, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.benefitsHeaderGradient}
                >
                  <Ionicons name="diamond" size={20} color="#FF4C8B" style={styles.benefitsIcon} />
                  <Text style={styles.benefitsTitle}>Unlock All Features</Text>
                </LinearGradient>
              </View>
              
              <View style={styles.benefitsList}>
                {benefits.map((benefit, index) => (
                  <Animated.View 
                    key={index} 
                    style={[
                      styles.benefitItem,
                      {
                        opacity: benefitAnimations[Math.min(index, benefitAnimations.length - 1)],
                        transform: [{ 
                          translateX: benefitAnimations[Math.min(index, benefitAnimations.length - 1)].interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0]
                          })
                        }]
                      }
                    ]}
                  >
                    <View style={styles.benefitIconContainer}>
                      <LinearGradient
                        colors={index % 2 === 0 ? ['#6543CC', '#8A58FC'] : ['#FF4C8B', '#FF7950']}
                        style={styles.benefitIconGradient}
                      >
                        <Ionicons name={benefit.icon} size={22} color="#FFFFFF" />
                      </LinearGradient>
                    </View>
                    <View style={styles.benefitContent}>
                      <Text style={styles.benefitTitle}>{benefit.title}</Text>
                      <Text style={styles.benefitDescription}>{benefit.description}</Text>
                    </View>
                  </Animated.View>
                ))}
              </View>
              
              <View style={styles.guaranteeContainer}>
                <Ionicons name="shield-checkmark" size={22} color="#2ebb77" />
                <Text style={styles.guaranteeText}>24/7 Active Support & Mentor</Text>
              </View>
            </View>
            
            <View style={styles.testimonialsContainer}>
              <View style={styles.testimonialBadge}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.testimonialBadgeText}>User Success</Text>
              </View>
              <Text style={styles.testimonialText}>
                "As someone with ADHD, traditional studying was a nightmare. The gamified elements kept me focused, and I surprised myself by completing all three certs in under 4 months!"
              </Text>
              <Text style={styles.testimonialAuthor}>— Connor B, SOC Intern.</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C15',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  gridOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.2,
    borderWidth: 0.5,
    borderColor: 'rgba(101, 67, 204, 0.1)',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    width: '100%',
    height: '100%',
    borderRightWidth: 40,
    borderBottomWidth: 40,
  },
  glowEffect: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(101, 67, 204, 0.15)',
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
    elevation: 20,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#6543CC',
    opacity: 0.6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 15,
    marginBottom: 10,
    zIndex: 10,
  },
  backButtonText: {
    color: '#AAAAAA',
    marginLeft: 8,
    fontSize: 16,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#8A58FC',
  },
  header: {
    alignItems: 'center',
    padding: 25,
    paddingBottom: 15,
  },
  logoStack: {
    position: 'relative',
    marginBottom: 15,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  badgeContainer: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    right: -5,
    top: -5,
    borderWidth: 2,
    borderColor: '#1A1A2A',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(101, 67, 204, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
    fontFamily: 'Orbitron-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#2ebb77',
  },
  messageText: {
    color: '#2ebb77',
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 76, 139, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FF4C8B',
  },
  errorText: {
    color: '#FF4C8B',
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    color: '#AAAAAA',
    marginTop: 15,
    fontSize: 16,
  },
  pricingContainer: {
    padding: 20,
  },
  priceBox: {
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(101, 67, 204, 0.2)',
    marginBottom: 20,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceType: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Orbitron',
  },
  popularBadge: {
    backgroundColor: '#FF4C8B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'ShareTechMono',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  dollarSign: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 55,
  },
  priceDetails: {
    marginTop: 10,
  },
  priceCents: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  pricePeriod: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  priceBilled: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  priceCancelAnytime: {
    color: '#2ebb77',
    fontSize: 14,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#AAAAAA',
    fontSize: 11,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 5,
  },
  subscribeButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginVertical: 5,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Free tier button styles
  freeButton: {
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#AAAAAA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  freeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  // Comparison styles
  comparisonContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  comparisonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  comparisonText: {
    color: '#DDDDDD',
    marginLeft: 10,
    fontSize: 14,
  },
  benefitsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  benefitsHeader: {
    marginBottom: 20,
  },
  benefitsHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  benefitsIcon: {
    marginRight: 10,
  },
  benefitsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  benefitIconContainer: {
    marginTop: 2,
  },
  benefitIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    color: '#AAAAAA',
    fontSize: 14,
    lineHeight: 20,
  },
  guaranteeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  guaranteeText: {
    color: '#2ebb77',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  testimonialsContainer: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  testimonialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
  },
  testimonialBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  testimonialText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  testimonialAuthor: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '500',
  }
});

export default SubscriptionScreenIOS;
