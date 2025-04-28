// src/api/apiClient.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { setOfflineStatus, setServerError } from '../store/slices/networkSlice';

// Request deduplication tracking
const pendingRequests = {};

// Circuit breaker state
const circuitBreaker = {
  failureCount: 0,
  lastFailureTime: 0,
  isOpen: false,
  resetTimeout: null,
  threshold: 10, // Number of failures to trip the breaker
  resetDelay: 1, // 2 seconds before trying requests again
};

// Request throttling
const requestThrottle = {
  lastRequestTime: 0,
  minInterval: 1, 
  requestQueue: [],
  isProcessingQueue: false,
};

const apiClient = axios.create({
  baseURL: 'https://certgames.com/api', 
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Override axios request method to implement deduplication and throttling
const originalRequest = apiClient.request;
apiClient.request = function(config) {
  // Generate a unique key for this request
  const requestKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}:${JSON.stringify(config.data || {})}`;
  
  // Check if a duplicate request is already in progress
  if (pendingRequests[requestKey]) {
    console.log(`[API] Duplicate request detected: ${requestKey}`);
    return pendingRequests[requestKey];
  }
  
  // Add mandatory throttling for all requests
  return new Promise((resolve, reject) => {
    // Add the request to a processing queue
    requestThrottle.requestQueue.push({
      config,
      resolve,
      reject,
      requestKey
    });
    
    // Start the queue processor if not already running
    if (!requestThrottle.isProcessingQueue) {
      processRequestQueue();
    }
  });
};
  
// Function to process the request queue with proper timing
async function processRequestQueue() {
  if (requestThrottle.requestQueue.length === 0) {
    requestThrottle.isProcessingQueue = false;
    return;
  }
  
  requestThrottle.isProcessingQueue = true;
  
  // Take the next request from the queue
  const { config, resolve, reject, requestKey } = requestThrottle.requestQueue.shift();
  
  try {
    // Process this request
    requestThrottle.lastRequestTime = Date.now();
    
    // Check again for duplicate request
    if (pendingRequests[requestKey]) {
      pendingRequests[requestKey].then(resolve).catch(reject);
    } else {
      const promise = originalRequest.call(apiClient, config);
      pendingRequests[requestKey] = promise;
      
      promise.then(resolve).catch(reject).finally(() => {
        delete pendingRequests[requestKey];
      });
    }
    
    // Wait before processing the next request
    await new Promise(r => setTimeout(r, requestThrottle.minInterval));
    
    // Process the next request
    processRequestQueue();
  } catch (err) {
    reject(err);
    processRequestQueue();
  }
}

// Function to reset the circuit breaker
function resetCircuitBreaker() {
  circuitBreaker.isOpen = false;
  circuitBreaker.failureCount = 0;
  circuitBreaker.resetTimeout = null;
  console.log('[API] Circuit breaker reset. Allowing requests again.');
}

// Trip the circuit breaker
function tripCircuitBreaker() {
  circuitBreaker.isOpen = true;
  console.log('[API] Circuit breaker tripped. Blocking requests for', circuitBreaker.resetDelay, 'ms');
  
  // Reset the circuit breaker after the reset delay
  if (circuitBreaker.resetTimeout) {
    clearTimeout(circuitBreaker.resetTimeout);
  }
  
  circuitBreaker.resetTimeout = setTimeout(resetCircuitBreaker, circuitBreaker.resetDelay);
}

// Request interceptor with improved error handling
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Check if circuit breaker is open
      if (circuitBreaker.isOpen) {
        console.log('[API] Circuit breaker is open, rejecting request to:', config.url);
        throw {
          circuitBreakerActive: true,
          message: 'Service temporarily unavailable, please try again later.',
          response: {
            status: 503,
            data: { error: 'Service temporarily unavailable. Please try again later.' }
          }
        };
      }
      
      // Check network state first - IMPROVED with more reliable check
      try {
        const netInfoState = await NetInfo.fetch();
        
        // Only reject if clearly offline - being careful not to cause false negatives
        if (netInfoState.type === 'none' || (
            netInfoState.isConnected === false && 
            netInfoState.isInternetReachable === false
        )) {
          // Dispatch offline status to Redux if available
          if (global.store) {
            global.store.dispatch(setOfflineStatus(true));
          }
          
          // Return a rejected promise with meaningful offline error
          throw {
            isOffline: true,
            message: 'Network unavailable. Please check your connection.',
            response: {
              status: 0,
              data: { error: 'Network unavailable. Please check your connection.' }
            }
          };
        } else if (global.store) {
          // Set online status in Redux
          global.store.dispatch(setOfflineStatus(false));
        }
      } catch (netError) {
        // If the error is already our custom offline error, re-throw it
        if (netError.isOffline) throw netError;
        
        // Otherwise, log but continue - don't block requests due to NetInfo errors
        console.warn('[API] NetInfo error:', netError);
      }
      
      // Get userId from SecureStore
      try {
        const userId = await SecureStore.getItemAsync('userId');
        if (userId) {
          // This is the fallback header the Flask code checks
          config.headers['X-User-Id'] = userId;
        }
      } catch (secureStoreError) {
        console.error('[API] SecureStore error:', secureStoreError);
        // Continue despite SecureStore errors
      }

      // Add a timestamp to help with cache busting
      config.params = {
        ...config.params,
        _t: Date.now()  // Add timestamp to prevent caching issues
      };

      return config;
    } catch (error) {
      console.error('[API] Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Success response - reset failure count
    if (circuitBreaker.failureCount > 0) {
      circuitBreaker.failureCount = 0;
    }
    
    // Reset server error state in Redux if we've recovered
    if (global.store && response.status >= 200 && response.status < 300) {
      global.store.dispatch(setServerError(false));
    }
    
    return response;
  },
  async (error) => {
    // Already rejected by request interceptor
    if (error.circuitBreakerActive || error.isOffline) {
      return Promise.reject(error);
    }
    
    // Network error (no response received)
    if (!error.response) {
      console.error('[API] Network error - no response:', error);
      
      // Increment failure count for circuit breaker
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = Date.now();
      
      // Check if we should trip the circuit breaker
      if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
        tripCircuitBreaker();
      }
      
      if (global.store) {
        global.store.dispatch(setServerError(true));
      }
      
      return Promise.reject({
        response: {
          status: 0,
          data: { error: 'Network error. Please check your connection or try again later.' }
        }
      });
    }
    
    // Server errors
    if (error.response.status >= 500) {
      console.error('[API] Server error:', error.response.status);
      
      // Increment failure count for circuit breaker
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = Date.now();
      
      // Check if we should trip the circuit breaker
      if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
        tripCircuitBreaker();
      }
      
      if (global.store) {
        global.store.dispatch(setServerError(true));
      }
      
      return Promise.reject({
        response: {
          status: error.response.status,
          data: { error: 'Server error. Please try again later.' }
        }
      });
    }
    
    // If the request times out
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout:', error);
      
      // Increment failure count for circuit breaker
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = Date.now();
      
      // Check if we should trip the circuit breaker
      if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
        tripCircuitBreaker();
      }
      
      return Promise.reject({
        response: {
          status: 408,
          data: { error: 'Request timed out. Please try again.' }
        }
      });
    }
    
    // Handle auth errors for specific routes that shouldn't increment circuit breaker
    if (error.response.status === 401 || error.response.status === 403) {
      // Auth errors are specific to the user, not a system failure
      if (error.config.url.includes('/login') || 
          error.config.url.includes('/register') ||
          error.config.url.includes('/oauth') ||
          error.config.url.includes('/user') ||
          error.config.url.includes('/auth')) {
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Make Redux store available to the interceptors
export const injectStore = (store) => {
  global.store = store;
};

export default apiClient;
