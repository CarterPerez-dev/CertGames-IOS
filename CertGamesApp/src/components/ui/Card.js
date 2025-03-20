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
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {Object} props.style - Additional styles for the card
 * @param {Function} props.onPress - On press handler
 * @param {string|boolean} props.gradient - Gradient preset ('primary', 'secondary', 'accent', etc.) or false for solid background
 * @param {Array} props.gradientColors - Custom gradient colors
 * @param {Object} props.gradientStart - Gradient start point {x, y}
 * @param {Object} props.gradientEnd - Gradient end point {x, y}
 * @param {boolean} props.disabled - Whether the card is disabled
 * @param {number} props.elevation - Shadow elevation (1-24)
 * @param {number} props.radius - Border radius
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
  // Ignoring animation props for now
  entering,
  exiting,
  layout,
  ...rest
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
  
  // Non-touchable card
  if (!onPress) {
    // With gradient
    if (colors) {
      return (
        <View style={cardStyles} {...rest}>
          <LinearGradient
            colors={colors}
            start={gradientStart}
            end={gradientEnd}
            style={styles.gradientContainer}
          >
            {children}
          </LinearGradient>
        </View>
      );
    }
    
    // Without gradient (solid background)
    return (
      <View 
        style={[cardStyles, { backgroundColor: theme.surface }]}
        {...rest}
      >
        {children}
      </View>
    );
  }
  
  // Touchable card
  return (
    <TouchableOpacity 
      style={cardStyles} 
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      {...rest}
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
