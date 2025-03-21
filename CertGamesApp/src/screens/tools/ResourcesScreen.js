// src/screens/tools/ResourcesScreen.js
import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ResourcesCategoriesComponent from '../../components/ResourcesCategoriesComponent';
import ResourceItemComponent from '../../components/ResourceItemComponent';
import ResourceRandomModal from '../../components/ResourceRandomModal';
import useResources from '../../hooks/useResources';
import { useTheme } from '../../context/ThemeContext';
import { createGlobalStyles } from '../../styles/globalStyles';

const ResourcesScreen = () => {
  // Access theme
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showRandomModal, setShowRandomModal] = useState(false);
  
  // Get window dimensions to adjust layout
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 768;
  
  // Handle category selection
  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
  }, [setSelectedCategory]);
  
  // Toggle view mode (grid/list)
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => (prev === 'grid' ? 'list' : 'grid'));
  }, []);
  
  // Handle showing random resource modal
  const handleGetRandomResource = useCallback(() => {
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
  const renderResourceItem = useCallback(({ item }) => (
    <ResourceItemComponent 
      resource={item} 
      listMode={viewMode === 'list'}
    />
  ), [viewMode]);
  
  // Render empty state when no resources match the search
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search" size={50} color={theme.colors.primary} style={styles.emptyIcon} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No resources found</Text>
      <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
        Try adjusting your search or selecting a different category
      </Text>
      <TouchableOpacity 
        style={[styles.resetButton, { backgroundColor: theme.colors.primary }]}
        onPress={clearFilters}
      >
        <Text style={[styles.resetButtonText, { color: theme.colors.textInverse }]}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  ), [clearFilters, theme]);
  
  return (
    <SafeAreaView style={[globalStyles.screen, styles.container]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with gradient */}
      <LinearGradient
        colors={theme.colors.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Resources Hub</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Curated learning materials for certification success
          </Text>
        </View>
      </LinearGradient>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceHighlight }]}>
        <Ionicons name="search" size={20} color={theme.colors.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search resources..."
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
      
      {/* Categories */}
      <ResourcesCategoriesComponent
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        showCerts={showCertCategories}
        onToggleCerts={toggleCertCategories}
      />
      
      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <View style={[styles.resultsCount, { 
          backgroundColor: `${theme.colors.primary}20`,
          borderColor: `${theme.colors.primary}40` 
        }]}>
          <Text style={[styles.resultsText, { color: theme.colors.primary }]}>
            {filteredResources.length} resources
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
              color={sortAlphabetically ? theme.colors.textInverse : theme.colors.icon} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]} 
            onPress={toggleViewMode}
          >
            <Ionicons 
              name={viewMode === 'grid' ? "list-outline" : "grid-outline"} 
              size={22} 
              color={theme.colors.icon} 
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
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <Ionicons name="shuffle-outline" size={22} color={theme.colors.textInverse} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Resources List */}
      <FlatList
        data={filteredResources}
        renderItem={renderResourceItem}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        contentContainerStyle={[
          styles.resourcesList,
          filteredResources.length === 0 && styles.emptyList
        ]}
        numColumns={viewMode === 'grid' && isWideScreen ? 2 : 1}
        key={viewMode + (isWideScreen ? '-wide' : '-narrow')} // Force re-render when changing viewMode or screen size
        ItemSeparatorComponent={
          viewMode === 'list' ? () => <View style={[styles.separator, { backgroundColor: theme.colors.divider }]} /> : null
        }
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
  headerGradient: {
    paddingTop: 0, // Reduced padding for smaller header
    paddingBottom: 0,
  },
  header: {
    padding: 12, // Reduced padding for smaller header
  },
  headerTitle: {
    fontSize: 22, // Slightly smaller font size
    fontWeight: 'bold',
    marginBottom: 2, // Reduced margin
  },
  headerSubtitle: {
    fontSize: 13, // Smaller subtitle
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12, // Reduced margin
    marginTop: 8, // Reduced top margin
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 44, // Slightly shorter search bar
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15, // Slightly smaller font
  },
  clearButton: {
    padding: 5,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12, // Slightly reduced padding
    marginBottom: 8, // Reduced margin
    marginTop: 0, // Reduced margin
  },
  resultsCount: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36, // Slightly smaller button
    height: 36, // Slightly smaller button
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8, // Reduced margin
  },
  resourcesList: {
    padding: 12, // Reduced padding
    paddingTop: 4, // Reduced top padding
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetButtonText: {
    fontWeight: 'bold',
  },
});

export default ResourcesScreen;
