// src/components/ui/Button.js
import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

/**
 * Button component with various styling options
 */
const Button = ({ 
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
  
  // Render button content
  const renderContent = () => {
    return (
      <View style={styles.contentContainer}>
        {icon && iconPosition === 'left' && !loading && (
          <Ionicons 
            name={icon} 
            size={finalIconSize} 
            color={textColor}
            style={styles.leftIcon} 
          />
        )}
        
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <Text 
            style={[
              styles.text, 
              { fontSize: sizeStyle.fontSize, color: textColor },
              textStyle
            ]}
          >
            {title}
          </Text>
        )}
        
        {icon && iconPosition === 'right' && !loading && (
          <Ionicons 
            name={icon} 
            size={finalIconSize} 
            color={textColor}
            style={styles.rightIcon} 
          />
        )}
      </View>
    );
  };
  
  // Main render
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        { 
          ...sizeStyle,
          opacity: disabled ? 0.6 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
        variant !== 'primary' && variant !== 'secondary' && variant !== 'accent' && buttonStyle,
        style
      ]}
      {...props}
    >
      {(variant === 'primary' || variant === 'secondary' || variant === 'accent') ? (
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
  );
};

const styles = StyleSheet.create({
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
