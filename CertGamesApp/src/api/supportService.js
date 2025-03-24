// src/api/supportService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

/**
 * Fetch all support threads for the current user
 * @returns {Promise} - Resolution of the API call with threads
 */
export const fetchSupportThreads = async () => {
  try {
    const response = await apiClient.get(API.SUPPORT.THREADS);
    return response.data;
  } catch (error) {
    console.error('Support threads fetch error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch support threads');
  }
};

/**
 * Create a new support thread
 * @param {string} subject - The subject of the new thread
 * @returns {Promise} - Resolution of the API call with the new thread data
 */
export const createSupportThread = async (subject) => {
  try {
    const response = await apiClient.post(API.SUPPORT.THREADS, { subject });
    return response.data;
  } catch (error) {
    console.error('Create support thread error:', error);
    throw new Error(error.response?.data?.error || 'Failed to create support thread');
  }
};

/**
 * Fetch a single thread with its messages
 * @param {string} threadId - The ID of the thread to fetch
 * @returns {Promise} - Resolution of the API call with thread data and messages
 */
export const fetchSupportThread = async (threadId) => {
  try {
    const response = await apiClient.get(API.SUPPORT.THREAD(threadId));
    return response.data;
  } catch (error) {
    // For 404 errors, just log without throwing
    if (error.response?.status === 404) {
      console.log(`Thread ${threadId} not found - this is normal for new users`);
      return { messages: [] }; // Return empty messages array instead of throwing
    }
    console.error('Fetch support thread error:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch support thread');
  }
};

/**
 * Send a message to a support thread
 * @param {string} threadId - The ID of the thread
 * @param {string} content - The message content
 * @returns {Promise} - Resolution of the API call
 */
export const sendSupportMessage = async (threadId, content) => {
  try {
    const response = await apiClient.post(API.SUPPORT.THREAD(threadId), { content });
    return response.data;
  } catch (error) {
    console.error('Send support message error:', error);
    throw new Error(error.response?.data?.error || 'Failed to send message');
  }
};

/**
 * Close a support thread
 * @param {string} threadId - The ID of the thread to close
 * @returns {Promise} - Resolution of the API call
 */
export const closeSupportThread = async (threadId) => {
  try {
    const response = await apiClient.post(API.SUPPORT.CLOSE_THREAD(threadId), {
      content: 'Thread closed by user'
    });
    return response.data;
  } catch (error) {
    console.error('Close support thread error:', error);
    throw new Error(error.response?.data?.error || 'Failed to close thread');
  }
};
