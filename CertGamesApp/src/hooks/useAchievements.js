// src/hooks/useAchievements.js
import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAchievements } from '../api/achievementService';
import { fetchUserData } from '../store/slices/userSlice';
import { CATEGORY_NAMES, getAchievementCategory } from '../constants/achievementConstants';

/**
 * Custom hook for achievement functionality
 * @returns {Object} Achievement methods and state
 */
const useAchievements = () => {
  const dispatch = useDispatch();
  const { userId, achievements: userAchievements } = useSelector((state) => state.user);
  
  const [allAchievements, setAllAchievements] = useState([]);
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [error, setError] = useState(null);
  
  // Load achievements data
  const loadAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const achievements = await fetchAchievements();
      setAllAchievements(achievements);
      filterAchievements(achievements, activeCategory);
      setError(null);
    } catch (err) {
      console.error('Achievements fetch error:', err);
      setError('Failed to load achievements. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);
  
  // Initial load
  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);
  
  // Filter achievements by category
  const filterAchievements = (achievements, category) => {
    if (category === 'all') {
      setFilteredAchievements(achievements);
    } else {
      setFilteredAchievements(
        achievements.filter(achievement => 
          getAchievementCategory(achievement.achievementId) === category
        )
      );
    }
  };
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    filterAchievements(allAchievements, category);
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadAchievements(),
      dispatch(fetchUserData(userId))
    ]);
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
    // State
    allAchievements,
    filteredAchievements,
    loading,
    refreshing,
    activeCategory,
    error,
    categories: CATEGORY_NAMES,
    
    // Methods
    loadAchievements,
    handleCategoryChange,
    handleRefresh,
    isAchievementUnlocked,
    getAchievementDetails,
    getCompletionPercentage,
    getAchievementStats,
  };
};

export default useAchievements;
