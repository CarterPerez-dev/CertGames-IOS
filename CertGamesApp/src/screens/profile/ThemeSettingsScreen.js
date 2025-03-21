// src/screens/profile/ThemeSettingsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const ThemeSettingsScreen = ({ navigation }) => {
  const { theme, themeName, setTheme, getAvailableThemes } = useTheme();
  const availableThemes = getAvailableThemes();
  
  // Animation values
  const [selectedScale] = useState(new Animated.Value(1));
  
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
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.colors.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Theme Settings</Text>
          <View style={styles.headerRight} />
        </View>
        <Text style={styles.subtitle}>Choose your visual experience</Text>
      </LinearGradient>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.themesGrid}>
          {availableThemes.map((item) => (
            <Animated.View 
              key={item.name}
              style={[
                styles.themeCard,
                { borderColor: themeName === item.name ? theme.colors.primary : 'transparent' },
                themeName === item.name && { transform: [{ scale: selectedScale }] }
              ]}
            >
              <TouchableOpacity
                style={styles.themeCardInner}
                onPress={() => handleSelectTheme(item.name)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[item.colors.primary, item.colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.themeHeader}
                >
                  <Text style={styles.themeTitle}>{item.displayName}</Text>
                </LinearGradient>
                
                <View style={[styles.themePreview, { backgroundColor: item.colors.background }]}>
                  {/* Simulate leaderboard UI */}
                  <View style={[styles.previewHeader, { backgroundColor: item.colors.primary }]}>
                    <View style={styles.previewHeaderText} />
                  </View>
                  
                  <View style={[styles.previewItem, { backgroundColor: item.colors.card }]}>
                    <View style={[styles.previewDot, { backgroundColor: item.colors.goldBadge }]} />
                    <View style={styles.previewLine} />
                  </View>
                  
                  <View style={[styles.previewItem, { backgroundColor: item.colors.card }]}>
                    <View style={[styles.previewDot, { backgroundColor: item.colors.silverBadge }]} />
                    <View style={styles.previewLine} />
                  </View>
                  
                  <View style={[styles.previewItem, { 
                    backgroundColor: item.colors.primary,
                    borderColor: item.colors.border
                  }]}>
                    <View style={[styles.previewDot, { backgroundColor: '#FFFFFF' }]} />
                    <View style={[styles.previewLine, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                  </View>
                </View>
                
                {themeName === item.name && (
                  <View style={styles.selectedIndicator}>
                    <View style={[styles.checkCircle, { backgroundColor: item.colors.primary }]}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.selectedText, { color: item.colors.primary }]}>Active</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={22} color={theme.colors.primary} />
              <Text style={[styles.infoTitle, { color: theme.colors.text }]}>About Themes</Text>
            </View>
            <Text style={[styles.infoText, { color: theme.colors.subtext }]}>
              Themes customize the colors and appearance of the entire app. Your theme preference
              will be saved and applied each time you open the app.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 15 : 25,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  themeCard: {
    width: (width - 50) / 2,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  themeCardInner: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  themeHeader: {
    padding: 12,
    alignItems: 'center',
  },
  themeTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  themePreview: {
    padding: 10,
    height: 160,
  },
  previewHeader: {
    height: 30,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'center',
    padding: 8,
  },
  previewHeaderText: {
    height: 8,
    width: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
  },
  previewItem: {
    height: 30,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  previewLine: {
    height: 6,
    width: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  selectedText: {
    fontWeight: 'bold',
  },
  infoSection: {
    marginTop: 10,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoText: {
    lineHeight: 20,
  },
});

export default ThemeSettingsScreen;
