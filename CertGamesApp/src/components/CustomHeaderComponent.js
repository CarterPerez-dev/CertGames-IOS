// src/components/CustomHeaderComponent.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

/**
 * Custom header component for screens that need their own header
 * 
 * @param {Object} props Component props
 * @param {string} props.title Header title
 * @param {string} props.subtitle Optional subtitle
 * @param {boolean} props.showBackButton Whether to show back button
 * @param {Function} props.onBackPress Custom back press handler (optional)
 * @param {JSX.Element} props.rightComponent Optional component to show on right side
 * @returns {JSX.Element}
 */
const CustomHeaderComponent = ({ 
  title, 
  subtitle, 
  showBackButton = true,
  onBackPress,
  rightComponent,
  gradientColors = ['#1E1E2E', '#0B0C15'],
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };
  
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
              {subtitle}
            </Text>
          )}
        </View>
        
        <View style={styles.rightContainer}>
          {rightComponent || <View style={styles.placeholderRight} />}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 25 : 16, // Account for status bar
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  rightContainer: {
    marginLeft: 8,
  },
  placeholderRight: {
    width: 28, // Same width as back button for balance
  },
});

export default CustomHeaderComponent;
