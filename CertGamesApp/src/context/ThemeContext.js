// src/context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme definitions
export const themes = {
  dark: {
    name: 'dark',
    background: '#0C0C11',
    backgroundAlt: '#1E1E1E',
    surface: 'rgba(30, 30, 40, 0.9)',
    surfaceAlt: '#2A2A2A',
    primary: '#6543CC',
    primaryGradient: ['#6543CC', '#8A58FC'],
    secondary: '#FF4C8B',
    secondaryGradient: ['#FF4C8B', '#FF7950'],
    accent: '#2EBB77',
    accentGradient: ['#27ae60', '#2EBB77'],
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    border: '#2A2C3D',
    danger: '#E74C3C',
    success: '#2EBB77',
    warning: '#F39C12',
    info: '#3498DB',
  },
  cyberpunk: {
    name: 'cyberpunk',
    background: '#0A0721',
    backgroundAlt: '#190F40',
    surface: 'rgba(25, 15, 64, 0.9)',
    surfaceAlt: '#291E5A',
    primary: '#8A58FC',
    primaryGradient: ['#6543CC', '#8A58FC'],
    secondary: '#FF007C',
    secondaryGradient: ['#FF007C', '#FF5252'],
    accent: '#00F2B8',
    accentGradient: ['#00CDC7', '#00F2B8'],
    text: '#FFFFFF',
    textSecondary: '#B8A8FF',
    border: '#3A2C73',
    danger: '#FF3D71',
    success: '#00F2B8',
    warning: '#FFAA00',
    info: '#00C2FF',
  },
  stealth: {
    name: 'stealth',
    background: '#121212',
    backgroundAlt: '#1F1F1F',
    surface: 'rgba(31, 31, 31, 0.9)',
    surfaceAlt: '#2D2D2D',
    primary: '#005CAF',
    primaryGradient: ['#004380', '#0077E0'],
    secondary: '#38B2AC',
    secondaryGradient: ['#2C8C86', '#38B2AC'],
    accent: '#BF5AF2',
    accentGradient: ['#9931D9', '#BF5AF2'],
    text: '#F8F9FA',
    textSecondary: '#9EA7BD',
    border: '#383838',
    danger: '#E74C3C',
    success: '#2ECC71',
    warning: '#F39C12',
    info: '#3498DB',
  },
  terminal: {
    name: 'terminal',
    background: '#101418',
    backgroundAlt: '#1C1E22',
    surface: 'rgba(28, 30, 34, 0.9)',
    surfaceAlt: '#262A2D',
    primary: '#00FF9D',
    primaryGradient: ['#00CC7D', '#00FF9D'],
    secondary: '#00BFFF',
    secondaryGradient: ['#0095CC', '#00BFFF'],
    accent: '#FF007C',
    accentGradient: ['#CC0063', '#FF007C'],
    text: '#FFFFFF',
    textSecondary: '#AAFFD2',
    border: '#2C3037',
    danger: '#FF3333',
    success: '#33FF99',
    warning: '#FFCC00',
    info: '#33CCFF',
  }
};

// Create context with default value
const ThemeContext = createContext({
  theme: themes.dark,
  setTheme: () => {},
  availableThemes: themes,
});

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(themes.dark);
  
  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme');
        if (savedTheme && themes[savedTheme]) {
          setTheme(themes[savedTheme]);
        }
      } catch (error) {
        console.error('Failed to load theme from storage:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Save theme whenever it changes
  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('userTheme', newTheme.name);
    } catch (error) {
      console.error('Failed to save theme to storage:', error);
    }
  };
  
  return (
    <ThemeContext.Provider 
      value={{ 
        theme,
        setTheme: changeTheme,
        availableThemes: themes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
