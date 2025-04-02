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

  // Purchase a subscription - IMPROVED ERROR HANDLING
  async purchaseSubscription(userId) {
    try {
      if (Platform.OS !== 'ios') throw new Error('Only available on iOS');
      
      // ENHANCED DEBUGGING
      console.log("===== SUBSCRIPTION PURCHASE ATTEMPT =====");
      console.log("User ID:", userId);     
      
      const subscriptionStatus = await this.checkSubscriptionStatus(userId);
         
      if (subscriptionStatus.subscriptionActive) {
        return {
          success: true,
          alreadySubscribed: true,
          message: "You already have an active subscription."
        };
      }        
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

  // Check subscription status
  async checkSubscriptionStatus(userId) {
    try {
      console.log("Checking subscription status for userId:", userId);
      
      // First try to get cached subscription status
      let cachedSubscriptionStatus = null;
      try {
        const cachedStatusString = await SecureStore.getItemAsync(`subscription_status_${userId}`);
        if (cachedStatusString) {
          cachedSubscriptionStatus = JSON.parse(cachedStatusString);
          console.log("Found cached subscription status:", cachedSubscriptionStatus);
          
          // Check if cache is fresh (less than 1 hour old)
          const cacheTime = cachedSubscriptionStatus.timestamp || 0;
          const now = Date.now();
          const cacheAge = now - cacheTime;
          const CACHE_MAX_AGE = 60 * 60 * 1000; // 1 hour in milliseconds
          
          if (cacheAge > CACHE_MAX_AGE) {
            console.log("Cached subscription status is stale, will try to refresh");
            // Continue to backend check, but don't return immediately
          } else if (cachedSubscriptionStatus.subscriptionActive) {
            console.log("Using fresh cached subscription status (active subscription)");
            // Return immediately if cache is fresh and indicates active subscription
            return cachedSubscriptionStatus;
          }
        }
      } catch (cacheError) {
        console.error("Error reading cached subscription status:", cacheError);
        // Continue without cache
      }
      
      // Then try to get the status from the backend
      let backendStatus;
      let backendAvailable = true;
      try {
        const response = await axios.get(
          `${API.SUBSCRIPTION.CHECK_STATUS}?userId=${userId}`
        );
        backendStatus = response.data;
        console.log("Backend subscription status:", backendStatus);
        
        // Cache the backend status for future use
        try {
          await SecureStore.setItemAsync(
            `subscription_status_${userId}`,
            JSON.stringify({
              ...backendStatus,
              timestamp: Date.now()
            })
          );
        } catch (cacheSetError) {
          console.error("Error saving subscription status to cache:", cacheSetError);
        }
      } catch (error) {
        console.warn('Backend subscription check failed:', error.message);
        console.log('Falling back to local receipt check');
        backendStatus = cachedSubscriptionStatus || { subscriptionActive: false };
        backendAvailable = false;
        
        // If it's a 404, we should alert developers during testing
        if (error.response && error.response.status === 404) {
          console.error('❌ API ENDPOINT NOT FOUND: Please check that your backend routes match the API config');
        }
      }
      
      // If backend confirms active subscription or we're offline but have a cached active status, return that
      if (backendStatus.subscriptionActive) {
        return backendStatus;
      }
      
      // If backend is unavailable and we have cached status, rely on that more heavily
      if (!backendAvailable && cachedSubscriptionStatus && cachedSubscriptionStatus.subscriptionActive) {
        console.log("Backend unavailable but cached status indicates active subscription");
        return cachedSubscriptionStatus;
      }
      
      // If backend says no subscription or is unavailable, check local receipts as fallback
      if (Platform.OS === 'ios') {
        try {
          console.log("Checking local App Store receipts");
          const purchases = await getAvailablePurchases();
          console.log(`Found ${purchases.length} local purchases`);
          
          // Filter for our subscription product
          const activeSubscriptions = purchases.filter(
            purchase => purchase.productId === SUBSCRIPTION_PRODUCT_ID
          );
          
          if (activeSubscriptions.length > 0) {
            console.log("Found active subscription in local receipts");
            
            // We found an active subscription receipt on the device
            const localActiveStatus = { 
              subscriptionActive: true, 
              subscriptionStatus: 'active',
              subscriptionPlatform: 'apple',
              source: 'local_receipt'
            };
            
            // Cache this status
            try {
              await SecureStore.setItemAsync(
                `subscription_status_${userId}`,
                JSON.stringify({
                  ...localActiveStatus,
                  timestamp: Date.now()
                })
              );
            } catch (cacheError) {
              console.error("Error caching local receipt status:", cacheError);
            }
            
            // If backend is available, try to sync this receipt
            if (backendAvailable) {
              // We found an active subscription receipt on the device
              // Verify with backend to reconcile any discrepancy
              const latestPurchase = activeSubscriptions[0];
              
              try {
                await this.verifyReceiptWithBackend(userId, latestPurchase.transactionReceipt);
                
                // Check status again after verification
                const refreshedStatus = await this.getSubscriptionStatusFromBackend(userId);
                return refreshedStatus;
              } catch (verifyError) {
                console.error("Error verifying receipt with backend:", verifyError);
                // Still return active based on local receipt
                return localActiveStatus;
              }
            } else {
              // Backend unavailable, trust the local receipt
              return localActiveStatus;
            }
          } else {
            console.log("No active subscriptions found in local receipts");
          }
        } catch (purchasesError) {
          console.error("Error checking local purchases:", purchasesError);
        }
      }
      
      // If we get here, no active subscription was found
      return backendStatus;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return { 
        subscriptionActive: false, 
        error: error.message,
        errorCode: error.code
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
