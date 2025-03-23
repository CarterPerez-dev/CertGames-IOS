// src/screens/profile/AchievementsScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import useAchievements from '../../hooks/useAchievements';
import useUserData from '../../hooks/useUserData';
import AchievementItem from '../../components/AchievementItem';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';

const { width, height } = Dimensions.get('window');

const AchievementsScreen = ({ navigation }) => {
  // Theme integration
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const [cardAnims] = useState([...Array(50)].map(() => new Animated.Value(0)));
  
  // Use the enhanced hooks for real-time data
  const { achievements: userAchievements } = useUserData();
  
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
  const [viewMode, setViewMode] = useState('list'); // Default to list view now
  const [sortOrder, setSortOrder] = useState('default'); // 'default', 'alphabetical', 'locked'
  const [previousAchievements, setPreviousAchievements] = useState([]);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState([]);
  
  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Force refresh when screen gains focus
      handleRefresh();
      
      // Reset animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true
        })
      ]).start();
      
      // Staggered card animations
      cardAnims.forEach((anim, i) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          delay: 100 + (i * 70),
          useNativeDriver: true
        }).start();
      });
    }, [navigation])
  );
  
  // Track achievement changes to detect newly unlocked ones
  useEffect(() => {
    if (previousAchievements.length > 0 && userAchievements) {
      // Find achievements that weren't in the previous list
      const newAchievements = userAchievements.filter(
        achievementId => !previousAchievements.includes(achievementId)
      );
      
      if (newAchievements.length > 0) {
        // Found newly unlocked achievements
        setNewlyUnlockedAchievements(newAchievements);
        
        // Apply haptic feedback for new achievements
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Animate cards for newly unlocked achievements
        setTimeout(() => {
          setNewlyUnlockedAchievements([]);
        }, 3000); // Clear after 3 seconds
      }
    }
    
    // Update previous achievements
    if (userAchievements) {
      setPreviousAchievements(userAchievements);
    }
  }, [userAchievements, previousAchievements]);
  
  // Stats about achievements
  const { total, unlocked, completionPercentage } = getAchievementStats();
  
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
  
  // Toggle sort order with haptic feedback
  const toggleSortOrder = () => {
    const orders = ['default', 'alphabetical', 'locked'];
    const currentIndex = orders.indexOf(sortOrder);
    const nextIndex = (currentIndex + 1) % orders.length;
    setSortOrder(orders[nextIndex]);
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  // Toggle view mode with haptic feedback
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
              }
            ]}
            onPress={() => handleCategoryChange(item.id)}
          >
            <Text style={[
              styles.tabButtonText,
              { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' },
              activeCategory === item.id && { color: theme.colors.buttonText }
            ]}>
              {item.label.toUpperCase()}
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
        <Text style={[styles.emptyText, { color: theme.colors.textMuted, fontFamily: 'ShareTechMono' }]}>
          {error || 'NO ACHIEVEMENTS FOUND IN THIS CATEGORY'}
        </Text>
        
        {error && (
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} 
            onPress={handleRefresh}
          >
            <Text style={[styles.retryText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>
              RETRY
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // Render achievement list item with animations
  const renderAchievementItem = ({ item, index }) => {
    const isUnlocked = isAchievementUnlocked(item.achievementId);
    const animIndex = Math.min(index, cardAnims.length - 1);
    const isNewlyUnlocked = newlyUnlockedAchievements.includes(item.achievementId);
    
    // Special animation for newly unlocked achievements
    const animStyle = isNewlyUnlocked ? {
      opacity: cardAnims[animIndex],
      transform: [{
        scale: cardAnims[animIndex].interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.9, 1.1, 1]
        })
      }]
    } : {
      opacity: cardAnims[animIndex],
      transform: [{
        translateY: cardAnims[animIndex].interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0]
        })
      }]
    };
    
    return (
      <Animated.View style={animStyle}>
        <AchievementItem
          achievement={item}
          isUnlocked={isUnlocked}
          onPress={handleAchievementPress}
          compact={true} // Always use compact mode for a vertical list
          isNewlyUnlocked={isNewlyUnlocked}
        />
      </Animated.View>
    );
  };
  
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
        <TouchableOpacity 
          style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]} 
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            
            <LinearGradient
              colors={isUnlocked ? theme.colors.primaryGradient : [theme.colors.textMuted + '80', theme.colors.textMuted]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.modalHeader}
            >
              <Text style={[styles.modalTitle, { color: theme.colors.buttonText, fontFamily: 'Orbitron-Bold' }]}>
                {selectedAchievement.title.toUpperCase()}
              </Text>
            </LinearGradient>
            
            <View style={styles.modalContent}>
              <View style={[
                styles.modalIconContainer, 
                { 
                  backgroundColor: isUnlocked ? theme.colors.primary + '20' : theme.colors.background,
                  borderColor: isUnlocked ? theme.colors.primary + '40' : theme.colors.border,
                }
              ]}>
                <Ionicons 
                  name={isUnlocked ? "trophy" : "lock-closed"} 
                  size={40} 
                  color={isUnlocked ? theme.colors.goldBadge : theme.colors.textMuted} 
                />
              </View>
              
              <Text style={[styles.modalDescription, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
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
                  { 
                    color: isUnlocked ? theme.colors.success : theme.colors.textMuted,
                    fontFamily: 'ShareTechMono'
                  }
                ]}>
                  {isUnlocked ? "ACHIEVEMENT UNLOCKED" : "ACHIEVEMENT LOCKED"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };
  
  // Main screen content
  return (
    <SafeAreaView style={[globalStyles.screen, styles.container]}>
      <StatusBar barStyle="light-content" />
      
      {/* Main Content */}
      <FlatList
        data={getSortedAchievements()}
        renderItem={renderAchievementItem}
        keyExtractor={(item) => item.achievementId}
        contentContainerStyle={styles.listContent}
        numColumns={1} // Always use a single column for vertical list
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }}
          >
            {/* Achievement Stats Cards */}
            <View style={styles.statsContainer}>
              <LinearGradient
                colors={[theme.colors.primary + '40', theme.colors.primary + '20']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.statCard, { borderColor: theme.colors.border }]}
              >
                <Ionicons name="trophy" size={28} color={theme.colors.primary} />
                <Text style={[styles.statValue, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  {unlocked} / {total}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  ACHIEVEMENTS
                </Text>
              </LinearGradient>
              
              <LinearGradient
                colors={[theme.colors.primary + '40', theme.colors.primary + '20']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.statCard, { borderColor: theme.colors.border }]}
              >
                <Ionicons name="ribbon" size={28} color={getProgressColor(completionPercentage)} />
                <Text style={[styles.statValue, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  {completionPercentage}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  COMPLETED
                </Text>
                
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
            
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionTitleBg, { backgroundColor: theme.colors.primary + '20' }]}>
                <LinearGradient
                  colors={['transparent', theme.colors.primary + '40', 'transparent']}
                  start={{x: 0, y: 0.5}}
                  end={{x: 1, y: 0.5}}
                  style={styles.sectionTitleGradient}
                />
                <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
                  ACHIEVEMENT DATABASE
                </Text>
              </View>
              
              <View style={[styles.sectionIcon, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="trophy" size={22} color={theme.colors.buttonText} />
              </View>
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
              </View>
              
              <View style={[styles.resultsContainer, { borderColor: theme.colors.border }]}>
                <Text style={[styles.resultsText, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
                  {filteredAchievements.length} ITEMS
                </Text>
              </View>
            </View>
            
            {/* Category Tabs */}
            <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surfaceHighlight }]}>
              <CategoryTabs />
            </View>
          </Animated.View>
        }
      />
      
      {/* Loading overlay */}
      {loading && !refreshing && (
        <View style={[
          styles.loadingOverlay, 
          { backgroundColor: theme.colors.overlay }
        ]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text, fontFamily: 'ShareTechMono' }]}>
            LOADING ACHIEVEMENTS...
          </Text>
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
  
  // Content
  listContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
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
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitleBg: {
    flex: 1,
    borderRadius: 6,
    padding: 8,
    marginRight: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  sectionTitleGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Action Bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
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
    letterSpacing: 0.5,
  },
  
  // Category Tabs
  tabsContainer: {
    paddingVertical: 10,
    marginBottom: 16,
    borderRadius: 12,
  },
  tabsScrollContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  
  // Empty State
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
    marginTop: 16,
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  
  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
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
    borderWidth: 1,
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
    letterSpacing: 0.5,
  },
});

export default AchievementsScreen;
