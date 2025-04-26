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
  threshold: 5, // Number of failures to trip the breaker
  resetDelay: 10000, // 10 seconds before trying requests again
};

// Request throttling
const requestThrottle = {
  lastRequestTime: 0,
  minInterval: 100, // Minimum 100ms between requests
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
  
  // Check circuit breaker
  if (circuitBreaker.isOpen) {
    console.log('Circuit breaker is open, rejecting request:', requestKey);
    return Promise.reject({
      response: {
        status: 503,
        data: { error: 'Too many failed requests. Please try again later.' }
      },
      circuitBreakerActive: true
    });
  }
  
  // Check if an identical request is already in progress
  if (pendingRequests[requestKey]) {
    console.log('Duplicate request detected, using existing promise:', requestKey);
    return pendingRequests[requestKey];
  }
  
  // Implement request throttling
  const now = Date.now();
  const timeSinceLastRequest = now - requestThrottle.lastRequestTime;
  
  if (timeSinceLastRequest < requestThrottle.minInterval) {
    // Queue this request instead of sending immediately
    return new Promise((resolve, reject) => {
      requestThrottle.requestQueue.push({
        config,
        resolve,
        reject,
        requestKey
      });
      
      // Start processing the queue if not already processing
      if (!requestThrottle.isProcessingQueue) {
        processRequestQueue();
      }
    });
  }
  
  // Proceed with the request
  requestThrottle.lastRequestTime = now;
  const promise = originalRequest.call(apiClient, config);
  
  // Store this request in pendingRequests and remove when done
  pendingRequests[requestKey] = promise;
  promise.finally(() => {
    delete pendingRequests[requestKey];
  });
  
  return promise;
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
  console.log('Circuit breaker reset. Allowing requests again.');
}

// Trip the circuit breaker
function tripCircuitBreaker() {
  circuitBreaker.isOpen = true;
  console.log('Circuit breaker tripped. Blocking requests for', circuitBreaker.resetDelay, 'ms');
  
  // Reset the circuit breaker after the reset delay
  if (circuitBreaker.resetTimeout) {
    clearTimeout(circuitBreaker.resetTimeout);
  }
  
  circuitBreaker.resetTimeout = setTimeout(resetCircuitBreaker, circuitBreaker.resetDelay);
}

// Request interceptor to include userId in "X-User-Id"
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Check network state first
      const netInfoState = await NetInfo.fetch();
      
      // Only reject if BOTH conditions are false (completely offline)
      if (!netInfoState.isConnected && !netInfoState.isInternetReachable) {
        // Dispatch offline status to Redux if available
        if (global.store) {
          global.store.dispatch(setOfflineStatus(true));
        }
        
        // Return a rejected promise with meaningful offline error
        return Promise.reject({
          response: {
            status: 0,
            data: { error: 'Network unavailable. Please check your connection.' }
          },
          isOffline: true // Custom flag to identify offline errors
        });
      } else if (global.store) {
        // Set online status in Redux
        global.store.dispatch(setOfflineStatus(false));
      }
      
      // Get userId from SecureStore
      let userId;
      try {
        userId = await SecureStore.getItemAsync('userId');
      } catch (secureStoreError) {
        console.error('SecureStore error:', secureStoreError);
      }
      
      if (userId) {
        // This is the fallback header my Flask code checks
        config.headers['X-User-Id'] = userId;
      }

      // Set withCredentials to false
      config.withCredentials = false;

      return config;
    } catch (error) {
      console.error('API interceptor error:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Circuit breaker error - pass through
    if (error.circuitBreakerActive) {
      return Promise.reject(error);
    }
    
    // Already identified as offline in request interceptor
    if (error.isOffline) {
      return Promise.reject(error);
    }
    
    // Network error (no response received)
    if (!error.response) {
      console.error('Network error - no response:', error);
      
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
    
    // Handle specific status codes
    if (error.response.status === 401) {
      // Auth issue, but don't increment circuit breaker here
      // This is a valid error response, not a service issue
    }
    
    // Server errors
    if (error.response.status >= 500) {
      console.error('Server error:', error.response.status);
      
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
    
    // Clear the failure count if we have a success
    if (circuitBreaker.failureCount > 0 && Date.now() - circuitBreaker.lastFailureTime > 5000) {
      // Reset failure count after 5 seconds of successful requests
      circuitBreaker.failureCount = 0;
    }
    
    // If the request times out
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error);
      
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
    
    return Promise.reject(error);
  }
);

// Make Redux store available to the interceptors
export const injectStore = (store) => {
  global.store = store;
};

export default apiClient;
