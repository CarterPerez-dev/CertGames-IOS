// src/utils/responsive.js
import { Dimensions, Platform, StatusBar, PixelRatio } from 'react-native';

// Device screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Check if the device is a tablet (iPad)
const IS_TABLET = SCREEN_WIDTH >= 768;

// Base dimensions - we'll use iPhone 13 Pro as our base (width: 390)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Scale factor for dynamic scaling
const SCALE_FACTOR = SCREEN_WIDTH / BASE_WIDTH;

// Scaled size for fonts and dimensions
const scale = (size) => {
  const newSize = size * SCALE_FACTOR;
  
  // Limit scaling for tablets to avoid overly large UI elements
  if (IS_TABLET && newSize > size * 1.4) {
    return size * 1.4;
  }
  
  // Limit downscaling for small devices to ensure readability
  if (newSize < size * 0.8) {
    return size * 0.8;
  }
  
  return newSize;
};

// For fonts, use a more moderate scaling
const scaleFont = (size) => {
  const scaledSize = scale(size);
  
  // Prevent fonts from becoming too large on tablets
  if (IS_TABLET && scaledSize > size * 1.25) {
    return size * 1.25;
  }
  
  return scaledSize;
};

// For horizontal spacing, ensure it scales well
const scaleWidth = (size) => scale(size);

// For vertical spacing, use a modified scale based on height ratio
const scaleHeight = (size) => {
  const heightRatio = SCREEN_HEIGHT / BASE_HEIGHT;
  
  // Use a milder scale for height to prevent excessive stretching
  const scaleFactor = (SCALE_FACTOR + heightRatio) / 2;
  
  // Apply the scaling, with limits
  let newSize = size * scaleFactor;
  
  // Limit scaling for tablets to avoid overly stretched UI
  if (IS_TABLET && newSize > size * 1.3) {
    return size * 1.3;
  }
  
  // Limit downscaling for small devices
  if (newSize < size * 0.85) {
    return size * 0.85;
  }
  
  return newSize;
};

// Safe area insets - default values where we can't detect dynamically
const SAFE_AREA = {
  top: Platform.OS === 'ios' ? (IS_TABLET ? 24 : 47) : StatusBar.currentHeight || 0,
  bottom: Platform.OS === 'ios' ? (IS_TABLET ? 20 : 34) : 0,
  left: 0,
  right: 0,
};

// Responsive dimensions to use in your app
export const responsive = {
  // Dimension utilities
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isTablet: IS_TABLET,
  
  // Scaling utilities
  scale,
  scaleFont,  // Added this function that was missing
  scaleWidth,
  scaleHeight,
  
  // Safe area values
  safeArea: SAFE_AREA,
};

export default responsive;
