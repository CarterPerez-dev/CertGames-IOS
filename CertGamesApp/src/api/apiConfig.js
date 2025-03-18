// src/api/apiConfig.js
import Constants from 'expo-constants';

// Use different URLs based on environment
const DEV_URL = 'http://192.168.1.172:8080/api'; // Replace with your local IP - can it be localhost?
const PROD_URL = 'https://certgames.com/api';

// Determine which URL to use
const isProduction = !__DEV__;
export const BASE_URL = isProduction ? PROD_URL : DEV_URL;

export const API = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${BASE_URL}/test/login`,
    REGISTER: `${BASE_URL}/test/user`,
    FORGOT_PASSWORD: `${BASE_URL}/password-reset/request-reset`,
    RESET_PASSWORD: `${BASE_URL}/password-reset/reset-password`,
    VERIFY_TOKEN: (token) => `${BASE_URL}/password-reset/verify-token/${token}`,
    OAUTH_GOOGLE: `${BASE_URL}/oauth/login/google`,
    OAUTH_APPLE: `${BASE_URL}/oauth/login/apple`,
  },
  
  // User endpoints
  USER: {
    DETAILS: (userId) => `${BASE_URL}/test/user/${userId}`,
    DAILY_BONUS: (userId) => `${BASE_URL}/test/user/${userId}/daily-bonus`,
    ADD_COINS: (userId) => `${BASE_URL}/test/user/${userId}/add-coins`,
    ADD_XP: (userId) => `${BASE_URL}/test/user/${userId}/add-xp`,
    CHANGE_USERNAME: `${BASE_URL}/test/user/change-username`,
    CHANGE_EMAIL: `${BASE_URL}/test/user/change-email`,
    CHANGE_PASSWORD: `${BASE_URL}/test/user/change-password`,
  },
  
  // Test endpoints
  TESTS: {
    LIST: (category) => `${BASE_URL}/tests/${category}`,
    DETAILS: (category, testId) => `${BASE_URL}/tests/${category}/${testId}`,
    ATTEMPT: (userId, testId) => `${BASE_URL}/attempts/${userId}/${testId}`,
    FINISH: (userId, testId) => `${BASE_URL}/attempts/${userId}/${testId}/finish`,
    SUBMIT_ANSWER: (userId) => `${BASE_URL}/user/${userId}/submit-answer`,
    UPDATE_ANSWER: (userId, testId) => `${BASE_URL}/attempts/${userId}/${testId}/answer`,
    UPDATE_POSITION: (userId, testId) => `${BASE_URL}/attempts/${userId}/${testId}/position`,
    LIST_ATTEMPTS: (userId) => `${BASE_URL}/attempts/${userId}/list`,
  },
  
  // Analogy Tool
  ANALOGY: {
    STREAM: `${BASE_URL}/analogy/stream_analogy`,
    GENERATE: `${BASE_URL}/analogy/generate_analogy`, // Legacy endpoint
  },
  
  // Scenario Tool
  SCENARIO: {
    STREAM_SCENARIO: `${BASE_URL}/scenario/stream_scenario`,
    STREAM_QUESTIONS: `${BASE_URL}/scenario/stream_questions`,
  },
  
  // GRC Tool
  GRC: {
    STREAM_QUESTION: `${BASE_URL}/grc/stream_question`,
    GENERATE_QUESTION: `${BASE_URL}/grc/generate_question`, // Legacy endpoint
  },
  
  // Xploitcraft Tool
  XPLOIT: {
    GENERATE_PAYLOAD: `${BASE_URL}/payload/generate_payload`,
  },
  
  // Daily Question
  DAILY: {
    GET_QUESTION: `${BASE_URL}/test/daily-question`,
    SUBMIT_ANSWER: `${BASE_URL}/test/daily-question/answer`,
  },
  
  // Achievements and shop
  ACHIEVEMENTS: `${BASE_URL}/test/achievements`,
  SHOP: {
    ITEMS: `${BASE_URL}/test/shop`,
    PURCHASE: (itemId) => `${BASE_URL}/test/shop/purchase/${itemId}`,
    EQUIP: `${BASE_URL}/test/shop/equip`,
  },
  
  // Support
  SUPPORT: {
    THREADS: `${BASE_URL}/support/my-chat`,
    THREAD: (threadId) => `${BASE_URL}/support/my-chat/${threadId}`,
    CLOSE_THREAD: (threadId) => `${BASE_URL}/support/my-chat/${threadId}/close`,
  },
  
  // Newsletter
  NEWSLETTER: {
    SUBSCRIBE: `${BASE_URL}/newsletter/subscribe`,
    UNSUBSCRIBE: `${BASE_URL}/newsletter/unsubscribe`,
    UNSUBSCRIBE_BY_TOKEN: (token) => `${BASE_URL}/newsletter/unsubscribe/${token}`,
  },
  
  // Leaderboard
  LEADERBOARD: {
    PUBLIC: `${BASE_URL}/public-leaderboard/board`,
    USER: `${BASE_URL}/test/leaderboard`,
  },
  
  // Contact Form
  CONTACT: `${BASE_URL}/contact-form`,
};
