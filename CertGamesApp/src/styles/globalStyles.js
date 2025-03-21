// src/styles/globalStyles.js
import { StyleSheet } from 'react-native';

/**
 * Creates global styles based on the current theme
 * @param {Object} theme - The current theme object from ThemeContext
 * @returns {Object} StyleSheet with global styles
 */
export const createGlobalStyles = (theme) => {
  return StyleSheet.create({
    // Screen containers
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      padding: theme.sizes.spacing.md,
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
      marginVertical: theme.sizes.spacing.sm,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.sizes.fontSize.lg,
      fontWeight: '500',
      marginBottom: theme.sizes.spacing.sm,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: theme.sizes.fontSize.lg,
      fontWeight: 'bold',
      marginVertical: theme.sizes.spacing.md,
    },
    
    // Cards and content containers
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.sizes.borderRadius.lg,
      padding: theme.sizes.spacing.md,
      marginBottom: theme.sizes.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHighlight: {
      backgroundColor: theme.colors.surfaceHighlight,
      borderRadius: theme.sizes.borderRadius.lg,
      padding: theme.sizes.spacing.md,
      marginBottom: theme.sizes.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    
    // Buttons
    button: {
      paddingVertical: theme.sizes.spacing.md,
      paddingHorizontal: theme.sizes.spacing.lg,
      borderRadius: theme.sizes.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPrimary: {
      backgroundColor: theme.colors.buttonPrimary,
      paddingVertical: theme.sizes.spacing.md,
      paddingHorizontal: theme.sizes.spacing.lg,
      borderRadius: theme.sizes.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonSecondary: {
      backgroundColor: theme.colors.buttonSecondary,
      paddingVertical: theme.sizes.spacing.md,
      paddingHorizontal: theme.sizes.spacing.lg,
      borderRadius: theme.sizes.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonSuccess: {
      backgroundColor: theme.colors.buttonSuccess,
      paddingVertical: theme.sizes.spacing.md,
      paddingHorizontal: theme.sizes.spacing.lg,
      borderRadius: theme.sizes.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDanger: {
      backgroundColor: theme.colors.buttonDanger,
      paddingVertical: theme.sizes.spacing.md,
      paddingHorizontal: theme.sizes.spacing.lg,
      borderRadius: theme.sizes.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
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
      padding: theme.sizes.spacing.md,
      fontSize: theme.sizes.fontSize.md,
    },
    
    // Dividers
    divider: {
      height: 1,
      backgroundColor: theme.colors.divider,
      marginVertical: theme.sizes.spacing.md,
    },
    
    // Lists
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.sizes.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
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
      padding: theme.sizes.spacing.lg,
      backgroundColor: 'rgba(231, 76, 60, 0.1)',
      borderRadius: theme.sizes.borderRadius.md,
      marginVertical: theme.sizes.spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.error,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: theme.sizes.fontSize.md,
    },
    
    // Success states
    successContainer: {
      padding: theme.sizes.spacing.lg,
      backgroundColor: 'rgba(46, 204, 113, 0.1)',
      borderRadius: theme.sizes.borderRadius.md,
      marginVertical: theme.sizes.spacing.md,
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
      paddingTop: 50,
      paddingBottom: 15,
      paddingHorizontal: theme.sizes.spacing.lg,
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
      paddingHorizontal: theme.sizes.spacing.sm,
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
      padding: theme.sizes.spacing.xl,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: theme.sizes.fontSize.md,
      textAlign: 'center',
      marginTop: theme.sizes.spacing.md,
    },
  });
};

export default createGlobalStyles;
