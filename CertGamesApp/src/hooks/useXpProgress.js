// src/hooks/useXpProgress.js
import { useMemo } from 'react';

/**
 * Custom hook to calculate accurate XP progress
 * @param {number} xp - Current XP value 
 * @param {number} level - Current level
 * @returns {Object} Progress data including percentage and remaining XP
 */
const useXpProgress = (xp, level) => {
  // Function to calculate XP required for a level (matches backend)
  const xpRequiredForLevel = (level) => {
    if (level < 1) return 0;
    if (level === 1) return 0;
    
    if (level <= 30) {
      return 500 * (level - 1);
    } else if (level <= 60) {
      const base = 500 * 29; // XP for levels up to 30
      return base + 750 * (level - 30);
    } else if (level <= 100) {
      const base = 500 * 29 + 750 * 30; // XP for levels up to 60
      return base + 1000 * (level - 60);
    } else {
      const base = 500 * 29 + 750 * 30 + 1000 * 40; // XP for levels up to 100
      return base + 1500 * (level - 100);
    }
  };
  
  // Calculate XP percentage for progress bar (accurate version)
  const xpPercentage = useMemo(() => {
    // Get XP required for current level and next level
    const currentLevelXp = xpRequiredForLevel(level);
    const nextLevelXp = xpRequiredForLevel(level + 1);
    
    // Calculate how much XP we've earned in the current level
    const xpInCurrentLevel = xp - currentLevelXp;
    
    // Calculate how much XP is needed to reach the next level
    const xpRequiredForNextLevel = nextLevelXp - currentLevelXp;
    
    // Calculate percentage (capped at 100%)
    return Math.min(100, (xpInCurrentLevel / xpRequiredForNextLevel) * 100);
  }, [xp, level]);
  
  // Calculate remaining XP needed for next level
  const remainingXp = useMemo(() => {
    const currentLevelXp = xpRequiredForLevel(level);
    const nextLevelXp = xpRequiredForLevel(level + 1);
    return Math.max(0, nextLevelXp - xp);
  }, [xp, level]);
  
  return {
    xpPercentage,
    remainingXp
  };
};

export default useXpProgress;
