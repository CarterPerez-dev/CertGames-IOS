// src/components/ui/Button.js
import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  View,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Animated from 'react-native-reanimated';

/**
 * Button component with various styling options and animation support
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Button text (original prop)
 * @param {string} props.label - Button text (alternative to title)
 * @param {Function} props.onPress - On press handler
 * @param {string} props.variant - Button variant ('primary', 'secondary', 'accent', 'outline', 'text')
 * @param {string} props.size - Button size ('small', 'medium', 'large')
 * @param {string} props.icon - Ionicons name for both left and right icons
 * @param {string} props.iconPosition - Position of the icon ('left', 'right')
 * @param {string} props.leftIcon - Ionicons name for left icon
 * @param {string} props.rightIcon - Ionicons name for right icon
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.fullWidth - Whether button should take full width
 * @param {Object} props.style - Additional styles for the button
 * @param {Object} props.textStyle - Styles for the button text
 * @param {number} props.iconSize - Custom size for the icon
 */
const Button = ({ 
  // Original props
  title, 
  onPress, 
  variant = 'primary',  // primary, secondary, accent, outline, text
  size = 'medium',      // small, medium, large
  icon,                 // Ionicons name
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  iconSize,
  
  // New props with backward compatibility
  label, // Alternative to title
  leftIcon, // Alternative to icon with iconPosition='left'
  rightIcon, // Alternative to icon with iconPosition='right'
  
  // Animation props (ignored in this simplified version)
  entering,
  exiting,
  layout,
  
  ...props
}) => {
  const { theme } = useTheme();
  
  // Determine button styling based on variant
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.primary,
          gradientColors: theme.primaryGradient,
        };
      case 'secondary':
        return {
          backgroundColor: theme.secondary,
          gradientColors: theme.secondaryGradient,
        };
      case 'accent':
        return {
          backgroundColor: theme.accent,
          gradientColors: theme.accentGradient,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.primary,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {
          backgroundColor: theme.primary,
          gradientColors: theme.primaryGradient,
        };
    }
  };
  
  // Determine size styling
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 8,
          fontSize: 14,
          iconSize: 16,
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 10,
          fontSize: 16,
          iconSize: 18,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: 12,
          fontSize: 18,
          iconSize: 20,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 10,
          fontSize: 16,
          iconSize: 18,
        };
    }
  };
  
  const buttonStyle = getButtonStyle();
  const sizeStyle = getSizeStyle();
  const finalIconSize = iconSize || sizeStyle.iconSize;
  
  // Resolve text content (support both title and label props)
  const buttonText = label || title;
  
  // Resolve icons for backward compatibility
  const resolvedLeftIcon = leftIcon || (icon && iconPosition === 'left' ? icon : null);
  const resolvedRightIcon = rightIcon || (icon && iconPosition === 'right' ? icon : null);
  
  // Handle text color based on variant
  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return theme.primary;
      case 'text':
        return theme.primary;
      default:
        return '#FFFFFF';
    }
  };
  
  const textColor = getTextColor();
  
  // Apply platform-specific shadow styling for elevated buttons
  const getShadowStyle = () => {
    if (variant === 'outline' || variant === 'text') return {};
    
    return Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    });
  };
  
  // Render button content
  const renderContent = () => {
    return (
      <View style={styles.contentContainer}>
        {resolvedLeftIcon && !loading && (
          <Ionicons 
            name={resolvedLeftIcon} 
            size={finalIconSize} 
            color={textColor}
            style={styles.leftIcon} 
          />
        )}
        
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          buttonText && (
            <Text 
              style={[
                styles.text, 
                { fontSize: sizeStyle.fontSize, color: textColor },
                textStyle
              ]}
            >
              {buttonText}
            </Text>
          )
        )}
        
        {resolvedRightIcon && !loading && (
          <Ionicons 
            name={resolvedRightIcon} 
            size={finalIconSize} 
            color={textColor}
            style={styles.rightIcon} 
          />
        )}
      </View>
    );
  };
  
  // Is this a gradient button?
  const isGradientButton = (variant === 'primary' || variant === 'secondary' || variant === 'accent') && !disabled;
  
  // Main render with animation support
  return (
    <View
      style={[
        styles.buttonContainer,
        getShadowStyle(),
        { width: fullWidth ? '100%' : 'auto' },
        style
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={variant === 'text' || variant === 'outline' ? 0.5 : 0.7}
        style={[
          styles.button,
          { 
            borderRadius: sizeStyle.borderRadius,
            opacity: disabled ? 0.6 : 1,
          },
          !isGradientButton && {
            paddingVertical: sizeStyle.paddingVertical,
            paddingHorizontal: sizeStyle.paddingHorizontal,
          },
          !isGradientButton && buttonStyle,
        ]}
        {...props}
      >
        {isGradientButton ? (
          <LinearGradient
            colors={buttonStyle.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, { 
              borderRadius: sizeStyle.borderRadius,
              paddingVertical: sizeStyle.paddingVertical,
              paddingHorizontal: sizeStyle.paddingHorizontal,
            }]}
          >
            {renderContent()}
          </LinearGradient>
        ) : (
          renderContent()
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default Button;
