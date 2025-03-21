// src/screens/shop/components/BoostItem.js
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BoostItem = ({ item, isPurchased, isEquipped, theme }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme ? theme.colors.primaryGradient : ['#6543CC', '#FF4C8B']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="flash" 
              size={40} 
              color={theme ? theme.colors.textInverse : "#FFFFFF"} 
              style={styles.icon}
            />
          </View>
          <Text style={[
            styles.boostValue, 
            { color: theme ? theme.colors.textInverse : "#FFFFFF" }
          ]}>
            {item.effectValue}x
          </Text>
          <Text style={[
            styles.boostLabel, 
            { color: theme ? `${theme.colors.textInverse}C0` : "rgba(255, 255, 255, 0.8)" }
          ]}>
            XP Boost
          </Text>
        </View>
      </LinearGradient>
      
      {isPurchased && (
        <View style={styles.badgeContainer}>
          <View style={[
            styles.badge,
            isEquipped ? 
            { backgroundColor: theme ? theme.colors.primary : '#6543CC' } : 
            { backgroundColor: theme ? theme.colors.success : '#2ebb77' }
          ]}>
            <Ionicons 
              name={isEquipped ? "checkmark-circle" : "checkmark"} 
              size={14} 
              color="#FFFFFF" 
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 150,
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    // Add shadow to icon for better visibility
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  boostValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  boostLabel: {
    fontSize: 14,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default BoostItem;
