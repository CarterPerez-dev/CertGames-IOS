// src/hooks/useLeaderboard.js
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { fetchLeaderboard, fetchUserRanking } from '../api/leaderboardService';

/**
 * Custom hook for leaderboard functionality
 * @param {number} pageSize - Number of items per page
 * @returns {Object} Leaderboard methods and state
 */
const useLeaderboard = (pageSize = 20) => {
  const { userId, username } = useSelector((state) => state.user);
  
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [totalEntries, setTotalEntries] = useState(0);
  
  // Load leaderboard data
  const loadLeaderboard = useCallback(async (pageNum = 0, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(0);
        pageNum = 0;
      } else if (pageNum > 0) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const skip = pageNum * pageSize;
      const data = await fetchLeaderboard(skip, pageSize);
      
      if (refresh || pageNum === 0) {
        setLeaderboardData(data.data || []);
      } else {
        setLeaderboardData(prevData => [...prevData, ...(data.data || [])]);
      }
      
      setTotalEntries(data.total || 0);
      setHasMore((data.data || []).length === pageSize);
      setError(null);
    } catch (err) {
      console.error('Leaderboard error:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [pageSize]);
  
  // Load user's ranking
  const loadUserRank = useCallback(async () => {
    if (!userId) return;
    
    try {
      const rankData = await fetchUserRanking(userId);
      setUserRank(rankData);
    } catch (err) {
      console.error('User ranking error:', err);
      // Don't set error state here as this is a supplementary feature
    }
  }, [userId]);
  
  // Initial load
  useEffect(() => {
    Promise.all([
      loadLeaderboard(0),
      loadUserRank()
    ]);
  }, [loadLeaderboard, loadUserRank]);
  
  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadLeaderboard(0, true),
      loadUserRank()
    ]);
    setRefreshing(false);
  };
  
  // Load more data
  const loadMoreData = () => {
    if (hasMore && !loadingMore && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadLeaderboard(nextPage);
    }
  };
  
  // Check if the user is in the current visible data
  const isUserVisible = useCallback(() => {
    return leaderboardData.some(item => item.username === username);
  }, [leaderboardData, username]);
  
  return {
    // State
    leaderboardData,
    userRank,
    loading,
    refreshing,
    loadingMore,
    page,
    hasMore,
    error,
    totalEntries,
    
    // Methods
    loadLeaderboard,
    loadUserRank,
    onRefresh,
    loadMoreData,
    isUserVisible,
  };
};

export default useLeaderboard;
