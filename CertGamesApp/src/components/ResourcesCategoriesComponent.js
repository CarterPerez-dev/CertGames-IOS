// src/components/ResourcesCategoriesComponent.js
import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RESOURCE_CATEGORIES, CERT_CATEGORIES } from '../constants/resourcesConstants';
import { useTheme } from '../context/ThemeContext';

const ResourcesCategoriesComponent = ({ 
  selectedCategory, 
  onSelectCategory, 
  showCerts = false,
  onToggleCerts,
}) => {
  // Access theme
  const { theme } = useTheme();
  
  // Determine which categories to display
  const categories = showCerts ? CERT_CATEGORIES : RESOURCE_CATEGORIES;
  
  // Render an individual category button
  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        { 
          backgroundColor: selectedCategory === item.id ? theme.colors.primary : 'rgba(0, 0, 0, 0.2)',
          borderColor: selectedCategory === item.id ? theme.colors.primary : theme.colors.border
        }
      ]}
      onPress={() => onSelectCategory(item.id)}
    >
      <Ionicons 
        name={item.iconName} 
        size={20} 
        color={selectedCategory === item.id ? theme.colors.textInverse : theme.colors.primary} 
      />
      <Text 
        style={[
          styles.categoryName,
          { color: selectedCategory === item.id ? theme.colors.textInverse : theme.colors.text }
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
        <Text style={[styles.header, { color: theme.colors.text }]}>Categories</Text>
        <TouchableOpacity 
          style={[
            styles.toggleButton,
            { 
              backgroundColor: `${theme.colors.primary}20`,
              borderColor: theme.colors.primary
            }
          ]}
          onPress={onToggleCerts}
        >
          <Text style={[styles.toggleText, { color: theme.colors.primary }]}>
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
    marginVertical: 8, // Slightly reduced margin
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 8, // Slightly reduced margin
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleText: {
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
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ResourcesCategoriesComponent;
