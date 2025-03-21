// src/components/GradientCard.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const GradientCard = ({ 
  children, 
  style, 
  gradientColors, 
  onPress, 
  disabled = false,
  activeOpacity = 0.7
}) => {
  const { theme } = useTheme();
  const colors = gradientColors || theme.colors.cardGradient;
  
  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.container, style]} 
        onPress={onPress}
        disabled={disabled}
        activeOpacity={activeOpacity}
      >
        <LinearGradient
          colors={colors}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {children}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});

export default GradientCard;
