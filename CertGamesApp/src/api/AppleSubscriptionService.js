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
      
      console.log('[AppleSubscriptionService] Initializing IAP connection...');
      // FIX: Wrap the connection attempt in a try/catch and retry if it fails
      try {
        const result = await initConnection();
        console.log("[AppleSubscriptionService] IAP connection initialized successfully:", result);
        return true;
      } catch (initError) {
        console.error('[AppleSubscriptionService] First attempt failed, retrying after delay:', initError);
        // Wait a moment and try again
        await new Promise(resolve => setTimeout(resolve, 500));
        const result = await initConnection();
        console.log("[AppleSubscriptionService] IAP connection retry succeeded:", result);
        return true;
      }
    } catch (error) {
      console.error('[AppleSubscriptionService] Failed to initialize IAP connection:', error);
      // Add more detailed error information
      if (error.code) {
        console.error('[AppleSubscriptionService] Error code:', error.code);
      }
      if (error.message) {
        console.error('[AppleSubscriptionService] Error message:', error.message);
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
      
      console.log("[AppleSubscriptionService] Requesting subscriptions for product ID:", SUBSCRIPTION_PRODUCT_ID);
      
      // FIXED: Use getProducts instead of getSubscriptions for more reliable results
      try {
        const products = await getProducts({
          skus: [SUBSCRIPTION_PRODUCT_ID]
        });
        
        console.log("[AppleSubscriptionService] Available products:", products);
        return products;
      } catch (productsError) {
        console.error("[AppleSubscriptionService] Error getting products:", productsError);
        
        // Fallback attempt using getSubscriptions
        console.log("[AppleSubscriptionService] Trying fallback with getSubscriptions");
        const subscriptions = await getSubscriptions({
          skus: [SUBSCRIPTION_PRODUCT_ID]
        });
        
        console.log("[AppleSubscriptionService] Fallback subscriptions:", subscriptions);
        return subscriptions;
      }
    } catch (error) {
      console.error('[AppleSubscriptionService] Failed to get subscriptions:', error);
      // Instead of returning empty error object, return empty array with better logging
      console.error('[AppleSubscriptionService] Error details:', error.stack || JSON.stringify(error));
      return [];
    }
  }

  // Purchase a subscription - FIXED for reliable purchasing in TestFlight
  async purchaseSubscription(userId) {
    try {
      if (Platform.OS !== 'ios') throw new Error('Only available on iOS');
      
      // ENHANCED DEBUGGING
      console.log("[AppleSubscriptionService] ===== SUBSCRIPTION PURCHASE ATTEMPT =====");
      console.log("[AppleSubscriptionService] User ID:", userId);     
      
      // Ensure connection is initialized
      const connectionResult = await this.initializeConnection();
      console.log("[AppleSubscriptionService] Connection initialized:", connectionResult);
      
      if (!connectionResult) {
        return { success: false, error: 'Failed to initialize payment service' };
      }
      
      // Check for pending transactions first
      try {
        const pendingResult = await this.checkPendingTransactions();
        console.log("[AppleSubscriptionService] Pending transactions checked:", pendingResult);
      } catch (pendingError) {
        console.log("[AppleSubscriptionService] Error checking pending transactions (non-fatal):", pendingError);
        // Continue despite errors here
      }
      
      // TESTFLIGHT FIX: Add a small delay to ensure UI is ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log("[AppleSubscriptionService] Attempting purchase for:", SUBSCRIPTION_PRODUCT_ID);
      
      // FIX: Make sure not to finish transaction automatically for TestFlight
      try {
        const result = await requestSubscription({
          sku: SUBSCRIPTION_PRODUCT_ID,
          // IMPORTANT: Set this to false for TestFlight to ensure purchase dialog appears
          andDangerouslyFinishTransactionAutomaticallyIOS: false 
        });
       
        console.log("[AppleSubscriptionService] Purchase result:", result);
        
        // FIX: Better null check
        if (!result) {
          return { success: false, error: 'No purchase result returned' };
        }
        
        // Validate receipt with Apple and our backend
        if (result.transactionReceipt) {
          try {
            await this.verifyReceiptWithBackend(userId, result.transactionReceipt);
          } catch (verifyError) {
            console.error("[AppleSubscriptionService] Receipt verification error (non-fatal):", verifyError);
            // Continue despite verification errors
          }
          
          // Get fallback transaction ID
          let transactionId = result.transactionId || 'unknown';
          
          // TESTFLIGHT FIX: Manually finish transaction with delay
          if (transactionId !== 'unknown') {
            try {
              // Add delay before finishing transaction
              await new Promise(resolve => setTimeout(resolve, 500));
              
              await finishTransaction({ 
                transactionId: transactionId,
                isConsumable: false
              });
              console.log("[AppleSubscriptionService] Finished transaction:", transactionId);
            } catch (finishError) {
              console.log("[AppleSubscriptionService] Error finishing transaction:", finishError.message);
              // Non-fatal error
            }
          }
          
          return {
            success: true,
            transactionId: transactionId,
            productId: result.productId || SUBSCRIPTION_PRODUCT_ID
          };
        }
        
        // If we get here, something weird happened - no receipt
        return { success: false, error: 'No transaction receipt found' };
      } catch (purchaseError) {
        // Special handling for user cancellation
        if (purchaseError.message && (
            purchaseError.message.includes('cancel') || 
            purchaseError.message.includes('SKErrorDomain Error 2') ||
            (purchaseError.code && purchaseError.code === 2)
        )) {
          console.log("[AppleSubscriptionService] Purchase was cancelled by user");
          return { success: false, error: 'Purchase was cancelled.' };
        }
        
        // Re-throw for other errors
        throw purchaseError;
      }
    } catch (error) {
      // Only get here for non-cancellation errors
      console.error('[AppleSubscriptionService] Failed to purchase subscription:', error);
      return { success: false, error: error.message || 'Unknown purchase error' };
    }
  }

  // IMPROVED: Better pending transactions check for TestFlight
  async checkPendingTransactions() {
    try {
      if (Platform.OS !== 'ios') return false;
      
      // FIX: Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Pending transactions check timed out')), 5000)
      );
      
      // Race condition to prevent hanging
      const pending = await Promise.race([
        getPendingPurchases(),
        timeoutPromise
      ]);
      
      if (pending && pending.length > 0) {
        console.log("[AppleSubscriptionService] Found pending transactions:", pending.length);
        
        // Finish each pending transaction
        for (const purchase of pending) {
          if (purchase.transactionId) {
            try {
              await finishTransaction({
                transactionId: purchase.transactionId,
                isConsumable: false
              });
              console.log("[AppleSubscriptionService] Finished pending transaction:", purchase.transactionId);
            } catch (finishError) {
              console.error("[AppleSubscriptionService] Error finishing transaction:", finishError);
              // Continue with other transactions
            }
          }
        }
      } else {
        console.log("[AppleSubscriptionService] No pending transactions found");
      }
      return true;
    } catch (error) {
      console.error("[AppleSubscriptionService] Error checking pending transactions:", error);
      return false;
    }
  }

  // Verify purchase receipt with our backend
  async verifyReceiptWithBackend(userId, receiptData) {
    try {
      console.log("[AppleSubscriptionService] Verifying receipt with backend for user:", userId);
      
      const response = await axios.post(API.SUBSCRIPTION.VERIFY_RECEIPT, {
        userId: userId,
        receiptData: receiptData,
        platform: 'apple',
        productId: SUBSCRIPTION_PRODUCT_ID
      });
      
      console.log("[AppleSubscriptionService] Receipt verification response:", response.data);
      return response.data;
    } catch (error) {
      console.error('[AppleSubscriptionService] Failed to verify receipt with backend:', error);
      return { success: false, error: error.message };
    }
  }

  // Check subscription status
  async checkSubscriptionStatus(userId) {
    try {
      console.log("[AppleSubscriptionService] Checking subscription status for userId:", userId);
      
      // Get the status directly from the backend
      try {
        const response = await axios.get(
          `${API.SUBSCRIPTION.CHECK_STATUS}?userId=${userId}`
        );
        
        console.log("[AppleSubscriptionService] Backend subscription status:", response.data);
        
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
          console.error("[AppleSubscriptionService] Error saving subscription status to cache:", cacheSetError);
        }
        
        return response.data;
      } catch (backendError) {
        console.error('[AppleSubscriptionService] Backend check error:', backendError);
        throw backendError;
      }
    } catch (error) {
      console.error('[AppleSubscriptionService] Failed to check subscription status:', error);
      return { 
        subscriptionActive: false, 
        subscriptionStatus: 'unknown',
        error: error.message
      };
    }
  }
  
  // Clean up transaction history
  async clearTransactions() {
    try {
      if (Platform.OS === 'ios') {
        await clearTransactionIOS();
        console.log("[AppleSubscriptionService] Transactions cleared");
      }
    } catch (error) {
      console.error('[AppleSubscriptionService] Failed to clear transactions:', error);
    }
  }
}

export default new AppleSubscriptionService();
