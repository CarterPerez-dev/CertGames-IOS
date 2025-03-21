// src/context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Define available themes with comprehensive properties
const themes = {
  dark: {
    name: 'dark',
    colors: {
      // Base colors
      primary: '#6543CC',          // Main purple brand color
      secondary: '#FF4C8B',        // Pink accent color 
      accent: '#2ECC71',           // Green accent for success/positive actions
      
      // Background colors
      background: '#0D0F1F',       // Main app background
      surface: '#161A30',          // Elevated UI elements (cards, etc)
      surfaceHighlight: '#1A1F38', // Highlighted surface elements
      
      // Content/Text colors
      text: '#FFFFFF',             // Primary text
      textSecondary: '#B0B0C0',    // Secondary text (subtitles, etc)
      textMuted: '#8A8A9E',        // Muted text (hints, inactive states)
      textInverse: '#000000',      // Text on colored backgrounds
      
      // Status colors
      success: '#2EBB77',          // Success color
      warning: '#F39C12',          // Warning color
      error: '#E74C3C',            // Error color
      info: '#3498DB',             // Info color
      
      // UI element colors
      border: '#272A3F',           // Border color
      divider: '#222230',          // Divider color (subtler than border)
      icon: '#AAAACC',             // Icon color
      disabled: '#666680',         // Disabled state
      placeholder: '#555566',      // Placeholder text color
      
      // Input field colors
      inputBackground: '#0F1126',  // Input field background
      inputText: '#FFFFFF',        // Input text color
      inputBorder: '#333344',      // Input border color
      inputFocus: '#6543CC',       // Input focus color
      
      // Button colors
      buttonPrimary: '#6543CC',    // Primary button color
      buttonSecondary: '#454560',  // Secondary button color
      buttonSuccess: '#2EBB77',    // Success button color
      buttonDanger: '#E74C3C',     // Danger/delete button color
      buttonText: '#FFFFFF',       // Button text color
      
      // Navigation
      tabActive: '#6543CC',        // Active tab color
      tabInactive: '#696989',      // Inactive tab color
      tabBackground: '#0F0F17',    // Tab bar background
      headerBackground: '#1E1E2E', // Header background
      
      // Gradients (start and end colors)
      primaryGradient: ['#6543CC', '#8A58FC'],
      secondaryGradient: ['#FF4C8B', '#FF7950'],
      headerGradient: ['#1E1E2E', '#0B0C15'],
      cardGradient: ['#161A30', '#1E2340'],
      
      // Specific component colors
      modal: '#171A23',            // Modal background
      toast: '#1A1A2A',            // Toast notification background
      tooltip: '#333344',          // Tooltip background
      menu: '#1C1C28',             // Menu/dropdown background
      
      // Special elements
      highlight: '#6543CC20',      // Highlight color (with opacity)
      selection: '#6543CC40',      // Selected item background
      overlay: 'rgba(0,0,0,0.7)',  // Overlay for modals, etc
      
      // Game-specific themes
      goldBadge: '#FFD700',
      silverBadge: '#C0C0C0', 
      bronzeBadge: '#CD7F32',
      
      // Special cases
      progressTrack: '#333344',     // Progress bar background
      progressIndicator: '#6543CC', // Progress bar fill
      scrollThumb: '#444455',       // Scrollbar thumb
      shadow: '#000000',            // Shadow color (with opacity for shadow settings)
    },
    
    // Additional style parameters
    sizes: {
      borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 20,
        pill: 9999,
      },
      fontSize: {
        xs: 10, 
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
        xxxl: 30,
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
      },
      iconSize: {
        sm: 16,
        md: 24,
        lg: 32,
        xl: 48,
      },
    },
  },
  
  purple: {
    name: 'purple',
    colors: {
      // Base colors
      primary: '#8A64FF',          // Lighter purple
      secondary: '#FF6B9B',        // Lighter pink
      accent: '#55D98D',           // Lighter green
      
      // Background colors
      background: '#16132B',       // Deep purple background
      surface: '#251D4C',          // Card background
      surfaceHighlight: '#302662', // Highlighted surface
      
      // Content/Text colors
      text: '#FFFFFF',             // Primary text
      textSecondary: '#BBBBDD',    // Secondary text
      textMuted: '#9A8EC2',        // Muted text
      textInverse: '#000000',      // Text on colored backgrounds
      
      // Status colors
      success: '#55D98D',          // Success
      warning: '#FFBB55',          // Warning
      error: '#FF6666',            // Error
      info: '#55AAFF',             // Info
      
      // UI element colors
      border: '#392D70',           // Border
      divider: '#332966',          // Divider
      icon: '#B3A8DE',             // Icon
      disabled: '#666680',         // Disabled state
      placeholder: '#5D4E8C',      // Placeholder text
      
      // Input field colors
      inputBackground: '#14102A',  // Input field background
      inputText: '#FFFFFF',        // Input text
      inputBorder: '#392D70',      // Input border
      inputFocus: '#8A64FF',       // Input focus
      
      // Button colors
      buttonPrimary: '#8A64FF',    // Primary button
      buttonSecondary: '#5D4E8C',  // Secondary button
      buttonSuccess: '#55D98D',    // Success button
      buttonDanger: '#FF6666',     // Danger button
      buttonText: '#FFFFFF',       // Button text
      
      // Navigation
      tabActive: '#8A64FF',        // Active tab
      tabInactive: '#9A8EC2',      // Inactive tab
      tabBackground: '#110F21',    // Tab bar background
      headerBackground: '#1C1632', // Header background
      
      // Gradients
      primaryGradient: ['#8A64FF', '#6E45DD'],
      secondaryGradient: ['#FF6B9B', '#F83D8A'],
      headerGradient: ['#251D4C', '#16132B'],
      cardGradient: ['#251D4C', '#302662'],
      
      // Specific component colors
      modal: '#251D4C',            // Modal background
      toast: '#251D4C',            // Toast background
      tooltip: '#392D70',          // Tooltip background
      menu: '#21184A',             // Menu background
      
      // Special elements
      highlight: '#8A64FF20',      // Highlight color
      selection: '#8A64FF40',      // Selection color
      overlay: 'rgba(15,10,40,0.7)', // Overlay
      
      // Game-specific themes
      goldBadge: '#FFD700',
      silverBadge: '#C0C0C0',
      bronzeBadge: '#CD7F32',
      
      // Special cases
      progressTrack: '#392D70',     // Progress track
      progressIndicator: '#8A64FF', // Progress indicator
      scrollThumb: '#5D4E8C',       // Scrollbar
      shadow: '#0F0A28',            // Shadow color
    },
    
    // Additional style parameters (same keys as the dark theme)
    sizes: {
      borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 20,
        pill: 9999,
      },
      fontSize: {
        xs: 10, 
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
        xxxl: 30,
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
      },
      iconSize: {
        sm: 16,
        md: 24,
        lg: 32,
        xl: 48,
      },
    },
  },
  
  cyberpunk: {
    name: 'cyberpunk',
    colors: {
      // Base colors
      primary: '#00FFFF',          // Cyan
      secondary: '#FF00FF',        // Magenta
      accent: '#FFFF00',           // Yellow
      
      // Background colors
      background: '#0D0D2B',       // Deep blue
      surface: '#1A1A40',          // Card background
      surfaceHighlight: '#2A2A60', // Highlighted card
      
      // Content/Text colors
      text: '#FFFFFF',             // Primary text
      textSecondary: '#00FFFF',    // Secondary text
      textMuted: '#4D8585',        // Muted text
      textInverse: '#000000',      // Inverted text
      
      // Status colors
      success: '#00FF00',          // Success (neon green)
      warning: '#FFFF00',          // Warning (yellow)
      error: '#FF0000',            // Error (red)
      info: '#00FFFF',             // Info (cyan)
      
      // UI element colors
      border: '#00FFFF',           // Border (cyan)
      divider: '#001F1F',          // Divider
      icon: '#00FFFF',             // Icon
      disabled: '#555580',         // Disabled
      placeholder: '#003F3F',      // Placeholder
      
      // Input field colors
      inputBackground: '#0A0A22',  // Input background
      inputText: '#FFFFFF',        // Input text
      inputBorder: '#00FFFF',      // Input border
      inputFocus: '#FF00FF',       // Input focus
      
      // Button colors
      buttonPrimary: '#00FFFF',    // Primary button
      buttonSecondary: '#FF00FF',  // Secondary button
      buttonSuccess: '#00FF00',    // Success button
      buttonDanger: '#FF0000',     // Danger button
      buttonText: '#000000',       // Button text (dark for contrast)
      
      // Navigation
      tabActive: '#00FFFF',        // Active tab
      tabInactive: '#4D8585',      // Inactive tab
      tabBackground: '#0A0A22',    // Tab background
      headerBackground: '#1A1A40', // Header background
      
      // Gradients
      primaryGradient: ['#00FFFF', '#001F1F'],
      secondaryGradient: ['#FF00FF', '#1F001F'],
      headerGradient: ['#1A1A40', '#0D0D2B'],
      cardGradient: ['#1A1A40', '#2A2A60'],
      
      // Specific component colors
      modal: '#1A1A40',            // Modal
      toast: '#1A1A40',            // Toast
      tooltip: '#00FFFF',          // Tooltip
      menu: '#0A0A22',             // Menu
      
      // Special elements
      highlight: '#00FFFF20',      // Highlight
      selection: '#00FFFF40',      // Selection
      overlay: 'rgba(0,10,40,0.7)', // Overlay
      
      // Game-specific themes
      goldBadge: '#FFFF00',
      silverBadge: '#C0C0C0',
      bronzeBadge: '#FF8800',
      
      // Special cases
      progressTrack: '#0A0A22',     // Progress track
      progressIndicator: '#00FFFF', // Progress indicator
      scrollThumb: '#00FFFF',       // Scrollbar
      shadow: '#000033',            // Shadow
    },
    
    // Additional style parameters (same structure)
    sizes: {
      borderRadius: {
        sm: 0,  // More angular corners for cyberpunk
        md: 0,
        lg: 4,
        xl: 8,
        pill: 9999,
      },
      fontSize: {
        xs: 10, 
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
        xxxl: 30,
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
      },
      iconSize: {
        sm: 16,
        md: 24,
        lg: 32,
        xl: 48,
      },
    },
  },
  
  stealth: {
    name: 'stealth',
    colors: {
      // Base colors
      primary: '#45B69C',          // Teal
      secondary: '#6C63FF',        // Indigo
      accent: '#FF8F70',           // Coral
      
      // Background colors
      background: '#0A0A0A',       // Near black
      surface: '#141414',          // Dark card
      surfaceHighlight: '#1A1A1A', // Highlighted card
      
      // Content/Text colors
      text: '#E0E0E0',             // Light gray
      textSecondary: '#999999',    // Medium gray
      textMuted: '#666666',        // Dark gray
      textInverse: '#0A0A0A',      // Inverted (dark) text
      
      // Status colors
      success: '#45B69C',          // Success (teal)
      warning: '#FFBB55',          // Warning
      error: '#FF5252',            // Error
      info: '#6C63FF',             // Info
      
      // UI element colors
      border: '#222222',           // Border
      divider: '#1A1A1A',          // Divider
      icon: '#999999',             // Icon
      disabled: '#444444',         // Disabled
      placeholder: '#555555',      // Placeholder
      
      // Input field colors
      inputBackground: '#0F0F0F',  // Input background
      inputText: '#E0E0E0',        // Input text
      inputBorder: '#222222',      // Input border
      inputFocus: '#45B69C',       // Input focus
      
      // Button colors
      buttonPrimary: '#45B69C',    // Primary button
      buttonSecondary: '#333333',  // Secondary button
      buttonSuccess: '#45B69C',    // Success button
      buttonDanger: '#FF5252',     // Danger button
      buttonText: '#FFFFFF',       // Button text
      
      // Navigation
      tabActive: '#45B69C',        // Active tab
      tabInactive: '#6B8A84',      // Inactive tab
      tabBackground: '#0D0D0D',    // Tab background
      headerBackground: '#0F0F0F', // Header background
      
      // Gradients
      primaryGradient: ['#45B69C', '#3A9883'],
      secondaryGradient: ['#6C63FF', '#554FCC'],
      headerGradient: ['#141414', '#0A0A0A'],
      cardGradient: ['#141414', '#1A1A1A'],
      
      // Specific component colors
      modal: '#141414',            // Modal
      toast: '#141414',            // Toast
      tooltip: '#222222',          // Tooltip
      menu: '#0F0F0F',             // Menu
      
      // Special elements
      highlight: '#45B69C20',      // Highlight
      selection: '#45B69C40',      // Selection
      overlay: 'rgba(0,0,0,0.8)',  // Overlay
      
      // Game-specific themes
      goldBadge: '#DFC770',
      silverBadge: '#B0B0B0',
      bronzeBadge: '#BE7F4D',
      
      // Special cases
      progressTrack: '#222222',     // Progress track
      progressIndicator: '#45B69C', // Progress indicator
      scrollThumb: '#333333',       // Scrollbar
      shadow: '#000000',            // Shadow
    },
    
    // Additional style parameters
    sizes: {
      borderRadius: {
        sm: 2,
        md: 4,
        lg: 6,
        xl: 10,
        pill: 9999,
      },
      fontSize: {
        xs: 10, 
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
        xxxl: 30,
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
      },
      iconSize: {
        sm: 16,
        md: 24,
        lg: 32,
        xl: 48,
      },
    },
  },
};

// Create theme context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [themeName, setThemeName] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved theme on startup
  useEffect(() => {
    async function loadTheme() {
      try {
        const savedTheme = await SecureStore.getItemAsync('userTheme');
        if (savedTheme && themes[savedTheme]) {
          setThemeName(savedTheme);
        } else {
          // Default to system theme or dark if system theme is not supported
          setThemeName(deviceTheme === 'dark' || deviceTheme === 'light' ? 'dark' : 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme', error);
        // Default to dark theme if there's an error
        setThemeName('dark');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTheme();
  }, [deviceTheme]);
  
  // Save theme when changed
  useEffect(() => {
    if (!isLoading) {
      SecureStore.setItemAsync('userTheme', themeName);
    }
  }, [themeName, isLoading]);
  
  const theme = themes[themeName] || themes.dark;
  
  const setTheme = (name) => {
    if (themes[name]) {
      setThemeName(name);
    }
  };
  
  const getAvailableThemes = () => {
    return Object.keys(themes).map(key => ({
      name: key,
      displayName: key.charAt(0).toUpperCase() + key.slice(1),
      colors: themes[key].colors
    }));
  };
  
  return (
    <ThemeContext.Provider value={{ 
      theme,
      themeName,
      setTheme,
      getAvailableThemes,
      isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
