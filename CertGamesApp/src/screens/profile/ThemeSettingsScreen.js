// src/screens/profile/ThemeSettingsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';

const ThemeSettingsScreen = ({ navigation }) => {
  const { theme, setTheme, availableThemes } = useTheme();
  
  const animatedBackground = useSharedValue(0);
  
  // Create an array of theme objects from the availableThemes object
  const themeOptions = Object.values(availableThemes);
  
  // Function to set the active theme with animation
  const changeTheme = (newTheme) => {
    // Animate background transition
    animatedBackground.value = withTiming(1, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    // Set the theme after a short delay to allow animation
    setTimeout(() => {
      setTheme(newTheme);
      animatedBackground.value = withTiming(0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, 300);
  };
  
  // Animated style for background transition
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedBackground.value,
      [0, 1],
      [theme.background, 'rgba(0, 0, 0, 0.9)']
    );
    
    return {
      backgroundColor,
    };
  });
  
  return (
    <Animated.View style={[styles.container, animatedBackgroundStyle]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Theme Settings</Text>
          <View style={styles.headerRight} />
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={styles.sectionContainer}
            entering={FadeIn.delay(200).duration(500)}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Choose Your Theme
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              Select a theme that matches your style for the app interface.
            </Text>
          </Animated.View>
          
          <View style={styles.themesGrid}>
            {themeOptions.map((themeOption, index) => (
              <Animated.View 
                key={themeOption.name}
                entering={SlideInUp.delay(200 + (index * 100)).duration(500)}
              >
                <TouchableOpacity
                  style={[
                    styles.themeCard,
                    {
                      borderColor: theme.name === themeOption.name ? themeOption.primary : 'transparent',
                      backgroundColor: theme.name === themeOption.name ? 
                        `${themeOption.backgroundAlt}` : 
                        'rgba(30, 30, 40, 0.6)',
                    }
                  ]}
                  onPress={() => changeTheme(themeOption)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={themeOption.primaryGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.themeColorPreview}
                  />
                  
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeName, { color: theme.text }]}>
                      {themeOption.name.charAt(0).toUpperCase() + themeOption.name.slice(1)}
                    </Text>
                    
                    <View style={styles.themeColorPalette}>
                      {[
                        themeOption.primary,
                        themeOption.secondary,
                        themeOption.accent,
                      ].map((color, colorIndex) => (
                        <View
                          key={`${themeOption.name}-${colorIndex}`}
                          style={[styles.colorDot, { backgroundColor: color }]}
                        />
                      ))}
                    </View>
                  </View>
                  
                  {theme.name === themeOption.name && (
                    <View style={[styles.activeIndicator, { borderColor: themeOption.primary }]}>
                      <Ionicons name="checkmark" size={16} color={themeOption.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          
          <Animated.View 
            style={styles.previewSection}
            entering={FadeIn.delay(600).duration(500)}
          >
            <Text style={[styles.previewTitle, { color: theme.text }]}>Preview</Text>
            
            <View style={[styles.previewCard, { backgroundColor: theme.surface }]}>
              <View style={styles.previewHeader}>
                <View style={[styles.previewDot, { backgroundColor: theme.danger }]} />
                <View style={[styles.previewDot, { backgroundColor: theme.warning }]} />
                <View style={[styles.previewDot, { backgroundColor: theme.success }]} />
              </View>
              
              <View style={styles.previewContent}>
                <View style={[styles.previewLineShort, { backgroundColor: theme.primary }]} />
                <View style={[styles.previewLineMedium, { backgroundColor: theme.secondaryGradient[0] }]} />
                <View style={[styles.previewLineLong, { backgroundColor: theme.textSecondary }]} />
                
                <View style={styles.previewButtons}>
                  <View style={[styles.previewButton, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.previewButtonText, { color: '#fff' }]}>Button 1</Text>
                  </View>
                  <View style={[styles.previewButton, { backgroundColor: theme.secondary }]}>
                    <Text style={[styles.previewButtonText, { color: '#fff' }]}>Button 2</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 30,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  themesGrid: {
    marginBottom: 30,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  themeColorPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  themeColorPalette: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 6,
  },
  activeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  previewSection: {
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  previewCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 100, 100, 0.2)',
  },
  previewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  previewContent: {
    padding: 16,
  },
  previewLineShort: {
    width: '40%',
    height: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewLineMedium: {
    width: '70%',
    height: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewLineLong: {
    width: '90%',
    height: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewButton: {
    width: '48%',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewButtonText: {
    fontWeight: 'bold',
  },
});

export default ThemeSettingsScreen;
