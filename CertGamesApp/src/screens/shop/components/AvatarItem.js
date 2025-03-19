// src/screens/shop/components/AvatarItem.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AvatarItem = ({ item, isPurchased, isEquipped }) => {
  return (
    <View style={styles.container}>
      {/* Use a placeholder instead of trying to load images that don't exist */}
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          {item.title?.charAt(0) || '?'}
        </Text>
      </View>
      
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
  placeholderContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
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

export default AvatarItem;
