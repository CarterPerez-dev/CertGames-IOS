// src/screens/subscription/SubscriptionScreenIOS.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppleSubscriptionService from '../../api/AppleSubscriptionService';
import * as SecureStore from 'expo-secure-store';

const SubscriptionScreenIOS = ({ route, navigation }) => {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  
  const { userId } = useSelector(state => state.user);
  const renewalParam = route.params?.renewal === true;

  useEffect(() => {
    const loadSubscriptionData = async () => {
      if (Platform.OS !== 'ios') {
        setInitializing(false);
        return;
      }
      
      try {
        // Initialize IAP connection
        await AppleSubscriptionService.initializeConnection();
        
        // Get available subscriptions
        const subscriptions = await AppleSubscriptionService.getAvailableSubscriptions();
        if (subscriptions && subscriptions.length > 0) {
          setSubscriptionInfo(subscriptions[0]);
        }
        
        // Check subscription status
        if (userId) {
          const status = await AppleSubscriptionService.checkSubscriptionStatus(userId);
          setIsSubscriptionActive(status.subscriptionActive);
        }
      } catch (error) {
        console.error('Error loading subscription data:', error);
        setError('Failed to load subscription information');
      } finally {
        setInitializing(false);
      }
    };
    
    loadSubscriptionData();
  }, [userId]);

  const handleSubscribe = async () => {
    if (!userId) {
      Alert.alert(
        'Account Required',
        'Please create an account or sign in to subscribe',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log("Starting subscription purchase for userId:", userId);
      
      // Initialize IAP connection if needed
      const connected = await AppleSubscriptionService.initializeConnection();
      if (!connected) {
        throw new Error("Failed to connect to App Store");
      }
      
      // Get available subscriptions to confirm product is configured
      const subscriptions = await AppleSubscriptionService.getAvailableSubscriptions();
      console.log("Available subscriptions:", subscriptions.length > 0 ? "Found" : "None found");
      
      if (!subscriptions || subscriptions.length === 0) {
        throw new Error("No subscription products available");
      }
      
      // Attempt to purchase subscription
      const result = await AppleSubscriptionService.purchaseSubscription(userId);
      console.log("Purchase result:", result.success ? "Success" : "Failed");
      
      if (result.success) {
        // Success! Refresh subscription status
        const status = await AppleSubscriptionService.checkSubscriptionStatus(userId);
        setIsSubscriptionActive(status.subscriptionActive);
        
        // Show success message
        Alert.alert(
          'Subscription Activated',
          'Your premium subscription has been activated successfully!',
          [{ text: 'Continue', onPress: () => navigation.navigate('Home') }]
        );
      } else {
        if (result.error === 'User cancelled') {
          // User cancellation is not an error to show
          console.log("User cancelled purchase");
        } else {
          setError(result.error || 'Subscription purchase failed');
        }
      }
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      
      // Provide more helpful error messages
      if (error.message && error.message.includes('already owns')) {
        // User already has an active subscription
        Alert.alert(
          'Subscription Already Active',
          'You already have an active subscription. Try restoring purchases instead.',
          [{ text: 'OK' }]
        );
      } else {
        setError('Failed to complete subscription purchase: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!userId) {
      Alert.alert(
        'Account Required',
        'Please create an account or sign in to restore purchases',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await AppleSubscriptionService.restorePurchases(userId);
      
      if (result.success) {
        // Refresh subscription status
        const status = await AppleSubscriptionService.checkSubscriptionStatus(userId);
        setIsSubscriptionActive(status.subscriptionActive);
        
        Alert.alert(
          'Purchases Restored',
          'Your subscription has been restored successfully!',
          [{ text: 'Continue', onPress: () => navigation.navigate('Home') }]
        );
      } else {
        Alert.alert(
          'Restore Failed',
          result.message || 'No previous purchases found to restore',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      setError('Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  const renderBenefits = () => {
    const benefits = [
      {
        icon: 'trophy-outline',
        title: 'Practice Exams',
        description: '13,000+ questions covering CompTIA, ISC2, and AWS certifications'
      },
      {
        icon: 'rocket-outline',
        title: 'Learning Tools',
        description: 'Access ScenarioSphere, AnalogyHub, GRC Wizard, and XploitCraft'
      },
      {
        icon: 'game-controller-outline',
        title: 'Gamified Learning',
        description: 'Earn XP, avatars, unlock achievements, and compete on leaderboards'
      },
      {
        icon: 'headset-outline',
        title: 'Expert Support',
        description: 'Get answers or support for your upcoming exam at any time'
      }
    ];

    return benefits.map((benefit, index) => (
      <View key={index} style={styles.benefitItem}>
        <Ionicons name={benefit.icon} size={24} color="#6543CC" style={styles.benefitIcon} />
        <View style={styles.benefitContent}>
          <Text style={styles.benefitTitle}>{benefit.title}</Text>
          <Text style={styles.benefitDescription}>{benefit.description}</Text>
        </View>
      </View>
    ));
  };

  if (initializing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6543CC" />
        <Text style={styles.loadingText}>Loading subscription information...</Text>
      </SafeAreaView>
    );
  }

  if (isSubscriptionActive) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#121212', '#1a1a2e']}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.activeSubscriptionContainer}>
            <View style={styles.activeIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#2EBB77" />
            </View>
            <Text style={styles.activeTitle}>Premium Subscription Active</Text>
            <Text style={styles.activeDescription}>
              You have full access to all features and content.
            </Text>
            
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.continueButtonText}>Continue to App</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.managementInfo}>
              <Text style={styles.managementText}>
                To manage your subscription, go to App Store → Profile → Subscriptions
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#121212', '#1a1a2e']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#6543CC', '#8A58FC']}
              style={styles.logoBackground}
            >
              <Ionicons name="rocket" size={40} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.headerTitle}>
            {renewalParam ? 'Reactivate Your Subscription' : 'Upgrade to Premium'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {renewalParam 
              ? 'Continue your certification journey with premium access'
              : 'Unlock all features and boost your certification prep'}
          </Text>
        </View>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF4C8B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        <View style={styles.pricingCard}>
          <View style={styles.priceHeader}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badge}>PREMIUM</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>$</Text>
              <Text style={styles.price}>9</Text>
              <View style={styles.priceFraction}>
                <Text style={styles.priceDecimal}>.99</Text>
                <Text style={styles.month}>/month</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2EBB77" />
              <Text style={styles.featureText}>Unlimited access to all content</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2EBB77" />
              <Text style={styles.featureText}>Cancel anytime</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2EBB77" />
              <Text style={styles.featureText}>Sync across web and mobile</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.subscribeButton, loading && styles.disabledButton]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.subscribeButtonText}>
                {renewalParam ? 'Reactivate Subscription' : 'Subscribe Now'}
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={loading}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Subscription Benefits</Text>
          <View style={styles.benefitsList}>
            {renderBenefits()}
          </View>
        </View>
        
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By subscribing, you agree to our Terms and Privacy Policy. Payment will be charged to your Apple ID account. Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period. Manage your subscriptions in App Store Settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 20,
    fontSize: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoBackground: {
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    maxWidth: '85%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 76, 139, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF4C8B',
    marginLeft: 10,
    flex: 1,
  },
  pricingCard: {
    backgroundColor: 'rgba(26, 26, 46, 0.7)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(101, 67, 204, 0.3)',
  },
  priceHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeContainer: {
    backgroundColor: '#6543CC',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
  },
  badge: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currency: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 6,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
  },
  priceFraction: {
    marginTop: 8,
  },
  priceDecimal: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  month: {
    color: '#AAAAAA',
    fontSize: 16,
  },
  features: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: '#FFFFFF',
    marginLeft: 12,
    fontSize: 16,
  },
  subscribeButton: {
    backgroundColor: '#6543CC',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  restoreButton: {
    borderWidth: 1,
    borderColor: '#6543CC',
    backgroundColor: 'transparent',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#6543CC',
    fontSize: 14,
    fontWeight: '500',
  },
  benefitsContainer: {
    marginBottom: 24,
  },
  benefitsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  benefitsList: {
    backgroundColor: 'rgba(26, 26, 46, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(101, 67, 204, 0.1)',
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  benefitIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  benefitDescription: {
    color: '#AAAAAA',
    fontSize: 14,
    lineHeight: 20,
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    color: '#808080',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  activeSubscriptionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  activeIconContainer: {
    marginBottom: 24,
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  activeDescription: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: '#2EBB77',
    flexDirection: 'row',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 10,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  managementInfo: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  managementText: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SubscriptionScreenIOS;
