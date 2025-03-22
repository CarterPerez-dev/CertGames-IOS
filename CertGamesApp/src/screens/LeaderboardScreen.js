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
  Animated,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchLeaderboard, fetchUserRanking } from '../api/leaderboardService';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const LeaderboardScreen = () => {
  // Access theme context
  const { theme } = useTheme();

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateY = useState(new Animated.Value(20))[0];
  const scrollY = useRef(new Animated.Value(0)).current;

  // State for leaderboard data
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [findingUser, setFindingUser] = useState(false); // New state for tracking "Find Me" operation
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [scrolledDown, setScrolledDown] = useState(false);
  
  // FlatList ref for scrolling to top
  const flatListRef = useRef(null);
  
  const pageSize = 20;
  const { username, userId } = useSelector((state) => state.user);
  
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
        // Clear existing data immediately for smoother refresh
        setLeaderboardData([]);
      } else if (pageNum > 0) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      // Add a small delay to ensure loading state is rendered
      // This prevents flickering and partial renders
      if (pageNum === 0 && !refresh) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const skip = pageNum * pageSize;
      const data = await fetchLeaderboard(skip, pageSize);
      
      // Ensure we have data with proper structure
      const processedData = (data.data || []).map((item, idx) => ({
        ...item,
        rank: skip + idx + 1, // Ensure rank is calculated
      }));
      
      // Use a small timeout to ensure state updates don't cause visual glitches
      setTimeout(() => {
        if (refresh || pageNum === 0) {
          setLeaderboardData(processedData);
        } else {
          setLeaderboardData(prevData => [...prevData, ...processedData]);
        }
        
        setHasMore(processedData.length === pageSize);
        setError(null);
        
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }, 100);
    } catch (err) {
      setError('Failed to load leaderboard. Please try again.');
      console.error('Leaderboard error:', err);
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
    // Reset animations when refreshing
    fadeAnim.setValue(0);
    translateY.setValue(20);
    
    setRefreshing(true);
    // Clear animations array to recreate them
    listItemAnimations.length = 0;
    
    loadLeaderboard(0, true)
      .finally(() => {
        // Animate back in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
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

  // Handle scroll event
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setScrolledDown(offsetY > 200);
      }
    }
  );

  // Scroll to top function
  const scrollToTop = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  // Find user rank function - IMPROVED VERSION
  const findUserRank = useCallback(async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Prevent running this function if already finding user
    if (findingUser) return;
    
    // First, check if the user is already in loaded data
    const userIndex = leaderboardData.findIndex(item => item.username === username);
    
    if (userIndex !== -1 && flatListRef.current) {
      // User is already loaded, just scroll to their position
      const adjustedIndex = userIndex >= 3 ? userIndex - 3 : 0; // Adjust for podium display
      
      // Use scrollToOffset instead of scrollToIndex for better reliability
      const itemHeight = 90; // Average item height including margin
      const headerHeight = 320; // Approximate podium + header height
      const scrollPosition = headerHeight + (adjustedIndex * itemHeight);
      
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({
            offset: scrollPosition,
            animated: true
          });
          
          // Highlight the user's row by making it flash briefly
          // This will help the user see where they are in the list
          const userItem = leaderboardData[userIndex];
          if (userItem) {
            // We'll temporarily mark the item as flashing and update it
            setLeaderboardData(prevData => {
              const newData = [...prevData];
              newData[userIndex] = { ...newData[userIndex], isFlashing: true };
              return newData;
            });
            
            // Remove the flashing effect after a moment
            setTimeout(() => {
              setLeaderboardData(prevData => {
                const newData = [...prevData];
                if (newData[userIndex]) {
                  newData[userIndex] = { ...newData[userIndex], isFlashing: false };
                }
                return newData;
              });
            }, 1500);
          }
        }
      }, 100);
      
      return;
    }
    
    // User not in loaded data, need to find their position - start loading indicator
    setFindingUser(true);
    
    try {
      // We'll do an optimized approach to find the user
      // First, let's try the first 5 pages all at once to see if user is in there
      // This helps quickly find users without having to load page by page
      
      let foundUserIndex = -1;
      let foundUserPage = -1;
      let allLoadedData = [...leaderboardData];
      
      const MAX_PAGES_TO_SEARCH = 20; // Higher limit in case user is far down
      const BATCH_SIZE = 5; // Load this many pages at once before checking
      
      // First, we'll try loading in batches to be more efficient
      for (let batchStart = page + 1; batchStart < MAX_PAGES_TO_SEARCH; batchStart += BATCH_SIZE) {
        if (foundUserIndex !== -1) break; // Exit if user was found
        
        // Load BATCH_SIZE pages at once (or less if near the limit)
        const pagesToLoad = Math.min(BATCH_SIZE, MAX_PAGES_TO_SEARCH - batchStart);
        const batchData = [];
        
        for (let i = 0; i < pagesToLoad; i++) {
          const pageNum = batchStart + i;
          const skip = pageNum * pageSize;
          
          try {
            console.log(`Loading page ${pageNum} in batch search...`);
            const response = await fetchLeaderboard(skip, pageSize);
            
            if (!response.data || response.data.length === 0) {
              // No more data available
              break;
            }
            
            const pageData = response.data.map((item, idx) => ({
              ...item,
              rank: skip + idx + 1,
            }));
            
            batchData.push(...pageData);
            
            // Check if user is in this page
            const userIdxInPage = pageData.findIndex(item => item.username === username);
            if (userIdxInPage !== -1) {
              foundUserIndex = userIdxInPage;
              foundUserPage = pageNum;
              break; // Stop loading more pages in this batch
            }
          } catch (loadError) {
            console.error(`Error loading page ${pageNum}:`, loadError);
            // Continue to next page even if one fails
          }
        }
        
        // Add batch data to our full dataset
        if (batchData.length > 0) {
          allLoadedData = [...allLoadedData, ...batchData];
          
          // Update state progressively to show user the data is loading
          setLeaderboardData(allLoadedData);
          setPage(batchStart + pagesToLoad - 1);
        }
      }
      
      // If user was found, scroll to their position after a delay to let FlatList render
      if (foundUserIndex !== -1 && foundUserPage !== -1) {
        // Wait for FlatList to finish rendering
        setTimeout(() => {
          if (!flatListRef.current) {
            setFindingUser(false);
            return;
          }
          
          // Calculate the user's position in the overall data
          const totalLoadedBeforeUserPage = foundUserPage * pageSize;
          const userPositionInList = (totalLoadedBeforeUserPage - 3) + foundUserIndex;
          
          // Use scrollToOffset for more reliable scrolling
          const itemHeight = 90; // Approximate item height with margins
          const headerHeight = 320; // Approximate podium + header height
          const scrollPosition = headerHeight + (userPositionInList * itemHeight);
          
          // First scroll to about 5 items before user position to load that area
          flatListRef.current.scrollToOffset({
            offset: Math.max(0, scrollPosition - (5 * itemHeight)),
            animated: false
          });
          
          // Give time for those items to render, then scroll to exact position
          setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToOffset({
                offset: scrollPosition,
                animated: true
              });
              
              // Highlight the row by making it flash briefly
              const userIndexInFullData = leaderboardData.findIndex(item => item.username === username);
              if (userIndexInFullData !== -1) {
                // Mark the item as flashing
                setLeaderboardData(prevData => {
                  const newData = [...prevData];
                  newData[userIndexInFullData] = { ...newData[userIndexInFullData], isFlashing: true };
                  return newData;
                });
                
                // Remove flashing after a moment
                setTimeout(() => {
                  setLeaderboardData(prevData => {
                    const newData = [...prevData];
                    if (newData[userIndexInFullData]) {
                      newData[userIndexInFullData] = { ...newData[userIndexInFullData], isFlashing: false };
                    }
                    return newData;
                  });
                }, 1500);
              }
            }
            
            setFindingUser(false);
          }, 500);
        }, 1000); // Longer delay to ensure rendering is complete
      } else {
        // User wasn't found
        Alert.alert(
          "User Not Found",
          "Couldn't locate your position on the leaderboard after searching the top rankings.",
          [{ text: "OK" }]
        );
        setFindingUser(false);
      }
    } catch (error) {
      console.error('Error finding user rank:', error);
      Alert.alert(
        "Error",
        "There was a problem finding your rank on the leaderboard.",
        [{ text: "OK" }]
      );
      setFindingUser(false);
    }
  }, [username, leaderboardData, page, pageSize, fetchLeaderboard, findingUser]);
  
  // Render top 3 podium
  const renderPodium = () => {
    // Get top 3 users
    const topThree = leaderboardData.slice(0, 3);
    
    // If we don't have at least 3 users yet, show a loading state
    if (topThree.length < 3 && loading) {
      return (
        <View style={styles.podiumContainer}>
          <View style={styles.podiumLoader}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        </View>
      );
    }
    
    // Fill with placeholders if we don't have 3 users yet
    while (topThree.length < 3) {
      topThree.push({ placeholder: true, rank: topThree.length + 1 });
    }
    
    // Position users on podium (2nd, 1st, 3rd)
    const [secondPlace, firstPlace, thirdPlace] = [topThree[1], topThree[0], topThree[2]];
    
    return (
      <View style={styles.podiumContainer}>
        
        <View style={styles.podiumStands}>
          {/* Second Place - Left */}
          <View style={styles.standContainer}>
            <PodiumUser 
              user={secondPlace} 
              position={2} 
              theme={theme} 
              currentUsername={username} 
            />
            <View style={[
              styles.standSecond, 
              { backgroundColor: theme.colors.silverBadge }
            ]}>
              <Text style={styles.standText}>2</Text>
            </View>
          </View>
          
          {/* First Place - Center */}
          <View style={[styles.standContainer, styles.standContainerFirst]}>
            <PodiumUser 
              user={firstPlace} 
              position={1} 
              theme={theme} 
              currentUsername={username} 
              isFirst={true}
            />
            <View style={[
              styles.standFirst, 
              { backgroundColor: theme.colors.goldBadge }
            ]}>
              <Text style={styles.standText}>1</Text>
            </View>
          </View>
          
          {/* Third Place - Right */}
          <View style={styles.standContainer}>
            <PodiumUser 
              user={thirdPlace} 
              position={3} 
              theme={theme} 
              currentUsername={username} 
            />
            <View style={[
              styles.standThird, 
              { backgroundColor: theme.colors.bronzeBadge }
            ]}>
              <Text style={styles.standText}>3</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  // Podium User component
  const PodiumUser = ({ user, position, theme, currentUsername, isFirst = false }) => {
    if (user.placeholder) {
      return (
        <View style={[
          styles.podiumUserContainer,
          isFirst && styles.podiumUserContainerFirst
        ]}>
          <View style={[styles.placeholderAvatar, { 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            width: isFirst ? 70 : 60,
            height: isFirst ? 70 : 60,
            borderRadius: isFirst ? 35 : 30,
          }]}>
            <Ionicons name="person" size={isFirst ? 36 : 30} color="rgba(255, 255, 255, 0.3)" />
          </View>
          <View style={styles.podiumUserInfo}>
            <Text style={[styles.podiumUsername, { 
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: isFirst ? 16 : 14
            }]}>
              Loading...
            </Text>
          </View>
        </View>
      );
    }
    
    const isCurrentUser = user.username === currentUsername;
    
    return (
      <View style={[
        styles.podiumUserContainer,
        isFirst && styles.podiumUserContainerFirst
      ]}>
        {/* User Avatar */}
        {user.avatarUrl ? (
          <Image 
            source={{ uri: user.avatarUrl }} 
            style={[styles.podiumAvatar, {
              width: isFirst ? 70 : 60,
              height: isFirst ? 70 : 60,
              borderRadius: isFirst ? 35 : 30,
              borderWidth: isCurrentUser ? 2 : 1,
              borderColor: isCurrentUser ? theme.colors.primary : 'rgba(255, 255, 255, 0.3)'
            }]}
            defaultSource={require('../../assets/default-avatar.png')}
          />
        ) : (
          <View style={[styles.placeholderAvatar, { 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: isCurrentUser ? theme.colors.primary : 'rgba(255, 255, 255, 0.2)',
            borderWidth: isCurrentUser ? 2 : 1,
            width: isFirst ? 70 : 60,
            height: isFirst ? 70 : 60,
            borderRadius: isFirst ? 35 : 30,
          }]}>
            <Text style={styles.avatarInitial}>
              {user.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        
        {/* User Info */}
        <View style={styles.podiumUserInfo}>
          <Text style={[styles.podiumUsername, { 
            color: isCurrentUser ? theme.colors.primary : theme.colors.text,
            fontWeight: isCurrentUser ? 'bold' : '600',
            fontSize: isFirst ? 16 : 14
          }]} numberOfLines={1} ellipsizeMode="tail">
            {user.username}
            {isCurrentUser && <Text style={{ color: theme.colors.primary }}> (You)</Text>}
          </Text>
          
          <Text style={[styles.podiumLevel, { 
            color: theme.colors.textSecondary,
            fontSize: isFirst ? 14 : 12
          }]}>
            Lvl {user.level} • {user.xp?.toLocaleString() || 0} XP
          </Text>
        </View>
      </View>
    );
  };
  
  // Animated values for list items - created once and reused
  const [listItemAnimations] = useState([]);
  
  // Prepare animations when data changes
  useEffect(() => {
    // Only create animations for new items
    const startIndex = listItemAnimations.length;
    const itemsToAnimate = leaderboardData.slice(3).slice(startIndex);
    
    // Create animations for new items
    itemsToAnimate.forEach((_, idx) => {
      const itemOpacity = new Animated.Value(0);
      const itemTranslateY = new Animated.Value(10);
      listItemAnimations.push({ opacity: itemOpacity, translateY: itemTranslateY });
      
      // Start animation with staggered delay
      Animated.parallel([
        Animated.timing(itemOpacity, {
          toValue: 1,
          duration: 250,
          delay: Math.min(idx * 20, 500), // Cap the delay to prevent too long animations
          useNativeDriver: true,
        }),
        Animated.timing(itemTranslateY, {
          toValue: 0,
          duration: 250,
          delay: Math.min(idx * 20, 500),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [leaderboardData.length]);
  
  // Render rank item (for ranks 4+)
  const renderRankItem = ({ item, index }) => {
    // Top 3 handled by podium, start with rank 4
    const actualIndex = index + 3; 
    const isCurrentUser = item.username === username;
    const isTopTen = actualIndex < 10; // Ranks 4-10
    const isFlashing = item.isFlashing; // Check if this item should be flashing (for Find Me feature)
    
    // Background gradient based on rank and status
    let gradientColors;
    
    if (isFlashing) {
      // Alternating bright flash colors for "Find Me" feature
      gradientColors = ['#FFFFFF', theme.colors.primary];
    } else if (isCurrentUser) {
      gradientColors = [theme.colors.primary + '80', theme.colors.primary + '40'];
    } else if (isTopTen) {
      gradientColors = ['rgba(0, 156, 255, 0.2)', 'rgba(0, 156, 255, 0.05)'];
    } else {
      gradientColors = [theme.colors.surface, theme.colors.surface];
    }
    
    // Get or create animation values for this item
    const animation = listItemAnimations[index] || { 
      opacity: new Animated.Value(1), 
      translateY: new Animated.Value(0) 
    };
    
    return (
      <Animated.View 
        style={{
          opacity: animation.opacity,
          transform: [{ translateY: animation.translateY }],
        }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.rankItem,
            isCurrentUser && styles.currentUserItem,
            isFlashing && { borderWidth: 2, borderColor: '#FFFFFF' }
          ]}
        >
          <View style={styles.rankNumberContainer}>
            <Text style={[
              styles.rankNumber, 
              isTopTen ? { color: '#00BFFF' } : { color: theme.colors.textSecondary },
              isFlashing && { color: theme.colors.primary }
            ]}>
              {item.rank || (actualIndex + 1)}
            </Text>
          </View>
          
          {/* Avatar */}
          {item.avatarUrl ? (
            <Image 
              source={{ uri: item.avatarUrl }} 
              style={[
                styles.avatarImage,
                isCurrentUser && { borderColor: theme.colors.primary },
                isFlashing && { borderColor: '#FFFFFF', borderWidth: 2 }
              ]}
              defaultSource={require('../../assets/default-avatar.png')}
            />
          ) : (
            <View style={[
              styles.placeholderAvatar,
              isCurrentUser && { borderColor: theme.colors.primary },
              isFlashing && { borderColor: '#FFFFFF', borderWidth: 2 }
            ]}>
              <Text style={styles.avatarInitial}>
                {item.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          
          <View style={styles.userInfoContainer}>
            <Text style={[
              styles.username,
              isCurrentUser && styles.currentUsername,
              isFlashing && { color: '#000000', fontWeight: 'bold' }
            ]}>
              {item.username}
              {isCurrentUser && (
                <Text style={[styles.youText, isFlashing && { color: '#000000' }]}> (You)</Text>
              )}
            </Text>
          </View>
          
          <View style={[
            styles.statsContainer,
            isFlashing && { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
          ]}>
            <View style={styles.levelContainer}>
              <Text style={[styles.levelLabel, isFlashing && { color: '#000000' }]}>Level</Text>
              <Text style={[
                styles.levelValue, 
                isCurrentUser && styles.currentUserStats,
                isFlashing && { color: '#000000', fontWeight: 'bold' }
              ]}>
                {item.level}
              </Text>
            </View>
            
            <View style={styles.xpContainer}>
              <Text style={[styles.xpLabel, isFlashing && { color: '#000000' }]}>XP</Text>
              <Text style={[
                styles.xpValue, 
                isCurrentUser && styles.currentUserStats,
                isFlashing && { color: '#000000', fontWeight: 'bold' }
              ]}>
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
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Loading more...</Text>
      </View>
    );
  };
  
  // Render empty state
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={60} color={theme.colors.primary} />
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {error || 'No leaderboard data available'}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} 
          onPress={onRefresh}
        >
          <Text style={[styles.retryText, { color: theme.colors.buttonText }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // List header component - contains podium
  const renderListHeader = () => {
    return (
      <View>
        {renderPodium()}
        <View style={styles.listHeaderSeparator}>
          <Text style={[styles.listHeaderText, { color: theme.colors.textSecondary }]}>
            Leaderboard Rankings
          </Text>
          <View style={[styles.listHeaderLine, { backgroundColor: theme.colors.divider }]} />
        </View>
      </View>
    );
  };
  
  // Prevent list render until loading is done
  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.mainLoadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading leaderboard...
          </Text>
        </View>
      );
    }
    
    // Only render FlatList after data is loaded
    return (
      <Animated.View 
        style={[
          styles.listContainer,
          { opacity: fadeAnim }
        ]}
      >
        <FlatList
          ref={flatListRef}
          data={leaderboardData.slice(3)} // Skip top 3 since they're in the podium
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
              progressViewOffset={20}
            />
          }
          ListEmptyComponent={renderEmpty}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderFooter}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.2}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          removeClippedSubviews={false} // Changed to false to prevent rendering issues
          initialNumToRender={20} // Increased for better initial render
          maxToRenderPerBatch={10} // Increased slightly
          windowSize={21} // Increased for better offscreen rendering
          updateCellsBatchingPeriod={100} // Increased to batch updates better
          maintainVisibleContentPosition={{ // Added to maintain position during updates
            minIndexForVisible: 0,
          }}
          onScrollToIndexFailed={(info) => {
            // Fallback handler for scroll failures
            console.log('Scroll to index failed:', info);
            // Wait a bit and try scrolling to an offset instead
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToOffset({
                  offset: info.index * 90, // Approximate item height
                  animated: true
                });
              }
            });
          }}
          bounces={true}
          bouncesZoom={false}
          alwaysBounceVertical={true}
          overScrollMode="never"
          scrollsToTop={true}
          showsHorizontalScrollIndicator={false}
          disableIntervalMomentum={true}
        />
      </Animated.View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Title Bar */}
      <View style={[styles.titleBar, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.titleText, { color: theme.colors.text }]}>Leaderboard</Text>
      </View>
      
      {/* Main Content */}
      {renderContent()}
      
      {/* Back to Top Button */}
      {scrolledDown && (
        <TouchableOpacity 
          style={[styles.backToTopButton, { backgroundColor: '#FFFFFF' }]}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={20} color='#000000' />
        </TouchableOpacity>
      )}
      
      {/* Find My Rank Button */}
      <TouchableOpacity 
        style={[styles.findRankButton, { 
          backgroundColor: findingUser ? theme.colors.primary + '80' : theme.colors.surface,
          borderColor: theme.colors.border
        }]}
        onPress={findUserRank}
        activeOpacity={0.8}
        disabled={findingUser || loading}
      >
        {findingUser ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={[styles.findRankText, { color: '#FFFFFF' }]}>Finding...</Text>
          </>
        ) : (
          <>
            <Ionicons name="locate" size={16} color='#FFFFFF' />
            <Text style={[styles.findRankText, { color: '#FFFFFF' }]}>Find Me</Text>
          </>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleBar: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, 
  },
  
  // Podium styles
  podiumContainer: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 4,
    paddingTop: 40, 
  },
  podiumLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  podiumStands: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 200, // Increased height to ensure everything fits
  },
  standContainer: {
    alignItems: 'center',
    width: width / 3 - 16,
  },
  standContainerFirst: {
    marginTop: -20, // Reduced the negative margin to lower the 1st place position
  },
  standFirst: {
    width: 60,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  standSecond: {
    width: 50,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  standThird: {
    width: 50,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  standText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
  },
  podiumUserContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  podiumUserContainerFirst: {
    marginBottom: 20,
  },
  podiumAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 6,
  },
  trophyIconContainer: {
    position: 'absolute',
    top: -5,
    right: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  podiumUserInfo: {
    alignItems: 'center',
  },
  podiumUsername: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  podiumLevel: {
    textAlign: 'center',
  },
  
  // List header styles
  listHeaderSeparator: {
    marginTop: 20, // Increased spacing
    marginBottom: 16,
    alignItems: 'center',
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  listHeaderLine: {
    height: 1,
    width: '80%',
  },
  
  // Rank item styles
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
  currentUserItem: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rankNumberContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 12,
    borderWidth: 1,
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
    borderWidth: 1,
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
  
  // Loading states
  mainLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
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
    fontWeight: 'bold',
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
  
  // Utility buttons
  backToTopButton: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  findRankButton: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  findRankText: {
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default LeaderboardScreen;
