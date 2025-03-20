// src/screens/LeaderboardScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Dimensions,
  StatusBar
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchLeaderboard } from '../api/leaderboardService';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import AnimatedNumbers from 'react-native-animated-numbers';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
  SlideInUp,
  ZoomIn,
  Layout
} from 'react-native-reanimated';

// Import shared UI components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

const LeaderboardScreen = () => {
  const { theme } = useTheme();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [topThree, setTopThree] = useState([]);
  const [userRanking, setUserRanking] = useState(null);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.95);
  const scrollY = useSharedValue(0);
  
  const pageSize = 20;
  const { username } = useSelector((state) => state.user);
  const flatListRef = useRef(null);
  
  // Setup initial animations
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    contentScale.value = withTiming(1, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  }, []);
  
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
      
      // Process the data to ensure all fields are present 
      const processedData = (data.data || []).map((item, idx) => ({
        ...item,
        rank: skip + idx + 1, // Ensure rank is calculated
      }));
      
      if (refresh || pageNum === 0) {
        setLeaderboardData(processedData);
        
        // Extract top 3 users for special display
        if (processedData.length >= 3) {
          setTopThree(processedData.slice(0, 3));
        } else {
          setTopThree(processedData);
        }
        
        // Find current user's ranking
        const userIdx = processedData.findIndex(user => user.username === username);
        if (userIdx !== -1) {
          setUserRanking(processedData[userIdx]);
        } else {
          setUserRanking(null);
        }
      } else {
        setLeaderboardData(prevData => {
          const newData = [...prevData, ...processedData];
          
          // Update user's ranking if found in new batch
          const userIdx = processedData.findIndex(user => user.username === username);
          if (userIdx !== -1 && !userRanking) {
            setUserRanking(processedData[userIdx]);
          }
          
          return newData;
        });
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
  }, [pageSize, username, userRanking]);
  
  // Initial data load
  useEffect(() => {
    loadLeaderboard(0);
  }, [loadLeaderboard]);
  
  // Handle refresh
  const onRefresh = () => {
    // Animate content scale for feedback
    contentScale.value = withTiming(0.97, { duration: 300 });
    setTimeout(() => {
      contentScale.value = withTiming(1, { duration: 300 });
    }, 300);
    
    setRefreshing(true);
    loadLeaderboard(0, true).finally(() => {
      setRefreshing(false);
    });
  };
  
  // Load more data on scroll end
  const loadMoreData = () => {
    if (hasMore && !loadingMore && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadLeaderboard(nextPage);
    }
  };
  
  // Scroll to user's position
  const scrollToUser = () => {
    if (!userRanking || !flatListRef.current) return;
    
    const userIdx = leaderboardData.findIndex(user => user.username === username);
    if (userIdx !== -1) {
      flatListRef.current.scrollToIndex({
        index: userIdx,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };
  
  // Handle scroll error
  const handleScrollToIndexFailed = (info) => {
    console.log('Scroll to index failed:', info);
    // Attempt to scroll to the item after a delay
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5,
        });
      }
    }, 500);
  };
  
  // Format large numbers with k/m suffix
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'm';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };
  
  // Get medal icon for top 3 ranks
  const getMedalIcon = (rank) => {
    if (rank === 1) return { name: 'trophy', color: '#FFD700' }; // Gold
    if (rank === 2) return { name: 'trophy', color: '#C0C0C0' }; // Silver
    if (rank === 3) return { name: 'trophy', color: '#CD7F32' }; // Bronze
    return { name: 'medal', color: '#95A5A6' }; // Default
  };
  
  // Render top 3 users section
  const renderTopThree = () => {
    if (topThree.length === 0) return null;
    
    // Organize positions for display
    let positions = [];
    if (topThree.length === 3) {
      positions = [
        { user: topThree[1], position: 'left', rank: 2 },
        { user: topThree[0], position: 'center', rank: 1 },
        { user: topThree[2], position: 'right', rank: 3 },
      ];
    } else if (topThree.length === 2) {
      positions = [
        { user: topThree[1], position: 'left', rank: 2 },
        { user: topThree[0], position: 'center', rank: 1 },
      ];
    } else {
      positions = [
        { user: topThree[0], position: 'center', rank: 1 },
      ];
    }
    
    return (
      <Animated.View 
        style={styles.topThreeContainer}
        entering={FadeIn.duration(500)}
      >
        <LinearGradient
          colors={['rgba(101, 67, 204, 0.15)', 'rgba(255, 76, 139, 0.15)', 'rgba(0, 0, 0, 0)']}
          style={styles.topThreeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.podiumContainer}>
            {positions.map((item, index) => {
              const isCurrentUser = item.user.username === username;
              const medal = getMedalIcon(item.rank);
              const delay = item.rank === 1 ? 0 : item.rank === 2 ? 200 : 400;
              
              return (
                <Animated.View 
                  key={`top-${item.rank}`}
                  style={[
                    styles.podiumItem,
                    item.position === 'center' ? styles.podiumCenter : 
                    item.position === 'left' ? styles.podiumLeft : styles.podiumRight
                  ]}
                  entering={ZoomIn.delay(delay).duration(500)}
                >
                  <View style={styles.rankBadgeContainer}>
                    <LinearGradient
                      colors={
                        item.rank === 1 
                          ? ['#FFD700', '#FFC000'] // Gold
                          : item.rank === 2 
                            ? ['#E0E0E0', '#C0C0C0'] // Silver
                            : ['#CD7F32', '#B06500'] // Bronze
                      }
                      style={styles.rankBadge}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.rankNumber}>{item.rank}</Text>
                    </LinearGradient>
                  </View>
                  
                  <View 
                    style={[
                      styles.podiumAvatar,
                      isCurrentUser && styles.currentUserPodiumAvatar,
                      item.position === 'center' ? styles.podiumCenterAvatar : styles.podiumSideAvatar
                    ]}
                  >
                    {item.user.avatarUrl ? (
                      <Image 
                        source={{ uri: item.user.avatarUrl }}
                        style={styles.podiumAvatarImage}
                        defaultSource={require('../../assets/default-avatar.png')}
                      />
                    ) : (
                      <View style={styles.podiumPlaceholderAvatar}>
                        <Text style={styles.podiumAvatarText}>
                          {item.user.username?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View 
                    style={[
                      styles.podiumUserInfo,
                      item.position === 'center' ? styles.podiumCenterInfo : {}
                    ]}
                  >
                    <Text 
                      style={[
                        styles.podiumUsername,
                        isCurrentUser && styles.currentPodiumUsername,
                        item.position === 'center' ? styles.podiumCenterUsername : {}
                      ]}
                      numberOfLines={1}
                    >
                      {item.user.username}
                      {isCurrentUser && <Text style={styles.youText}> (You)</Text>}
                    </Text>
                    
                    <View style={styles.podiumStatsRow}>
                      <View style={styles.podiumStat}>
                        <Text 
                          style={[
                            styles.podiumStatValue,
                            item.position === 'center' ? styles.podiumCenterStatValue : {}
                          ]}
                        >
                          {item.user.level}
                        </Text>
                        <Text style={styles.podiumStatLabel}>Level</Text>
                      </View>
                      
                      <View style={styles.podiumStatDivider} />
                      
                      <View style={styles.podiumStat}>
                        <Text 
                          style={[
                            styles.podiumStatValue,
                            item.position === 'center' ? styles.podiumCenterStatValue : {}
                          ]}
                        >
                          {formatNumber(item.user.xp)}
                        </Text>
                        <Text style={styles.podiumStatLabel}>XP</Text>
                      </View>
                    </View>
                  </View>
                  
                  {item.position === 'center' && (
                    <LinearGradient
                      colors={['#FFD700', '#FFC000']}
                      style={styles.crownContainer}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="trophy" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                </Animated.View>
              );
            })}
            
            {/* Podium platforms */}
            <View style={styles.podiumPlatforms}>
              <View style={[styles.platform, styles.secondPlace]} />
              <View style={[styles.platform, styles.firstPlace]} />
              <View style={[styles.platform, styles.thirdPlace]} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };
  
  // Render your ranking card
  const renderUserRanking = () => {
    if (!userRanking) return null;
    
    return (
      <Animated.View 
        style={styles.userRankingContainer}
        entering={SlideInUp.delay(600).duration(500)}
      >
        <Card
          gradient="primary"
          elevation={5}
          style={styles.userRankingCard}
        >
          <View style={styles.userRankingCardContent}>
            <View style={styles.userRankingHeader}>
              <Ionicons name="locate" size={16} color="#FFFFFF" />
              <Text style={styles.userRankingHeaderText}>Your Ranking</Text>
            </View>
            
            <View style={styles.userRankingMain}>
              <View style={styles.rankBubbleContainer}>
                <View style={styles.rankBubble}>
                  <AnimatedNumbers
                    includeComma
                    animateToNumber={userRanking.rank}
                    fontStyle={styles.rankBubbleText}
                  />
                </View>
                <Text style={styles.rankBubbleLabel}>Rank</Text>
              </View>
              
              <View style={styles.userRankingDivider} />
              
              <View style={styles.userRankingStats}>
                <View style={styles.userRankingStat}>
                  <AnimatedNumbers
                    includeComma
                    animateToNumber={userRanking.level}
                    fontStyle={styles.userRankingStatValue}
                  />
                  <Text style={styles.userRankingStatLabel}>Level</Text>
                </View>
                
                <View style={styles.userRankingStat}>
                  <AnimatedNumbers
                    includeComma
                    animateToNumber={userRanking.xp}
                    fontStyle={styles.userRankingStatValue}
                  />
                  <Text style={styles.userRankingStatLabel}>XP</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.scrollToMeButton}
              onPress={scrollToUser}
            >
              <Text style={styles.scrollToMeText}>Scroll to My Position</Text>
              <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Card>
      </Animated.View>
    );
  };
  
  // Render each leaderboard item
  const renderRankItem = ({ item, index }) => {
    const isCurrentUser = item.username === username;
    const isTop10 = item.rank <= 10;
    const medal = getMedalIcon(item.rank);
    
    return (
      <Animated.View
        entering={FadeIn.delay(100 + (index % 10) * 50).duration(300)}
        layout={Layout.springify()}
      >
        <Card
          style={[
            styles.rankItemCard,
            isCurrentUser && { borderColor: theme.primary, borderWidth: 1.5 }
          ]}
          elevation={isCurrentUser ? 6 : 2}
          gradient={isCurrentUser ? 'primary' : false}
          gradientColors={isCurrentUser ? [theme.primary + '30', theme.primary + '10'] : null}
        >
          <TouchableOpacity
            style={styles.rankItemContent}
            activeOpacity={0.7}
            disabled={true} // Enable if you want to add click behavior
          >
            {/* Rank number */}
            <View 
              style={[
                styles.rankCol,
                isCurrentUser && { backgroundColor: 'rgba(255,255,255,0.1)' }
              ]}
            >
              {isTop10 ? (
                <LinearGradient
                  colors={
                    item.rank === 1 
                      ? ['#FFD700', '#FFC000'] 
                      : item.rank === 2 
                        ? ['#E0E0E0', '#C0C0C0'] 
                        : item.rank === 3 
                          ? ['#CD7F32', '#B06500']
                          : [theme.surfaceAlt, theme.surface]
                  }
                  style={styles.topRankBadge}
                >
                  <Text 
                    style={[
                      styles.topRankText,
                      item.rank > 3 && { color: theme.text }
                    ]}
                  >
                    {item.rank}
                  </Text>
                </LinearGradient>
              ) : (
                <Text 
                  style={[
                    styles.rankText,
                    isCurrentUser && { color: '#FFFFFF' }
                  ]}
                >
                  {item.rank}
                </Text>
              )}
            </View>
            
            {/* User avatar */}
            <View style={styles.avatarCol}>
              {item.avatarUrl ? (
                <Image 
                  source={{ uri: item.avatarUrl }}
                  style={styles.avatarImage}
                  defaultSource={require('../../assets/default-avatar.png')}
                />
              ) : (
                <View 
                  style={[
                    styles.placeholderAvatar,
                    isCurrentUser && { backgroundColor: 'rgba(255,255,255,0.2)' }
                  ]}
                >
                  <Text 
                    style={[
                      styles.avatarInitial,
                      isCurrentUser && { color: '#FFFFFF' }
                    ]}
                  >
                    {item.username?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Username */}
            <View style={styles.usernameCol}>
              <Text 
                style={[
                  styles.username,
                  isCurrentUser && styles.currentUsername
                ]}
                numberOfLines={1}
              >
                {item.username}
                {isCurrentUser && <Text style={styles.youText}> (You)</Text>}
              </Text>
            </View>
            
            {/* Stats */}
            <View style={styles.statsCol}>
              <View style={styles.statItem}>
                <Text 
                  style={[
                    styles.statValue,
                    isCurrentUser && { color: '#FFFFFF', fontWeight: 'bold' }
                  ]}
                >
                  {item.level}
                </Text>
                <Text 
                  style={[
                    styles.statLabel,
                    isCurrentUser && { color: 'rgba(255,255,255,0.7)' }
                  ]}
                >
                  LVL
                </Text>
              </View>
            </View>
            
            <View style={styles.xpCol}>
              <Text 
                style={[
                  styles.xpValue,
                  isCurrentUser && { color: '#FFFFFF', fontWeight: 'bold' }
                ]}
              >
                {formatNumber(item.xp)}
              </Text>
              <Text 
                style={[
                  styles.xpLabel,
                  isCurrentUser && { color: 'rgba(255,255,255,0.7)' }
                ]}
              >
                XP
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
      </Animated.View>
    );
  };
  
  // Render loading indicator at list bottom
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          Loading more...
        </Text>
      </View>
    );
  };
  
  // Render empty state
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={60} color={theme.textSecondary} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          {error || 'No leaderboard data available'}
        </Text>
        <Button
          variant="primary"
          label="Retry"
          onPress={onRefresh}
          style={styles.retryButton}
        />
      </View>
    );
  };
  
  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    };
  });
  
  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: contentScale.value }],
    };
  });
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Background decorative elements */}
      <View style={styles.backgroundDecorations}>
        <LinearGradient
          colors={[theme.primaryGradient[0] + '20', 'transparent']}
          style={styles.topLeftBlur}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={[theme.secondaryGradient[0] + '15', 'transparent']}
          style={styles.topRightBlur}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { borderBottomColor: theme.border },
            headerAnimatedStyle
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: theme.text }]}>Leaderboard</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Top players ranked by level and XP
            </Text>
          </View>
        </Animated.View>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading leaderboard...
            </Text>
          </View>
        ) : (
          <Animated.View 
            style={[styles.content, contentAnimatedStyle]}
            entering={FadeIn.delay(200).duration(500)}
          >
            {/* Top three podium */}
            {renderTopThree()}
            
            {/* User ranking card */}
            {renderUserRanking()}
            
            {/* Leaderboard list */}
            <View style={styles.leaderboardListContainer}>
              <View style={styles.leaderboardHeader}>
                <Text style={[styles.leaderboardTitle, { color: theme.text }]}>
                  Rankings
                </Text>
                <View style={styles.statsLegend}>
                  <Text style={[styles.statsLegendText, { color: theme.textSecondary }]}>
                    Level • XP
                  </Text>
                </View>
              </View>
              
              <FlatList
                ref={flatListRef}
                data={leaderboardData}
                renderItem={renderRankItem}
                keyExtractor={(item, index) => `${item._id || item.username}-${index}`}
                contentContainerStyle={[
                  styles.listContent,
                  { paddingHorizontal: 20 }
                ]}
                showsVerticalScrollIndicator={true}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[theme.primary]}
                    tintColor={theme.primary}
                  />
                }
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                onEndReached={loadMoreData}
                onEndReachedThreshold={0.2}
                onScrollToIndexFailed={handleScrollToIndexFailed}
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={10}
                removeClippedSubviews={Platform.OS === 'android'}
                onScroll={(e) => {
                  scrollY.value = e.nativeEvent.contentOffset.y;
                }}
                scrollEventThrottle={16}
              />
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundDecorations: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  topLeftBlur: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.7,
  },
  topRightBlur: {
    position: 'absolute',
    top: -50,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.7,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    // Header content styles
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  
  // Top Three Section
  topThreeContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  topThreeGradient: {
    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'relative',
    height: 180,
  },
  podiumItem: {
    position: 'absolute',
    alignItems: 'center',
    bottom: 0,
  },
  podiumCenter: {
    zIndex: 3,
    transform: [{ translateY: -25 }],
  },
  podiumLeft: {
    zIndex: 2,
    transform: [{ translateX: -70 }],
  },
  podiumRight: {
    zIndex: 1,
    transform: [{ translateX: 70 }],
  },
  podiumAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderWidth: 3,
    borderColor: '#3A3A3A',
  },
  podiumCenterAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: '#FFD700',
    borderWidth: 4,
  },
  podiumSideAvatar: {
    // Specific styles for side avatars
  },
  currentUserPodiumAvatar: {
    borderColor: '#6543CC',
  },
  podiumAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  podiumPlaceholderAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumAvatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankBadgeContainer: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    zIndex: 4,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  podiumUserInfo: {
    alignItems: 'center',
    width: 100,
  },
  podiumCenterInfo: {
    width: 120,
  },
  podiumUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  podiumCenterUsername: {
    fontSize: 16,
  },
  currentPodiumUsername: {
    color: '#6543CC',
  },
  youText: {
    fontWeight: 'normal',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  podiumStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 6,
    width: '100%',
  },
  podiumStat: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  podiumStatValue: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  podiumCenterStatValue: {
    fontSize: 14,
  },
  podiumStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  podiumStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 6,
  },
  crownContainer: {
    position: 'absolute',
    top: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  podiumPlatforms: {
    flexDirection: 'row',
    width: '100%',
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'relative',
  },
  platform: {
    position: 'absolute',
    bottom: 0,
    height: 30,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  firstPlace: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    width: 100,
    height: 40,
    zIndex: 3,
  },
  secondPlace: {
    backgroundColor: 'rgba(192, 192, 192, 0.3)',
    width: 80,
    height: 30,
    left: 70,
    zIndex: 2,
  },
  thirdPlace: {
    backgroundColor: 'rgba(205, 127, 50, 0.3)',
    width: 80,
    height: 20,
    right: 70,
    zIndex: 1,
  },
  
  // User ranking card
  userRankingContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  userRankingCard: {
    overflow: 'hidden',
  },
  userRankingCardContent: {
    padding: 16,
  },
  userRankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userRankingHeaderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  userRankingMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankBubbleContainer: {
    alignItems: 'center',
  },
  rankBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  rankBubbleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankBubbleLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  userRankingDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
  },
  userRankingStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  userRankingStat: {
    alignItems: 'center',
  },
  userRankingStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userRankingStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  scrollToMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  scrollToMeText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginRight: 6,
  },
  
  // Leaderboard list
  leaderboardListContainer: {
    flex: 1,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsLegend: {
    // Stats legend styles
  },
  statsLegendText: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  rankItemCard: {
    marginBottom: 10,
  },
  rankItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  rankCol: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarCol: {
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  usernameCol: {
    flex: 1,
    marginRight: 12,
  },
  username: {
    fontSize: 15,
    fontWeight: '500',
  },
  currentUsername: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statsCol: {
    marginRight: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statLabel: {
    fontSize: 10,
  },
  xpCol: {
    alignItems: 'flex-end',
    width: 50,
  },
  xpValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  xpLabel: {
    fontSize: 10,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  footerText: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 10,
  },
});

export default LeaderboardScreen;
