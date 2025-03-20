// src/api/newsletterService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

/**
 * Subscribe to the newsletter
 * @param {string} email - Email address to subscribe
 * @returns {Promise} - Resolution of the API call
 */
export const subscribeToNewsletter = async (email) => {
  try {
    const response = await apiClient.post(API.NEWSLETTER.SUBSCRIBE, { email });
    return response.data;
  } catch (error) {
    // Handle specific cases with informative messages
    if (error.response?.status === 400) {
      // Return a structured response instead of throwing for already subscribed case
      console.log('User already subscribed:', email);
      return { 
        success: false, 
        message: error.response?.data?.message || "Already subscribed."
      };
    }
    // Only log actual errors
    console.error('Newsletter subscription error:', error);
    throw new Error(error.response?.data?.error || 'Failed to subscribe to newsletter');
  }
};

/**
 * Unsubscribe from the newsletter
 * @param {string} email - Email address to unsubscribe
 * @returns {Promise} - Resolution of the API call
 */
export const unsubscribeFromNewsletter = async (email) => {
  try {
    const response = await apiClient.post(API.NEWSLETTER.UNSUBSCRIBE, { email });
    return response.data;
  } catch (error) {
    // Handle specific cases with informative messages
    if (error.response?.status === 400) {
      // Return a structured response instead of throwing for not subscribed case
      console.log('User not subscribed:', email);
      return { 
        success: false, 
        message: error.response?.data?.message || "Email not found in subscriber list."
      };
    }
    // Only log actual errors
    console.error('Newsletter unsubscription error:', error);
    throw new Error(error.response?.data?.error || 'Failed to unsubscribe from newsletter');
  }
};

/**
 * Unsubscribe using a token (one-click unsubscribe)
 * @param {string} token - Unsubscribe token from email
 * @returns {Promise} - Resolution of the API call
 */
export const unsubscribeByToken = async (token) => {
  try {
    const response = await apiClient.get(API.NEWSLETTER.UNSUBSCRIBE_BY_TOKEN(token));
    return response.data;
  } catch (error) {
    // Handle specific cases with informative messages
    if (error.response?.status === 400) {
      console.log('Invalid or already used token:', token);
      return {
        success: false,
        message: error.response?.data?.error || "Invalid unsubscribe token or already unsubscribed."
      };
    }
    // Only log actual errors
    console.error('Token unsubscription error:', error);
    throw new Error(error.response?.data?.error || 'Failed to unsubscribe with token');
  }
};
