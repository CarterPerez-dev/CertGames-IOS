// src/api/testService.js
import apiClient from './apiClient';
import { API } from './apiConfig';

/**
 * Fetch tests by category
 * @param {string} category - The test category (e.g., 'aplus', 'secplus')
 * @returns {Promise<Array>} - Promise resolving to array of tests
 */
export const fetchTestsByCategory = async (category) => {
  try {
    const response = await apiClient.get(API.TESTS.LIST(category));
    return response.data;
  } catch (error) {
    console.error(`Error fetching tests for ${category}:`, error);
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
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
    const response = await apiClient.post(
      API.TESTS.FINISH(userId, testId),
      finishData
    );
    return response.data;
  } catch (error) {
    console.error(`Error finishing test attempt:`, error);
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
  }
};
