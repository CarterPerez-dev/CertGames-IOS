// src/screens/profile/AchievementsScreen.js
import React, { useState } from 'react';
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
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAchievements from '../../hooks/useAchievements';
import AchievementItem from '../../components/AchievementItem';

const AchievementsScreen = () => {
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
  
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const { total, unlocked, completionPercentage } = getAchievementStats();
  
  // Handle achievement item press
  const handleAchievementPress = (achievement) => {
    setSelectedAchievement(achievement);
    setModalVisible(true);
  };
  
  // Render category tabs
  const renderCategoryTabs = () => {
    return (
      <ScrollableTabs
        tabs={Object.entries(categories).map(([id, label]) => ({ id, label }))}
        activeTab={activeCategory}
        onTabChange={handleCategoryChange}
      />
    );
  };
  
  // Render empty state
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="trophy-outline" size={60} color="#AAAAAA" />
        <Text style={styles.emptyText}>
          {error || 'No achievements found in this category'}
        </Text>
        
        {error && (
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>{selectedAchievement.title}</Text>
            
            <View style={styles.modalContent}>
              <View style={styles.modalIconContainer}>
                <Ionicons 
                  name={isUnlocked ? "trophy" : "lock-closed"} 
                  size={40} 
                  color={isUnlocked ? "#FFD700" : "#AAAAAA"} 
                />
              </View>
              
              <Text style={styles.modalDescription}>
                {selectedAchievement.description}
              </Text>
              
              <View style={styles.modalStatus}>
                <Text style={[
                  styles.modalStatusText,
                  isUnlocked ? styles.unlockedText : styles.lockedText
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
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.subtitle}>
          Track your progress and unlock achievements
        </Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={28} color="#6543CC" />
          <Text style={styles.statValue}>{unlocked} / {total}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="ribbon" size={28} color="#FF4C8B" />
          <Text style={styles.statValue}>{completionPercentage}%</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>
      
      <View style={styles.tabsContainer}>
        {renderCategoryTabs()}
      </View>
      
      <FlatList
        data={filteredAchievements}
        renderItem={({ item }) => (
          <AchievementItem
            achievement={item}
            isUnlocked={isAchievementUnlocked(item.achievementId)}
            onPress={handleAchievementPress}
          />
        )}
        keyExtractor={(item) => item.achievementId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6543CC']}
            tintColor="#6543CC"
          />
        }
      />
      
      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6543CC" />
        </View>
      )}
      
      {renderModal()}
    </SafeAreaView>
  );
};

// ScrollableTabs component
const ScrollableTabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <FlatList
      data={tabs}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.tabsScrollContainer}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === item.id && styles.activeTabButton
          ]}
          onPress={() => onTabChange(item.id)}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === item.id && styles.activeTabButtonText
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  statCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: '45%',
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
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 4,
  },
  tabsContainer: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 10,
  },
  tabsScrollContainer: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#2A2A2A',
  },
  activeTabButton: {
    backgroundColor: '#6543CC',
  },
  tabButtonText: {
    color: '#AAAAAA',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
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
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContent: {
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  modalStatusText: {
    fontWeight: 'bold',
  },
  unlockedText: {
    color: '#2ebb77',
  },
  lockedText: {
    color: '#AAAAAA',
  },
});

export default AchievementsScreen;
