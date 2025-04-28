// src/hooks/usePremiumCheck.js
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

/**
 * Hook to check if user has access to premium features
 * 
 * @param {string} featureType - Type of feature to check access for
 * @returns {Object} Access status and helper methods
 */
const usePremiumCheck = (featureType = 'premium') => {
  const { 
    userId, 
    subscriptionActive, 
    practiceQuestionsRemaining = 0 
  } = useSelector(state => state.user);
  
  const [hasAccess, setHasAccess] = useState(false);
  const navigation = useNavigation();

  // Determine access based on subscription status and feature type
  // This is a single useEffect with no nesting
  useEffect(() => {
    // Default to no access
    let access = false;
    
    // Premium users always have access to everything
    if (subscriptionActive) {
      access = true;
    } 
    // Free tier access control
    else {
      switch (featureType) {
        case 'questions':
          // Access if they have questions remaining
          access = practiceQuestionsRemaining > 0;
          break;
        case 'analogy':
        case 'resources_view':
        case 'daily_view':
          // These features are free
          access = true;
          break;
        default:
          // All other features require premium
          access = false;
      }
    }
    
    // Update state
    setHasAccess(access);
  }, [subscriptionActive, practiceQuestionsRemaining, featureType]);

  // Navigate to premium feature prompt
  const navigateToPremiumFeaturePrompt = useCallback(() => {
    navigation.navigate('PremiumFeaturePrompt', { feature: featureType });
  }, [navigation, featureType]);

  // Show subscription prompt
  const showSubscriptionPrompt = useCallback(() => {
    let title, message;
    
    switch (featureType) {
      case 'questions':
        title = 'Question Limit Reached';
        message = 'You have used all your free practice questions. Upgrade to premium for unlimited access.';
        break;
      case 'daily':
        title = 'Premium Feature';
        message = 'Answering daily questions is only available with a premium subscription.';
        break;
      case 'resources':
        title = 'Premium Feature';
        message = 'Accessing resource links is only available with a premium subscription.';
        break;
      default:
        title = 'Premium Feature';
        message = 'This feature is only available with a premium subscription.';
    }
    
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Upgrade to Premium', 
          onPress: () => navigation.navigate('SubscriptionIOS', { userId })
        }
      ]
    );
  }, [navigation, userId, featureType]);

  return { 
    // No loading state - checks are synchronous
    loading: false, 
    hasAccess, 
    showSubscriptionPrompt, 
    navigateToPremiumFeaturePrompt 
  };
};

export default usePremiumCheck;
