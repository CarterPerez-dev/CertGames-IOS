// src/screens/LeaderboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchLeaderboard } from '../api/leaderboardService';

const LeaderboardScreen = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  const pageSize = 20;
  const { username } = useSelector((state) => state.user);
  
  const loadLeaderboard = useCallback(async (pageNum = 0, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(0);
        pageNum = 0;
      } else if (pageNum > 0) {
        setLoadingMore(true);
      }
      
      const skip = pageNum * pageSize;
      const data = await fetchLeaderboard(skip, pageSize);
      
      // Ensure we have data with proper structure
      const processedData = (data.data || []).map((item, idx) => ({
        ...item,
        rank: skip + idx + 1, // Ensure rank is calculated
      }));
      
      if (refresh || pageNum === 0) {
        setLeaderboardData(processedData);
      } else {
        setLeaderboardData(prevData => [...prevData, ...processedData]);
      }
      
      setHasMore(processedData.length === pageSize);
      setError(null);
    } catch (err) {
      setError('Failed to load leaderboard. Please try again.');
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [pageSize]);
  
  useEffect(() => {
    loadLeaderboard(0);
  }, [loadLeaderboard]);
  
  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard(0, true).finally(() => {
      setRefreshing(false);
    });
  };
  
  const loadMoreData = () => {
    if (hasMore && !loadingMore && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadLeaderboard(nextPage);
    }
  };
  
  const renderRankItem = ({ item, index }) => {
    const isCurrentUser = item.username === username;
    
    return (
      <View style={[
        styles.rankItem,
        isCurrentUser && styles.currentUserItem,
        index < 3 && styles.topRankItem
      ]}>
        <View style={styles.rankNumberContainer}>
          {index < 3 ? (
            <View style={[
              styles.topRankBadge,
              index === 0 && styles.goldBadge,
              index === 1 && styles.silverBadge,
              index === 2 && styles.bronzeBadge
            ]}>
              <Text style={styles.topRankText}>{item.rank || index + 1}</Text>
            </View>
          ) : (
            <Text style={styles.rankNumber}>{item.rank || index + 1}</Text>
          )}
        </View>
        
        {/* Avatar placeholder instead of trying to load images */}
        <View style={styles.placeholderAvatar}>
          <Text style={styles.avatarInitial}>
            {item.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        
        <View style={styles.userInfoContainer}>
          <Text style={[
            styles.username,
            isCurrentUser && styles.currentUsername
          ]}>
            {item.username}
            {isCurrentUser && (
              <Text style={styles.youText}> (You)</Text>
            )}
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.levelContainer}>
            <Text style={styles.levelLabel}>Level</Text>
            <Text style={[styles.levelValue, isCurrentUser && styles.currentUserStats]}>
              {item.level}
            </Text>
          </View>
          
          <View style={styles.xpContainer}>
            <Text style={styles.xpLabel}>XP</Text>
            <Text style={[styles.xpValue, isCurrentUser && styles.currentUserStats]}>
              {item.xp?.toLocaleString() || '0'}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#6543CC" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };
  
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={60} color="#AAAAAA" />
        <Text style={styles.emptyText}>
          {error || 'No leaderboard data available'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>
          Top performers ranked by level and experience
        </Text>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.mainLoadingContainer}>
          <ActivityIndicator size="large" color="#6543CC" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboardData}
          renderItem={renderRankItem}
          keyExtractor={(item, index) => `${item._id || item.username}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6543CC']}
              tintColor="#6543CC"
            />
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.2}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#1E1E1E',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    minHeight: 400, // Ensure content is scrollable
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  topRankItem: {
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  currentUserItem: {
    backgroundColor: 'rgba(101, 67, 204, 0.12)',
    borderWidth: 1,
    borderColor: '#6543CC',
  },
  rankNumberContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#AAAAAA',
  },
  topRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  topRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  placeholderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfoContainer: {
    flex: 1,
    marginRight: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  currentUsername: {
    color: '#6543CC',
    fontWeight: 'bold',
  },
  youText: {
    fontWeight: 'normal',
    fontSize: 14,
    color: '#AAAAAA',
  },
  statsContainer: {
    flexDirection: 'row',
  },
  levelContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  levelLabel: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  levelValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  xpContainer: {
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  xpValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  currentUserStats: {
    color: '#6543CC',
  },
  mainLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#AAAAAA',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6543CC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  footerText: {
    color: '#AAAAAA',
    marginLeft: 8,
  }
});

export default LeaderboardScreen;
