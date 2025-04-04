// src/screens/profile/ThemeSettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Animated,
  Platform,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { createGlobalStyles } from '../../styles/globalStyles';
import CustomHeaderComponent from '../../components/CustomHeaderComponent';


const { width, height } = Dimensions.get('window');
const CARD_SPACING = 16;
const CARD_WIDTH = width - (CARD_SPACING * 2);

const ThemeSettingsScreen = ({ navigation }) => {
  const { theme, themeName, setTheme, getAvailableThemes } = useTheme();
  const globalStyles = createGlobalStyles(theme);
  const availableThemes = getAvailableThemes();
  
  // Animation values
  const [selectedScale] = useState(new Animated.Value(1));
  const [scrollY] = useState(new Animated.Value(0));
  const [fadeIns] = useState(availableThemes.map(() => new Animated.Value(0)));
  
  // Animation on mount
  useEffect(() => {
    // Animate cards in sequence
    availableThemes.forEach((_, index) => {
      Animated.timing(fadeIns[index], {
        toValue: 1,
        duration: 400,
        delay: 100 + (index * 150),
        useNativeDriver: true,
      }).start();
    });
  }, []);
  
  // Handle theme selection
  const handleSelectTheme = (name) => {
    if (name !== themeName) {
      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Animate selection
      Animated.sequence([
        Animated.timing(selectedScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(selectedScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Apply theme
      setTheme(name);
    }
  };
  
  // Get icon for each theme
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
  
  // Header opacity animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });
  
  return (
    <SafeAreaView style={[globalStyles.screen]}>
      {/* Custom Header with Animated Opacity on Scroll */}
      <Animated.View style={[styles.animatedHeader, { 
        opacity: headerOpacity,
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.border,
        top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0,
      }]}>
        <CustomHeaderComponent 
          title="Theme Settings" 
          subtitle="Customize your app experience"
          gradientColors={theme.colors.primaryGradient}
        />
      </Animated.View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={theme.colors.secondaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <Text style={[styles.headerTitle, { color: theme.colors.buttonText }]}>
              <Ionicons name="color-palette" size={24} /> Theme Gallery
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.buttonText + 'CC' }]}>
              Select your preferred visual style
            </Text>
          </LinearGradient>
        </View>
        
        {/* Theme Cards */}
        <View style={styles.themesContainer}>
          {availableThemes.map((item, index) => {
            const isSelected = themeName === item.name;
            
            // Apply animations and styles
            const cardScale = isSelected ? selectedScale : new Animated.Value(1);
            
            return (
              <Animated.View 
                key={item.name}
                style={[
                  styles.themeCard,
                  { 
                    opacity: fadeIns[index],
                    transform: [
                      { translateY: fadeIns[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0]
                      })},
                      { scale: cardScale }
                    ],
                    backgroundColor: item.colors.background,
                    borderColor: isSelected ? item.colors.primary : item.colors.border,
                    shadowColor: theme.colors.shadow,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isSelected ? 0.3 : 0.1,
                    shadowRadius: 12,
                    elevation: isSelected ? 10 : 2,
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.themeCardInner}
                  onPress={() => handleSelectTheme(item.name)}
                  activeOpacity={0.7}
                >
                  {/* Theme Header */}
                  <LinearGradient
                    colors={item.colors.secondaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.themeCardHeader}
                  >
                    <View style={styles.themeHeaderRow}>
                      <View style={styles.themeInfo}>
                        <Ionicons 
                          name={getThemeIcon(item.name)} 
                          size={24} 
                          color={item.colors.buttonText} 
                        />
                        <Text style={[styles.themeName, { color: item.colors.buttonText }]}>
                          {item.displayName}
                        </Text>
                      </View>
                      
                      {isSelected && (
                        <View style={[styles.selectedBadge, { borderColor: item.colors.buttonText + '50' }]}>
                          <Ionicons name="checkmark" size={16} color={item.colors.buttonText} />
                          <Text style={[styles.selectedText, { color: item.colors.buttonText }]}>
                            Active
                          </Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                  
                  {/* Theme Preview */}
                  <View style={[styles.themePreview, { backgroundColor: item.colors.background }]}>
                    {/* Header preview */}
                    <View style={[styles.previewHeader, { backgroundColor: item.colors.headerBackground }]}>
                      <View style={styles.previewHeaderBar}>
                        <View style={[styles.previewDot, { backgroundColor: item.colors.text }]} />
                        <View style={[styles.previewLine, { 
                          width: '40%',
                          backgroundColor: item.colors.text + '80'
                        }]} />
                        <View style={{ flex: 1 }} />
                        <View style={[styles.previewDot, { backgroundColor: item.colors.primary }]} />
                      </View>
                    </View>
                    
                    {/* Content preview */}
                    <View style={styles.previewContent}>
                      {/* Card 1 */}
                      <View style={[styles.previewCard, { 
                        backgroundColor: item.colors.surface,
                        borderColor: item.colors.border
                      }]}>
                        <View style={styles.previewCardHeader}>
                          <View style={[styles.previewSquare, { 
                            backgroundColor: item.colors.primary 
                          }]} />
                          <View style={[styles.previewLine, { 
                            backgroundColor: item.colors.text + '80'
                          }]} />
                        </View>
                        <View style={styles.previewCardBody}>
                          <View style={[styles.previewLine, { 
                            width: '80%',
                            backgroundColor: item.colors.textSecondary + '60'
                          }]} />
                          <View style={[styles.previewLine, { 
                            width: '60%',
                            backgroundColor: item.colors.textSecondary + '40',
                            marginTop: 4
                          }]} />
                        </View>
                      </View>
                      
                      {/* Card 2 & 3 */}
                      <View style={styles.previewCardRow}>
                        <View style={[styles.previewSmallCard, { 
                          backgroundColor: item.colors.testCard,
                          borderColor: `${item.colors.testCard}80`
                        }]}>
                          <View style={[styles.previewSquare, { 
                            backgroundColor: item.colors.buttonText + '90',
                            width: 16,
                            height: 16
                          }]} />
                          <View style={[styles.previewLine, { 
                            width: '100%',
                            height: 3,
                            backgroundColor: item.colors.buttonText + '60',
                            marginTop: 4
                          }]} />
                        </View>
                        
                        <View style={[styles.previewSmallCard, { 
                          backgroundColor: item.colors.toolCard,
                          borderColor: `${item.colors.toolCard}80`
                        }]}>
                          <View style={[styles.previewSquare, { 
                            backgroundColor: item.colors.buttonText + '90',
                            width: 16,
                            height: 16
                          }]} />
                          <View style={[styles.previewLine, { 
                            width: '100%',
                            height: 3,
                            backgroundColor: item.colors.buttonText + '60',
                            marginTop: 4
                          }]} />
                        </View>
                      </View>
                    </View>
                    
                    {/* Bottom tab bar preview */}
                    <View style={[styles.previewTabBar, { 
                      backgroundColor: item.colors.tabBackground,
                      borderTopColor: item.colors.border
                    }]}>
                      <View style={[styles.previewTab, { opacity: 0.6 }]}>
                        <View style={[styles.previewDot, { 
                          backgroundColor: item.colors.tabInactive,
                          width: 6,
                          height: 6
                        }]} />
                      </View>
                      <View style={styles.previewTab}>
                        <View style={[styles.previewDot, { 
                          backgroundColor: item.colors.tabActive,
                          width: 8,
                          height: 8
                        }]} />
                      </View>
                      <View style={[styles.previewTab, { opacity: 0.6 }]}>
                        <View style={[styles.previewDot, { 
                          backgroundColor: item.colors.tabInactive,
                          width: 6,
                          height: 6
                        }]} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        
        {/* Info Card */}
        <View style={[styles.infoCard, { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={22} color={theme.colors.primary} />
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              Personalization Features
            </Text>
          </View>
          
          <View style={[styles.infoItem, { borderBottomColor: theme.colors.divider }]}>
            <View style={[styles.infoBullet, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="color-palette" size={16} color={theme.colors.buttonText} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoItemTitle, { color: theme.colors.text }]}>
                Application-wide theming
              </Text>
              <Text style={[styles.infoItemText, { color: theme.colors.textSecondary }]}>
                Your theme selection affects all screens and components throughout the app
              </Text>
            </View>
          </View>
          
          <View style={[styles.infoItem, { borderBottomColor: theme.colors.divider }]}>
            <View style={[styles.infoBullet, { backgroundColor: theme.colors.secondary }]}>
              <Ionicons name="save" size={16} color={theme.colors.buttonText} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoItemTitle, { color: theme.colors.text }]}>
                Persistent selection
              </Text>
              <Text style={[styles.infoItemText, { color: theme.colors.textSecondary }]}>
                Your theme preference is saved and will be applied each time you open the app
              </Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={[styles.infoBullet, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="brush" size={16} color={theme.colors.buttonText} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoItemTitle, { color: theme.colors.text }]}>
                Professionally designed
              </Text>
              <Text style={[styles.infoItemText, { color: theme.colors.textSecondary }]}>
                Each theme has been carefully crafted to ensure readability and visual appeal
              </Text>
            </View>
          </View>
        </View>
        
        {/* Bottom Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
  },
  header: {
    marginHorizontal: CARD_SPACING,
    marginTop: CARD_SPACING,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  headerGradient: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  themesContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: CARD_SPACING / 2,
  },
  themeCard: {
    width: CARD_WIDTH,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
  },
  themeCardInner: {
    flex: 1,
  },
  themeCardHeader: {
    padding: 16,
  },
  themeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    gap: 4,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  themePreview: {
    height: 250,
    overflow: 'hidden',
  },
  previewHeader: {
    height: 50,
    padding: 10,
    justifyContent: 'flex-end',
  },
  previewHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewContent: {
    flex: 1,
    padding: 12,
  },
  previewCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    height: 90,
  },
  previewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewCardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  previewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  previewSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  previewLine: {
    height: 6,
    width: '50%',
    borderRadius: 3,
  },
  previewCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewSmallCard: {
    width: '48%',
    borderRadius: 12,
    padding: 10,
    height: 60,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTabBar: {
    height: 48,
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  previewTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    margin: CARD_SPACING,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  infoBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoItemText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ThemeSettingsScreen;
