// src/screens/profile/AchievementsScreen.js
import React, { useState, useEffect } from 'react';
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
  Modal,
  Dimensions,
  StatusBar,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import useAchievements from '../../hooks/useAchievements';
import AchievementItem from '../../components/AchievementItem';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const AchievementsScreen = ({ navigation }) => {
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
  // Get achievements data using hook
  const {
    allAchievements,
    filteredAchievements,
    loading,
    refreshing,
    activeCategory,
    error,
    categories,
    handleCategoryChange,
    handleRefresh,
    isAchievementUnlocked,
    getAchievementStats
  } = useAchievements();
  
  // Local state
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortOrder, setSortOrder] = useState('default'); // 'default', 'alphabetical', 'locked'
  
  // Animation values
  const headerHeight = new Animated.Value(1);
  
  // Stats about achievements
  const { total, unlocked, completionPercentage } = getAchievementStats();
  
  // Effect to animate header on scroll
  useEffect(() => {
    const listenerId = navigation.addListener('focus', () => {
      // Reset header height when screen comes into focus
      Animated.timing(headerHeight, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
    
    return () => navigation.removeListener('focus', listenerId);
  }, [navigation]);
  
  // Handle scroll to animate header
  const handleScroll = (event) => {
    const scrollOffset = event.nativeEvent.contentOffset.y;
    const newHeight = scrollOffset > 50 ? 0 : 1;
    
    Animated.spring(headerHeight, {
      toValue: newHeight,
      friction: 10,
      useNativeDriver: false,
    }).start();
  };
  
  // Get sorted achievements
  const getSortedAchievements = () => {
    if (sortOrder === 'default') {
      return filteredAchievements;
    } else if (sortOrder === 'alphabetical') {
      return [...filteredAchievements].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === 'locked') {
      return [...filteredAchievements].sort((a, b) => {
        const aUnlocked = isAchievementUnlocked(a.achievementId);
        const bUnlocked = isAchievementUnlocked(b.achievementId);
        
        if (aUnlocked && !bUnlocked) return 1;
        if (!aUnlocked && bUnlocked) return -1;
        return 0;
      });
    }
    return filteredAchievements;
  };
  
  // Toggle sort order
  const toggleSortOrder = () => {
    const orders = ['default', 'alphabetical', 'locked'];
    const currentIndex = orders.indexOf(sortOrder);
    const nextIndex = (currentIndex + 1) % orders.length;
    setSortOrder(orders[nextIndex]);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Handle achievement item press
  const handleAchievementPress = (achievement) => {
    setSelectedAchievement(achievement);
    setModalVisible(true);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };
  
  // Get icon for sort order
  const getSortIcon = () => {
    switch (sortOrder) {
      case 'alphabetical':
        return 'text';
      case 'locked':
        return 'lock-closed';
      default:
        return 'swap-vertical';
    }
  };
  
  // Get color for progress bar
  const getProgressColor = (percentage) => {
    if (percentage < 30) return theme.colors.error;
    if (percentage < 70) return theme.colors.warning;
    return theme.colors.success;
  };
  
  // Render category tabs
  const CategoryTabs = () => {
    return (
      <FlatList
        data={Object.entries(categories).map(([id, label]) => ({ id, label }))}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.tabsScrollContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.tabButton,
              { backgroundColor: theme.colors.surface },
              activeCategory === item.id && { 
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primaryGradient[1],
                borderWidth: 1,
              }
            ]}
            onPress={() => handleCategoryChange(item.id)}
          >
            <Text style={[
              styles.tabButtonText,
              { color: theme.colors.textMuted },
              activeCategory === item.id && { color: theme.colors.textInverse }
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    );
  };
  
  // Render empty state
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="trophy-outline" size={60} color={theme.colors.textMuted} />
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
          {error || 'No achievements found in this category'}
        </Text>
        
        {error && (
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} 
            onPress={handleRefresh}
          >
            <Text style={[styles.retryText, { color: theme.colors.textInverse }]}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // Render achievement list item
  const renderAchievementItem = ({ item }) => (
    <AchievementItem
      achievement={item}
      isUnlocked={isAchievementUnlocked(item.achievementId)}
      onPress={handleAchievementPress}
      compact={viewMode === 'list'}
    />
  );
  
  // Render achievement details modal
  const renderModal = () => {
    if (!selectedAchievement) return null;
    
    const isUnlocked = isAchievementUnlocked(selectedAchievement.achievementId);
    
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            
            <LinearGradient
              colors={theme.colors.primaryGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.modalHeader}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {selectedAchievement.title}
              </Text>
            </LinearGradient>
            
            <View style={styles.modalContent}>
              <View style={[
                styles.modalIconContainer, 
                { backgroundColor: isUnlocked ? theme.colors.primary + '20' : theme.colors.background }
              ]}>
                <Ionicons 
                  name={isUnlocked ? "trophy" : "lock-closed"} 
                  size={40} 
                  color={isUnlocked ? theme.colors.goldBadge : theme.colors.textMuted} 
                />
              </View>
              
              <Text style={[styles.modalDescription, { color: theme.colors.text }]}>
                {selectedAchievement.description}
              </Text>
              
              <View style={[
                styles.modalStatus,
                { 
                  backgroundColor: isUnlocked 
                    ? theme.colors.success + '20' 
                    : theme.colors.textMuted + '20'
                }
              ]}>
                <Text style={[
                  styles.modalStatusText,
                  isUnlocked 
                    ? { color: theme.colors.success } 
                    : { color: theme.colors.textMuted }
                ]}>
                  {isUnlocked ? "Achievement Unlocked" : "Achievement Locked"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Calculate header height for animation
  const animatedHeaderHeight = headerHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });
  
  return (
    <SafeAreaView style={[globalStyles.screen, styles.container]}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[
        styles.header,
        { height: animatedHeaderHeight, overflow: 'hidden' }
      ]}>
        <LinearGradient
          colors={theme.colors.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Achievements</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Track your progress and unlock achievements
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={theme.colors.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, { borderColor: theme.colors.border }]}
        >
          <Ionicons name="trophy" size={28} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{unlocked} / {total}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Achievements</Text>
        </LinearGradient>
        
        <LinearGradient
          colors={theme.colors.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statCard, { borderColor: theme.colors.border }]}
        >
          <Ionicons name="ribbon" size={28} color={getProgressColor(completionPercentage)} />
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{completionPercentage}%</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Completed</Text>
          
          {/* Progress bar */}
          <View style={[styles.progressBar, { backgroundColor: theme.colors.progressTrack }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${completionPercentage}%`,
                  backgroundColor: getProgressColor(completionPercentage) 
                }
              ]} 
            />
          </View>
        </LinearGradient>
      </View>
      
      {/* Action bar */}
      <View style={[styles.actionBar, { backgroundColor: theme.colors.surfaceHighlight }]}>
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.colors.surface }]}
            onPress={toggleSortOrder}
          >
            <Ionicons name={getSortIcon()} size={18} color={theme.colors.icon} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.colors.surface }]}
            onPress={toggleViewMode}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'list' : 'grid'} 
              size={18} 
              color={theme.colors.icon} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.resultsContainer, { borderColor: theme.colors.border }]}>
          <Text style={[styles.resultsText, { color: theme.colors.textSecondary }]}>
            {filteredAchievements.length} achievements
          </Text>
        </View>
      </View>
      
      {/* Category Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.background }]}>
        <CategoryTabs />
      </View>
      
      {/* Achievements List */}
      <FlatList
        data={getSortedAchievements()}
        renderItem={renderAchievementItem}
        keyExtractor={(item) => item.achievementId}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 100 }
        ]}
        numColumns={viewMode === 'grid' && !isTablet ? 1 : (viewMode === 'grid' ? 2 : 1)}
        key={viewMode} // Force re-render when changing view mode
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
      
      {/* Loading overlay */}
      {loading && !refreshing && (
        <View style={[
          styles.loadingOverlay, 
          { backgroundColor: theme.colors.overlay }
        ]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
      
      {/* Achievement details modal */}
      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  headerContent: {
    marginTop: 4,
  },
  // Removed back button styles
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 0,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
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
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  resultsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabsContainer: {
    paddingVertical: 6,
  },
  tabsScrollContainer: {
    paddingHorizontal: 12,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabButtonText: {
    fontWeight: '500',
  },
  listContent: {
    padding: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    margin: 20,
    borderRadius: 16,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContent: {
    alignItems: 'center',
    padding: 20,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalStatus: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  modalStatusText: {
    fontWeight: 'bold',
  },
});

export default AchievementsScreen;
