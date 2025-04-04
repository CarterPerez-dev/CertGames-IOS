// src/styles/globalStyles.js
import { StyleSheet, Platform } from 'react-native';

/**
 * Creates global styles based on the current theme
 * @param {Object} theme - The current theme object from ThemeContext
 * @returns {Object} StyleSheet with global styles
 */
export const createGlobalStyles = (theme) => {
  const { responsive } = theme;
  
  // Get safe area insets for iOS devices
  const safeArea = {
    top: responsive?.safeArea?.top ?? (Platform.OS === 'ios' ? 47 : 0),
    bottom: responsive?.safeArea?.bottom ?? (Platform.OS === 'ios' ? 34 : 0)
  };
  
  return StyleSheet.create({
    // Screen containers
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
      // Add support for safe area
      paddingTop: Platform.OS === 'ios' ? safeArea.top : 0,
    },
    container: {
      padding: responsive ? responsive.scaleWidth(theme.sizes.spacing.md) : theme.sizes.spacing.md,
    },
    safeContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: safeArea.top,
      paddingBottom: safeArea.bottom,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: responsive ? responsive.scaleWidth(16) : 16,
      paddingBottom: responsive ? responsive.scaleHeight(24) : 24,
    },
    
    // Typography
    text: {
      color: theme.colors.text,
      fontSize: theme.sizes.fontSize.md,
    },
    textSecondary: {
      color: theme.colors.textSecondary,
      fontSize: theme.sizes.fontSize.md,
    },
    textMuted: {
      color: theme.colors.textMuted,
      fontSize: theme.sizes.fontSize.sm,
    },
    title: {
      color: theme.colors.text,
      fontSize: theme.sizes.fontSize.xl,
      fontWeight: 'bold',
      marginVertical: responsive ? responsive.scaleHeight(theme.sizes.spacing.sm) : theme.sizes.spacing.sm,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.sizes.fontSize.lg,
      fontWeight: '500',
      marginBottom: responsive ? responsive.scaleHeight(theme.sizes.spacing.sm) : theme.sizes.spacing.sm,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: theme.sizes.fontSize.lg,
      fontWeight: 'bold',
      marginVertical: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
    },
    
    // Cards and content containers
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.sizes.borderRadius.lg,
      padding: responsive ? responsive.scaleWidth(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      marginBottom: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHighlight: {
      backgroundColor: theme.colors.surfaceHighlight,
      borderRadius: theme.sizes.borderRadius.lg,
      padding: responsive ? responsive.scaleWidth(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      marginBottom: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    
    // Buttons
    button: {
      paddingVertical: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      paddingHorizontal: responsive ? responsive.scaleWidth(theme.sizes.spacing.lg) : theme.sizes.spacing.lg,
      borderRadius: theme.sizes.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: responsive ? responsive.scaleHeight(48) : 48, // Minimum touchable height
    },
    buttonPrimary: {
      backgroundColor: theme.colors.buttonPrimary,
      paddingVertical: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      paddingHorizontal: responsive ? responsive.scaleWidth(theme.sizes.spacing.lg) : theme.sizes.spacing.lg,
      borderRadius: theme.sizes.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: responsive ? responsive.scaleHeight(48) : 48, // Minimum touchable height
    },
    buttonSecondary: {
      backgroundColor: theme.colors.buttonSecondary,
      paddingVertical: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      paddingHorizontal: responsive ? responsive.scaleWidth(theme.sizes.spacing.lg) : theme.sizes.spacing.lg,
      borderRadius: theme.sizes.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: responsive ? responsive.scaleHeight(48) : 48, // Minimum touchable height
    },
    buttonSuccess: {
      backgroundColor: theme.colors.buttonSuccess,
      paddingVertical: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      paddingHorizontal: responsive ? responsive.scaleWidth(theme.sizes.spacing.lg) : theme.sizes.spacing.lg,
      borderRadius: theme.sizes.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: responsive ? responsive.scaleHeight(48) : 48, // Minimum touchable height
    },
    buttonDanger: {
      backgroundColor: theme.colors.buttonDanger,
      paddingVertical: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      paddingHorizontal: responsive ? responsive.scaleWidth(theme.sizes.spacing.lg) : theme.sizes.spacing.lg,
      borderRadius: theme.sizes.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: responsive ? responsive.scaleHeight(48) : 48, // Minimum touchable height
    },
    buttonText: {
      color: theme.colors.buttonText,
      fontSize: theme.sizes.fontSize.md,
      fontWeight: '600',
    },
    
    // Inputs
    input: {
      backgroundColor: theme.colors.inputBackground,
      color: theme.colors.inputText,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: theme.sizes.borderRadius.md,
      padding: responsive ? responsive.scaleWidth(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      fontSize: theme.sizes.fontSize.md,
      minHeight: responsive ? responsive.scaleHeight(50) : 50, // Ensure consistent height across devices
    },
    
    // Dividers
    divider: {
      height: 1,
      backgroundColor: theme.colors.divider,
      marginVertical: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
    },
    
    // Lists
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      minHeight: responsive ? responsive.scaleHeight(60) : 60, // Minimum height for touch targets
    },
    
    // Icons
    icon: {
      color: theme.colors.icon,
    },
    
    // Loading states
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    
    // Error states
    errorContainer: {
      padding: responsive ? responsive.scaleWidth(theme.sizes.spacing.lg) : theme.sizes.spacing.lg,
      backgroundColor: 'rgba(231, 76, 60, 0.1)',
      borderRadius: theme.sizes.borderRadius.md,
      marginVertical: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.error,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: theme.sizes.fontSize.md,
    },
    
    // Success states
    successContainer: {
      padding: responsive ? responsive.scaleWidth(theme.sizes.spacing.lg) : theme.sizes.spacing.lg,
      backgroundColor: 'rgba(46, 204, 113, 0.1)',
      borderRadius: theme.sizes.borderRadius.md,
      marginVertical: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.success,
    },
    successText: {
      color: theme.colors.success,
      fontSize: theme.sizes.fontSize.md,
    },
    
    // Headers
    header: {
      backgroundColor: theme.colors.headerBackground,
      paddingTop: safeArea.top + (responsive ? responsive.scaleHeight(10) : 10),
      paddingBottom: responsive ? responsive.scaleHeight(15) : 15,
      paddingHorizontal: responsive ? responsive.scaleWidth(theme.sizes.spacing.lg) : theme.sizes.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      color: theme.colors.text,
      fontSize: theme.sizes.fontSize.xl,
      fontWeight: 'bold',
    },
    
    // Badges
    badge: {
      paddingHorizontal: responsive ? responsive.scaleWidth(theme.sizes.spacing.sm) : theme.sizes.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.sizes.borderRadius.pill,
      backgroundColor: theme.colors.primary,
    },
    badgeText: {
      color: theme.colors.textInverse,
      fontSize: theme.sizes.fontSize.xs,
      fontWeight: 'bold',
    },
    
    // Empty states
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: responsive ? responsive.scaleWidth(theme.sizes.spacing.xl) : theme.sizes.spacing.xl,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: theme.sizes.fontSize.md,
      textAlign: 'center',
      marginTop: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
    },
    
    // Grid layouts - responsive to different screen sizes
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginHorizontal: responsive ? -responsive.scaleWidth(4) : -4,
    },
    gridItem: {
      width: responsive?.isTablet ? '32%' : '48%', // 3 columns on iPad, 2 on iPhone
      marginHorizontal: responsive ? responsive.scaleWidth(4) : 4,
      marginBottom: responsive ? responsive.scaleHeight(theme.sizes.spacing.md) : theme.sizes.spacing.md,
    },
    
    // Tab bar styles - fixed to bottom
    tabBarStyle: {
      height: responsive ? responsive.scaleHeight(80) + safeArea.bottom : 80 + safeArea.bottom,
      paddingTop: responsive ? responsive.scaleHeight(12) : 12,
      paddingBottom: safeArea.bottom > 0 ? safeArea.bottom : (responsive ? responsive.scaleHeight(20) : 20),
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '80',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 8,
      // Make sure there's no margin that would allow seeing behind the tab bar
      marginBottom: 0,
    },
  });
};

export default createGlobalStyles;
