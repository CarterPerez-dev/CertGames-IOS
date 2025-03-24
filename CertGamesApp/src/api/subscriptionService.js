// src/api/subscriptionService.js
import * as StoreKit from 'react-native-iap';
import { Platform } from 'react-native';
import apiClient from './apiClient';
import { API } from './apiConfig';

// The product ID for your subscription
const SUBSCRIPTION_SKUS = ['com.certgames.subscription.monthly'];

export const initializeIAP = async () => {
  try {
    if (Platform.OS === 'ios') {
      await StoreKit.initConnection();
      await StoreKit.clearProductsIOS();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error initializing IAP:', error);
    return false;
  }
};

export const getSubscriptionProducts = async () => {
  try {
    const products = await StoreKit.getProducts(SUBSCRIPTION_SKUS);
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const purchaseSubscription = async (productId) => {
  try {
    const result = await StoreKit.requestSubscription(productId);
    
    // Verify receipt with backend
    const receiptData = await StoreKit.getReceiptIOS();
    
    if (receiptData) {
      await verifyReceipt(receiptData);
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error purchasing subscription:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const verifyReceipt = async (receiptData) => {
  try {
    const userId = await SecureStore.getItemAsync('userId');
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    const response = await apiClient.post(API.SUBSCRIPTION.VERIFY_RECEIPT, {
      userId,
      receiptData
    });
    
    return response.data;
  } catch (error) {
    console.error('Error verifying receipt:', error);
    throw error;
  }
};

export const checkSubscriptionStatus = async (userId) => {
  try {
    const response = await apiClient.get(API.SUBSCRIPTION.CHECK_STATUS, {
      params: { userId }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw error;
  }
};
