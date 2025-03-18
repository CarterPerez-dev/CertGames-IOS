// src/components/ResourcesCategoriesComponent.js
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RESOURCE_CATEGORIES, CERT_CATEGORIES } from '../constants/resourcesConstants';

const ResourcesCategoriesComponent = ({ 
  selectedCategory, 
  onSelectCategory, 
  showCerts = false,
  onToggleCerts,
}) => {
  
  // Determine which categories to display
  const categories = showCerts ? CERT_CATEGORIES : RESOURCE_CATEGORIES;
  
  // Render an individual category button
  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.selectedCategory
      ]}
      onPress={() => onSelectCategory(item.id)}
    >
      <Ionicons 
        name={item.iconName} 
        size={20} 
        color={selectedCategory === item.id ? '#FFFFFF' : '#6543CC'} 
      />
      <Text 
        style={[
          styles.categoryName,
          selectedCategory === item.id && styles.selectedCategoryText
        ]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Categories</Text>
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={onToggleCerts}
        >
          <Text style={styles.toggleText}>
            {showCerts ? 'Show Resource Types' : 'Show Certifications'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  toggleButton: {
    backgroundColor: 'rgba(101, 67, 204, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6543CC',
  },
  toggleText: {
    color: '#6543CC',
    fontSize: 12,
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedCategory: {
    backgroundColor: '#6543CC',
    borderColor: '#6543CC',
  },
  categoryName: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
});

export default ResourcesCategoriesComponent;
