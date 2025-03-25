// src/screens/subscription/SubscriptionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchUserData } from '../../store/slices/userSlice';
import { initializeIAP, getSubscriptionProducts, purchaseSubscription } from '../../api/subscriptionService';
import { useTheme } from '../../context/ThemeContext';

const SubscriptionScreen = ({ navigation, route }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { userId, subscriptionActive } = useSelector((state) => state.user);
  
  // Check if we're in renewal mode from route params
  const renewalMode = route?.params?.renewSubscription;
  const renewUserId = route?.params?.userId || userId;
  
  useEffect(() => {
    const loadProducts = async () => {
      if (Platform.OS === 'ios') {
        const initialized = await initializeIAP();
        if (initialized) {
          const productList = await getSubscriptionProducts();
          setProducts(productList);
        }
      }
      setLoading(false);
    };
    
    loadProducts();
    
    // Handle renewal mode
    if (renewalMode) {
      // Show renewal message
      Alert.alert(
        'Subscription Required',
        'Your subscription has expired or was canceled. Please renew to continue using premium features.',
        [{ text: 'OK' }]
      );
    }
  }, [renewalMode]);
  
  const handleSubscribe = async () => {
    if (!renewUserId) {
      Alert.alert('Authentication Required', 'Please sign in to subscribe.');
      return;
    }
    
    if (Platform.OS !== 'ios') {
      // For non-iOS platforms, redirect to the web app
      Linking.openURL('https://certgames.com/subscription');
      return;
    }
    
    if (products.length === 0) {
      setError('No subscription products available');
      return;
    }
    
    setPurchasing(true);
    setError('');
    
    try {
      const result = await purchaseSubscription(products[0].productId);
      
      if (result.success) {
        // Refresh user data to get updated subscription status
        await dispatch(fetchUserData(renewUserId));
        
        Alert.alert(
          'Subscription Activated',
          'Your premium subscription has been activated!',
          [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
        );
      } else {
        setError('Failed to complete the purchase. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during purchase. Please try again.');
      console.error('Subscription purchase error:', err);
    } finally {
      setPurchasing(false);
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading subscription options...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[theme.colors.primary + '40', 'transparent']}
          style={styles.headerGradient}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Premium Membership</Text>
        </LinearGradient>
        
        <View style={[styles.subscriptionCard, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border
        }]}>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: theme.colors.text }]}>$9.99</Text>
            <Text style={[styles.period, { color: theme.colors.textSecondary }]}>/month</Text>
          </View>
          
          <View style={styles.featuresContainer}>
            <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>Premium Features</Text>
            
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>Unlimited access to all practice tests</Text>
            </View>
            
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>Advanced analytics and progress tracking</Text>
            </View>
            
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>Personalized study recommendations</Text>
            </View>
            
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>Additional practice materials</Text>
            </View>
            
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>Access across web and mobile</Text>
            </View>
          </View>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#FF4C8B" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              { backgroundColor: theme.colors.primary },
              purchasing && styles.disabledButton
            ]}
            onPress={handleSubscribe}
            disabled={purchasing || subscriptionActive}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : subscriptionActive ? (
              <Text style={styles.buttonText}>Already Subscribed</Text>
            ) : (
              <Text style={styles.buttonText}>
                {renewalMode ? 'Renew Subscription' : 'Subscribe Now'}
              </Text>
            )}
          </TouchableOpacity>
          
          <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>
            Cancel anytime. No hidden fees.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  headerGradient: {
    paddingVertical: 30,
    marginBottom: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  subscriptionCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  period: {
    fontSize: 16,
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 76, 139, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#FF4C8B',
    marginLeft: 10,
    flex: 1,
  },
  subscribeButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SubscriptionScreen;
