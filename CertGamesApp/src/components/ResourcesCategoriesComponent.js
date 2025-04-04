// src/components/ResourcesCategoriesComponent.js
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RESOURCE_CATEGORIES, CERT_CATEGORIES } from '../constants/resourcesConstants';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const ResourcesCategoriesComponent = ({ 
  selectedCategory, 
  onSelectCategory, 
  showCerts = false,
  onToggleCerts,
}) => {
  // Access theme
  const { theme } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  // Animation on mount and when showCerts changes
  useEffect(() => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showCerts]);
  
  // Determine which categories to display
  const categories = showCerts ? CERT_CATEGORIES : RESOURCE_CATEGORIES;
  
  // Handle selecting a category
  const handleSelectCategory = (categoryId) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    onSelectCategory(categoryId);
  };
  
  // Render an individual category button
  const renderCategory = ({ item, index }) => {
    const isSelected = selectedCategory === item.id;
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ 
            translateY: slideAnim
          }]
        }}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            { 
              backgroundColor: isSelected ? theme.colors.primary : 'rgba(0, 0, 0, 0.2)',
              borderColor: isSelected ? theme.colors.primary : theme.colors.border,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isSelected ? 0.3 : 0.1,
              shadowRadius: 4,
              elevation: isSelected ? 3 : 1,
            }
          ]}
          onPress={() => handleSelectCategory(item.id)}
        >
          <Ionicons 
            name={item.iconName} 
            size={20} 
            color={isSelected ? theme.colors.buttonText : theme.colors.primary} 
          />
          <Text 
            style={[
              styles.categoryName,
              { 
                color: isSelected ? theme.colors.buttonText : theme.colors.text,
                fontFamily: isSelected ? 'Orbitron-Bold' : 'ShareTechMono'
              }
            ]}
            numberOfLines={1}
          >
            {item.name.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: theme.colors.text, fontFamily: 'Orbitron-Bold' }]}>
          CATEGORIES
        </Text>
        <TouchableOpacity 
          style={[
            styles.toggleButton,
            { 
              backgroundColor: `${theme.colors.primary}20`,
              borderColor: theme.colors.primary
            }
          ]}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onToggleCerts();
          }}
        >
          <LinearGradient
            colors={[theme.colors.primary + '40', theme.colors.primary + '20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.toggleGradient}
          >
            <Text style={[styles.toggleText, { color: theme.colors.primary, fontFamily: 'ShareTechMono' }]}>
              {showCerts ? 'SHOW RESOURCE TYPES' : 'SHOW CERTIFICATIONS'}
            </Text>
          </LinearGradient>
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
    marginVertical: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  header: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    MarginRight: 5,
  },
  toggleButton: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toggleGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  categoriesList: {
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
  },
  categoryName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default ResourcesCategoriesComponent;
