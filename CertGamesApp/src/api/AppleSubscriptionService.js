// src/api/AppleSubscriptionService.js
import {
  initConnection,
  getProducts,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  finishTransaction,
  clearTransactionIOS,
  validateReceiptIos,
  getPurchaseHistory,
  getPendingPurchases
} from 'react-native-iap';
import { Platform } from 'react-native';
import axios from 'axios';
import { API } from './apiConfig';
import * as SecureStore from 'expo-secure-store';

// Update this to match your Apple Connect configuration
export const SUBSCRIPTION_PRODUCT_ID = 'com.certgames.app.monthly_premium';

class AppleSubscriptionService {
  // Initialize the connection to the store
  async initializeConnection() {
    try {
      if (Platform.OS !== 'ios') return false;
      
      console.log('Initializing IAP connection...');
      const result = await initConnection();
      console.log("IAP connection initialized:", result);
      return true;
    } catch (error) {
      console.error('Failed to initialize IAP connection:', error);
      // Add more detailed error information
      if (error.code) {
        console.error('Error code:', error.code);
      }
      if (error.message) {
        console.error('Error message:', error.message);
      }
      return false;
    }
  }

  // Get available subscriptions
  async getAvailableSubscriptions() {
    try {
      if (Platform.OS !== 'ios') return [];
      
      // Ensure connection is initialized
      await this.initializeConnection();
      
      // FIXED: Add delay before requesting products
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("Requesting subscriptions for product ID:", SUBSCRIPTION_PRODUCT_ID);
      
      // FIXED: Use getProducts instead of getSubscriptions for more reliable results
      const products = await getProducts({
        skus: [SUBSCRIPTION_PRODUCT_ID]
      });
      
      console.log("Available products:", products);
      return products;
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      // Instead of returning empty error object, return empty array with better logging
      console.error('Error details:', error.stack || JSON.stringify(error));
      return [];
    }
  }

  // Purchase a subscription - SIMPLIFIED for all users (new and expired)
  async purchaseSubscription(userId) {
    try {
      if (Platform.OS !== 'ios') throw new Error('Only available on iOS');
      
      // ENHANCED DEBUGGING
      console.log("===== SUBSCRIPTION PURCHASE ATTEMPT =====");
      console.log("User ID:", userId);     
      
      // Check current status but don't block purchase regardless of status
      const subscriptionStatus = await this.checkSubscriptionStatus(userId);
         
      // REMOVED: Block for already subscribed users
      // Always allow purchase attempts regardless of current subscription status
      
      // Ensure connection is initialized
      const connectionResult = await this.initializeConnection();
      console.log("Connection initialized:", connectionResult);
      
      // Check for pending transactions first
      const pendingResult = await this.checkPendingTransactions();
      console.log("Pending transactions checked:", pendingResult);
      
      // Check subscription availability but don't block purchase on empty results
      const subscriptions = await this.getAvailableSubscriptions();
      console.log("Subscription check result:", 
        Array.isArray(subscriptions) ? `Found ${subscriptions.length} subscriptions` : "No array returned");
      
      // IMPORTANT FIX: Proceed with purchase even if no subscriptions found
      console.log("Attempting purchase for:", SUBSCRIPTION_PRODUCT_ID);
      
      // Request the subscription purchase - CHANGED TO TRUE
      const result = await requestSubscription({
        sku: SUBSCRIPTION_PRODUCT_ID,
        andDangerouslyFinishTransactionAutomaticallyIOS: true
      });
      
      console.log("Purchase result:", result);
      
      // IMPROVED ERROR HANDLING
      if (!result) {
        return { success: false, error: 'No purchase result returned' };
      }
      
      // Validate receipt with Apple and our backend
      if (result.transactionReceipt) {
        await this.verifyReceiptWithBackend(userId, result.transactionReceipt);
        
        // Since we're now using automatic transaction finishing, this is not needed
        // But keep as a fallback just in case
        if (result.transactionId) {
          try {
            await finishTransaction({ 
              transactionId: result.transactionId,
              isConsumable: false
            });
            console.log("Finished transaction (fallback):", result.transactionId);
          } catch (finishError) {
            console.log("Note: Transaction may already be finished:", finishError.message);
            // Don't throw here as transaction might already be finished automatically
          }
        }
        
        return {
          success: true,
          transactionId: result.transactionId || 'unknown',
          productId: result.productId || SUBSCRIPTION_PRODUCT_ID
        };
      }
      
      return { success: false, error: 'No transaction receipt found' };
    } catch (error) {
      // Check for cancellation FIRST - before any logging happens
      if (error.message && (
          error.message.includes('cancel') || 
          error.message.includes('SKErrorDomain Error 2') ||
          (error.code && error.code === 2)
      )) {
        // Completely silent - no logs, no console.error, nothing at all
        return { success: false, error: 'Purchase was cancelled.' };
      }
    
      // Only get here for non-cancellation errors
      console.error('Failed to purchase subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // ADDED: Check for pending transactions and finish them
  async checkPendingTransactions() {
    try {
      if (Platform.OS !== 'ios') return false;
      
      const pending = await getPendingPurchases();
      if (pending && pending.length > 0) {
        console.log("Found pending transactions:", pending.length);
        
        // Finish each pending transaction
        for (const purchase of pending) {
          if (purchase.transactionId) {
            await finishTransaction({
              transactionId: purchase.transactionId,
              isConsumable: false
            });
            console.log("Finished pending transaction:", purchase.transactionId);
          }
        }
      }
      return true;
    } catch (error) {
      console.error("Error checking pending transactions:", error);
      return false;
    }
  }

  // Verify purchase receipt with our backend
  async verifyReceiptWithBackend(userId, receiptData) {
    try {
      console.log("Verifying receipt with backend for user:", userId);
      
      const response = await axios.post(API.SUBSCRIPTION.VERIFY_RECEIPT, {
        userId: userId,
        receiptData: receiptData,
        platform: 'apple',
        productId: SUBSCRIPTION_PRODUCT_ID
      });
      
      console.log("Receipt verification response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to verify receipt with backend:', error);
      return { success: false, error: error.message };
    }
  }

  // Check subscription status - simplified without cached/local validation
  async checkSubscriptionStatus(userId) {
    try {
      console.log("Checking subscription status for userId:", userId);
      
      // Get the status directly from the backend
      const response = await axios.get(
        `${API.SUBSCRIPTION.CHECK_STATUS}?userId=${userId}`
      );
      
      console.log("Backend subscription status:", response.data);
      
      // Cache the backend status for future use
      try {
        await SecureStore.setItemAsync(
          `subscription_status_${userId}`,
          JSON.stringify({
            ...response.data,
            timestamp: Date.now()
          })
        );
      } catch (cacheSetError) {
        console.error("Error saving subscription status to cache:", cacheSetError);
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      // SIMPLIFIED: Return simple inactive status on error
      return { 
        subscriptionActive: false, 
        subscriptionStatus: 'unknown',
        error: error.message
      };
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

  // REMOVED: restorePurchases method

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
