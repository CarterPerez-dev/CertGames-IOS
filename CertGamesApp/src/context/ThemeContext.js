// src/context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import responsive from '../utils/responsive';

// Define available themes with comprehensive properties
const themes = {
  // Default theme: Dark black background with dark purple primary color
  Amethyst: {
    name: 'Amethyst',
    displayName: 'Amethyst',
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
  
  // Dark Red/Orange theme
  Crimson: {
    name: 'Crimson',
    displayName: 'Crimson',
    colors: {
      // Base colors
      primary: '#C62828',          // Dark red
      secondary: '#D84315',        // Dark orange/red
      accent: '#FF5722',           // Orange accent
      
      // Background colors - same dark structure as dark purple
      background: '#0A0A0A',       // Matte black main app background
      surface: '#121212',          // Elevated UI elements (cards, etc)
      surfaceHighlight: '#1E1E1E', // Highlighted surface elements
      
      // Content/Text colors - same as dark purple
      text: '#FFFFFF',             // Primary text
      textSecondary: '#B0B0B0',    // Secondary text (subtitles, etc)
      textMuted: '#808080',        // Muted text (hints, inactive states)
      textInverse: '#000000',      // Text on colored backgrounds
      
      // Status colors - same as dark purple
      success: '#2EBB77',          // Success color
      warning: '#F39C12',          // Warning color
      error: '#E74C3C',            // Error color
      info: '#3498DB',             // Info color
      
      // UI element colors - same structure as dark purple
      border: '#333333',           // Border color
      divider: '#222222',          // Divider color (subtler than border)
      icon: '#BBBBBB',             // Icon color
      disabled: '#555555',         // Disabled state
      placeholder: '#555555',      // Placeholder text color
      
      // Input field colors - same structure as dark purple
      inputBackground: '#1A1A1A',  // Input field background
      inputText: '#FFFFFF',        // Input text color
      inputBorder: '#333333',      // Input border color
      inputFocus: '#C62828',       // Input focus color - using primary
      
      // Button colors - adapted to new colors
      buttonPrimary: '#C62828',    // Primary button color
      buttonSecondary: '#333333',  // Secondary button color
      buttonSuccess: '#2EBB77',    // Success button color
      buttonDanger: '#E74C3C',     // Danger/delete button color
      buttonText: '#FFFFFF',       // Button text color
      
      // Navigation - adapted to new colors
      tabActive: '#C62828',        // Active tab color
      tabInactive: '#666666',      // Inactive tab color
      tabBackground: '#0A0A0A',    // Tab bar background
      headerBackground: '#121212', // Header background
      
      // Gradients (start and end colors) - adapted to new colors
      primaryGradient: ['#C62828', '#D84315'],
      secondaryGradient: ['#D84315', '#BF360C'],
      headerGradient: ['#121212', '#0A0A0A'],
      cardGradient: ['#1A1A1A', '#121212'],
      
      // Specific component colors - same structure as dark purple
      modal: '#121212',            // Modal background
      toast: '#1A1A1A',            // Toast notification background
      tooltip: '#333333',          // Tooltip background
      menu: '#151515',             // Menu/dropdown background
      
      // App-specific card colors - adapted to new colors
      testCard: '#B71C1C',         // Darker red for test cards
      toolCard: '#BF360C',         // Darker orange for tool cards
      
      // Special elements - adapted to new colors
      highlight: '#C6282820',      // Highlight color (with opacity)
      selection: '#C6282840',      // Selected item background
      overlay: 'rgba(0,0,0,0.8)',  // Overlay for modals, etc
      
      // Game-specific themes - same as dark purple
      goldBadge: '#FFD700',
      silverBadge: '#C0C0C0', 
      bronzeBadge: '#CD7F32',
      
      // Special cases - adapted to new colors
      progressTrack: '#333333',     // Progress bar background
      progressIndicator: '#C62828', // Progress bar fill
      scrollThumb: '#333333',       // Scrollbar thumb
      shadow: '#000000',            // Shadow color
    },
    
    // Same sizes as dark purple
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
  
  // Dark Green/Cyan theme
  Emerald: {
    name: 'Emerald',
    displayName: 'Emerald',
    colors: {
      // Base colors
      primary: '#00695C',          // Dark teal/green
      secondary: '#00838F',        // Dark cyan
      accent: '#4CAF50',           // Green accent
      
      // Background colors - same dark structure as dark purple
      background: '#0A0A0A',       // Matte black main app background
      surface: '#121212',          // Elevated UI elements (cards, etc)
      surfaceHighlight: '#1E1E1E', // Highlighted surface elements
      
      // Content/Text colors - same as dark purple
      text: '#FFFFFF',             // Primary text
      textSecondary: '#B0B0B0',    // Secondary text (subtitles, etc)
      textMuted: '#808080',        // Muted text (hints, inactive states)
      textInverse: '#000000',      // Text on colored backgrounds
      
      // Status colors - same as dark purple
      success: '#2EBB77',          // Success color
      warning: '#F39C12',          // Warning color
      error: '#E74C3C',            // Error color
      info: '#3498DB',             // Info color
      
      // UI element colors - same structure as dark purple
      border: '#333333',           // Border color
      divider: '#222222',          // Divider color (subtler than border)
      icon: '#BBBBBB',             // Icon color
      disabled: '#555555',         // Disabled state
      placeholder: '#555555',      // Placeholder text color
      
      // Input field colors - same structure as dark purple
      inputBackground: '#1A1A1A',  // Input field background
      inputText: '#FFFFFF',        // Input text color
      inputBorder: '#333333',      // Input border color
      inputFocus: '#00695C',       // Input focus color - using primary
      
      // Button colors - adapted to new colors
      buttonPrimary: '#00695C',    // Primary button color
      buttonSecondary: '#333333',  // Secondary button color
      buttonSuccess: '#2EBB77',    // Success button color
      buttonDanger: '#E74C3C',     // Danger/delete button color
      buttonText: '#FFFFFF',       // Button text color
      
      // Navigation - adapted to new colors
      tabActive: '#00695C',        // Active tab color
      tabInactive: '#666666',      // Inactive tab color
      tabBackground: '#0A0A0A',    // Tab bar background
      headerBackground: '#121212', // Header background
      
      // Gradients (start and end colors) - adapted to new colors
      primaryGradient: ['#00695C', '#00838F'],
      secondaryGradient: ['#00838F', '#006064'],
      headerGradient: ['#121212', '#0A0A0A'],
      cardGradient: ['#1A1A1A', '#121212'],
      
      // Specific component colors - same structure as dark purple
      modal: '#121212',            // Modal background
      toast: '#1A1A1A',            // Toast notification background
      tooltip: '#333333',          // Tooltip background
      menu: '#151515',             // Menu/dropdown background
      
      // App-specific card colors - adapted to new colors
      testCard: '#004D40',         // Dark green for test cards
      toolCard: '#006064',         // Dark cyan for tool cards
      
      // Special elements - adapted to new colors
      highlight: '#00695C20',      // Highlight color (with opacity)
      selection: '#00695C40',      // Selected item background
      overlay: 'rgba(0,0,0,0.8)',  // Overlay for modals, etc
      
      // Game-specific themes - same as dark purple
      goldBadge: '#FFD700',
      silverBadge: '#C0C0C0', 
      bronzeBadge: '#CD7F32',
      
      // Special cases - adapted to new colors
      progressTrack: '#333333',     // Progress bar background
      progressIndicator: '#00695C', // Progress bar fill
      scrollThumb: '#333333',       // Scrollbar thumb
      shadow: '#000000',            // Shadow color
    },
    
    // Same sizes as dark purple
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
  Monochrome: {
    name: 'Monochrome',
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
};

// Apply responsive scaling to all theme sizes
Object.keys(themes).forEach(themeName => {
  // Scale font sizes
  Object.keys(themes[themeName].sizes.fontSize).forEach(key => {
    const originalSize = themes[themeName].sizes.fontSize[key];
    themes[themeName].sizes.fontSize[key] = responsive.isTablet 
      ? Math.min(originalSize * 1.2, originalSize + 4) // Limit growth on tablets
      : Math.max(originalSize * (responsive.width / 390), originalSize * 0.85); // Scale based on device width with minimum
  });
  
  // Scale border radius
  Object.keys(themes[themeName].sizes.borderRadius).forEach(key => {
    const originalRadius = themes[themeName].sizes.borderRadius[key];
    themes[themeName].sizes.borderRadius[key] = responsive.scale(originalRadius);
  });
  
  // Scale spacing
  Object.keys(themes[themeName].sizes.spacing).forEach(key => {
    const originalSpacing = themes[themeName].sizes.spacing[key];
    themes[themeName].sizes.spacing[key] = responsive.scaleWidth(originalSpacing);
  });
  
  // Scale icon sizes
  Object.keys(themes[themeName].sizes.iconSize).forEach(key => {
    const originalSize = themes[themeName].sizes.iconSize[key];
    themes[themeName].sizes.iconSize[key] = responsive.scale(originalSize);
  });
});

// Create theme context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [themeName, setThemeName] = useState('Amethyst'); // Default to dark theme
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
          setThemeName('Amethyst');
        }
      } catch (error) {
        console.error('Failed to load theme', error);
        // Default to dark theme if there's an error
        setThemeName('Amethyst');
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
  
  const theme = themes[themeName] || themes.Amethyst; // Default fallback to dark theme
  
  // Add responsive information to the theme
  const responsiveTheme = {
    ...theme,
    responsive: responsive,
  };
  
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
      theme: responsiveTheme,
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
