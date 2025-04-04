// src/components/ThemeSelector.js
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { createGlobalStyles } from '../styles/globalStyles';

const { width } = Dimensions.get('window');

const ThemeSelector = () => {
  const { theme, themeName, setTheme, getAvailableThemes } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  const availableThemes = getAvailableThemes();
  
  const handleThemeSelect = (name) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTheme(name);
  };
  
  // Function to get appropriate theme color for preview
  const getContrastColor = (themeColor) => {
    // Simple function to determine if a color is light or dark
    const hexToRgb = (hex) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };
    
    const rgb = hexToRgb(themeColor);
    // Calculate relative luminance using the formula for sRGB
    const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    
    return luminance > 128 ? '#000000' : '#FFFFFF';
  };
  
  // Icon for each theme
  const getThemeIcon = (name) => {
    switch(name) {
      case 'Amethyst':
        return 'diamond';            // Moon icon for Dark Purple
      case 'Crimson':
        return 'flame';           // Flame icon for Dark Crimson
      case 'Emerald':
        return 'prism';            // Leaf icon for Dark Emerald
      case 'Monochrome':
        return 'infinite';        // Contrast icon for Monochrome
      default:
        return 'color-palette';   // Default fallback
    }
  };
  
  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    }]}>
      <View style={styles.headerRow}>
        <Ionicons name="color-palette" size={20} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.text }]}>App Theme</Text>
      </View>
      
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.themesContainer}
      >
        {availableThemes.map((item) => {
          const isActive = item.name === themeName;
          // Get background color for preview based on theme
          const themeBackground = item.colors.background;
          const themeText = item.colors.text;
          const themePrimary = item.colors.primary;
          const themeCard = item.colors.surface;
          
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.themeCard,
                {
                  backgroundColor: themeBackground,
                  borderColor: isActive ? themePrimary : theme.colors.border,
                  shadowColor: theme.colors.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isActive ? 0.3 : 0.1,
                  shadowRadius: 8,
                  elevation: isActive ? 6 : 2,
                }
              ]}
              onPress={() => handleThemeSelect(item.name)}
              activeOpacity={0.7}
            >
              {isActive && (
                <View style={styles.selectedIcon}>
                  <BlurView intensity={80} tint="Amethyst" style={styles.blurView}>
                    <Ionicons name="checkmark-circle" size={24} color={themePrimary} />
                  </BlurView>
                </View>
              )}
              
              {/* Theme Header */}
              <LinearGradient
                colors={item.colors.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.themeHeader}
              >
                <Text style={[styles.themeName, { color: item.colors.buttonText }]}>
                  {item.displayName}
                </Text>
              </LinearGradient>
              
              {/* UI Preview */}
              <View style={styles.themePreview}>
                {/* Preview Header */}
                <View style={[styles.previewHeader, { backgroundColor: themePrimary }]}>
                  <View style={styles.previewHeaderText}>
                    <View style={[styles.previewDot, { backgroundColor: item.colors.buttonText }]} />
                    <View style={[styles.previewLine, { 
                      backgroundColor: `${item.colors.buttonText}80`
                    }]} />
                  </View>
                </View>
                
                {/* Card Preview */}
                <View style={[styles.previewCard, { 
                  backgroundColor: themeCard,
                  borderWidth: 1,
                  borderColor: item.colors.border,
                }]}>
                  <View style={styles.previewCardRow}>
                    <View style={[styles.previewSquare, { backgroundColor: item.colors.primary }]} />
                    <View style={[styles.previewLineSmall, { backgroundColor: themeText }]} />
                  </View>
                  <View style={styles.previewCardRow}>
                    <View style={[styles.previewSquare, { 
                      backgroundColor: item.name === 'Emerald' ? item.colors.testCard : item.colors.testCard 
                    }]} />
                    <View style={[styles.previewLineSmall, { backgroundColor: themeText }]} />
                  </View>
                </View>
                
                {/* Bottom Preview Item */}
                <View style={[styles.previewFooter, { backgroundColor: themePrimary }]}>
                  <Ionicons 
                    name={getThemeIcon(item.name)} 
                    size={14} 
                    color={getContrastColor(themePrimary)} 
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  themesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  themeCard: {
    width: width / 4 - 18,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
  },
  selectedIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 10,
  },
  blurView: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeHeader: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeName: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  themePreview: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  previewHeader: {
    height: 24,
    borderRadius: 6,
    marginBottom: 8,
    justifyContent: 'center',
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewHeaderText: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  previewLine: {
    height: 4,
    width: '70%',
    borderRadius: 2,
  },
  previewCard: {
    padding: 8,
    borderRadius: 8,
    height: 70,
    justifyContent: 'center',
    marginBottom: 8,
  },
  previewCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 6,
  },
  previewLineSmall: {
    height: 4,
    width: '60%',
    borderRadius: 2,
  },
  previewFooter: {
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ThemeSelector;
