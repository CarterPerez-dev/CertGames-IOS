// src/screens/shop/components/BoostItem.js
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BoostItem = ({ item, isPurchased, isEquipped }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6543CC', '#FF4C8B']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Ionicons name="flash" size={40} color="#FFFFFF" />
          <Text style={styles.boostValue}>{item.effectValue}x</Text>
          <Text style={styles.boostLabel}>XP Boost</Text>
        </View>
      </LinearGradient>
      
      {isPurchased && (
        <View style={styles.ownershipBadgeContainer}>
          <View style={[
            styles.ownershipBadge,
            isEquipped ? styles.equippedBadge : styles.purchasedBadge
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
    height: 140,
    position: 'relative',
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  boostLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  ownershipBadgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  ownershipBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchasedBadge: {
    backgroundColor: '#2ebb77',
  },
  equippedBadge: {
    backgroundColor: '#6543CC',
  },
});

export default BoostItem;
