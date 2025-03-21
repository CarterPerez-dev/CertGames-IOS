// src/components/AchievementItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAchievementIcon, getAchievementColor } from '../constants/achievementConstants';
import { useTheme } from '../context/ThemeContext';

/**
 * Achievement item component
 * @param {Object} achievement - The achievement object
 * @param {boolean} isUnlocked - Whether the achievement is unlocked
 * @param {Function} onPress - Callback for when the item is pressed
 * @param {boolean} compact - Whether to show in compact (list) mode
 * @returns {JSX.Element}
 */
const AchievementItem = ({ achievement, isUnlocked, onPress, compact = false }) => {
  const { theme } = useTheme();
  
  const iconName = getAchievementIcon(achievement.achievementId);
  const iconColor = getAchievementColor(achievement.achievementId);
  
  // If compact mode is enabled, render a different layout
  if (compact) {
    return (
      <TouchableOpacity 
        style={[
          styles.compactContainer,
          { backgroundColor: theme.colors.surface },
          isUnlocked 
            ? { borderLeftColor: theme.colors.success }
            : { borderLeftColor: theme.colors.textMuted }
        ]}
        onPress={() => onPress && onPress(achievement)}
        activeOpacity={0.7}
      >
        <View style={[styles.compactIconContainer, { backgroundColor: iconColor }]}>
          <Ionicons name={iconName} size={18} color="#FFFFFF" />
        </View>
        
        <View style={styles.compactTextContainer}>
          <Text 
            style={[
              styles.compactTitle, 
              { color: isUnlocked ? theme.colors.text : theme.colors.textMuted }
            ]}
            numberOfLines={1}
          >
            {achievement.title}
          </Text>
          <Text 
            style={[
              styles.compactDescription, 
              { color: theme.colors.textSecondary }
            ]}
            numberOfLines={1}
          >
            {achievement.description}
          </Text>
        </View>
        
        <View style={styles.compactStatus}>
          {isUnlocked ? (
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          ) : (
            <Ionicons name="lock-closed" size={18} color={theme.colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    );
  }
  
  // Default grid layout
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface }
      ]}
      onPress={() => onPress && onPress(achievement)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={isUnlocked 
          ? [iconColor, iconColor + '90'] 
          : [theme.colors.surfaceHighlight, theme.colors.surface]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={[styles.iconContainer, { backgroundColor: isUnlocked ? iconColor : 'rgba(255, 255, 255, 0.1)' }]}>
          <Ionicons 
            name={isUnlocked ? iconName : "lock-closed"} 
            size={24} 
            color={isUnlocked ? "#FFFFFF" : theme.colors.textMuted} 
          />
        </View>
        
        <View style={styles.titleContainer}>
          <Text 
            style={[
              styles.title,
              { color: isUnlocked ? "#FFFFFF" : theme.colors.textMuted }
            ]}
            numberOfLines={1}
          >
            {achievement.title}
          </Text>
        </View>
      </LinearGradient>
      
      <View style={styles.content}>
        <Text 
          style={[
            styles.description, 
            { color: isUnlocked ? theme.colors.text : theme.colors.textMuted }
          ]}
          numberOfLines={2}
        >
          {achievement.description}
        </Text>
        
        <View style={[
          styles.statusContainer,
          { 
            backgroundColor: isUnlocked 
              ? theme.colors.success + '20' 
              : theme.colors.textMuted + '20' 
          }
        ]}>
          <Text style={[
            styles.statusText,
            { 
              color: isUnlocked ? theme.colors.success : theme.colors.textMuted 
            }
          ]}>
            {isUnlocked ? 'Unlocked' : 'Locked'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Grid layout styles
  container: {
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 4,
    overflow: 'hidden',
    flex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  gradientHeader: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  statusContainer: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Compact/List layout styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  compactIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  compactDescription: {
    fontSize: 12,
  },
  compactStatus: {
    marginLeft: 4,
  },
});

export default AchievementItem;
