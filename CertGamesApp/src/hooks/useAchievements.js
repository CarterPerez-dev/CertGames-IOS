// src/hooks/useAchievements.js
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAchievements } from '../store/slices/achievementsSlice';
import { fetchUserData } from '../store/slices/userSlice';
import { CATEGORY_NAMES, getAchievementCategory } from '../constants/achievementConstants';

/**
 * Custom hook for achievement functionality
 * @returns {Object} Achievement methods and state
 */
const useAchievements = () => {
  const dispatch = useDispatch();
  const { userId = null, achievements: userAchievements = [] } = useSelector((state) => state.user || {});
  const { all: allAchievements = [], status: achievementsStatus = 'idle' } = useSelector((state) => state.achievements || { all: [], status: 'idle' });
  
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [error, setError] = useState(null);
  
  // This effect will ensure achievements are fetched when userId changes or when achievements are unlocked
  useEffect(() => {
    if (userId) {
      // Fetch achievements if they haven't been loaded yet
      if (achievementsStatus === 'idle' || allAchievements.length === 0) {
        dispatch(fetchAchievements());
      }
    }
  }, [userId, achievementsStatus, allAchievements.length, dispatch]);
  
  // Filter achievements by category
  const filterAchievements = useCallback((achievements, category) => {
    if (category === 'all') {
      setFilteredAchievements(achievements);
    } else {
      setFilteredAchievements(
        achievements.filter(achievement => 
          getAchievementCategory(achievement.achievementId) === category
        )
      );
    }
  }, []);
  
  // This effect will filter achievements whenever userAchievements or allAchievements change
  useEffect(() => {
    filterAchievements(allAchievements, activeCategory);
    setLoading(false);
  }, [allAchievements, userAchievements, activeCategory, filterAchievements]);
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    filterAchievements(allAchievements, category);
  };
  
  // Use this improved handleRefresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Dispatch both actions to refresh data
    if (userId) {
      await Promise.all([
        dispatch(fetchAchievements()),
        dispatch(fetchUserData(userId))
      ]);
    }
    
    setRefreshing(false);
  };
  
  // Check if achievement is unlocked
  const isAchievementUnlocked = (achievementId) => {
    return userAchievements && userAchievements.includes(achievementId);
  };
  
  // Get achievement details
  const getAchievementDetails = (achievementId) => {
    return allAchievements.find(achievement => achievement.achievementId === achievementId);
  };
  
  // Get achievement completion percentage
  const getCompletionPercentage = () => {
    const totalCount = allAchievements.length;
    const unlockedCount = userAchievements ? userAchievements.length : 0;
    return totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  };
  
  // Get achievement statistics
  const getAchievementStats = () => {
    const totalCount = allAchievements.length;
    const unlockedCount = userAchievements ? userAchievements.length : 0;
    const completionPercentage = getCompletionPercentage();
    
    return {
      total: totalCount,
      unlocked: unlockedCount,
      locked: totalCount - unlockedCount,
      completionPercentage
    };
  };
  
  return {
    // State with fallbacks
    allAchievements: allAchievements || [],
    filteredAchievements: filteredAchievements || [],
    loading: loading || false,
    refreshing: refreshing || false,
    activeCategory: activeCategory || 'all',
    error: error || null,
    categories: CATEGORY_NAMES || {},
    
    // Methods with fallbacks
    filterAchievements: filterAchievements || (() => {}),
    handleCategoryChange: handleCategoryChange || (() => {}),
    handleRefresh: handleRefresh || (() => {}),
    isAchievementUnlocked: isAchievementUnlocked || (() => false),
    getAchievementDetails: getAchievementDetails || (() => null),
    getCompletionPercentage: getCompletionPercentage || (() => 0),
    getAchievementStats: getAchievementStats || (() => ({ total: 0, unlocked: 0, locked: 0, completionPercentage: 0 }))
  };
};

export default useAchievements;
