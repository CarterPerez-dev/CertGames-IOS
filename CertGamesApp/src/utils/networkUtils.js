// src/utils/networkUtils.js
export const fetchWithRetry = async (fetchFunction, maxRetries = 2, delay = 800) => {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      return await fetchFunction();
    } catch (error) {
      // Only retry for network errors
      if (error.isOffline || !error.response) {
        retries++;
        console.log(`Retry attempt ${retries}/${maxRetries} after ${delay}ms`);
        
        if (retries <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5; // Increase delay for next retry
        } else {
          throw error;
        }
      } else {
        // For other errors, don't retry
        throw error;
      }
    }
  }
};
