// src/api/testService.js
import apiClient from './apiClient';
import { API, BASE_URL } from './apiConfig';

// Helper to format image URLs
const formatImageUrl = (url) => {
  if (!url) return null;
  
  // If it's already a complete URL, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Fix relative URLs
  if (!url.startsWith('/') && !url.startsWith('./')) {
    url = '/' + url;
  }
  
  // Extract the domain without the "/api" path
  const apiIndex = BASE_URL.indexOf('/api');
  const domain = apiIndex !== -1 ? 
    BASE_URL.substring(0, apiIndex) : 
    BASE_URL.replace(/\/+$/, ''); // Remove trailing slashes
    
  url = url.replace(/^\/+/, '/'); // Ensure only one leading slash
  return domain + url;
};

/**
 * Fetch tests by category
 * 
 * Note: This mimics the web app approach by generating test objects programmatically
 * rather than fetching from an API endpoint that doesn't exist
 * 
 * @param {string} category - The test category (e.g., 'aplus', 'secplus')
 * @returns {Promise<Array>} - Promise resolving to array of tests
 */
export const fetchTestsByCategory = async (category) => {
  try {
    // Define proper test name prefixes based on category
    const displayNames = {
      "aplus": "A+ (1101)",
      "aplus2": "A+ (1102)",
      "nplus": "Network+ (N10-009)",
      "secplus": "Security+ (SY0-701)",
      "cysa": "CySA+ (CS0-003)",
      "penplus": "PenTest+ (PT0-003)",
      "linuxplus": "Linux+ (XK0-005)",
      "caspplus": "CASP+ (CAS-005)",
      "cloudplus": "Cloud+ (CV0-004)",
      "dataplus": "Data+ (DA0-001)",
      "serverplus": "Server+ (SK0-005)",
      "cissp": "ISC² CISSP",
      "awscloud": "AWS Cloud (CLF-002)"
    };
    
    const namePrefix = displayNames[category] || 
                       category.charAt(0).toUpperCase() + category.slice(1);
    
    // Generate 10 test objects for the category with proper naming
    return Array.from({ length: 10 }, (_, i) => ({
      testId: i + 1,
      testName: `${namePrefix} Test #${i + 1}`,
      category: category,
      questionCount: 100
    }));
  } catch (error) {
    console.error(`Error creating test objects for ${category}:`, error);
    throw new Error(error.message || 'Error creating test objects');
  }
};

/**
 * Fetch a specific test by ID and category
 * @param {string} category - The test category
 * @param {string|number} testId - The test ID
 * @returns {Promise<Object>} - Promise resolving to the test object
 */
export const fetchTestById = async (category, testId) => {
  try {
    const response = await apiClient.get(API.TESTS.DETAILS(category, testId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching test ${testId}:`, error);
    const errorMsg = error?.response?.data?.error || error.message || 'Network error';
    throw new Error(errorMsg);
  }
};

/**
 * Fetch a test attempt
 * @param {string} userId - The user ID
 * @param {string|number} testId - The test ID
 * @param {string} [status] - Optional status filter ('finished' or 'unfinished')
 * @returns {Promise<Object>} - Promise resolving to attempt data
 */
export const fetchTestAttempt = async (userId, testId, status) => {
  try {
    let url = API.TESTS.ATTEMPT(userId, testId);
    if (status) {
      url += `?status=${status}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching test attempt:`, error);
    const errorMsg = error?.response?.data?.error || error.message || 'Network error';
    throw new Error(errorMsg);
  }
};

/**
 * Create or update a test attempt
 * @param {string} userId - The user ID
 * @param {string|number} testId - The test ID
 * @param {Object} attemptData - Test attempt data
 * @returns {Promise<Object>} - Promise resolving to response data
 */
export const createOrUpdateAttempt = async (userId, testId, attemptData) => {
  try {
    const response = await apiClient.post(
      API.TESTS.ATTEMPT(userId, testId),
      attemptData
    );
    return response.data;
  } catch (error) {
    console.error(`Error creating/updating test attempt:`, error);
    const errorMsg = error?.response?.data?.error || error.message || 'Network error';
    throw new Error(errorMsg);
  }
};

/**
 * Finish a test attempt
 * @param {string} userId - The user ID
 * @param {string|number} testId - The test ID
 * @param {Object} finishData - Data to send with finish request
 * @returns {Promise<Object>} - Promise resolving to response data
 */
export const finishTestAttempt = async (userId, testId, finishData) => {
  try {
    // Ensure category is included - use 'global' as fallback
    const payload = {
      ...finishData,
      category: finishData.category || 'global',
      // Make sure testId is explicitly included in both URL and payload
      testId: testId
    };
    
    console.log('Finishing test attempt with payload:', JSON.stringify(payload));
    
    const response = await apiClient.post(
      API.TESTS.FINISH(userId, testId),
      payload
    );
    return response.data;
  } catch (error) {
    console.error(`Error finishing test attempt:`, error);
    // Log more detailed error info
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    const errorMsg = error?.response?.data?.error || error.message || 'Network error';
    throw new Error(errorMsg);
  }
};

/**
 * Submit an answer to a question
 * @param {string} userId - The user ID 
 * @param {Object} answerData - Answer data
 * @returns {Promise<Object>} - Promise resolving to response data
 */
export const submitAnswer = async (userId, answerData) => {
  try {
    const response = await apiClient.post(
      API.TESTS.SUBMIT_ANSWER(userId),
      answerData
    );
    return response.data;
  } catch (error) {
    console.error(`Error submitting answer:`, error);
    const errorMsg = error?.response?.data?.error || error.message || 'Network error';
    throw new Error(errorMsg);
  }
};

/**
 * Update a single answer in a test attempt
 * @param {string} userId - The user ID
 * @param {string|number} testId - The test ID 
 * @param {Object} answerData - Answer data to update
 * @returns {Promise<Object>} - Promise resolving to response data
 */
export const updateAnswer = async (userId, testId, answerData) => {
  try {
    const response = await apiClient.post(
      API.TESTS.UPDATE_ANSWER(userId, testId),
      answerData
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating answer:`, error);
    const errorMsg = error?.response?.data?.error || error.message || 'Network error';
    throw new Error(errorMsg);
  }
};

/**
 * Update the current question position in a test attempt
 * @param {string} userId - The user ID
 * @param {string|number} testId - The test ID
 * @param {Object} positionData - Position data
 * @returns {Promise<Object>} - Promise resolving to response data
 */
export const updatePosition = async (userId, testId, positionData) => {
  try {
    const response = await apiClient.post(
      API.TESTS.UPDATE_POSITION(userId, testId),
      positionData
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating position:`, error);
    const errorMsg = error?.response?.data?.error || error.message || 'Network error';
    throw new Error(errorMsg);
  }
};

/**
 * List all test attempts for a user
 * @param {string} userId - The user ID
 * @param {number} [page=1] - Page number
 * @param {number} [pageSize=50] - Number of items per page
 * @returns {Promise<Object>} - Promise resolving to response data
 */
export const listTestAttempts = async (userId, page = 1, pageSize = 50) => {
  try {
    const response = await apiClient.get(
      `${API.TESTS.LIST_ATTEMPTS(userId)}?page=${page}&page_size=${pageSize}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error listing test attempts:`, error);
    const errorMsg = error?.response?.data?.error || error.message || 'Network error';
    throw new Error(errorMsg);
  }
};

const testService = {
  fetchTestsByCategory,
  fetchTestById,
  fetchTestAttempt,
  createOrUpdateAttempt,
  finishTestAttempt,
  submitAnswer,
  updateAnswer,
  updatePosition,
  listTestAttempts,
  formatImageUrl
};

export default testService;
