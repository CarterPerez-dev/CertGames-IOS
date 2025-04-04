// src/screens/tools/ResourcesScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ResourcesCategoriesComponent from '../../components/ResourcesCategoriesComponent';
import ResourceItemComponent from '../../components/ResourceItemComponent';
import ResourceRandomModal from '../../components/ResourceRandomModal';
import useResources from '../../hooks/useResources';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const ResourcesScreen = () => {
  // Navigation
  const navigation = useNavigation();
  
  // Access theme
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Animation for cards
  const [cardAnims] = useState([...Array(20)].map(() => new Animated.Value(0)));
  
  // Use our custom hook for resources management
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showCertCategories,
    filteredResources,
    loading,
    sortAlphabetically,
    randomResource,
    loadingRandom,
    loadResources,
    getRandomResource,
    toggleCertCategories,
    toggleSort,
    clearFilters,
  } = useResources('all');
  
  // Local UI state
  const [showRandomModal, setShowRandomModal] = useState(false);
  
  // Get window dimensions to adjust layout
  const { width } = useWindowDimensions();
  
  // FlatList ref for scrolling to top
  const flatListRef = useRef(null);
  
  // Animation on mount
  useEffect(() => {
    // Main animations
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
  }, []);
  
  // Handle category selection
  const handleCategorySelect = useCallback((categoryId) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    setSelectedCategory(categoryId);
  }, [setSelectedCategory]);
  
  // Handle showing random resource modal
  const handleGetRandomResource = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const resource = getRandomResource();
    if (resource) {
      setShowRandomModal(true);
    }
  }, [getRandomResource]);
  
  // Handle refresh (pull to refresh)
  const handleRefresh = useCallback(() => {
    loadResources(selectedCategory);
  }, [loadResources, selectedCategory]);
  
  // Render resource item
  const renderResourceItem = useCallback(({ item, index }) => {
    // Get animation value for this item
    const animIndex = Math.min(index, cardAnims.length - 1);
    
    return (
      <Animated.View 
        style={{
          opacity: cardAnims[animIndex],
          transform: [{ 
            translateY: cardAnims[animIndex].interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0]
            })
          }]
        }}
      >
        <ResourceItemComponent 
          resource={item} 
          listMode={true}
        />
      </Animated.View>
    );
  }, [cardAnims]);
  
  // Render empty state when no resources match the search
  const renderEmptyState = useCallback(() => (
    <View style={[styles.emptyContainer, { 
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      shadowColor: theme.colors.shadow
    }]}>
      <Ionicons name="search" size={50} color={theme.colors.primary} style={styles.emptyIcon} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
        NO RESOURCES FOUND
      </Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
        Try adjusting your search or selecting a different category
      </Text>
      <TouchableOpacity 
        style={[styles.resetButton, { backgroundColor: theme.colors.primary }]}
        onPress={clearFilters}
      >
        <Text style={[styles.resetButtonText, { color: theme.colors.buttonText, fontFamily: 'Orbitron' }]}>
          RESET FILTERS
        </Text>
      </TouchableOpacity>
    </View>
  ), [clearFilters, theme]);
  
  // Removed scroll handling functions
  
  return (
    <SafeAreaView style={[globalStyles.screen, styles.container]}>
      <StatusBar barStyle="light-content" />

      {/* Fixed back button in top left */}
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: theme.colors.surface + 'CC', borderColor: theme.colors.border }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
      </TouchableOpacity>
      
      {/* Main Header - Smaller */}
      <View style={styles.header}>
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }}
        >
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
            RESOURCES <Text style={{ color: theme.colors.primary }}>HUB</Text>
          </Text>
          <View style={styles.headerSubtitleBox}>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: 'ShareTechMono' }]}>
              CURATED LEARNING MATERIALS
            </Text>
          </View>
        </Animated.View>
      </View>
      
      {/* Search Bar */}
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY }]
        }}
      >
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceHighlight }]}>
          <Ionicons name="search" size={20} color={theme.colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { 
              color: theme.colors.text,
              fontFamily: 'ShareTechMono'
            }]}
            placeholder="SEARCH RESOURCES..."
            placeholderTextColor={theme.colors.placeholder}
            value={searchTerm}
            onChangeText={setSearchTerm}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchTerm ? (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.icon} />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>
      
      {/* Categories */}
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY }]
        }}
      >
        <ResourcesCategoriesComponent
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
          showCerts={showCertCategories}
          onToggleCerts={toggleCertCategories}
        />
      </Animated.View>
      
      {/* Action Buttons */}
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY }]
        }}
      >
        <View style={styles.actionBar}>
          <View style={[styles.resultsCount, { 
            backgroundColor: `${theme.colors.primary}20`,
            borderColor: `${theme.colors.primary}40` 
          }]}>
            <Text style={[styles.resultsText, { color: theme.colors.primary, fontFamily: 'ShareTechMono' }]}>
              {filteredResources.length} RESOURCES
            </Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { backgroundColor: theme.colors.surface },
                sortAlphabetically && { backgroundColor: theme.colors.primary }
              ]} 
              onPress={toggleSort}
            >
              <Ionicons 
                name={sortAlphabetically ? "text" : "text-outline"} 
                size={22} 
                color={sortAlphabetically ? theme.colors.buttonText : theme.colors.icon} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { backgroundColor: theme.colors.primary }
              ]} 
              onPress={handleGetRandomResource}
              disabled={loadingRandom || filteredResources.length === 0}
            >
              {loadingRandom ? (
                <ActivityIndicator size="small" color={theme.colors.buttonText} />
              ) : (
                <Ionicons name="refresh-outline" size={22} color={theme.colors.buttonText} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      
      {/* Resources List */}
      <FlatList
        ref={flatListRef}
        data={filteredResources}
        renderItem={renderResourceItem}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        contentContainerStyle={[
          styles.resourcesList,
          filteredResources.length === 0 && styles.emptyList
        ]}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.colors.divider }]} />}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
      
      {/* Removed scroll to top button */}
      
      {/* Random Resource Modal */}
      <ResourceRandomModal
        visible={showRandomModal}
        resource={randomResource}
        onClose={() => setShowRandomModal(false)}
        onGetAnother={handleGetRandomResource}
        isLoading={loadingRandom}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 15 : StatusBar.currentHeight + 5,
    paddingHorizontal: 20,
    paddingBottom: 5,
    marginTop: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 3,
    textAlign: 'center',
  },
  headerSubtitleBox: {
    alignSelf: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 15,
    zIndex: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  // Removed Section Headers styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    marginTop: 5,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 10,
    marginTop: 0,
  },
  resultsCount: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resourcesList: {
    padding: 10,
    paddingTop: 5,
    paddingBottom: 120, // Add extra space at bottom for better scrolling
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 15,
    marginTop: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 1,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  }
});

export default ResourcesScreen;
