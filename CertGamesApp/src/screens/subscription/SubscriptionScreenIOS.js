// src/screens/subscription/SubscriptionScreenIOS.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import AppleSubscriptionService, { SUBSCRIPTION_PRODUCT_ID } from '../../api/AppleSubscriptionService';
import apiClient from '../../api/apiClient';
import { fetchUserData, checkSubscription, logout } from '../../store/slices/userSlice';
import { API } from '../../api/apiConfig';

const SubscriptionScreenIOS = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [subscriptionProduct, setSubscriptionProduct] = useState(null);
  const [error, setError] = useState(null);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false); // Added to prevent multiple purchase attempts
  
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  
  // Get parameters from route
  const registrationData = route.params?.registrationData;
  const isOauthFlow = route.params?.isOauthFlow || false;
  const isNewUsername = route.params?.isNewUsername || false;
  const userId = route.params?.userId || useSelector(state => state.user.userId);
  const isRenewal = route.params?.renewal || false;
  
  // This helps with debugging to understand what's going on
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
        
        // Initialize connection to App Store
        const connectionInitialized = await AppleSubscriptionService.initializeConnection();
        if (!connectionInitialized) {
          throw new Error('Failed to initialize App Store connection');
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
            setError("No subscription products found. Please try again later.");
          }
        } catch (subscriptionError) {
          console.error("Error getting subscriptions:", subscriptionError);
          setError(`Failed to retrieve subscription information: ${subscriptionError.message}`);
        }
      } catch (err) {
        console.error('Error initializing subscription:', err);
        setError('Failed to initialize subscription services. Please try again later.');
      } finally {
        setInitialLoading(false);
      }
    };
    
    initializeSubscription();
  }, []);
  
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
    if (purchaseInProgress) {
      console.log("Purchase already in progress, ignoring tap");
      return;
    }
    
    let userIdToUse = userId;
    
    try {
      setLoading(true);
      setPurchaseInProgress(true); // Set flag to prevent multiple attempts
      setError(null);
      
      // Check if this is a new registration
      if (registrationData && !registrationCompleted) {
        try {
          userIdToUse = await registerNewUser();
        } catch (regError) {
          // Registration error is already set in registerNewUser function
          setPurchaseInProgress(false); // Reset flag on error
          return;
        }
      }
      
      // Ensure we have a user ID
      if (!userIdToUse) {
        setError('User ID is missing. Please try again.');
        setPurchaseInProgress(false); // Reset flag on error
        return;
      }
      
      console.log("Requesting subscription for user:", userIdToUse);
      
      // Request subscription purchase
      const purchaseResult = await AppleSubscriptionService.purchaseSubscription(userIdToUse);
      
      if (!purchaseResult.success) {
        throw new Error(purchaseResult.error || 'Failed to complete subscription purchase');
      }
      
      console.log("Subscription purchased successfully:", purchaseResult);
      
      // Update subscription status in Redux
      await dispatch(checkSubscription(userIdToUse));
      
      // Navigate to the main app
      Alert.alert(
        "Subscription Successful",
        "Thank you for subscribing to CertGames! You now have full access to all features.",
        [
          { 
            text: "Continue", 
            onPress: () => navigation.navigate('Home')
          }
        ]
      );
      
    } catch (error) {
      console.error('Subscription error:', error);
      
      let errorMessage = 'Failed to complete subscription purchase';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle user cancellation differently
      if (error.message && error.message.includes('cancel')) {
        setError('Subscription purchase was cancelled.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setPurchaseInProgress(false); // Always reset the flag when done
    }
  };
  
  const handleRestorePurchases = async () => {
    // Prevent concurrent operations
    if (purchaseInProgress || loading) {
      return;
    }
    
    try {
      setLoading(true);
      setPurchaseInProgress(true);
      setError(null);
      
      if (!userId) {
        setError('User ID is missing. Please log in again.');
        return;
      }
      
      console.log("Restoring purchases for user:", userId);
      
      const restoreResult = await AppleSubscriptionService.restorePurchases(userId);
      
      if (!restoreResult.success) {
        Alert.alert(
          "Restore Result",
          restoreResult.message || "No previous subscriptions found to restore."
        );
        return;
      }
      
      console.log("Purchases restored successfully:", restoreResult);
      
      // Update subscription status in Redux
      await dispatch(checkSubscription(userId));
      
      // Navigate to the main app if subscription is now active
      const userState = await dispatch(fetchUserData(userId)).unwrap();
      
      if (userState.subscriptionActive) {
        Alert.alert(
          "Subscription Restored",
          "Your subscription has been successfully restored!",
          [
            { 
              text: "Continue", 
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      } else {
        Alert.alert(
          "Restore Completed",
          "No active subscriptions were found to restore."
        );
      }
      
    } catch (error) {
      console.error('Restore purchases error:', error);
      setError('Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
      setPurchaseInProgress(false);
    }
  };
  
  const renderPricingDetails = () => {
    if (!subscriptionProduct) {
      return (
        <View style={styles.pricingCard}>
          <Text style={[styles.priceTitle, { color: theme.colors.text }]}>
            Monthly Premium
          </Text>
          <Text style={[styles.priceValue, { color: theme.colors.text }]}>
            $9.99
          </Text>
          <Text style={[styles.priceDescription, { color: theme.colors.textSecondary }]}>
            per month
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.pricingCard}>
        <Text style={[styles.priceTitle, { color: theme.colors.text }]}>
          {subscriptionProduct.title || "Unlimited"}
        </Text>
        <Text style={[styles.priceValue, { color: theme.colors.text }]}>
          {subscriptionProduct.localizedPrice || "$9.99"}
        </Text>
        <Text style={[styles.priceDescription, { color: theme.colors.textSecondary }]}>
          {subscriptionProduct.subscriptionPeriodUnitIOS === 'MONTH' ? 'per month' : 'subscription'}
        </Text>
      </View>
    );
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
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.background + '80']}
        style={styles.gradientBackground}
      />
      
      {/* Add back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => {
          console.log("Back button pressed, subscription type:", subscriptionType);
          if (subscriptionType === "renewal") {
            // Instead of trying to navigate directly to Login, do a full reset
            dispatch(logout());
            
            // Reset the entire navigation state to go back to the root Auth navigator
            navigation.reset({
              index: 0,
              routes: [{ name: 'AuthNavigator' }],
            });
          } else {
            // For all other cases, just go back
            navigation.goBack();
          }
        }}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Image 
              source={require('../../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {subscriptionType === "renewal" ? "Unlock Full Access" : 
               subscriptionType === "oauth" ? "Unlock Full Access" : 
               "Unlock Full Access"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {subscriptionType === "renewal" 
                ? "Get unlimited access to all certification tools and premium features."
                : subscriptionType === "oauth"
                  ? "Get unlimited access to all certification tools and premium features."
                  : "Get unlimited access to all certification tools and premium features."}
            </Text>
          </View>
          
          {initialLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading subscription options...
              </Text>
            </View>
          ) : (
            <>
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={24} color="#FF4C8B" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              
              {renderPricingDetails()}
              
              <View style={styles.featuresContainer}>
                <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>
                  What You'll Get:
                </Text>
                
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  <Text style={[styles.featureText, { color: theme.colors.text }]}>
                    13,000+ practice questions across all certification paths
                  </Text>
                </View>
                
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  <Text style={[styles.featureText, { color: theme.colors.text }]}>
                    Full access to ScenarioSphere, AnalogyHub, and XploitCraft
                  </Text>
                </View>
                
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  <Text style={[styles.featureText, { color: theme.colors.text }]}>
                    Unlock achievements, track progress, and compete on leaderboards
                  </Text>
                </View>
                
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  <Text style={[styles.featureText, { color: theme.colors.text }]}>
                    Access on both mobile app and web platform
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.subscribeButton, 
                  { backgroundColor: theme.colors.primary },
                  (loading || purchaseInProgress) && styles.disabledButton
                ]}
                onPress={handleSubscribe}
                disabled={loading || purchaseInProgress}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    {subscriptionType === "renewal" ? "Subscribe Now" : "Subscribe Now"}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestorePurchases}
                disabled={loading || purchaseInProgress}
              >
                <Text style={[styles.restoreText, { color: theme.colors.primary }]}>
                  Restore Purchases
                </Text>
              </TouchableOpacity>
              
              <View style={styles.termsContainer}>
                <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
                  By subscribing, you agree to our {' '}
                  <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                    Terms of Service
                  </Text>
                  {' '} and {' '}
                  <Text style={[styles.termsLink, { color: theme.colors.primary }]}>
                    Privacy Policy
                  </Text>
                  . Subscription will automatically renew unless canceled at least 24 hours before the end of the current period. You can manage your subscription in your iTunes Account Settings.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 76, 139, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF4C8B',
    marginLeft: 10,
    flex: 1,
  },
  pricingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  priceTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  priceValue: {
    fontSize: 40,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  priceDescription: {
    fontSize: 16,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  subscribeButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  restoreText: {
    fontSize: 16,
    fontWeight: '500',
  },
  termsContainer: {
    marginTop: 10,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  termsLink: {
    fontWeight: '500',
  },
  // Back button styles
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SubscriptionScreenIOS;
