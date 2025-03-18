// src/screens/profile/components/AchievementItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAchievementIcon, getAchievementColor } from '../../../constants/achievementConstants';

/**
 * Achievement item component
 * @param {Object} achievement - The achievement object
 * @param {boolean} isUnlocked - Whether the achievement is unlocked
 * @param {Function} onPress - Callback for when the item is pressed
 * @returns {JSX.Element}
 */
const AchievementItem = ({ achievement, isUnlocked, onPress }) => {
  const iconName = getAchievementIcon(achievement.achievementId);
  const iconColor = getAchievementColor(achievement.achievementId);
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isUnlocked ? styles.unlockedContainer : styles.lockedContainer
      ]}
      onPress={() => onPress && onPress(achievement)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
          <Ionicons name={iconName} size={24} color="#FFFFFF" />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {achievement.description}
          </Text>
        </View>
        
        {isUnlocked ? (
          <View style={styles.unlockedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#2ebb77" />
          </View>
        ) : (
          <View style={styles.lockedBadge}>
            <Ionicons name="lock-closed" size={20} color="#AAAAAA" />
          </View>
        )}
      </View>
      
      {isUnlocked && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Unlocked</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
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
  unlockedContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#2ebb77',
  },
  lockedContainer: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  unlockedBadge: {
    alignSelf: 'center',
    marginLeft: 8,
  },
  lockedBadge: {
    alignSelf: 'center',
    marginLeft: 8,
  },
  statusContainer: {
    backgroundColor: 'rgba(46, 187, 119, 0.1)',
    padding: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    color: '#2ebb77',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AchievementItem;
