// src/components/NotificationOverlay.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';

const NotificationOverlay = () => {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const { achievements } = useSelector(state => state.user);
  const { all: allAchievements } = useSelector(state => state.achievements);
  
  const prevAchievements = useRef(achievements || []);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;
  
  // Check for new achievements
  useEffect(() => {
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
    prevAchievements.current = achievements || [];
  }, [achievements, allAchievements, theme]);
  
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
