// src/constants/achievementConstants.js

// Achievement categories
export const ACHIEVEMENT_CATEGORIES = {
  ALL: 'all',
  TEST: 'test',
  SCORE: 'score',
  COINS: 'coins',
  LEVEL: 'level',
  QUESTIONS: 'questions',
};

// Category display names
export const CATEGORY_NAMES = {
  all: 'All Achievements',
  test: 'Test Completion',
  score: 'Score & Accuracy',
  coins: 'Coin Collection',
  level: 'Leveling Up',
  questions: 'Question Mastery',
};

// Icon mappings for achievement types
export const ACHIEVEMENT_ICONS = {
  // Level-related
  level_up_5: 'trophy',
  mid_tier_grinder_25: 'trophy',
  elite_scholar_50: 'trophy',
  ultimate_master_100: 'trophy',
  bronze_grinder: 'trophy',
  silver_scholar: 'medal',
  gold_god: 'medal',
  platinum_pro: 'medal',
  
  // Coin-related
  coin_collector_5000: 'cash',
  coin_hoarder_10000: 'cash',
  coin_tycoon_50000: 'cash',
  
  // Accuracy-related
  accuracy_king: 'checkmark-circle',
  perfectionist_1: 'checkmark-circle',
  double_trouble_2: 'checkmark-circle',
  error404_failure_not_found: 'checkmark-circle',
  redemption_arc: 'fitness',
  
  // Question-related
  answer_machine_1000: 'book',
  knowledge_beast_5000: 'book',
  question_terminator: 'book',
  walking_encyclopedia: 'book',
  
  // Test-related
  test_rookie: 'school',
  test_finisher: 'school',
  
  // Default
  default: 'ribbon',
};

// Color mappings for achievement types
export const ACHIEVEMENT_COLORS = {
  // Level-related
  level_up_5: '#6543CC',
  mid_tier_grinder_25: '#6543CC',
  elite_scholar_50: '#FF4C8B',
  ultimate_master_100: '#FF4C8B',
  bronze_grinder: '#CD7F32',
  silver_scholar: '#C0C0C0',
  gold_god: '#FFD700',
  platinum_pro: '#E5E4E2',
  
  // Coin-related
  coin_collector_5000: '#FFD700',
  coin_hoarder_10000: '#FFD700',
  coin_tycoon_50000: '#FFD700',
  
  // Accuracy-related
  accuracy_king: '#2ebb77',
  perfectionist_1: '#2ebb77',
  double_trouble_2: '#2ebb77',
  error404_failure_not_found: '#2ebb77',
  redemption_arc: '#FF4500',
  
  // Question-related
  answer_machine_1000: '#3498DB',
  knowledge_beast_5000: '#3498DB',
  question_terminator: '#3498DB',
  walking_encyclopedia: '#3498DB',
  
  // Test-related
  test_rookie: '#F39C12',
  test_finisher: '#F39C12',
  
  // Default
  default: '#95A5A6',
};

/**
 * Get the icon for an achievement
 * @param {string} achievementId - The achievement ID
 * @returns {string} - The Ionicons icon name
 */
export const getAchievementIcon = (achievementId) => {
  // Direct match
  if (ACHIEVEMENT_ICONS[achievementId]) {
    return ACHIEVEMENT_ICONS[achievementId];
  }
  
  // Partial matches
  for (const key of Object.keys(ACHIEVEMENT_ICONS)) {
    if (achievementId.includes(key)) {
      return ACHIEVEMENT_ICONS[key];
    }
  }
  
  return ACHIEVEMENT_ICONS.default;
};

/**
 * Get the color for an achievement
 * @param {string} achievementId - The achievement ID
 * @returns {string} - The color hex code
 */
export const getAchievementColor = (achievementId) => {
  // Direct match
  if (ACHIEVEMENT_COLORS[achievementId]) {
    return ACHIEVEMENT_COLORS[achievementId];
  }
  
  // Partial matches
  for (const key of Object.keys(ACHIEVEMENT_COLORS)) {
    if (achievementId.includes(key)) {
      return ACHIEVEMENT_COLORS[key];
    }
  }
  
  return ACHIEVEMENT_COLORS.default;
};

/**
 * Determine the category of an achievement
 * @param {string} achievementId - The achievement ID
 * @returns {string} - The category
 */
export const getAchievementCategory = (achievementId) => {
  if (achievementId.includes('level') || achievementId.includes('grinder') || 
      achievementId.includes('scholar') || achievementId.includes('master')) {
    return ACHIEVEMENT_CATEGORIES.LEVEL;
  } else if (achievementId.includes('coin')) {
    return ACHIEVEMENT_CATEGORIES.COINS;
  } else if (achievementId.includes('accuracy') || achievementId.includes('perfectionist') || 
             achievementId.includes('redemption')) {
    return ACHIEVEMENT_CATEGORIES.SCORE;
  } else if (achievementId.includes('answer') || achievementId.includes('question') || 
             achievementId.includes('encyclopedia')) {
    return ACHIEVEMENT_CATEGORIES.QUESTIONS;
  } else if (achievementId.includes('rookie') || achievementId.includes('test') || 
             achievementId.includes('trouble')) {
    return ACHIEVEMENT_CATEGORIES.TEST;
  }
  return ACHIEVEMENT_CATEGORIES.ALL;
};
