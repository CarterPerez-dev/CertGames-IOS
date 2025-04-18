// src/hooks/usePremiumCheck.js
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { fetchUsageLimits } from '../store/slices/userSlice';

const usePremiumCheck = (featureType = 'premium') => {
  const { 
    userId, 
    subscriptionActive, 
    practiceQuestionsRemaining 
  } = useSelector(state => state.user);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      
      // If already subscribed, always has access
      if (subscriptionActive) {
        setHasAccess(true);
        setLoading(false);
        return;
      }
      
      // For free users, check specific feature access
      try {
        // If it's a practice question feature and user still has questions
        if (featureType === 'questions' && practiceQuestionsRemaining > 0) {
          setHasAccess(true);
        } 
        // If it's Analogy Hub (which is free)
        else if (featureType === 'analogy') {
          setHasAccess(true);
        }
        // Resources viewing (without active links) is allowed
        else if (featureType === 'resources_view') {
          setHasAccess(true);
        }
        // Daily questions viewing (without answering) is allowed
        else if (featureType === 'daily_view') {
          setHasAccess(true);
        }
        // All other premium features: no access for free users
        else {
          setHasAccess(false);
        }
        
        // Refresh usage limits if user is free
        if (!subscriptionActive) {
          await dispatch(fetchUsageLimits(userId));
        }
      } catch (error) {
        console.error('Error checking premium access:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      checkAccess();
    } else {
      setLoading(false);
      setHasAccess(false);
    }
  }, [userId, subscriptionActive, practiceQuestionsRemaining, featureType, dispatch]);

  // Function to show subscription prompt
  const showSubscriptionPrompt = () => {
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
  };

  // Function to navigate to full premium feature prompt screen
  const navigateToPremiumFeaturePrompt = () => {
    navigation.navigate('PremiumFeaturePrompt', { feature: featureType });
  };

  return { loading, hasAccess, showSubscriptionPrompt, navigateToPremiumFeaturePrompt };
};

export default usePremiumCheck;
