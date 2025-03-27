// src/services/AppleSubscriptionService.js
import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  finishTransaction,
  clearTransactionIOS,
  validateReceiptIos,
  getPurchaseHistory
} from 'react-native-iap';
import { Platform } from 'react-native';
import axios from 'axios';
import { API } from './apiConfig';
import * as SecureStore from 'expo-secure-store';

// Apple subscription product ID
export const SUBSCRIPTION_PRODUCT_ID = 'com.certgames.app.monthly_premium';

class AppleSubscriptionService {
  // Initialize the connection to the store
  async initializeConnection() {
    try {
      if (Platform.OS !== 'ios') return false;
      
      await initConnection();
      return true;
    } catch (error) {
      console.error('Failed to initialize IAP connection:', error);
      return false;
    }
  }

  // Get available subscriptions
  async getAvailableSubscriptions() {
    try {
      if (Platform.OS !== 'ios') return [];
      
      // Ensure connection is initialized
      await this.initializeConnection();
      
      // Fetch available subscriptions
      const subscriptions = await getSubscriptions([SUBSCRIPTION_PRODUCT_ID]);
      return subscriptions;
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      return [];
    }
  }

  // Purchase a subscription
  async purchaseSubscription(userId) {
    try {
      if (Platform.OS !== 'ios') throw new Error('Only available on iOS');
      
      // Ensure connection is initialized
      await this.initializeConnection();
      
      // Request the subscription purchase
      const result = await requestSubscription(SUBSCRIPTION_PRODUCT_ID);
      
      // Validate receipt with Apple and our backend
      if (result && result.transactionReceipt) {
        await this.verifyReceiptWithBackend(userId, result.transactionReceipt);
        
        // Finish the transaction
        if (result.transactionId) {
          await finishTransaction({ 
            transactionId: result.transactionId,
            isConsumable: false
          });
        }
        
        return {
          success: true,
          transactionId: result.transactionId,
          productId: result.productId
        };
      }
      
      return { success: false, error: 'No transaction receipt found' };
    } catch (error) {
      console.error('Failed to purchase subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify purchase receipt with our backend
  async verifyReceiptWithBackend(userId, receiptData) {
    try {
      const response = await axios.post(API.SUBSCRIPTION.VERIFY_RECEIPT, {
        userId: userId,
        receiptData: receiptData,
        platform: 'apple',
        productId: SUBSCRIPTION_PRODUCT_ID
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to verify receipt with backend:', error);
      throw error;
    }
  }

  // Check subscription status
  async checkSubscriptionStatus(userId) {
    try {
      // First try to get the status from the backend
      const backendStatus = await this.getSubscriptionStatusFromBackend(userId);
      
      // If backend confirms active subscription, return that
      if (backendStatus.subscriptionActive) {
        return backendStatus;
      }
      
      // If backend says no subscription, check local receipts as fallback
      if (Platform.OS === 'ios') {
        const purchases = await getAvailablePurchases();
        
        // Filter for our subscription product
        const activeSubscriptions = purchases.filter(
          purchase => purchase.productId === SUBSCRIPTION_PRODUCT_ID
        );
        
        if (activeSubscriptions.length > 0) {
          // We found an active subscription receipt on the device
          // Verify with backend to reconcile any discrepancy
          const latestPurchase = activeSubscriptions[0];
          await this.verifyReceiptWithBackend(userId, latestPurchase.transactionReceipt);
          
          // Check status again after verification
          return await this.getSubscriptionStatusFromBackend(userId);
        }
      }
      
      // If we get here, no active subscription was found
      return backendStatus;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return { subscriptionActive: false, error: error.message };
    }
  }

  // Get subscription status from backend
  async getSubscriptionStatusFromBackend(userId) {
    try {
      const response = await axios.get(
        `${API.SUBSCRIPTION.CHECK_STATUS}?userId=${userId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get subscription status from backend:', error);
      return { subscriptionActive: false, error: error.message };
    }
  }

  // Restore purchases
  async restorePurchases(userId) {
    try {
      if (Platform.OS !== 'ios') throw new Error('Only available on iOS');
      
      // Ensure connection is initialized
      await this.initializeConnection();
      
      // Get available purchases (past and current)
      const purchases = await getAvailablePurchases();
      
      // Filter for our subscription product
      const subscriptionPurchases = purchases.filter(
        purchase => purchase.productId === SUBSCRIPTION_PRODUCT_ID
      );
      
      if (subscriptionPurchases.length > 0) {
        // Found previous purchases, verify with backend
        const latestPurchase = subscriptionPurchases[0];
        await this.verifyReceiptWithBackend(userId, latestPurchase.transactionReceipt);
        
        return {
          success: true,
          message: 'Subscription restored successfully',
          purchase: latestPurchase
        };
      }
      
      return {
        success: false,
        message: 'No previous subscriptions found to restore'
      };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return { success: false, error: error.message };
    }
  }

  // Clean up transaction history
  async clearTransactions() {
    try {
      if (Platform.OS === 'ios') {
        await clearTransactionIOS();
      }
    } catch (error) {
      console.error('Failed to clear transactions:', error);
    }
  }
}

export default new AppleSubscriptionService();
