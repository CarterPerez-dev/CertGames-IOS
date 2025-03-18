// src/screens/LeaderboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchLeaderboard, fetchUserRanking } from '../api/leaderboardService';
import { LinearGradient } from 'expo-linear-gradient';

const LeaderboardScreen = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  const pageSize = 20;
  const { userId, username, level, xp } = useSelector((state) => state.user);
  
  const loadLeaderboard = useCallback(async (pageNum = 0, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setPage(0);
        pageNum = 0;
      }
      
      if (pageNum === 0) {
        setLeaderboardData([]);
      }
      
      const skip = pageNum * pageSize;
      const data = await fetchLeaderboard(skip, pageSize);
      
      if (refresh) {
        setLeaderboardData(data.data);
      } else {
        setLeaderboardData(prevData => [...prevData, ...data.data]);
      }
      
      setHasMore(data.data.length === pageSize);
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
  
  const loadUserRank = useCallback(async () => {
    if (userId) {
      try {
        const rankData = await fetchUserRanking(userId);
        setUserRank(rankData);
      } catch (err) {
        console.error('User rank error:', err);
      }
    }
  }, [userId]);
  
  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadLeaderboard(0),
      loadUserRank()
    ]).finally(() => {
      setLoading(false);
    });
  }, [loadLeaderboard, loadUserRank]);
  
  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([
      loadLeaderboard(0, true),
      loadUserRank()
    ]).finally(() => {
      setRefreshing(false);
    });
  };
  
  const loadMoreData = () => {
    if (hasMore && !loadingMore && !refreshing) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      loadLeaderboard(nextPage).finally(() => {
        setLoadingMore(false);
      });
    }
  };
  
  const renderRankItem = ({ item, index }) => {
    const isCurrentUser = item.username === username;
    const rankType = index < 3 ? ['gold', 'silver', 'bronze'][index] : 'normal';
    
    return (
      <View style={[
        styles.rankItem,
        isCurrentUser && styles.currentUserItem
      ]}>
        <View style={styles.rankNumberContainer}>
          {index < 3 ? (
            <View style={[
              styles.topRankBadge,
              index === 0 && styles.goldBadge,
              index === 1 && styles.silverBadge,
              index === 2 && styles.bronzeBadge
            ]}>
              <Text style={styles.topRankText}>{index + 1}</Text>
            </View>
          ) : (
            <Text style={styles.rankNumber}>{index + 1}</Text>
          )}
        </View>
        
        <View style={styles.userAvatarContainer}>
          {item.avatarUrl ? (
            <Image
              source={{ uri: item.avatarUrl }}
              style={styles.userAvatar}
            />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.avatarInitial}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
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
              {item.xp.toLocaleString()}
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
  
  // Find the user's position in the leaderboard if not directly visible
  const renderUserPosition = () => {
    if (!userRank || loading) return null;
    
    // Check if the user's rank is already visible in the current page
    const isUserVisible = leaderboardData.some(item => item.username === username);
    
    // If user is not visible in the current page, show their rank separately
    if (!isUserVisible && userRank.rank > 0) {
      return (
        <View style={styles.userPositionCard}>
          <LinearGradient
            colors={['#6543CC', '#8956FF']}
            style={styles.userPositionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.userPositionContent}>
              <View style={styles.userRankInfo}>
                <Text style={styles.yourRankLabel}>Your Rank</Text>
                <Text style={styles.yourRankValue}>{userRank.rank}</Text>
              </View>
              
              <View style={styles.userPositionDetails}>
                <View style={styles.userPositionAvatar}>
                  {userRank.avatarUrl ? (
                    <Image
                      source={{ uri: userRank.avatarUrl }}
                      style={styles.userPositionAvatarImage}
                    />
                  ) : (
                    <View style={styles.userPositionPlaceholder}>
                      <Text style={styles.userPositionInitial}>
                        {username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.userPositionStats}>
                  <Text style={styles.userPositionUsername}>{username}</Text>
                  <View style={styles.userPositionValues}>
                    <Text style={styles.userPositionLevel}>Level {level}</Text>
                    <Text style={styles.userPositionXp}>{xp.toLocaleString()} XP</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      );
    }
    
    return null;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>
          Top performers ranked by level and experience
        </Text>
      </View>
      
      {renderUserPosition()}
      
      <FlatList
        data={leaderboardData}
        renderItem={renderRankItem}
        keyExtractor={(item, index) => `${item.username}-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
      
      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6543CC" />
        </View>
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
  userAvatarContainer: {
    marginRight: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
  },
  placeholderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
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
  },
  userPositionCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#6543CC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  userPositionGradient: {
    width: '100%',
    height: '100%',
  },
  userPositionContent: {
    padding: 16,
  },
  userRankInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  yourRankLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  yourRankValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userPositionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPositionAvatar: {
    marginRight: 12,
  },
  userPositionAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userPositionPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userPositionInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userPositionStats: {
    flex: 1,
  },
  userPositionUsername: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userPositionValues: {
    flexDirection: 'row',
  },
  userPositionLevel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 12,
  },
  userPositionXp: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});

export default LeaderboardScreen;
