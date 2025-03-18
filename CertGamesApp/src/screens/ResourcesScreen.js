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
import ResourcesCategoriesComponent from '../../components/ResourcesCategoriesComponent';
import ResourceItemComponent from '../../components/ResourceItemComponent';
import ResourceRandomModal from '../../components/ResourceRandomModal';
import useResources from '../../hooks/useResources';

const ResourcesScreen = () => {
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
      <Ionicons name="search" size={50} color="#6543CC" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>No resources found</Text>
      <Text style={styles.emptyMessage}>
        Try adjusting your search or selecting a different category
      </Text>
      <TouchableOpacity 
        style={styles.resetButton}
        onPress={clearFilters}
      >
        <Text style={styles.resetButtonText}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  ), [clearFilters]);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resources Hub</Text>
        <Text style={styles.headerSubtitle}>
          Find tools and learning materials for certifications
        </Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#AAAAAA" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search resources..."
          placeholderTextColor="#AAAAAA"
          value={searchTerm}
          onChangeText={setSearchTerm}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {searchTerm ? (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color="#AAAAAA" />
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
        <View style={styles.resultsCount}>
          <Text style={styles.resultsText}>
            {filteredResources.length} resources
          </Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, sortAlphabetically && styles.activeActionButton]} 
            onPress={toggleSort}
          >
            <Ionicons 
              name={sortAlphabetically ? "text" : "text-outline"} 
              size={22} 
              color={sortAlphabetically ? "#FFFFFF" : "#AAAAAA"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={toggleViewMode}
          >
            <Ionicons 
              name={viewMode === 'grid' ? "list-outline" : "grid-outline"} 
              size={22} 
              color="#AAAAAA" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.randomButton]} 
            onPress={handleGetRandomResource}
            disabled={loadingRandom || filteredResources.length === 0}
          >
            {loadingRandom ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="shuffle-outline" size={22} color="#FFFFFF" />
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
          viewMode === 'list' ? () => <View style={styles.separator} /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor="#6543CC"
            colors={["#6543CC"]}
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
    backgroundColor: '#121212',
  },
  header: {
    padding: 15,
    backgroundColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    margin: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
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
  },
  resultsCount: {
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(101, 67, 204, 0.3)',
  },
  resultsText: {
    color: '#6543CC',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  activeActionButton: {
    backgroundColor: '#6543CC',
  },
  randomButton: {
    backgroundColor: '#6543CC',
  },
  resourcesList: {
    padding: 15,
    paddingTop: 5,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#6543CC',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ResourcesScreen;
