// src/api/apiConfig.js
import Constants from 'expo-constants';

const DEV_URL = 'https://certgames.com/api'; 
const PROD_URL = 'https://certgames.com/api';

// Get the domain part of the URL (for image URLs)
const getDomain = (url) => {
  // Extract domain from API URL (remove /api at the end if present, fallback)
  return url.replace(/\/api\/?$/, '');
};

// Determine which URL to use
const isProduction = !__DEV__;
export const BASE_URL = isProduction ? PROD_URL : DEV_URL;

// Export domain URL for image paths (without /api at the end)
export const DOMAIN_URL = isProduction ? 
  getDomain(PROD_URL) : 
  getDomain(DEV_URL);

export const API = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${BASE_URL}/test/login`,
    REGISTER: `${BASE_URL}/test/user`,
    FORGOT_PASSWORD: `${BASE_URL}/password-reset/request-reset`,
    RESET_PASSWORD: `${BASE_URL}/password-reset/reset-password`,
    VERIFY_TOKEN: (token) => `${BASE_URL}/password-reset/verify-token/${token}`,
    OAUTH_APPLE: `${BASE_URL}/oauth/login/apple`,
    OAUTH_GOOGLE: `${BASE_URL}/oauth/login/google`,
    

    OAUTH_APPLE_MOBILE: `${BASE_URL}/oauth/login/apple/mobile`,
    OAUTH_APPLE_CALLBACK: `${BASE_URL}/oauth/auth/apple`,

    VERIFY_GOOGLE_TOKEN: `${BASE_URL}/oauth/verify-google-token`,
  },
  
  
  SUBSCRIPTION: {
    VERIFY_RECEIPT: `${BASE_URL}/subscription/verify-receipt`,
    CHECK_STATUS: `${BASE_URL}/subscription/subscription-status`,
    UPDATE: `${BASE_URL}/subscription/update`,
    CANCEL: `${BASE_URL}/subscription/cancel-subscription`,
    APPLE_SUBSCRIPTION: `${BASE_URL}/subscription/apple-subscription`,
    RESTORE_PURCHASES: `${BASE_URL}/subscription/restore-purchases`,
  },

  
  RESOURCES: {
    CATEGORIES: `${BASE_URL}/resources/categories`,
    BY_CATEGORY: `${BASE_URL}/resources/category`,
    TRACK_CLICK: `${BASE_URL}/resources/track-click`,
  },
  USER: {
    DETAILS: (userId) => `${BASE_URL}/test/user/${userId}`,
    DAILY_BONUS: (userId) => `${BASE_URL}/test/user/${userId}/daily-bonus`,
    ADD_COINS: (userId) => `${BASE_URL}/test/user/${userId}/add-coins`,
    ADD_XP: (userId) => `${BASE_URL}/test/user/${userId}/add-xp`,
    CHANGE_USERNAME: `${BASE_URL}/test/user/change-username`,
    CHANGE_EMAIL: `${BASE_URL}/test/user/change-email`,
    CHANGE_PASSWORD: `${BASE_URL}/test/user/change-password`,
    DELETE_ACCOUNT: (userId) => `${BASE_URL}/test/user/${userId}/delete`,
    USAGE_LIMITS: (userId) => `${BASE_URL}/test/user/${userId}/usage-limits`,
    DECREMENT_QUESTIONS: (userId) => `${BASE_URL}/test/user/${userId}/decrement-questions`,
  },
  
  // Test endpoints
  TESTS: {
    DETAILS: (category, testId) => `${BASE_URL}/test/tests/${category}/${testId}`,
    ATTEMPT: (userId, testId) => `${BASE_URL}/test/attempts/${userId}/${testId}`,
    FINISH: (userId, testId) => `${BASE_URL}/test/attempts/${userId}/${testId}/finish`,
    SUBMIT_ANSWER: (userId) => `${BASE_URL}/test/user/${userId}/submit-answer`,
    UPDATE_ANSWER: (userId, testId) => `${BASE_URL}/test/attempts/${userId}/${testId}/answer`,
    UPDATE_POSITION: (userId, testId) => `${BASE_URL}/test/attempts/${userId}/${testId}/position`,
    LIST_ATTEMPTS: (userId) => `${BASE_URL}/test/attempts/${userId}/list`,
  },
  
  // Analogy Tool
  ANALOGY: {
    STREAM: `${BASE_URL}/analogy/stream_analogy`,
    GENERATE: `${BASE_URL}/analogy/generate_analogy`, // Legacy endpoint in case
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
