// src/screens/subscription/UpgradeSubscriptionScreen.js
import React, { useState, useEffect, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AppleSubscriptionService from '../../api/AppleSubscriptionService';
import { fetchUserData, checkSubscription } from '../../store/slices/userSlice';

const { width } = Dimensions.get('window');

/**
 * UpgradeSubscriptionScreen - A simplified screen for existing users to upgrade to premium
 */
const UpgradeSubscriptionScreen = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [subscriptionProduct, setSubscriptionProduct] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);
  
  // Animation states
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const benefitAnimations = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(0))).current;
  const successAnimation = useRef(new Animated.Value(0)).current;
  
  // Hooks
  const dispatch = useDispatch();
  const navigation = useNavigation();
  
  // Redux state
  const { userId, practiceQuestionsRemaining } = useSelector(state => state.user);
  
  // Apply haptic feedback on component mount
  useEffect(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);
  
  // Initialize subscription service
  useEffect(() => {
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
          if (subscriptions && subscriptions.length > 0) {
            setSubscriptionProduct(subscriptions[0]);
          } else {
            console.warn("No subscription products found");
          }
        } catch (subscriptionError) {
          console.error("Error getting subscriptions:", subscriptionError);
          // Non-fatal, continue
        }
      } catch (err) {
        console.error('Error initializing subscription:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    
    initializeSubscription();
    
    // Start animations
    startAnimations();
  }, []);
  
  // Start animations
  const startAnimations = () => {
    // Main content animations
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
    
    // Pulse animation for CTA button
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
  };
  
  // Handle subscription purchase
  const handleSubscribe = async () => {
    // Prevent concurrent purchase attempts
    if (purchaseInProgress || loading) {
      console.log("Purchase already in progress, ignoring tap");
      return;
    }
    
    // Apply haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      setLoading(true);
      setPurchaseInProgress(true);
      setError(null);
      
      // Check for pending transactions first
      try {
        await AppleSubscriptionService.checkPendingTransactions();
      } catch (pendingError) {
        console.log("Error checking pending transactions (non-fatal):", pendingError);
      }
      
      // Ensure we have a user ID
      if (!userId) {
        setError('User ID is missing. Please try again.');
        setPurchaseInProgress(false);
        setLoading(false);
        return;
      }
      
      console.log("Requesting subscription purchase for user:", userId);
      
      // TESTFLIGHT FIX: Add a small delay before starting purchase
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Request subscription purchase
      const purchaseResult = await AppleSubscriptionService.purchaseSubscription(userId);
      
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
      
      // TESTFLIGHT FIX: Add significant delay to allow transaction to process
      console.log("Waiting for backend sync...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update subscription status in Redux
      console.log("Checking subscription status...");
      try {
        await dispatch(checkSubscription(userId));
      } catch (subError) {
        console.error("Error checking subscription:", subError);
      }
      
      // Update full user data
      console.log("Fetching updated user data...");
      try {
        const userData = await dispatch(fetchUserData(userId)).unwrap();
        console.log(`Subscription status after update: ${userData.subscriptionActive}`);
      } catch (dataError) {
        console.error("Error fetching user data:", dataError);
      }
      
      // Show success animation
      setSuccess(true);
      Animated.sequence([
        Animated.timing(successAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.delay(1500)  // TESTFLIGHT FIX: Increase success display time
      ]).start();
      
      // Apply success haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
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
      // TESTFLIGHT FIX: Add delay for UI updates
      setTimeout(() => {
        setLoading(false);
        setPurchaseInProgress(false);
      }, 500);
    }
  };
  
  // Handle back button press
  const handleBackPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };
  
  // Render subscription pricing
  const renderSubscriptionPrice = () => {
    if (subscriptionProduct) {
      return (
        <View style={styles.priceRow}>
          <Text style={styles.dollarSign}>$</Text>
          <Text style={styles.price}>9</Text>
          <View style={styles.priceDetails}>
            <Text style={styles.priceCents}>.99</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
        </View>
      );
    }
    
    // Default price if product not loaded
    return (
      <View style={styles.priceRow}>
        <Text style={styles.dollarSign}>$</Text>
        <Text style={styles.price}>9</Text>
        <View style={styles.priceDetails}>
          <Text style={styles.priceCents}>.99</Text>
          <Text style={styles.pricePeriod}>/month</Text>
        </View>
      </View>
    );
  };
  
  // Benefits list
  const benefits = [
    {
      icon: 'infinite-outline',
      title: 'Unlimited Questions',
      description: 'Access to all 13,000+ practice questions across 12 certifications'
    },
    {
      icon: 'analytics-outline',
      title: 'Premium Learning Tools',
      description: 'Full access to ScenarioSphere, AnalogyHub and more'
    },
    {
      icon: 'finger-print-outline',
      title: 'XploitCraft Access',
      description: 'Hands-on cybersecurity and pentesting simulations'
    },
    {
      icon: 'library-outline',
      title: 'Resource Hub',
      description: 'Curated study materials and reference guides'
    },
    {
      icon: 'star-outline',
      title: 'Daily Challenges',
      description: 'Daily question answering with extra rewards'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0b0c15', '#121225']}
        style={styles.gradientBackground}
      >
        <View style={styles.gridOverlay} />
      </LinearGradient>
      
      {/* Glow effects */}
      <View style={[styles.glowEffect, { top: '15%', left: '30%' }]} />
      <View style={[styles.glowEffect, { top: '60%', right: '20%', width: 200, height: 200 }]} />
      
      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleBackPress}
        disabled={loading}
      >
        <Ionicons name="arrow-back" size={24} color="#AAAAAA" />
        <Text style={styles.backButtonText}>Back</Text>
        <View style={{flex: 1}}/>
        <View style={styles.swipeIndicator} /> 
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
          {success ? (
            <Animated.View 
              style={[
                styles.successCard,
                {
                  opacity: successAnimation,
                  transform: [
                    { scale: successAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })}
                  ]
                }
              ]}
            >
              <View style={styles.successIconContainer}>
                <LinearGradient
                  colors={['#2ebb77', '#25A76A']}
                  style={styles.successIconGradient}
                >
                  <Ionicons name="checkmark" size={60} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.successTitle}>Upgrade Successful!</Text>
              <Text style={styles.successText}>
                Thank you for upgrading to Premium! You now have unlimited access to all premium features.
              </Text>
              <TouchableOpacity
                style={styles.successButton}
                onPress={handleBackPress}
              >
                <LinearGradient
                  colors={['#6543CC', '#8A58FC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.successButtonText}>Return to App</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
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
                    <Ionicons name="rocket" size={40} color="#FFFFFF" />
                  </LinearGradient>
                  <LinearGradient
                    colors={['#FF4C8B', '#FF7950']}
                    style={styles.badgeContainer}
                  >
                    <Ionicons name="flash" size={18} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <Text style={styles.headerTitle}>Unlimited</Text>
                <Text style={styles.subtitle}>Unlimited Access to All Features</Text>
              </View>
              
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
                    
                    {renderSubscriptionPrice()}
                    
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
                </View>
              )}         
                  
                  {/* Current status box */}
                  <View style={styles.currentStatusBox}>
                    <Ionicons name="information-circle" size={20} color="#6543CC" />
                    <Text style={styles.currentStatusText}>
                      You have <Text style={styles.highlightText}>{practiceQuestionsRemaining}</Text> free questions remaining
                    </Text>
                  </View>
                  
              
              <View style={styles.benefitsContainer}>
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
                  <Text style={styles.guaranteeText}>24/7 Support & Mentorship</Text>
                </View>
              </View>
              
              <View style={styles.testimonialsContainer}>
                <View style={styles.testimonialBadge}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.testimonialBadgeText}>User Success</Text>
                </View>
                <Text style={styles.testimonialText}>
                  "I passed my Security+ on the first try after using CertGames for just 4 weeks. The practice questions and scenarios were spot-on with what appeared on the exam!"
                </Text>
                <Text style={styles.testimonialAuthor}>— Sophia L., SOC Analyst</Text>
              </View>
            </LinearGradient>
          )}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 15,
    paddingBottom: 10,
    zIndex: 10,
    backgroundColor: 'rgba(23, 26, 35, 0.95)', // Match card background
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
    marginBottom: -1, // Ensure seamless connection with card
  },
  backButtonText: {
    color: '#AAAAAA',
    marginLeft: 9,
    fontSize: 17,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 0, // Remove top padding as it's now part of the header
    paddingBottom: 40,
  },
  swipeIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 5,
    marginBottom: 8,
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
    fontSize: 24,
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
    fontFamily: 'ShareTechMono',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    color: '#AAAAAA',
    marginTop: 15,
    fontSize: 16,
    fontFamily: 'ShareTechMono',
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
    marginBottom: 3,
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
    fontFamily: 'Orbitron-Bold',
  },
  price: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: 'bold',
    lineHeight: 55,
  },
  priceDetails: {
    marginTop: 15,
  },
  priceCents: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pricePeriod: {
    color: '#AAAAAA',
    fontSize: 13,
  },
  priceBilled: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  priceCancelAnytime: {
    color: '#2ebb77',
    fontSize: 12,
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
  currentStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
    padding: 10,
    borderRadius: 13,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  currentStatusText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 12,
    flex: 1,
  },
  highlightText: {
    color: '#FF4C8B',
    fontWeight: 'bold',
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
    fontFamily: 'Orbitron',
  },
  benefitsContainer: {
    padding: 20,
    paddingTop: 0,
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
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Orbitron',
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
    fontSize: 15,
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
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  testimonialText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  testimonialAuthor: {
    color: '#AAAAAA',
    fontSize: 15,
    fontWeight: '500',
  },
  // Success card styles
  successCard: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(23, 26, 35, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    width: 100, 
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2ebb77',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  successTitle: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  successText: {
    fontSize: 17,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 10, 
  },
  successButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6543CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    width: '100%',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
  },
});

export default UpgradeSubscriptionScreen;
