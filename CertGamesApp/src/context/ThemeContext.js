// src/context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Define available themes with comprehensive properties
const themes = {
  // Default theme: Dark black background with dark purple primary color
  dark: {
    name: 'dark',
    displayName: 'Dark Purple',
    colors: {
      // Base colors
      primary: '#6A1B9A',          // Dark purple
      secondary: '#4527A0',        // Dark indigo
      accent: '#2ECC71',           // Green accent for success/positive actions
      
      // Background colors
      background: '#0A0A0A',       // Matte black main app background
      surface: '#121212',          // Elevated UI elements (cards, etc)
      surfaceHighlight: '#1E1E1E', // Highlighted surface elements
      
      // Content/Text colors
      text: '#FFFFFF',             // Primary text
      textSecondary: '#B0B0B0',    // Secondary text (subtitles, etc)
      textMuted: '#808080',        // Muted text (hints, inactive states)
      textInverse: '#000000',      // Text on colored backgrounds
      
      // Status colors
      success: '#2EBB77',          // Success color
      warning: '#F39C12',          // Warning color
      error: '#E74C3C',            // Error color
      info: '#3498DB',             // Info color
      
      // UI element colors
      border: '#333333',           // Border color
      divider: '#222222',          // Divider color (subtler than border)
      icon: '#BBBBBB',             // Icon color
      disabled: '#555555',         // Disabled state
      placeholder: '#555555',      // Placeholder text color
      
      // Input field colors
      inputBackground: '#1A1A1A',  // Input field background
      inputText: '#FFFFFF',        // Input text color
      inputBorder: '#333333',      // Input border color
      inputFocus: '#6A1B9A',       // Input focus color
      
      // Button colors
      buttonPrimary: '#6A1B9A',    // Primary button color
      buttonSecondary: '#333333',  // Secondary button color
      buttonSuccess: '#2EBB77',    // Success button color
      buttonDanger: '#E74C3C',     // Danger/delete button color
      buttonText: '#FFFFFF',       // Button text color
      
      // Navigation
      tabActive: '#6A1B9A',        // Active tab color
      tabInactive: '#666666',      // Inactive tab color
      tabBackground: '#0A0A0A',    // Tab bar background
      headerBackground: '#121212', // Header background
      
      // Gradients (start and end colors)
      primaryGradient: ['#6A1B9A', '#4527A0'],
      secondaryGradient: ['#4527A0', '#311B92'],
      headerGradient: ['#121212', '#0A0A0A'],
      cardGradient: ['#1A1A1A', '#121212'],
      
      // Specific component colors
      modal: '#121212',            // Modal background
      toast: '#1A1A1A',            // Toast notification background
      tooltip: '#333333',          // Tooltip background
      menu: '#151515',             // Menu/dropdown background
      
      // App-specific card colors
      testCard: '#4A148C',         // Dark purple for test cards (slightly darker than primary)
      toolCard: '#303F9F',         // Dark blue for tool cards
      
      // Special elements
      highlight: '#6A1B9A20',      // Highlight color (with opacity)
      selection: '#6A1B9A40',      // Selected item background
      overlay: 'rgba(0,0,0,0.8)',  // Overlay for modals, etc
      
      // Game-specific themes
      goldBadge: '#FFD700',
      silverBadge: '#C0C0C0', 
      bronzeBadge: '#CD7F32',
      
      // Special cases
      progressTrack: '#333333',     // Progress bar background
      progressIndicator: '#6A1B9A', // Progress bar fill
      scrollThumb: '#333333',       // Scrollbar thumb
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
  
  // Modern Monochrome: Black & White theme
  monochrome: {
    name: 'monochrome',
    displayName: 'Monochrome',
    colors: {
      // Base colors
      primary: '#FFFFFF',          // White
      secondary: '#AAAAAA',        // Light gray
      accent: '#FFFFFF',           // White accent
      
      // Background colors
      background: '#0A0A0A',       // Matte black main app background
      surface: '#151515',          // Elevated UI elements
      surfaceHighlight: '#202020', // Highlighted surface elements
      
      // Content/Text colors
      text: '#FFFFFF',             // Primary text
      textSecondary: '#BBBBBB',    // Secondary text
      textMuted: '#888888',        // Muted text
      textInverse: '#000000',      // Text on colored backgrounds
      
      // Status colors
      success: '#AAAAAA',          // Success (light gray)
      warning: '#CCCCCC',          // Warning (medium gray)
      error: '#FFFFFF',            // Error (white)
      info: '#DDDDDD',             // Info (light gray)
      
      // UI element colors
      border: '#333333',           // Border color
      divider: '#222222',          // Divider color
      icon: '#FFFFFF',             // Icon color
      disabled: '#444444',         // Disabled state
      placeholder: '#555555',      // Placeholder text color
      
      // Input field colors
      inputBackground: '#1A1A1A',  // Input field background
      inputText: '#FFFFFF',        // Input text color
      inputBorder: '#333333',      // Input border color
      inputFocus: '#FFFFFF',       // Input focus color
      
      // Button colors
      buttonPrimary: '#FFFFFF',    // Primary button color
      buttonSecondary: '#333333',  // Secondary button color
      buttonSuccess: '#BBBBBB',    // Success button color
      buttonDanger: '#DDDDDD',     // Danger/delete button color
      buttonText: '#000000',       // Button text color (black on white)
      
      // Navigation
      tabActive: '#FFFFFF',        // Active tab color
      tabInactive: '#666666',      // Inactive tab color
      tabBackground: '#0A0A0A',    // Tab bar background
      headerBackground: '#151515', // Header background
      
      // Gradients
      primaryGradient: ['#000000', '#cccccc'],
      secondaryGradient: ['#AAAAAA', '#888888'],
      headerGradient: ['#151515', '#0A0A0A'],
      cardGradient: ['#1A1A1A', '#101010'],
      
      // Specific component colors
      modal: '#151515',            // Modal background
      toast: '#1A1A1A',            // Toast notification background
      tooltip: '#333333',          // Tooltip background
      menu: '#151515',             // Menu/dropdown background
      
      // App-specific card colors
      testCard: '#FFFFFF',         // white for test cards
      toolCard: '#D9D9D9',         // light gray for tool cards
      
      // Special elements
      highlight: '#FFFFFF20',      // Highlight color (with opacity)
      selection: '#FFFFFF40',      // Selected item background
      overlay: 'rgba(0,0,0,0.8)',  // Overlay for modals, etc
      
      // Game-specific themes
      goldBadge: '#FFFFFF',        // White for monochrome
      silverBadge: '#BBBBBB',      // Gray for monochrome
      bronzeBadge: '#888888',      // Darker gray for monochrome
      
      // Special cases
      progressTrack: '#333333',     // Progress bar background
      progressIndicator: '#FFFFFF', // Progress bar fill
      scrollThumb: '#333333',       // Scrollbar thumb
      shadow: '#000000',            // Shadow color
    },
    
    // Additional style parameters - same sizes
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
  
  // Hacker: Dark background with neon green
  hacker: {
    name: 'hacker',
    displayName: 'Terminal',
    colors: {
      // Base colors
      primary: '#00B894',          // Matte green (not too bright)
      secondary: '#00896D',        // Darker green
      accent: '#55EEBB',           // Lighter green accent
      
      // Background colors
      background: '#0A0A0A',       // Very dark background (almost black)
      surface: '#0F1010',          // Dark surface with slight green tint
      surfaceHighlight: '#141915', // Highlighted surface with green tint
      
      // Content/Text colors
      text: '#E5E5E5',             // Off-white text
      textSecondary: '#AAAAAA',    // Light gray text
      textMuted: '#777777',        // Medium gray text
      textInverse: '#000000',      // Black text for contrast on green
      
      // Status colors
      success: '#00B894',          // Success (same as primary)
      warning: '#F39C12',          // Warning (amber)
      error: '#E74C3C',            // Error (red)
      info: '#3498DB',             // Info (blue)
      
      // UI element colors
      border: '#1E2A20',           // Border with slight green tint
      divider: '#151B17',          // Divider with slight green tint
      icon: '#00B894',             // Icon - primary green
      disabled: '#444444',         // Disabled state
      placeholder: '#555555',      // Placeholder text color
      
      // Input field colors
      inputBackground: '#0F1411',  // Input background with slight green tint
      inputText: '#E5E5E5',        // Input text
      inputBorder: '#1E2A20',      // Input border
      inputFocus: '#00B894',       // Input focus - primary green
      
      // Button colors
      buttonPrimary: '#00B894',    // Primary button - same as primary
      buttonSecondary: '#151B17',  // Secondary button - dark with green tint
      buttonSuccess: '#00B894',    // Success button - same as primary
      buttonDanger: '#E74C3C',     // Danger button - red
      buttonText: '#FFFFFF',       // Button text - white
      
      // Navigation
      tabActive: '#00B894',        // Active tab - primary green
      tabInactive: '#555555',      // Inactive tab - gray
      tabBackground: '#0A0A0A',    // Tab bar background - dark
      headerBackground: '#0F1010', // Header background - dark surface
      
      // Gradients
      primaryGradient: ['#00B894', '#00896D'],
      secondaryGradient: ['#00896D', '#006A56'],
      headerGradient: ['#0F1411', '#0A0A0A'],
      cardGradient: ['#0F1411', '#090A09'],
      
      // Specific component colors
      modal: '#0F1411',            // Modal background
      toast: '#0F1411',            // Toast background
      tooltip: '#1E2A20',          // Tooltip background
      menu: '#0F1411',             // Menu background
      
      // App-specific card colors
      testCard: '#003E31',         // Dark green for test cards
      toolCard: '#00261D',         // Even darker green for tool cards
      
      // Special elements
      highlight: '#00B89420',      // Highlight with opacity
      selection: '#00B89440',      // Selection with opacity
      overlay: 'rgba(0,0,0,0.8)',  // Dark overlay
      
      // Game-specific themes
      goldBadge: '#00FF9D',        // Neon green for gold
      silverBadge: '#55EEBB',      // Lighter green for silver
      bronzeBadge: '#00B894',      // Primary green for bronze
      
      // Special cases
      progressTrack: '#151B17',     // Progress track - darker green
      progressIndicator: '#00B894', // Progress indicator - primary green
      scrollThumb: '#1E2A20',       // Scrollbar thumb - border color
      shadow: '#000000',            // Shadow - black
    },
    
    sizes: {
      borderRadius: {
        sm: 2, // Sharper corners for terminal look
        md: 4,
        lg: 8,
        xl: 12,
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
  
  // Light Mode: White background with black text
  light: {
    name: 'light',
    displayName: 'Light',
    colors: {
      // Base colors
      primary: '#212121',          // Almost black
      secondary: '#424242',        // Dark gray
      accent: '#757575',           // Medium gray
      
      // Background colors
      background: '#FFFFFF',       // White main background
      surface: '#F5F5F5',          // Light gray surface
      surfaceHighlight: '#EEEEEE', // Slightly darker surface for highlights
      
      // Content/Text colors
      text: '#212121',             // Near black text
      textSecondary: '#616161',    // Dark gray secondary text
      textMuted: '#9E9E9E',        // Medium gray muted text
      textInverse: '#FFFFFF',      // White text for dark backgrounds
      
      // Status colors
      success: '#2ECC71',          // Success (green)
      warning: '#F39C12',          // Warning (amber)
      error: '#E74C3C',            // Error (red)
      info: '#3498DB',             // Info (blue)
      
      // UI element colors
      border: '#E0E0E0',           // Light gray border
      divider: '#EEEEEE',          // Very light gray divider
      icon: '#757575',             // Medium gray icon
      disabled: '#BDBDBD',         // Light gray disabled
      placeholder: '#9E9E9E',      // Medium gray placeholder
      
      // Input field colors
      inputBackground: '#FFFFFF',  // White input background
      inputText: '#212121',        // Black input text
      inputBorder: '#E0E0E0',      // Light gray input border
      inputFocus: '#212121',       // Black input focus
      
      // Button colors
      buttonPrimary: '#212121',    // Black primary button
      buttonSecondary: '#F5F5F5',  // Light gray secondary button
      buttonSuccess: '#2ECC71',    // Green success button
      buttonDanger: '#E74C3C',     // Red danger button
      buttonText: '#FFFFFF',       // White button text
      
      // Navigation
      tabActive: '#212121',        // Black active tab
      tabInactive: '#9E9E9E',      // Gray inactive tab
      tabBackground: '#FFFFFF',    // White tab background
      headerBackground: '#F5F5F5', // Light gray header
      
      // Gradients
      primaryGradient: ['#FFFFFF', '#424242'],
      secondaryGradient: ['#424242', '#616161'],
      headerGradient: ['#F5F5F5', '#FFFFFF'],
      cardGradient: ['#F5F5F5', '#FFFFFF'],
      
      // Specific component colors
      modal: '#FFFFFF',            // White modal
      toast: '#F5F5F5',            // Light gray toast
      tooltip: '#212121',          // Black tooltip
      menu: '#FFFFFF',             // White menu
      
      // App-specific card colors
      testCard: '#212121',         // Black test cards
      toolCard: '#424242',         // Dark gray tool cards
      
      // Special elements
      highlight: '#21212120',      // Black highlight with opacity
      selection: '#21212140',      // Black selection with opacity
      overlay: 'rgba(0,0,0,0.6)',  // Dark overlay
      
      // Game-specific themes
      goldBadge: '#FFC107',        // Gold
      silverBadge: '#9E9E9E',      // Silver
      bronzeBadge: '#A1887F',      // Bronze
      
      // Special cases
      progressTrack: '#E0E0E0',     // Light gray progress track
      progressIndicator: '#212121', // Black progress indicator
      scrollThumb: '#BDBDBD',       // Gray scrollbar thumb
      shadow: '#000000',            // Black shadow
    },
    
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
};

// Create theme context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [themeName, setThemeName] = useState('dark'); // Default to dark theme
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved theme on startup
  useEffect(() => {
    async function loadTheme() {
      try {
        const savedTheme = await SecureStore.getItemAsync('userTheme');
        if (savedTheme && themes[savedTheme]) {
          setThemeName(savedTheme);
        } else {
          // Default to dark theme if no saved theme
          setThemeName('dark');
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
  
  const theme = themes[themeName] || themes.dark; // Default fallback to dark theme
  
  const setTheme = (name) => {
    if (themes[name]) {
      setThemeName(name);
    }
  };
  
  const getAvailableThemes = () => {
    return Object.keys(themes).map(key => ({
      name: key,
      displayName: themes[key].displayName || key.charAt(0).toUpperCase() + key.slice(1),
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
