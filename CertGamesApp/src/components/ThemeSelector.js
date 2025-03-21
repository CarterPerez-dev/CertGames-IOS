// src/components/ThemeSelector.js
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { createGlobalStyles } from '../styles/globalStyles';

const { width } = Dimensions.get('window');

const ThemeSelector = () => {
  const { theme, themeName, setTheme, getAvailableThemes } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  const availableThemes = getAvailableThemes();
  
  const handleThemeSelect = (name) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTheme(name);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>App Theme</Text>
      
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.themesContainer}
      >
        {availableThemes.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[
              styles.themeCard,
              {
                backgroundColor: item.colors.card,
                borderColor: item.name === themeName ? theme.colors.primary : 'transparent',
              }
            ]}
            onPress={() => handleThemeSelect(item.name)}
            activeOpacity={0.7}
          >
            {item.name === themeName && (
              <View style={styles.selectedIcon}>
                <BlurView intensity={80} tint="dark" style={styles.blurView}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                </BlurView>
              </View>
            )}
            
            <Text style={styles.themeName}>{item.displayName}</Text>
            
            <View style={styles.colorPreview}>
              <View style={[styles.colorDot, { backgroundColor: item.colors.primary }]} />
              <View style={[styles.colorDot, { backgroundColor: item.colors.secondary }]} />
              <View style={[styles.colorDot, { backgroundColor: item.colors.accent }]} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  themesContainer: {
    paddingBottom: 8,
    paddingRight: 8,
  },
  themeCard: {
    width: width / 3 - 24,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 2,
  },
  selectedIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  blurView: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  colorPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default ThemeSelector;
