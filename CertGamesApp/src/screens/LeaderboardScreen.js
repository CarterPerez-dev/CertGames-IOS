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
  Platform,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchLeaderboard } from '../api/leaderboardService';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const LeaderboardScreen = () => {
  // Access theme context
  const { theme } = useTheme();

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateY = useState(new Animated.Value(20))[0];

  // State for leaderboard data
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  const pageSize = 20;
  const { username } = useSelector((state) => state.user);
  
  // Animation when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY]);

  // Load leaderboard data
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
  
  // Initial load
  useEffect(() => {
    loadLeaderboard(0);
  }, [loadLeaderboard]);
  
  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard(0, true).finally(() => {
      setRefreshing(false);
    });
  };
  
  // Load more data handler
  const loadMoreData = () => {
    if (hasMore && !loadingMore && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadLeaderboard(nextPage);
    }
  };
  
  // Render rank item
  const renderRankItem = ({ item, index }) => {
    const isCurrentUser = item.username === username;
    const itemColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : theme.colors.card;
    
    // Animations for rank items
    const itemOpacity = new Animated.Value(0);
    const itemTranslateY = new Animated.Value(10);
    
    Animated.parallel([
      Animated.timing(itemOpacity, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(itemTranslateY, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
    
    return (
      <Animated.View 
        style={{
          opacity: itemOpacity,
          transform: [{ translateY: itemTranslateY }],
        }}
      >
        <LinearGradient
          colors={isCurrentUser 
            ? [theme.colors.shadow, theme.colors.primary + '90'] 
            : [itemColor, itemColor + '90']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.rankItem,
            isCurrentUser && styles.currentUserItem,
            index < 3 && styles.topRankItem
          ]}
        >
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
          
          {/* Avatar */}
          {item.avatarUrl ? (
            <Image 
              source={{ uri: item.avatarUrl }} 
              style={styles.avatarImage}
              defaultSource={require('../../assets/default-avatar.png')}
              onError={() => console.log('Avatar image failed to load:', item.avatarUrl)}
            />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.avatarInitial}>
                {item.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          
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
        </LinearGradient>
      </Animated.View>
    );
  };
  
  // Render footer for loading more
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };
  
  // Render empty state
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={60} color={theme.colors.primary} />
        <Text style={styles.emptyText}>
          {error || 'No leaderboard data available'}
        </Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={onRefresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.shadow, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: translateY }]
        }}>
          <Text style={styles.title}>Leaderboard</Text>
          <View style={styles.headerContent}>
            <Text style={styles.subtitle}>
              Top performers ranked by level and experience
            </Text>
            <View style={styles.trophyIcon}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
      
      {loading && !refreshing ? (
        <View style={styles.mainLoadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
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
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
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
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 15 : 25,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
    marginRight: 10,
  },
  trophyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 100, // Extra space at bottom
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
        elevation: 5,
      },
    }),
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  rankNumberContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  topRankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  goldBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.7)',
  },
  silverBadge: {
    backgroundColor: 'rgba(192, 192, 192, 0.7)',
  },
  bronzeBadge: {
    backgroundColor: 'rgba(205, 127, 50, 0.7)',
  },
  topRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  placeholderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentUsername: {
    fontWeight: 'bold',
  },
  youText: {
    fontWeight: 'normal',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 10,
    padding: 8,
  },
  levelContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  levelLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
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
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  xpValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  currentUserStats: {
    color: '#FFFFFF',
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
