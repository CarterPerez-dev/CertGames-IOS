// src/context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Define available themes
const themes = {
  dark: {
    name: 'dark',
    colors: {
      primary: '#6543CC',       // Purple
      secondary: '#FF4C8B',     // Pink
      accent: '#2ECC71',        // Green
      background: '#121212',    // Dark background
      card: '#1E1E1E',          // Card background
      text: '#FFFFFF',          // White text
      subtext: '#AAAAAA',       // Gray subtitle text
      border: '#333333',        // Border color
      notification: '#FF4C8B',  // Notification color
      success: '#2ECC71',       // Success color
      warning: '#F39C12',       // Warning color
      error: '#E74C3C',         // Error color
      disabled: '#666666',      // Disabled state
    }
  },
  purple: {
    name: 'purple',
    colors: {
      primary: '#8A64FF',       // Lighter Purple
      secondary: '#FF6B9B',     // Lighter Pink
      accent: '#55D98D',        // Lighter Green
      background: '#16132B',    // Purple-tinted dark background
      card: '#251D4C',          // Purple-tinted card
      text: '#FFFFFF',          // White text
      subtext: '#BBBBBB',       // Light gray subtitle text
      border: '#392D70',        // Purple border
      notification: '#FF6B9B',  // Notification color
      success: '#55D98D',       // Success color
      warning: '#FFBB55',       // Warning color
      error: '#FF6666',         // Error color
      disabled: '#666680',      // Disabled state
    }
  },
  cyberpunk: {
    name: 'cyberpunk',
    colors: {
      primary: '#00FFFF',       // Cyan
      secondary: '#FF00FF',     // Magenta
      accent: '#FFFF00',        // Yellow
      background: '#0D0D2B',    // Dark blue background
      card: '#1A1A40',          // Dark blue card
      text: '#FFFFFF',          // White text
      subtext: '#BBBBBB',       // Light gray subtitle text
      border: '#00FFFF',        // Cyan border
      notification: '#FF00FF',  // Notification color
      success: '#00FF00',       // Success color
      warning: '#FFFF00',       // Warning color
      error: '#FF0000',         // Error color
      disabled: '#555580',      // Disabled state
    }
  },
  stealth: {
    name: 'stealth',
    colors: {
      primary: '#45B69C',       // Teal
      secondary: '#6C63FF',     // Indigo
      accent: '#FF8F70',        // Coral
      background: '#0A0A0A',    // Very dark background
      card: '#141414',          // Very dark card
      text: '#E0E0E0',          // Light gray text
      subtext: '#999999',       // Medium gray subtitle text
      border: '#222222',        // Nearly black border
      notification: '#6C63FF',  // Notification color
      success: '#45B69C',       // Success color
      warning: '#FFBB55',       // Warning color
      error: '#FF5252',         // Error color
      disabled: '#444444',      // Disabled state
    }
  },
};

// Create context
const ThemeContext = createContext();

// Theme provider
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
