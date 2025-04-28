// src/utils/networkUtils.js

// Global request tracking
const globalRequestState = {
  requestCount: 0,
  requestsInLastMinute: 0,
  lastMinuteTimestamp: Date.now(),
};

// Update global request count with a decay function
function updateGlobalRequestCount() {
  const now = Date.now();
  const timeElapsed = now - globalRequestState.lastMinuteTimestamp;
  
  // If more than a minute has passed, reset the counter
  if (timeElapsed > 60000) {
    globalRequestState.requestsInLastMinute = 0;
    globalRequestState.lastMinuteTimestamp = now;
  } else {
    // Apply a decay factor based on time elapsed
    const decayFactor = 1 - (timeElapsed / 60000);
    globalRequestState.requestsInLastMinute = Math.floor(
      globalRequestState.requestsInLastMinute * decayFactor
    );
  }
  
  // Increment request count
  globalRequestState.requestCount++;
  globalRequestState.requestsInLastMinute++;
  
  return globalRequestState.requestsInLastMinute;
}

/**
 * Enhanced fetchWithRetry with exponential backoff, jitter, and circuit breaking
 * 
 * @param {Function} fetchFunction - The function that performs the fetch operation
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} initialDelay - Initial delay in milliseconds
 * @param {Object} options - Additional options
 * @returns {Promise} - The result of the fetch operation
 */
export const fetchWithRetry = async (
  fetchFunction,
  maxRetries = 2,
  initialDelay = 800,
  options = {}
) => {
  // Default options
  const defaultOptions = {
    maxBackoffTime: 10000, // Maximum backoff time in ms
    addJitter: true, // Add randomness to backoff times
    retryableStatusCodes: [408, 429, 500, 502, 503, 504], // HTTP status codes to retry
    logRetries: true, // Log retry attempts
  };
  
  // Merge default options with provided options
  const config = { ...defaultOptions, ...options };
  
  // Check if we should throttle based on global request rate
  const requestRate = updateGlobalRequestCount();
  if (requestRate > 50) {
    console.warn(`High request rate detected (${requestRate} requests in the last minute). Adding delay.`);
    await new Promise(resolve => setTimeout(resolve, requestRate * 10)); // Dynamic delay
  }
  
  let retries = 0;
  let delay = initialDelay;
  
  // Define a helper function to determine if an error is retryable
  const isRetryableError = (error) => {
    // Offline or network errors are always retryable
    if (error.isOffline || !error.response) {
      return true;
    }
    
    // Circuit breaker active - not retryable
    if (error.circuitBreakerActive) {
      return false;
    }
    
    // Check status codes
    if (error.response && error.response.status) {
      return config.retryableStatusCodes.includes(error.response.status);
    }
    
    return false;
  };
  
  while (retries <= maxRetries) {
    try {
      return await fetchFunction();
    } catch (error) {
      // Only retry for retryable errors
      if (isRetryableError(error)) {
        retries++;
        
        if (config.logRetries) {
          console.log(`Retry attempt ${retries}/${maxRetries} after ${delay}ms`);
        }
        
        if (retries <= maxRetries) {
          // Calculate exponential backoff
          const exponentialBackoff = initialDelay * Math.pow(2, retries - 1);
          delay = Math.min(exponentialBackoff, config.maxBackoffTime);
          
          // Add jitter if enabled (±25% randomness)
          if (config.addJitter) {
            const jitter = delay * 0.5 * (Math.random() - 0.5);
            delay = Math.max(initialDelay, delay + jitter);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      } else {
        // For non-retryable errors, don't retry
        throw error;
      }
    }
  }
};

/**
 * Makes multiple fetches in a controlled sequential manner to avoid overwhelming the API
 * 
 * @param {Array<Function>} fetchFunctions - Array of fetch functions to execute
 * @param {number} delayBetween - Delay between requests in milliseconds
 * @returns {Promise<Array>} - Array of results in the same order as input functions
 */
export const sequentialFetch = async (fetchFunctions, delayBetween = 100) => {
  const results = [];
  
  for (let i = 0; i < fetchFunctions.length; i++) {
    try {
      // Add delay before each request except the first one
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetween));
      }
      
      // Execute the fetch function with retry capability
      const result = await fetchWithRetry(fetchFunctions[i]);
      results.push(result);
    } catch (error) {
      // Store the error in results so we maintain the order
      results.push({ error });
      console.error(`Error in sequentialFetch at index ${i}:`, error);
    }
  }
  
  return results;
};

/**
 * Limits the rate of function execution
 * 
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Maximum executions per interval
 * @param {number} interval - Time interval in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (fn, limit, interval = 1000) => {
  let calls = 0;
  let lastReset = Date.now();
  let queued = [];
  let timeout = null;
  
  const processQueue = () => {
    if (queued.length === 0) {
      timeout = null;
      return;
    }
    
    const now = Date.now();
    if (now - lastReset > interval) {
      calls = 0;
      lastReset = now;
    }
    
    if (calls < limit) {
      const next = queued.shift();
      calls++;
      next.resolve(fn(...next.args));
      
      // Process next item in queue after a small delay
      timeout = setTimeout(processQueue, interval / limit);
    } else {
      // Wait until the interval resets
      const waitTime = interval - (now - lastReset);
      timeout = setTimeout(processQueue, waitTime);
    }
  };
  
  return (...args) => {
    return new Promise((resolve, reject) => {
      // Add to queue
      queued.push({ resolve, reject, args });
      
      // Start processing if not already started
      if (!timeout) {
        timeout = setTimeout(processQueue, 0);
      }
    });
  };
};
