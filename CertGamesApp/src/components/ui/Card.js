// src/components/ui/Card.js
import React from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

/**
 * Card component with consistent styling across the app
 */
const Card = ({ 
  children, 
  style, 
  onPress, 
  gradient, 
  gradientColors, 
  gradientStart = {x: 0, y: 0}, 
  gradientEnd = {x: 1, y: 0},
  disabled = false,
  elevation = 4,
  radius = 16,
}) => {
  const { theme } = useTheme();
  
  // Default gradient colors based on theme if not provided
  const colors = gradientColors || (gradient === 'primary' 
    ? theme.primaryGradient 
    : gradient === 'secondary' 
      ? theme.secondaryGradient
      : gradient === 'accent'
        ? theme.accentGradient
        : null);
  
  // Determine shadow style based on platform and elevation
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: elevation * 0.05,
      shadowRadius: elevation,
    },
    android: {
      elevation: elevation,
    },
  });
  
  const cardStyles = [
    styles.card,
    { borderRadius: radius },
    shadowStyle,
    style,
  ];
  
  if (!onPress) {
    return colors ? (
      <LinearGradient
        colors={colors}
        start={gradientStart}
        end={gradientEnd}
        style={cardStyles}
      >
        {children}
      </LinearGradient>
    ) : (
      <View style={[cardStyles, { backgroundColor: theme.surface }]}>
        {children}
      </View>
    );
  }
  
  return (
    <TouchableOpacity 
      style={cardStyles} 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {colors ? (
        <LinearGradient
          colors={colors}
          start={gradientStart}
          end={gradientEnd}
          style={styles.gradientContainer}
        >
          {children}
        </LinearGradient>
      ) : (
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          {children}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    margin: 4,
  },
  gradientContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default Card;
