// src/components/NotificationOverlay.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import * as SecureStore from 'expo-secure-store'; // Add this import

const NotificationOverlay = () => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const { achievements, level } = useSelector(state => state.user);
  const { all: allAchievements } = useSelector(state => state.achievements);
  
  const prevAchievements = useRef(achievements || []);
  const prevLevel = useRef(level);
  const hasInitializedLevel = useRef(false); // Track if we've already initialized
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;
  
  // Initialize prevLevel from storage on mount
  useEffect(() => {
    const loadLastNotifiedLevel = async () => {
      try {
        const storedLevel = await SecureStore.getItemAsync('lastNotifiedLevel');
        if (storedLevel) {
          prevLevel.current = parseInt(storedLevel, 10);
        }
        hasInitializedLevel.current = true;
      } catch (err) {
        console.error('Error loading last notified level:', err);
        hasInitializedLevel.current = true; // Still mark as initialized even on error
      }
    };
    
    loadLastNotifiedLevel();
  }, []);
  
  // Check for new achievements or level-ups
  useEffect(() => {
    // Only proceed if we've initialized from storage
    if (!hasInitializedLevel.current) return;
    
    // Check for level up - only notify if level increased AND it's higher than the last notified level
    if (level > prevLevel.current && prevLevel.current > 0) {
      addNotification({
        type: 'level-up',
        icon: 'trophy',
        title: 'Level Up!',
        message: `You've reached level ${level}`,
        color: theme.colors.primary
      });
      
      // Store this level as the last notified level
      try {
        SecureStore.setItemAsync('lastNotifiedLevel', level.toString());
      } catch (err) {
        console.error('Error saving last notified level:', err);
      }
    }
    
    // Check for new achievements
    if (achievements && achievements.length > prevAchievements.current.length) {
      const newAchievements = achievements.filter(
        id => !prevAchievements.current.includes(id)
      );
      
      newAchievements.forEach(id => {
        const achievement = allAchievements?.find(a => a.achievementId === id);
        if (achievement) {
          addNotification({
            type: 'achievement',
            icon: 'ribbon',
            title: 'Achievement Unlocked!',
            message: achievement.title,
            color: theme.colors.success
          });
        }
      });
    }
    
    // Update refs
    prevLevel.current = level;
    prevAchievements.current = achievements || [];
  }, [level, achievements, allAchievements, theme]);
  
  // Add a new notification
  const addNotification = (notification) => {
    // Add the notification to the queue
    setNotifications(prev => [...prev, notification]);
    
    // Show the notification with animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
    
    // Remove the notification after a delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(translateY, {
          toValue: -50,
          duration: 500,
          useNativeDriver: true
        })
      ]).start(() => {
        setNotifications(prev => prev.slice(1));
      });
    }, 3000);
  };
  
  // If no notifications, don't render anything
  if (notifications.length === 0) return null;
  
  // Display the first notification in the queue
  const notification = notifications[0];
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: notification.color + 'E6',
          opacity: fadeAnim,
          transform: [{ translateY }]
        }
      ]}
    >
      <Ionicons name={notification.icon} size={24} color="#FFFFFF" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
    fontFamily: 'Orbitron-Bold'
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'ShareTechMono'
  }
});

export default NotificationOverlay;
