// src/hooks/usePremiumCheck.js
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { fetchUsageLimits } from '../store/slices/userSlice';

/**
 * Hook to check if user has access to premium features
 * 
 * @param {string} featureType - Type of feature to check access for
 * @returns {Object} Access status and helper methods
 */
const usePremiumCheck = (featureType = 'premium') => {
  const dispatch = useDispatch();
  
  const { 
    userId, 
    subscriptionActive, 
    practiceQuestionsRemaining = 0,
    usageLimitsStatus,
    subscriptionType
  } = useSelector(state => state.user);
  
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  // Load usage limits when needed
  useEffect(() => {
    // Only fetch usage limits if not already loading and we're on a metered feature
    if (
      userId && 
      !subscriptionActive && 
      usageLimitsStatus !== 'loading' && 
      (featureType === 'questions' || featureType === 'free_question_check')
    ) {
      setLoading(true);
      
      dispatch(fetchUsageLimits(userId))
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userId, subscriptionActive, usageLimitsStatus, dispatch, featureType]);

  // Determine access based on subscription status and feature type
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
        case 'free_question_check':
          // Access if they have questions remaining
          access = practiceQuestionsRemaining > 0;
          break;
        case 'analogy':
        case 'resources_view':
        case 'daily_view':
        case 'free_tool':
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
    navigation.navigate('PremiumFeaturePrompt', { 
      feature: featureType,
      remainingQuestions: practiceQuestionsRemaining,
      subscriptionType: subscriptionType || 'free'
    });
  }, [navigation, featureType, practiceQuestionsRemaining, subscriptionType]);

  // Show subscription prompt
  const showSubscriptionPrompt = useCallback(() => {
    let title, message;
    
    switch (featureType) {
      case 'questions':
      case 'free_question_check':
        title = 'Question Limit Reached';
        message = `You have used all your free practice questions (${practiceQuestionsRemaining}/100). Upgrade to premium for unlimited access.`;
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
  }, [navigation, userId, featureType, practiceQuestionsRemaining]);

  return { 
    loading, 
    hasAccess, 
    showSubscriptionPrompt, 
    navigateToPremiumFeaturePrompt,
    practiceQuestionsRemaining
  };
};

export default usePremiumCheck;
